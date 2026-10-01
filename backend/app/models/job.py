"""
Job Description model.
"""
from datetime import datetime
from .. import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255))
    domain = db.Column(db.String(100))
    raw_text = db.Column(db.Text, nullable=False)
    is_demo = db.Column(db.Boolean, default=False)

    # Extracted requirements
    required_experience_years = db.Column(db.Float, default=0)
    education_requirement = db.Column(db.String(100))   # bachelor | master | phd | any
    responsibilities_json = db.Column(db.Text)          # [str]
    preferred_qualifications_json = db.Column(db.Text)  # [str]

    extraction_status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = db.relationship("JobSkill", backref="job", lazy="dynamic",
                             cascade="all, delete-orphan")
    analyses = db.relationship("Analysis", backref="job", lazy="dynamic")

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "domain": self.domain,
            "is_demo": self.is_demo,
            "required_experience_years": self.required_experience_years,
            "education_requirement": self.education_requirement,
            "responsibilities": json.loads(self.responsibilities_json) if self.responsibilities_json else [],
            "preferred_qualifications": json.loads(self.preferred_qualifications_json) if self.preferred_qualifications_json else [],
            "skills": [s.to_dict() for s in self.skills.all()],
            "extraction_status": self.extraction_status,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self):
        return f"<Job {self.title}>"


class JobSkill(db.Model):
    __tablename__ = "job_skills"

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)

    raw_skill = db.Column(db.String(100), nullable=False)
    normalized_skill = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    priority = db.Column(db.String(20), default="required")  # required | preferred
    importance_weight = db.Column(db.Float, default=1.0)     # 0..2, higher = more important

    def to_dict(self):
        return {
            "id": self.id,
            "raw_skill": self.raw_skill,
            "normalized_skill": self.normalized_skill,
            "category": self.category,
            "priority": self.priority,
            "importance_weight": self.importance_weight,
        }
