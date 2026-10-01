"""
Skill Gap Analysis generator.

Produces a prioritised list of skill gaps with learning recommendations
derived from the actual match results.
"""
import logging

logger = logging.getLogger(__name__)

# Learning time estimates in weeks (rough heuristics)
LEARNING_TIME = {
    "programming_language": 12,
    "framework": 6,
    "ml_ai": 10,
    "data_engineering": 8,
    "database": 4,
    "cloud": 8,
    "devops": 8,
    "mobile": 10,
    "testing": 3,
    "methodology": 4,
    "other": 6,
}

# Learning directions by category
LEARNING_DIRECTIONS = {
    "ml_ai": "Study the theoretical foundations, then apply via open datasets on Kaggle or UCI repository",
    "programming_language": "Build small projects and contribute to open source to gain practical exposure",
    "framework": "Follow the official documentation tutorial, then build a full project",
    "data_engineering": "Work through end-to-end data pipelines using public datasets",
    "cloud": "Get hands-on with free-tier cloud accounts and complete a certification",
    "devops": "Set up a local CI/CD pipeline, containerise a personal project",
    "database": "Design a schema for a real-world use case and write queries",
    "mobile": "Build a simple mobile app following the platform's official starter guide",
    "testing": "Add tests to an existing project; aim for 80%+ coverage",
    "methodology": "Apply to a team project; read relevant design patterns literature",
    "other": "Find official documentation or a structured online course",
}


def generate_skill_gaps(
    skill_matches: list[dict],
    job_skills: list[dict],
    resume_data: dict,
) -> list[dict]:
    """
    Generate prioritised skill gap recommendations.

    Args:
        skill_matches: output of kg_matcher.match_skills (list of match dicts)
        job_skills: original job skills list
        resume_data: parsed resume (for context in evidence)

    Returns:
        List of gap dicts ordered by priority (high → medium → low)
    """
    # Build a lookup for job skill metadata
    job_skill_meta = {
        js["normalized_skill"].lower(): js for js in job_skills
    }

    gaps = []

    for sm in skill_matches:
        job_skill = sm["job_skill"]
        status = sm["match_status"]
        priority_flag = sm.get("job_skill_priority", "required")

        if status == "fully_matched":
            continue  # No gap

        # Get skill category from the job skills list
        meta = job_skill_meta.get(job_skill, {})
        category = meta.get("category", "other")

        if status == "missing":
            gap_type = "missing"
            priority = "high" if priority_flag == "required" else "medium"
            reason = (
                f"{job_skill.title()} is listed as a {priority_flag} skill "
                f"but was not detected in the candidate's profile."
            )

        elif status == "partially_matched":
            gap_type = "partial"
            priority = "medium"
            matched_via = sm.get("matched_candidate_skill", "")
            reason = (
                f"Partial match via {matched_via.title() if matched_via else 'related skills'}. "
                f"More direct experience with {job_skill.title()} would strengthen the match."
            )

        elif status == "transferable":
            gap_type = "transferable"
            priority = "low"
            path = sm.get("transfer_path", "")
            reason = (
                f"Transferable via {path} but direct {job_skill.title()} "
                f"experience would be more competitive."
            )

        else:
            continue

        learning_direction = LEARNING_DIRECTIONS.get(category, LEARNING_DIRECTIONS["other"])
        estimated_weeks = LEARNING_TIME.get(category, 6)

        # Suggest concrete resources
        resources = _suggest_resources(job_skill, category)

        gaps.append({
            "skill": job_skill,
            "gap_type": gap_type,
            "priority": priority,
            "reason": reason,
            "learning_direction": learning_direction,
            "estimated_learning_weeks": estimated_weeks,
            "related_resources": resources,
        })

    # Sort: high → medium → low
    priority_order = {"high": 0, "medium": 1, "low": 2}
    gaps.sort(key=lambda g: priority_order.get(g["priority"], 3))

    return gaps


def _suggest_resources(skill: str, category: str) -> list[dict]:
    """
    Return generic but relevant learning resource suggestions.
    These are category-level suggestions, not live URLs.
    """
    resources = []

    category_resources = {
        "ml_ai": [
            {"title": "fast.ai Practical Deep Learning", "type": "course"},
            {"title": "Scikit-learn Documentation", "type": "documentation"},
        ],
        "programming_language": [
            {"title": "Official language documentation", "type": "documentation"},
            {"title": "Exercism.io for practice", "type": "platform"},
        ],
        "framework": [
            {"title": "Official framework documentation and tutorial", "type": "documentation"},
        ],
        "cloud": [
            {"title": "Official cloud provider free tier + tutorials", "type": "platform"},
            {"title": "Cloud certification study guides", "type": "course"},
        ],
        "devops": [
            {"title": "Play with Docker (labs.play-with-docker.com)", "type": "platform"},
            {"title": "Kubernetes official tutorials (kubernetes.io)", "type": "documentation"},
        ],
        "database": [
            {"title": "SQLZoo for SQL practice", "type": "platform"},
            {"title": "Official database documentation", "type": "documentation"},
        ],
        "data_engineering": [
            {"title": "Kaggle datasets for practice", "type": "platform"},
            {"title": "Official Pandas/Spark documentation", "type": "documentation"},
        ],
    }

    skill_specific = {
        "docker": [{"title": "Docker Getting Started Guide (docs.docker.com)", "type": "documentation"}],
        "kubernetes": [{"title": "Kubernetes Basics tutorial (kubernetes.io)", "type": "documentation"}],
        "aws": [{"title": "AWS Skill Builder (skillbuilder.aws)", "type": "platform"}],
        "tensorflow": [{"title": "TensorFlow tutorials (tensorflow.org)", "type": "documentation"}],
        "pytorch": [{"title": "PyTorch tutorials (pytorch.org)", "type": "documentation"}],
        "react": [{"title": "React official tutorial (react.dev)", "type": "documentation"}],
    }

    if skill in skill_specific:
        resources.extend(skill_specific[skill])

    resources.extend(category_resources.get(category, []))

    return resources[:3]
