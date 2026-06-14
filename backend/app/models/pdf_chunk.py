from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey
)

from app.models.base import Base


class PDFChunk(Base):
    __tablename__ = "pdf_chunks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    pdf_id = Column(
        Integer,
        ForeignKey("pdfs.id")
    )

    chunk_text = Column(
        Text,
        nullable=False
    )

    embedding = Column(
        Text,
        nullable=False
    )