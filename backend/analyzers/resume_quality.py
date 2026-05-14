import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def analyze_resume_quality(resume_data: dict) -> dict:
    prompt_template = load_prompt("resume_quality")

    prompt = prompt_template.format(
        resume_text=resume_data.get("raw_text", "")[:4000],
        sections_found=", ".join(resume_data.get("sections", {}).keys()),
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
    result["dimension"] = "resume_quality"
    return result
