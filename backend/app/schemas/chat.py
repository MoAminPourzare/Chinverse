from typing import Optional, List
from pydantic import BaseModel
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
    receiver_id: int
    content: str

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
