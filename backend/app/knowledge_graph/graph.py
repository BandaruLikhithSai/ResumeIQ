"""
SkillGraph — NetworkX-based knowledge graph for skills.

Provides:
  - Path-based transferability score between any two skills
  - Neighbour/related skill lookup
  - Exportable graph data for frontend visualisation
"""
import logging
from functools import lru_cache
from typing import Optional

import networkx as nx

from .graph_data import get_all_edges

logger = logging.getLogger(__name__)

# Singleton
_graph_instance: Optional["SkillGraph"] = None


def get_skill_graph() -> "SkillGraph":
    global _graph_instance
    if _graph_instance is None:
        _graph_instance = SkillGraph()
        _graph_instance.build()
    return _graph_instance


class SkillGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._built = False

    def build(self):
        """Populate the graph from static edge data."""
        edges = get_all_edges()
        for src, rel, tgt, weight in edges:
            # Add both directions for related_to and transferable_to (weaker reverse)
            self.graph.add_edge(src, tgt, relation=rel, weight=weight)
            if rel in ("related_to", "transferable_to"):
                reverse_weight = weight * 0.85
                if not self.graph.has_edge(tgt, src):
                    self.graph.add_edge(tgt, src, relation=rel, weight=reverse_weight)

        self._built = True
        logger.info("Knowledge graph built: %d nodes, %d edges",
                    self.graph.number_of_nodes(), self.graph.number_of_edges())

    # ── Query API ─────────────────────────────────────────────────────────

    def are_related(self, skill_a: str, skill_b: str) -> bool:
        """True if there is any path (up to 3 hops) between two skills."""
        a = skill_a.lower()
        b = skill_b.lower()
        if a == b:
            return True
        if not (self.graph.has_node(a) and self.graph.has_node(b)):
            return False
        try:
            path = nx.shortest_path(self.graph, a, b)
            return len(path) <= 4   # max 3 hops
        except nx.NetworkXNoPath:
            return False

    def transferability_score(self, candidate_skill: str, job_skill: str) -> float:
        """
        Return a 0..1 transferability score:
          1.0   = same skill
          0.6–0.9 = directly related
          0.3–0.6 = 2-hop path
          0.0   = not related
        """
        a = candidate_skill.lower()
        b = job_skill.lower()
        if a == b:
            return 1.0
        if not (self.graph.has_node(a) and self.graph.has_node(b)):
            return 0.0

        try:
            path = nx.shortest_path(self.graph, a, b)
        except nx.NetworkXNoPath:
            return 0.0

        hops = len(path) - 1
        if hops == 0:
            return 1.0
        if hops > 3:
            return 0.0

        # Multiply edge weights along path
        score = 1.0
        for i in range(len(path) - 1):
            edge_data = self.graph.get_edge_data(path[i], path[i + 1])
            score *= edge_data.get("weight", 0.7)

        # Discount by hop count
        hop_discount = [1.0, 1.0, 0.75, 0.50]
        score *= hop_discount[hops]
        return round(min(score, 0.95), 3)

    def get_path(self, source: str, target: str) -> list[str]:
        """Return the shortest path between two skills, or []."""
        a = source.lower()
        b = target.lower()
        if not (self.graph.has_node(a) and self.graph.has_node(b)):
            return []
        try:
            return nx.shortest_path(self.graph, a, b)
        except nx.NetworkXNoPath:
            return []

    def get_related_skills(self, skill: str, max_hops: int = 2) -> list[dict]:
        """
        Return all skills reachable within max_hops from skill,
        with their transferability scores.
        """
        skill = skill.lower()
        if not self.graph.has_node(skill):
            return []

        results = []
        try:
            lengths = nx.single_source_shortest_path_length(
                self.graph, skill, cutoff=max_hops
            )
            for node, distance in lengths.items():
                if node == skill:
                    continue
                score = self.transferability_score(skill, node)
                if score > 0.3:
                    results.append({
                        "skill": node,
                        "hops": distance,
                        "score": score,
                        "relation": self._get_edge_relation(skill, node),
                    })
        except Exception:
            pass

        return sorted(results, key=lambda x: -x["score"])

    def _get_edge_relation(self, a: str, b: str) -> str:
        if self.graph.has_edge(a, b):
            return self.graph[a][b].get("relation", "related_to")
        return "related_to"

    # ── Export for frontend vis ───────────────────────────────────────────

    def export_subgraph(self, skill_set: list[str], hops: int = 2) -> dict:
        """
        Export a subgraph containing the given skills and their
        neighbourhood (up to `hops` away) in a vis-friendly format.
        """
        nodes_to_include = set()
        edges_to_include = []

        for skill in skill_set:
            skill = skill.lower()
            if not self.graph.has_node(skill):
                continue
            nodes_to_include.add(skill)
            try:
                lengths = nx.single_source_shortest_path_length(
                    self.graph, skill, cutoff=hops
                )
                for node in lengths:
                    nodes_to_include.add(node)
            except Exception:
                pass

        for src, tgt, data in self.graph.edges(data=True):
            if src in nodes_to_include and tgt in nodes_to_include:
                edges_to_include.append({
                    "source": src,
                    "target": tgt,
                    "relation": data.get("relation", "related_to"),
                    "weight": data.get("weight", 0.5),
                })

        return {
            "nodes": [
                {
                    "id": n,
                    "label": n.title(),
                    "highlight": n in [s.lower() for s in skill_set],
                }
                for n in nodes_to_include
            ],
            "edges": edges_to_include,
        }

    def export_full_graph(self) -> dict:
        """Export entire graph for the Knowledge Graph Explorer page."""
        nodes = [
            {"id": n, "label": n.replace("_", " ").title()}
            for n in self.graph.nodes()
        ]
        edges = [
            {
                "source": u,
                "target": v,
                "relation": d.get("relation", "related_to"),
                "weight": d.get("weight", 0.5),
            }
            for u, v, d in self.graph.edges(data=True)
        ]
        return {"nodes": nodes, "edges": edges}

    @property
    def node_count(self):
        return self.graph.number_of_nodes()

    @property
    def edge_count(self):
        return self.graph.number_of_edges()
