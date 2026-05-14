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
