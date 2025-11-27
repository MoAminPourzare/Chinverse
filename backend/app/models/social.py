from enum import Enum
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Text, BigInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base, TimestampMixin

class FollowStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"

class ForumStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class UserFollow(Base, TimestampMixin):
    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "followee_id", name="uq_follower_followee"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    follower_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    followee_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    status: Mapped[FollowStatus] = mapped_column(String, default=FollowStatus.ACCEPTED)

    # Relationships
    follower: Mapped["User"] = relationship(foreign_keys=[follower_id])
    followee: Mapped["User"] = relationship(foreign_keys=[followee_id])

class Post(Base, TimestampMixin):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    author_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    author: Mapped["User"] = relationship()
    media: Mapped[List["PostMedia"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    likes: Mapped[List["PostLike"]] = relationship(back_populates="post", cascade="all, delete-orphan")
    comments: Mapped[List["PostComment"]] = relationship(back_populates="post", cascade="all, delete-orphan")

class PostMedia(Base, TimestampMixin):
    __tablename__ = "post_media"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)
    media_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("media_assets.id"), nullable=False)

    # Relationships
    post: Mapped["Post"] = relationship(back_populates="media")
    media: Mapped["MediaAsset"] = relationship()

class PostLike(Base, TimestampMixin):
    __tablename__ = "post_likes"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_post_like_user"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship()
    post: Mapped["Post"] = relationship(back_populates="likes")

class PostComment(Base, TimestampMixin):
    __tablename__ = "post_comments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("posts.id"), nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("post_comments.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship()
    post: Mapped["Post"] = relationship(back_populates="comments")
    replies: Mapped[List["PostComment"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["PostComment"]] = relationship(remote_side=[id], back_populates="replies")

class ForumQuestion(Base, TimestampMixin):
    __tablename__ = "forum_questions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    author_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ForumStatus] = mapped_column(String, default=ForumStatus.OPEN)

    # Relationships
    author: Mapped["User"] = relationship()
    answers: Mapped[List["ForumAnswer"]] = relationship(back_populates="question", cascade="all, delete-orphan")

class ForumAnswer(Base, TimestampMixin):
    __tablename__ = "forum_answers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("forum_questions.id"), nullable=False)
    author_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    question: Mapped["ForumQuestion"] = relationship(back_populates="answers")
    author: Mapped["User"] = relationship()

# Forward references
from app.models.user import User
from app.models.media import MediaAsset
