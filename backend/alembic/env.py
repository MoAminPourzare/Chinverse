import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ---------------------------------------------------------------------
# FIX 1: Add project root to path safely
# This ensures we can import 'app' regardless of where the command is run
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------
# FIX 2: Rename the config import to avoid conflict with 'app.models.settings'
from app.core.config import settings as app_config
# ---------------------------------------------------------------------

from app.db.base_class import Base

# ---------------------------------------------------------------------
# FIX 3: Do NOT use 'from app.models import *'
# Just import the package. Since __init__.py inside models imports everything,
# Base.metadata will still be populated correctly.
import app.models
# ---------------------------------------------------------------------

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # FIX 4: Use app_config here
    # Make sure to convert to string in case it's a Pydantic URL object
    url = str(app_config.ASYNC_DATABASE_URL)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    
    # FIX 5: Use app_config here
    configuration["sqlalchemy.url"] = str(app_config.ASYNC_DATABASE_URL)

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())