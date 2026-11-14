"""Deployment TLS guards; no network, database, subprocess or application mutation."""

import importlib.util
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import create_async_engine

SPEC = importlib.util.spec_from_file_location(
    "deployment_launcher", Path(__file__).parents[1] / "runtime" / "entrypoint.py"
)
launcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(launcher)


@pytest.fixture(autouse=True)
def environment(monkeypatch):
    for name in ("DATABASE_URL", "RUNTIME_DATABASE_URL", "DEBUG"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("APP_ENV", "production")


@pytest.mark.parametrize("suffix", ["", "?ssl=require", "?ssl=disable", "?sslmode=verify-full"])
def test_production_rejects_unverified_connections(monkeypatch, suffix):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://reader:p@db/test" + suffix)
    with pytest.raises(ValueError):
        launcher.validate_environment()


def test_verified_reader_and_writer(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://reader:p@db/test?ssl=verify-full")
    monkeypatch.setenv(
        "RUNTIME_DATABASE_URL", "postgresql+asyncpg://writer:p@db/test?ssl=verify-full"
    )
    launcher.validate_environment()
    monkeypatch.setenv("RUNTIME_DATABASE_URL", "postgresql+asyncpg://writer:p@db/test")
    with pytest.raises(ValueError):
        launcher.validate_environment()


def test_local_demo_allows_internal_plaintext_pg(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://reader:p@postgres/test")
    launcher.validate_environment()


def test_sqlalchemy_passes_verified_tls_to_asyncpg():
    engine = create_async_engine("postgresql+asyncpg://reader:p@db/test?ssl=verify-full")
    _, arguments = engine.dialect.create_connect_args(engine.url)
    assert arguments["ssl"] == "verify-full"
    assert "sslmode" not in arguments


def test_missing_production_url_and_debug_rejected(monkeypatch):
    with pytest.raises(ValueError):
        launcher.validate_environment()
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://reader:p@db/test?ssl=verify-full")
    monkeypatch.setenv("DEBUG", "true")
    with pytest.raises(ValueError):
        launcher.validate_environment()
