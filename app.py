from flask import Flask, jsonify, request, abort, send_from_directory, Response
import os
import json
from dotenv import load_dotenv
from uuid import uuid4
import datetime
from io import BytesIO
from PIL import Image
import storage

load_dotenv(override=True)

app = Flask(__name__)

# Where uploaded photos will be stored
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/data/photos')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODE = os.getenv('MODE', 'prod').lower()
ADMIN_USERNAMES = [u.strip() for u in os.getenv('ADMIN_USERNAMES', '').split(',') if u.strip()]

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
    body.setdefault('photoUrl', '/default_icon.svg')
    new_speaker = {'id': str(uuid4()), **body}
    storage.add_speaker(new_speaker)
    return jsonify(new_speaker)


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
            item['status'] = calc_status(item.get('date', ''))
            talks.append(item)
        return jsonify(talks)

    body = request.get_json() or {}
    if not isinstance(body.get('speakerIds'), list):
        return abort(400)
    new_talk = {'id': str(uuid4()), **body}
    new_talk['status'] = calc_status(new_talk.get('date', ''))
    storage.add_talk(new_talk)
    return jsonify(new_talk)


@app.route('/api/talks/<id>', methods=['PUT', 'DELETE'])
def talk_by_id(id):
    if request.method == 'DELETE':
        ok = storage.delete_talk(id)
        if not ok:
            return abort(404)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    if 'speakerIds' in body and not isinstance(body['speakerIds'], list):
        return abort(400)
    updated = storage.update_talk(id, body)
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
    return send_from_directory(UPLOAD_FOLDER, filename)


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

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


@app.route('/admin')
def admin_page():
    if not is_admin_request(request):
        return abort(403)
    return send_from_directory('frontend', 'admin.html')


@app.route('/profile')
def profile_page():
    return send_from_directory('frontend', 'profile.html')


@app.route('/stats')
def stats_page():
    if not is_admin_request(request):
        return abort(403)
    return send_from_directory('frontend', 'stats.html')


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('frontend', path)


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
