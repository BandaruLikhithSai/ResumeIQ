"""
Analysis, SkillMatch, SkillGap, and SimulationResult models.
Central store for all matching pipeline outputs.
"""
from datetime import datetime
from .. import db


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # ── Composite score ──────────────────────────────────────────────────
    overall_score = db.Column(db.Float)          # 0..100
    match_label = db.Column(db.String(50))        # Excellent Match | Strong Match | …
    match_color = db.Column(db.String(20))

    # ── Component scores (kept transparent) ─────────────────────────────
    tfidf_score = db.Column(db.Float)
    semantic_score = db.Column(db.Float)
    kg_score = db.Column(db.Float)
    experience_score = db.Column(db.Float)

    # Weights used (snapshot at time of analysis)
    weight_tfidf = db.Column(db.Float)
    weight_semantic = db.Column(db.Float)
    weight_kg = db.Column(db.Float)
    weight_experience = db.Column(db.Float)

    # ── Aggregate counts ─────────────────────────────────────────────────
    total_requirements = db.Column(db.Integer, default=0)
    fully_matched_count = db.Column(db.Integer, default=0)
    partially_matched_count = db.Column(db.Integer, default=0)
    transferable_count = db.Column(db.Integer, default=0)
    missing_count = db.Column(db.Integer, default=0)

    # ── Explanation and strengths ─────────────────────────────────────────
    strengths_json = db.Column(db.Text)          # [str] — why score is high
    weaknesses_json = db.Column(db.Text)         # [str] — why score is reduced
    summary = db.Column(db.Text)                 # one-paragraph narrative summary

    # ── Experience match detail ──────────────────────────────────────────
    experience_match_json = db.Column(db.Text)   # {required_years, candidate_years, matched_roles}

    # ── Education match ──────────────────────────────────────────────────
    education_match_json = db.Column(db.Text)    # {required, candidate, matched: bool}

    status = db.Column(db.String(20), default="pending")  # pending | processing | done | failed
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skill_matches = db.relationship("SkillMatch", backref="analysis", lazy="dynamic",
                                    cascade="all, delete-orphan")
    skill_gaps = db.relationship("SkillGap", backref="analysis", lazy="dynamic",
                                 cascade="all, delete-orphan")
    simulations = db.relationship("SimulationResult", backref="analysis", lazy="dynamic",
                                  cascade="all, delete-orphan")

    def to_dict(self, full=True):
        import json
        result = {
            "id": self.id,
            "resume_id": self.resume_id,
            "job_id": self.job_id,
            "status": self.status,
            "overall_score": self.overall_score,
            "match_label": self.match_label,
            "match_color": self.match_color,
            "component_scores": {
                "tfidf": self.tfidf_score,
                "semantic": self.semantic_score,
                "knowledge_graph": self.kg_score,
                "experience": self.experience_score,
            },
            "weights": {
                "tfidf": self.weight_tfidf,
                "semantic": self.weight_semantic,
                "knowledge_graph": self.weight_kg,
                "experience": self.weight_experience,
            },
            "counts": {
                "total": self.total_requirements,
                "fully_matched": self.fully_matched_count,
                "partially_matched": self.partially_matched_count,
                "transferable": self.transferable_count,
                "missing": self.missing_count,
            },
            "strengths": json.loads(self.strengths_json) if self.strengths_json else [],
            "weaknesses": json.loads(self.weaknesses_json) if self.weaknesses_json else [],
            "summary": self.summary,
            "experience_match": json.loads(self.experience_match_json) if self.experience_match_json else {},
            "education_match": json.loads(self.education_match_json) if self.education_match_json else {},
            "created_at": self.created_at.isoformat(),
        }
        if full:
            result["skill_matches"] = [sm.to_dict() for sm in self.skill_matches.all()]
            result["skill_gaps"] = [sg.to_dict() for sg in self.skill_gaps.all()]
        return result


class SkillMatch(db.Model):
    """
    Per-requirement match record.
    One row per job skill requirement, recording how the candidate satisfies it.
    """
    __tablename__ = "skill_matches"

    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey("analyses.id"), nullable=False)

    job_skill = db.Column(db.String(100), nullable=False)      # canonical job requirement
    job_skill_priority = db.Column(db.String(20))              # required | preferred
    match_status = db.Column(db.String(30), nullable=False)    # fully_matched | partially_matched | transferable | missing

    # What candidate skill(s) satisfy this requirement
    matched_candidate_skill = db.Column(db.String(100))
    transfer_path = db.Column(db.Text)     # e.g. "Python → Machine Learning → Deep Learning"
    match_score = db.Column(db.Float)      # 0..1 partial credit

    # Evidence
    evidence_json = db.Column(db.Text)     # [{section, text}]

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "job_skill": self.job_skill,
            "job_skill_priority": self.job_skill_priority,
            "match_status": self.match_status,
            "matched_candidate_skill": self.matched_candidate_skill,
            "transfer_path": self.transfer_path,
            "match_score": self.match_score,
            "evidence": json.loads(self.evidence_json) if self.evidence_json else [],
        }


class SkillGap(db.Model):
    """Actionable skill gaps with priority and learning recommendations."""
    __tablename__ = "skill_gaps"

    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey("analyses.id"), nullable=False)

    skill = db.Column(db.String(100), nullable=False)
    gap_type = db.Column(db.String(30))          # missing | partial | outdated
    priority = db.Column(db.String(10))          # high | medium | low
    reason = db.Column(db.Text)
    learning_direction = db.Column(db.Text)
    estimated_learning_weeks = db.Column(db.Integer)
    related_resources_json = db.Column(db.Text)  # [{title, url, type}]

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "skill": self.skill,
            "gap_type": self.gap_type,
            "priority": self.priority,
            "reason": self.reason,
            "learning_direction": self.learning_direction,
            "estimated_learning_weeks": self.estimated_learning_weeks,
            "related_resources": json.loads(self.related_resources_json) if self.related_resources_json else [],
        }


class SimulationResult(db.Model):
    """What-if simulation — scored estimate after hypothetically adding skills."""
    __tablename__ = "simulation_results"

    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey("analyses.id"), nullable=False)

    added_skills_json = db.Column(db.Text)        # [str] skills the user picked
    simulated_score = db.Column(db.Float)
    original_score = db.Column(db.Float)
    score_delta = db.Column(db.Float)
    changes_json = db.Column(db.Text)             # [{skill, from_status, to_status}]
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "analysis_id": self.analysis_id,
            "added_skills": json.loads(self.added_skills_json) if self.added_skills_json else [],
            "original_score": self.original_score,
            "simulated_score": self.simulated_score,
            "score_delta": self.score_delta,
            "changes": json.loads(self.changes_json) if self.changes_json else [],
            "created_at": self.created_at.isoformat(),
        }
