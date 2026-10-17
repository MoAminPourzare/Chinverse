from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.pagination import PaginationParams, pagination_params
from app.api.rate_limit import write_rate_limit
from app.models.collection import UserSavedCollection

router = APIRouter()

# Only catalog identities are stored. Titles, images and links stay in the
# public catalog; saving a collection never publishes or grants media access.
CollectionDomain = Literal[
    "hsk", "pronunciation", "characters", "grammar", "idioms", "practical",
    "vlogs", "synonyms", "classical", "series", "movies", "cartoons", "cooking", "topic-talks",
    "podcasts", "music", "martial-arts", "energy-health", "calligraphy",
    "tea-culture", "culture-texts", "historical-stories", "classical-poetry", "festivals-customs",
]
CollectionSlug = Annotated[str, Path(min_length=1, max_length=128, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]


class SavedCollection(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    domain: CollectionDomain
    slug: str


class SavedCollectionState(BaseModel):
    saved: bool


@router.get("/saved", response_model=list[SavedCollection])
async def read_saved_collections(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
    pagination: PaginationParams = Depends(pagination_params(default_limit=100, max_limit=1000)),
):
    result = await db.scalars(
        select(UserSavedCollection)
        .where(UserSavedCollection.user_id == current_user.id)
        .order_by(UserSavedCollection.created_at.desc(), UserSavedCollection.domain, UserSavedCollection.slug)
        .offset(pagination.skip).limit(pagination.limit)
    )
    return result.all()


@router.get("/{domain}/{slug}/saved", response_model=SavedCollectionState)
async def read_saved_collection_state(
    domain: CollectionDomain,
    slug: CollectionSlug,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    saved = await db.get(UserSavedCollection, (current_user.id, domain, slug))
    return {"saved": saved is not None}


@router.post("/{domain}/{slug}/save", response_model=SavedCollectionState,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(write_rate_limit)])
async def save_collection(
    domain: CollectionDomain,
    slug: CollectionSlug,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    await db.execute(
        insert(UserSavedCollection).values(user_id=current_user.id, domain=domain, slug=slug)
        .on_conflict_do_nothing(index_elements=["user_id", "domain", "slug"])
    )
    await db.commit()
    return {"saved": True}


@router.delete("/{domain}/{slug}/save", response_model=SavedCollectionState,
               dependencies=[Depends(write_rate_limit)])
async def unsave_collection(
    domain: CollectionDomain,
    slug: CollectionSlug,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    await db.execute(delete(UserSavedCollection).where(
        UserSavedCollection.user_id == current_user.id,
        UserSavedCollection.domain == domain,
        UserSavedCollection.slug == slug,
    ))
    await db.commit()
    return {"saved": False}
