import pytest
from ai_service.services import gemini_service as gs

VALID_RESPONSE = '''{
  "flashcards": [
    {"question": "What is AI?", "answer": "AI stands for Artificial Intelligence.", "difficulty": "easy", "tags": ["ai", "intro"]},
    {"question": "Define machine learning.", "answer": "Machine learning is a subset of AI...", "difficulty": "medium", "tags": ["ml"]},
    {"question": "Explain overfitting.", "answer": "Overfitting occurs when...", "difficulty": "hard", "tags": ["ml", "stats"]}
  ],
  "topic": "Artificial Intelligence",
  "summary": "Intro to AI"
}'''

FENCED_RESPONSE = "```json\n" + VALID_RESPONSE + "\n```"

SURROUNDING_TEXT = "Response:\n" + VALID_RESPONSE + "\nThanks!"

DUPLICATE_RESPONSE = '''{
  "flashcards": [
    {"question": "What is AI?", "answer": "First answer.", "difficulty": "easy", "tags": ["ai"]},
    {"question": "What is AI?  ", "answer": "Duplicate answer.", "difficulty": "easy", "tags": ["ai"]},
    {"question": "Define machine learning.", "answer": "Machine learning is...", "difficulty": "medium", "tags": ["ml"]}
  ],
  "topic": "AI",
  "summary": "Summary"
}'''

INCOMPLETE_RESPONSE = '''{
  "flashcards": [
    {"question": "Only one?", "answer": "Too short.", "difficulty": "easy", "tags": []}
  ],
  "topic": "Small",
  "summary": "Small"
}'''


def test_parse_valid_json():
    parsed = gs._parse_flashcard_response(VALID_RESPONSE)
    assert isinstance(parsed, dict)
    assert parsed["topic"] == "Artificial Intelligence"


def test_parse_fenced_block():
    parsed = gs._parse_flashcard_response(FENCED_RESPONSE)
    assert parsed["summary"] == "Intro to AI"


def test_parse_surrounding_text():
    parsed = gs._parse_flashcard_response(SURROUNDING_TEXT)
    assert parsed["topic"] == "Artificial Intelligence"


def test_duplicate_detection_filters_duplicates():
    parsed = gs._parse_flashcard_response(DUPLICATE_RESPONSE)
    normalized = gs._validate_and_normalize(parsed, difficulty="easy", count=2)
    # Should return 2 unique cards
    assert len(normalized["flashcards"]) == 2


def test_incomplete_raises():
    parsed = gs._parse_flashcard_response(INCOMPLETE_RESPONSE)
    with pytest.raises(ValueError):
        gs._validate_and_normalize(parsed, difficulty="easy", count=3)
