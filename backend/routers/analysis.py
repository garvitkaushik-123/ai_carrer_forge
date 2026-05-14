import asyncio
from fastapi import APIRouter, HTTPException
from models import SubmitAnswersRequest, AssessmentResult, DimensionResult
from session import get_session, update_session
from analyzers.technical import analyze_technical_skills
from analyzers.resume_quality import analyze_resume_quality
from analyzers.communication import analyze_communication
from analyzers.portfolio import analyze_portfolio
from services.scoring import aggregate_scores

router = APIRouter()


@router.post("/api/submit-answers")
async def submit_answers(req: SubmitAnswersRequest):
    session = get_session(req.session_id)
    if not session or "resume_data" not in session:
        raise HTTPException(404, "Session not found.")

    resume_data = session["resume_data"]
    questions = session.get("questions", [])

    answers_with_context = []
    for answer in req.answers:
        matching_q = next((q for q in questions if q["id"] == answer.question_id), None)
        answers_with_context.append({
            "question_id": answer.question_id,
            "answer": answer.answer,
            "question_text": matching_q["question_text"] if matching_q else "",
            "category": matching_q["category"] if matching_q else "",
            "question_type": matching_q["question_type"] if matching_q else "",
        })

    technical_result, resume_result, communication_result, portfolio_result = await asyncio.gather(
        analyze_technical_skills(resume_data, answers_with_context),
        analyze_resume_quality(resume_data),
        analyze_communication(answers_with_context),
        analyze_portfolio(resume_data, answers_with_context),
    )

    all_dimensions = [technical_result, resume_result, communication_result, portfolio_result]
    aggregated = aggregate_scores(all_dimensions)

    result = AssessmentResult(
        session_id=req.session_id,
        overall_score=aggregated["overall_score"],
        overall_label=aggregated["overall_label"],
        overall_message=aggregated["overall_message"],
        overall_color=aggregated["overall_color"],
        dimensions=[DimensionResult(**d) for d in aggregated["dimensions"]],
    )

    update_session(req.session_id, {"result": result.model_dump()})

    return result


@router.get("/api/results/{session_id}", response_model=AssessmentResult)
async def get_results(session_id: str):
    session = get_session(session_id)
    if not session or "result" not in session:
        raise HTTPException(404, "Results not found. Submit answers first.")

    return AssessmentResult(**session["result"])
