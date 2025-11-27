import asyncio
from sqlalchemy import text
from app.db.session import SessionLocal  # <--- نام صحیح ایمپورت شد

async def check_database():
    print("🔄 Connecting to PostgreSQL...")
    try:
        # نکته مهم: SessionLocal یک کلاس است، باید با () صدا زده شود تا یک سشن بسازد
        async with SessionLocal() as session:
            # Test 1: Simple Select
            result = await session.execute(text("SELECT 1"))
            print(f"✅ Connection Successful! Test Query Result: {result.scalar()}")
            
            # Test 2: Check if tables exist
            result = await session.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
            ))
            tables = result.scalars().all()
            print(f"✅ Found {len(tables)} tables in database.")
            print("📊 Table List:", tables)
            
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_database())