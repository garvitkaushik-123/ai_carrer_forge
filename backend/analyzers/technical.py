import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(MODEL_NAME)


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

    response = client.generate_content(prompt)
    response_text = response.text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "technical_skills"
    return result
