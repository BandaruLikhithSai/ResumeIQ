"""
Knowledge-Graph-based skill matching.

For each job requirement, finds the best matching candidate skill
using the knowledge graph transferability score.

Returns per-skill match details and an aggregate KG score.
"""
import logging
from ..knowledge_graph import get_skill_graph

logger = logging.getLogger(__name__)

# Thresholds for match classification
FULL_MATCH_THRESHOLD = 0.95          # exact / synonym match
PARTIAL_MATCH_THRESHOLD = 0.65       # related but not same
TRANSFERABLE_THRESHOLD = 0.30        # weakly related


def match_skills(
    candidate_skills: list[str],
    job_skills: list[dict],
) -> dict:
    """
    Match candidate skills to job requirements using the knowledge graph.

    Args:
        candidate_skills: list of canonical skill names the candidate has
        job_skills: list of {normalized_skill, priority, importance_weight}

    Returns:
        {
            "kg_score": float,
            "skill_matches": [SkillMatch-like dicts],
            "matched_count": int,
            "partial_count": int,
            "transferable_count": int,
            "missing_count": int,
        }
    """
    graph = get_skill_graph()
    candidate_set = set(s.lower() for s in candidate_skills)

    skill_matches = []
    total_weight = 0.0
    earned_weight = 0.0

    for job_skill_entry in job_skills:
        job_skill = job_skill_entry["normalized_skill"].lower()
        priority = job_skill_entry.get("priority", "required")
        importance = job_skill_entry.get("importance_weight", 1.0)

        total_weight += importance

        # ── 1. Exact match ─────────────────────────────────────────────────
        if job_skill in candidate_set:
            evidence = [{"section": "skills", "text": f"{job_skill} found directly in candidate profile"}]
            skill_matches.append({
                "job_skill": job_skill,
                "job_skill_priority": priority,
                "match_status": "fully_matched",
                "matched_candidate_skill": job_skill,
                "transfer_path": job_skill,
                "match_score": 1.0,
                "evidence": evidence,
            })
            earned_weight += importance * 1.0
            continue

        # ── 2. Knowledge graph search ──────────────────────────────────────
        best_score = 0.0
        best_candidate_skill = None
        best_path = []

        for cand_skill in candidate_set:
            score = graph.transferability_score(cand_skill, job_skill)
            if score > best_score:
                best_score = score
                best_candidate_skill = cand_skill
                best_path = graph.get_path(cand_skill, job_skill)

        # ── 3. Classify ───────────────────────────────────────────────────
        if best_score >= PARTIAL_MATCH_THRESHOLD:
            status = "partially_matched"
            path_str = " → ".join(p.title() for p in best_path) if best_path else best_candidate_skill
            evidence = [{
                "section": "knowledge_graph",
                "text": f"{best_candidate_skill} is related to {job_skill} via: {path_str}"
            }]
            skill_matches.append({
                "job_skill": job_skill,
                "job_skill_priority": priority,
                "match_status": status,
                "matched_candidate_skill": best_candidate_skill,
                "transfer_path": path_str,
                "match_score": best_score,
                "evidence": evidence,
            })
            earned_weight += importance * best_score * 0.7  # partial credit

        elif best_score >= TRANSFERABLE_THRESHOLD:
            path_str = " → ".join(p.title() for p in best_path) if best_path else best_candidate_skill
            evidence = [{
                "section": "knowledge_graph",
                "text": f"{best_candidate_skill} is transferable to {job_skill} (path: {path_str})"
            }]
            skill_matches.append({
                "job_skill": job_skill,
                "job_skill_priority": priority,
                "match_status": "transferable",
                "matched_candidate_skill": best_candidate_skill,
                "transfer_path": path_str,
                "match_score": best_score,
                "evidence": evidence,
            })
            earned_weight += importance * best_score * 0.4

        else:
            skill_matches.append({
                "job_skill": job_skill,
                "job_skill_priority": priority,
                "match_status": "missing",
                "matched_candidate_skill": None,
                "transfer_path": None,
                "match_score": 0.0,
                "evidence": [{"section": "none", "text": f"No {job_skill} skill or related experience detected"}],
            })

    # Aggregate counts
    counts = {"fully_matched": 0, "partially_matched": 0, "transferable": 0, "missing": 0}
    for sm in skill_matches:
        counts[sm["match_status"]] = counts.get(sm["match_status"], 0) + 1

    kg_score = (earned_weight / total_weight) if total_weight > 0 else 0.0

    return {
        "kg_score": round(kg_score, 4),
        "skill_matches": skill_matches,
        "matched_count": counts["fully_matched"],
        "partial_count": counts["partially_matched"],
        "transferable_count": counts["transferable"],
        "missing_count": counts["missing"],
    }


def compute_simulation_score(
    candidate_skills: list[str],
    added_skills: list[str],
    job_skills: list[dict],
) -> dict:
    """
    Re-run KG matching with added_skills included in candidate profile.
    Used for what-if simulation.
    """
    augmented = list(set(candidate_skills) | set(s.lower() for s in added_skills))
    return match_skills(augmented, job_skills)
