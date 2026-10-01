"""
Knowledge Graph API.
GET /api/graph/full          — full graph export
GET /api/graph/skill/:name   — neighbours of a skill
GET /api/graph/path          — path between two skills
GET /api/graph/stats         — graph statistics
"""
from flask import Blueprint, request, jsonify
from ..knowledge_graph import get_skill_graph

graph_bp = Blueprint("graph", __name__)


@graph_bp.get("/full")
def full_graph():
    graph = get_skill_graph()
    return jsonify(graph.export_full_graph())


@graph_bp.get("/stats")
def graph_stats():
    graph = get_skill_graph()
    return jsonify({
        "node_count": graph.node_count,
        "edge_count": graph.edge_count,
    })


@graph_bp.get("/skill/<skill_name>")
def skill_neighbours(skill_name):
    graph = get_skill_graph()
    neighbours = graph.get_related_skills(skill_name.lower(), max_hops=2)
    return jsonify({
        "skill": skill_name,
        "related": neighbours,
    })


@graph_bp.get("/path")
def skill_path():
    source = request.args.get("source", "").lower()
    target = request.args.get("target", "").lower()
    if not source or not target:
        return jsonify({"error": "source and target query params required"}), 400

    graph = get_skill_graph()
    path = graph.get_path(source, target)
    score = graph.transferability_score(source, target)
    return jsonify({
        "source": source,
        "target": target,
        "path": path,
        "transferability_score": score,
    })


@graph_bp.get("/subgraph")
def subgraph():
    skills_param = request.args.get("skills", "")
    if not skills_param:
        return jsonify({"error": "skills query param required"}), 400
    skills = [s.strip().lower() for s in skills_param.split(",") if s.strip()]
    hops = request.args.get("hops", 2, type=int)
    graph = get_skill_graph()
    return jsonify(graph.export_subgraph(skills, hops=min(hops, 3)))
