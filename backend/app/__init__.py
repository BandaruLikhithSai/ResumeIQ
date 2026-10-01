"""
ResumeIQ Flask application factory.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config=None):
    app = Flask(__name__, instance_relative_config=True)

    # ── Config ────────────────────────────────────────────────────────────
    from .config import get_config
    app.config.from_object(config or get_config())

    # ── Extensions ────────────────────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # FRONTEND_URL may be a comma-separated list for multi-origin support,
    # e.g. "http://localhost:5173,https://resumeiq.onrender.com"
    allowed_origins = [o.strip() for o in app.config["FRONTEND_URL"].split(",") if o.strip()]
    CORS(app,
         resources={r"/api/*": {"origins": allowed_origins}},
         supports_credentials=True)

    # ── Ensure upload folder exists ───────────────────────────────────────
    import os
    upload_dir = os.path.join(app.root_path, "..", app.config["UPLOAD_FOLDER"])
    os.makedirs(upload_dir, exist_ok=True)

    # ── Register models (so Flask-Migrate sees them) ──────────────────────
    from .models import User, Resume, ExtractedSkill, Job, JobSkill  # noqa: F401
    from .models import Analysis, SkillMatch, SkillGap, SimulationResult  # noqa: F401

    # ── Register blueprints ───────────────────────────────────────────────
    from .api.auth import auth_bp
    from .api.resume import resume_bp
    from .api.job import job_bp
    from .api.analysis import analysis_bp
    from .api.recruiter import recruiter_bp
    from .api.graph import graph_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(job_bp, url_prefix="/api/job")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(recruiter_bp, url_prefix="/api/recruiter")
    app.register_blueprint(graph_bp, url_prefix="/api/graph")

    # ── Health check ─────────────────────────────────────────────────────
    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "ResumeIQ API"}

    # ── Global error handlers ─────────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return {"error": "Bad request", "message": str(e)}, 400

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Not found"}, 404

    @app.errorhandler(413)
    def file_too_large(e):
        return {"error": "File too large", "message": "Maximum file size is 16 MB"}, 413

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500

    return app
