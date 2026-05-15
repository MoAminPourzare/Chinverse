from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from app.api import deps
from app.api.errors import not_found
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import upload_rate_limit, write_rate_limit
from app.core.storage import delete_public_file
from app.core.uploads import save_image_upload
from app.models.user import User, UserGalleryItem
from app.models.social import ContentComment, ContentLike
from app.core.paths import GALLERY_UPLOAD_DIR, resolve_backend_file_url, safe_unlink
from app.schemas.gallery import GalleryItem
from app.db.session import get_db
from app.services.notifications import notify_followers

router = APIRouter()

@router.get("/", response_model=List[GalleryItem])
async def get_user_gallery(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=50)),
):
    """
    Get all gallery items for the current user.
    """
    stmt = select(UserGalleryItem).filter(
        UserGalleryItem.user_id == current_user.id
    ).order_by(UserGalleryItem.created_at.desc()).offset(pagination.skip).limit(pagination.limit)
    
    result = await db.execute(stmt)
    gallery_items = result.scalars().all()
    
    return gallery_items

@router.post("/", response_model=GalleryItem, status_code=status.HTTP_201_CREATED)
async def upload_gallery_image(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...),
    caption: str | None = Form(None, max_length=500),
    _rate_limit: None = Depends(upload_rate_limit),
):
    """
    Upload a new image to the user's gallery.
    """
    image_url = await save_image_upload(
        file,
        destination_dir=GALLERY_UPLOAD_DIR,
        public_url_prefix="/uploads/gallery",
    )
    if caption is not None:
        caption = caption.strip() or None
    gallery_item = UserGalleryItem(
        user_id=current_user.id,
        image_url=image_url,
        caption=caption
    )
    
    db.add(gallery_item)
    try:
        await db.commit()
        await db.refresh(gallery_item)
    except Exception:
        await db.rollback()
        delete_public_file(image_url)
        raise

    try:
        display_name = current_user.profile.display_name if current_user.profile else "Chinverse user"
        await notify_followers(
            db,
            actor_user_id=current_user.id,
            type="post",
            title="اثر جدید در ویترین",
            body=f"{display_name} یک تصویر جدید در گالری منتشر کرد.",
            target_url=f"/users/{current_user.id}",
            metadata={"gallery_item_id": gallery_item.id},
        )
    except Exception:
        await db.rollback()
    
    return gallery_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_item(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    item_id: int,
    _rate_limit: None = Depends(write_rate_limit),
):
    """
    Delete a gallery item.
    """
    stmt = select(UserGalleryItem).filter(
        UserGalleryItem.id == item_id,
        UserGalleryItem.user_id == current_user.id
    )
    
    result = await db.execute(stmt)
    gallery_item = result.scalar_one_or_none()
    
    if not gallery_item:
        raise not_found("Gallery item")
    
    # Delete file from filesystem
    safe_unlink(resolve_backend_file_url(gallery_item.image_url))
    await db.execute(delete(ContentComment).where(ContentComment.target_type == "post", ContentComment.target_id == item_id))
    await db.execute(delete(ContentLike).where(ContentLike.target_type == "post", ContentLike.target_id == item_id))
    
    await db.delete(gallery_item)
    await db.commit()
    
    return None
