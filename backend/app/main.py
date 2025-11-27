from fastapi import FastAPI

app = FastAPI(title="ChinVerse API")

@app.get("/")
async def root():
    return {"message": "Welcome to ChinVerse API"}
