import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional
from services.gemini_service import generate_flashcards
from services.pdf_service import extract_text_from_base64
from services.youtube_service import get_transcript

app = FastAPI(
    title="AI Flashcard Generator Service",
    description="Python AI microservice for generating flashcards using Google Gemini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 10


class PDFRequest(BaseModel):
    pdf_base64: str
    filename: Optional[str] = "document.pdf"
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 10


class YouTubeRequest(BaseModel):
    url: str
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 10


def validate_difficulty(difficulty: str) -> str:
    valid = ["easy", "medium", "hard"]
    if difficulty not in valid:
        raise HTTPException(status_code=400, detail=f"Difficulty must be one of: {', '.join(valid)}")
    return difficulty


def validate_count(count: int) -> int:
    max_count = int(os.getenv("MAX_FLASHCARDS_PER_REQUEST", "30"))
    if count < 1:
        raise HTTPException(status_code=400, detail="Count must be at least 1")
    return min(count, max_count)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AI Flashcard Generator"}


@app.post("/generate/text")
async def generate_from_text(req: TextRequest):
    if not req.text or len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text must be at least 50 characters")

    difficulty = validate_difficulty(req.difficulty or "medium")
    count = validate_count(req.count or 10)

    try:
        result = await generate_flashcards(req.text, difficulty, count)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@app.post("/generate/pdf")
async def generate_from_pdf(req: PDFRequest):
    if not req.pdf_base64:
        raise HTTPException(status_code=400, detail="PDF data is required")

    difficulty = validate_difficulty(req.difficulty or "medium")
    count = validate_count(req.count or 10)

    try:
        text, page_count = extract_text_from_base64(req.pdf_base64)
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=422, detail="Could not extract sufficient text from PDF")

        result = await generate_flashcards(text, difficulty, count)
        result["source"] = {"type": "pdf", "filename": req.filename, "pages": page_count}
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF processing failed: {str(e)}")


@app.post("/generate/youtube")
async def generate_from_youtube(req: YouTubeRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="YouTube URL is required")

    difficulty = validate_difficulty(req.difficulty or "medium")
    count = validate_count(req.count or 10)

    try:
        transcript = get_transcript(req.url)
        if not transcript or len(transcript.strip()) < 50:
            raise HTTPException(status_code=422, detail="Could not extract transcript from YouTube video")

        result = await generate_flashcards(transcript, difficulty, count)
        result["source"] = {"type": "youtube", "url": req.url}
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube processing failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
