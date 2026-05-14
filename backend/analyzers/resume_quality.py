import json
import google.generativeai as genai
from config import GEMINI_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel(MODEL_NAME)


async def analyze_resume_quality(resume_data: dict) -> dict:
    prompt_template = load_prompt("resume_quality")

    prompt = prompt_template.format(
        resume_text=resume_data.get("raw_text", "")[:4000],
        sections_found=", ".join(resume_data.get("sections", {}).keys()),
    )

    response = client.generate_content(prompt)
    response_text = response.text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "resume_quality"
    return result
