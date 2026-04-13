from flask import Flask, jsonify, request, abort, send_from_directory, Response
from flask_compress import Compress
import os
import json
from dotenv import load_dotenv
from uuid import uuid4
from io import BytesIO
from PIL import Image
import storage

load_dotenv(override=True)

app = Flask(__name__)
Compress(app)

UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'data', 'photos'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODE = os.getenv('MODE', 'prod').lower()
ADMIN_USERNAMES = [u.strip() for u in os.getenv('ADMIN_USERNAMES', '').split(',') if u.strip()]
CACHE_TIMEOUT = int(os.getenv('CACHE_TIMEOUT', '3600'))

storage.init_db()


def _effective_debug() -> bool:
    """True when running in local/debug mode (MODE=debug or Flask debug flag)."""
    return MODE == 'debug' or app.debug


def is_admin_request(req) -> bool:
    if _effective_debug():
        return True
    username = (
        req.cookies.get('username')
        or req.headers.get('X-Username')
        or req.args.get('u')
    )
    return username in ADMIN_USERNAMES


# ─── Config ───────────────────────────────────────────────────────────────────

@app.route('/config.js')
def config_js():
    # When Flask debug flag is on, report mode as 'debug' so the frontend
    # also grants admin access without a Telegram username check.
    effective_mode = 'debug' if _effective_debug() else MODE
    js = (
        'window.APP_CONFIG = '
        + json.dumps({'mode': effective_mode, 'admins': ADMIN_USERNAMES}, ensure_ascii=False)
    )
    return Response(js, mimetype='application/javascript')


# ─── Expertise Tags ───────────────────────────────────────────────────────────

@app.route('/api/tags', methods=['GET', 'POST'])
def expertise_tags():
    if request.method == 'GET':
        return jsonify(storage.all_expertise_tags())

    if not is_admin_request(request):
        return abort(403)

    body = request.get_json() or {}
    name = (body.get('name') or '').strip()
    if not name:
        return abort(400)
    tag = storage.add_expertise_tag(name)
    return jsonify(tag), 201


@app.route('/api/tags/<tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    if not is_admin_request(request):
        return abort(403)
    ok = storage.delete_expertise_tag(tag_id)
    if not ok:
        return abort(404)
    return jsonify({'ok': True})


# ─── Speakers ─────────────────────────────────────────────────────────────────

@app.route('/api/speakers', methods=['GET', 'POST'])
def speakers():
    if request.method == 'GET':
        return jsonify(storage.all_speakers())

    if not is_admin_request(request):
        return abort(403)

    body = request.get_json() or {}
    name = (body.get('name') or '').strip()
    if not name:
        return abort(400)

    created = storage.add_speaker(body)
    return jsonify(created), 201


@app.route('/api/speakers/<spk_id>', methods=['PUT', 'DELETE'])
def speaker_by_id(spk_id):
    if not is_admin_request(request):
        return abort(403)

    if request.method == 'DELETE':
        ok = storage.delete_speaker(spk_id)
        if not ok:
            return abort(404)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    updated = storage.update_speaker(spk_id, body)
    if updated is None:
        return abort(404)
    return jsonify(updated)


# ─── Activities ───────────────────────────────────────────────────────────────

@app.route('/api/activities', methods=['GET', 'POST'])
def activities():
    if request.method == 'GET':
        return jsonify(storage.all_activities())

    if not is_admin_request(request):
        return abort(403)

    body = request.get_json() or {}
    name = (body.get('name') or '').strip()
    if not name:
        return abort(400)

    created = storage.add_activity(body)
    return jsonify(created), 201


@app.route('/api/activities/<act_id>', methods=['PUT', 'DELETE'])
def activity_by_id(act_id):
    if not is_admin_request(request):
        return abort(403)

    if request.method == 'DELETE':
        ok = storage.delete_activity(act_id)
        if not ok:
            return abort(404)
        return jsonify({'ok': True})

    body = request.get_json() or {}
    updated = storage.update_activity(act_id, body)
    if updated is None:
        return abort(404)
    return jsonify(updated)


# ─── Upload ───────────────────────────────────────────────────────────────────

@app.route('/api/upload', methods=['POST'])
def upload():
    if not is_admin_request(request):
        return abort(403)

    file = request.files.get('file')
    if not file or file.filename == '':
        return abort(400)

    allowed_ext   = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    allowed_mimes = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_ext or file.mimetype not in allowed_mimes:
        return abort(400)

    img = Image.open(file.stream)
    # Resize to max 400×400 preserving aspect ratio
    img.thumbnail((400, 400), Image.LANCZOS)
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA')

    buf = BytesIO()
    img.save(buf, format='PNG', optimize=True, compress_level=9)

    filename = f"{uuid4().hex}.png"
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    with open(os.path.join(UPLOAD_FOLDER, filename), 'wb') as f:
        f.write(buf.getvalue())

    return jsonify({'url': f'/photos/{filename}'})


# ─── Stats ────────────────────────────────────────────────────────────────────

@app.route('/api/stats')
def stats():
    return jsonify(storage.get_stats())


# ─── Static files ─────────────────────────────────────────────────────────────

@app.route('/photos/<path:filename>')
def serve_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, max_age=CACHE_TIMEOUT)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def static_proxy(path):
    # All routes serve index.html for SPA routing
    if path and '.' in path.split('/')[-1]:
        return send_from_directory('frontend', path, max_age=CACHE_TIMEOUT)
    return send_from_directory('frontend', 'index.html', max_age=0)


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    # debug=True when MODE=debug OR when running locally without explicit MODE
    local_debug = MODE == 'debug' or os.getenv('MODE') is None
    app.run(host='0.0.0.0', port=port, debug=local_debug)
