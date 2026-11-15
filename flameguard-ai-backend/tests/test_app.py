from unittest.mock import AsyncMock, patch

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings


async def test_documentation_preserves_phase_one_routes(client: AsyncClient) -> None:
    assert (await client.get("/docs")).status_code == 200
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    assert {"/api/v1/health", "/api/v1/ready"} <= set(response.json()["paths"])
    assert "503" in response.json()["paths"]["/api/v1/ready"]["get"]["responses"]


async def test_environment_prefix_and_title(settings: Settings, app_factory) -> None:
    application = app_factory(
        settings.model_copy(update={"app_name": "Test", "api_v1_prefix": "/v2"})
    )
    async with AsyncClient(
        transport=ASGITransport(app=application), base_url="http://test"
    ) as client:
        assert (await client.get("/v2/health")).status_code == 200
        assert (await client.get("/api/v1/health")).status_code == 404
        assert (await client.get("/openapi.json")).json()["info"]["title"] == "Test"


async def test_lifespan_disposes_engine_even_after_failure(settings: Settings, app_factory) -> None:
    database = AsyncMock()
    with patch("app.main.Database", return_value=database):
        application = app_factory(settings)
        try:
            async with application.router.lifespan_context(application):
                assert application.state.database is database
                raise RuntimeError("simulate lifespan failure")
        except RuntimeError:
            pass
    database.close.assert_awaited_once()


async def test_unhandled_error_is_sanitized(application: FastAPI, caplog) -> None:
    @application.get("/test-error", include_in_schema=False)
    async def fail() -> None:
        raise RuntimeError("secret-password private-host")

    transport = ASGITransport(app=application, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/test-error")
    assert response.status_code == 500
    assert response.json() == {"detail": "Internal server error"}
    assert "secret-password" not in response.text + caplog.text


async def test_missing_route_keeps_standard_404(client: AsyncClient) -> None:
    assert (await client.get("/missing")).status_code == 404


async def test_database_pool_exhaustion_is_a_retryable_503(application: FastAPI, caplog) -> None:
    from sqlalchemy.exc import TimeoutError as PoolTimeout

    @application.get("/test-pool", include_in_schema=False)
    async def exhausted() -> None:
        raise PoolTimeout("QueuePool limit reached; secret-password private-host")

    transport = ASGITransport(app=application, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/test-pool")
    assert response.status_code == 503
    assert response.headers["retry-after"] == "2"
    assert response.json() == {"detail": "Database busy; retry shortly"}
    assert "secret-password" not in response.text + caplog.text


def test_database_pool_defaults_and_environment_override(monkeypatch) -> None:
    from app.core.database import Database

    defaults = Settings(_env_file=None)
    assert (defaults.db_pool_size, defaults.db_max_overflow) == (5, 5)
    assert defaults.db_pool_timeout_seconds == 5
    pool = Database(defaults).engine.sync_engine.pool
    assert pool.size() == 5 and pool._max_overflow == 5 and pool._timeout == 5

    monkeypatch.setenv("DB_POOL_SIZE", "8")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "2")
    monkeypatch.setenv("DB_POOL_TIMEOUT_SECONDS", "15")
    tuned = Settings(_env_file=None)
    pool = Database(tuned).engine.sync_engine.pool
    assert pool.size() == 8 and pool._max_overflow == 2 and pool._timeout == 15


def test_runtime_writer_pool_stays_small_and_tunable(monkeypatch) -> None:
    from app.core.runtime import RuntimeDatabase

    url = "postgresql+asyncpg://writer:test-only@db.example:5432/flameguard"
    reader = "postgresql+asyncpg://reader:test-only@db.example:5432/flameguard"
    settings = Settings(_env_file=None, database_url=reader, runtime_database_url=url)
    pool = RuntimeDatabase(settings).engine.sync_engine.pool
    assert pool.size() == 2 and pool._max_overflow == 3 and pool._timeout == 5

    monkeypatch.setenv("DB_RUNTIME_POOL_SIZE", "4")
    monkeypatch.setenv("DB_RUNTIME_MAX_OVERFLOW", "0")
    tuned = Settings(_env_file=None, database_url=reader, runtime_database_url=url)
    pool = RuntimeDatabase(tuned).engine.sync_engine.pool
    assert pool.size() == 4 and pool._max_overflow == 0


def test_database_pool_settings_are_bounded() -> None:
    import pytest
    from pydantic import ValidationError

    for field, value in [
        ("db_pool_size", 0),
        ("db_pool_size", 51),
        ("db_max_overflow", -1),
        ("db_pool_timeout_seconds", 0),
        ("db_pool_timeout_seconds", 61),
    ]:
        with pytest.raises(ValidationError):
            Settings(_env_file=None, **{field: value})
