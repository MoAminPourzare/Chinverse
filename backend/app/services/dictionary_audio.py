"""Review immutable recordings without overwriting dictionary or study data."""
import re
import unicodedata

from sqlalchemy import select

from app.api.errors import bad_request, conflict, not_found
from app.models.dictionary import DictionaryAudio, DictionaryWord
from app.services.auth_security import utc_now


def reading_key(value: str) -> str:
    value = unicodedata.normalize("NFC", value).lower().replace("u:", "ü").replace("v", "ü")
    return re.sub(r"[\s'’]", "", value)


def current_readings(word: DictionaryWord) -> set[str]:
    return {reading_key(p) for p in re.split(r"[/|,，;；]", word.pinyin) if p.strip()}


def recording_matches_word(word, pinyins):
    """A catalog may include additional senses beyond the active dictionary entry."""
    active = current_readings(word)
    return bool(active) and active.issubset({reading_key(p) for p in pinyins})


async def review_recording(db, audio_id, *, sha256, decision, approved_pinyin, actor_id):
    # Lock in the same order as bundle import. Both the asset and live word can change.
    word_id = await db.scalar(select(DictionaryAudio.word_id).where(DictionaryAudio.id == audio_id))
    if word_id is None:
        raise not_found("Dictionary audio")
    word = await db.scalar(select(DictionaryWord).where(DictionaryWord.id == word_id).with_for_update())
    clip = await db.scalar(select(DictionaryAudio).where(DictionaryAudio.id == audio_id).with_for_update())
    if not word or not clip:
        raise not_found("Dictionary audio")
    if clip.sha256 != sha256:
        raise conflict("Recording changed; reload before reviewing")
    if word.status != "published" or not recording_matches_word(word, clip.pinyins):
        raise conflict("Dictionary pronunciation changed; recording needs regeneration")
    if decision == "approved":
        heard = next((p for p in clip.pinyins if reading_key(p) == reading_key(approved_pinyin or "")), None)
        if not heard or reading_key(heard) not in current_readings(word):
            raise bad_request("Select the pronunciation heard in this recording")
        if word.audio_url and word.audio_url != clip.audio_url:
            raise conflict("An existing curated recording is active; edit the word before replacing it")
        clip.approved_pinyin = heard
        word.audio_url = clip.audio_url
        word.audio_pinyin = heard
    elif decision == "rejected":
        clip.approved_pinyin = None
        if word.audio_url == clip.audio_url:
            word.audio_url = None
            word.audio_pinyin = None
    else:
        raise bad_request("Invalid review decision")
    clip.status = decision
    clip.reviewed_by = actor_id
    clip.reviewed_at = utc_now()
    await db.flush()
    return clip, word
