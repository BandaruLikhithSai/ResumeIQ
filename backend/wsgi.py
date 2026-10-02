"""
WSGI entry point for production (Render / gunicorn).

Start command:
    gunicorn wsgi:app --workers 2 --threads 2 --timeout 120

Auto-seeds demo data on every cold start so Render free-tier container
restarts (which wipe ephemeral SQLite) don't break demo / first-run flows.
If a real DATABASE_URL (PostgreSQL) is configured the seed is idempotent —
it checks for existing rows before inserting anything.
"""
import os
from app import create_app, db

app = create_app()


def _auto_seed():
    """Seed demo users, resumes, jobs, and analyses if they don't exist yet."""
    try:
        from app.models import User
        if User.query.filter_by(email="demo_candidate@resumeiq.demo").first():
            print("[wsgi] Demo data already present — skipping seed.")
            return
        print("[wsgi] Demo data missing — running seed...")
        from seed_demo import seed
        seed()
        print("[wsgi] Seed complete.")
    except Exception as exc:
        # Never crash the server because of seeding — just log it
        print(f"[wsgi] WARNING: Auto-seed failed: {exc}")


with app.app_context():
    db.create_all()
    _auto_seed()
