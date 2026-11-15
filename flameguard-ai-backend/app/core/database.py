from collections.abc import AsyncIterator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings


class Database:
    """One engine per application lifespan; sessions are scoped to individual requests."""

    def __init__(self, settings: Settings) -> None:
        self.engine = create_async_engine(
            settings.database_url.get_secret_value(),
            echo=False,
            hide_parameters=True,
            pool_pre_ping=True,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout_seconds,
            connect_args={"timeout": settings.db_connect_timeout_seconds},
        )
        self.session_factory = async_sessionmaker(self.engine, expire_on_commit=False)
        # Readiness opens its own short-lived connection so a busy request pool cannot take
        # the (single) replica out of traffic; it still proves the database is reachable.
        self.probe_engine = create_async_engine(
            settings.database_url.get_secret_value(),
            echo=False,
            hide_parameters=True,
            poolclass=NullPool,
            connect_args={"timeout": settings.db_connect_timeout_seconds},
        )
        self.probe_session_factory = async_sessionmaker(self.probe_engine, expire_on_commit=False)

    async def close(self) -> None:
        try:
            await self.engine.dispose()
        finally:
            await self.probe_engine.dispose()


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Close sessions and roll back uncommitted work; services own explicit commits."""
    database: Database = request.app.state.database
    async with database.session_factory() as session:
        yield session


async def get_probe_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Readiness-only session on an unpooled engine (one connection per check)."""
    database: Database = request.app.state.database
    async with database.probe_session_factory() as session:
        yield session
