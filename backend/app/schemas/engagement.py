from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EngagementState(BaseModel):
    target_type: str
    target_id: int
    liked: bool = False
    likes_count: int = 0
    comments_count: int = 0


class EngagementCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    parent_id: Optional[int] = Field(default=None, gt=0)


class EngagementUserSummary(BaseModel):
    id: int
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class EngagementCommentRead(BaseModel):
    id: int
    target_type: str
    target_id: int
    user_id: int
    parent_id: Optional[int] = None
    content: str
    created_at: datetime
    author: Optional[EngagementUserSummary] = None

    class Config:
        from_attributes = True
