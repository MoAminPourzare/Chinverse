"""
Database Reset Script

This script truncates the users and user_profiles tables to clear test data.
Run this from the terminal inside backend folder:
    python reset_db.py
"""

import asyncio
import sys
import os
from sqlalchemy import text

# Add the project root to sys.path to allow imports from app
sys.path.append(os.getcwd())

# FIX: Import SessionLocal correctly (not async_session_maker)
from app.db.session import SessionLocal

async def reset_database():
    """Truncate users and user_profiles tables"""
    # FIX: Use SessionLocal() to create the session instance
    async with SessionLocal() as session:
        try:
            # Disable foreign key checks temporarily (PostgreSQL)
            # This allows us to truncate tables regardless of relationship order
            # Note: TRUNCATE ... CASCADE usually handles this, but deferring constraints is safer for complex schemas
            await session.execute(text("SET CONSTRAINTS ALL DEFERRED;"))
            
            # Truncate tables
            # We use CASCADE to clean up dependent tables automatically
            print("Truncating tables (users, user_profiles)...")
            await session.execute(text("TRUNCATE TABLE user_profiles, users RESTART IDENTITY CASCADE;"))
            
            # Commit the transaction
            await session.commit()
            print("✓ Database reset complete!")
            
        except Exception as e:
            await session.rollback()
            print(f"✗ Error resetting database: {e}")
            raise

async def main():
    print("=" * 50)
    print("Database Reset Script")
    print("=" * 50)
    print("\nThis will DELETE ALL DATA from:")
    print("  - users")
    print("  - user_profiles")
    print("\n⚠️  WARNING: This action cannot be undone!")
    
    # Ask for confirmation
    confirmation = input("\nAre you sure you want to continue? (yes/no): ")
    
    if confirmation.lower() != "yes":
        print("\n✗ Reset cancelled.")
        return
    
    print("\nResetting database...")
    await reset_database()

if __name__ == "__main__":
    # Fix for Windows asyncio loop policy
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())