"""Development-only fresh target builder, constrained to the dedicated local test container.

Never used by the serving application and never changes an existing database/role.
"""

import json
import os
import secrets
from pathlib import Path
from uuid import uuid4

import asyncpg
from app.core.config import Settings
from app.models import Base
from app.repositories.collection import RUNTIME_TABLES
from app.services.demo_manifest import snapshot_rows
from sqlalchemy import insert
from sqlalchemy.ext.asyncio import create_async_engine
from tests.integration.phase4_fixtures import provision_phase4
from tests.postgres_fixtures import validate_test_url

from integrations.nasa_data.corpus_registry import write_corpus_policy
from integrations.nasa_data.export import export_bundle

ROOT = Path(__file__).resolve().parents[1]
# Dedicated container `tourbillion-test-pg`; never another server on this machine.
TEST_SERVER = ("127.0.0.1", 55435)


def settings_for(target):
    return Settings(
        _env_file=None,
        app_env="test",
        debug=False,
        database_url=target["reader_url"].render_as_string(hide_password=False),
        runtime_database_url=target["writer_url"].render_as_string(hide_password=False),
        catalog_collection_manifest=str(target["collection"]),
        chat_provider="extractive",
        prediction_provider="unavailable",
        scenario_test_providers=False,
    )


async def prepare_target(raw):
    admin = validate_test_url(raw, Settings(_env_file=None).database_url.get_secret_value())
    if (admin.host, admin.port) != TEST_SERVER:
        raise ValueError("Only the dedicated local test container 127.0.0.1:55435 is supported")
    target = await provision_phase4(raw, populate=False)
    bundle = export_bundle(target["collection"].parent / "nasa-chat-bundle")
    manifest = snapshot_rows(bundle / "snapshot.json")
    engine = create_async_engine(target["owner_url"], hide_parameters=True)
    try:
        async with engine.begin() as connection:
            for table in Base.metadata.sorted_tables:
                rows = manifest["tables"][table.name]
                for offset in range(0, len(rows), 200):
                    await connection.execute(insert(table), rows[offset : offset + 200])
    finally:
        await engine.dispose()
    config = json.loads(target["collection"].read_text("utf-8"))
    config.pop("fixture")
    config.update(
        collectionId=manifest["collectionId"],
        origin="real",
        reviewState="unreviewed",
        snapshot=str(bundle / "snapshot.json"),
        slugs=str(bundle / "slugs.json"),
    )
    target["collection"].write_text(json.dumps(config), encoding="utf-8")
    write_corpus_policy(
        target["collection"], json.loads((bundle / "release.json").read_text("utf-8"))
    )
    writer = "fg_nchat_" + uuid4().hex[:12]
    password = secrets.token_hex(24)
    connection = await asyncpg.connect(
        host=admin.host,
        port=admin.port,
        user=admin.username,
        password=admin.password,
        database="postgres",
    )
    try:
        await connection.execute(
            f'CREATE ROLE "{writer}" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE '
            f"NOREPLICATION NOBYPASSRLS PASSWORD '{password}'"
        )
        await connection.execute(
            f'GRANT CONNECT ON DATABASE "{target["owner_url"].database}" TO "{writer}"'
        )
    finally:
        await connection.close()
    owner = target["owner_url"]
    connection = await asyncpg.connect(
        host=owner.host,
        port=owner.port,
        user=owner.username,
        password=owner.password,
        database=owner.database,
    )
    try:
        await connection.execute(f'GRANT USAGE ON SCHEMA public TO "{writer}"')
        for table in sorted(RUNTIME_TABLES):
            await connection.execute(f'GRANT SELECT, INSERT ON "{table}" TO "{writer}"')
    finally:
        await connection.close()
    target["writer_url"] = owner.set(username=writer, password=password)
    target["bundle"] = bundle
    return target


def persist_preview(target):
    settings = settings_for(target)
    path = ROOT / ".demo" / f"nasa-chat-preview-{target['owner_url'].database}.json"
    path.parent.mkdir(exist_ok=True)
    # Create owner-only from the first byte; credentials are never world-readable.
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as file:
        json.dump(
            {
                "DATABASE_URL": settings.database_url.get_secret_value(),
                "RUNTIME_DATABASE_URL": settings.runtime_database_url.get_secret_value(),
                "CATALOG_COLLECTION_MANIFEST": str(target["collection"]),
                "CHAT_PROVIDER": "extractive",
            },
            file,
        )
    return path
