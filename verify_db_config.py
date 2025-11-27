import sys
import os
import asyncio

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.core.config import settings
    print(f"Settings loaded successfully.")
    print(f"ASYNC_DATABASE_URL: {settings.ASYNC_DATABASE_URL}")
    
    from app.db.session import engine
    print(f"Async Engine created successfully: {engine}")

    # Check if alembic env.py exists
    if os.path.exists("backend/alembic/env.py"):
        print("backend/alembic/env.py exists.")
    else:
        print("backend/alembic/env.py MISSING.")

except Exception as e:
    print(f"Error verifying DB config: {e}")
    sys.exit(1)
