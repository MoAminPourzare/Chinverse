from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


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
