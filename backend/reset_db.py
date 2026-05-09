"""
Development-only database reset.

This script deletes user-related data with TRUNCATE ... CASCADE.
It is intentionally blocked unless ALLOW_DESTRUCTIVE_DB_ACTION=1 is set.
Never run it against production.
"""

import asyncio
import os
import sys

from sqlalchemy import text

sys.path.append(os.getcwd())

from app.db.safety import assert_destructive_db_action_allowed
from app.db.session import SessionLocal


async def reset_database() -> None:
    assert_destructive_db_action_allowed("reset_db")

    async with SessionLocal() as session:
        try:
            print("Truncating user_profiles and users with CASCADE...")
            await session.execute(text("TRUNCATE TABLE user_profiles, users RESTART IDENTITY CASCADE;"))
            await session.commit()
            print("Database reset complete.")
        except Exception:
            await session.rollback()
            raise


async def main() -> None:
    print("Database Reset Script")
    print("This will DELETE user data and dependent records.")
    print("Required safety flag: ALLOW_DESTRUCTIVE_DB_ACTION=1")

    confirmation = input("Type RESET to continue: ")
    if confirmation != "RESET":
        print("Reset cancelled.")
        return

    await reset_database()


if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
