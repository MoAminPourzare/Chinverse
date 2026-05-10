from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

# ===== FORUM QUESTION SCHEMAS =====

class ForumQuestionBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    content: str = Field(min_length=3, max_length=8000)

class ForumQuestionCreate(ForumQuestionBase):
    pass

class UserSummary(BaseModel):
    """Minimal user info for display in lists"""
    id: int
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ForumQuestionRead(ForumQuestionBase):
    id: int
    author_user_id: int
    created_at: datetime
    author: Optional[UserSummary] = None
    answers_count: int = 0

    class Config:
        from_attributes = True

# ===== FORUM ANSWER SCHEMAS =====

class ForumAnswerBase(BaseModel):
    content: str = Field(min_length=1, max_length=8000)

class ForumAnswerCreate(ForumAnswerBase):
    question_id: int = Field(gt=0)

class ForumAnswerRead(ForumAnswerBase):
    id: int
    question_id: int
    author_user_id: int
    created_at: datetime
    author: Optional[UserSummary] = None

    class Config:
        from_attributes = True

# ===== ARTICLE SCHEMAS =====

class ArticleBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    summary: Optional[str] = Field(default=None, max_length=500)
    content: str = Field(min_length=3, max_length=50000)
    cover_image: Optional[str] = Field(default=None, max_length=500)

class ArticleCreate(ArticleBase):
    pass

class ArticleRead(ArticleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ===== SUPPORT TICKET SCHEMAS =====

class SupportTicketCreate(BaseModel):
    message: str = Field(min_length=1, max_length=4000)

class SupportTicketRead(BaseModel):
    id: int
    user_id: int
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class SupportTicketResponse(BaseModel):
    success: bool
    message: str
    ticket_id: int
