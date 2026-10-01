"""
Experience relevance scoring.

Scores how well a candidate's work experience, projects, and
experience duration match what a job requires.
"""
import re
import logging
from ..nlp.skills_db import normalize_skill

logger = logging.getLogger(__name__)


def compute_experience_score(
    resume_data: dict,
    job_data: dict,
    candidate_skills: list[str],
) -> dict:
    """
    Compute experience relevance score.

    Args:
        resume_data: parsed resume dict (experience, projects, education,
                     total_experience_months)
        job_data: parsed job dict (required_experience_years, education_requirement,
                  responsibilities)
        candidate_skills: list of canonical skills

    Returns:
        {
            "score": float 0..1,
            "required_years": float,
            "candidate_years": float,
            "years_match_ratio": float,
            "education_matched": bool,
            "required_edu": str,
            "candidate_edu": str,
            "matched_roles": [str],
            "relevant_projects": [str],
        }
    """
    experience_list = resume_data.get("experience", [])
    projects_list = resume_data.get("projects", [])
    education_list = resume_data.get("education", [])
    total_months = resume_data.get("total_experience_months", 0)
    candidate_years = total_months / 12.0

    required_years = job_data.get("required_experience_years", 0)
    edu_requirement = job_data.get("education_requirement", "any")
    responsibilities = job_data.get("responsibilities", [])

    # ── Years match ────────────────────────────────────────────────────────
    if required_years <= 0:
        years_score = 1.0
        years_ratio = 1.0
    else:
        years_ratio = min(candidate_years / required_years, 1.5)
        years_score = min(years_ratio, 1.0)

    # ── Education match ────────────────────────────────────────────────────
    education_hierarchy = {"any": 0, "high school": 1, "associate's": 2,
                           "bachelor's": 3, "master's": 4, "phd": 5}
    candidate_edu_level = _highest_education(education_list)
    required_level = education_hierarchy.get(edu_requirement.lower(), 0)
    candidate_level = education_hierarchy.get(candidate_edu_level.lower(), 0)
    education_matched = candidate_level >= required_level
    edu_score = 1.0 if education_matched else max(0.4, candidate_level / max(required_level, 1))

    # ── Role relevance ─────────────────────────────────────────────────────
    job_keywords = _extract_keywords_from_responsibilities(responsibilities)
    job_keywords.update(candidate_skills)

    matched_roles = []
    role_score_sum = 0.0
    for exp in experience_list:
        text = (exp.get("title", "") + " " + exp.get("description", "")).lower()
        overlap = sum(1 for kw in job_keywords if kw in text)
        relevance = min(overlap / max(len(job_keywords), 1), 1.0)
        if relevance > 0.1:
            matched_roles.append({
                "title": exp.get("title", ""),
                "company": exp.get("company", ""),
                "relevance": round(relevance, 2),
            })
            role_score_sum += relevance

    role_score = min(role_score_sum / max(len(experience_list), 1), 1.0) if experience_list else 0.5

    # ── Project relevance ──────────────────────────────────────────────────
    relevant_projects = []
    for proj in projects_list:
        text = (proj.get("name", "") + " " + proj.get("description", "")).lower()
        overlap = sum(1 for kw in job_keywords if kw in text)
        if overlap > 0:
            relevant_projects.append(proj.get("name", "Unnamed Project"))

    project_bonus = min(len(relevant_projects) * 0.05, 0.15)

    # ── Composite ──────────────────────────────────────────────────────────
    composite = (
        0.35 * years_score +
        0.25 * edu_score +
        0.30 * role_score +
        0.10 * min(project_bonus * 2, 1.0)  # normalise bonus
    )

    return {
        "score": round(composite, 4),
        "required_years": required_years,
        "candidate_years": round(candidate_years, 1),
        "years_match_ratio": round(years_ratio, 2),
        "education_matched": education_matched,
        "required_edu": edu_requirement,
        "candidate_edu": candidate_edu_level,
        "matched_roles": matched_roles,
        "relevant_projects": relevant_projects,
    }


def _highest_education(education_list: list[dict]) -> str:
    hierarchy = {"phd": 5, "master's": 4, "bachelor's": 3, "associate's": 2,
                 "high school": 1}
    best = "none"
    best_level = 0
    for edu in education_list:
        degree = edu.get("degree", "").lower()
        for label, level in hierarchy.items():
            if label in degree or _match_edu_abbreviation(degree, label):
                if level > best_level:
                    best_level = level
                    best = label
    return best if best != "none" else "unspecified"


def _match_edu_abbreviation(degree: str, label: str) -> bool:
    abbrevs = {
        "bachelor's": ["b.s", "b.e", "b.tech", "be", "btech", "bsc"],
        "master's": ["m.s", "m.tech", "mtech", "mba", "msc", "m.e"],
        "phd": ["ph.d", "doctorate"],
    }
    for abbr in abbrevs.get(label, []):
        if abbr in degree:
            return True
    return False


def _extract_keywords_from_responsibilities(responsibilities: list[str]) -> set[str]:
    keywords = set()
    for resp in responsibilities:
        words = re.findall(r"\b[a-z][a-z0-9+#]{2,}\b", resp.lower())
        keywords.update(words)
    stopwords = {"the", "and", "for", "with", "this", "that", "will", "have",
                 "work", "team", "using", "you", "our", "your", "their", "ensure"}
    return keywords - stopwords
