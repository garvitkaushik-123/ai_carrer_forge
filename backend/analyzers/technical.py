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
