import os
import json
import storage


def main():
    json_path = os.getenv('JSON_DB', '/data/db.json')
    if not os.path.exists(json_path):
        print('No db.json found, nothing to migrate.')
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    storage.init_db()

    for s in data.get('speakers', []):
        try:
            storage.add_speaker(s)
        except Exception:
            pass

    for t in data.get('talks', []):
        try:
            storage.add_talk(t)
        except Exception:
            pass

    print('Migration complete.')


if __name__ == '__main__':
    main()
