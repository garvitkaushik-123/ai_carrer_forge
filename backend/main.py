from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.upload import router as upload_router
from routers.questions import router as questions_router
from routers.analysis import router as analysis_router

app = FastAPI(title="Interview Readiness Scorer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(questions_router)
app.include_router(analysis_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
