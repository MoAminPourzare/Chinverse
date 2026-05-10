from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

# Schemas for API requests/responses

class LeitnerAddRequest(BaseModel):
    word_id: Optional[int] = Field(default=None, ge=0)  # Can be None or 0 for mock vocabulary
    chinese: Optional[str] = Field(default=None, max_length=80)  # Chinese characters to find/create word
    pinyin: Optional[str] = Field(default=None, max_length=160)   # Pinyin for creating new word
    persian_meaning: Optional[str] = Field(default=None, max_length=2000)
    chinese_meaning: Optional[str] = Field(default=None, max_length=4000)

class FlashcardBase(BaseModel):
    id: int
    user_id: int
    word_id: int
    box_number: int
    next_review_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class DictionaryWordSimple(BaseModel):
    id: int
    chinese: str
    pinyin: str
    persian_meaning: Optional[str] = None
    chinese_meaning: Optional[str] = None
    composition: Optional[str] = None
    audio_url: Optional[str] = None
    
    class Config:
        from_attributes = True

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
