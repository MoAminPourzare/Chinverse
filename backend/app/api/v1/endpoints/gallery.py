from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api import deps
from app.models.user import User, UserGalleryItem
from app.core.paths import GALLERY_UPLOAD_DIR, resolve_backend_file_url, safe_unlink
from app.schemas.gallery import GalleryItem
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=List[GalleryItem])
async def get_user_gallery(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get all gallery items for the current user.
    """
    stmt = select(UserGalleryItem).filter(
        UserGalleryItem.user_id == current_user.id
    ).order_by(UserGalleryItem.created_at.desc())
    
    result = await db.execute(stmt)
    gallery_items = result.scalars().all()
    
    return gallery_items

@router.post("/", response_model=GalleryItem, status_code=status.HTTP_201_CREATED)
async def upload_gallery_image(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...),
    caption: str = Form(None),
):
    """
    Upload a new image to the user's gallery.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Generate unique filename
    file_extension = "." + file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    GALLERY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = GALLERY_UPLOAD_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Create database entry
    image_url = f"/uploads/gallery/{unique_filename}"
    gallery_item = UserGalleryItem(
        user_id=current_user.id,
        image_url=image_url,
        caption=caption
    )
    
    db.add(gallery_item)
    await db.commit()
    await db.refresh(gallery_item)
    
    return gallery_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_item(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    item_id: int,
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery item not found"
        )
    
    # Delete file from filesystem
    safe_unlink(resolve_backend_file_url(gallery_item.image_url))
    
    await db.delete(gallery_item)
    await db.commit()
    
    return None
