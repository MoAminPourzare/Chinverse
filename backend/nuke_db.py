"""
Development-only full database wipe.

This script drops and recreates the public schema.
It is intentionally blocked unless ALLOW_DESTRUCTIVE_DB_ACTION=1 is set.
Never run it against production.
"""

import asyncio
import os
import sys

from sqlalchemy import text

sys.path.append(os.getcwd())

from app.db.safety import assert_destructive_db_action_allowed
from app.db.session import engine


async def nuke_database() -> None:
    assert_destructive_db_action_allowed("nuke_db")

    async with engine.begin() as conn:
        print("Dropping and recreating the public schema...")
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        print("Database schema is fresh and empty.")


async def main() -> None:
    print("Full Database Wipe")
    print("This will DELETE every table and every row in the public schema.")
    print("Required safety flag: ALLOW_DESTRUCTIVE_DB_ACTION=1")

    confirmation = input("Type NUKE to continue: ")
    if confirmation != "NUKE":
        print("Nuke cancelled.")
        return

    await nuke_database()


if __name__ == "__main__":
    if os.name == "nt":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
