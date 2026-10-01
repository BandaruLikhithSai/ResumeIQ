"""
ResumeIQ Configuration
Loads settings from environment variables with sensible defaults.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Core Flask ──────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-please-change")
    DEBUG = False
    TESTING = False

    # ── Database ────────────────────────────────────────────────────────────
    # Render injects DATABASE_URL as postgres://... but SQLAlchemy 1.4+ requires
    # postgresql://  — fix the scheme automatically.
    _db_url = os.getenv("DATABASE_URL", "sqlite:///resumeiq.db")
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,        # reconnect after idle timeout
        "pool_recycle": 280,          # recycle before Render's 5-min idle cut-off
    }

    # ── JWT ─────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-please-change")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    # ── File Uploads ────────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))  # 16 MB
    ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "png", "jpg", "jpeg"}

    # ── CORS ────────────────────────────────────────────────────────────────
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # ── Hybrid Matching Weights ─────────────────────────────────────────────
    WEIGHT_TFIDF = float(os.getenv("WEIGHT_TFIDF", 0.25))
    WEIGHT_SEMANTIC = float(os.getenv("WEIGHT_SEMANTIC", 0.30))
    WEIGHT_KG = float(os.getenv("WEIGHT_KG", 0.25))
    WEIGHT_EXPERIENCE = float(os.getenv("WEIGHT_EXPERIENCE", 0.20))

    # ── Score Classification Thresholds ─────────────────────────────────────
    SCORE_EXCELLENT = int(os.getenv("SCORE_EXCELLENT", 85))
    SCORE_STRONG = int(os.getenv("SCORE_STRONG", 70))
    SCORE_MODERATE = int(os.getenv("SCORE_MODERATE", 50))
    SCORE_WEAK = int(os.getenv("SCORE_WEAK", 30))

    @classmethod
    def get_match_label(cls, score: float) -> dict:
        """Return a human-readable label and color for a match score."""
        if score >= cls.SCORE_EXCELLENT:
            return {"label": "Excellent Match", "color": "green"}
        elif score >= cls.SCORE_STRONG:
            return {"label": "Strong Match", "color": "blue"}
        elif score >= cls.SCORE_MODERATE:
            return {"label": "Moderate Match", "color": "yellow"}
        elif score >= cls.SCORE_WEAK:
            return {"label": "Weak Match", "color": "orange"}
        else:
            return {"label": "Poor Match", "color": "red"}


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)
