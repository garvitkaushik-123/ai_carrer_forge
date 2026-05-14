import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import ResumeData
from session import create_session, update_session
from config import MAX_RESUME_SIZE_MB, ALLOWED_EXTENSIONS
from services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_text,
    extract_skills,
    extract_links,
    detect_role,
)

router = APIRouter()


@router.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type {ext} not supported. Use PDF or DOCX.")

    content = await file.read()
    if len(content) > MAX_RESUME_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_RESUME_SIZE_MB}MB.")

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(content)
    else:
        raw_text = extract_text_from_docx(content)

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract text from resume. Try a different file.")

    sections = parse_resume_text(raw_text)
    skills = extract_skills(raw_text)
    links = extract_links(raw_text)
    detected_role = detect_role(raw_text)

    session_id = create_session()
    resume_data = ResumeData(
        raw_text=raw_text,
        sections=sections,
        skills=skills,
        links=links,
        detected_role=detected_role,
    )
    update_session(session_id, {"resume_data": resume_data.model_dump()})

    return {
        "session_id": session_id,
        "detected_role": detected_role,
        "skills_found": len(skills),
        "links_found": len(links),
        "sections_found": list(sections.keys()),
    }
