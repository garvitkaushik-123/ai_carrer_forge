import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(MODEL_NAME)


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

    response = client.generate_content(prompt)
    response_text = response.text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "communication"
    return result
