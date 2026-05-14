from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from session import get_session, update_session
from services.question_generator import generate_questions
from models import QuestionsResponse, Question

router = APIRouter()


class GenerateQuestionsRequest(BaseModel):
    session_id: str


@router.post("/api/generate-questions", response_model=QuestionsResponse)
async def generate_questions_endpoint(req: GenerateQuestionsRequest):
    session = get_session(req.session_id)
    if not session or "resume_data" not in session:
        raise HTTPException(404, "Session not found or resume not uploaded.")

    raw_questions = await generate_questions(session["resume_data"])

    questions = [Question(**q) for q in raw_questions]
    update_session(req.session_id, {"questions": [q.model_dump() for q in questions]})

    return QuestionsResponse(session_id=req.session_id, questions=questions)
