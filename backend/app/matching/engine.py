"""
Hybrid Matching Engine — orchestrates all scoring components.

Score = α × TF-IDF  +  β × Semantic  +  γ × KG  +  δ × Experience
"""
import json
import logging
from flask import current_app

from .tfidf_matcher import compute_tfidf_score
from .semantic_matcher import compute_semantic_score
from .kg_matcher import match_skills, compute_simulation_score
from .experience_matcher import compute_experience_score

logger = logging.getLogger(__name__)


class MatchingEngine:

    def __init__(self, weights: dict | None = None):
        """
        weights: override config weights, e.g.
                 {"tfidf": 0.25, "semantic": 0.30, "kg": 0.25, "experience": 0.20}
        """
        if weights:
            self.w_tfidf = weights.get("tfidf", 0.25)
            self.w_semantic = weights.get("semantic", 0.30)
            self.w_kg = weights.get("kg", 0.25)
            self.w_experience = weights.get("experience", 0.20)
        else:
            self.w_tfidf = 0.25
            self.w_semantic = 0.30
            self.w_kg = 0.25
            self.w_experience = 0.20

    def run(
        self,
        resume_text: str,
        job_text: str,
        resume_data: dict,
        job_data: dict,
        candidate_skills: list[str],
        job_skills: list[dict],
    ) -> dict:
        """
        Full analysis run.

        Returns a dict ready to be saved to the Analysis model.
        """

        # ── Component 1: TF-IDF ─────────────────────────────────────────
        tfidf_score = compute_tfidf_score(resume_text, job_text)

        # ── Component 2: Semantic ───────────────────────────────────────
        semantic_result = compute_semantic_score(resume_text, job_text)
        semantic_score = semantic_result["score"]

        # ── Component 3: Knowledge Graph ────────────────────────────────
        kg_result = match_skills(candidate_skills, job_skills)
        kg_score = kg_result["kg_score"]

        # ── Component 4: Experience ─────────────────────────────────────
        exp_result = compute_experience_score(resume_data, job_data, candidate_skills)
        experience_score = exp_result["score"]

        # ── Composite ───────────────────────────────────────────────────
        overall_raw = (
            self.w_tfidf * tfidf_score +
            self.w_semantic * semantic_score +
            self.w_kg * kg_score +
            self.w_experience * experience_score
        )
        overall_score = round(overall_raw * 100, 1)

        # ── Match label ─────────────────────────────────────────────────
        label_info = _default_label(overall_score)

        return {
            "overall_score": overall_score,
            "match_label": label_info["label"],
            "match_color": label_info["color"],

            # Scores stored as 0-100 for display
            "tfidf_score": round(tfidf_score * 100, 1),
            "semantic_score": round(semantic_score * 100, 1),
            "kg_score": round(kg_score * 100, 1),
            "experience_score": round(experience_score * 100, 1),

            "weight_tfidf": self.w_tfidf,
            "weight_semantic": self.w_semantic,
            "weight_kg": self.w_kg,
            "weight_experience": self.w_experience,

            "semantic_method": semantic_result.get("method"),

            "skill_matches": kg_result["skill_matches"],
            "total_requirements": len(job_skills),
            "fully_matched_count": kg_result["matched_count"],
            "partially_matched_count": kg_result["partial_count"],
            "transferable_count": kg_result["transferable_count"],
            "missing_count": kg_result["missing_count"],

            "experience_match": exp_result,
            "education_match": {
                "required": exp_result["required_edu"],
                "candidate": exp_result["candidate_edu"],
                "matched": exp_result["education_matched"],
            },
        }

    def simulate(
        self,
        original_analysis: dict,
        candidate_skills: list[str],
        added_skills: list[str],
        job_skills: list[dict],
    ) -> dict:
        """
        What-if simulation: re-score with added_skills in candidate profile.
        Returns the simulation result dict.
        """
        kg_result = compute_simulation_score(candidate_skills, added_skills, job_skills)
        new_kg_score = kg_result["kg_score"]

        # Recompute overall using the same other scores
        original_scores = original_analysis
        new_overall_raw = (
            self.w_tfidf * (original_scores.get("tfidf_score", 0) / 100) +
            self.w_semantic * (original_scores.get("semantic_score", 0) / 100) +
            self.w_kg * new_kg_score +
            self.w_experience * (original_scores.get("experience_score", 0) / 100)
        )
        new_overall = round(new_overall_raw * 100, 1)
        original_overall = original_scores.get("overall_score", 0)

        # Build change list
        old_matches = {sm["job_skill"]: sm["match_status"]
                       for sm in original_scores.get("skill_matches", [])}
        changes = []
        for sm in kg_result["skill_matches"]:
            old_status = old_matches.get(sm["job_skill"])
            new_status = sm["match_status"]
            if old_status and old_status != new_status:
                changes.append({
                    "skill": sm["job_skill"],
                    "from_status": old_status,
                    "to_status": new_status,
                })

        return {
            "original_score": original_overall,
            "simulated_score": new_overall,
            "score_delta": round(new_overall - original_overall, 1),
            "added_skills": added_skills,
            "changes": changes,
        }


def _default_label(score: float) -> dict:
    if score >= 85:
        return {"label": "Excellent Match", "color": "green"}
    elif score >= 70:
        return {"label": "Strong Match", "color": "blue"}
    elif score >= 50:
        return {"label": "Moderate Match", "color": "yellow"}
    elif score >= 30:
        return {"label": "Weak Match", "color": "orange"}
    else:
        return {"label": "Poor Match", "color": "red"}
