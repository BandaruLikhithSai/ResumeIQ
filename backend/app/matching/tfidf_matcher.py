"""
TF-IDF based text similarity between resume and job description.
Uses scikit-learn's TfidfVectorizer with cosine similarity.
"""
import logging
import re

logger = logging.getLogger(__name__)

# Lazy-load to avoid startup cost
_vectorizer = None


def _get_vectorizer():
    global _vectorizer
    if _vectorizer is None:
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            _vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                max_features=5000,
                sublinear_tf=True,
            )
        except ImportError:
            logger.warning("scikit-learn not available; TF-IDF will use fallback")
            _vectorizer = None
    return _vectorizer


def compute_tfidf_score(resume_text: str, job_text: str) -> float:
    """
    Compute cosine similarity between resume and job description using TF-IDF.
    Returns a float in [0, 1].
    """
    if not resume_text or not job_text:
        return 0.0

    # Try scikit-learn
    vectorizer = _get_vectorizer()
    if vectorizer is not None:
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            tfidf = vectorizer.fit_transform([resume_text, job_text])
            score = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
            return round(float(score), 4)
        except Exception as exc:
            logger.warning("TF-IDF cosine failed: %s, using fallback", exc)

    # Fallback: Jaccard similarity on token sets
    return _jaccard_similarity(resume_text, job_text)


def _tokenize(text: str) -> set[str]:
    text = text.lower()
    tokens = re.findall(r"\b[a-z][a-z0-9+#]{1,}\b", text)
    stopwords = {"the", "a", "an", "and", "or", "of", "to", "in", "for",
                 "is", "are", "was", "were", "be", "been", "with", "on",
                 "at", "by", "from", "as", "we", "you", "our", "your", "their"}
    return {t for t in tokens if t not in stopwords}


def _jaccard_similarity(text_a: str, text_b: str) -> float:
    set_a = _tokenize(text_a)
    set_b = _tokenize(text_b)
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return round(len(intersection) / len(union), 4)
