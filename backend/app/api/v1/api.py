from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, gallery, courses

api_router = APIRouter()

# Authentication - auth.py has /login/access-token and /signup endpoints
# No prefix needed since paths are already complete
api_router.include_router(auth.router, tags=["auth"])

# Users - users.py has /me, /me/profile, /me/avatar endpoints
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Gallery - gallery.py has /, /{item_id} endpoints (maps to /users/me/gallery/*)
api_router.include_router(gallery.router, prefix="/users/me/gallery", tags=["gallery"])

# Courses - courses.py has /, /{id}, /{id}/lessons, /lessons/{id} endpoints
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
