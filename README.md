# Speakers Platform Telegram Mini App

This project contains a tiny Flask backend and a static front-end written in React. It showcases speakers and their talks inside a Telegram WebApp.

Data is stored in a SQLite file at `/data/app.db` by default (the location can be changed via the `DB_PATH` environment variable).
If you previously used `db.json`, run `python migrate_json_to_sqlite.py` once to import the old data.

## Data model

Talk objects reference their speakers via a `speaker_ids` array. Each value in the array should be the `id` of an existing speaker.

### Talk schema

Each talk now stores structured columns in the database with the following keys:

- `id` – UUID string (primary key)
- `name` – talk title
- `description` – free-form description
- `event` – event or conference name
- `tags` – JSON array of tags (replaces the legacy `direction`)
- `date` – ISO `YYYY-MM-DD` when available
- `speaker_ids` – JSON array of speaker ids
- `link` – registration or recording URL
- `status` – `upcoming` or `past` (derived from `date`)
- `rate` – numeric rating (optional)

## Running locally

```bash
pip install -r requirements.txt
python app.py
```

For production deployments run the app with a WSGI server such as Gunicorn:

```bash
gunicorn app:app
```

Open `http://localhost:5000/` to see the demo cards. Visit `/admin` for the admin panel.

## Configuration

Settings are loaded from `.env`.
- `MODE` can be `debug` or `prod` (defaults to `prod`).
- `ADMIN_USERNAMES` is a comma separated list of Telegram usernames allowed to access the admin panel in `prod` mode.
