"""
Analysis API.
POST /api/analysis/run             — run full analysis
GET  /api/analysis/:id             — get analysis result
GET  /api/analysis/list            — list user's analyses
POST /api/analysis/:id/simulate    — what-if simulation
GET  /api/analysis/:id/graph       — subgraph for this analysis
"""
import json
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import Resume, Job, Analysis, SkillMatch, SkillGap, SimulationResult
from ..matching.engine import MatchingEngine
from ..explainability.explainer import generate_explanation
from ..explainability.skill_gap import generate_skill_gaps
from ..knowledge_graph import get_skill_graph

logger = logging.getLogger(__name__)
analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.post("/run")
@jwt_required()
def run_analysis():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    resume_id = data.get("resume_id")
    job_id = data.get("job_id")
    weights = data.get("weights")  # optional override

    if not resume_id or not job_id:
        return jsonify({"error": "resume_id and job_id are required"}), 400

    resume = Resume.query.filter_by(id=resume_id).first_or_404()
    job = Job.query.filter_by(id=job_id).first_or_404()

    if resume.extraction_status != "done":
        return jsonify({"error": "Resume has not been successfully processed yet"}), 422
    if job.extraction_status != "done":
        return jsonify({"error": "Job description has not been successfully processed yet"}), 422

    # Create pending analysis
    analysis = Analysis(
        resume_id=resume_id,
        job_id=job_id,
        user_id=user_id,
        status="processing",
    )
    db.session.add(analysis)
    db.session.commit()

    try:
        # Prepare data
        candidate_skills = [s.normalized_skill for s in resume.skills.all()]
        job_skills = [s.to_dict() for s in job.skills.all()]
        resume_data = resume.to_dict()
        job_data = job.to_dict()

        engine = MatchingEngine(weights=weights)
        result = engine.run(
            resume_text=resume.raw_text or "",
            job_text=job.raw_text or "",
            resume_data=resume_data,
            job_data=job_data,
            candidate_skills=candidate_skills,
            job_skills=job_skills,
        )

        # Generate explanation
        explanation = generate_explanation(
            match_result=result,
            resume_data=resume_data,
            job_data=job_data,
        )

        # Generate skill gaps
        skill_gaps_data = generate_skill_gaps(
            skill_matches=result["skill_matches"],
            job_skills=job_skills,
            resume_data=resume_data,
        )

        # Persist Analysis
        analysis.overall_score = result["overall_score"]
        analysis.match_label = result["match_label"]
        analysis.match_color = result["match_color"]
        analysis.tfidf_score = result["tfidf_score"]
        analysis.semantic_score = result["semantic_score"]
        analysis.kg_score = result["kg_score"]
        analysis.experience_score = result["experience_score"]
        analysis.weight_tfidf = result["weight_tfidf"]
        analysis.weight_semantic = result["weight_semantic"]
        analysis.weight_kg = result["weight_kg"]
        analysis.weight_experience = result["weight_experience"]
        analysis.total_requirements = result["total_requirements"]
        analysis.fully_matched_count = result["fully_matched_count"]
        analysis.partially_matched_count = result["partially_matched_count"]
        analysis.transferable_count = result["transferable_count"]
        analysis.missing_count = result["missing_count"]
        analysis.strengths_json = json.dumps(explanation["strengths"])
        analysis.weaknesses_json = json.dumps(explanation["weaknesses"])
        analysis.summary = explanation["summary"]
        analysis.experience_match_json = json.dumps(result["experience_match"])
        analysis.education_match_json = json.dumps(result["education_match"])
        analysis.status = "done"

        # Persist SkillMatches
        for sm in result["skill_matches"]:
            skill_match = SkillMatch(
                analysis_id=analysis.id,
                job_skill=sm["job_skill"],
                job_skill_priority=sm.get("job_skill_priority"),
                match_status=sm["match_status"],
                matched_candidate_skill=sm.get("matched_candidate_skill"),
                transfer_path=sm.get("transfer_path"),
                match_score=sm.get("match_score"),
                evidence_json=json.dumps(sm.get("evidence", [])),
            )
            db.session.add(skill_match)

        # Persist SkillGaps
        for sg in skill_gaps_data:
            skill_gap = SkillGap(
                analysis_id=analysis.id,
                skill=sg["skill"],
                gap_type=sg["gap_type"],
                priority=sg["priority"],
                reason=sg["reason"],
                learning_direction=sg["learning_direction"],
                estimated_learning_weeks=sg["estimated_learning_weeks"],
                related_resources_json=json.dumps(sg.get("related_resources", [])),
            )
            db.session.add(skill_gap)

        db.session.commit()
        return jsonify({"message": "Analysis complete", "analysis": analysis.to_dict()}), 201

    except Exception as exc:
        logger.exception("Analysis failed for analysis %d", analysis.id)
        analysis.status = "failed"
        analysis.error_message = str(exc)
        db.session.commit()
        return jsonify({"error": "Analysis failed", "message": str(exc)}), 500


@analysis_bp.get("/<int:analysis_id>")
@jwt_required()
def get_analysis(analysis_id):
    analysis = Analysis.query.get_or_404(analysis_id)
    full = request.args.get("full", "true").lower() != "false"
    return jsonify(analysis.to_dict(full=full))


@analysis_bp.get("/list")
@jwt_required()
def list_analyses():
    user_id = int(get_jwt_identity())
    analyses = (
        Analysis.query
        .filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    return jsonify([a.to_dict(full=False) for a in analyses])


@analysis_bp.post("/<int:analysis_id>/simulate")
@jwt_required()
def simulate(analysis_id):
    analysis = Analysis.query.get_or_404(analysis_id)
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    added_skills = data.get("added_skills", [])
    if not added_skills:
        return jsonify({"error": "added_skills list is required"}), 400

    resume = Resume.query.get(analysis.resume_id)
    job = Job.query.get(analysis.job_id)

    candidate_skills = [s.normalized_skill for s in resume.skills.all()]
    job_skills = [s.to_dict() for s in job.skills.all()]

    engine = MatchingEngine()
    original_scores = {
        "overall_score": analysis.overall_score,
        "tfidf_score": analysis.tfidf_score,
        "semantic_score": analysis.semantic_score,
        "experience_score": analysis.experience_score,
        "skill_matches": [sm.to_dict() for sm in analysis.skill_matches.all()],
    }

    sim_result = engine.simulate(
        original_analysis=original_scores,
        candidate_skills=candidate_skills,
        added_skills=added_skills,
        job_skills=job_skills,
    )

    # Persist
    sim = SimulationResult(
        analysis_id=analysis_id,
        added_skills_json=json.dumps(added_skills),
        simulated_score=sim_result["simulated_score"],
        original_score=sim_result["original_score"],
        score_delta=sim_result["score_delta"],
        changes_json=json.dumps(sim_result["changes"]),
    )
    db.session.add(sim)
    db.session.commit()

    return jsonify(sim.to_dict())


@analysis_bp.get("/<int:analysis_id>/graph")
@jwt_required()
def analysis_graph(analysis_id):
    analysis = Analysis.query.get_or_404(analysis_id)
    resume = Resume.query.get(analysis.resume_id)
    job = Job.query.get(analysis.job_id)

    candidate_skills = [s.normalized_skill for s in resume.skills.all()]
    job_skills = [s.normalized_skill for s in job.skills.all()]

    graph = get_skill_graph()
    subgraph = graph.export_subgraph(candidate_skills + job_skills, hops=2)
    return jsonify(subgraph)
