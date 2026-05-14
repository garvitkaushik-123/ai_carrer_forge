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
