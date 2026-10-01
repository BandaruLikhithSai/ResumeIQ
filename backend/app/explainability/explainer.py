"""
Explainability generator.

Produces human-readable strengths, weaknesses, and a summary
derived directly from actual matching results — not generic templates.
"""
import logging

logger = logging.getLogger(__name__)


def generate_explanation(
    match_result: dict,
    resume_data: dict,
    job_data: dict,
) -> dict:
    """
    Generate an explanation for the match result.

    Returns:
        {
            "strengths": [str],
            "weaknesses": [str],
            "summary": str,
        }
    """
    skill_matches = match_result.get("skill_matches", [])
    experience_match = match_result.get("experience_match", {})
    education_match = match_result.get("education_match", {})
    overall_score = match_result.get("overall_score", 0)

    fully_matched = [sm for sm in skill_matches if sm["match_status"] == "fully_matched"]
    partially_matched = [sm for sm in skill_matches if sm["match_status"] == "partially_matched"]
    transferable = [sm for sm in skill_matches if sm["match_status"] == "transferable"]
    missing = [sm for sm in skill_matches if sm["match_status"] == "missing"]

    strengths = []
    weaknesses = []

    # ── Strengths from direct skill matches ─────────────────────────────
    if fully_matched:
        skill_list = ", ".join(sm["job_skill"].title() for sm in fully_matched[:5])
        strengths.append(
            f"Directly satisfies {len(fully_matched)} job requirement(s): {skill_list}"
        )

    if partially_matched:
        for sm in partially_matched[:3]:
            strengths.append(
                f"Partial knowledge of {sm['job_skill'].title()} "
                f"(via {sm['matched_candidate_skill'].title() if sm['matched_candidate_skill'] else 'related experience'})"
            )

    if transferable:
        for sm in transferable[:3]:
            if sm.get("transfer_path"):
                strengths.append(
                    f"Transferable skill path: {sm['transfer_path']} → {sm['job_skill'].title()}"
                )

    # ── Strengths from experience ────────────────────────────────────────
    candidate_years = experience_match.get("candidate_years", 0)
    required_years = experience_match.get("required_years", 0)
    if candidate_years > 0:
        if required_years <= 0 or candidate_years >= required_years:
            strengths.append(
                f"Experience level is adequate "
                f"({candidate_years:.1f} year{'s' if candidate_years != 1 else ''} detected)"
            )
        else:
            strengths.append(
                f"Has {candidate_years:.1f} year(s) of experience "
                f"(job requires {required_years:.0f}+)"
            )

    matched_roles = experience_match.get("matched_roles", [])
    if matched_roles:
        role_names = [r["title"] for r in matched_roles[:2] if r.get("title")]
        if role_names:
            strengths.append(f"Relevant role experience: {', '.join(role_names)}")

    relevant_projects = experience_match.get("relevant_projects", [])
    if relevant_projects:
        strengths.append(
            f"Relevant project experience: {', '.join(relevant_projects[:3])}"
        )

    # ── Education ────────────────────────────────────────────────────────
    if education_match.get("matched"):
        candidate_edu = education_match.get("candidate_edu", "").title()
        strengths.append(f"Education requirement satisfied ({candidate_edu})")

    # ── Weaknesses from missing skills ──────────────────────────────────
    required_missing = [sm for sm in missing
                        if sm.get("job_skill_priority") == "required"]
    preferred_missing = [sm for sm in missing
                         if sm.get("job_skill_priority") != "required"]

    if required_missing:
        skill_list = ", ".join(sm["job_skill"].title() for sm in required_missing[:4])
        weaknesses.append(
            f"Missing {len(required_missing)} required skill(s): {skill_list}"
        )

    if preferred_missing:
        skill_list = ", ".join(sm["job_skill"].title() for sm in preferred_missing[:3])
        weaknesses.append(
            f"Missing {len(preferred_missing)} preferred skill(s): {skill_list}"
        )

    # ── Weaknesses from experience gap ───────────────────────────────────
    if required_years > 0 and candidate_years < required_years:
        gap = required_years - candidate_years
        weaknesses.append(
            f"Experience gap: needs {required_years:.0f}+ years, "
            f"detected {candidate_years:.1f} years "
            f"({gap:.1f} years short)"
        )

    if not education_match.get("matched") and education_match.get("required_edu", "any") != "any":
        weaknesses.append(
            f"Education requirement not fully met "
            f"(requires {education_match.get('required_edu', '').title()}, "
            f"candidate has {education_match.get('candidate_edu', 'unspecified').title()})"
        )

    # ── Score context ────────────────────────────────────────────────────
    component_scores = match_result.get("component_scores", {})
    if isinstance(component_scores, dict):
        low_components = [
            f"{k.replace('_', ' ').title()} ({round(v, 0):.0f}%)"
            for k, v in component_scores.items()
            if v is not None and v < 60
        ]
        if low_components:
            weaknesses.append(
                f"Lower-scoring areas: {', '.join(low_components)}"
            )

    # ── Summary narrative ────────────────────────────────────────────────
    job_title = job_data.get("title", "this position")
    candidate_name = resume_data.get("candidate_name", "The candidate")
    n_fully = len(fully_matched)
    n_total = len(skill_matches)
    n_missing = len(required_missing)

    if overall_score >= 80:
        tone = "a strong fit"
    elif overall_score >= 60:
        tone = "a reasonable fit with some gaps"
    elif overall_score >= 40:
        tone = "a partial fit requiring significant upskilling"
    else:
        tone = "not yet a strong match"

    summary_parts = [
        f"{candidate_name} is {tone} for the role of {job_title}.",
        f"They satisfy {n_fully} of {n_total} identified requirements directly.",
    ]

    if partially_matched or transferable:
        n_partial = len(partially_matched) + len(transferable)
        summary_parts.append(
            f"{n_partial} additional requirement(s) are partially or transferably covered "
            f"through related skills and experience."
        )

    if n_missing > 0:
        missing_names = ", ".join(sm["job_skill"].title() for sm in required_missing[:3])
        summary_parts.append(
            f"Key gaps include: {missing_names}{'...' if n_missing > 3 else '.'}"
        )

    summary = " ".join(summary_parts)

    # Always return at least one item in each list
    if not strengths:
        strengths = ["Profile submitted for analysis — limited matching signals detected"]
    if not weaknesses:
        weaknesses = ["No significant gaps identified based on available information"]

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "summary": summary,
    }
