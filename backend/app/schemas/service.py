from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ServiceBase(BaseModel):
    """Base service schema"""
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=4000)
    price_label: Optional[str] = Field(default=None, max_length=80)


class ServiceCreate(ServiceBase):
    """Schema for creating a service (banner uploaded separately)"""
    pass


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    title: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = Field(default=None, max_length=4000)
    price_label: Optional[str] = Field(default=None, max_length=80)


class Service(ServiceBase):
    """Full service schema for API responses"""
    id: int
    user_id: int
    banner_url: Optional[str] = None
    created_at: datetime
    likes_count: int = 0

    class Config:
        from_attributes = True


class ServicePublic(BaseModel):
    """Public service without user_id exposed"""
    id: int
    title: str
    description: str
    banner_url: Optional[str] = None
    price_label: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ===== PUBLIC SHOWCASE SCHEMAS =====

class ServiceProviderInfo(BaseModel):
    """Minimal user info for service provider"""
    id: int
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    headline: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceWithProvider(BaseModel):
    """Service with provider info for public showcase"""
    id: int
    title: str
    description: str
    banner_url: Optional[str] = None
    price_label: Optional[str] = None
    created_at: datetime
    likes_count: int = 0
    provider: Optional[ServiceProviderInfo] = None

    class Config:
        from_attributes = True
