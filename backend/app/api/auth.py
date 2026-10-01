"""
Authentication API.
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/demo-login
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from .. import db
from ..models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "candidate")

    if not email or not password or not full_name:
        return jsonify({"error": "email, password, and full_name are required"}), 400
    if role not in ("candidate", "recruiter"):
        return jsonify({"error": "role must be 'candidate' or 'recruiter'"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(email=email, full_name=full_name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@auth_bp.post("/demo-login")
def demo_login():
    """Login with a demo account (no password required)."""
    role = request.get_json(silent=True, force=True).get("role", "candidate")
    if role not in ("candidate", "recruiter"):
        role = "candidate"

    email = f"demo_{role}@resumeiq.demo"
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Demo account not found. Please run the seed script."}), 404

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()})
