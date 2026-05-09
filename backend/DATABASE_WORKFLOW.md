# Database Workflow

Use this checklist whenever you add a real feature or new LMS content.

## Safe update flow

1. Update SQLAlchemy models in `app/models`.
2. Create an Alembic migration in `alembic/versions`.
3. Run migrations:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   alembic upgrade head
   ```

   Or use:

   ```powershell
   .\apply_migration.ps1
   ```

4. If the feature needs starter data, update `seed_lms.py`.
5. Validate seed data before writing to the database:

   ```powershell
   python seed_lms.py --validate-only
   ```

6. Seed the database:

   ```powershell
   python seed_lms.py
   ```

7. Run the non-destructive health check:

   ```powershell
   python check_db.py
   ```

8. Update or verify API endpoints.
9. Update or verify frontend pages/components.

## Rules for real data

- Real public content should exist in the database.
- Mock data should stay in frontend-only prototypes or tests.
- A new Explore section must have:
  - a subcategory in `seed_lms.py`
  - at least one course seed
  - at least one lesson seed
  - a matching API route/page in the frontend
- Do not hard-code production course IDs in the frontend. Prefer slugs or IDs returned by the API.

## Destructive scripts

`reset_db.py` and `nuke_db.py` are blocked by default.

To run them locally, you must set:

```powershell
$env:ALLOW_DESTRUCTIVE_DB_ACTION = "1"
```

They still refuse to run when `ENVIRONMENT=production`.
