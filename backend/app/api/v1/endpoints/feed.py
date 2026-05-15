from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.models.user import User, UserProfile, UserGalleryItem
from app.models.service import UserService
from app.models.social import ContentComment, ContentLike

router = APIRouter()


async def _read_engagement_counts(
    db: AsyncSession,
    target_type: str,
    target_ids: list[int],
) -> dict[int, dict[str, int]]:
    if not target_ids:
        return {}

    likes_result = await db.execute(
        select(ContentLike.target_id, func.count(ContentLike.id))
        .where(ContentLike.target_type == target_type, ContentLike.target_id.in_(target_ids))
        .group_by(ContentLike.target_id)
    )
    comments_result = await db.execute(
        select(ContentComment.target_id, func.count(ContentComment.id))
        .where(ContentComment.target_type == target_type, ContentComment.target_id.in_(target_ids))
        .group_by(ContentComment.target_id)
    )
    counts = {target_id: {"likes_count": 0, "comments_count": 0} for target_id in target_ids}
    for target_id, count in likes_result.all():
        counts[int(target_id)]["likes_count"] = int(count or 0)
    for target_id, count in comments_result.all():
        counts[int(target_id)]["comments_count"] = int(count or 0)
    return counts


def _provider_info(item: UserGalleryItem | UserService) -> dict[str, Any] | None:
    user = item.user
    if user and user.profile:
        return {
            "id": user.id,
            "display_name": user.profile.display_name,
            "avatar_url": user.profile.avatar_url,
            "headline": user.profile.headline,
        }
    if user:
        return {
            "id": user.id,
            "display_name": None,
            "avatar_url": None,
            "headline": None,
        }
    return None


@router.get("", response_model=List[dict])
async def get_feed(
    db: AsyncSession = Depends(deps.get_db),
    pagination: PaginationParams = Depends(pagination_params(default_limit=20)),
) -> Any:
    """
    Get unified activity feed combining gallery items and services.
    Returns items sorted by creation date (newest first).
    """
    # Fetch latest gallery items with user info
    fetch_limit = max(pagination.skip + pagination.limit, pagination.limit)

    gallery_result = await db.execute(
        select(UserGalleryItem)
        .options(selectinload(UserGalleryItem.user).selectinload(User.profile))
        .order_by(desc(UserGalleryItem.created_at))
        .limit(fetch_limit)
    )
    gallery_items = gallery_result.scalars().all()

    # Fetch latest services with user info
    service_result = await db.execute(
        select(UserService)
        .options(selectinload(UserService.user).selectinload(User.profile))
        .order_by(desc(UserService.created_at))
        .limit(fetch_limit)
    )
    services = service_result.scalars().all()
    gallery_counts = await _read_engagement_counts(db, "post", [item.id for item in gallery_items])
    service_counts = await _read_engagement_counts(db, "service", [service.id for service in services])

    # Build feed items
    feed_items = []

    # Add gallery items
    for item in gallery_items:
        feed_items.append({
            "id": f"gallery_{item.id}",
            "type": "gallery",
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "likes_count": gallery_counts.get(item.id, {}).get("likes_count", 0),
            "comments_count": gallery_counts.get(item.id, {}).get("comments_count", 0),
            "data": {
                "id": item.id,
                "image_url": item.image_url,
                "caption": item.caption,
            },
            "provider": _provider_info(item),
        })

    # Add services
    for service in services:
        feed_items.append({
            "id": f"service_{service.id}",
            "type": "service",
            "created_at": service.created_at.isoformat() if service.created_at else None,
            "likes_count": service_counts.get(service.id, {}).get("likes_count", 0),
            "comments_count": service_counts.get(service.id, {}).get("comments_count", 0),
            "data": {
                "id": service.id,
                "title": service.title,
                "description": service.description,
                "banner_url": service.banner_url,
                "price_label": service.price_label,
            },
            "provider": _provider_info(service),
        })

    # Sort by created_at descending
    feed_items.sort(
        key=lambda x: x["created_at"] or "",
        reverse=True
    )

    # Apply pagination
    return feed_items[pagination.skip:pagination.skip + pagination.limit]


@router.get("/posts/{post_id}", response_model=dict)
async def get_post_detail(
    post_id: int,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    result = await db.execute(
        select(UserGalleryItem)
        .options(selectinload(UserGalleryItem.user).selectinload(User.profile))
        .where(UserGalleryItem.id == post_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise not_found("Post")

    counts = await _read_engagement_counts(db, "post", [item.id])
    item_counts = counts.get(item.id, {})
    return {
        "id": item.id,
        "image_url": item.image_url,
        "caption": item.caption,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "likes_count": item_counts.get("likes_count", 0),
        "comments_count": item_counts.get("comments_count", 0),
        "provider": _provider_info(item),
    }
