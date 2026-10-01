"""
WSGI entry point for production (Render / gunicorn).

Start command:
    gunicorn wsgi:app --workers 2 --threads 2 --timeout 120
"""
import os
from app import create_app, db

app = create_app()

# Create all tables on first boot if they don't exist yet.
# Flask-Migrate handles schema upgrades; this covers the very first deploy.
with app.app_context():
    db.create_all()
