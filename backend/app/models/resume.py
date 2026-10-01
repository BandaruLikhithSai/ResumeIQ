"""
Resume and ExtractedSkill models.
Stores raw text, parsed sections, and extracted skills separately
so each stage of the pipeline can be inspected and rerun independently.
"""
from datetime import datetime
from .. import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # File metadata
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512))
    file_type = db.Column(db.String(20))   # pdf | docx | txt | image
    file_size = db.Column(db.Integer)
    is_demo = db.Column(db.Boolean, default=False)

    # Extraction state
    raw_text = db.Column(db.Text)
    ocr_used = db.Column(db.Boolean, default=False)
    extraction_status = db.Column(db.String(20), default="pending")   # pending | done | failed
    extraction_error = db.Column(db.Text)

    # Parsed personal info
    candidate_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))

    # Parsed sections (JSON-serialised lists/dicts stored as Text)
    education_json = db.Column(db.Text)        # [{degree, college, year, gpa}]
    experience_json = db.Column(db.Text)       # [{title, company, duration, description}]
    projects_json = db.Column(db.Text)         # [{name, description, skills_used}]
    certifications_json = db.Column(db.Text)   # [{name, issuer, year}]
    total_experience_months = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = db.relationship("ExtractedSkill", backref="resume", lazy="dynamic",
                             cascade="all, delete-orphan")
    analyses = db.relationship("Analysis", backref="resume", lazy="dynamic")

    def to_dict(self, include_text=False):
        import json
        result = {
            "id": self.id,
            "filename": self.filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "is_demo": self.is_demo,
            "ocr_used": self.ocr_used,
            "extraction_status": self.extraction_status,
            "candidate_name": self.candidate_name,
            "email": self.email,
            "phone": self.phone,
            "total_experience_months": self.total_experience_months,
            "education": json.loads(self.education_json) if self.education_json else [],
            "experience": json.loads(self.experience_json) if self.experience_json else [],
            "projects": json.loads(self.projects_json) if self.projects_json else [],
            "certifications": json.loads(self.certifications_json) if self.certifications_json else [],
            "skills": [s.to_dict() for s in self.skills.all()],
            "created_at": self.created_at.isoformat(),
        }
        if include_text:
            result["raw_text"] = self.raw_text
        return result

    def __repr__(self):
        return f"<Resume {self.filename} [{self.extraction_status}]>"


class ExtractedSkill(db.Model):
    __tablename__ = "extracted_skills"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)

    raw_skill = db.Column(db.String(100), nullable=False)     # as found in resume
    normalized_skill = db.Column(db.String(100), nullable=False)  # canonical form
    category = db.Column(db.String(50))                       # programming_language | framework | ml | etc.
    confidence = db.Column(db.Float, default=1.0)             # 0..1
    source_section = db.Column(db.String(50))                 # skills | experience | projects | education
    evidence_text = db.Column(db.Text)                        # snippet where skill was found

    def to_dict(self):
        return {
            "id": self.id,
            "raw_skill": self.raw_skill,
            "normalized_skill": self.normalized_skill,
            "category": self.category,
            "confidence": self.confidence,
            "source_section": self.source_section,
            "evidence_text": self.evidence_text,
        }
