"""
WSGI entry point for production (Render / gunicorn).

Start command:
    gunicorn wsgi:app --workers 2 --threads 2 --timeout 120 --bind 0.0.0.0:$PORT

Startup sequence:
  1. Create all DB tables (idempotent — safe to run every cold start)
  2. Auto-seed demo data if not already present
     - With PostgreSQL (DATABASE_URL set): data persists across restarts,
       seed runs exactly once on the very first deploy, then skips forever.
     - With SQLite (fallback / local dev): seed runs on every cold start
       because the ephemeral filesystem is wiped each time.
"""
import os
import sys
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("wsgi")

from app import create_app, db

app = create_app()


def _auto_seed():
    """Seed demo users/resumes/jobs if they don't exist yet. Fully idempotent."""
    try:
        from app.models import User
        if User.query.filter_by(email="demo_candidate@resumeiq.demo").first():
            log.info("Demo data already present — skipping seed.")
            return
        log.info("Demo data not found — running seed script...")
        from seed_demo import seed
        seed(app=app)
        log.info("Seed completed successfully.")
    except Exception as exc:
        # Log the full traceback but never crash the server because of seeding
        log.exception("Auto-seed failed (app will still start): %s", exc)


with app.app_context():
    # Log which database we're connecting to (without leaking credentials)
    db_url = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if "postgresql" in db_url or "postgres" in db_url:
        log.info("Database: PostgreSQL (persistent) ✓")
    elif "sqlite" in db_url:
        log.warning(
            "Database: SQLite (EPHEMERAL on Render free tier). "
            "Set DATABASE_URL to a PostgreSQL connection string for persistence."
        )
    else:
        log.info("Database: %s", db_url.split("://")[0])

    db.create_all()
    log.info("DB tables verified.")
    _auto_seed()
