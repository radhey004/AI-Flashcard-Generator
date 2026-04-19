import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound


MAX_TRANSCRIPT_CHARS = 12000


def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:v=|/v/|youtu\.be/|/embed/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def get_transcript(url: str) -> str:
    video_id = extract_video_id(url)

    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
    except NoTranscriptFound:
        try:
            available = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = available.find_manually_created_transcript(['en'])
            transcript_list = transcript.fetch()
        except Exception:
            try:
                available = YouTubeTranscriptApi.list_transcripts(video_id)
                transcript = next(iter(available))
                transcript_list = transcript.fetch()
            except Exception as e:
                raise ValueError(f"No transcript available for this video: {e}")
    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video")

    text_chunks = []
    for entry in transcript_list:
        text_chunks.append(entry['text'].strip())

    full_text = ' '.join(text_chunks)
    full_text = re.sub(r'\s+', ' ', full_text).strip()
    full_text = re.sub(r'\[.*?\]', '', full_text).strip()

    if len(full_text) > MAX_TRANSCRIPT_CHARS:
        full_text = full_text[:MAX_TRANSCRIPT_CHARS] + " [Transcript truncated...]"

    return full_text
