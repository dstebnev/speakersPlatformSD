from flask import Flask, jsonify, request, abort, send_from_directory, Response
from flask_compress import Compress
import os
import json
from dotenv import load_dotenv
from uuid import uuid4
import datetime
from io import BytesIO
import shutil
from PIL import Image
import storage
from pathlib import Path
import import_speakers_csv
import import_performs_csv

load_dotenv(override=True)

app = Flask(__name__)
Compress(app)

# Where uploaded photos will be stored
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/data/photos')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODE = os.getenv('MODE', 'prod').lower()
ADMIN_USERNAMES = [u.strip() for u in os.getenv('ADMIN_USERNAMES', '').split(',') if u.strip()]
CACHE_TIMEOUT = int(os.getenv('CACHE_TIMEOUT', '3600'))

storage.init_db()


def calc_status(date_str: str) -> str:
    try:
        d = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return 'upcoming'
    return 'past' if d < datetime.date.today() else 'upcoming'


@app.route('/api/speakers', methods=['GET', 'POST'])
def speakers():
    if request.method == 'GET':
        return jsonify(storage.all_speakers())

    body = request.get_json() or {}
    defaults = {
        'photoUrl': '/default_icon.svg',
        'description': '',
        'tags': [],
        'personnel_id': '',
        'structure': '',
        'role': '',
    }
    for key, value in defaults.items():
        body.setdefault(key, value)
    new_speaker = {**defaults, **body, 'id': str(uuid4())}
    storage.add_speaker(new_speaker)
    created = storage.get_speaker(new_speaker['id'])
    return jsonify(created)


@app.route('/api/speakers/<id>', methods=['PUT', 'DELETE'])
def speaker_by_id(id):
    if request.method == 'DELETE':
        ok = storage.delete_speaker(id)
        if not ok:
            return abort(404)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    if 'photoUrl' not in body:
        body['photoUrl'] = '/default_icon.svg'
    if 'tags' in body and body['tags'] is None:
        body['tags'] = []
    for key in ('personnel_id', 'structure', 'role', 'description'):
        if key in body and body[key] is None:
            body[key] = ''
    updated = storage.update_speaker(id, body)
    if updated is None:
        return abort(404)
    return jsonify(updated)


@app.route('/api/talks', methods=['GET', 'POST'])
def talks():
    if request.method == 'GET':
        talks = []
        for t in storage.all_talks():
            item = {**t}
            status = calc_status(item.get('date', ''))
            if status != item.get('status'):
                item['status'] = status
                try:
                    storage.save_talk(item)
                except Exception:
                    pass
            else:
                item['status'] = status
            talks.append(item)
        return jsonify(talks)

    body = request.get_json() or {}
    speaker_ids = body.get('speaker_ids')
    if speaker_ids is None and 'speakerIds' in body:
        speaker_ids = body.get('speakerIds')
    if not isinstance(speaker_ids, list):
        return abort(400)
    defaults = {
        'description': '',
        'event': '',
        'tags': [],
        'date': '',
        'link': '',
        'rate': None,
        'status': '',
    }
    talk_data = {**defaults, **body}
    talk_data['speaker_ids'] = speaker_ids
    talk_data['name'] = (talk_data.get('name') or '').strip()
    if not talk_data['name']:
        return abort(400)
    talk_data['status'] = calc_status(talk_data.get('date', ''))
    talk_data['id'] = str(uuid4())
    storage.add_talk(talk_data)
    created = storage.get_talk(talk_data['id'])
    return jsonify(created)


@app.route('/api/talks/<id>', methods=['PUT', 'DELETE'])
def talk_by_id(id):
    if request.method == 'DELETE':
        ok = storage.delete_talk(id)
        if not ok:
            return abort(404)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    speaker_ids = None
    if 'speaker_ids' in body:
        speaker_ids = body['speaker_ids']
    elif 'speakerIds' in body:
        speaker_ids = body['speakerIds']
    if speaker_ids is not None and not isinstance(speaker_ids, list):
        return abort(400)
    updates = dict(body)
    if speaker_ids is not None:
        updates['speaker_ids'] = speaker_ids
    if updates.get('tags') is None and 'tags' in updates:
        updates['tags'] = []
    if 'rate' in updates and updates['rate'] == '':
        updates['rate'] = None
    updated = storage.update_talk(id, updates)
    if updated is None:
        return abort(404)
    updated['status'] = calc_status(updated.get('date', ''))
    storage.save_talk(updated)
    return jsonify(updated)


@app.route('/api/upload', methods=['POST'])
def upload():
    file = request.files.get('file')
    if not file or file.filename == '':
        return abort(400)

    # Validate extension and MIME type
    allowed_ext = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    allowed_mimes = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    }

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_ext or file.mimetype not in allowed_mimes:
        return abort(400)

    # Convert to PNG and compress under 2MB
    img = Image.open(file.stream)
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA')

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True, compress_level=9)
    colors = 256
    while buf.tell() > 2 * 1024 * 1024 and colors > 32:
        colors //= 2
        quantized = img.convert('P', palette=Image.ADAPTIVE, colors=colors)
        buf.seek(0)
        buf.truncate(0)
        quantized.save(buf, format='PNG', optimize=True, compress_level=9)

    filename = f"{uuid4().hex}.png"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    with open(os.path.join(UPLOAD_FOLDER, filename), 'wb') as f:
        f.write(buf.getvalue())

    return jsonify({'url': f'/photos/{filename}'})


@app.route('/photos/<path:filename>')
def serve_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, max_age=CACHE_TIMEOUT)


@app.route('/config.js')
def config_js():
    admins = ADMIN_USERNAMES
    js = (
        "window.APP_CONFIG = "
        + json.dumps({"mode": MODE, "admins": admins}, ensure_ascii=False)
    )
    return Response(js, mimetype='application/javascript')


def is_admin_request(req: request) -> bool:
    """Check if the current request belongs to an admin user."""
    if MODE == 'debug':
        return True
    username = (
        req.cookies.get('username')
        or req.headers.get('X-Username')
        or req.args.get('u')
    )
    return username in ADMIN_USERNAMES


@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    if not is_admin_request(request):
        return abort(403)
    for root, dirs, _ in os.walk('.'):
        if '__pycache__' in dirs:
            shutil.rmtree(os.path.join(root, '__pycache__'), ignore_errors=True)
    return jsonify({'ok': True})


@app.route('/api/speakers/import', methods=['POST'])
def import_speakers():
    if not is_admin_request(request):
        return abort(403)
    csv_path = Path(os.getenv('SPEAKERS_CSV', 'speakers_new_base.csv'))
    try:
        sp_updated, sp_created = import_speakers_csv.import_csv(csv_path)
    except FileNotFoundError:
        return jsonify({'ok': False, 'error': f'CSV file not found: {csv_path}'}), 404
    except Exception as exc:
        return jsonify({'ok': False, 'error': str(exc)}), 500
    performs_path = Path(os.getenv('PERFORMS_CSV', 'performs_new_base.csv'))
    try:
        talk_updated, talk_created, missing = import_performs_csv.import_performs(performs_path)
    except FileNotFoundError:
        return jsonify({'ok': False, 'error': f'CSV file not found: {performs_path}'}), 404
    except Exception as exc:
        return jsonify({'ok': False, 'error': str(exc)}), 500
    return jsonify({
        'ok': True,
        'speakers': {'updated': sp_updated, 'created': sp_created},
        'talks': {
            'updated': talk_updated,
            'created': talk_created,
            'missing_speakers': sorted(missing),
        },
    })

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html', max_age=CACHE_TIMEOUT)


@app.route('/admin')
def admin_page():
    if not is_admin_request(request):
        return abort(403)
    return send_from_directory('frontend', 'admin.html', max_age=CACHE_TIMEOUT)


@app.route('/profile')
def profile_page():
    return send_from_directory('frontend', 'profile.html', max_age=CACHE_TIMEOUT)


@app.route('/stats')
def stats_page():
    if not is_admin_request(request):
        return abort(403)
    return send_from_directory('frontend', 'stats.html', max_age=CACHE_TIMEOUT)


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('frontend', path, max_age=CACHE_TIMEOUT)


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
