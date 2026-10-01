"""
Resume API.
POST /api/resume/upload
GET  /api/resume/:id
GET  /api/resume/list
DELETE /api/resume/:id
"""
import os
import json
import uuid
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from .. import db
from ..models import User, Resume, ExtractedSkill
from ..nlp.extractor import extract_text, clean_text
from ..nlp.resume_parser import parse_resume
from ..nlp.skill_extractor import extract_skills_from_text

logger = logging.getLogger(__name__)
resume_bp = Blueprint("resume", __name__)

ALLOWED = {"pdf", "docx", "txt", "png", "jpg", "jpeg"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED


@resume_bp.post("/upload")
@jwt_required()
def upload_resume():
    user_id = int(get_jwt_identity())

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED)}"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(current_app.root_path, "..", current_app.config["UPLOAD_FOLDER"])
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_name)
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    resume = Resume(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        extraction_status="processing",
    )
    db.session.add(resume)
    db.session.commit()

    # Run extraction pipeline
    try:
        extraction = extract_text(file_path, ext)
        raw_text = clean_text(extraction["text"])

        if not raw_text.strip():
            resume.extraction_status = "failed"
            resume.extraction_error = extraction.get("error") or "No text could be extracted"
            db.session.commit()
            return jsonify({"error": "Could not extract text from file", "resume_id": resume.id}), 422

        resume.raw_text = raw_text
        resume.ocr_used = extraction["ocr_used"]

        # Parse sections
        parsed = parse_resume(raw_text)
        resume.candidate_name = parsed.get("candidate_name", "")
        resume.email = parsed.get("email", "")
        resume.phone = parsed.get("phone", "")
        resume.education_json = json.dumps(parsed.get("education", []))
        resume.experience_json = json.dumps(parsed.get("experience", []))
        resume.projects_json = json.dumps(parsed.get("projects", []))
        resume.certifications_json = json.dumps(parsed.get("certifications", []))
        resume.total_experience_months = parsed.get("total_experience_months", 0)

        # Extract skills
        skills_data = extract_skills_from_text(raw_text)
        for skill_dict in skills_data:
            skill = ExtractedSkill(
                resume_id=resume.id,
                raw_skill=skill_dict["raw_skill"],
                normalized_skill=skill_dict["normalized_skill"],
                category=skill_dict.get("category"),
                confidence=skill_dict.get("confidence", 1.0),
                source_section=skill_dict.get("source_section"),
                evidence_text=skill_dict.get("evidence_text"),
            )
            db.session.add(skill)

        resume.extraction_status = "done"

    except Exception as exc:
        logger.exception("Resume processing failed for resume %d", resume.id)
        resume.extraction_status = "failed"
        resume.extraction_error = str(exc)

    db.session.commit()
    return jsonify({"message": "Resume processed", "resume": resume.to_dict()}), 201


@resume_bp.get("/<int:resume_id>")
@jwt_required()
def get_resume(resume_id):
    user_id = int(get_jwt_identity())
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first_or_404()
    include_text = request.args.get("include_text", "false").lower() == "true"
    return jsonify(resume.to_dict(include_text=include_text))


@resume_bp.get("/list")
@jwt_required()
def list_resumes():
    user_id = int(get_jwt_identity())
    resumes = Resume.query.filter_by(user_id=user_id).order_by(Resume.created_at.desc()).all()
    return jsonify([r.to_dict() for r in resumes])


@resume_bp.delete("/<int:resume_id>")
@jwt_required()
def delete_resume(resume_id):
    user_id = int(get_jwt_identity())
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first_or_404()

    # Delete physical file if it exists
    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    db.session.delete(resume)
    db.session.commit()
    return jsonify({"message": "Resume deleted"})
