from pydantic import BaseModel


class PDFResponse(BaseModel):
    id: int
    filename: str

    class Config:
        from_attributes = True