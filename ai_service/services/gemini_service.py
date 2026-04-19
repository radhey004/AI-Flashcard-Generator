import os
import json
import re
import google.generativeai as genai
from typing import List, Dict, Any
from cachetools import TTLCache
import hashlib

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

_cache: TTLCache = TTLCache(maxsize=200, ttl=int(os.getenv("CACHE_TTL_SECONDS", "3600")))

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


def _get_cache_key(content: str, difficulty: str, count: int) -> str:
    raw = f"{content[:500]}:{difficulty}:{count}"
    return hashlib.md5(raw.encode()).hexdigest()


def _parse_flashcard_response(response_text: str) -> Dict[str, Any]:
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"```(?:json)?\n?", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse AI response as JSON")


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

    if "flashcards" not in result:
        raise ValueError("Invalid response structure from AI")

    flashcards = result.get("flashcards", [])[:count]
    for card in flashcards:
        if "difficulty" not in card:
            card["difficulty"] = difficulty
        if "tags" not in card or not card["tags"]:
            card["tags"] = [result.get("topic", "general")]

    final_result = {
        "flashcards": flashcards,
        "topic": result.get("topic", "Generated Flashcards"),
        "summary": result.get("summary", ""),
        "count": len(flashcards),
    }

    _cache[cache_key] = final_result
    return final_result
