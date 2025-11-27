# ChinVerse

A Monorepo project containing a Web App (PWA) and a Backend API.

## Structure

- `backend/`: FastAPI + SQLAlchemy + Poetry
- `frontend/`: Next.js 14 + Tailwind CSS + TypeScript (PWA)

## Setup

### Backend

1. Navigate to `backend/`
2. Install dependencies: `poetry install`
3. Run server: `poetry run uvicorn app.main:app --reload`

### Frontend

1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
