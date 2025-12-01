import asyncio
import sys
import os
from sqlalchemy import text

# 1. اضافه کردن مسیر جاری به پایتون تا پوشه app را پیدا کند
sys.path.append(os.getcwd())

# 2. ایمپورت صحیح انجین (طبق ساختار پروژه شما)
try:
    from app.db.session import engine
except ImportError:
    # محض احتیاط اگر مسیر دیگری بود
    from app.core.db import engine

async def nuke_database():
    async with engine.begin() as conn:
        print("💣 Dropping ALL Tables & Schema...")
        # پاک کردن کل اسکیما و ساخت مجدد آن
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        print("✅ Database is fresh and empty.")

if __name__ == "__main__":
    # فیکس مخصوص ویندوز برای ارورهای احتمالی async
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(nuke_database())