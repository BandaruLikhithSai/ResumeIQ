"""
Semantic similarity using sentence-level embeddings.

Tries to use sentence-transformers (all-MiniLM-L6-v2) if available.
Falls back to TF-IDF cosine if not.

All fallbacks are clearly labelled in the returned metadata dict.
"""
import logging
import re
import math
from collections import Counter

logger = logging.getLogger(__name__)

_model = None
_model_available = None
_MODEL_NAME = "all-MiniLM-L6-v2"


def _try_load_model():
    global _model, _model_available
    if _model_available is not None:
        return _model_available

    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(_MODEL_NAME)
        _model_available = True
        logger.info("Sentence transformer model loaded: %s", _MODEL_NAME)
    except ImportError:
        logger.info("sentence-transformers not installed; using TF-IDF cosine as semantic proxy")
        _model_available = False
    except Exception as exc:
        logger.warning("Could not load sentence transformer: %s", exc)
        _model_available = False

    return _model_available


def compute_semantic_score(resume_text: str, job_text: str) -> dict:
    """
    Compute semantic similarity.

    Returns:
        {
            "score": float (0..1),
            "method": "sentence_transformer" | "tfidf_cosine",
            "model": str | None
        }
    """
    if not resume_text or not job_text:
        return {"score": 0.0, "method": "none", "model": None}

    if _try_load_model():
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np

            # Truncate to avoid OOM on very large resumes
            r_text = resume_text[:3000]
            j_text = job_text[:2000]

            embeddings = _model.encode([r_text, j_text])
            score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
            return {
                "score": round(max(0.0, score), 4),
                "method": "sentence_transformer",
                "model": _MODEL_NAME,
            }
        except Exception as exc:
            logger.warning("Sentence transformer inference failed: %s", exc)

    # Fallback — weighted TF-IDF cosine
    score = _tfidf_cosine(resume_text, job_text)
    return {
        "score": score,
        "method": "tfidf_cosine_fallback",
        "model": None,
    }


# ── TF-IDF cosine (pure Python, no sklearn) ─────────────────────────────────

def _tokenize(text: str) -> list[str]:
    text = text.lower()
    tokens = re.findall(r"\b[a-z][a-z0-9+#]{1,}\b", text)
    stopwords = {
        "the", "a", "an", "and", "or", "of", "to", "in", "for",
        "is", "are", "was", "were", "be", "been", "with", "on",
        "at", "by", "from", "as", "we", "you", "our", "your",
        "this", "that", "will", "have", "has", "been", "they",
        "their", "not", "but", "who", "work", "working", "role",
    }
    return [t for t in tokens if t not in stopwords]


def _tfidf_cosine(text_a: str, text_b: str) -> float:
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)

    if not tokens_a or not tokens_b:
        return 0.0

    vocab = set(tokens_a) | set(tokens_b)
    count_a = Counter(tokens_a)
    count_b = Counter(tokens_b)
    n_a = len(tokens_a)
    n_b = len(tokens_b)

    def tf(count, total):
        return count / total if total else 0

    # Compute cosine
    dot = 0.0
    mag_a = 0.0
    mag_b = 0.0

    for word in vocab:
        va = tf(count_a.get(word, 0), n_a)
        vb = tf(count_b.get(word, 0), n_b)
        dot += va * vb
        mag_a += va ** 2
        mag_b += vb ** 2

    if mag_a == 0 or mag_b == 0:
        return 0.0

    cosine = dot / (math.sqrt(mag_a) * math.sqrt(mag_b))
    return round(min(1.0, cosine * 1.5), 4)   # light scaling for proxy
