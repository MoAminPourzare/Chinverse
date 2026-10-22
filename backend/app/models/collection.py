from sqlalchemy import BigInteger, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin


class UserSavedCollection(Base, TimestampMixin):
    """A personal catalog bookmark, independent of media publication."""

    __tablename__ = "user_saved_collections"
    __table_args__ = (Index("ix_user_saved_collections_user_created", "user_id", "created_at"),)

    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    domain: Mapped[str] = mapped_column(String(40), primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), primary_key=True)
