import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME


def load_prompt(name: str) -> str:
    with open(f"prompts/{name}.txt", "r") as f:
        return f.read()


genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(MODEL_NAME)


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

    response = client.generate_content(prompt)
    response_text = response.text
    json_start = response_text.find("[")
    json_end = response_text.rfind("]") + 1
    questions = json.loads(response_text[json_start:json_end])

    return questions
