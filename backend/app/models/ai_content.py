from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.models.base import Base


class AIContent(Base):
    __tablename__ = "ai_contents"

    id = Column(Integer, primary_key=True, index=True)

    pdf_id = Column(
        Integer,
        ForeignKey("pdfs.id")
    )

    content_type = Column(
        String,
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )