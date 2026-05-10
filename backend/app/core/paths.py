from pathlib import Path
from typing import Optional


BACKEND_DIR = Path(__file__).resolve().parents[2]
UPLOADS_DIR = BACKEND_DIR / "uploads"
STATIC_DIR = BACKEND_DIR / "static"

AVATARS_DIR = UPLOADS_DIR / "avatars"
VIDEOS_DIR = UPLOADS_DIR / "videos"
THUMBNAILS_DIR = UPLOADS_DIR / "thumbnails"
GALLERY_UPLOAD_DIR = STATIC_DIR / "uploads" / "gallery"
SERVICE_UPLOAD_DIR = STATIC_DIR / "uploads" / "services"


def ensure_upload_dirs() -> None:
    for directory in (AVATARS_DIR, VIDEOS_DIR, THUMBNAILS_DIR, GALLERY_UPLOAD_DIR, SERVICE_UPLOAD_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def _within_base(path: Path, base: Path) -> Optional[Path]:
    resolved_path = path.resolve()
    resolved_base = base.resolve()
    try:
        resolved_path.relative_to(resolved_base)
    except ValueError:
        return None
    return resolved_path


def resolve_backend_file_url(public_url: Optional[str]) -> Optional[Path]:
    if not public_url:
        return None

    clean_url = public_url.lstrip("/")

    if clean_url.startswith("uploads/gallery/") or clean_url.startswith("uploads/services/"):
        return _within_base(STATIC_DIR / clean_url, STATIC_DIR)

    if clean_url.startswith("static/"):
        return _within_base(BACKEND_DIR / clean_url, STATIC_DIR)

    if clean_url.startswith("uploads/avatars/") or clean_url.startswith("uploads/videos/") or clean_url.startswith("uploads/thumbnails/"):
        return _within_base(BACKEND_DIR / clean_url, UPLOADS_DIR)

    return None


def safe_unlink(path: Optional[Path]) -> None:
    if path and path.exists() and path.is_file():
        try:
            path.unlink()
        except OSError:
            pass
