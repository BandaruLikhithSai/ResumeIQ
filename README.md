# ResumeIQ

**Explainable Knowledge-Graph-Guided Resume-to-Job Matching with Skill-Gap Analysis**

A full-stack AI-powered academic project that goes beyond keyword matching to provide transparent, evidence-backed resume analysis.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install flask flask-cors flask-sqlalchemy flask-migrate flask-jwt-extended \
  PyPDF2 pdfminer.six python-docx nltk scikit-learn numpy scipy \
  python-dotenv Levenshtein rapidfuzz networkx bcrypt werkzeug

# Copy and configure environment
cp .env.example .env

# Start server (creates DB automatically)
python run.py
```

Backend runs on **http://localhost:5000**

### 2. Seed Demo Data

```bash
cd backend
python seed_demo.py
```

This creates:
- 5 demo candidate resumes (Aisha Patel, Rahul Sharma, Priya Nair, Arjun Mehta, Sneha Reddy)
- 3 demo job descriptions (ML Engineer, Senior Backend Dev, Full Stack Dev)
- Pre-computed analyses ready for demonstration

**Demo Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Candidate | `demo_candidate@resumeiq.demo` | `demo1234` |
| Recruiter | `demo_recruiter@resumeiq.demo` | `demo1234` |

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Project Structure

```
resumeiq/
├── backend/
│   ├── app/
│   │   ├── api/            # Flask blueprints (auth, resume, job, analysis, recruiter, graph)
│   │   ├── models/         # SQLAlchemy models (User, Resume, Job, Analysis, SkillGap, …)
│   │   ├── nlp/            # Text extraction, resume parser, skill extractor, skills DB
│   │   ├── knowledge_graph/# NetworkX graph, skill relationships, graph data
│   │   ├── matching/       # Hybrid engine: TF-IDF, semantic, KG, experience matchers
│   │   ├── explainability/ # Explanation generator, skill-gap analyser
│   │   └── config.py       # Environment-based configuration
│   ├── run.py              # App entry point
│   └── seed_demo.py        # Demo data seeder
│
└── frontend/
    └── src/
        ├── api/            # Axios client + typed API wrappers
        ├── components/     # Reusable UI (ScoreRing, SkillBadge, Navbar, Sidebar)
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx / Register.jsx
        │   ├── candidate/  # Dashboard, Upload, Processing
        │   ├── analysis/   # Results, SkillGap, WhatIf, GraphExplorer
        │   └── recruiter/  # Dashboard, Upload, CandidatesList, Detail, Comparison
        ├── store/          # Zustand auth store (persisted)
        └── utils/          # Score helpers, date formatting
```

---

## Matching Algorithm

The system computes a **hybrid score** across four independent components:

```
Score = 0.25 × TF-IDF  +  0.30 × Semantic  +  0.25 × KG  +  0.20 × Experience
```

| Component | Method | Description |
|-----------|--------|-------------|
| **TF-IDF** | scikit-learn cosine similarity | Token-level overlap between resume and JD |
| **Semantic** | TF-IDF cosine proxy (upgrades to sentence-transformers if installed) | Meaning-level similarity |
| **Knowledge Graph** | NetworkX shortest-path with edge weights | Skill relationship coverage via graph traversal |
| **Experience** | Heuristic scoring | Years, education level, role relevance, projects |

### Skill Classification (per requirement)

| Status | Condition |
|--------|-----------|
| **Fully Matched** | Exact canonical match in candidate skills |
| **Partially Matched** | KG transferability score ≥ 0.65 |
| **Transferable** | KG transferability score ≥ 0.30 |
| **Missing** | Score < 0.30 |

---

## Knowledge Graph

The graph has **~80 skill nodes** and **~130 directed relationships**:

- `prerequisite_of` — Python → Machine Learning
- `related_to` — TensorFlow ↔ Keras
- `supports` — Python → Django
- `transferable_to` — TensorFlow → PyTorch (partial credit)
- `part_of` — Pandas → Data Science

The graph is visualised interactively in the **Skill Graph Explorer** page using an HTML5 Canvas force-directed layout.

---

## API Endpoints

```
POST /api/auth/register        Create account
POST /api/auth/login           Sign in
POST /api/auth/demo-login      Demo access (role: candidate|recruiter)

POST /api/resume/upload        Upload and parse resume (PDF/DOCX/TXT)
GET  /api/resume/list          List user resumes

POST /api/job/create           Create job from text
GET  /api/job/list             List jobs

POST /api/analysis/run         Run full hybrid analysis
GET  /api/analysis/:id         Get analysis with skill matches + gaps
POST /api/analysis/:id/simulate  What-if simulation
GET  /api/analysis/:id/graph   Skill subgraph for this analysis

GET  /api/recruiter/candidates Ranked candidates (filterable)
GET  /api/recruiter/compare    Side-by-side requirement matrix

GET  /api/graph/full           Complete knowledge graph
GET  /api/graph/skill/:name    Skill neighbourhood
GET  /api/graph/path           Shortest path between two skills
```

---

## Pages

| Page | Path |
|------|------|
| Landing | `/` |
| Login / Register | `/login`, `/register` |
| Candidate Dashboard | `/candidate` |
| New Analysis (upload) | `/candidate/upload` |
| Analysis Processing | `/candidate/processing/:resumeId/:jobId` |
| Match Results | `/analysis/:id` |
| Skill Gap Analysis | `/analysis/:id/skills` |
| What-If Simulator | `/analysis/:id/whatif` |
| Knowledge Graph Explorer | `/graph` or `/graph/:analysisId` |
| History | `/candidate/history` |
| Recruiter Dashboard | `/recruiter` |
| Recruiter Upload | `/recruiter/upload` |
| Candidates List | `/recruiter/candidates` |
| Candidate Detail | `/recruiter/candidates/:analysisId` |
| Comparison | `/recruiter/compare` |
| Settings | `/settings` |

---

## Semantic Matching Note

By default, semantic similarity uses a TF-IDF cosine proxy (no extra download needed).

To upgrade to true sentence embeddings:
```bash
pip install sentence-transformers
```
The system automatically detects and uses `all-MiniLM-L6-v2` if available.

---

## Known Limitations

- OCR requires `pytesseract` + Tesseract binary (not installed by default)
- Semantic proxy is less accurate than transformer-based embeddings
- Knowledge graph is hand-curated (~80 nodes); coverage grows with additions to `graph_data.py`
- Experience extraction uses heuristics and may miss non-standard resume formats
- No email verification or password reset flow yet

---

## Future Improvements

- Integrate sentence-transformers for production-grade semantic matching
- Expand knowledge graph with domain ontologies (O*NET, LinkedIn Skills)
- Add LLM-generated narrative summaries via OpenAI/LangChain
- Role-based access control for multi-recruiter teams
- Resume version comparison
- Export analysis as PDF report
- Automated skill trend tracking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask, SQLAlchemy, Flask-JWT-Extended |
| NLP / ML | scikit-learn, NetworkX, rapidfuzz, pdfminer.six |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 18, Vite, Tailwind CSS, Zustand, Recharts |
| Graph Vis | HTML5 Canvas (custom force-directed layout) |

---

*ResumeIQ — Academic Research Project · Explainable Knowledge-Graph-Guided Resume Matching*

---

## Deploying to Render

The project ships with a `render.yaml` Blueprint that provisions everything automatically:

| Service | Type | What it is |
|---------|------|-----------|
| `resumeiq-api` | Web Service (Python) | Flask + gunicorn backend |
| `resumeiq-db` | PostgreSQL 16 | Managed database |
| `resumeiq-web` | Static Site | React Vite frontend |

---

### Step 1 — Push the repo to GitHub

```bash
# From the project root (resumeiq/)
git remote add origin https://github.com/YOUR_USERNAME/resumeiq.git
git branch -M main
git push -u origin main
```

> Make sure `.env` is **not** committed — the `.gitignore` excludes it.  
> Only `.env.example` goes to GitHub.

---

### Step 2 — Deploy with the Blueprint (recommended)

1. Go to **[render.com](https://render.com)** → **New** → **Blueprint**
2. Connect your GitHub account and select the `resumeiq` repository
3. Render reads `render.yaml` and creates all three services automatically
4. Click **Apply** — the first deploy starts immediately

That's it for the initial deploy. Continue to Step 4 to wire the URLs together.

---

### Step 2 (alternative) — Deploy services manually

If you prefer full control, create each service by hand:

#### A. Create the PostgreSQL database

1. Render dashboard → **New** → **PostgreSQL**
2. Name: `resumeiq-db` · Plan: **Free** · Region: Singapore (or nearest)
3. Click **Create Database**
4. Copy the **Internal Database URL** from the database's Info page — you'll need it in the next step

#### B. Create the Backend Web Service

1. Render dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `resumeiq-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn wsgi:app --workers 2 --threads 2 --timeout 120 --bind 0.0.0.0:$PORT` |
| **Plan** | Free |

4. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | *(click Generate)* |
| `JWT_SECRET_KEY` | *(click Generate)* |
| `DATABASE_URL` | *(paste Internal Database URL from step A)* |
| `FRONTEND_URL` | `https://resumeiq-web.onrender.com` *(fill after frontend is deployed)* |
| `UPLOAD_FOLDER` | `uploads` |

5. Click **Create Web Service**

#### C. Create the Frontend Static Site

1. Render dashboard → **New** → **Static Site**
2. Connect the same GitHub repo
3. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `resumeiq-web` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Add this **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://resumeiq-api.onrender.com` *(your backend URL)* |

5. Click **Create Static Site**

---

### Step 3 — Seed demo data (first deploy only)

After the backend service is live, open its **Shell** tab on Render and run:

```bash
python seed_demo.py
```

This loads the 5 demo candidates, 3 job descriptions, and pre-computed analyses.

**Demo credentials:**

| Role | Email | Password |
|------|-------|----------|
| Candidate | `demo_candidate@resumeiq.demo` | `demo1234` |
| Recruiter | `demo_recruiter@resumeiq.demo` | `demo1234` |

---

### Step 4 — Wire the two URLs together

Once both services are deployed you have two URLs, e.g.:

```
Backend:  https://resumeiq-api.onrender.com
Frontend: https://resumeiq-web.onrender.com
```

**Update backend → knows about frontend (CORS):**  
Go to `resumeiq-api` → Environment → set `FRONTEND_URL`:
```
https://resumeiq-web.onrender.com
```
Then click **Save Changes** — the service redeploys automatically.

**Update frontend → knows about backend:**  
Go to `resumeiq-web` → Environment → set `VITE_API_URL`:
```
https://resumeiq-api.onrender.com
```
Then trigger a manual redeploy from the **Deploys** tab.

---

### Step 5 — Verify it's working

```
https://resumeiq-api.onrender.com/api/health
```

Should return:
```json
{ "status": "ok", "service": "ResumeIQ API" }
```

Then open the frontend URL and click **Demo Candidate** to log in instantly.

---

### Important Notes for Render Free Tier

| Limitation | What it means |
|------------|---------------|
| **Services spin down after 15 min idle** | First request after idle takes ~30 s to wake up |
| **Free PostgreSQL expires after 90 days** | Back up your data and recreate the DB before expiry |
| **Ephemeral filesystem** | Uploaded files are lost on redeploy — use Cloudinary / S3 for persistent uploads in production |
| **512 MB RAM** | Adequate for the app; avoid loading large ML models |

#### Uploaded files on free tier

Render's free web services have an **ephemeral disk** — files written to `uploads/` are wiped on every redeploy. For a demo this is fine. For production, replace the local upload path with an S3-compatible store:

1. Add `boto3` to `requirements.txt`
2. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` env vars
3. Change `resume_bp` upload handler to stream to S3 instead of `os.path`

---

### Re-deploying after code changes

```bash
# Make your changes, then:
git add .
git commit -m "describe your change"
git push origin main
```

Render auto-deploys both services on every push to `main`.

---

### Environment Variables Reference

#### Backend (`resumeiq-api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✅ | Flask session secret — use Generate |
| `JWT_SECRET_KEY` | ✅ | JWT signing key — use Generate |
| `DATABASE_URL` | ✅ | Auto-set when DB is attached |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS (comma-separated ok) |
| `FLASK_ENV` | ✅ | Set to `production` |
| `UPLOAD_FOLDER` | | Default: `uploads` |
| `WEIGHT_TFIDF` | | Default: `0.25` |
| `WEIGHT_SEMANTIC` | | Default: `0.30` |
| `WEIGHT_KG` | | Default: `0.25` |
| `WEIGHT_EXPERIENCE` | | Default: `0.20` |

#### Frontend (`resumeiq-web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend URL, e.g. `https://resumeiq-api.onrender.com` |
