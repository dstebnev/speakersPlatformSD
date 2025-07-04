# Speakers Platform Telegram Mini App

This project contains a tiny Flask backend and a static front‑end written in React. It showcases speakers and their talks inside a Telegram WebApp.

Data is stored in `/data/db.json` by default (the location can be changed via the `DB_PATH` environment variable).

## Running locally

```bash
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000/` to see the demo cards. Visit `/admin` for the admin placeholder.