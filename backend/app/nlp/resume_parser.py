"""
Resume Parser — extracts structured sections from raw resume text.
Handles varied resume layouts using heuristic section detection.
"""
import re
import logging
from .extractor import clean_text

logger = logging.getLogger(__name__)


def parse_resume(raw_text: str) -> dict:
    """
    Parse a raw resume text into structured sections.

    Returns:
        {
            "candidate_name": str,
            "email": str,
            "phone": str,
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "total_experience_months": int,
        }
    """
    text = clean_text(raw_text)
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    result = {
        "candidate_name": _extract_name(lines[:10]),
        "email": _extract_email(text),
        "phone": _extract_phone(text),
        "education": _extract_education(text),
        "experience": _extract_experience(text),
        "projects": _extract_projects(text),
        "certifications": _extract_certifications(text),
        "total_experience_months": 0,
    }

    # Calculate total experience
    result["total_experience_months"] = _sum_experience_months(result["experience"])
    return result


# ── Contact Info ──────────────────────────────────────────────────────────────

def _extract_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else ""


def _extract_phone(text: str) -> str:
    patterns = [
        r"\+?1?[\s\-.]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}",
        r"\+\d{1,3}[\s\-]?\d{10}",
        r"\d{10}",
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(0).strip()
    return ""


def _extract_name(first_lines: list[str]) -> str:
    """
    Best-effort name extraction from the top of the resume.
    Heuristic: first line that looks like a proper name (2-4 words, title case, no @).
    """
    name_pattern = re.compile(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$")
    for line in first_lines:
        clean = line.strip()
        if name_pattern.match(clean) and "@" not in clean and len(clean) < 60:
            return clean
    return ""


# ── Section splitter ─────────────────────────────────────────────────────────

SECTION_HEADERS = {
    "education": re.compile(r"(?i)^(education|academic background|qualifications?|degrees?)[\s:]*$"),
    "experience": re.compile(r"(?i)^(work experience|professional experience|employment history?|career history|experience)[\s:]*$"),
    "projects": re.compile(r"(?i)^(projects?|personal projects?|academic projects?|key projects?)[\s:]*$"),
    "certifications": re.compile(r"(?i)^(certifications?|certificates?|licenses?|accreditations?)[\s:]*$"),
    "skills": re.compile(r"(?i)^(technical skills?|skills?|competencies|technologies|tools)[\s:]*$"),
    "summary": re.compile(r"(?i)^(summary|profile|objective|about me)[\s:]*$"),
}


def _split_sections(text: str) -> dict[str, str]:
    lines = text.split("\n")
    sections: dict[str, list[str]] = {"preamble": []}
    current = "preamble"

    for line in lines:
        stripped = line.strip()
        matched = None
        for section, pattern in SECTION_HEADERS.items():
            if pattern.match(stripped):
                matched = section
                break
        if matched:
            current = matched
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, [])
            sections[current].append(line)

    return {k: "\n".join(v) for k, v in sections.items()}


# ── Education ─────────────────────────────────────────────────────────────────

DEGREE_PATTERNS = [
    (re.compile(r"(?i)\bph\.?d\.?\b"), "PhD"),
    (re.compile(r"(?i)\bmaster[s']?\s+(?:of\s+)?(?:science|arts|engineering|technology|business)\b|m\.?s\.?\b|m\.?tech\.?\b|mba\b"), "Master's"),
    (re.compile(r"(?i)\bbachelor[s']?\s+(?:of\s+)?(?:science|arts|engineering|technology)\b|b\.?s\.?\b|b\.?e\.?\b|b\.?tech\.?\b"), "Bachelor's"),
    (re.compile(r"(?i)\bassociate[s']?\s+degree\b"), "Associate's"),
    (re.compile(r"(?i)\b(?:high\s+school|secondary|diploma)\b"), "High School"),
]


def _extract_education(text: str) -> list[dict]:
    sections = _split_sections(text)
    edu_text = sections.get("education", "") or text

    entries = []
    # Look for degree-year patterns
    year_pattern = re.compile(r"\b(19|20)\d{2}\b")
    gpa_pattern = re.compile(r"(?i)(?:gpa|cgpa|grade)[:\s]+(\d+\.?\d*)")

    # Rough chunking: split by blank lines or year boundaries
    blocks = re.split(r"\n{2,}", edu_text)
    for block in blocks:
        if not block.strip():
            continue
        degree = ""
        for pattern, label in DEGREE_PATTERNS:
            if pattern.search(block):
                degree = label
                break
        if not degree:
            continue

        years = year_pattern.findall(block)
        year = years[-1] if years else ""
        gpa_m = gpa_pattern.search(block)
        gpa = gpa_m.group(1) if gpa_m else ""

        # Try to find institution name (line with University/College/Institute/School)
        college = ""
        for line in block.split("\n"):
            if re.search(r"(?i)\b(university|college|institute|school|iit|nit)\b", line):
                college = line.strip()
                break

        entries.append({
            "degree": degree,
            "college": college,
            "year": year,
            "gpa": gpa,
            "raw": block.strip(),
        })

    return entries


# ── Experience ────────────────────────────────────────────────────────────────

def _extract_experience(text: str) -> list[dict]:
    sections = _split_sections(text)
    exp_text = sections.get("experience", "")

    if not exp_text.strip():
        return []

    # Date range pattern
    date_pattern = re.compile(
        r"(?i)(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})"
        r"\s*(?:–|-|to|–)\s*"
        r"(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|"
        r"present|current|now|\d{4})",
        re.IGNORECASE,
    )

    entries = []
    blocks = re.split(r"\n{2,}", exp_text.strip())

    for block in blocks:
        if not block.strip():
            continue

        date_match = date_pattern.search(block)
        start_date = date_match.group(1) if date_match else ""
        end_date = date_match.group(2) if date_match else ""
        duration_months = _duration_to_months(start_date, end_date)

        lines = [l.strip() for l in block.split("\n") if l.strip()]
        title = lines[0] if lines else ""
        company = lines[1] if len(lines) > 1 else ""
        description = " ".join(lines[2:]) if len(lines) > 2 else ""

        entries.append({
            "title": title,
            "company": company,
            "start_date": start_date,
            "end_date": end_date,
            "duration_months": duration_months,
            "description": description[:500],
        })

    return entries


def _duration_to_months(start: str, end: str) -> int:
    """Rough month count from date strings."""
    try:
        import re
        year_start = int(re.search(r"\d{4}", start).group()) if start else None
        if not year_start:
            return 0
        if re.search(r"(?i)present|current|now", end):
            import datetime
            year_end = datetime.datetime.now().year
        else:
            m = re.search(r"\d{4}", end) if end else None
            year_end = int(m.group()) if m else year_start + 1
        return max(0, (year_end - year_start) * 12)
    except Exception:
        return 0


def _sum_experience_months(experience: list[dict]) -> int:
    return sum(e.get("duration_months", 0) for e in experience)


# ── Projects ──────────────────────────────────────────────────────────────────

def _extract_projects(text: str) -> list[dict]:
    sections = _split_sections(text)
    proj_text = sections.get("projects", "")

    if not proj_text.strip():
        return []

    entries = []
    blocks = re.split(r"\n{2,}", proj_text.strip())
    for block in blocks:
        if not block.strip():
            continue
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue
        entries.append({
            "name": lines[0],
            "description": " ".join(lines[1:])[:400],
        })

    return entries[:10]  # Cap at 10 projects


# ── Certifications ────────────────────────────────────────────────────────────

def _extract_certifications(text: str) -> list[dict]:
    sections = _split_sections(text)
    cert_text = sections.get("certifications", "")

    if not cert_text.strip():
        return []

    entries = []
    year_pattern = re.compile(r"\b(20\d{2})\b")
    for line in cert_text.split("\n"):
        line = line.strip()
        if len(line) < 5:
            continue
        year_m = year_pattern.search(line)
        entries.append({
            "name": re.sub(r"\s*\b20\d{2}\b", "", line).strip(),
            "year": year_m.group(1) if year_m else "",
            "issuer": "",
        })

    return entries[:15]
