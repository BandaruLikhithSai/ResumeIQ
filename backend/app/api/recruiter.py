"""
Recruiter API.
POST /api/recruiter/candidates           — bulk upload resumes for a job
GET  /api/recruiter/candidates           — list all candidates for a job
GET  /api/recruiter/compare              — compare two analyses
PUT  /api/recruiter/candidates/:id/status — update candidate status
"""
import json
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import Analysis, Resume, Job, User

logger = logging.getLogger(__name__)
recruiter_bp = Blueprint("recruiter", __name__)


@recruiter_bp.get("/candidates")
@jwt_required()
def list_candidates():
    """
    Return all analyses for a given job_id, ranked by overall_score.
    Optionally filter by min_score, status.
    """
    job_id = request.args.get("job_id", type=int)
    min_score = request.args.get("min_score", type=float, default=0)
    status_filter = request.args.get("status")
    search = request.args.get("search", "").lower()

    query = Analysis.query.filter_by(status="done")
    if job_id:
        query = query.filter_by(job_id=job_id)
    if min_score:
        query = query.filter(Analysis.overall_score >= min_score)

    analyses = query.order_by(Analysis.overall_score.desc()).all()

    rows = []
    for idx, analysis in enumerate(analyses, 1):
        resume = Resume.query.get(analysis.resume_id)
        if not resume:
            continue

        candidate_name = resume.candidate_name or f"Candidate #{resume.id}"
        if search and search not in candidate_name.lower():
            continue

        skill_coverage = round(
            (analysis.fully_matched_count + analysis.partially_matched_count * 0.5) /
            max(analysis.total_requirements, 1) * 100, 1
        )

        rows.append({
            "rank": idx,
            "analysis_id": analysis.id,
            "resume_id": resume.id,
            "candidate_name": candidate_name,
            "email": resume.email,
            "overall_score": analysis.overall_score,
            "match_label": analysis.match_label,
            "match_color": analysis.match_color,
            "skill_coverage": skill_coverage,
            "fully_matched": analysis.fully_matched_count,
            "partially_matched": analysis.partially_matched_count,
            "transferable": analysis.transferable_count,
            "missing": analysis.missing_count,
            "total_requirements": analysis.total_requirements,
            "experience_years": round(resume.total_experience_months / 12, 1),
            "skills_count": resume.skills.count(),
            "created_at": analysis.created_at.isoformat(),
        })

    # Dashboard summary
    total = len(rows)
    shortlisted = sum(1 for r in rows if r["overall_score"] >= 70)
    needs_review = sum(1 for r in rows if 40 <= r["overall_score"] < 70)
    avg_score = round(sum(r["overall_score"] for r in rows) / max(total, 1), 1)

    return jsonify({
        "candidates": rows,
        "summary": {
            "total": total,
            "shortlisted": shortlisted,
            "needs_review": needs_review,
            "not_suitable": total - shortlisted - needs_review,
            "average_score": avg_score,
        },
    })


@recruiter_bp.get("/compare")
@jwt_required()
def compare_candidates():
    """
    Compare 2–4 analyses side by side.
    ?analysis_ids=1,2,3
    """
    ids_param = request.args.get("analysis_ids", "")
    try:
        ids = [int(x.strip()) for x in ids_param.split(",") if x.strip()]
    except ValueError:
        return jsonify({"error": "analysis_ids must be comma-separated integers"}), 400

    if len(ids) < 2:
        return jsonify({"error": "Provide at least 2 analysis IDs"}), 400

    # Cap at 4 and fetch — skip any IDs that don't exist instead of 404-ing
    analyses = []
    for i in ids[:4]:
        a = Analysis.query.get(i)
        if a:
            analyses.append(a)

    if len(analyses) < 2:
        return jsonify({"error": "Could not find at least 2 valid analyses for the given IDs"}), 404

    try:
        # Build per-candidate skill_match lookup (kept separate — not sent to client)
        skill_match_maps = {}
        comparison = []

        for analysis in analyses:
            resume = Resume.query.get(analysis.resume_id)
            sm_map = {sm.job_skill: sm.match_status for sm in analysis.skill_matches.all()}
            skill_match_maps[analysis.id] = sm_map

            comparison.append({
                "analysis_id": analysis.id,
                "candidate_name": resume.candidate_name if resume else f"Candidate #{analysis.resume_id}",
                "overall_score": round(analysis.overall_score or 0, 1),
                "match_label": analysis.match_label or "",
                "component_scores": {
                    "tfidf":           round(analysis.tfidf_score or 0, 1),
                    "semantic":        round(analysis.semantic_score or 0, 1),
                    "knowledge_graph": round(analysis.kg_score or 0, 1),
                    "experience":      round(analysis.experience_score or 0, 1),
                },
                "counts": {
                    "fully_matched":    analysis.fully_matched_count or 0,
                    "partially_matched":analysis.partially_matched_count or 0,
                    "transferable":     analysis.transferable_count or 0,
                    "missing":          analysis.missing_count or 0,
                },
                "strengths": json.loads(analysis.strengths_json) if analysis.strengths_json else [],
            })

        # Build unified requirement matrix from the job of the first analysis
        job = Job.query.get(analyses[0].job_id)
        all_requirements = [s.normalized_skill for s in job.skills.all()] if job else []

        matrix = []
        for req in all_requirements:
            row = {"requirement": req}
            for analysis in analyses:
                # Use string key so JSON serialization doesn't mix int/str keys
                row[str(analysis.id)] = skill_match_maps[analysis.id].get(req, "missing")
            matrix.append(row)

        return jsonify({
            "candidates": comparison,
            "requirement_matrix": matrix,
            "job_title": job.title if job else "Unknown",
        })

    except Exception as exc:
        logger.exception("Comparison failed for IDs %s", ids)
        return jsonify({"error": f"Comparison failed: {str(exc)}"}), 500


@recruiter_bp.put("/candidates/<int:analysis_id>/status")
@jwt_required()
def update_candidate_status(analysis_id):
    """Update match_label (shortlisted / rejected / etc.) for a candidate."""
    data = request.get_json()
    new_label = data.get("label", "").strip()
    if not new_label:
        return jsonify({"error": "label is required"}), 400

    analysis = Analysis.query.get_or_404(analysis_id)
    analysis.match_label = new_label
    db.session.commit()
    return jsonify({"message": "Status updated", "label": new_label})
