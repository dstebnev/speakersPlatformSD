import json
import os
import sqlite3

DB_PATH = os.getenv('DB_PATH', '/data/app.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

DEFAULT_PHOTO_URL = '/default_icon.svg'
SPEAKER_COLUMNS = (
    'id',
    'name',
    'personnel_id',
    'structure',
    'role',
    'description',
    'tags',
    'photoUrl',
)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        _ensure_speakers_table(conn)
        conn.execute(
            """CREATE TABLE IF NOT EXISTS talks (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )"""
        )
        conn.commit()


def _ensure_speakers_table(conn):
    info = conn.execute("PRAGMA table_info(speakers)").fetchall()
    if not info:
        _create_speakers_table(conn)
        return

    column_names = {row['name'] for row in info}
    if 'data' in column_names and len(column_names) == 2:
        _migrate_speakers_table(conn)


def _create_speakers_table(conn):
    conn.execute(
        """CREATE TABLE IF NOT EXISTS speakers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            personnel_id TEXT,
            structure TEXT,
            role TEXT,
            description TEXT,
            tags TEXT,
            photoUrl TEXT
        )"""
    )


def _migrate_speakers_table(conn):
    legacy_rows = conn.execute("SELECT id, data FROM speakers").fetchall()
    conn.execute("ALTER TABLE speakers RENAME TO speakers_legacy")
    _create_speakers_table(conn)

    insert_sql = (
        "INSERT INTO speakers (id, name, personnel_id, structure, role, "
        "description, tags, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    )
    for row in legacy_rows:
        raw = {}
        try:
            raw = json.loads(row['data'])
        except Exception:
            pass
        speaker = _normalize_speaker({**raw, 'id': raw.get('id') or row['id']})
        conn.execute(insert_sql, _speaker_to_row_values(speaker))

    conn.execute("DROP TABLE speakers_legacy")


def _normalize_tags(tags):
    if tags is None:
        return []
    if isinstance(tags, str):
        try:
            parsed = json.loads(tags)
            if isinstance(parsed, list):
                return [str(t) for t in parsed]
        except Exception:
            if tags.strip():
                return [tags.strip()]
            return []
        return []
    if isinstance(tags, (tuple, set)):
        return [str(t) for t in tags]
    if isinstance(tags, list):
        return [str(t) for t in tags]
    return []


def _normalize_speaker(data):
    tags = _normalize_tags(data.get('tags'))
    return {
        'id': data.get('id'),
        'name': data.get('name', '').strip(),
        'personnel_id': str(data.get('personnel_id', '') or data.get('personnelId', '') or ''),
        'structure': str(data.get('structure', '') or ''),
        'role': str(data.get('role', '') or ''),
        'description': data.get('description', '') or '',
        'tags': tags,
        'photoUrl': data.get('photoUrl') or DEFAULT_PHOTO_URL,
    }


def _speaker_to_row_values(speaker):
    return (
        speaker['id'],
        speaker['name'],
        speaker['personnel_id'],
        speaker['structure'],
        speaker['role'],
        speaker['description'],
        json.dumps(speaker['tags'], ensure_ascii=False),
        speaker['photoUrl'],
    )


def _row_to_speaker(row):
    tags_raw = row['tags']
    tags = []
    if tags_raw:
        try:
            parsed = json.loads(tags_raw)
            if isinstance(parsed, list):
                tags = parsed
        except Exception:
            tags = []
    return {
        'id': row['id'],
        'name': row['name'],
        'personnel_id': row['personnel_id'] or '',
        'structure': row['structure'] or '',
        'role': row['role'] or '',
        'description': row['description'] or '',
        'tags': tags,
        'photoUrl': row['photoUrl'] or DEFAULT_PHOTO_URL,
    }


def all_speakers():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, personnel_id, structure, role, description, tags, photoUrl FROM speakers"
        ).fetchall()
    return [_row_to_speaker(r) for r in rows]


def get_speaker(spk_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, name, personnel_id, structure, role, description, tags, photoUrl "
            "FROM speakers WHERE id=?",
            (spk_id,),
        ).fetchone()
    return _row_to_speaker(row) if row else None


def add_speaker(obj):
    speaker = _normalize_speaker(obj)
    if not speaker.get('id'):
        raise ValueError('Speaker id is required')
    if not speaker['name']:
        raise ValueError('Speaker name is required')
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO speakers (id, name, personnel_id, structure, role, description, tags, photoUrl) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            _speaker_to_row_values(speaker),
        )
        conn.commit()


def save_speaker(obj):
    speaker = _normalize_speaker(obj)
    if not speaker.get('id'):
        raise ValueError('Speaker id is required')
    if not speaker['name']:
        raise ValueError('Speaker name is required')
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO speakers (id, name, personnel_id, structure, role, description, tags, photoUrl) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            _speaker_to_row_values(speaker),
        )
        conn.commit()


def update_speaker(spk_id, updates):
    speaker = get_speaker(spk_id)
    if speaker is None:
        return None
    speaker.update(updates or {})
    save_speaker(speaker)
    return get_speaker(spk_id)


def delete_speaker(spk_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM speakers WHERE id=?", (spk_id,))
        conn.commit()
        return cur.rowcount > 0


def all_talks():
    with get_conn() as conn:
        rows = conn.execute("SELECT data FROM talks").fetchall()
    return [json.loads(r[0]) for r in rows]


def get_talk(talk_id):
    with get_conn() as conn:
        row = conn.execute("SELECT data FROM talks WHERE id=?", (talk_id,)).fetchone()
    return json.loads(row[0]) if row else None


def add_talk(obj):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO talks (id, data) VALUES (?, ?)",
            (obj['id'], json.dumps(obj)),
        )
        conn.commit()


def save_talk(obj):
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO talks (id, data) VALUES (?, ?)",
            (obj['id'], json.dumps(obj)),
        )
        conn.commit()


def update_talk(talk_id, updates):
    talk = get_talk(talk_id)
    if talk is None:
        return None
    talk.update(updates)
    save_talk(talk)
    return talk


def delete_talk(talk_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM talks WHERE id=?", (talk_id,))
        conn.commit()
        return cur.rowcount > 0
