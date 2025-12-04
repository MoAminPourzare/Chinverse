from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, gallery, courses

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(gallery.router, prefix="/users/me/gallery", tags=["gallery"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
