import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL_NAME = "gemini-3.1-flash-lite-preview"
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
