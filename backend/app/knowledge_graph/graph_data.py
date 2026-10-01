"""
Static knowledge graph data.
Each entry: (source_skill, relationship, target_skill, weight)

Relationship types:
  prerequisite_of   — source is a prerequisite of target
  related_to        — bidirectional similarity
  supports          — source enables/supports target
  transferable_to   — skills learned in source transfer partially to target
  part_of           — source is a specialisation of target
"""

GRAPH_EDGES = [
    # ── Programming Language chains ───────────────────────────────────────
    ("python",                  "prerequisite_of",  "machine learning",         0.85),
    ("python",                  "prerequisite_of",  "data science",             0.85),
    ("python",                  "prerequisite_of",  "natural language processing", 0.80),
    ("python",                  "prerequisite_of",  "deep learning",            0.75),
    ("python",                  "supports",         "django",                   0.90),
    ("python",                  "supports",         "flask",                    0.90),
    ("python",                  "supports",         "fastapi",                  0.90),
    ("python",                  "supports",         "pandas",                   0.90),
    ("python",                  "supports",         "numpy",                    0.90),
    ("python",                  "supports",         "scikit-learn",             0.85),
    ("python",                  "supports",         "tensorflow",               0.80),
    ("python",                  "supports",         "pytorch",                  0.80),

    ("javascript",              "prerequisite_of",  "react",                    0.85),
    ("javascript",              "prerequisite_of",  "angular",                  0.85),
    ("javascript",              "prerequisite_of",  "vue",                      0.85),
    ("javascript",              "prerequisite_of",  "node.js",                  0.85),
    ("javascript",              "prerequisite_of",  "next.js",                  0.80),
    ("typescript",              "related_to",       "javascript",               0.90),
    ("typescript",              "prerequisite_of",  "react",                    0.80),
    ("typescript",              "prerequisite_of",  "angular",                  0.85),

    ("java",                    "prerequisite_of",  "spring boot",              0.85),
    ("java",                    "supports",         "android",                  0.80),
    ("java",                    "related_to",       "object oriented programming", 0.90),
    ("kotlin",                  "related_to",       "java",                     0.85),
    ("kotlin",                  "supports",         "android",                  0.90),

    ("sql",                     "prerequisite_of",  "postgresql",               0.85),
    ("sql",                     "prerequisite_of",  "mysql",                    0.85),
    ("sql",                     "prerequisite_of",  "sqlite",                   0.85),
    ("sql",                     "related_to",       "data science",             0.75),
    ("sql",                     "related_to",       "data engineering",         0.80),

    # ── ML / AI chains ────────────────────────────────────────────────────
    ("machine learning",        "prerequisite_of",  "deep learning",            0.80),
    ("machine learning",        "prerequisite_of",  "natural language processing", 0.75),
    ("machine learning",        "prerequisite_of",  "computer vision",          0.70),
    ("machine learning",        "related_to",       "data science",             0.85),
    ("machine learning",        "related_to",       "scikit-learn",             0.80),

    ("deep learning",           "supports",         "natural language processing", 0.80),
    ("deep learning",           "supports",         "computer vision",          0.85),
    ("deep learning",           "related_to",       "tensorflow",               0.90),
    ("deep learning",           "related_to",       "pytorch",                  0.90),
    ("deep learning",           "related_to",       "keras",                    0.85),

    ("natural language processing", "related_to",  "hugging face",             0.85),
    ("natural language processing", "related_to",  "transformer",              0.80),
    ("natural language processing", "related_to",  "llm",                      0.75),

    ("tensorflow",              "related_to",       "keras",                    0.90),
    ("tensorflow",              "transferable_to",  "pytorch",                  0.75),
    ("pytorch",                 "transferable_to",  "tensorflow",               0.75),
    ("scikit-learn",            "transferable_to",  "machine learning",         0.80),

    # ── Data chain ────────────────────────────────────────────────────────
    ("pandas",                  "related_to",       "numpy",                    0.85),
    ("pandas",                  "part_of",          "data science",             0.80),
    ("numpy",                   "part_of",          "data science",             0.80),
    ("matplotlib",              "related_to",       "seaborn",                  0.85),
    ("apache spark",            "related_to",       "data engineering",         0.85),
    ("apache kafka",            "related_to",       "data engineering",         0.80),
    ("tableau",                 "transferable_to",  "power bi",                 0.70),
    ("power bi",                "transferable_to",  "tableau",                  0.70),

    # ── Cloud / DevOps chain ──────────────────────────────────────────────
    ("docker",                  "prerequisite_of",  "kubernetes",               0.80),
    ("docker",                  "related_to",       "ci/cd",                    0.75),
    ("kubernetes",              "related_to",       "aws",                      0.65),
    ("kubernetes",              "related_to",       "gcp",                      0.65),
    ("kubernetes",              "related_to",       "azure",                    0.65),
    ("aws",                     "related_to",       "azure",                    0.70),
    ("aws",                     "related_to",       "gcp",                      0.70),
    ("azure",                   "transferable_to",  "aws",                      0.70),
    ("gcp",                     "transferable_to",  "aws",                      0.70),
    ("terraform",               "related_to",       "aws",                      0.75),
    ("terraform",               "related_to",       "kubernetes",               0.75),
    ("jenkins",                 "related_to",       "ci/cd",                    0.85),
    ("github actions",          "related_to",       "ci/cd",                    0.85),
    ("linux",                   "supports",         "docker",                   0.75),
    ("linux",                   "supports",         "kubernetes",               0.70),

    # ── Web / Backend chain ───────────────────────────────────────────────
    ("react",                   "related_to",       "next.js",                  0.80),
    ("react",                   "transferable_to",  "vue",                      0.65),
    ("react",                   "transferable_to",  "angular",                  0.60),
    ("node.js",                 "related_to",       "express",                  0.90),
    ("django",                  "related_to",       "rest api",                 0.80),
    ("fastapi",                 "related_to",       "rest api",                 0.80),
    ("flask",                   "related_to",       "rest api",                 0.75),
    ("spring boot",             "related_to",       "microservices",            0.80),
    ("rest api",                "related_to",       "graphql",                  0.65),
    ("microservices",           "related_to",       "docker",                   0.70),
    ("microservices",           "related_to",       "kubernetes",               0.75),

    # ── Mobile chain ─────────────────────────────────────────────────────
    ("react",                   "transferable_to",  "react native",             0.80),
    ("javascript",              "supports",         "react native",             0.75),
    ("kotlin",                  "related_to",       "android",                  0.90),
    ("swift",                   "related_to",       "ios",                      0.90),

    # ── Methodology ──────────────────────────────────────────────────────
    ("object oriented programming", "supports",    "java",                     0.80),
    ("object oriented programming", "supports",    "python",                   0.75),
    ("object oriented programming", "supports",    "c++",                      0.80),
    ("git",                     "related_to",       "ci/cd",                    0.70),
    ("agile",                   "related_to",       "system design",            0.65),
    ("system design",           "related_to",       "microservices",            0.75),
    ("system design",           "related_to",       "rest api",                 0.70),
]


def get_all_edges():
    return GRAPH_EDGES
