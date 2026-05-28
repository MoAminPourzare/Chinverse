from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# ===== FORUM QUESTION SCHEMAS =====

class ForumQuestionBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    content: str = Field(min_length=3, max_length=8000)

    @field_validator("title", "content", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

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

    @field_validator("content", mode="before")
    @classmethod
    def strip_content(cls, value: str) -> str:
        return value.strip()

class ForumAnswerCreate(ForumAnswerBase):
    parent_id: Optional[int] = Field(default=None, gt=0)

class ForumAnswerRead(ForumAnswerBase):
    id: int
    question_id: int
    author_user_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    author: Optional[UserSummary] = None

    class Config:
        from_attributes = True


class ForumQuestionDetailRead(ForumQuestionRead):
    answers: List[ForumAnswerRead] = Field(default_factory=list)

# ===== ARTICLE SCHEMAS =====

class ArticleBase(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    summary: Optional[str] = Field(default=None, max_length=500)
    content: str = Field(min_length=3, max_length=50000)
    cover_image: Optional[str] = Field(default=None, max_length=500)

    @field_validator("title", "content", mode="before")
    @classmethod
    def strip_required_article_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("summary", "cover_image", mode="before")
    @classmethod
    def strip_optional_article_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return value.strip() or None

class ArticleCreate(ArticleBase):
    pass

class ArticleRead(ArticleBase):
    id: int
    author_user_id: Optional[int] = None
    author: Optional[UserSummary] = None
    created_at: datetime
    comments_count: int = 0

    class Config:
        from_attributes = True


class ArticleCommentBase(BaseModel):
    content: str = Field(min_length=1, max_length=8000)

    @field_validator("content", mode="before")
    @classmethod
    def strip_comment(cls, value: str) -> str:
        return value.strip()


class ArticleCommentCreate(ArticleCommentBase):
    parent_id: Optional[int] = Field(default=None, gt=0)


class ArticleCommentRead(ArticleCommentBase):
    id: int
    article_id: int
    author_user_id: int
    parent_id: Optional[int] = None
    created_at: datetime
    author: Optional[UserSummary] = None

    class Config:
        from_attributes = True


class ArticleDetailRead(ArticleRead):
    comments: List[ArticleCommentRead] = Field(default_factory=list)

# ===== SUPPORT TICKET SCHEMAS =====

class SupportTicketCreate(BaseModel):
    message: str = Field(min_length=10, max_length=4000)

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, value: str) -> str:
        return value.strip()

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
