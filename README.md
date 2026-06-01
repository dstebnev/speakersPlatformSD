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
