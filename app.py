from flask import Flask, jsonify, request, abort, send_from_directory
import os
import json
from uuid import uuid4
import datetime
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Where uploaded photos will be stored
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/data/photos')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DB_PATH = os.getenv('DB_PATH', '/data/db.json')


def read_db():
    if not os.path.exists(DB_PATH):
        return {'speakers': [], 'talks': []}
    try:
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {'speakers': [], 'talks': []}


def write_db(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def calc_status(date_str: str) -> str:
    try:
        d = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return 'upcoming'
    return 'past' if d < datetime.date.today() else 'upcoming'


@app.route('/api/speakers', methods=['GET', 'POST'])
def speakers():
    data = read_db()
    if request.method == 'GET':
        return jsonify(data['speakers'])

    body = request.get_json() or {}
    body.setdefault('photoUrl', '/default_icon.png')
    new_speaker = {'id': str(uuid4()), **body}
    data['speakers'].append(new_speaker)
    write_db(data)
    return jsonify(new_speaker)


@app.route('/api/speakers/<id>', methods=['PUT', 'DELETE'])
def speaker_by_id(id):
    data = read_db()
    speakers = data['speakers']
    idx = next((i for i, s in enumerate(speakers) if s['id'] == id), None)
    if idx is None:
        return abort(404)

    if request.method == 'DELETE':
        speakers.pop(idx)
        write_db(data)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    if 'photoUrl' not in body:
        body['photoUrl'] = '/default_icon.png'
    speakers[idx].update(body)
    write_db(data)
    return jsonify(speakers[idx])


@app.route('/api/talks', methods=['GET', 'POST'])
def talks():
    data = read_db()
    if request.method == 'GET':
        talks = [ { **t, 'status': calc_status(t.get('date', '')) } for t in data['talks'] ]
        return jsonify(talks)

    body = request.get_json() or {}
    new_talk = {'id': str(uuid4()), **body}
    new_talk['status'] = calc_status(new_talk.get('date', ''))
    data['talks'].append(new_talk)
    write_db(data)
    return jsonify(new_talk)


@app.route('/api/talks/<id>', methods=['PUT', 'DELETE'])
def talk_by_id(id):
    data = read_db()
    talks = data['talks']
    idx = next((i for i, t in enumerate(talks) if t['id'] == id), None)
    if idx is None:
        return abort(404)

    if request.method == 'DELETE':
        talks.pop(idx)
        write_db(data)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    talks[idx].update(body)
    talks[idx]['status'] = calc_status(talks[idx].get('date', ''))
    write_db(data)
    return jsonify(talks[idx])


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

    # Convert to JPEG and compress under 2MB
    img = Image.open(file.stream).convert('RGB')
    quality = 85
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=quality, optimize=True)
    while buf.tell() > 2 * 1024 * 1024 and quality > 20:
        quality -= 5
        buf.seek(0)
        buf.truncate(0)
        img.save(buf, format='JPEG', quality=quality, optimize=True)

    filename = f"{uuid4().hex}.jpg"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    with open(os.path.join(UPLOAD_FOLDER, filename), 'wb') as f:
        f.write(buf.getvalue())

    return jsonify({'url': f'/photos/{filename}'})


@app.route('/photos/<path:filename>')
def serve_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')


@app.route('/admin')
def admin_page():
    return send_from_directory('frontend', 'admin.html')


@app.route('/profile')
def profile_page():
    return send_from_directory('frontend', 'profile.html')


@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('frontend', path)


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
