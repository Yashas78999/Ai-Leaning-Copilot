from pydantic import BaseModel
from typing import List, Optional


class MessageSchema(BaseModel):
    role: str
    content: str


class TutorRequest(BaseModel):
    question: str
    history: Optional[List[MessageSchema]] = None