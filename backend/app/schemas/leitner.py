from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field

# Schemas for API requests/responses

class LeitnerAddRequest(BaseModel):
    word_id: int = Field(gt=0)

class FlashcardBase(BaseModel):
    id: int
    user_id: int
    word_id: int
    box_number: int
    next_review_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DictionaryWordDefinitionSimple(BaseModel):
    id: int
    lang_code: str
    definition_text: str
    part_of_speech: str
    sense_order: int = 1
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DictionaryWordExampleSimple(BaseModel):
    id: int
    zh_text: str
    pinyin: str
    target_text: str
    sense_order: int = 1

    model_config = ConfigDict(from_attributes=True)


class DictionaryWordCollocationSimple(BaseModel):
    id: int
    phrase_zh: str
    phrase_pinyin: str
    translation_target: str
    sense_order: int = 1

    model_config = ConfigDict(from_attributes=True)


class DictionaryWordSimple(BaseModel):
    id: int
    chinese: str
    pinyin: str
    level: str
    hsk_level: Optional[int] = None
    source: str = "manual"
    source_word_id: Optional[str] = None
    status: str = "published"
    persian_meaning: Optional[str] = None
    chinese_meaning: Optional[str] = None
    composition: Optional[str] = None
    audio_url: Optional[str] = None
    notes: Optional[str] = None
    definitions: List[DictionaryWordDefinitionSimple] = Field(default_factory=list)
    examples: List[DictionaryWordExampleSimple] = Field(default_factory=list)
    collocations: List[DictionaryWordCollocationSimple] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

class FlashcardRead(FlashcardBase):
    word: DictionaryWordSimple

class LeitnerDashboardStats(BaseModel):
    box_counts: Dict[int, int]
    due_by_box: Dict[int, int]
    box_intervals: Dict[int, int]
    total_cards: int
    total_due: int
    upcoming_count: int
    mastered_count: int
    next_due_at: Optional[datetime] = None
    recent_cards: List[FlashcardRead]

class LeitnerReviewResponse(BaseModel):
    cards: List[FlashcardRead]
