from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Gallery Item Schemas
class GalleryItemBase(BaseModel):
    caption: Optional[str] = Field(default=None, max_length=500)

class GalleryItemCreate(GalleryItemBase):
    pass

class GalleryItemUpdate(GalleryItemBase):
    pass

class GalleryItem(GalleryItemBase):
    id: int
    user_id: int
    image_url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
