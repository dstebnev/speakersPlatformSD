from flask import Flask, jsonify, request, abort
import os
import json
from uuid import uuid4

app = Flask(__name__)

DB_PATH = os.getenv('DB_PATH', os.path.join(os.path.dirname(__file__), '../db.json'))


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
        return jsonify(data['talks'])

    body = request.get_json() or {}
    new_talk = {'id': str(uuid4()), **body}
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
    write_db(data)
    return jsonify(talks[idx])

@app.route("/")
def index():
    return "API is running!"


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port)
