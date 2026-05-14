from pydantic import BaseModel


class ResumeData(BaseModel):
    raw_text: str
    sections: dict[str, str]
    skills: list[str]
    links: list[str]
    detected_role: str


class Question(BaseModel):
    id: int
    category: str
    question_text: str
    question_type: str  # "mcq" or "short_answer"
    options: list[str] | None = None
    hint: str | None = None


class QuestionsResponse(BaseModel):
    session_id: str
    questions: list[Question]


class Answer(BaseModel):
    question_id: int
    answer: str


class SubmitAnswersRequest(BaseModel):
    session_id: str
    answers: list[Answer]


class Article(BaseModel):
    title: str
    url: str
    source: str


class DimensionResult(BaseModel):
    dimension: str
    score: int
    label: str
    strengths: list[str]
    improvements: list[str]
    resources: list[str] = []
    topics_to_study: list[str] = []
    articles: list[Article] = []


class AssessmentResult(BaseModel):
    session_id: str
    overall_score: int
    overall_label: str
    overall_message: str
    overall_color: str
    dimensions: list[DimensionResult]
