"""
Job Description API.
POST /api/job/create    — create from pasted text
POST /api/job/upload    — create from file
GET  /api/job/:id
GET  /api/job/list
DELETE /api/job/:id
"""
import os
import json
import uuid
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from .. import db
from ..models import Job, JobSkill
from ..nlp.extractor import extract_text, clean_text
from ..nlp.skill_extractor import extract_job_skills

logger = logging.getLogger(__name__)
job_bp = Blueprint("job", __name__)

ALLOWED = {"pdf", "docx", "txt"}


@job_bp.post("/create")
@jwt_required()
def create_job():
    """Create a job description from pasted text."""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    raw_text = data.get("text", "").strip()
    title = data.get("title", "").strip()

    if not raw_text:
        return jsonify({"error": "Job description text is required"}), 400

    return _process_job(user_id, raw_text, title or None)


@job_bp.post("/upload")
@jwt_required()
def upload_job():
    """Create a job description from an uploaded file."""
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED:
        return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED)}"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    upload_dir = os.path.join(current_app.root_path, "..", current_app.config["UPLOAD_FOLDER"])
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_name)
    file.save(file_path)

    extraction = extract_text(file_path, ext)
    raw_text = clean_text(extraction["text"])
    if not raw_text.strip():
        return jsonify({"error": "Could not extract text from file"}), 422

    title = request.form.get("title", "").strip() or None
    return _process_job(user_id, raw_text, title)


def _process_job(user_id: int, raw_text: str, title: str | None):
    extracted = extract_job_skills(raw_text)

    job = Job(
        user_id=user_id,
        title=title or extracted.get("title", "Unknown Position"),
        domain=extracted.get("domain", ""),
        raw_text=raw_text,
        required_experience_years=extracted.get("required_experience_years", 0),
        education_requirement=extracted.get("education_requirement", "any"),
        responsibilities_json=json.dumps(extracted.get("responsibilities", [])),
        preferred_qualifications_json=json.dumps(extracted.get("preferred_qualifications", [])),
        extraction_status="done",
    )
    db.session.add(job)
    db.session.flush()   # get ID

    all_skills = extracted.get("required", []) + extracted.get("preferred", [])
    for skill_dict in all_skills:
        js = JobSkill(
            job_id=job.id,
            raw_skill=skill_dict["raw_skill"],
            normalized_skill=skill_dict["normalized_skill"],
            category=skill_dict.get("category"),
            priority=skill_dict.get("priority", "required"),
            importance_weight=skill_dict.get("importance_weight", 1.0),
        )
        db.session.add(js)

    db.session.commit()
    return jsonify({"message": "Job description processed", "job": job.to_dict()}), 201


@job_bp.get("/<int:job_id>")
@jwt_required()
def get_job(job_id):
    user_id = int(get_jwt_identity())
    job = Job.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    return jsonify(job.to_dict())


@job_bp.get("/list")
@jwt_required()
def list_jobs():
    user_id = int(get_jwt_identity())
    jobs = Job.query.filter_by(user_id=user_id).order_by(Job.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])


@job_bp.delete("/<int:job_id>")
@jwt_required()
def delete_job(job_id):
    user_id = int(get_jwt_identity())
    job = Job.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted"})
