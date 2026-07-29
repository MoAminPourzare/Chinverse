# ChinVerse

Persian-first Chinese learning and professional-networking web application.

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Test deployment: Vercel, Hugging Face Spaces, Neon

## Pinned Toolchain

- Node.js `22.23.0` (`.nvmrc`)
- npm `10.9.2` (`frontend/package.json`)
- Python `3.11.15` (`.python-version` and backend image)
- Poetry `2.4.1` (`backend/Dockerfile` and CI)
- PostgreSQL `16.14` for isolated integration tests

Use the lockfiles. Local development and CI install with `npm ci` and
`poetry sync`; do not replace them with unlocked installs.

## Bootstrap

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

The frontend runs at `http://127.0.0.1:3000`.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
py -3.11 -m venv .venv
py -3.11 -m venv ..\.tmp\poetry-tool
& ..\.tmp\poetry-tool\Scripts\python.exe -m pip install poetry==2.4.1
$env:POETRY_VIRTUALENVS_IN_PROJECT = "true"
& ..\.tmp\poetry-tool\Scripts\poetry.exe sync --with dev --no-root
& .\.venv\Scripts\python.exe -m alembic upgrade head
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`.
Poetry intentionally lives outside the project virtual environment so
`poetry sync` cannot remove its own executable.

Do not use the example credentials in production. Production startup rejects
placeholder secrets, wildcard hosts, local-only CORS, debug mode, and enabled
API documentation when `ENVIRONMENT=production`.

## Quality Gates

Fast local checks:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1
```

Complete checks with an isolated PostgreSQL database and browser matrix:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1 -WithIntegration -WithE2E
```

The complete gate includes:

- locked dependency consistency and production dependency audits
- ESLint, Ruff, TypeScript, and Python bytecode compilation
- frontend and backend unit tests with enforced coverage floors
- production Next.js build
- Alembic single-head, upgrade, metadata parity, rollback, and rebuild checks
- real signup, login, JWT, profile, upload, and database-readiness tests
- desktop Chromium, Android-sized Chromium, and iPhone-sized WebKit tests
- production backend container build

The same checks run in `.github/workflows/quality-gates.yml`.

## Health Checks

- Frontend: `GET /api/health`
- Backend liveness: `GET /health`
- Backend readiness, including PostgreSQL: `GET /health/ready`

The frontend health response includes the Vercel Git commit when available,
which allows a deployment to be matched to a pushed revision.

## Release Notes

The fixed release scope, staging policy, privacy guard, and 29 accepted change
groups are documented in
[`docs/PHASE_0_RELEASE_BASELINE_FA.md`](docs/PHASE_0_RELEASE_BASELINE_FA.md).

The detailed Persian report for the current hardening phase is in
[`docs/PHASE_1_QUALITY_BASELINE_FA.md`](docs/PHASE_1_QUALITY_BASELINE_FA.md).
