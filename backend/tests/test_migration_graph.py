import ast
from pathlib import Path
import re

from alembic.config import Config
from alembic.script import ScriptDirectory

from app.db.base_class import Base
import app.models  # noqa: F401


LEGACY_TABLES = {
    "consultation_requests",
    "course_reviews",
    "leitner_cards",
    "services",
    "user_streaks",
}


def test_alembic_has_one_linear_head():
    backend_dir = Path(__file__).resolve().parents[1]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    script = ScriptDirectory.from_config(config)

    heads = script.get_heads()
    assert len(heads) == 1, f"Expected one Alembic head, found: {heads}"

    revisions = list(script.walk_revisions())
    revision_ids = {revision.revision for revision in revisions}
    for revision in revisions:
        down_revisions = revision._normalized_down_revisions
        assert all(parent in revision_ids for parent in down_revisions)


def test_schema_changes_are_not_executed_by_application_code():
    backend_dir = Path(__file__).resolve().parents[1]
    app_dir = backend_dir / "app"
    ddl_markers = (
        "CREATE TABLE",
        "ALTER TABLE",
        "CREATE INDEX",
        "CREATE UNIQUE INDEX",
        "DROP TABLE",
        "DROP COLUMN",
    )

    offenders = []
    for path in app_dir.rglob("*.py"):
        source = path.read_text(encoding="utf-8").upper()
        if any(marker in source for marker in ddl_markers):
            offenders.append(path.relative_to(backend_dir).as_posix())

    assert not offenders, f"Runtime DDL belongs in Alembic migrations: {offenders}"


def test_legacy_tables_are_not_part_of_application_metadata():
    assert LEGACY_TABLES.isdisjoint(Base.metadata.tables)
    assert {"study_sessions", "subscription_plans", "user_subscriptions"} <= set(
        Base.metadata.tables
    )


def test_application_sql_does_not_reference_removed_tables():
    backend_dir = Path(__file__).resolve().parents[1]
    offenders = []

    for path in (backend_dir / "app").rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if not (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "text"
                and node.args
                and isinstance(node.args[0], ast.Constant)
                and isinstance(node.args[0].value, str)
            ):
                continue

            sql = node.args[0].value.lower()
            if any(
                re.search(rf"\b{re.escape(table)}\b", sql)
                for table in LEGACY_TABLES
            ):
                offenders.append(
                    f"{path.relative_to(backend_dir).as_posix()}:{node.lineno}"
                )

    assert not offenders, f"Application SQL references removed tables: {offenders}"
