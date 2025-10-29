import argparse
import csv
import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple
from uuid import uuid4

import storage


def _normalise_name(name: str) -> str:
    return (name or '').strip().lower()


def _calc_status(date_str: str) -> str:
    if not date_str:
        return 'upcoming'
    try:
        parsed = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
    except Exception:
        return 'upcoming'
    return 'past' if parsed < datetime.date.today() else 'upcoming'


def _load_speaker_map() -> Dict[str, str]:
    storage.init_db()
    speakers = storage.all_speakers()
    mapping: Dict[str, str] = {}
    for speaker in speakers:
        key = _normalise_name(speaker.get('name'))
        if key:
            mapping[key] = speaker['id']
    return mapping


def _load_existing_talks() -> Dict[str, dict]:
    storage.init_db()
    talks = storage.all_talks()
    return {_normalise_name(t['name']): t for t in talks if t.get('name')}


def _parse_speaker_ids(raw: str, speaker_map: Dict[str, str], missing: Set[str]) -> List[str]:
    if not raw:
        return []
    ids: List[str] = []
    for part in raw.split(','):
        name = part.strip()
        if not name:
            continue
        key = _normalise_name(name)
        speaker_id = speaker_map.get(key)
        if speaker_id:
            ids.append(speaker_id)
        else:
            missing.add(name)
    return ids


def import_performs(csv_path: Path) -> Tuple[int, int, Set[str]]:
    if not csv_path.exists():
        raise FileNotFoundError(f'CSV file not found: {csv_path}')

    speaker_map = _load_speaker_map()
    existing = _load_existing_talks()
    updated_count = 0
    created_count = 0
    missing_speakers: Set[str] = set()

    with csv_path.open('r', encoding='utf-8-sig', newline='') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            name = (row.get('name') or '').strip()
            if not name:
                continue

            event = (row.get('event') or '').strip()
            date = (row.get('date') or '').strip()
            link = (row.get('link') or '').strip()
            rate_raw = (row.get('rate') or '').strip()
            try:
                rate = float(rate_raw) if rate_raw else None
            except ValueError:
                rate = None

            speaker_ids = _parse_speaker_ids(row.get('speakers') or '', speaker_map, missing_speakers)

            key = _normalise_name(name)
            current = existing.get(key)

            if current:
                updated = {**current}
                updated['event'] = event or current.get('event', '')
                updated['date'] = date or current.get('date', '')
                updated['link'] = link or current.get('link', '')
                updated['rate'] = rate if rate is not None else current.get('rate')
                if speaker_ids:
                    updated['speaker_ids'] = speaker_ids
                updated['status'] = _calc_status(updated.get('date', ''))
                storage.save_talk(updated)
                existing[key] = storage.get_talk(updated['id'])
                updated_count += 1
            else:
                new_talk = {
                    'id': str(uuid4()),
                    'name': name,
                    'description': '',
                    'event': event,
                    'tags': [],
                    'date': date,
                    'speaker_ids': speaker_ids,
                    'link': link,
                    'status': _calc_status(date),
                    'rate': rate,
                }
                storage.add_talk(new_talk)
                existing[key] = storage.get_talk(new_talk['id'])
                created_count += 1

    return updated_count, created_count, missing_speakers


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Import performs data from CSV and merge talks by name.',
    )
    parser.add_argument(
        '--csv',
        default='performs_new_base.csv',
        help='Path to CSV file with columns: name,event,date,speakers,rate,link',
    )
    args = parser.parse_args()

    updated, created, missing = import_performs(Path(args.csv))
    print(f'Updated {updated} talks, created {created} new talks.')
    if missing:
        print('Speakers not found:')
        for name in sorted(missing):
            print(f' - {name}')


if __name__ == '__main__':
    main()
