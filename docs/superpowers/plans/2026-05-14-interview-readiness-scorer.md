# Interview Readiness Scorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered tool that assesses interview readiness from a resume upload + 4-5 adaptive questions, producing a 0-100 score with actionable feedback across 4 dimensions — all in under 2 minutes of user time.

**Architecture:** FastAPI backend with multi-step LLM pipeline (Claude API) running 4 parallel analyzers. React + Tailwind frontend with a linear flow: upload → wizard → analysis → results dashboard. In-memory session store links the multi-step flow.

**Tech Stack:** Python 3.11+, FastAPI, Anthropic SDK, pdfplumber, python-docx | React 18 (Vite), Tailwind CSS 3, Lucide React icons

---

## Phase 1: Backend

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/config.py`
- Create: `backend/main.py`
- Create: `backend/models.py`
- Create: `backend/session.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
pdfplumber==0.11.0
python-docx==1.1.0
anthropic==0.40.0
pydantic==2.9.0
```

- [ ] **Step 2: Create `backend/config.py`**

```python
import os

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL_NAME = "claude-sonnet-4-6-20250514"
MAX_RESUME_SIZE_MB = 5
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

DIMENSION_WEIGHTS = {
    "technical_skills": 0.35,
    "resume_quality": 0.25,
    "communication": 0.20,
    "portfolio": 0.20,
}

SCORE_BANDS = [
    {"min": 80, "max": 100, "label": "Interview Ready", "color": "green",
     "message": "You're well-prepared. Fine-tune these areas."},
    {"min": 60, "max": 79, "label": "Almost There", "color": "yellow",
     "message": "Solid foundation, but these gaps could cost you."},
    {"min": 40, "max": 59, "label": "Needs Work", "color": "orange",
     "message": "Significant gaps to address before interviewing."},
    {"min": 0, "max": 39, "label": "Not Ready", "color": "red",
     "message": "Focus on building fundamentals first."},
]
```

- [ ] **Step 3: Create `backend/models.py`**

```python
from pydantic import BaseModel


class ResumeData(BaseModel):
    raw_text: str
    sections: dict[str, str]
    skills: list[str]
    links: list[str]
    detected_role: str


class Question(BaseModel):
    id: int
    category: str
    question_text: str
    question_type: str  # "mcq" or "short_answer"
    options: list[str] | None = None
    hint: str | None = None


class QuestionsResponse(BaseModel):
    session_id: str
    questions: list[Question]


class Answer(BaseModel):
    question_id: int
    answer: str


class SubmitAnswersRequest(BaseModel):
    session_id: str
    answers: list[Answer]


class DimensionResult(BaseModel):
    dimension: str
    score: int
    label: str
    strengths: list[str]
    improvements: list[str]
    resources: list[str]


class AssessmentResult(BaseModel):
    session_id: str
    overall_score: int
    overall_label: str
    overall_message: str
    overall_color: str
    dimensions: list[DimensionResult]
```

- [ ] **Step 4: Create `backend/session.py`**

```python
import uuid

_sessions: dict[str, dict] = {}


def create_session() -> str:
    session_id = uuid.uuid4().hex[:12]
    _sessions[session_id] = {}
    return session_id


def get_session(session_id: str) -> dict | None:
    return _sessions.get(session_id)


def update_session(session_id: str, data: dict) -> None:
    if session_id in _sessions:
        _sessions[session_id].update(data)
```

- [ ] **Step 5: Create `backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Interview Readiness Scorer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Install dependencies and verify server starts**

Run:
```bash
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Expected: Server starts, `GET /api/health` returns `{"status": "ok"}`

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: scaffold backend with FastAPI, models, session store, config"
```

---

### Task 2: Resume Parser Service

**Files:**
- Create: `backend/services/resume_parser.py`
- Create: `backend/tests/test_resume_parser.py`

- [ ] **Step 1: Write test for resume parser**

Create `backend/tests/__init__.py` (empty) and `backend/tests/test_resume_parser.py`:

```python
import pytest
from services.resume_parser import extract_text_from_pdf, parse_resume_text, extract_skills, extract_links


def test_parse_resume_text_extracts_sections():
    sample_text = """John Doe
john@email.com | github.com/johndoe | linkedin.com/in/johndoe

EXPERIENCE
Software Engineer at Acme Corp (2023-2025)
- Built REST APIs using Python and FastAPI
- Reduced latency by 40%

EDUCATION
BS Computer Science, MIT, 2023

SKILLS
Python, JavaScript, React, FastAPI, PostgreSQL, Docker

PROJECTS
Portfolio Website - Built with React and Tailwind CSS
Data Pipeline - ETL system processing 1M records/day
"""
    result = parse_resume_text(sample_text)
    assert "experience" in result
    assert "education" in result
    assert "skills" in result


def test_extract_skills():
    text = "Python, JavaScript, React, FastAPI, PostgreSQL, Docker, AWS, TensorFlow"
    skills = extract_skills(text)
    assert "Python" in skills
    assert "React" in skills
    assert len(skills) >= 5


def test_extract_links():
    text = "Check out github.com/johndoe and linkedin.com/in/johndoe and my portfolio at johndoe.dev"
    links = extract_links(text)
    assert any("github" in link for link in links)
    assert any("linkedin" in link for link in links)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_resume_parser.py -v`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `backend/services/__init__.py` (empty) and `backend/services/resume_parser.py`**

```python
import re
import io
import pdfplumber
from docx import Document


def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        pages = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(para.text for para in doc.paragraphs)


SECTION_HEADERS = [
    "experience", "work experience", "professional experience", "employment",
    "education", "academic", "qualifications",
    "skills", "technical skills", "core competencies", "technologies",
    "projects", "personal projects", "portfolio",
    "certifications", "certificates",
    "summary", "objective", "about", "profile",
    "contact", "contact information",
]


def parse_resume_text(text: str) -> dict[str, str]:
    lines = text.split("\n")
    sections: dict[str, str] = {}
    current_section = "header"
    current_lines: list[str] = []

    for line in lines:
        stripped = line.strip()
        normalized = stripped.lower().rstrip(":")
        if normalized in SECTION_HEADERS:
            if current_lines:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = _normalize_section_name(normalized)
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def _normalize_section_name(name: str) -> str:
    mapping = {
        "work experience": "experience",
        "professional experience": "experience",
        "employment": "experience",
        "academic": "education",
        "qualifications": "education",
        "technical skills": "skills",
        "core competencies": "skills",
        "technologies": "skills",
        "personal projects": "projects",
        "portfolio": "projects",
        "certificates": "certifications",
        "objective": "summary",
        "about": "summary",
        "profile": "summary",
        "contact information": "contact",
    }
    return mapping.get(name, name)


KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Vue", "Angular", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SASS",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "DynamoDB",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD",
    "Git", "Linux", "REST", "GraphQL", "gRPC",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "Jupyter",
    "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator",
    "Jira", "Confluence", "Notion", "Slack",
    "SQL", "NoSQL", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Agile", "Scrum", "Kanban",
    "Data Analysis", "Data Engineering", "ETL", "Data Visualization", "Tableau", "Power BI",
    "Product Management", "UX Research", "A/B Testing", "User Stories",
    "DevOps", "SRE", "Monitoring", "Grafana", "Prometheus",
]


def extract_skills(text: str) -> list[str]:
    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        if skill.lower() in text_lower:
            found.append(skill)
    return found


def extract_links(text: str) -> list[str]:
    url_pattern = r'(?:https?://)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:/[^\s,)]*)?'
    matches = re.findall(url_pattern, text)
    full_matches = re.finditer(url_pattern, text)
    return [m.group(0) for m in full_matches]


ROLE_KEYWORDS = {
    "Software Engineering": ["software engineer", "developer", "full stack", "backend", "frontend", "sde", "swe", "programming"],
    "Data Science": ["data scientist", "machine learning", "data analysis", "ml engineer", "deep learning", "nlp", "analytics"],
    "Product Management": ["product manager", "product owner", "roadmap", "stakeholder", "user stories", "prd"],
    "Design": ["ux designer", "ui designer", "product designer", "figma", "sketch", "user research", "wireframe"],
    "DevOps": ["devops", "sre", "infrastructure", "cloud engineer", "platform engineer", "ci/cd", "kubernetes"],
}


def detect_role(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for role, keywords in ROLE_KEYWORDS.items():
        scores[role] = sum(1 for kw in keywords if kw in text_lower)
    best_role = max(scores, key=scores.get)
    return best_role if scores[best_role] > 0 else "Software Engineering"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_resume_parser.py -v`
Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/services/ backend/tests/
git commit -m "feat: add resume parser with text extraction, section parsing, skill detection"
```

---

### Task 3: Upload Resume Endpoint

**Files:**
- Create: `backend/routers/__init__.py` (empty)
- Create: `backend/routers/upload.py`
- Modify: `backend/main.py` (add router)

- [ ] **Step 1: Create `backend/routers/upload.py`**

```python
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import ResumeData
from session import create_session, update_session
from config import MAX_RESUME_SIZE_MB, ALLOWED_EXTENSIONS
from services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_text,
    extract_skills,
    extract_links,
    detect_role,
)

router = APIRouter()


@router.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not supported. Use PDF or DOCX.")

    content = await file.read()
    if len(content) > MAX_RESUME_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_RESUME_SIZE_MB}MB.")

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(content)
    else:
        raw_text = extract_text_from_docx(content)

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract text from resume. Try a different file.")

    sections = parse_resume_text(raw_text)
    skills = extract_skills(raw_text)
    links = extract_links(raw_text)
    detected_role = detect_role(raw_text)

    session_id = create_session()
    resume_data = ResumeData(
        raw_text=raw_text,
        sections=sections,
        skills=skills,
        links=links,
        detected_role=detected_role,
    )
    update_session(session_id, {"resume_data": resume_data.model_dump()})

    return {
        "session_id": session_id,
        "detected_role": detected_role,
        "skills_found": len(skills),
        "links_found": len(links),
        "sections_found": list(sections.keys()),
    }
```

- [ ] **Step 2: Update `backend/main.py` to include router**

Add after the middleware block:

```python
from routers.upload import router as upload_router

app.include_router(upload_router)
```

- [ ] **Step 3: Test manually with a sample PDF**

Run: `cd backend && uvicorn main:app --reload --port 8000`

Test with curl:
```bash
curl -X POST http://localhost:8000/api/upload-resume -F "file=@test_resume.pdf"
```
Expected: JSON with session_id, detected_role, skills_found, links_found, sections_found

- [ ] **Step 4: Commit**

```bash
git add backend/routers/ backend/main.py
git commit -m "feat: add /api/upload-resume endpoint with file validation and parsing"
```

---

### Task 4: LLM Prompts

**Files:**
- Create: `backend/prompts/question_generator.txt`
- Create: `backend/prompts/technical.txt`
- Create: `backend/prompts/resume_quality.txt`
- Create: `backend/prompts/communication.txt`
- Create: `backend/prompts/portfolio.txt`

- [ ] **Step 1: Create `backend/prompts/question_generator.txt`**

```
You are an interview readiness assessment system. Given a candidate's resume data, generate exactly 4-5 targeted questions to fill gaps that the resume alone cannot reveal.

The candidate is targeting a {detected_role} role.

Resume sections found: {sections_found}
Skills detected: {skills}
Links found: {links}

Rules:
- Generate exactly {num_questions} questions
- Mix question types: use "mcq" for experience-level or preference questions, "short_answer" for communication probes
- Each MCQ must have exactly 4 options
- Questions should probe gaps: if no portfolio links found, ask about projects. If skills are listed but depth is unclear, ask about experience level.
- One question MUST probe communication ability (ask them to describe or explain something in 1-2 sentences)
- Keep questions concise and answerable in under 15 seconds each
- Add a short hint for short_answer questions to guide the response

Return valid JSON array:
[
  {
    "id": 1,
    "category": "Technical Skills" | "Resume Quality" | "Communication" | "Portfolio",
    "question_text": "...",
    "question_type": "mcq" | "short_answer",
    "options": ["A", "B", "C", "D"] | null,
    "hint": "..." | null
  }
]
```

- [ ] **Step 2: Create `backend/prompts/technical.txt`**

```
You are an expert technical interviewer evaluating a candidate's technical readiness for a {detected_role} role.

Analyze the following data and score the candidate's technical skills from 0-100.

Resume Skills: {skills}
Resume Experience Section: {experience}
Wizard Answers (technical): {technical_answers}

Evaluation criteria:
- Skill relevance to {detected_role} (are these the right skills for this role?)
- Skill depth indicators (years of experience, project complexity, specificity)
- Tool/framework coverage (are there gaps in the expected stack?)
- Certifications or formal training

Return valid JSON:
{
  "score": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1 with specific action step", "improvement 2 with specific action step"],
  "resources": ["resource 1: name - URL or description", "resource 2: name - URL or description"]
}

Be specific. Never say "improve your skills." Instead say exactly WHICH skills and HOW.
Strengths: 2-3 items. Improvements: 2-3 items. Resources: 1 per improvement.
```

- [ ] **Step 3: Create `backend/prompts/resume_quality.txt`**

```
You are an expert resume reviewer and ATS specialist evaluating a candidate's resume quality.

Resume Full Text:
{resume_text}

Sections Found: {sections_found}

Evaluation criteria:
- Structure: Are standard sections present (summary, experience, education, skills)?
- Formatting: Is it well-organized and scannable?
- Quantified achievements: Do bullet points use metrics and numbers?
- ATS-friendliness: Standard headings, no excessive formatting?
- Section completeness: Are key sections filled with substance?
- Action verbs: Do descriptions start with strong action verbs?

Return valid JSON:
{
  "score": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1 with specific action step", "improvement 2 with specific action step"],
  "resources": ["resource 1: name - URL or description", "resource 2: name - URL or description"]
}

Be specific. Reference actual content from the resume. For improvements, give the exact fix (e.g., "Rewrite bullet 2 under Experience to include metrics: 'Reduced API latency by X% by implementing Y'").
Strengths: 2-3 items. Improvements: 2-3 items. Resources: 1 per improvement.
```

- [ ] **Step 4: Create `backend/prompts/communication.txt`**

```
You are an expert communication coach evaluating a candidate's written communication skills based on their short-answer responses in an interview readiness assessment.

Candidate's written answers:
{communication_answers}

Evaluation criteria:
- Clarity: Are ideas expressed clearly and concisely?
- Structure: Do answers have a logical flow?
- Value articulation: Can they explain their value proposition effectively?
- Grammar and professionalism: Is the writing professional and error-free?
- Conciseness: Do they get to the point without rambling?

Return valid JSON:
{
  "score": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1 with specific action step", "improvement 2 with specific action step"],
  "resources": ["resource 1: name - URL or description", "resource 2: name - URL or description"]
}

Be specific. Quote phrases from their answers to illustrate points. For improvements, show a rewritten example.
Strengths: 2-3 items. Improvements: 2-3 items. Resources: 1 per improvement.
```

- [ ] **Step 5: Create `backend/prompts/portfolio.txt`**

```
You are an expert technical recruiter evaluating a candidate's portfolio and project presence for a {detected_role} role.

Links found in resume: {links}
Projects section from resume: {projects}
Wizard answers about portfolio: {portfolio_answers}

Evaluation criteria:
- Presence: Do they have a GitHub, portfolio website, or project links?
- Project descriptions: Are projects described with clear problem/solution/impact?
- Relevance: Are projects relevant to the {detected_role} role?
- Recency: Are projects recent or outdated?
- Variety: Do projects show range or just one type of work?

Return valid JSON:
{
  "score": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1 with specific action step", "improvement 2 with specific action step"],
  "resources": ["resource 1: name - URL or description", "resource 2: name - URL or description"]
}

Be specific. If no portfolio links exist, score lower and suggest exactly what to build. If projects exist, comment on specifics.
Strengths: 2-3 items. Improvements: 2-3 items. Resources: 1 per improvement.
```

- [ ] **Step 6: Commit**

```bash
git add backend/prompts/
git commit -m "feat: add LLM system prompts for question generator and all 4 analyzers"
```

---

### Task 5: Question Generator Service & Endpoint

**Files:**
- Create: `backend/services/question_generator.py`
- Create: `backend/routers/questions.py`
- Modify: `backend/main.py` (add router)

- [ ] **Step 1: Create `backend/services/question_generator.py`**

```python
import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME


def load_prompt(name: str) -> str:
    with open(f"prompts/{name}.txt", "r") as f:
        return f.read()


client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def generate_questions(resume_data: dict) -> list[dict]:
    prompt_template = load_prompt("question_generator")

    sections_found = list(resume_data.get("sections", {}).keys())
    skills = resume_data.get("skills", [])
    links = resume_data.get("links", [])

    has_portfolio = any("github" in l.lower() or "portfolio" in l.lower() for l in links)
    has_projects = "projects" in resume_data.get("sections", {})
    num_questions = 5 if (not has_portfolio and not has_projects) else 4

    prompt = prompt_template.format(
        detected_role=resume_data.get("detected_role", "Software Engineering"),
        sections_found=", ".join(sections_found),
        skills=", ".join(skills) if skills else "None detected",
        links=", ".join(links) if links else "None found",
        num_questions=num_questions,
    )

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("[")
    json_end = response_text.rfind("]") + 1
    questions = json.loads(response_text[json_start:json_end])

    return questions
```

- [ ] **Step 2: Create `backend/routers/questions.py`**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from session import get_session, update_session
from services.question_generator import generate_questions
from models import QuestionsResponse, Question

router = APIRouter()


class GenerateQuestionsRequest(BaseModel):
    session_id: str


@router.post("/api/generate-questions", response_model=QuestionsResponse)
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    session = get_session(req.session_id)
    if not session or "resume_data" not in session:
        raise HTTPException(404, "Session not found or resume not uploaded.")

    raw_questions = await generate_questions(session["resume_data"])

    questions = [Question(**q) for q in raw_questions]
    update_session(req.session_id, {"questions": [q.model_dump() for q in questions]})

    return QuestionsResponse(session_id=req.session_id, questions=questions)
```

- [ ] **Step 3: Update `backend/main.py` to include questions router**

Add:
```python
from routers.questions import router as questions_router

app.include_router(questions_router)
```

- [ ] **Step 4: Test endpoint manually**

Prerequisite: upload a resume first to get a session_id.

```bash
curl -X POST http://localhost:8000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<session_id_from_upload>"}'
```
Expected: JSON with session_id and array of 4-5 questions, each with id, category, question_text, question_type, options

- [ ] **Step 5: Commit**

```bash
git add backend/services/question_generator.py backend/routers/questions.py backend/main.py
git commit -m "feat: add question generator service and /api/generate-questions endpoint"
```

---

### Task 6: Four Dimension Analyzers

**Files:**
- Create: `backend/analyzers/__init__.py` (empty)
- Create: `backend/analyzers/technical.py`
- Create: `backend/analyzers/resume_quality.py`
- Create: `backend/analyzers/communication.py`
- Create: `backend/analyzers/portfolio.py`

- [ ] **Step 1: Create `backend/analyzers/technical.py`**

```python
import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def analyze_technical_skills(resume_data: dict, answers: list[dict]) -> dict:
    prompt_template = load_prompt("technical")

    technical_answers = [
        a for a in answers
        if a.get("category", "") == "Technical Skills"
    ]
    answers_text = "\n".join(
        f"Q: {a.get('question_text', '')} A: {a.get('answer', '')}"
        for a in technical_answers
    ) or "No technical questions answered."

    prompt = prompt_template.format(
        detected_role=resume_data.get("detected_role", "Software Engineering"),
        skills=", ".join(resume_data.get("skills", [])) or "None detected",
        experience=resume_data.get("sections", {}).get("experience", "Not provided"),
        technical_answers=answers_text,
    )

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "technical_skills"
    return result
```

- [ ] **Step 2: Create `backend/analyzers/resume_quality.py`**

```python
import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def analyze_resume_quality(resume_data: dict) -> dict:
    prompt_template = load_prompt("resume_quality")

    prompt = prompt_template.format(
        resume_text=resume_data.get("raw_text", "")[:4000],
        sections_found=", ".join(resume_data.get("sections", {}).keys()),
    )

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "resume_quality"
    return result
```

- [ ] **Step 3: Create `backend/analyzers/communication.py`**

```python
import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def analyze_communication(answers: list[dict]) -> dict:
    prompt_template = load_prompt("communication")

    short_answers = [
        a for a in answers
        if a.get("question_type", "") == "short_answer"
    ]
    answers_text = "\n".join(
        f"Q: {a.get('question_text', '')} A: {a.get('answer', '')}"
        for a in short_answers
    ) or "No short-answer responses provided."

    prompt = prompt_template.format(communication_answers=answers_text)

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "communication"
    return result
```

- [ ] **Step 4: Create `backend/analyzers/portfolio.py`**

```python
import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def analyze_portfolio(resume_data: dict, answers: list[dict]) -> dict:
    prompt_template = load_prompt("portfolio")

    portfolio_answers = [
        a for a in answers
        if a.get("category", "") == "Portfolio"
    ]
    answers_text = "\n".join(
        f"Q: {a.get('question_text', '')} A: {a.get('answer', '')}"
        for a in portfolio_answers
    ) or "No portfolio questions answered."

    prompt = prompt_template.format(
        detected_role=resume_data.get("detected_role", "Software Engineering"),
        links=", ".join(resume_data.get("links", [])) or "None found",
        projects=resume_data.get("sections", {}).get("projects", "Not provided"),
        portfolio_answers=answers_text,
    )

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "portfolio"
    return result
```

- [ ] **Step 5: Commit**

```bash
git add backend/analyzers/
git commit -m "feat: add all 4 dimension analyzers (technical, resume, communication, portfolio)"
```

---

### Task 7: Scoring Aggregator

**Files:**
- Create: `backend/services/scoring.py`
- Create: `backend/tests/test_scoring.py`

- [ ] **Step 1: Write test for scoring aggregator**

```python
import pytest
from services.scoring import aggregate_scores, get_score_band


def test_aggregate_scores_weighted_average():
    dimensions = [
        {"dimension": "technical_skills", "score": 80, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "resume_quality", "score": 60, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "communication", "score": 70, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
        {"dimension": "portfolio", "score": 50, "strengths": ["a"], "improvements": ["b"], "resources": ["c"]},
    ]
    result = aggregate_scores(dimensions)
    # 80*0.35 + 60*0.25 + 70*0.20 + 50*0.20 = 28 + 15 + 14 + 10 = 67
    assert result["overall_score"] == 67
    assert result["overall_label"] == "Almost There"
    assert result["overall_color"] == "yellow"


def test_get_score_band_boundaries():
    assert get_score_band(100)["label"] == "Interview Ready"
    assert get_score_band(80)["label"] == "Interview Ready"
    assert get_score_band(79)["label"] == "Almost There"
    assert get_score_band(60)["label"] == "Almost There"
    assert get_score_band(59)["label"] == "Needs Work"
    assert get_score_band(40)["label"] == "Needs Work"
    assert get_score_band(39)["label"] == "Not Ready"
    assert get_score_band(0)["label"] == "Not Ready"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_scoring.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/services/scoring.py`**

```python
from config import DIMENSION_WEIGHTS, SCORE_BANDS


def get_score_band(score: int) -> dict:
    for band in SCORE_BANDS:
        if band["min"] <= score <= band["max"]:
            return band
    return SCORE_BANDS[-1]


def aggregate_scores(dimensions: list[dict]) -> dict:
    weighted_sum = 0.0
    for dim in dimensions:
        weight = DIMENSION_WEIGHTS.get(dim["dimension"], 0.25)
        weighted_sum += dim["score"] * weight

    overall_score = round(weighted_sum)
    band = get_score_band(overall_score)

    dimension_results = []
    for dim in dimensions:
        dim_band = get_score_band(dim["score"])
        dimension_results.append({
            "dimension": dim["dimension"],
            "score": dim["score"],
            "label": dim_band["label"],
            "strengths": dim.get("strengths", []),
            "improvements": dim.get("improvements", []),
            "resources": dim.get("resources", []),
        })

    return {
        "overall_score": overall_score,
        "overall_label": band["label"],
        "overall_message": band["message"],
        "overall_color": band["color"],
        "dimensions": dimension_results,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_scoring.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/services/scoring.py backend/tests/test_scoring.py
git commit -m "feat: add scoring aggregator with weighted average and score bands"
```

---

### Task 8: Analysis Endpoints (Submit Answers + Get Results)

**Files:**
- Create: `backend/routers/analysis.py`
- Modify: `backend/main.py` (add router)

- [ ] **Step 1: Create `backend/routers/analysis.py`**

```python
import asyncio
from fastapi import APIRouter, HTTPException
from models import SubmitAnswersRequest, AssessmentResult, DimensionResult
from session import get_session, update_session
from analyzers.technical import analyze_technical_skills
from analyzers.resume_quality import analyze_resume_quality
from analyzers.communication import analyze_communication
from analyzers.portfolio import analyze_portfolio
from services.scoring import aggregate_scores

router = APIRouter()


@router.post("/api/submit-answers")
async def submit_answers(req: SubmitAnswersRequest):
    session = get_session(req.session_id)
    if not session or "resume_data" not in session:
        raise HTTPException(404, "Session not found.")

    resume_data = session["resume_data"]
    questions = session.get("questions", [])

    answers_with_context = []
    for answer in req.answers:
        matching_q = next((q for q in questions if q["id"] == answer.question_id), None)
        answers_with_context.append({
            "question_id": answer.question_id,
            "answer": answer.answer,
            "question_text": matching_q["question_text"] if matching_q else "",
            "category": matching_q["category"] if matching_q else "",
            "question_type": matching_q["question_type"] if matching_q else "",
        })

    technical_result, resume_result, communication_result, portfolio_result = await asyncio.gather(
        analyze_technical_skills(resume_data, answers_with_context),
        analyze_resume_quality(resume_data),
        analyze_communication(answers_with_context),
        analyze_portfolio(resume_data, answers_with_context),
    )

    all_dimensions = [technical_result, resume_result, communication_result, portfolio_result]
    aggregated = aggregate_scores(all_dimensions)

    result = AssessmentResult(
        session_id=req.session_id,
        overall_score=aggregated["overall_score"],
        overall_label=aggregated["overall_label"],
        overall_message=aggregated["overall_message"],
        overall_color=aggregated["overall_color"],
        dimensions=[DimensionResult(**d) for d in aggregated["dimensions"]],
    )

    update_session(req.session_id, {"result": result.model_dump()})

    return result


@router.get("/api/results/{session_id}", response_model=AssessmentResult)
async def get_results(session_id: str):
    session = get_session(session_id)
    if not session or "result" not in session:
        raise HTTPException(404, "Results not found. Submit answers first.")

    return AssessmentResult(**session["result"])
```

- [ ] **Step 2: Update `backend/main.py` to include analysis router**

Add:
```python
from routers.analysis import router as analysis_router

app.include_router(analysis_router)
```

Full `backend/main.py` should now be:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Interview Readiness Scorer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.upload import router as upload_router
from routers.questions import router as questions_router
from routers.analysis import router as analysis_router

app.include_router(upload_router)
app.include_router(questions_router)
app.include_router(analysis_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Test full backend flow manually**

```bash
# 1. Upload resume
curl -X POST http://localhost:8000/api/upload-resume -F "file=@test_resume.pdf"
# Note the session_id

# 2. Generate questions
curl -X POST http://localhost:8000/api/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<session_id>"}'
# Note the question ids

# 3. Submit answers
curl -X POST http://localhost:8000/api/submit-answers \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id>",
    "answers": [
      {"question_id": 1, "answer": "Option A"},
      {"question_id": 2, "answer": "I have built several React projects including a portfolio site"},
      {"question_id": 3, "answer": "Option B"},
      {"question_id": 4, "answer": "I am a strong fit because I combine technical depth with clear communication"}
    ]
  }'
# Should return full AssessmentResult with all 4 dimensions

# 4. Get results
curl http://localhost:8000/api/results/<session_id>
```
Expected: Complete JSON with overall_score, overall_label, overall_message, overall_color, and 4 dimension objects each with score, strengths, improvements, resources

- [ ] **Step 4: Commit**

```bash
git add backend/routers/analysis.py backend/main.py
git commit -m "feat: add /api/submit-answers and /api/results endpoints, complete backend"
```

---

## Phase 2: Frontend

### Task 9: React Project Setup

**Files:**
- Create: `frontend/` (Vite + React project)
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Scaffold React project with Vite**

```bash
cd /Users/garvit/Desktop/personal/AppsWorthy/Hackathons/ai_carrer_forge
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite lucide-react
```

- [ ] **Step 2: Configure Tailwind via Vite plugin**

Replace `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

- [ ] **Step 3: Replace `frontend/src/index.css`**

```css
@import "tailwindcss";

@theme {
  --font-display: "Plus Jakarta Sans", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --color-brand-50: #EEF2FF;
  --color-brand-100: #E0E7FF;
  --color-brand-200: #C7D2FE;
  --color-brand-300: #A5B4FC;
  --color-brand-400: #818CF8;
  --color-brand-500: #6366F1;
  --color-brand-600: #4F46E5;
  --color-brand-700: #3730A3;
  --color-brand-800: #312E81;
  --color-brand-900: #1E1B4B;
}

@layer base {
  body {
    font-family: var(--font-body);
    @apply text-gray-900 bg-white antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}

@keyframes scan {
  0% { top: 4px; opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { top: 60px; opacity: 0; }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideOutLeft {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-40px); }
}

.animate-scan { animation: scan 1.5s ease-in-out infinite; }
.question-enter { animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.question-exit { animation: slideOutLeft 0.25s ease-in forwards; }
```

- [ ] **Step 4: Add Google Fonts to `frontend/index.html`**

Add inside `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd frontend && npm run dev
```
Expected: Vite dev server at http://localhost:5173, Tailwind working

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React frontend with Vite, Tailwind CSS, custom fonts and theme"
```

---

### Task 10: Assessment Context & API Utilities

**Files:**
- Create: `frontend/src/context/AssessmentContext.jsx`
- Create: `frontend/src/utils/api.js`
- Create: `frontend/src/utils/scoreBands.js`
- Create: `frontend/src/utils/constants.js`

- [ ] **Step 1: Create `frontend/src/utils/constants.js`**

```javascript
export const STEPS = {
  LANDING: "landing",
  PROCESSING: "processing",
  WIZARD: "wizard",
  ANALYZING: "analyzing",
  RESULTS: "results",
};
```

- [ ] **Step 2: Create `frontend/src/utils/scoreBands.js`**

```javascript
const SCORE_BANDS = [
  { min: 80, max: 100, label: "Interview Ready", color: "green",
    bg: "bg-green-100", border: "border-green-400", text: "text-green-700", fill: "#22C55E",
    message: "You're well-prepared. Fine-tune these areas." },
  { min: 60, max: 79, label: "Almost There", color: "yellow",
    bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700", fill: "#EAB308",
    message: "Solid foundation, but these gaps could cost you." },
  { min: 40, max: 59, label: "Needs Work", color: "orange",
    bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700", fill: "#F97316",
    message: "Significant gaps to address before interviewing." },
  { min: 0, max: 39, label: "Not Ready", color: "red",
    bg: "bg-red-100", border: "border-red-400", text: "text-red-700", fill: "#EF4444",
    message: "Focus on building fundamentals first." },
];

export function getScoreBand(score) {
  return SCORE_BANDS.find(b => score >= b.min && score <= b.max) || SCORE_BANDS[3];
}
```

- [ ] **Step 3: Create `frontend/src/utils/api.js`**

```javascript
const BASE = "/api";

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload-resume`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function generateQuestions(sessionId) {
  const res = await fetch(`${BASE}/generate-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Failed to generate questions");
  return res.json();
}

export async function submitAnswers(sessionId, answers) {
  const res = await fetch(`${BASE}/submit-answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, answers }),
  });
  if (!res.ok) throw new Error("Failed to submit answers");
  return res.json();
}

export async function getResults(sessionId) {
  const res = await fetch(`${BASE}/results/${sessionId}`);
  if (!res.ok) throw new Error("Results not found");
  return res.json();
}
```

- [ ] **Step 4: Create `frontend/src/context/AssessmentContext.jsx`**

```jsx
import { createContext, useContext, useState } from "react";
import { STEPS } from "../utils/constants";

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [step, setStep] = useState(STEPS.LANDING);
  const [sessionId, setSessionId] = useState(null);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const value = {
    step, setStep,
    sessionId, setSessionId,
    resumeInfo, setResumeInfo,
    questions, setQuestions,
    answers, setAnswers,
    results, setResults,
    error, setError,
  };

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/ frontend/src/utils/
git commit -m "feat: add AssessmentContext, API utilities, score band helpers"
```

---

### Task 11: Landing Page Components

**Files:**
- Create: `frontend/src/components/layout/Navbar.jsx`
- Create: `frontend/src/components/landing/UploadZone.jsx`
- Create: `frontend/src/components/landing/HeroSection.jsx`
- Create: `frontend/src/components/landing/HowItWorks.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Navbar.jsx`**

```jsx
export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 md:px-12 h-16">
      <span className="text-brand-700 font-bold text-xl font-display">ReadyScore</span>
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/landing/UploadZone.jsx`**

```jsx
import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";

export default function UploadZone({ onFileSelect, selectedFile }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group
        ${dragOver ? "border-brand-500 bg-brand-50 scale-[1.01]" : "border-brand-300 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-500"}
        ${selectedFile ? "border-green-400 bg-green-50" : ""}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={handleChange} className="hidden" />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <p className="text-green-700 font-semibold">{selectedFile.name}</p>
          <p className="text-green-600 text-sm">Resume uploaded successfully</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-brand-400 group-hover:text-brand-600 group-hover:-translate-y-1 transition-all" />
          <p className="text-gray-700 font-semibold mt-1">Drop your resume here</p>
          <p className="text-gray-400 text-sm">or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">PDF or DOCX — max 5MB</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/landing/HeroSection.jsx`**

```jsx
import { useState } from "react";
import UploadZone from "./UploadZone";
import { useAssessment } from "../../context/AssessmentContext";
import { uploadResume, generateQuestions } from "../../utils/api";
import { STEPS } from "../../utils/constants";

export default function HeroSection() {
  const { setStep, setSessionId, setResumeInfo, setQuestions, setError } = useAssessment();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setStep(STEPS.PROCESSING);

    try {
      const uploadResult = await uploadResume(file);
      setSessionId(uploadResult.session_id);
      setResumeInfo(uploadResult);

      const questionsResult = await generateQuestions(uploadResult.session_id);
      setQuestions(questionsResult.questions);
      setStep(STEPS.WIZARD);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.LANDING);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
        <div className="md:col-span-3 flex flex-col">
          <span className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full border border-brand-200 inline-flex items-center gap-1.5 mb-6 self-start">
            AI-Powered &middot; 2 Minutes &middot; Free
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight text-gray-950 mb-4 font-display">
            Know if you're<br />interview-ready<br />before the call.
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-lg">
            Upload your resume. Answer 4 questions. Get a scored breakdown across Technical Skills, Resume Quality, Communication, and Portfolio.
          </p>

          <UploadZone onFileSelect={setFile} selectedFile={file} />

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base px-8 py-4 rounded-xl w-full mt-4 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze My Readiness →"}
          </button>
        </div>

        <div className="md:col-span-2 hidden md:flex justify-center">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 rotate-3 scale-95 ring-1 ring-black/5 w-72">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold font-mono text-yellow-700">73</div>
              <div className="text-xs font-semibold uppercase tracking-widest text-yellow-600 mt-1">Almost There</div>
            </div>
            <div className="space-y-3">
              {["Technical Skills", "Resume Quality", "Communication", "Portfolio"].map((dim, i) => (
                <div key={dim}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{dim}</span>
                    <span className="font-mono font-bold">{[78, 65, 74, 68][i]}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-brand-400" style={{ width: `${[78, 65, 74, 68][i]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/landing/HowItWorks.jsx`**

```jsx
import { Upload, MessageSquare, BarChart3 } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Resume", desc: "Drop your PDF or DOCX resume" },
  { icon: MessageSquare, title: "Answer 4 Questions", desc: "Quick adaptive questions about your profile" },
  { icon: BarChart3, title: "Get Your Score", desc: "Detailed breakdown with improvement plan" },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="flex md:flex-col items-center md:items-center gap-4 md:gap-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
              {i + 1}
            </div>
            <div className="md:text-center md:mt-3">
              <p className="font-semibold text-gray-900 text-base">{s.title}</p>
              <p className="text-sm text-gray-500 leading-relaxed mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Update `frontend/src/App.jsx`**

```jsx
import { AssessmentProvider, useAssessment } from "./context/AssessmentContext";
import { STEPS } from "./utils/constants";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/landing/HeroSection";
import HowItWorks from "./components/landing/HowItWorks";

function AppContent() {
  const { step, error } = useAssessment();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {error && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm text-center">
          {error}
        </div>
      )}
      {step === STEPS.LANDING && (
        <>
          <HeroSection />
          <HowItWorks />
        </>
      )}
      {step === STEPS.PROCESSING && <div className="min-h-screen flex items-center justify-center">Processing...</div>}
      {step === STEPS.WIZARD && <div className="min-h-screen flex items-center justify-center">Wizard placeholder</div>}
      {step === STEPS.ANALYZING && <div className="min-h-screen flex items-center justify-center">Analyzing...</div>}
      {step === STEPS.RESULTS && <div className="min-h-screen flex items-center justify-center">Results placeholder</div>}
    </div>
  );
}

export default function App() {
  return (
    <AssessmentProvider>
      <AppContent />
    </AssessmentProvider>
  );
}
```

- [ ] **Step 6: Test landing page in browser**

Run: `cd frontend && npm run dev`
Open http://localhost:5173 — verify:
- Navbar renders with "ReadyScore" branding
- Hero section shows H1, pill badge, upload zone, CTA button
- Upload zone accepts drag-drop and file picker (PDF/DOCX)
- CTA is disabled until file selected
- How It Works section renders 3 steps
- Mockup card visible on desktop

- [ ] **Step 7: Commit**

```bash
git add frontend/src/
git commit -m "feat: add landing page with hero, upload zone, how it works section"
```

---

### Task 12: Processing Screen

**Files:**
- Create: `frontend/src/components/loading/ProcessingScreen.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/loading/ProcessingScreen.jsx`**

```jsx
import { useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "Reading work experience...",
  "Extracting skills...",
  "Checking keywords...",
  "Parsing education...",
  "Generating personalized questions...",
];

export default function ProcessingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 relative overflow-hidden">
        <div className="absolute left-2 right-2 h-0.5 bg-white/60 rounded animate-scan" />
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-2 font-display">
        Analyzing your resume...
      </h2>
      <p className="text-base text-gray-400 text-center max-w-sm">
        Our AI is reading your experience, skills, and keywords
      </p>

      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <p className="text-sm text-gray-400 italic text-center mt-3 h-5 transition-opacity duration-300">
        {STATUS_MESSAGES[msgIndex]}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/App.jsx` — replace Processing placeholder**

Replace `{step === STEPS.PROCESSING && <div ...>Processing...</div>}` with:

```jsx
{step === STEPS.PROCESSING && <ProcessingScreen />}
```

Add import at top: `import ProcessingScreen from "./components/loading/ProcessingScreen";`

- [ ] **Step 3: Test in browser** — trigger processing by uploading a file. Verify scanner animation, bouncing dots, rotating status text.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/loading/ProcessingScreen.jsx frontend/src/App.jsx
git commit -m "feat: add animated processing screen with scanner and status messages"
```

---

### Task 13: Question Wizard

**Files:**
- Create: `frontend/src/components/wizard/ProgressBar.jsx`
- Create: `frontend/src/components/wizard/MCQOptions.jsx`
- Create: `frontend/src/components/wizard/ShortAnswerInput.jsx`
- Create: `frontend/src/components/wizard/QuestionCard.jsx`
- Create: `frontend/src/components/wizard/WizardView.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/wizard/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="w-full mb-8">
      <p className="text-sm text-gray-400 font-medium mb-2 text-right">
        Question {current + 1} of {total}
      </p>
      <div className="h-2 rounded-full bg-gray-100 w-full">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < current ? "bg-brand-500" : i === current ? "bg-brand-400 ring-2 ring-brand-200" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/wizard/MCQOptions.jsx`**

```jsx
import { Check } from "lucide-react";

const LETTERS = ["A", "B", "C", "D"];

export default function MCQOptions({ options, selected, onSelect }) {
  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium text-base flex items-center gap-3 transition-all duration-150 cursor-pointer
            ${selected === opt
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
        >
          <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0
            ${selected === opt ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
            {LETTERS[i]}
          </span>
          <span className="flex-1">{opt}</span>
          {selected === opt && <Check className="w-5 h-5 text-brand-500 ml-auto" />}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/wizard/ShortAnswerInput.jsx`**

```jsx
import { Lightbulb } from "lucide-react";

const MAX_CHARS = 500;

export default function ShortAnswerInput({ value, onChange, hint }) {
  const pct = (value.length / MAX_CHARS) * 100;

  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Type your answer here..."
        className="w-full rounded-xl border-2 border-gray-200 p-4 text-base text-gray-800 placeholder-gray-400 leading-relaxed resize-none min-h-[120px] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all duration-150"
      />
      <p className={`text-xs mt-1 text-right ${pct > 80 ? "text-orange-500" : "text-gray-400"}`}>
        {value.length} / {MAX_CHARS}
      </p>
      {hint && (
        <p className="text-sm text-gray-400 italic mt-2 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          {hint}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/wizard/QuestionCard.jsx`**

```jsx
import MCQOptions from "./MCQOptions";
import ShortAnswerInput from "./ShortAnswerInput";

export default function QuestionCard({ question, answer, onAnswer, animClass }) {
  return (
    <div className={`bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-10 ${animClass}`}>
      <span className="bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1 rounded-full border border-brand-100 mb-4 inline-block">
        {question.category}
      </span>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug mb-6 font-display">
        {question.question_text}
      </h2>

      {question.question_type === "mcq" && question.options ? (
        <MCQOptions options={question.options} selected={answer} onSelect={onAnswer} />
      ) : (
        <ShortAnswerInput value={answer || ""} onChange={onAnswer} hint={question.hint} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/wizard/WizardView.jsx`**

```jsx
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAssessment } from "../../context/AssessmentContext";
import { submitAnswers } from "../../utils/api";
import { STEPS } from "../../utils/constants";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";

export default function WizardView() {
  const { questions, answers, setAnswers, sessionId, setStep, setResults, setError } = useAssessment();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animClass, setAnimClass] = useState("question-enter");
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentIdx];
  const answer = answers[question?.id];
  const isLast = currentIdx === questions.length - 1;

  function transition(direction, callback) {
    setAnimClass(direction === "forward" ? "question-exit" : "question-exit");
    setTimeout(() => {
      callback();
      setAnimClass("question-enter");
    }, 280);
  }

  function handleNext() {
    if (isLast) {
      handleSubmit();
      return;
    }
    transition("forward", () => setCurrentIdx((i) => i + 1));
  }

  function handleBack() {
    if (currentIdx === 0) return;
    transition("back", () => setCurrentIdx((i) => i - 1));
  }

  function handleAnswer(value) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setStep(STEPS.ANALYZING);
    try {
      const formatted = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        answer: ans,
      }));
      const result = await submitAnswers(sessionId, formatted);
      setResults(result);
      setStep(STEPS.RESULTS);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.LANDING);
    } finally {
      setSubmitting(false);
    }
  }

  if (!question) return null;

  return (
    <div className="min-h-screen flex flex-col pt-24 pb-8 px-4 max-w-2xl mx-auto">
      <ProgressBar current={currentIdx} total={questions.length} />

      <QuestionCard
        question={question}
        answer={answer}
        onAnswer={handleAnswer}
        animClass={animClass}
      />

      <div className="flex justify-between items-center mt-8">
        {currentIdx > 0 ? (
          <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        <button
          onClick={handleNext}
          disabled={!answer || submitting}
          className="bg-brand-700 hover:bg-brand-800 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.99]"
        >
          {submitting ? "Submitting..." : isLast ? "See My Results →" : "Next Question →"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update `frontend/src/App.jsx` — replace Wizard placeholder**

Replace `{step === STEPS.WIZARD && <div ...>Wizard placeholder</div>}` with:

```jsx
{step === STEPS.WIZARD && <WizardView />}
```

Add import: `import WizardView from "./components/wizard/WizardView";`

- [ ] **Step 7: Test in browser** — upload a resume (with backend running), verify questions appear, MCQ selection works, short-answer input works, navigation works, progress bar updates.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/wizard/ frontend/src/App.jsx
git commit -m "feat: add question wizard with MCQ, short answer, progress bar, slide transitions"
```

---

### Task 14: Analysis Screen

**Files:**
- Create: `frontend/src/components/loading/AnalysisScreen.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/loading/AnalysisScreen.jsx`**

```jsx
import { useState, useEffect } from "react";
import { Cpu, FileText, MessageSquare, Layers } from "lucide-react";

const DIMENSIONS = [
  { key: "technical_skills", name: "Technical Skills", icon: Cpu, color: "bg-blue-100 text-blue-600" },
  { key: "resume_quality", name: "Resume Quality", icon: FileText, color: "bg-purple-100 text-purple-600" },
  { key: "communication", name: "Communication", icon: MessageSquare, color: "bg-amber-100 text-amber-600" },
  { key: "portfolio", name: "Portfolio", icon: Layers, color: "bg-green-100 text-green-600" },
];

export default function AnalysisScreen() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = DIMENSIONS.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2 font-display">
        Building your readiness profile...
      </h2>
      <p className="text-sm text-gray-400 text-center mb-10">
        Evaluating 4 dimensions of interview readiness
      </p>

      <div className="w-full max-w-lg space-y-4">
        {DIMENSIONS.map((dim, i) => {
          const visible = i < visibleCount;
          const active = i === visibleCount - 1;
          const Icon = dim.icon;

          return (
            <div
              key={dim.key}
              className={`flex items-center gap-4 w-full bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 transition-all duration-400
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dim.color}
                ${active ? "ring-2 ring-brand-300 animate-pulse" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{dim.name}</p>
                <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-400 transition-all duration-1000 ease-out"
                    style={{ width: visible ? `${50 + i * 8}%` : "0%" }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold text-gray-700 font-mono tabular-nums min-w-[2.5rem] text-right">
                {visible ? "..." : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/App.jsx` — replace Analyzing placeholder**

Replace `{step === STEPS.ANALYZING && <div ...>Analyzing...</div>}` with:

```jsx
{step === STEPS.ANALYZING && <AnalysisScreen />}
```

Add import: `import AnalysisScreen from "./components/loading/AnalysisScreen";`

- [ ] **Step 3: Test in browser** — verify dimensions appear sequentially, active row pulses, bars animate.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/loading/AnalysisScreen.jsx frontend/src/App.jsx
git commit -m "feat: add analysis screen with sequential dimension reveal animation"
```

---

### Task 15: Custom Hooks

**Files:**
- Create: `frontend/src/hooks/useCountUp.js`
- Create: `frontend/src/hooks/useIntersectionObserver.js`

- [ ] **Step 1: Create `frontend/src/hooks/useCountUp.js`**

```javascript
import { useState, useEffect } from "react";

export default function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return count;
}
```

- [ ] **Step 2: Create `frontend/src/hooks/useIntersectionObserver.js`**

```javascript
import { useState, useEffect, useRef } from "react";

export default function useIntersectionObserver(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: add useCountUp and useIntersectionObserver hooks"
```

---

### Task 16: Results Dashboard

**Files:**
- Create: `frontend/src/components/results/ScoreGauge.jsx`
- Create: `frontend/src/components/results/ScoreBandPill.jsx`
- Create: `frontend/src/components/results/DimensionCard.jsx`
- Create: `frontend/src/components/results/ResultsDashboard.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create `frontend/src/components/results/ScoreGauge.jsx`**

```jsx
import { useEffect, useState } from "react";
import useCountUp from "../../hooks/useCountUp";
import { getScoreBand } from "../../utils/scoreBands";

export default function ScoreGauge({ score }) {
  const [animated, setAnimated] = useState(false);
  const count = useCountUp(score);
  const band = getScoreBand(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 200 120">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#F3F4F6"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={band.fill}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
      </svg>
      <div className="text-center -mt-16">
        <span className={`text-7xl font-bold font-mono ${band.text}`}>{count}</span>
        <span className="text-xl text-gray-400 font-medium ml-1">/100</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/results/ScoreBandPill.jsx`**

```jsx
import { getScoreBand } from "../../utils/scoreBands";

export default function ScoreBandPill({ score }) {
  const band = getScoreBand(score);

  return (
    <div className={`rounded-full px-6 py-2.5 inline-flex items-center gap-2 ${band.bg} ${band.border} border`}>
      <div className={`w-2.5 h-2.5 rounded-full animate-pulse`} style={{ backgroundColor: band.fill }} />
      <span className={`text-sm font-medium ${band.text}`}>
        {band.label} — {band.message}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/results/DimensionCard.jsx`**

```jsx
import { useState } from "react";
import { ChevronDown, CheckCircle, ArrowUpCircle, BookOpen, Cpu, FileText, MessageSquare, Layers } from "lucide-react";
import { getScoreBand } from "../../utils/scoreBands";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";

const ICONS = {
  technical_skills: { icon: Cpu, color: "bg-blue-100 text-blue-600" },
  resume_quality: { icon: FileText, color: "bg-purple-100 text-purple-600" },
  communication: { icon: MessageSquare, color: "bg-amber-100 text-amber-600" },
  portfolio: { icon: Layers, color: "bg-green-100 text-green-600" },
};

const LABELS = {
  technical_skills: "Technical Skills",
  resume_quality: "Resume Quality",
  communication: "Communication",
  portfolio: "Portfolio",
};

export default function DimensionCard({ dimension, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [ref, isVisible] = useIntersectionObserver();
  const band = getScoreBand(dimension.score);
  const iconInfo = ICONS[dimension.dimension] || ICONS.technical_skills;
  const Icon = iconInfo.icon;

  return (
    <div
      ref={ref}
      onClick={() => setExpanded(!expanded)}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconInfo.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-gray-900">
              {LABELS[dimension.dimension] || dimension.dimension}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold font-mono px-3 py-1 rounded-lg ${band.bg} ${band.text}`}>
              {dimension.score}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        <div className="h-1.5 rounded-full bg-gray-100 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: isVisible ? `${dimension.score}%` : "0%",
              backgroundColor: band.fill,
              transitionDelay: `${delay}ms`,
            }}
          />
        </div>

        {!expanded && dimension.strengths?.[0] && (
          <p className="text-sm text-gray-400 mt-3 truncate">{dimension.strengths[0]}</p>
        )}
      </div>

      <div className={`overflow-hidden transition-all duration-400 ${expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {dimension.strengths?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-green-600">Strengths</span>
              </div>
              {dimension.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          )}

          {dimension.improvements?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Areas to Improve</span>
              </div>
              {dimension.improvements.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          )}

          {dimension.resources?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Recommended Resources</span>
              </div>
              {dimension.resources.map((r, i) => (
                <p key={i} className="text-sm text-brand-600 mb-2">{r}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/results/ResultsDashboard.jsx`**

```jsx
import { useAssessment } from "../../context/AssessmentContext";
import { getScoreBand } from "../../utils/scoreBands";
import ScoreGauge from "./ScoreGauge";
import ScoreBandPill from "./ScoreBandPill";
import DimensionCard from "./DimensionCard";
import { STEPS } from "../../utils/constants";

export default function ResultsDashboard() {
  const { results, setStep, setSessionId, setResumeInfo, setQuestions, setAnswers, setResults } = useAssessment();

  if (!results) return null;

  const band = getScoreBand(results.overall_score);

  function handleRetake() {
    setSessionId(null);
    setResumeInfo(null);
    setQuestions([]);
    setAnswers({});
    setResults(null);
    setStep(STEPS.LANDING);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="sticky top-16 z-40 h-1.5" style={{ backgroundColor: band.fill }} />

      <div className="py-12 px-4 text-center bg-white shadow-sm border-b border-gray-100">
        <ScoreGauge score={results.overall_score} />
        <div className="mt-6">
          <ScoreBandPill score={results.overall_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4 py-8">
        {results.dimensions.map((dim, i) => (
          <DimensionCard key={dim.dimension} dimension={dim} delay={i * 100} />
        ))}
      </div>

      <div className="mt-6 mb-12 flex flex-col items-center gap-3">
        <button
          onClick={() => window.print()}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2.5 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
        >
          Download PDF Report
        </button>
        <button
          onClick={handleRetake}
          className="text-sm text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline"
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update `frontend/src/App.jsx` — replace Results placeholder**

Replace `{step === STEPS.RESULTS && <div ...>Results placeholder</div>}` with:

```jsx
{step === STEPS.RESULTS && <ResultsDashboard />}
```

Add import: `import ResultsDashboard from "./components/results/ResultsDashboard";`

- [ ] **Step 6: Test full flow in browser**

With backend running (`cd backend && uvicorn main:app --reload --port 8000`):
1. Open http://localhost:5173
2. Upload a PDF resume
3. Watch processing screen
4. Answer all wizard questions
5. Watch analysis screen
6. Verify results dashboard shows:
   - Animated gauge with score count-up
   - Score band pill with correct color/message
   - 4 dimension cards with animated score bars
   - Expandable cards with strengths/improvements/resources
   - Download and Retake buttons work

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/results/ frontend/src/App.jsx
git commit -m "feat: add results dashboard with score gauge, band pill, expandable dimension cards"
```

---

### Task 17: Final Integration & Polish

**Files:**
- Modify: `frontend/src/App.jsx` (cleanup)
- Modify: various files for edge cases

- [ ] **Step 1: Clean up `frontend/src/App.jsx` — final version**

Verify all imports are present and no placeholder divs remain:

```jsx
import { AssessmentProvider, useAssessment } from "./context/AssessmentContext";
import { STEPS } from "./utils/constants";
import Navbar from "./components/layout/Navbar";
import HeroSection from "./components/landing/HeroSection";
import HowItWorks from "./components/landing/HowItWorks";
import ProcessingScreen from "./components/loading/ProcessingScreen";
import WizardView from "./components/wizard/WizardView";
import AnalysisScreen from "./components/loading/AnalysisScreen";
import ResultsDashboard from "./components/results/ResultsDashboard";

function AppContent() {
  const { step, error } = useAssessment();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {error && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-red-50 border-b border-red-200 px-6 py-3 text-red-700 text-sm text-center">
          {error}
        </div>
      )}
      {step === STEPS.LANDING && (
        <>
          <HeroSection />
          <HowItWorks />
        </>
      )}
      {step === STEPS.PROCESSING && <ProcessingScreen />}
      {step === STEPS.WIZARD && <WizardView />}
      {step === STEPS.ANALYZING && <AnalysisScreen />}
      {step === STEPS.RESULTS && <ResultsDashboard />}
    </div>
  );
}

export default function App() {
  return (
    <AssessmentProvider>
      <AppContent />
    </AssessmentProvider>
  );
}
```

- [ ] **Step 2: End-to-end test with 3 different resumes**

Test with:
1. A strong resume (senior SWE with projects, GitHub, quantified achievements) — expect score 70-90
2. A medium resume (mid-level with some gaps) — expect score 50-70
3. A weak resume (student with minimal experience) — expect score 30-50

Verify:
- Scores differentiate meaningfully between resumes
- Feedback is specific and actionable (not generic)
- All 4 dimensions have distinct scores
- Score bands display correct colors
- Total user time < 2 minutes per assessment

- [ ] **Step 3: Test mobile at 375px width**

Resize browser to 375px width. Verify:
- Landing page stacks properly, mockup card hidden
- Upload zone is full-width and tappable
- Wizard questions are readable, MCQ options full-width
- Results cards are stacked, all start collapsed
- Gauge scales down appropriately

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Interview Readiness Scorer MVP — full flow working"
```

---

## Verification Checklist

- [ ] Backend: `POST /api/upload-resume` accepts PDF/DOCX, returns session_id + parsed metadata
- [ ] Backend: `POST /api/generate-questions` returns 4-5 adaptive questions based on resume
- [ ] Backend: `POST /api/submit-answers` runs 4 parallel analyzers, returns scored results
- [ ] Backend: `GET /api/results/{session_id}` returns cached results
- [ ] Backend: Scoring weights sum to 100% (35+25+20+20), score bands cover 0-100
- [ ] Frontend: Upload zone handles drag-drop + file picker, validates file type/size
- [ ] Frontend: Processing screen shows animated scanner + rotating status
- [ ] Frontend: Wizard renders MCQ and short-answer questions, progress bar updates
- [ ] Frontend: Analysis screen reveals dimensions sequentially
- [ ] Frontend: Results gauge animates with spring overshoot, score counts up
- [ ] Frontend: Dimension cards expand/collapse with strengths → improvements → resources
- [ ] Frontend: Retake assessment resets state and returns to landing
- [ ] E2E: Full flow completes in under 2 minutes of user active time
- [ ] E2E: Different resume qualities produce differentiated scores
- [ ] Mobile: All views work at 375px width with proper tap targets
