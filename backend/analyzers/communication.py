import json
import anthropic
from config import ANTHROPIC_API_KEY, MODEL_NAME
from services.question_generator import load_prompt

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


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

    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    json_start = response_text.find("{")
    json_end = response_text.rfind("}") + 1
    result = json.loads(response_text[json_start:json_end])
    result["dimension"] = "communication"
    return result
