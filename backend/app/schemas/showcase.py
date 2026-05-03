from typing import Optional, List
from pydantic import BaseModel, Field

class GalleryItemPublic(BaseModel):
    """Public gallery item - no user_id exposed"""
    id: int
    image_url: str
    caption: Optional[str] = None

    class Config:
        from_attributes = True

class EducationSummary(BaseModel):
    """Summary of first education entry for showcase card"""
    university: Optional[str] = None
    field: Optional[str] = None
    degree: Optional[str] = None

class ShowcaseUser(BaseModel):
    """Summary user data for showcase list cards"""
    id: int
    display_name: Optional[str] = None
    headline: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    education: Optional[EducationSummary] = None
    gallery_preview: List[str] = Field(default_factory=list)  # First 3 image URLs
    hsk_level: Optional[str] = None

    class Config:
        from_attributes = True

class PublicUserProfile(BaseModel):
    """Full public profile data"""
    display_name: Optional[str] = None
    headline: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    websites: Optional[List[str]] = None
    socials: Optional[List[dict]] = None
    resume: Optional[dict] = None

    class Config:
        from_attributes = True

class PublicUser(BaseModel):
    """Full public user for profile view - excludes email, phone, password"""
    id: int
    profile: Optional[PublicUserProfile] = None
    gallery_items: List[GalleryItemPublic] = Field(default_factory=list)

    class Config:
        from_attributes = True
