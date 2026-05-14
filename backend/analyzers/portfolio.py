import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(MODEL_NAME)


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

    response = client.generate_content(prompt)
    response_text = response.text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "portfolio"
    return result
