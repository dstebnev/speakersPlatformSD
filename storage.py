import os
import json
import sqlite3
from contextlib import closing

DB_PATH = os.getenv('DB_PATH', '/data/app.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS speakers (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS talks (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )"""
        )
        conn.commit()


def all_speakers():
    with get_conn() as conn:
        rows = conn.execute("SELECT data FROM speakers").fetchall()
    return [json.loads(r[0]) for r in rows]


def get_speaker(spk_id):
    with get_conn() as conn:
        row = conn.execute("SELECT data FROM speakers WHERE id=?", (spk_id,)).fetchone()
    return json.loads(row[0]) if row else None


def add_speaker(obj):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO speakers (id, data) VALUES (?, ?)",
            (obj['id'], json.dumps(obj)),
        )
        conn.commit()


def save_speaker(obj):
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO speakers (id, data) VALUES (?, ?)",
            (obj['id'], json.dumps(obj)),
        )
        conn.commit()


def update_speaker(spk_id, updates):
    speaker = get_speaker(spk_id)
    if speaker is None:
        return None
    speaker.update(updates)
    save_speaker(speaker)
    return speaker


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

