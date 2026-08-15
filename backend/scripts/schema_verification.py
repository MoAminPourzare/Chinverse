from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def repository_alembic_head() -> str:
    """Return the repository's single Alembic head.

    Phase-specific schema verifiers run against the fully migrated database.
    Resolving the expected head from the migration graph prevents every older
    verifier from becoming stale whenever a later phase adds a revision.
    """

    backend_dir = Path(__file__).resolve().parents[1]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    heads = ScriptDirectory.from_config(config).get_heads()
    if len(heads) != 1:
        raise RuntimeError(f"Expected one Alembic head, found {heads}")
    return heads[0]
