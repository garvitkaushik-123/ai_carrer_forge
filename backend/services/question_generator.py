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
