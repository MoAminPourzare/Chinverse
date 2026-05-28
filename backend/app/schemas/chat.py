from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# ===== USER SUMMARY =====

class ChatUserSummary(BaseModel):
    """Minimal user info for chat display"""
    id: int
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# ===== MESSAGE SCHEMAS =====

class MessageCreate(BaseModel):
    receiver_id: int = Field(gt=0)
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: str) -> str:
        return value.strip()

class MessageRead(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime
    sender: Optional[ChatUserSummary] = None
    receiver: Optional[ChatUserSummary] = None

    class Config:
        from_attributes = True

# ===== CONVERSATION SCHEMAS =====

class ConversationPreview(BaseModel):
    """Preview of a conversation for the inbox list"""
    user: ChatUserSummary
    last_message: str
    last_message_time: datetime
    unread_count: int = 0
    is_online: bool = False
