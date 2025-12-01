# Fix Database Migration Script
# Run this script to apply the missing resume column migration

Write-Host "Checking current database migration status..." -ForegroundColor Cyan
poetry run alembic current

Write-Host "`nApplying pending migrations..." -ForegroundColor Cyan
poetry run alembic upgrade head

Write-Host "`nMigration complete! Checking new status..." -ForegroundColor Green
poetry run alembic current

Write-Host "`nPlease restart your backend server now." -ForegroundColor Yellow
