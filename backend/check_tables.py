import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        # Check dictionary_words columns
        result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'dictionary_words'"))
        print("dictionary_words columns:", [r[0] for r in result.fetchall()])
        
        # Check user_flashcards columns
        result = await db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_flashcards'"))
        print("user_flashcards columns:", [r[0] for r in result.fetchall()])

if __name__ == "__main__":
    asyncio.run(check())
