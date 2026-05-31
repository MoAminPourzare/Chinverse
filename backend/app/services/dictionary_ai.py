import asyncio
import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from app.api.errors import bad_request
from app.core.config import settings


PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "dictionary_word_generation.md"

DICTIONARY_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["words"],
    "properties": {
        "words": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "chinese",
                    "pinyin",
                    "level",
                    "persian_meaning",
                    "chinese_meaning",
                    "composition",
                    "audio_url",
                    "definitions",
                    "examples",
                    "collocations",
                    "review_note",
                ],
                "properties": {
                    "chinese": {"type": "string"},
                    "pinyin": {"type": "string"},
                    "level": {"type": "string"},
                    "persian_meaning": {"type": "string"},
                    "chinese_meaning": {"type": "string"},
                    "composition": {"type": "string"},
                    "audio_url": {"type": "string"},
                    "review_note": {"type": "string"},
                    "definitions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["lang_code", "definition_text", "part_of_speech"],
                            "properties": {
                                "lang_code": {"type": "string"},
                                "definition_text": {"type": "string"},
                                "part_of_speech": {"type": "string"},
                            },
                        },
                    },
                    "examples": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["zh_text", "pinyin", "target_text"],
                            "properties": {
                                "zh_text": {"type": "string"},
                                "pinyin": {"type": "string"},
                                "target_text": {"type": "string"},
                            },
                        },
                    },
                    "collocations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["phrase_zh", "phrase_pinyin", "translation_target"],
                            "properties": {
                                "phrase_zh": {"type": "string"},
                                "phrase_pinyin": {"type": "string"},
                                "translation_target": {"type": "string"},
                            },
                        },
                    },
                },
            },
        }
    },
}


def load_dictionary_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def build_dictionary_prompt(words: list[str], context: str | None = None) -> str:
    clean_words = [word.strip() for word in words if word.strip()]
    word_lines = "\n".join(f"- {word}" for word in clean_words)
    clean_context = context.strip() if context else "بدون زمینه"

    return (
        f"{load_dictionary_prompt()}\n\n"
        f"زمینه درس یا ویدیو:\n{clean_context}\n\n"
        f"کلمات:\n{word_lines}\n"
    )


def _extract_output_text(response: dict[str, Any]) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]

    text_parts: list[str] = []
    for output in response.get("output", []) or []:
        for content in output.get("content", []) or []:
            text = content.get("text")
            if isinstance(text, str):
                text_parts.append(text)
    return "\n".join(text_parts).strip()


def _post_openai_response(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = settings.OPENAI_API_KEY.strip()
    if not api_key:
        raise bad_request("OPENAI_API_KEY is not configured")

    url = f"{settings.OPENAI_BASE_URL.rstrip('/')}/responses"
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.OPENAI_REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise bad_request(f"OpenAI request failed: {body}") from error
    except urllib.error.URLError as error:
        raise bad_request(f"OpenAI request failed: {error.reason}") from error


async def generate_dictionary_words(
    words: list[str],
    context: str | None = None,
    model: str | None = None,
) -> tuple[str, str, list[dict[str, Any]]]:
    clean_words = [word.strip() for word in words if word.strip()]
    if not clean_words:
        raise bad_request("At least one word is required")

    prompt = build_dictionary_prompt(clean_words, context)
    selected_model = (model or settings.OPENAI_DICTIONARY_MODEL).strip()
    if not selected_model:
        raise bad_request("OPENAI_DICTIONARY_MODEL is not configured")
    payload = {
        "model": selected_model,
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "chinverse_dictionary_words",
                "strict": True,
                "schema": DICTIONARY_SCHEMA,
            }
        },
    }

    response = await asyncio.to_thread(_post_openai_response, payload)
    output_text = _extract_output_text(response)
    if not output_text:
        raise bad_request("OpenAI returned an empty response")

    try:
        parsed = json.loads(output_text)
    except json.JSONDecodeError as error:
        raise bad_request("OpenAI response was not valid JSON") from error
    generated_words = parsed.get("words")
    if not isinstance(generated_words, list):
        raise bad_request("OpenAI response did not include words[]")

    return prompt, output_text, generated_words
