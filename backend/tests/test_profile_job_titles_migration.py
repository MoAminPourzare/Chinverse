import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
import sqlalchemy as sa


def test_job_titles_migration_preserves_profiles_and_backfills_existing_titles(monkeypatch):
    source = Path(__file__).resolve().parents[1] / "alembic/versions/b3e8d1f6a9c2_add_profile_job_titles.py"
    spec = importlib.util.spec_from_file_location("job_titles_migration", source)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite://")
    with engine.begin() as connection:
        connection.execute(sa.text("CREATE TABLE user_profiles (user_id BIGINT PRIMARY KEY, headline VARCHAR, bio VARCHAR)"))
        connection.execute(sa.text("INSERT INTO user_profiles VALUES (:id, :headline, :bio)"), [
            {"id": 1, "headline": " استاد دانشگاه ", "bio": "زندگی‌نامه محفوظ"},
            {"id": 2, "headline": "مترجم زبان چینی", "bio": "معرفی قدیمی"},
            {"id": 3, "headline": None, "bio": None},
        ])
        monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
        migration.upgrade()
        profiles = sa.table("user_profiles", sa.column("user_id"), sa.column("headline"), sa.column("bio"), sa.column("job_titles", sa.JSON()))
        rows = connection.execute(sa.select(profiles).order_by(profiles.c.user_id)).mappings().all()
        assert [row["job_titles"] for row in rows] == [["استاد دانشگاه"], ["مترجم زبان چینی"], None]
        assert rows[0]["headline"] == " استاد دانشگاه "
        assert rows[0]["bio"] == "زندگی‌نامه محفوظ"
        migration.downgrade()
        assert "job_titles" not in {column["name"] for column in sa.inspect(connection).get_columns("user_profiles")}
        assert connection.execute(sa.text("SELECT COUNT(*) FROM user_profiles")).scalar() == 3
