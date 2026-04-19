import base64
import io
import os
import pdfplumber
from typing import Tuple


MAX_PAGES = int(os.getenv("MAX_PDF_PAGES", "50"))
MAX_CHARS = 12000


def extract_text_from_base64(pdf_base64: str) -> Tuple[str, int]:
    pdf_bytes = base64.b64decode(pdf_base64)
    pdf_buffer = io.BytesIO(pdf_bytes)

    text_parts = []
    total_pages = 0

    with pdfplumber.open(pdf_buffer) as pdf:
        total_pages = len(pdf.pages)
        pages_to_process = min(total_pages, MAX_PAGES)

        for i, page in enumerate(pdf.pages[:pages_to_process]):
            page_text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if page_text:
                cleaned = _clean_text(page_text)
                if cleaned:
                    text_parts.append(f"[Page {i + 1}]\n{cleaned}")

    full_text = "\n\n".join(text_parts)

    if len(full_text) > MAX_CHARS:
        full_text = full_text[:MAX_CHARS] + "\n\n[Content truncated for processing...]"

    return full_text, total_pages


def _clean_text(text: str) -> str:
    import re
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'[^\x20-\x7E\n]', ' ', text)
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if len(line) > 3]
    return '\n'.join(lines).strip()
