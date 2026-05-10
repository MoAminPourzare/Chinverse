from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


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


class MediaAssetRead(MediaAssetBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
