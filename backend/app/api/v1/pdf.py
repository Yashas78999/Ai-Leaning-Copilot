from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pypdf import PdfReader
import os
from app.schemas.tutor import TutorRequest
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_service import (
    generate_notes,
    generate_flashcards,
    generate_quiz,
    generate_study_plan,
    ask_tutor
)
from app.models.ai_content import AIContent
from app.core.database import get_db
from app.models.pdf import PDF
from app.models.pdf_chunk import PDFChunk
from app.schemas.rag import RAGQuestion

from app.services.rag_service import (
    retrieve_relevant_chunks
)

from app.services.ai_service import (
    ask_tutor_rag
)
from app.services.embedding_service import (
    chunk_text,
    create_embedding,
    embedding_to_string
)

router = APIRouter(
    prefix="/pdf",
    tags=["PDF"]
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    reader = PdfReader(file_path)

    extracted_text = ""

    for page in reader.pages:
        text = page.extract_text()

        if text:
            extracted_text += text + "\n"

    pdf_record = PDF(
    user_id=current_user.id,
    filename=file.filename,
    filepath=file_path,
    extracted_text=extracted_text
)

    db.add(pdf_record)
    db.commit()
    db.refresh(pdf_record)

    # Create chunks and embeddings
    chunks = chunk_text(
        extracted_text
    )

    for chunk in chunks:

        embedding = create_embedding(
            chunk
        )

        pdf_chunk = PDFChunk(
            pdf_id=pdf_record.id,
            chunk_text=chunk,
            embedding=embedding_to_string(
                embedding
            )
        )

        db.add(pdf_chunk)

    db.commit()

    return {
        "message": "PDF uploaded successfully",
        "pdf_id": pdf_record.id,
        "filename": file.filename,
        "characters_extracted": len(extracted_text),
        "chunks_created": len(chunks)
    }

@router.get("/notes/{pdf_id}")
def generate_pdf_notes(
    pdf_id: int,
    db: Session = Depends(get_db)
):
    pdf = (
        db.query(PDF)
        .filter(PDF.id == pdf_id)
        .first()
    )

    if not pdf:
        return {
            "error": "PDF not found"
        }

    try:
        notes = generate_notes(
            pdf.extracted_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    ai_content = AIContent(
        pdf_id=pdf.id,
        content_type="NOTES",
        content=notes
    )

    db.add(ai_content)
    db.commit()
    db.refresh(ai_content)

    return {
        "pdf_id": pdf.id,
        "filename": pdf.filename,
        "content_id": ai_content.id,
        "notes": notes
    }


@router.get("/flashcards/{pdf_id}")
def generate_pdf_flashcards(
    pdf_id: int,
    db: Session = Depends(get_db)
):
    pdf = (
        db.query(PDF)
        .filter(PDF.id == pdf_id)
        .first()
    )

    if not pdf:
        return {
            "error": "PDF not found"
        }

    try:
        flashcards = generate_flashcards(
            pdf.extracted_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    return {
        "pdf_id": pdf.id,
        "filename": pdf.filename,
        "flashcards": flashcards
    }

@router.get("/quiz/{pdf_id}")
def generate_pdf_quiz(
    pdf_id: int,
    db: Session = Depends(get_db)
):
    pdf = (
        db.query(PDF)
        .filter(PDF.id == pdf_id)
        .first()
    )

    if not pdf:
        return {
            "error": "PDF not found"
        }

    try:
        quiz = generate_quiz(
            pdf.extracted_text
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    return {
        "pdf_id": pdf.id,
        "filename": pdf.filename,
        "quiz": quiz
    }

@router.get("/study-plan/{pdf_id}")
def generate_pdf_study_plan(
    pdf_id: int,
    days: int,
    db: Session = Depends(get_db)
):
    pdf = (
        db.query(PDF)
        .filter(PDF.id == pdf_id)
        .first()
    )

    if not pdf:
        return {
            "error": "PDF not found"
        }

    try:
        study_plan = generate_study_plan(
            pdf.extracted_text,
            days
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    return {
        "pdf_id": pdf.id,
        "filename": pdf.filename,
        "days": days,
        "study_plan": study_plan
    }

@router.post("/chat/{pdf_id}")
def chat_with_pdf(
    pdf_id: int,
    request: TutorRequest,
    db: Session = Depends(get_db)
):
    pdf = (
        db.query(PDF)
        .filter(PDF.id == pdf_id)
        .first()
    )

    if not pdf:
        return {
            "error": "PDF not found"
        }

    try:
        answer = ask_tutor(
            pdf.extracted_text,
            request.question,
            request.history
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    return {
        "question": request.question,
        "answer": answer
    }

@router.post("/rag-chat/{pdf_id}")
def rag_chat(
    pdf_id: int,
    request: RAGQuestion,
    db: Session = Depends(get_db)
):
    chunks = (
        db.query(PDFChunk)
        .filter(
            PDFChunk.pdf_id == pdf_id
        )
        .order_by(PDFChunk.id.asc())
        .all()
    )

    if not chunks:
        return {
            "error": "No chunks found"
        }

    relevant_chunks = (
        retrieve_relevant_chunks(
            request.question,
            chunks
        )
    )

    context = "\n\n".join(
        [c["chunk_text"] for c in relevant_chunks]
    )

    try:
        answer = ask_tutor_rag(
            context,
            request.question,
            request.history
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API Error: {str(e)}. Please configure a valid GEMINI_API_KEY in backend/.env."
        )

    return {
        "question": request.question,
        "answer": answer,
        "chunks_used": len(
            relevant_chunks
        ),
        "source_chunks": [
            {
                "index": c["index"],
                "text": c["chunk_text"]
            }
            for c in relevant_chunks
        ]
    }


@router.get("/")
def list_pdfs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pdfs = (
        db.query(PDF)
        .filter(PDF.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": pdf.id,
            "filename": pdf.filename,
            "filepath": pdf.filepath,
            "characters_count": len(pdf.extracted_text) if pdf.extracted_text else 0
        }
        for pdf in pdfs
    ]

@router.get("/{pdf_id}")
def get_pdf_details(pdf_id: int, db: Session = Depends(get_db)):
    pdf = db.query(PDF).filter(PDF.id == pdf_id).first()
    if not pdf:
        return {"error": "PDF not found"}
    return {
        "id": pdf.id,
        "filename": pdf.filename,
        "filepath": pdf.filepath,
        "characters_count": len(pdf.extracted_text) if pdf.extracted_text else 0
    }

@router.get("/test")
def test_pdf():
    return {
        "message": "PDF API Working"
    }

@router.get("/me-test")
def me_test(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email
    }

@router.delete("/{pdf_id}")
def delete_pdf(
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pdf = db.query(PDF).filter(PDF.id == pdf_id, PDF.user_id == current_user.id).first()
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Delete associated chunks
    db.query(PDFChunk).filter(PDFChunk.pdf_id == pdf_id).delete()

    # Delete associated AI contents
    db.query(AIContent).filter(AIContent.pdf_id == pdf_id).delete()

    # Delete physical file if it exists
    if pdf.filepath and os.path.exists(pdf.filepath):
        try:
            os.remove(pdf.filepath)
        except Exception as e:
            print("Error deleting file:", e)

    db.delete(pdf)
    db.commit()
    return {"message": "PDF deleted successfully"}