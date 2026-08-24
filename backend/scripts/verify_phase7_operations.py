"""Fail-fast verification for Phase 7 operational artifacts."""

from __future__ import annotations

import argparse
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def read(path: Path) -> str:
    require(path.is_file(), f"Missing Phase 7 artifact: {path}")
    return path.read_text(encoding="utf-8")


def verify_yaml_syntax(path: Path) -> None:
    try:
        import yaml
    except ImportError:
        return
    yaml.compose(read(path))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    root = args.repo_root.resolve()

    deploy_path = root / ".github" / "workflows" / "deploy-hf-space.yml"
    monitor_path = root / ".github" / "workflows" / "phase7-monitor.yml"
    load_path = root / "backend" / "scripts" / "phase7_load_test.py"
    schema_verifier_path = root / "backend" / "scripts" / "verify_phase7_schema.py"
    backup_path = root / "scripts" / "backup-database.ps1"
    restore_path = root / "scripts" / "restore-database.ps1"
    phase_path = root / "docs" / "PHASE_7_PERFORMANCE_OPERATIONS_FA.md"
    rollback_path = root / "docs" / "PHASE_7_ROLLBACK_RUNBOOK_FA.md"

    deploy = read(deploy_path)
    require("codex/phase-7-performance-operations" in deploy, "Backend deploy is not bound to Phase 7")
    require("codex/phase-5-education-media" not in deploy, "Backend deploy still contains the Phase 5 branch guard")
    require('.checks.storage == "ok"' in deploy, "Backend deploy does not require storage readiness")

    monitor = read(monitor_path)
    for contract in (
        "workflow_dispatch:",
        "schedule:",
        "issues: write",
        "VERCEL_AUTOMATION_BYPASS_SECRET",
        '.checks.database == "ok"',
        '.checks.storage == "ok"',
        "Open or update operational alert",
        "Close recovered operational alert",
    ):
        require(contract in monitor, f"Monitor contract is missing: {contract}")
    require(
        "frontend_health_url:" not in monitor,
        "Monitor must not accept a dispatch-controlled URL while using a bypass secret",
    )
    require(
        "FRONTEND_HEALTH_URL: https://chinverse-git-codex-phase-7-performance-operations-death-stroke.vercel.app/api/health"
        in monitor,
        "Monitor frontend secret audience is not immutable",
    )

    backup = read(backup_path)
    restore = read(restore_path)
    require("alembic_revision" in backup, "Backup metadata does not record Alembic revision")
    require(
        "alembicRevisionBefore" in backup and "alembicRevisionAfter" in backup,
        "Backup does not reject migrations racing its dump snapshot",
    )
    require("ExpectedAlembicRevision" in restore, "Restore has no dynamic revision contract")
    require("c8f1e2a4d6b9" not in restore, "Restore still hardcodes the Phase 2 revision")
    require(
        "$restoredRevisions.Count -ne 1" in restore,
        "Restore does not require the complete Alembic revision set to contain exactly one row",
    )

    frontend_package = read(root / "frontend" / "package.json")
    quality_workflow = read(root / ".github" / "workflows" / "quality-gates.yml")
    local_gate = read(root / "scripts" / "check.ps1")
    schema_verifier = read(schema_verifier_path)
    require("npm run perf:budget" in frontend_package, "Frontend check omits performance budgets")
    require("npm run perf:budget" in quality_workflow, "CI omits performance budgets")
    require(
        "chat_realtime_events" in schema_verifier and "chat_presence_leases" in schema_verifier,
        "Phase 7 schema verifier omits realtime/presence tables",
    )
    require(
        quality_workflow.count("poetry run python scripts/verify_phase7_schema.py") == 2,
        "CI must execute the Phase 7 schema verifier after fresh upgrade and rollback rebuild",
    )
    require(
        quality_workflow.count(
            "poetry run python scripts/verify_phase5_schema.py\n"
            "          poetry run python scripts/verify_phase7_schema.py\n"
            "          poetry run python scripts/verify_phase8_schema.py"
        )
        == 2,
        "CI Phase 7/8 schema verification must follow Phase 5 verification in both migration passes",
    )
    require(
        local_gate.count("& $Python scripts\\verify_phase7_schema.py") == 2,
        "Local gate must execute the Phase 7 schema verifier after fresh upgrade and rollback rebuild",
    )
    require(
        local_gate.count("& $Python scripts\\verify_phase8_schema.py") == 2,
        "Local gate must execute the Phase 8 schema verifier after fresh upgrade and rollback rebuild",
    )
    require(
        'Assert-NativeSuccess "Phase 7 schema invariants"' in local_gate
        and 'Assert-NativeSuccess "Post-rebuild phase 7 schema invariants"' in local_gate,
        "Local gate does not fail fast for both Phase 7 schema verification passes",
    )
    require(
        'Assert-NativeSuccess "Phase 8 schema invariants"' in local_gate
        and 'Assert-NativeSuccess "Post-rebuild phase 8 schema invariants"' in local_gate,
        "Local gate does not fail fast for both Phase 8 schema verification passes",
    )

    for path in (phase_path, rollback_path):
        document = read(path)
        require("rollback" in document.lower(), f"Rollback is not documented in {path.name}")
        require("alert" in document.lower(), f"Alerting is not documented in {path.name}")

    spec = spec_from_file_location("phase7_load_test", load_path)
    require(spec is not None and spec.loader is not None, "Cannot import Phase 7 load runner")
    module = module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    require(set(module.PROFILES) == {"smoke", "load", "soak"}, "Load profiles are incomplete")
    require(module.REMOTE_MAX_CONCURRENCY <= 25, "Remote concurrency cap is unsafe")
    require(module.REMOTE_MAX_RATE_PER_SECOND <= 25, "Remote rate cap is unsafe")
    require(module.REMOTE_MAX_DURATION_SECONDS <= 3600, "Remote duration cap is unsafe")
    require(
        "/health/ready" not in module.DEFAULT_ENDPOINTS["backend"],
        "Load defaults must not repeatedly run the active storage readiness probe",
    )

    verify_yaml_syntax(deploy_path)
    verify_yaml_syntax(monitor_path)
    print("Phase 7 operational artifact verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
