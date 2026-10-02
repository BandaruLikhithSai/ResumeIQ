"""
Demo data seed script.
Run once after db.create_all():   python seed_demo.py

Creates:
  - 2 demo users (candidate + recruiter)
  - 5 demo resumes with parsed skills
  - 3 demo job descriptions
  - Pre-run analyses for immediate demo
"""
import json
import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import User, Resume, ExtractedSkill, Job, JobSkill, Analysis, SkillMatch, SkillGap
from app.matching.engine import MatchingEngine
from app.explainability.explainer import generate_explanation
from app.explainability.skill_gap import generate_skill_gaps
from app.matching.kg_matcher import match_skills


# ── Demo Resumes ──────────────────────────────────────────────────────────────

DEMO_RESUMES = [
    {
        "candidate_name": "Aisha Patel",
        "email": "aisha.patel@example.com",
        "phone": "+91 9876543210",
        "filename": "aisha_patel_resume.pdf",
        "file_type": "pdf",
        "total_experience_months": 30,
        "education": [{"degree": "Bachelor's", "college": "IIT Bombay", "year": "2022", "gpa": "8.7"}],
        "experience": [
            {"title": "ML Engineer Intern", "company": "DataTech Labs", "start_date": "Jun 2021", "end_date": "Dec 2021", "duration_months": 6, "description": "Built NLP models for text classification, worked with Python, scikit-learn and pandas."},
            {"title": "Junior Data Scientist", "company": "Analytics Corp", "start_date": "Jan 2022", "end_date": "Jul 2024", "duration_months": 30, "description": "Developed machine learning pipelines, natural language processing systems using Python, TensorFlow and SQL."},
        ],
        "projects": [
            {"name": "Fake News Detection", "description": "NLP-based fake news classifier using BERT, achieved 94% accuracy"},
            {"name": "Customer Churn Prediction", "description": "Machine learning model using Python, scikit-learn, pandas, and SQL"},
        ],
        "certifications": [{"name": "TensorFlow Developer Certificate", "year": "2023"}],
        "raw_text": "Aisha Patel | aisha.patel@example.com | +91 9876543210\n\nSkills: Python, Machine Learning, NLP, Deep Learning, TensorFlow, scikit-learn, Pandas, SQL, NumPy\n\nWork Experience:\nJunior Data Scientist at Analytics Corp (Jan 2022 - Jul 2024)\n- Developed ML pipelines using Python and TensorFlow\n- NLP text classification systems\n- SQL database queries for data extraction\n\nML Engineer Intern at DataTech Labs (Jun 2021 - Dec 2021)\n- Text classification using scikit-learn\n- Data processing with pandas\n\nProjects:\nFake News Detection - NLP classifier using BERT, 94% accuracy\nCustomer Churn Prediction - ML model with scikit-learn and pandas\n\nEducation:\nB.Tech Computer Science, IIT Bombay, 2022, CGPA 8.7\n\nCertifications:\nTensorFlow Developer Certificate 2023",
        "skills": ["python", "machine learning", "natural language processing", "deep learning",
                   "tensorflow", "scikit-learn", "pandas", "sql", "numpy", "keras"],
    },
    {
        "candidate_name": "Rahul Sharma",
        "email": "rahul.sharma@example.com",
        "phone": "+91 8765432109",
        "filename": "rahul_sharma_resume.pdf",
        "file_type": "pdf",
        "total_experience_months": 48,
        "education": [{"degree": "Bachelor's", "college": "BITS Pilani", "year": "2020", "gpa": "7.9"}],
        "experience": [
            {"title": "Backend Developer", "company": "TechSolutions Pvt Ltd", "start_date": "Aug 2020", "end_date": "Jul 2024", "duration_months": 48, "description": "Java Spring Boot microservices, Docker, Kubernetes, PostgreSQL, Redis, REST API design."},
        ],
        "projects": [
            {"name": "E-Commerce Platform", "description": "Spring Boot microservices with Docker and Kubernetes deployment"},
            {"name": "Real-time Chat App", "description": "WebSocket-based chat using Java, Redis, and PostgreSQL"},
        ],
        "certifications": [{"name": "AWS Certified Developer Associate", "year": "2023"}],
        "raw_text": "Rahul Sharma | rahul.sharma@example.com | +91 8765432109\n\nSkills: Java, Spring Boot, Docker, Kubernetes, PostgreSQL, Redis, AWS, REST API, Microservices, Git\n\nWork Experience:\nBackend Developer at TechSolutions Pvt Ltd (Aug 2020 - Jul 2024)\n- Designed microservices using Java Spring Boot\n- Deployed applications with Docker and Kubernetes\n- Database management with PostgreSQL and Redis\n- AWS cloud deployments\n\nProjects:\nE-Commerce Platform - Spring Boot microservices with Docker, Kubernetes\nReal-time Chat App - Java, Redis, PostgreSQL\n\nEducation:\nB.E. Computer Science, BITS Pilani, 2020, CGPA 7.9\n\nCertifications:\nAWS Certified Developer Associate 2023",
        "skills": ["java", "spring boot", "docker", "kubernetes", "postgresql", "redis",
                   "aws", "rest api", "microservices", "git", "ci/cd"],
    },
    {
        "candidate_name": "Priya Nair",
        "email": "priya.nair@example.com",
        "phone": "+91 7654321098",
        "filename": "priya_nair_resume.pdf",
        "file_type": "pdf",
        "total_experience_months": 18,
        "education": [{"degree": "Master's", "college": "NIT Trichy", "year": "2023", "gpa": "9.1"}],
        "experience": [
            {"title": "Computer Vision Intern", "company": "VisionAI Labs", "start_date": "Jan 2022", "end_date": "Jun 2022", "duration_months": 6, "description": "Object detection using PyTorch and OpenCV. Deployed models using Flask."},
            {"title": "AI Research Associate", "company": "Research Institute", "start_date": "Jul 2023", "end_date": "Dec 2024", "duration_months": 18, "description": "Deep learning research, PyTorch, TensorFlow, computer vision, NLP using Hugging Face transformers."},
        ],
        "projects": [
            {"name": "Medical Image Segmentation", "description": "U-Net architecture with PyTorch for tumor detection, 91% dice score"},
            {"name": "Sentiment Analysis API", "description": "Hugging Face transformers, Flask REST API"},
        ],
        "certifications": [{"name": "Deep Learning Specialization (Coursera)", "year": "2022"}],
        "raw_text": "Priya Nair | priya.nair@example.com | +91 7654321098\n\nSkills: Python, Deep Learning, Computer Vision, PyTorch, TensorFlow, NLP, Hugging Face, NumPy, OpenCV, Flask\n\nWork Experience:\nAI Research Associate at Research Institute (Jul 2023 - Dec 2024)\n- Deep learning research with PyTorch and TensorFlow\n- Computer vision and NLP using Hugging Face transformers\n\nComputer Vision Intern at VisionAI Labs (Jan 2022 - Jun 2022)\n- Object detection using PyTorch and OpenCV\n- Flask API deployment\n\nProjects:\nMedical Image Segmentation - U-Net with PyTorch, 91% dice score\nSentiment Analysis API - Hugging Face, Flask REST API\n\nEducation:\nM.Tech AI, NIT Trichy, 2023, CGPA 9.1\n\nCertifications:\nDeep Learning Specialization Coursera 2022",
        "skills": ["python", "deep learning", "computer vision", "pytorch", "tensorflow",
                   "natural language processing", "hugging face", "numpy", "flask", "keras"],
    },
    {
        "candidate_name": "Arjun Mehta",
        "email": "arjun.mehta@example.com",
        "phone": "+91 6543210987",
        "filename": "arjun_mehta_resume.pdf",
        "file_type": "pdf",
        "total_experience_months": 12,
        "education": [{"degree": "Bachelor's", "college": "VIT University", "year": "2023", "gpa": "8.2"}],
        "experience": [
            {"title": "Frontend Developer Intern", "company": "StartupXYZ", "start_date": "Jan 2023", "end_date": "Jun 2023", "duration_months": 6, "description": "React.js, TypeScript, Tailwind CSS, REST API integration."},
            {"title": "Junior Full Stack Developer", "company": "WebAgency Co", "start_date": "Jul 2023", "end_date": "Jul 2024", "duration_months": 12, "description": "React, Node.js, MongoDB, Express.js, REST API development."},
        ],
        "projects": [
            {"name": "Task Management App", "description": "React, Node.js, MongoDB full-stack application"},
            {"name": "Portfolio Website", "description": "Next.js, TypeScript, Tailwind CSS"},
        ],
        "certifications": [],
        "raw_text": "Arjun Mehta | arjun.mehta@example.com | +91 6543210987\n\nSkills: JavaScript, TypeScript, React, Node.js, MongoDB, Express.js, REST API, Git, Tailwind CSS\n\nWork Experience:\nJunior Full Stack Developer at WebAgency Co (Jul 2023 - Jul 2024)\n- React.js frontend development\n- Node.js and Express.js backend\n- MongoDB database management\n- REST API design\n\nFrontend Developer Intern at StartupXYZ (Jan 2023 - Jun 2023)\n- React and TypeScript frontend\n- Tailwind CSS styling\n\nProjects:\nTask Management App - React, Node.js, MongoDB\nPortfolio Website - Next.js, TypeScript, Tailwind CSS\n\nEducation:\nB.Tech IT, VIT University, 2023, CGPA 8.2",
        "skills": ["javascript", "typescript", "react", "node.js", "mongodb", "express",
                   "rest api", "git", "next.js"],
    },
    {
        "candidate_name": "Sneha Reddy",
        "email": "sneha.reddy@example.com",
        "phone": "+91 5432109876",
        "filename": "sneha_reddy_resume.pdf",
        "file_type": "pdf",
        "total_experience_months": 60,
        "education": [{"degree": "Master's", "college": "IIIT Hyderabad", "year": "2019", "gpa": "8.8"}],
        "experience": [
            {"title": "Data Engineer", "company": "BigData Corp", "start_date": "Aug 2019", "end_date": "Present", "duration_months": 60, "description": "Apache Spark, Kafka, Airflow, AWS, Python, SQL. Built data pipelines processing 10TB+ daily."},
        ],
        "projects": [
            {"name": "Real-time Analytics Pipeline", "description": "Apache Kafka, Spark Streaming, AWS S3, Python"},
            {"name": "ETL Framework", "description": "Apache Airflow, Python, PostgreSQL, AWS"},
        ],
        "certifications": [
            {"name": "AWS Solutions Architect Associate", "year": "2022"},
            {"name": "Google Cloud Professional Data Engineer", "year": "2023"},
        ],
        "raw_text": "Sneha Reddy | sneha.reddy@example.com | +91 5432109876\n\nSkills: Python, Apache Spark, Kafka, Airflow, AWS, GCP, SQL, PostgreSQL, Docker, Data Engineering\n\nWork Experience:\nData Engineer at BigData Corp (Aug 2019 - Present)\n- Built Apache Spark pipelines processing 10TB+ daily\n- Real-time streaming with Kafka\n- Workflow orchestration with Airflow\n- AWS cloud infrastructure\n\nProjects:\nReal-time Analytics Pipeline - Kafka, Spark Streaming, AWS\nETL Framework - Airflow, Python, PostgreSQL, AWS\n\nEducation:\nM.Tech Data Science, IIIT Hyderabad, 2019, CGPA 8.8\n\nCertifications:\nAWS Solutions Architect Associate 2022\nGoogle Cloud Professional Data Engineer 2023",
        "skills": ["python", "apache spark", "apache kafka", "airflow", "aws", "gcp", "sql",
                   "postgresql", "docker", "data science", "machine learning"],
    },
]

# ── Demo Jobs ─────────────────────────────────────────────────────────────────

DEMO_JOBS = [
    {
        "title": "Machine Learning Engineer",
        "company": "AI Innovations Ltd",
        "domain": "Machine Learning / AI",
        "raw_text": """Machine Learning Engineer

AI Innovations Ltd | Hyderabad, India

About the Role:
We are looking for a skilled Machine Learning Engineer to join our AI team.

Required Skills:
- Python (3+ years)
- Machine Learning
- Deep Learning
- TensorFlow or PyTorch
- Natural Language Processing (NLP)
- SQL
- Data manipulation with Pandas and NumPy

Preferred Skills:
- Kubernetes
- Docker
- MLflow or similar experiment tracking
- Cloud (AWS or GCP)

Requirements:
- Bachelor's or Master's degree in Computer Science, AI, or related field
- 2+ years of experience in ML/AI
- Experience deploying ML models to production

Responsibilities:
- Design and implement machine learning models
- Build NLP pipelines for text processing
- Optimize model performance
- Deploy models using containerized infrastructure
- Collaborate with data engineers on data pipelines""",
        "required_experience_years": 2,
        "education_requirement": "bachelor",
        "required_skills": [
            {"raw_skill": "Python", "normalized_skill": "python", "category": "programming_language", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "Machine Learning", "normalized_skill": "machine learning", "category": "ml_ai", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "Deep Learning", "normalized_skill": "deep learning", "category": "ml_ai", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "TensorFlow", "normalized_skill": "tensorflow", "category": "ml_ai", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "Natural Language Processing", "normalized_skill": "natural language processing", "category": "ml_ai", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "SQL", "normalized_skill": "sql", "category": "programming_language", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "Pandas", "normalized_skill": "pandas", "category": "data_engineering", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "Kubernetes", "normalized_skill": "kubernetes", "category": "devops", "priority": "preferred", "importance_weight": 0.7},
            {"raw_skill": "Docker", "normalized_skill": "docker", "category": "devops", "priority": "preferred", "importance_weight": 0.7},
            {"raw_skill": "AWS", "normalized_skill": "aws", "category": "cloud", "priority": "preferred", "importance_weight": 0.6},
        ],
    },
    {
        "title": "Senior Backend Developer",
        "company": "CloudScale Technologies",
        "domain": "Software Development",
        "raw_text": """Senior Backend Developer

CloudScale Technologies | Bangalore, India

About the Role:
We need an experienced backend developer to build scalable microservices.

Required Skills:
- Java (Spring Boot)
- Microservices Architecture
- Docker
- Kubernetes
- PostgreSQL or MySQL
- REST API Design
- Git

Preferred Skills:
- AWS or Azure
- Redis
- Kafka
- CI/CD pipelines

Requirements:
- Bachelor's degree in Computer Science or equivalent
- 3+ years of backend development experience
- Experience with cloud deployments

Responsibilities:
- Design and develop microservices using Spring Boot
- Implement CI/CD pipelines
- Database design and optimization
- Code review and mentorship""",
        "required_experience_years": 3,
        "education_requirement": "bachelor",
        "required_skills": [
            {"raw_skill": "Java", "normalized_skill": "java", "category": "programming_language", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "Spring Boot", "normalized_skill": "spring boot", "category": "framework", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "Docker", "normalized_skill": "docker", "category": "devops", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "Kubernetes", "normalized_skill": "kubernetes", "category": "devops", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "PostgreSQL", "normalized_skill": "postgresql", "category": "database", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "REST API", "normalized_skill": "rest api", "category": "methodology", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "Microservices", "normalized_skill": "microservices", "category": "methodology", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "AWS", "normalized_skill": "aws", "category": "cloud", "priority": "preferred", "importance_weight": 0.7},
            {"raw_skill": "Redis", "normalized_skill": "redis", "category": "database", "priority": "preferred", "importance_weight": 0.7},
            {"raw_skill": "CI/CD", "normalized_skill": "ci/cd", "category": "devops", "priority": "preferred", "importance_weight": 0.6},
        ],
    },
    {
        "title": "Full Stack Developer",
        "company": "ProductHive",
        "domain": "Software Development",
        "raw_text": """Full Stack Developer

ProductHive | Remote

About the Role:
Build modern web applications from frontend to backend.

Required Skills:
- React (or Angular/Vue)
- JavaScript / TypeScript
- Node.js
- MongoDB or PostgreSQL
- REST API
- Git

Preferred Skills:
- Next.js
- Docker
- AWS
- TypeScript

Requirements:
- Bachelor's degree or equivalent experience
- 1+ years of full-stack development experience
- Portfolio of completed projects

Responsibilities:
- Develop and maintain frontend components in React
- Build RESTful APIs with Node.js
- Database design and management
- Deploy and maintain web applications""",
        "required_experience_years": 1,
        "education_requirement": "bachelor",
        "required_skills": [
            {"raw_skill": "React", "normalized_skill": "react", "category": "framework", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "JavaScript", "normalized_skill": "javascript", "category": "programming_language", "priority": "required", "importance_weight": 1.0},
            {"raw_skill": "Node.js", "normalized_skill": "node.js", "category": "framework", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "MongoDB", "normalized_skill": "mongodb", "category": "database", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "REST API", "normalized_skill": "rest api", "category": "methodology", "priority": "required", "importance_weight": 0.8},
            {"raw_skill": "TypeScript", "normalized_skill": "typescript", "category": "programming_language", "priority": "required", "importance_weight": 0.9},
            {"raw_skill": "Git", "normalized_skill": "git", "category": "devops", "priority": "required", "importance_weight": 0.7},
            {"raw_skill": "Next.js", "normalized_skill": "next.js", "category": "framework", "priority": "preferred", "importance_weight": 0.6},
            {"raw_skill": "Docker", "normalized_skill": "docker", "category": "devops", "priority": "preferred", "importance_weight": 0.5},
        ],
    },
]


def seed(app=None):
    """
    Seed demo data.

    - Called from wsgi.py on every cold start with the existing app instance.
    - Called standalone (python seed_demo.py) with no argument — creates its own app.
    - Fully idempotent: checks for existing demo user before inserting anything.
    """
    if app is None:
        # Standalone mode: create app + push context ourselves
        _app = create_app()
        with _app.app_context():
            db.create_all()
            _do_seed()
    else:
        # Called from inside an existing app context (e.g. wsgi.py)
        db.create_all()
        _do_seed()


def _do_seed():
    # ── Demo Users ────────────────────────────────────────────────────────
    demo_candidate = User.query.filter_by(email="demo_candidate@resumeiq.demo").first()
    if not demo_candidate:
        demo_candidate = User(
            email="demo_candidate@resumeiq.demo",
            full_name="Demo Candidate",
            role="candidate",
            is_demo=True,
        )
        demo_candidate.set_password("demo1234")
        db.session.add(demo_candidate)

    demo_recruiter = User.query.filter_by(email="demo_recruiter@resumeiq.demo").first()
    if not demo_recruiter:
        demo_recruiter = User(
            email="demo_recruiter@resumeiq.demo",
            full_name="Demo Recruiter",
            role="recruiter",
            is_demo=True,
        )
        demo_recruiter.set_password("demo1234")
        db.session.add(demo_recruiter)

    db.session.flush()

    # ── Demo Jobs ─────────────────────────────────────────────────────────
    jobs = []
    for jd in DEMO_JOBS:
        job = Job(
            user_id=demo_recruiter.id,
            title=jd["title"],
            company=jd["company"],
            domain=jd["domain"],
            raw_text=jd["raw_text"],
            required_experience_years=jd["required_experience_years"],
            education_requirement=jd["education_requirement"],
            responsibilities_json=json.dumps([]),
            extraction_status="done",
            is_demo=True,
        )
        db.session.add(job)
        db.session.flush()

        for skill_data in jd["required_skills"]:
            js = JobSkill(
                job_id=job.id,
                raw_skill=skill_data["raw_skill"],
                normalized_skill=skill_data["normalized_skill"],
                category=skill_data["category"],
                priority=skill_data["priority"],
                importance_weight=skill_data["importance_weight"],
            )
            db.session.add(js)
        jobs.append(job)

    db.session.flush()

    # ── Demo Resumes + Analyses ───────────────────────────────────────────
    engine = MatchingEngine(weights={"tfidf": 0.25, "semantic": 0.30, "kg": 0.25, "experience": 0.20})

    for resume_data in DEMO_RESUMES:
        resume = Resume(
            user_id=demo_candidate.id,
            filename=resume_data["filename"],
            file_type=resume_data["file_type"],
            file_size=50000,
            raw_text=resume_data["raw_text"],
            extraction_status="done",
            is_demo=True,
            candidate_name=resume_data["candidate_name"],
            email=resume_data["email"],
            phone=resume_data["phone"],
            education_json=json.dumps(resume_data["education"]),
            experience_json=json.dumps(resume_data["experience"]),
            projects_json=json.dumps(resume_data["projects"]),
            certifications_json=json.dumps(resume_data["certifications"]),
            total_experience_months=resume_data["total_experience_months"],
        )
        db.session.add(resume)
        db.session.flush()

        for skill_name in resume_data["skills"]:
            skill = ExtractedSkill(
                resume_id=resume.id,
                raw_skill=skill_name,
                normalized_skill=skill_name,
                category="other",
                confidence=1.0,
                source_section="skills",
                evidence_text=f"{skill_name} found in skills section",
            )
            db.session.add(skill)

        db.session.flush()

        # Run analysis against ML Engineer job (job 0)
        job = jobs[0]
        candidate_skills = resume_data["skills"]
        job_skills = [s.__dict__ for s in db.session.query(JobSkill).filter_by(job_id=job.id).all()]
        job_skills_clean = [
            {k: v for k, v in s.items() if not k.startswith("_")}
            for s in job_skills
        ]

        result = engine.run(
            resume_text=resume_data["raw_text"],
            job_text=job.raw_text,
            resume_data={
                "education": resume_data["education"],
                "experience": resume_data["experience"],
                "projects": resume_data["projects"],
                "total_experience_months": resume_data["total_experience_months"],
            },
            job_data={
                "required_experience_years": job.required_experience_years,
                "education_requirement": job.education_requirement,
                "responsibilities": [],
            },
            candidate_skills=candidate_skills,
            job_skills=job_skills_clean,
        )

        explanation = generate_explanation(
            result,
            resume_data={
                "candidate_name": resume_data["candidate_name"],
                "education": resume_data["education"],
                "experience": resume_data["experience"],
            },
            job_data={"title": job.title},
        )

        skill_gaps_data = generate_skill_gaps(
            skill_matches=result["skill_matches"],
            job_skills=job_skills_clean,
            resume_data={},
        )

        analysis = Analysis(
            resume_id=resume.id,
            job_id=job.id,
            user_id=demo_recruiter.id,
            status="done",
            overall_score=result["overall_score"],
            match_label=result["match_label"],
            match_color=result["match_color"],
            tfidf_score=result["tfidf_score"],
            semantic_score=result["semantic_score"],
            kg_score=result["kg_score"],
            experience_score=result["experience_score"],
            weight_tfidf=0.25,
            weight_semantic=0.30,
            weight_kg=0.25,
            weight_experience=0.20,
            total_requirements=result["total_requirements"],
            fully_matched_count=result["fully_matched_count"],
            partially_matched_count=result["partially_matched_count"],
            transferable_count=result["transferable_count"],
            missing_count=result["missing_count"],
            strengths_json=json.dumps(explanation["strengths"]),
            weaknesses_json=json.dumps(explanation["weaknesses"]),
            summary=explanation["summary"],
            experience_match_json=json.dumps(result["experience_match"]),
            education_match_json=json.dumps(result["education_match"]),
        )
        db.session.add(analysis)
        db.session.flush()

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
    print("✓ Demo data seeded successfully.")
    print(f"  Demo candidate: demo_candidate@resumeiq.demo / demo1234")
    print(f"  Demo recruiter: demo_recruiter@resumeiq.demo / demo1234")
    print(f"  {len(DEMO_RESUMES)} resumes, {len(DEMO_JOBS)} jobs seeded.")


if __name__ == "__main__":
    seed()
