# ChinVerse

ChinVerse is a Persian-first Chinese learning app with a Next.js frontend and a
FastAPI backend.

## Structure

- `backend/`: FastAPI, SQLAlchemy, Alembic, Poetry
- `frontend/`: Next.js 16, React 19, TypeScript, Tailwind CSS

## Development

### Backend

```powershell
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

The backend runs on `http://127.0.0.1:8000` by default.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Checks

```powershell
cd frontend
npm run lint
npm exec tsc -- --noEmit --incremental false
npm run build
```

```powershell
cd backend
poetry run python -m compileall app
```
