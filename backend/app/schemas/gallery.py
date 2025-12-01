from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# Gallery Item Schemas
class GalleryItemBase(BaseModel):
    caption: Optional[str] = None

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
