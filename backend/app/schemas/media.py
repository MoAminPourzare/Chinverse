from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class MediaAssetBase(BaseModel):
    media_type: str = Field(min_length=1, max_length=40)
    file_url: str = Field(min_length=1, max_length=1000)
    thumbnail_url: Optional[str] = Field(default=None, max_length=1000)
    storage_provider: str = Field(default="local", max_length=40)
    storage_key: str = Field(min_length=1, max_length=1000)
    mime_type: Optional[str] = Field(default=None, max_length=120)
    file_size_bytes: Optional[int] = Field(default=None, ge=0)
    duration_seconds: Optional[float] = Field(default=None, ge=0)
    width: Optional[int] = Field(default=None, ge=0)
    height: Optional[int] = Field(default=None, ge=0)
    metadata_json: Dict[str, Any] = Field(default_factory=dict)


class MediaAssetCreate(MediaAssetBase):
    playback_type: Literal["hls", "progressive"] = "progressive"
    checksum_sha256: Optional[str] = Field(default=None, min_length=64, max_length=64)
    source_name: Optional[str] = Field(default=None, max_length=255)
    source_url: Optional[str] = Field(default=None, max_length=1000)
    rights_holder: Optional[str] = Field(default=None, max_length=255)
    license_type: Optional[str] = Field(default=None, max_length=120)
    license_url: Optional[str] = Field(default=None, max_length=1000)
    supersedes_id: Optional[int] = Field(default=None, gt=0)

    @field_validator("checksum_sha256", mode="before")
    @classmethod
    def normalize_checksum(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        checksum = value.strip().lower()
        if not checksum:
            return None
        if len(checksum) != 64 or any(character not in "0123456789abcdef" for character in checksum):
            raise ValueError("checksum_sha256 must contain 64 lowercase hexadecimal characters")
        return checksum


class MediaAssetUpdate(BaseModel):
    playback_type: Optional[Literal["hls", "progressive"]] = None
    checksum_sha256: Optional[str] = Field(default=None, max_length=64)
    source_name: Optional[str] = Field(default=None, max_length=255)
    source_url: Optional[str] = Field(default=None, max_length=1000)
    rights_holder: Optional[str] = Field(default=None, max_length=255)
    license_type: Optional[str] = Field(default=None, max_length=120)
    license_url: Optional[str] = Field(default=None, max_length=1000)
    metadata_json: Optional[Dict[str, Any]] = None

    _normalize_checksum = field_validator("checksum_sha256", mode="before")(
        MediaAssetCreate.normalize_checksum.__func__
    )


class MediaLicenseReview(BaseModel):
    status: Literal["approved", "rejected"]
    notes: Optional[str] = Field(default=None, max_length=4000)


class WorkflowValidation(BaseModel):
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class SubtitleCueIn(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    zh_text: str = Field(default="", max_length=10000)
    pinyin: str = Field(default="", max_length=10000)
    target_text: str = Field(default="", max_length=10000)
    highlighted_words: List[str] = Field(default_factory=list, max_length=200)

    @field_validator("zh_text", "pinyin", "target_text", mode="before")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return str(value or "").strip()

    @field_validator("highlighted_words", mode="before")
    @classmethod
    def normalize_words(cls, value: List[str]) -> List[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for item in value or []:
            word = str(item).strip()
            if word and word not in seen:
                normalized.append(word)
                seen.add(word)
        return normalized

    @model_validator(mode="after")
    def validate_cue(self):
        if self.end <= self.start:
            raise ValueError("Subtitle cue end must be after start")
        if not any((self.zh_text, self.pinyin, self.target_text)):
            raise ValueError("Subtitle cue must contain text")
        return self


class SubtitleTrackCreate(BaseModel):
    language: str = Field(min_length=2, max_length=20)
    format: Literal["json", "srt", "vtt"] = "json"
    source_name: Optional[str] = Field(default=None, max_length=255)
    cues: List[SubtitleCueIn] = Field(default_factory=list, max_length=10000)
    content: Optional[str] = Field(default=None, max_length=2_000_000)

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language(cls, value: str) -> str:
        language = value.strip().lower().replace("_", "-")
        if not language or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789-" for character in language):
            raise ValueError("language must be a valid language tag")
        return language

    @model_validator(mode="after")
    def validate_source(self):
        if self.format == "json" and not self.cues:
            raise ValueError("JSON subtitle tracks require cues")
        if self.format in {"srt", "vtt"} and not (self.content or "").strip():
            raise ValueError("SRT/VTT subtitle tracks require content")
        return self


class SubtitleCueRead(BaseModel):
    id: int
    start: float
    end: float
    zh_text: str
    pinyin: str
    target_text: str
    highlighted_words: List[str] = Field(default_factory=list)


class SubtitleTrackRead(BaseModel):
    id: int
    lesson_id: int
    language: str
    format: str
    version: int
    status: str
    quality_status: str
    quality_score: Optional[float] = None
    quality_report: Dict[str, Any] = Field(default_factory=dict)
    checksum_sha256: Optional[str] = None
    source_name: Optional[str] = None
    cues: List[SubtitleCueRead] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class LessonWorkflowUpdate(BaseModel):
    media_id: Optional[int] = Field(default=None, gt=0)
    poster_media_id: Optional[int] = Field(default=None, gt=0)
    is_free: Optional[bool] = None


class PlaybackLesson(BaseModel):
    id: int
    course_id: int
    section_id: int
    title: str
    duration_seconds: float
    is_free: bool


class PlaybackMedia(BaseModel):
    id: int
    playback_url: str
    playback_type: Literal["hls", "mp4"]
    poster_url: Optional[str] = None
    expires_at: datetime


class PlaybackEntitlement(BaseModel):
    required: bool
    granted: bool
    reason: str


class LessonPlaybackResponse(BaseModel):
    lesson: PlaybackLesson
    media: PlaybackMedia
    entitlement: PlaybackEntitlement
    subtitles: List[SubtitleTrackRead] = Field(default_factory=list)


class MediaAssetRead(MediaAssetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    status: str
    revision: int
    supersedes_id: Optional[int] = None
    playback_type: str
    checksum_sha256: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    rights_holder: Optional[str] = None
    license_type: Optional[str] = None
    license_url: Optional[str] = None
    license_status: str
    license_notes: Optional[str] = None
    license_reviewed_at: Optional[datetime] = None
    license_reviewed_by_id: Optional[int] = None
    published_at: Optional[datetime] = None
    published_by_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
