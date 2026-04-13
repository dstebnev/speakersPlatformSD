import json
import os
import sqlite3
import datetime
from uuid import uuid4

DB_PATH = os.getenv('DB_PATH', os.path.join(os.path.dirname(__file__), 'data', 'app.db'))
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

VALID_FORMATS = ('speech', 'article', 'digital')


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        _ensure_speakers_table(conn)
        _ensure_activities_table(conn)
        _ensure_expertise_tags_table(conn)
        conn.commit()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _normalize_json_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v) for v in value if v]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(v) for v in parsed if v]
        except Exception:
            pass
        return [value.strip()] if value.strip() else []
    return []


def _ensure_tag_exists(conn, name):
    if not name or not name.strip():
        return
    name = name.strip()
    conn.execute(
        "INSERT OR IGNORE INTO expertise_tags (id, name) VALUES (?, ?)",
        (str(uuid4()), name),
    )


# ─── Expertise Tags ───────────────────────────────────────────────────────────

def _ensure_expertise_tags_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS expertise_tags (
            id   TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )
    """)


def all_expertise_tags():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name FROM expertise_tags ORDER BY name"
        ).fetchall()
    return [{'id': r['id'], 'name': r['name']} for r in rows]


def add_expertise_tag(name):
    name = (name or '').strip()
    if not name:
        return None
    with get_conn() as conn:
        tag_id = str(uuid4())
        try:
            conn.execute(
                "INSERT INTO expertise_tags (id, name) VALUES (?, ?)", (tag_id, name)
            )
            conn.commit()
            return {'id': tag_id, 'name': name}
        except sqlite3.IntegrityError:
            row = conn.execute(
                "SELECT id, name FROM expertise_tags WHERE name=?", (name,)
            ).fetchone()
            return {'id': row['id'], 'name': row['name']} if row else None


def delete_expertise_tag(tag_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM expertise_tags WHERE id=?", (tag_id,))
        conn.commit()
        return cur.rowcount > 0


# ─── Speakers ─────────────────────────────────────────────────────────────────

def _ensure_speakers_table(conn):
    info = conn.execute("PRAGMA table_info(speakers)").fetchall()
    if not info:
        _create_speakers_table(conn)
        return

    column_names = {row['name'] for row in info}
    # Old schema: has personnel_id or data columns → migrate
    if 'data' in column_names or 'personnel_id' in column_names:
        _migrate_speakers_from_old(conn, column_names)
        return

    # Partial new schema: add missing columns
    if 'email' not in column_names:
        conn.execute("ALTER TABLE speakers ADD COLUMN email TEXT DEFAULT ''")
    if 'telegram' not in column_names:
        conn.execute("ALTER TABLE speakers ADD COLUMN telegram TEXT DEFAULT ''")
    if 'expertise' not in column_names:
        conn.execute("ALTER TABLE speakers ADD COLUMN expertise TEXT DEFAULT '[]'")
    if 'photoUrl' not in column_names:
        conn.execute("ALTER TABLE speakers ADD COLUMN photoUrl TEXT DEFAULT ''")


def _create_speakers_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS speakers (
            id        TEXT PRIMARY KEY,
            name      TEXT NOT NULL,
            email     TEXT DEFAULT '',
            telegram  TEXT DEFAULT '',
            expertise TEXT DEFAULT '[]',
            role      TEXT DEFAULT '',
            photoUrl  TEXT DEFAULT ''
        )
    """)


def _migrate_speakers_from_old(conn, column_names):
    if 'data' in column_names:
        rows = conn.execute("SELECT id, data FROM speakers").fetchall()
        old_data = []
        for row in rows:
            try:
                d = json.loads(row['data'])
            except Exception:
                d = {}
            d.setdefault('id', row['id'])
            old_data.append(d)
    else:
        cols = [c for c in ('id', 'name', 'role', 'tags', 'description') if c in column_names]
        rows = conn.execute(f"SELECT {', '.join(cols)} FROM speakers").fetchall()
        old_data = [dict(r) for r in rows]

    conn.execute("ALTER TABLE speakers RENAME TO speakers_old")
    _create_speakers_table(conn)

    for d in old_data:
        tags_raw = d.get('tags') or d.get('expertise') or []
        expertise = _normalize_json_list(tags_raw)
        conn.execute(
            "INSERT OR IGNORE INTO speakers (id, name, email, telegram, expertise, role) VALUES (?, ?, ?, ?, ?, ?)",
            (
                d.get('id', str(uuid4())),
                d.get('name', '').strip(),
                '',
                '',
                json.dumps(expertise, ensure_ascii=False),
                d.get('role', '') or '',
            ),
        )

    conn.execute("DROP TABLE speakers_old")


def _row_to_speaker(row):
    keys = row.keys()
    return {
        'id': row['id'],
        'name': row['name'],
        'email': row['email'] or '',
        'telegram': row['telegram'] or '',
        'expertise': _normalize_json_list(row['expertise']),
        'role': row['role'] or '',
        'photoUrl': (row['photoUrl'] if 'photoUrl' in keys else '') or '',
    }


def all_speakers():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM speakers ORDER BY name").fetchall()
    return [_row_to_speaker(r) for r in rows]


def get_speaker(spk_id):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM speakers WHERE id=?", (spk_id,)).fetchone()
    return _row_to_speaker(row) if row else None


def _upsert_speaker(conn, spk):
    conn.execute(
        """INSERT OR REPLACE INTO speakers (id, name, email, telegram, expertise, role, photoUrl)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            spk['id'],
            spk['name'],
            spk.get('email', ''),
            spk.get('telegram', ''),
            json.dumps(spk.get('expertise', []), ensure_ascii=False),
            spk.get('role', ''),
            spk.get('photoUrl', ''),
        ),
    )
    for tag in spk.get('expertise', []):
        _ensure_tag_exists(conn, tag)


def add_speaker(obj):
    spk = {
        'id': obj.get('id') or str(uuid4()),
        'name': (obj.get('name') or '').strip(),
        'email': (obj.get('email') or '').strip(),
        'telegram': (obj.get('telegram') or '').strip(),
        'expertise': _normalize_json_list(obj.get('expertise', [])),
        'role': (obj.get('role') or '').strip(),
        'photoUrl': (obj.get('photoUrl') or '').strip(),
    }
    with get_conn() as conn:
        _upsert_speaker(conn, spk)
        conn.commit()
    return get_speaker(spk['id'])


def update_speaker(spk_id, updates):
    spk = get_speaker(spk_id)
    if spk is None:
        return None
    spk.update(updates)
    spk['id'] = spk_id
    if 'expertise' in updates:
        spk['expertise'] = _normalize_json_list(updates['expertise'])
    with get_conn() as conn:
        _upsert_speaker(conn, spk)
        conn.commit()
    return get_speaker(spk_id)


def delete_speaker(spk_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM speakers WHERE id=?", (spk_id,))
        conn.commit()
        return cur.rowcount > 0


# ─── Activities ───────────────────────────────────────────────────────────────

def _ensure_activities_table(conn):
    info = conn.execute("PRAGMA table_info(activities)").fetchall()
    if not info:
        _create_activities_table(conn)
        # Migrate from old talks table if present
        talks_info = conn.execute("PRAGMA table_info(talks)").fetchall()
        if talks_info:
            _migrate_from_talks(conn)
        return

    column_names = {row['name'] for row in info}
    if 'expertise_tags' not in column_names:
        conn.execute("ALTER TABLE activities ADD COLUMN expertise_tags TEXT DEFAULT '[]'")
    if 'format' not in column_names:
        conn.execute("ALTER TABLE activities ADD COLUMN format TEXT DEFAULT 'speech'")


def _create_activities_table(conn):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id             TEXT PRIMARY KEY,
            name           TEXT NOT NULL,
            format         TEXT DEFAULT 'speech',
            description    TEXT DEFAULT '',
            speaker_ids    TEXT DEFAULT '[]',
            date           TEXT DEFAULT '',
            event          TEXT DEFAULT '',
            expertise_tags TEXT DEFAULT '[]'
        )
    """)


def _migrate_from_talks(conn):
    try:
        rows = conn.execute("SELECT * FROM talks").fetchall()
    except Exception:
        return

    for row in rows:
        keys = row.keys()
        tags = _normalize_json_list(row['tags'] if 'tags' in keys else '[]')
        speaker_ids = _normalize_json_list(row['speaker_ids'] if 'speaker_ids' in keys else '[]')
        conn.execute(
            """INSERT OR IGNORE INTO activities
               (id, name, format, description, speaker_ids, date, event, expertise_tags)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                row['id'],
                row['name'] or '',
                'speech',
                row['description'] if 'description' in keys else '',
                json.dumps(speaker_ids, ensure_ascii=False),
                row['date'] if 'date' in keys else '',
                row['event'] if 'event' in keys else '',
                json.dumps(tags, ensure_ascii=False),
            ),
        )
        for tag in tags:
            _ensure_tag_exists(conn, tag)


def _row_to_activity(row):
    return {
        'id': row['id'],
        'name': row['name'],
        'format': row['format'] or 'speech',
        'description': row['description'] or '',
        'speaker_ids': _normalize_json_list(row['speaker_ids']),
        'date': row['date'] or '',
        'event': row['event'] or '',
        'expertise_tags': _normalize_json_list(row['expertise_tags']),
    }


def all_activities():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM activities ORDER BY date DESC, name"
        ).fetchall()
    return [_row_to_activity(r) for r in rows]


def get_activity(act_id):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM activities WHERE id=?", (act_id,)).fetchone()
    return _row_to_activity(row) if row else None


def _upsert_activity(conn, act):
    conn.execute(
        """INSERT OR REPLACE INTO activities
           (id, name, format, description, speaker_ids, date, event, expertise_tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            act['id'],
            act['name'],
            act.get('format', 'speech'),
            act.get('description', ''),
            json.dumps(act.get('speaker_ids', []), ensure_ascii=False),
            act.get('date', ''),
            act.get('event', ''),
            json.dumps(act.get('expertise_tags', []), ensure_ascii=False),
        ),
    )
    for tag in act.get('expertise_tags', []):
        _ensure_tag_exists(conn, tag)


def add_activity(obj):
    fmt = obj.get('format', 'speech')
    if fmt not in VALID_FORMATS:
        fmt = 'speech'
    act = {
        'id': obj.get('id') or str(uuid4()),
        'name': (obj.get('name') or '').strip(),
        'format': fmt,
        'description': obj.get('description', ''),
        'speaker_ids': _normalize_json_list(obj.get('speaker_ids', [])),
        'date': obj.get('date', ''),
        'event': (obj.get('event') or '').strip(),
        'expertise_tags': _normalize_json_list(obj.get('expertise_tags', [])),
    }
    with get_conn() as conn:
        _upsert_activity(conn, act)
        conn.commit()
    return get_activity(act['id'])


def update_activity(act_id, updates):
    act = get_activity(act_id)
    if act is None:
        return None
    act.update(updates)
    act['id'] = act_id
    if 'format' in updates and updates['format'] not in VALID_FORMATS:
        act['format'] = 'speech'
    if 'speaker_ids' in updates:
        act['speaker_ids'] = _normalize_json_list(updates['speaker_ids'])
    if 'expertise_tags' in updates:
        act['expertise_tags'] = _normalize_json_list(updates['expertise_tags'])
    with get_conn() as conn:
        _upsert_activity(conn, act)
        conn.commit()
    return get_activity(act_id)


def delete_activity(act_id):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM activities WHERE id=?", (act_id,))
        conn.commit()
        return cur.rowcount > 0


# ─── Stats ────────────────────────────────────────────────────────────────────

def get_stats():
    with get_conn() as conn:
        activities = [_row_to_activity(r) for r in conn.execute("SELECT * FROM activities").fetchall()]
        speakers = [_row_to_speaker(r) for r in conn.execute("SELECT * FROM speakers").fetchall()]

    speaker_map = {s['id']: s for s in speakers}

    # Format breakdown
    format_counts = {}
    for a in activities:
        fmt = a.get('format', 'speech')
        format_counts[fmt] = format_counts.get(fmt, 0) + 1

    # Speaker activity counts
    speaker_act_counts = {}
    for a in activities:
        for spk_id in a.get('speaker_ids', []):
            speaker_act_counts[spk_id] = speaker_act_counts.get(spk_id, 0) + 1

    top_speakers = []
    for spk_id, count in sorted(speaker_act_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        spk = speaker_map.get(spk_id)
        if spk:
            top_speakers.append({'speaker': spk, 'count': count})

    # Expertise tag counts
    tag_counts = {}
    for a in activities:
        for tag in a.get('expertise_tags', []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    # Monthly trend
    monthly = {}
    for a in activities:
        date_str = a.get('date', '')
        if date_str:
            try:
                d = datetime.datetime.strptime(date_str, '%Y-%m-%d')
                key = d.strftime('%Y-%m')
                monthly[key] = monthly.get(key, 0) + 1
            except Exception:
                pass

    return {
        'total_activities': len(activities),
        'total_speakers': len(speakers),
        'format_counts': format_counts,
        'top_speakers': top_speakers,
        'tag_counts': tag_counts,
        'monthly': monthly,
    }
