"""
Skill Database — canonical skill list with categories, aliases, and normalization map.

Design: flat dict keyed by lowercase canonical name.
Each entry has category, aliases (variations that map to this skill),
and optional related/prerequisite hints used by the knowledge graph.

To add new skills: simply add entries to SKILLS_DB.
"""

SKILLS_DB = {
    # ── Programming Languages ─────────────────────────────────────────────
    "python": {
        "category": "programming_language",
        "display": "Python",
        "aliases": ["python3", "python2", "py"],
    },
    "javascript": {
        "category": "programming_language",
        "display": "JavaScript",
        "aliases": ["js", "ecmascript", "es6", "es2015", "vanilla js", "vanilla javascript"],
    },
    "typescript": {
        "category": "programming_language",
        "display": "TypeScript",
        "aliases": ["ts"],
    },
    "java": {
        "category": "programming_language",
        "display": "Java",
        "aliases": ["java8", "java11", "java17"],
    },
    "c++": {
        "category": "programming_language",
        "display": "C++",
        "aliases": ["cpp", "c plus plus"],
    },
    "c": {
        "category": "programming_language",
        "display": "C",
        "aliases": ["c language"],
    },
    "c#": {
        "category": "programming_language",
        "display": "C#",
        "aliases": ["csharp", "c sharp", "dotnet c#"],
    },
    "r": {
        "category": "programming_language",
        "display": "R",
        "aliases": ["r language", "r programming"],
    },
    "go": {
        "category": "programming_language",
        "display": "Go",
        "aliases": ["golang"],
    },
    "rust": {
        "category": "programming_language",
        "display": "Rust",
        "aliases": [],
    },
    "kotlin": {
        "category": "programming_language",
        "display": "Kotlin",
        "aliases": [],
    },
    "swift": {
        "category": "programming_language",
        "display": "Swift",
        "aliases": [],
    },
    "scala": {
        "category": "programming_language",
        "display": "Scala",
        "aliases": [],
    },
    "php": {
        "category": "programming_language",
        "display": "PHP",
        "aliases": [],
    },
    "ruby": {
        "category": "programming_language",
        "display": "Ruby",
        "aliases": [],
    },
    "shell": {
        "category": "programming_language",
        "display": "Shell Scripting",
        "aliases": ["bash", "bash scripting", "shell script", "zsh"],
    },
    "sql": {
        "category": "programming_language",
        "display": "SQL",
        "aliases": ["structured query language", "tsql", "plsql", "pl/sql"],
    },

    # ── Web Frameworks ────────────────────────────────────────────────────
    "react": {
        "category": "framework",
        "display": "React",
        "aliases": ["reactjs", "react.js", "react js"],
    },
    "angular": {
        "category": "framework",
        "display": "Angular",
        "aliases": ["angularjs", "angular.js", "angular2", "angular4"],
    },
    "vue": {
        "category": "framework",
        "display": "Vue.js",
        "aliases": ["vuejs", "vue.js", "vue js", "vue 3"],
    },
    "next.js": {
        "category": "framework",
        "display": "Next.js",
        "aliases": ["nextjs", "next js"],
    },
    "node.js": {
        "category": "framework",
        "display": "Node.js",
        "aliases": ["nodejs", "node js", "node"],
    },
    "express": {
        "category": "framework",
        "display": "Express.js",
        "aliases": ["expressjs", "express.js"],
    },
    "django": {
        "category": "framework",
        "display": "Django",
        "aliases": ["django rest framework", "drf"],
    },
    "flask": {
        "category": "framework",
        "display": "Flask",
        "aliases": [],
    },
    "fastapi": {
        "category": "framework",
        "display": "FastAPI",
        "aliases": ["fast api"],
    },
    "spring boot": {
        "category": "framework",
        "display": "Spring Boot",
        "aliases": ["spring", "springboot", "spring framework"],
    },
    "asp.net": {
        "category": "framework",
        "display": "ASP.NET",
        "aliases": ["aspnet", "asp.net core", "asp net"],
    },
    "laravel": {
        "category": "framework",
        "display": "Laravel",
        "aliases": [],
    },

    # ── ML / AI ───────────────────────────────────────────────────────────
    "machine learning": {
        "category": "ml_ai",
        "display": "Machine Learning",
        "aliases": ["ml", "machine-learning"],
    },
    "deep learning": {
        "category": "ml_ai",
        "display": "Deep Learning",
        "aliases": ["dl", "deep-learning", "neural networks", "ann"],
    },
    "natural language processing": {
        "category": "ml_ai",
        "display": "Natural Language Processing",
        "aliases": ["nlp", "natural language understanding", "nlu", "text mining"],
    },
    "computer vision": {
        "category": "ml_ai",
        "display": "Computer Vision",
        "aliases": ["cv", "image recognition", "image processing", "opencv"],
    },
    "reinforcement learning": {
        "category": "ml_ai",
        "display": "Reinforcement Learning",
        "aliases": ["rl", "reinforcement-learning"],
    },
    "data science": {
        "category": "ml_ai",
        "display": "Data Science",
        "aliases": ["data analytics", "statistical modeling"],
    },
    "tensorflow": {
        "category": "ml_ai",
        "display": "TensorFlow",
        "aliases": ["tf", "tensorflow2"],
    },
    "pytorch": {
        "category": "ml_ai",
        "display": "PyTorch",
        "aliases": ["torch"],
    },
    "keras": {
        "category": "ml_ai",
        "display": "Keras",
        "aliases": [],
    },
    "scikit-learn": {
        "category": "ml_ai",
        "display": "Scikit-learn",
        "aliases": ["sklearn", "scikit learn"],
    },
    "hugging face": {
        "category": "ml_ai",
        "display": "Hugging Face Transformers",
        "aliases": ["transformers", "huggingface", "hf transformers"],
    },
    "openai": {
        "category": "ml_ai",
        "display": "OpenAI API",
        "aliases": ["openai api", "gpt", "chatgpt api"],
    },
    "langchain": {
        "category": "ml_ai",
        "display": "LangChain",
        "aliases": ["lang chain"],
    },
    "llm": {
        "category": "ml_ai",
        "display": "Large Language Models",
        "aliases": ["large language model", "llms"],
    },

    # ── Data Engineering ─────────────────────────────────────────────────
    "pandas": {
        "category": "data_engineering",
        "display": "Pandas",
        "aliases": [],
    },
    "numpy": {
        "category": "data_engineering",
        "display": "NumPy",
        "aliases": ["numpy"],
    },
    "matplotlib": {
        "category": "data_engineering",
        "display": "Matplotlib",
        "aliases": [],
    },
    "seaborn": {
        "category": "data_engineering",
        "display": "Seaborn",
        "aliases": [],
    },
    "apache spark": {
        "category": "data_engineering",
        "display": "Apache Spark",
        "aliases": ["spark", "pyspark", "py spark"],
    },
    "apache kafka": {
        "category": "data_engineering",
        "display": "Apache Kafka",
        "aliases": ["kafka"],
    },
    "airflow": {
        "category": "data_engineering",
        "display": "Apache Airflow",
        "aliases": ["apache airflow"],
    },
    "dbt": {
        "category": "data_engineering",
        "display": "dbt",
        "aliases": ["data build tool"],
    },
    "tableau": {
        "category": "data_engineering",
        "display": "Tableau",
        "aliases": [],
    },
    "power bi": {
        "category": "data_engineering",
        "display": "Power BI",
        "aliases": ["powerbi", "microsoft power bi"],
    },

    # ── Databases ─────────────────────────────────────────────────────────
    "mysql": {
        "category": "database",
        "display": "MySQL",
        "aliases": [],
    },
    "postgresql": {
        "category": "database",
        "display": "PostgreSQL",
        "aliases": ["postgres", "pg", "psql"],
    },
    "mongodb": {
        "category": "database",
        "display": "MongoDB",
        "aliases": ["mongo"],
    },
    "sqlite": {
        "category": "database",
        "display": "SQLite",
        "aliases": [],
    },
    "redis": {
        "category": "database",
        "display": "Redis",
        "aliases": [],
    },
    "elasticsearch": {
        "category": "database",
        "display": "Elasticsearch",
        "aliases": ["elastic search", "elk"],
    },
    "oracle": {
        "category": "database",
        "display": "Oracle DB",
        "aliases": ["oracle database", "oracle sql"],
    },
    "cassandra": {
        "category": "database",
        "display": "Apache Cassandra",
        "aliases": [],
    },
    "neo4j": {
        "category": "database",
        "display": "Neo4j",
        "aliases": ["graph database"],
    },

    # ── Cloud ─────────────────────────────────────────────────────────────
    "aws": {
        "category": "cloud",
        "display": "AWS",
        "aliases": ["amazon web services", "amazon aws"],
    },
    "azure": {
        "category": "cloud",
        "display": "Microsoft Azure",
        "aliases": ["microsoft azure", "azure cloud"],
    },
    "gcp": {
        "category": "cloud",
        "display": "Google Cloud Platform",
        "aliases": ["google cloud", "google cloud platform"],
    },

    # ── DevOps / Infrastructure ───────────────────────────────────────────
    "docker": {
        "category": "devops",
        "display": "Docker",
        "aliases": ["containerization", "docker container"],
    },
    "kubernetes": {
        "category": "devops",
        "display": "Kubernetes",
        "aliases": ["k8s", "k8", "kube"],
    },
    "terraform": {
        "category": "devops",
        "display": "Terraform",
        "aliases": ["tf", "infrastructure as code"],
    },
    "jenkins": {
        "category": "devops",
        "display": "Jenkins",
        "aliases": [],
    },
    "github actions": {
        "category": "devops",
        "display": "GitHub Actions",
        "aliases": ["gh actions"],
    },
    "ci/cd": {
        "category": "devops",
        "display": "CI/CD",
        "aliases": ["ci cd", "continuous integration", "continuous deployment", "continuous delivery"],
    },
    "ansible": {
        "category": "devops",
        "display": "Ansible",
        "aliases": [],
    },
    "git": {
        "category": "devops",
        "display": "Git",
        "aliases": ["github", "gitlab", "version control"],
    },
    "linux": {
        "category": "devops",
        "display": "Linux",
        "aliases": ["ubuntu", "centos", "debian", "unix"],
    },

    # ── Mobile ─────────────────────────────────────────────────────────────
    "react native": {
        "category": "mobile",
        "display": "React Native",
        "aliases": ["reactnative"],
    },
    "flutter": {
        "category": "mobile",
        "display": "Flutter",
        "aliases": [],
    },
    "android": {
        "category": "mobile",
        "display": "Android Development",
        "aliases": ["android sdk", "android studio"],
    },
    "ios": {
        "category": "mobile",
        "display": "iOS Development",
        "aliases": ["xcode", "swift ios"],
    },

    # ── Testing ────────────────────────────────────────────────────────────
    "unit testing": {
        "category": "testing",
        "display": "Unit Testing",
        "aliases": ["unittest", "pytest", "junit", "mocha", "jest", "testing"],
    },
    "selenium": {
        "category": "testing",
        "display": "Selenium",
        "aliases": ["selenium webdriver"],
    },

    # ── Soft / Domain Skills ──────────────────────────────────────────────
    "agile": {
        "category": "methodology",
        "display": "Agile",
        "aliases": ["scrum", "kanban", "agile development", "sprint"],
    },
    "system design": {
        "category": "methodology",
        "display": "System Design",
        "aliases": ["distributed systems", "software architecture", "microservices"],
    },
    "rest api": {
        "category": "methodology",
        "display": "REST API",
        "aliases": ["restful api", "rest", "restful", "api design"],
    },
    "graphql": {
        "category": "methodology",
        "display": "GraphQL",
        "aliases": [],
    },
    "microservices": {
        "category": "methodology",
        "display": "Microservices",
        "aliases": ["microservice architecture", "micro services"],
    },
    "object oriented programming": {
        "category": "methodology",
        "display": "Object-Oriented Programming",
        "aliases": ["oop", "object oriented", "object-oriented design"],
    },
}


# ── Build normalisation lookup ────────────────────────────────────────────────

_NORMALISE_MAP: dict[str, str] = {}

def _build_normalise_map():
    for canonical, info in SKILLS_DB.items():
        _NORMALISE_MAP[canonical.lower()] = canonical
        for alias in info.get("aliases", []):
            _NORMALISE_MAP[alias.lower()] = canonical

_build_normalise_map()


def normalize_skill(raw: str) -> str | None:
    """
    Return canonical skill name for a raw string, or None if not recognized.
    Uses exact match first, then fuzzy matching.
    """
    key = raw.strip().lower()
    if key in _NORMALISE_MAP:
        return _NORMALISE_MAP[key]

    # Fuzzy fallback using rapidfuzz
    try:
        from rapidfuzz import process, fuzz
        result = process.extractOne(key, list(_NORMALISE_MAP.keys()),
                                    scorer=fuzz.ratio, score_cutoff=88)
        if result:
            return _NORMALISE_MAP[result[0]]
    except ImportError:
        pass

    return None


def get_skill_info(canonical: str) -> dict | None:
    return SKILLS_DB.get(canonical.lower())


def get_all_canonical_skills() -> list[str]:
    return list(SKILLS_DB.keys())
