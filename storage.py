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
TALK_COLUMNS = (
    'id',
    'name',
    'description',
    'event',
    'tags',
    'date',
    'speaker_ids',
    'link',
    'status',
    'rate',
)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        _ensure_speakers_table(conn)
        _ensure_talks_table(conn)
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


def _ensure_talks_table(conn):
    info = conn.execute("PRAGMA table_info(talks)").fetchall()
    if not info:
        _create_talks_table(conn)
        return

    column_names = {row['name'] for row in info}
    if 'data' in column_names and len(column_names) == 2:
        _migrate_talks_table(conn)


def _create_talks_table(conn):
    conn.execute(
        """CREATE TABLE IF NOT EXISTS talks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            event TEXT,
            tags TEXT,
            date TEXT,
            speaker_ids TEXT,
            link TEXT,
            status TEXT,
            rate REAL
        )"""
    )


def _migrate_talks_table(conn):
    legacy_rows = conn.execute("SELECT id, data FROM talks").fetchall()
    conn.execute("ALTER TABLE talks RENAME TO talks_legacy")
    _create_talks_table(conn)

    insert_sql = (
        "INSERT INTO talks (id, name, description, event, tags, date, speaker_ids, link, status, rate) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    for row in legacy_rows:
        raw = {}
        try:
            raw = json.loads(row['data'])
        except Exception:
            pass
        talk = _normalize_talk({**raw, 'id': raw.get('id') or row['id']})
        conn.execute(insert_sql, _talk_to_row_values(talk))

    conn.execute("DROP TABLE talks_legacy")


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


def _normalize_speaker_ids(value):
    if value is None:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(v) for v in parsed if str(v)]
        except Exception:
            parts = [part.strip() for part in value.split(',') if part.strip()]
            return [part for part in parts]
        return []
    if isinstance(value, (tuple, set)):
        return [str(v) for v in value if str(v)]
    if isinstance(value, list):
        return [str(v) for v in value if str(v)]
    return []


def _normalize_rate(value):
    if value in (None, ''):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


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


def _normalize_talk(data):
    tags_source = data.get('tags')
    if not tags_source and data.get('direction') is not None:
        tags_source = data.get('direction')
    speaker_ids_source = data.get('speaker_ids')
    if speaker_ids_source is None and data.get('speakerIds') is not None:
        speaker_ids_source = data.get('speakerIds')

    link = (
        data.get('link')
        or data.get('registrationLink')
        or data.get('recordingLink')
        or ''
    )

    return {
        'id': data.get('id'),
        'name': (data.get('name') or data.get('title') or '').strip(),
        'description': data.get('description', '') or '',
        'event': (data.get('event') or data.get('eventName') or '').strip(),
        'tags': _normalize_tags(tags_source),
        'date': data.get('date', '') or '',
        'speaker_ids': _normalize_speaker_ids(speaker_ids_source),
        'link': link,
        'status': data.get('status', '') or '',
        'rate': _normalize_rate(data.get('rate')),
    }


def _talk_to_row_values(talk):
    return (
        talk['id'],
        talk['name'],
        talk['description'],
        talk['event'],
        json.dumps(talk['tags'], ensure_ascii=False),
        talk['date'],
        json.dumps(talk['speaker_ids'], ensure_ascii=False),
        talk['link'],
        talk['status'],
        talk['rate'],
    )


def _row_to_talk(row):
    tags = []
    if row['tags']:
        try:
            parsed = json.loads(row['tags'])
            if isinstance(parsed, list):
                tags = parsed
        except Exception:
            tags = []

    speaker_ids = []
    if row['speaker_ids']:
        try:
            parsed = json.loads(row['speaker_ids'])
            if isinstance(parsed, list):
                speaker_ids = [str(v) for v in parsed]
        except Exception:
            speaker_ids = []

    return {
        'id': row['id'],
        'name': row['name'],
        'description': row['description'] or '',
        'event': row['event'] or '',
        'tags': tags,
        'date': row['date'] or '',
        'speaker_ids': speaker_ids,
        'link': row['link'] or '',
        'status': row['status'] or '',
        'rate': row['rate'],
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
        rows = conn.execute(
            "SELECT id, name, description, event, tags, date, speaker_ids, link, status, rate FROM talks"
        ).fetchall()
    return [_row_to_talk(r) for r in rows]


def get_talk(talk_id):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, name, description, event, tags, date, speaker_ids, link, status, rate "
            "FROM talks WHERE id=?",
            (talk_id,),
        ).fetchone()
    return _row_to_talk(row) if row else None


def add_talk(obj):
    talk = _normalize_talk(obj)
    if not talk.get('id'):
        raise ValueError('Talk id is required')
    if not talk['name']:
        raise ValueError('Talk name is required')
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO talks (id, name, description, event, tags, date, speaker_ids, link, status, rate) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            _talk_to_row_values(talk),
        )
        conn.commit()


def save_talk(obj):
    talk = _normalize_talk(obj)
    if not talk.get('id'):
        raise ValueError('Talk id is required')
    if not talk['name']:
        raise ValueError('Talk name is required')
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO talks (id, name, description, event, tags, date, speaker_ids, link, status, rate) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            _talk_to_row_values(talk),
        )
        conn.commit()


def update_talk(talk_id, updates):
    talk = get_talk(talk_id)
    if talk is None:
        return None
    merged = {**talk, **(updates or {}), 'id': talk_id}
    save_talk(merged)
    return get_talk(talk_id)


def delete_talk(talk_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM talks WHERE id=?", (talk_id,))
        conn.commit()
        return cur.rowcount > 0
