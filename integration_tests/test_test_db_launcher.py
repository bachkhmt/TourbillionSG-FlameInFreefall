import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

import pytest


def test_launcher_uses_subprocess_and_propagates_exit_status_without_development_url(
    tmp_path, monkeypatch
):
    path = Path(__file__).resolve().parents[1] / "scripts/test_db.py"
    spec = importlib.util.spec_from_file_location("test_db_launcher", path)
    launcher = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(launcher)
    settings = tmp_path / "settings.json"
    settings.write_text(
        json.dumps(
            {
                "container": "tourbillion-test-pg",
                "host": "127.0.0.1",
                "port": 55435,
                "PHASE4_ADMIN_URL": "test-only-admin-url",
                "TEST_DATABASE_URL": "test-only-target-url",
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(launcher, "SETTINGS", settings)
    monkeypatch.setattr(launcher, "ROOT", tmp_path)
    (tmp_path / "flameguard-ai-backend").mkdir()
    monkeypatch.setenv("DATABASE_URL", "development-url-must-not-leak")
    monkeypatch.setenv("DEBUG", "invalid-host-value")
    calls = []

    def run(command, *, env, check):
        calls.append((command, env, check))
        return SimpleNamespace(returncode=7)

    monkeypatch.setattr(launcher.subprocess, "run", run)
    with pytest.raises(SystemExit) as result:
        launcher.run(["python", "-m", "pytest"])
    assert result.value.code == 7
    command, env, check = calls[0]
    assert command == ["python", "-m", "pytest"] and not check
    assert "DATABASE_URL" not in env
    assert env["DEBUG"] == "false"
    assert env["TEST_DATABASE_URL"] == "test-only-target-url"
