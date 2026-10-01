"""
Skill Extractor — identifies skills from text using:
  1. Dictionary lookup (skills_db canonical + aliases)
  2. Regex patterns for common skill formats
  3. Section-aware extraction (skills section has higher confidence)

Returns a list of ExtractedSkill-compatible dicts.
"""
import re
import logging
from .skills_db import normalize_skill, get_skill_info, SKILLS_DB

logger = logging.getLogger(__name__)

# ── Section detection patterns ────────────────────────────────────────────────
SECTION_PATTERNS = {
    "skills":       re.compile(r"(?i)\b(technical\s+)?skills?\b|competencies|technologies|tech\s+stack|expertise"),
    "experience":   re.compile(r"(?i)\bwork\s+experience\b|employment|professional\s+experience|career\b"),
    "education":    re.compile(r"(?i)\beducation\b|academic\b|qualifications?\b|degrees?\b"),
    "projects":     re.compile(r"(?i)\bprojects?\b|personal\s+projects?|academic\s+projects?"),
    "certifications": re.compile(r"(?i)\bcertifications?\b|certificates?\b|accreditation"),
    "summary":      re.compile(r"(?i)\b(professional\s+)?summary\b|profile\b|objective\b|about\b"),
}

# ── Build a combined search pattern from all skill names + aliases ─────────────
def _build_skill_pattern():
    # Sort by length descending so longer matches take priority
    all_terms = []
    for canonical, info in SKILLS_DB.items():
        all_terms.append((canonical, canonical))
        for alias in info.get("aliases", []):
            all_terms.append((alias, canonical))

    all_terms.sort(key=lambda x: len(x[0]), reverse=True)
    # Escape and build regex
    escaped = [re.escape(term) for term, _ in all_terms]
    pattern = re.compile(r"(?<![a-zA-Z0-9\-_])(" + "|".join(escaped) + r")(?![a-zA-Z0-9\-_])", re.IGNORECASE)
    return pattern, {term.lower(): canonical for term, canonical in all_terms}

_SKILL_PATTERN, _ALIAS_TO_CANONICAL = _build_skill_pattern()


def extract_skills_from_text(text: str) -> list[dict]:
    """
    Extract skills from raw resume text.
    Returns list of dicts compatible with ExtractedSkill model.
    """
    if not text or not text.strip():
        return []

    sections = _split_into_sections(text)
    seen_canonical: dict[str, dict] = {}   # canonical → best skill dict

    for section_name, section_text in sections.items():
        confidence_boost = 1.0 if section_name == "skills" else 0.85
        matches = _SKILL_PATTERN.finditer(section_text)

        for match in matches:
            raw = match.group(0)
            canonical = _ALIAS_TO_CANONICAL.get(raw.lower())
            if not canonical:
                canonical = normalize_skill(raw)
            if not canonical:
                continue

            info = get_skill_info(canonical)
            category = info["category"] if info else "other"
            evidence_snippet = _get_snippet(section_text, match.start(), match.end())

            # Keep the highest-confidence occurrence
            if canonical not in seen_canonical or seen_canonical[canonical]["confidence"] < confidence_boost:
                seen_canonical[canonical] = {
                    "raw_skill": raw,
                    "normalized_skill": canonical,
                    "category": category,
                    "confidence": confidence_boost,
                    "source_section": section_name,
                    "evidence_text": evidence_snippet,
                }

    return list(seen_canonical.values())


def _split_into_sections(text: str) -> dict[str, str]:
    """
    Detect major sections of a resume and return them as a dict.
    Falls back to 'general' if no sections found.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {"general": []}
    current_section = "general"

    for line in lines:
        stripped = line.strip()
        detected = None
        for section_name, pattern in SECTION_PATTERNS.items():
            if pattern.search(stripped) and len(stripped) < 80:
                detected = section_name
                break

        if detected:
            current_section = detected
            sections.setdefault(current_section, [])
        else:
            sections.setdefault(current_section, [])
            sections[current_section].append(line)

    return {k: "\n".join(v) for k, v in sections.items() if v}


def _get_snippet(text: str, start: int, end: int, context: int = 80) -> str:
    """Return text around a match position as evidence."""
    snip_start = max(0, start - context)
    snip_end = min(len(text), end + context)
    snippet = text[snip_start:snip_end].replace("\n", " ").strip()
    return snippet


# ── Job Description Skill Extraction ─────────────────────────────────────────

def extract_job_skills(text: str) -> dict:
    """
    Extract skills from a job description.
    Also separates required vs preferred skills based on linguistic cues.

    Returns:
        {
            "required": [{"raw_skill", "normalized_skill", "category", "importance_weight"}],
            "preferred": [...],
            "responsibilities": [str],
            "title": str,
            "domain": str,
            "required_experience_years": float,
            "education_requirement": str
        }
    """
    if not text:
        return {"required": [], "preferred": [], "responsibilities": [], "title": "", "domain": ""}

    required_skills = []
    preferred_skills = []

    # Split text into sentences for context
    sentences = re.split(r"[.\n]+", text)

    for sentence in sentences:
        is_preferred = bool(re.search(
            r"(?i)\b(preferred?|nice\s+to\s+have|bonus|plus|desired|advantage|ideally|optionally?)\b",
            sentence
        ))

        matches = _SKILL_PATTERN.finditer(sentence)
        for match in matches:
            raw = match.group(0)
            canonical = _ALIAS_TO_CANONICAL.get(raw.lower()) or normalize_skill(raw)
            if not canonical:
                continue
            info = get_skill_info(canonical)
            entry = {
                "raw_skill": raw,
                "normalized_skill": canonical,
                "category": info["category"] if info else "other",
                "importance_weight": 0.7 if is_preferred else 1.0,
                "priority": "preferred" if is_preferred else "required",
            }
            target = preferred_skills if is_preferred else required_skills
            # Avoid duplicates
            if not any(e["normalized_skill"] == canonical for e in target):
                target.append(entry)

    responsibilities = _extract_responsibilities(text)
    title = _extract_job_title(text)
    domain = _infer_domain(text, required_skills + preferred_skills)
    exp_years = _extract_experience_requirement(text)
    edu_req = _extract_education_requirement(text)

    return {
        "required": required_skills,
        "preferred": preferred_skills,
        "responsibilities": responsibilities,
        "title": title,
        "domain": domain,
        "required_experience_years": exp_years,
        "education_requirement": edu_req,
    }


def _extract_job_title(text: str) -> str:
    patterns = [
        r"(?i)(?:job\s+title|position|role)[:\s]+([^\n]+)",
        r"(?i)^([A-Z][A-Za-z ]{5,60})$",   # A lone title-case line near the top
    ]
    for p in patterns:
        m = re.search(p, text[:500])
        if m:
            return m.group(1).strip()
    # Fall back to first non-empty line
    for line in text.split("\n"):
        if line.strip() and len(line.strip()) < 80:
            return line.strip()
    return "Unknown Position"


def _extract_experience_requirement(text: str) -> float:
    patterns = [
        r"(\d+)\+?\s*(?:–|-|to)\s*(\d+)\s*years?",
        r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
        r"minimum\s+(\d+)\s*years?",
        r"at\s+least\s+(\d+)\s*years?",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            try:
                return float(m.group(1))
            except Exception:
                pass
    return 0.0


def _extract_education_requirement(text: str) -> str:
    if re.search(r"(?i)\bph\.?d\.?\b|doctorate", text):
        return "phd"
    if re.search(r"(?i)\bmaster['s]?\s+degree\b|m\.?s\.?\b|m\.?tech\b|mba\b", text):
        return "master"
    if re.search(r"(?i)\bbachelor['s]?\s+degree\b|b\.?s\.?\b|b\.?e\.?\b|b\.?tech\b|undergraduate\b", text):
        return "bachelor"
    return "any"


def _extract_responsibilities(text: str) -> list[str]:
    bullet_pattern = re.compile(r"^[\s]*[•\-\*▪◦➤→]\s+(.+)", re.MULTILINE)
    matches = bullet_pattern.findall(text)
    # Filter short/irrelevant
    return [m.strip() for m in matches if len(m.strip()) > 20][:15]


def _infer_domain(text: str, skills: list[dict]) -> str:
    categories = [s["category"] for s in skills]
    cat_counts = {}
    for c in categories:
        cat_counts[c] = cat_counts.get(c, 0) + 1

    if not cat_counts:
        return "General"

    top_cat = max(cat_counts, key=cat_counts.get)
    domain_map = {
        "ml_ai": "Machine Learning / AI",
        "data_engineering": "Data Engineering",
        "framework": "Software Development",
        "programming_language": "Software Development",
        "devops": "DevOps / Infrastructure",
        "cloud": "Cloud Engineering",
        "database": "Data Engineering",
        "mobile": "Mobile Development",
        "testing": "Quality Assurance",
        "methodology": "Software Engineering",
    }
    return domain_map.get(top_cat, "General Technology")
