import os
import json
import re
import google.generativeai as genai
from typing import List, Dict, Any
from cachetools import TTLCache
import hashlib
from pydantic import BaseModel, Field, ValidationError, field_validator

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_cache: TTLCache = TTLCache(maxsize=200, ttl=int(os.getenv("CACHE_TTL_SECONDS", "3600")))
# Bounded retry for reliability (reduce spurious cost)
MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "2"))

DIFFICULTY_INSTRUCTIONS = {
    "easy": "Generate basic, straightforward flashcards covering fundamental concepts. Questions should be simple recall-based.",
    "medium": "Generate intermediate flashcards with conceptual questions. Include some application-based questions requiring understanding.",
    "hard": "Generate advanced flashcards with complex, analytical questions. Include nuanced concepts, edge cases, and synthesis questions.",
}

GENERATION_PROMPT = """You are an expert educator creating high-quality flashcards. Analyze the provided content and generate exactly {count} flashcards.

Difficulty level: {difficulty}
{difficulty_instruction}

Content to analyze:
---
{content}
---

Generate exactly {count} flashcards. Each flashcard must have:
- A clear, specific question that tests knowledge
- A comprehensive yet concise answer (2-4 sentences)
- An appropriate difficulty tag

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{{
  "flashcards": [
    {{
      "question": "Your question here?",
      "answer": "Your detailed answer here.",
      "difficulty": "{difficulty}",
      "tags": ["relevant", "topic", "tags"]
    }}
  ],
  "topic": "Main topic of the content",
  "summary": "Brief 1-sentence summary of the content"
}}

Rules:
1. Questions must be specific and unambiguous
2. Answers must be accurate and complete
3. Avoid duplicate questions
4. Tags should reflect the subject area (2-4 tags per card)
5. Questions should progress from foundational to complex when possible
"""


class FlashcardModel(BaseModel):
    question: str = Field(min_length=5)
    answer: str = Field(min_length=10)
    difficulty: str
    tags: List[str] = Field(default_factory=list)

    @field_validator("question", "answer")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        return value.strip()


class GenerationResultModel(BaseModel):
    flashcards: List[FlashcardModel]
    topic: str = "Generated Flashcards"
    summary: str = ""


def _normalize_question(question: str) -> str:
    return re.sub(r"\s+", " ", question).strip().lower()


def _get_cache_key(content: str, difficulty: str, count: int) -> str:
    raw = f"{content[:500]}:{difficulty}:{count}"
    return hashlib.md5(raw.encode()).hexdigest()


def _parse_flashcard_response(response_text: str) -> Dict[str, Any]:
    cleaned = response_text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"```(?:json)?\n?", "", cleaned).strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            try:
                result = json.loads(json_match.group())
            except json.JSONDecodeError as exc:
                raise ValueError("Could not parse AI response as JSON") from exc
        else:
            raise ValueError("Could not parse AI response as JSON")

    if not isinstance(result, dict):
        raise ValueError("AI response must be a JSON object")

    flashcards = result.get("flashcards")

    if not isinstance(flashcards, list) or not flashcards:
        raise ValueError("AI response must contain flashcards")

    for card in flashcards:
        if not isinstance(card, dict):
            raise ValueError("Invalid flashcard")

        if "question" not in card or "answer" not in card:
            raise ValueError("Incomplete flashcard")

        if not isinstance(card["question"], str) or not card["question"].strip():
            raise ValueError("Invalid flashcard question")

        if not isinstance(card["answer"], str) or not card["answer"].strip():
            raise ValueError("Invalid flashcard answer")

    return result


def _validate_and_normalize(
    result: Dict[str, Any],
    difficulty: str,
    count: int
) -> Dict[str, Any]:

    parsed = GenerationResultModel.model_validate(result)

    seen_questions = set()
    cleaned_flashcards = []

    for card in parsed.flashcards:
        normalized_question = _normalize_question(card.question)

        if not normalized_question:
            continue

        if normalized_question in seen_questions:
            continue

        seen_questions.add(normalized_question)

        tags = [
            tag.strip().lower()
            for tag in card.tags
            if tag and tag.strip()
        ]

        if not tags:
            tags = [
                parsed.topic.strip().lower() or "general"
            ]

        cleaned_flashcards.append({
            "question": card.question,
            "answer": card.answer,
            "difficulty": card.difficulty or difficulty,
            "tags": tags[:4],
        })

    # Make sure the AI returned the requested number
    # of valid and unique flashcards.
    if len(cleaned_flashcards) < count:
        raise ValueError(
            f"AI response was incomplete: expected {count} "
            f"unique flashcards, got {len(cleaned_flashcards)}"
        )

    return {
        "flashcards": cleaned_flashcards[:count],
        "topic": parsed.topic.strip() or "Generated Flashcards",
        "summary": parsed.summary.strip(),
        "count": count,
    }


async def generate_flashcards(content: str, difficulty: str = "medium", count: int = 10) -> Dict[str, Any]:
    cache_key = _get_cache_key(content, difficulty, count)
    if cache_key in _cache:
        return _cache[cache_key]

    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    prompt = GENERATION_PROMPT.format(
        content=content[:8000],
        difficulty=difficulty,
        difficulty_instruction=DIFFICULTY_INSTRUCTIONS.get(difficulty, DIFFICULTY_INSTRUCTIONS["medium"]),
        count=min(count, int(os.getenv("MAX_FLASHCARDS_PER_REQUEST", "30"))),
    )

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=4096,
                )
            )

            result = _parse_flashcard_response(response.text)
            final_result = _validate_and_normalize(result, difficulty, count)
            _cache[cache_key] = final_result
            return final_result
        except (ValueError, ValidationError, json.JSONDecodeError) as exc:
            last_error = exc
            prompt = prompt + f"\n\nThe previous response was invalid: {str(exc)}. Return only valid JSON with exactly {count} unique flashcards."

    raise ValueError(f"AI generation failed after {MAX_RETRIES} attempts: {last_error}")
