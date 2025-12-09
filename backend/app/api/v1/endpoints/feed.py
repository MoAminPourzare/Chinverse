from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.user import User, UserProfile, UserGalleryItem
from app.models.service import UserService

router = APIRouter()


@router.get("", response_model=List[dict])
async def get_feed(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    Get unified activity feed combining gallery items and services.
    Returns items sorted by creation date (newest first).
    """
    # Fetch latest gallery items with user info
    gallery_result = await db.execute(
        select(UserGalleryItem)
        .options(selectinload(UserGalleryItem.user).selectinload(User.profile))
        .order_by(desc(UserGalleryItem.created_at))
        .limit(limit)
    )
    gallery_items = gallery_result.scalars().all()

    # Fetch latest services with user info
    service_result = await db.execute(
        select(UserService)
        .options(selectinload(UserService.user).selectinload(User.profile))
        .order_by(desc(UserService.created_at))
        .limit(limit)
    )
    services = service_result.scalars().all()

    # Build feed items
    feed_items = []

    # Add gallery items
    for item in gallery_items:
        provider_info = None
        if item.user and item.user.profile:
            provider_info = {
                "id": item.user.id,
                "display_name": item.user.profile.display_name,
                "avatar_url": item.user.profile.avatar_url,
                "headline": item.user.profile.headline,
            }
        elif item.user:
            provider_info = {
                "id": item.user.id,
                "display_name": None,
                "avatar_url": None,
                "headline": None,
            }

        feed_items.append({
            "id": f"gallery_{item.id}",
            "type": "gallery",
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "data": {
                "id": item.id,
                "image_url": item.image_url,
                "caption": item.caption,
            },
            "provider": provider_info,
        })

    # Add services
    for service in services:
        provider_info = None
        if service.user and service.user.profile:
            provider_info = {
                "id": service.user.id,
                "display_name": service.user.profile.display_name,
                "avatar_url": service.user.profile.avatar_url,
                "headline": service.user.profile.headline,
            }
        elif service.user:
            provider_info = {
                "id": service.user.id,
                "display_name": None,
                "avatar_url": None,
                "headline": None,
            }

        feed_items.append({
            "id": f"service_{service.id}",
            "type": "service",
            "created_at": service.created_at.isoformat() if service.created_at else None,
            "data": {
                "id": service.id,
                "title": service.title,
                "description": service.description,
                "banner_url": service.banner_url,
                "price_label": service.price_label,
            },
            "provider": provider_info,
        })

    # Sort by created_at descending
    feed_items.sort(
        key=lambda x: x["created_at"] or "",
        reverse=True
    )

    # Apply pagination
    return feed_items[skip:skip + limit]
