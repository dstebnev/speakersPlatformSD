import argparse
import csv
from pathlib import Path
from typing import Dict, Tuple
from uuid import uuid4

import storage


def _normalise_name(name: str) -> str:
    return (name or '').strip().lower()


def load_existing_speakers() -> Dict[str, dict]:
    """Return a mapping of normalised speaker name to speaker object."""
    storage.init_db()
    speakers = storage.all_speakers()
    return {_normalise_name(s['name']): s for s in speakers if s.get('name')}


def import_csv(csv_path: Path) -> Tuple[int, int]:
    if not csv_path.exists():
        raise FileNotFoundError(f'CSV file not found: {csv_path}')

    existing = load_existing_speakers()
    created_count = 0
    updated_count = 0

    with csv_path.open('r', encoding='utf-8-sig', newline='') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            name = (row.get('name') or '').strip()
            if not name:
                continue

            payload = {
                'name': name,
                'personnel_id': (row.get('personnel_id') or '').strip(),
                'structure': (row.get('structure') or '').strip(),
                'role': (row.get('role') or '').strip(),
            }

            key = _normalise_name(name)
            current = existing.get(key)

            if current:
                updated = {**current, **payload}
                storage.save_speaker(updated)
                existing[key] = storage.get_speaker(updated['id'])
                updated_count += 1
            else:
                new_speaker = {
                    'id': str(uuid4()),
                    **payload,
                    'description': '',
                    'tags': [],
                    'photoUrl': storage.DEFAULT_PHOTO_URL,
                }
                storage.add_speaker(new_speaker)
                existing[key] = storage.get_speaker(new_speaker['id'])
                created_count += 1

    return updated_count, created_count


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Import speaker data from CSV and merge by name.',
    )
    parser.add_argument(
        '--csv',
        default='speakers_new_base.csv',
        help='Path to CSV file with columns: name, personnel_id, structure, role.',
    )
    args = parser.parse_args()
    updated, created = import_csv(Path(args.csv))
    print(f'Updated {updated} speakers, created {created} new speakers.')


if __name__ == '__main__':
    main()
