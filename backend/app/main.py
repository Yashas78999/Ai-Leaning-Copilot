from fastapi import FastAPI

from app.models.base import Base
from app.models.user import User
from app.models.pdf import PDF
from app.models.ai_content import AIContent
from app.core.database import engine
from app.models.pdf_chunk import PDFChunk
from app.api.v1.auth import router as auth_router
from app.api.v1.pdf import router as pdf_router
from fastapi.middleware.cors import CORSMiddleware
print(Base.metadata.tables.keys())
print(engine.url)
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI Learning Copilot"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(pdf_router)

@app.get("/")
def home():
    return {
        "message": "AI Learning Copilot API"
    }