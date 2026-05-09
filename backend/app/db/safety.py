import os

from app.core.config import PRODUCTION_ENVIRONMENTS, settings


def assert_destructive_db_action_allowed(action_name: str) -> None:
    if settings.ENVIRONMENT.lower() in PRODUCTION_ENVIRONMENTS:
        raise RuntimeError(f"Refusing to run destructive database action in production: {action_name}")

    if os.getenv("ALLOW_DESTRUCTIVE_DB_ACTION") != "1":
        raise RuntimeError(
            f"Refusing to run '{action_name}'. "
            "Set ALLOW_DESTRUCTIVE_DB_ACTION=1 only when you are sure this is a local/dev database."
        )
