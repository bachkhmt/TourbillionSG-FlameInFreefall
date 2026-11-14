import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models import SourceDocument

pytestmark = pytest.mark.integration


async def test_null_source_is_stored_only_with_explicit_challenge_scope(pg_session):
    source = SourceDocument(
        source_scope="challenge",
        investigation_id=None,
        source_url="https://www.nasa.gov/history/",
        document_type="case_study",
        ingestion_status="linked",
    )
    pg_session.add(source)
    await pg_session.flush()
    assert (await pg_session.get(SourceDocument, source.id)).investigation_id is None
    with pytest.raises(IntegrityError):
        async with pg_session.begin_nested():
            await pg_session.execute(
                text(
                    "INSERT INTO source_document(id,source_scope,investigation_id,"
                    "source_url,document_type,ingestion_status) "
                    "VALUES (gen_random_uuid(),'investigation',NULL,'https://www.nasa.gov/','background','linked')"
                )
            )
            await pg_session.flush()


async def test_challenge_source_cannot_claim_an_investigation(pg_session):
    # Use a real parent: this exercises the ownership CHECK, not a missing-FK failure.
    from app.models import Investigation

    parent = Investigation(psi_id="TEST_ONLY_SCOPE", title="TEST_ONLY source ownership")
    pg_session.add(parent)
    await pg_session.flush()
    with pytest.raises(IntegrityError):
        async with pg_session.begin_nested():
            pg_session.add(
                SourceDocument(
                    source_scope="challenge",
                    investigation_id=parent.id,
                    source_url="https://www.nasa.gov/",
                    document_type="background",
                    ingestion_status="linked",
                )
            )
            await pg_session.flush()


async def test_populated_legacy_sources_upgrade_and_downgrade_refuses_resource_loss():
    import asyncio
    import os
    import subprocess
    import sys
    from uuid import uuid4

    from sqlalchemy.ext.asyncio import create_async_engine

    from tests.erd_reference import ROOT
    from tests.integration.phase4_fixtures import provision_phase4

    target = await provision_phase4(
        os.environ["PHASE4_ADMIN_URL"], populate=False, migration_revision="0003_could_have"
    )
    engine = create_async_engine(target["owner_url"], hide_parameters=True)
    investigation, source = uuid4(), uuid4()
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    "INSERT INTO investigation(id,psi_id,title) "
                    "VALUES (:id,'TEST_ONLY_OLD','Legacy source')"
                ),
                {"id": investigation},
            )
            await connection.execute(
                text(
                    "INSERT INTO source_document(id,investigation_id,source_url,"
                    "document_type,version,ingestion_status) "
                    "VALUES (:id,:inv,'https://example.invalid/legacy','TEST_ONLY','original-version','TEST_ONLY')"
                ),
                {"id": source, "inv": investigation},
            )
        env = {
            **os.environ,
            "DEBUG": "false",
            "DATABASE_URL": target["owner_url"].render_as_string(hide_password=False),
        }

        async def migrate(*arguments):
            return await asyncio.to_thread(
                subprocess.run,
                [sys.executable, "-m", "alembic", *arguments],
                cwd=ROOT,
                env=env,
                capture_output=True,
                timeout=60,
            )

        assert (await migrate("upgrade", "head")).returncode == 0, (
            "Legacy upgrade failed (details redacted)"
        )
        async with engine.begin() as connection:
            row = (
                await connection.execute(
                    text(
                        "SELECT investigation_id,source_scope,version "
                        "FROM source_document WHERE id=:id"
                    ),
                    {"id": source},
                )
            ).one()
            assert tuple(row) == (investigation, "investigation", "original-version")
            await connection.execute(
                text(
                    "INSERT INTO source_document(id,source_scope,source_url,"
                    "document_type,ingestion_status) "
                    "VALUES (gen_random_uuid(),'challenge','https://www.nasa.gov/','background','linked')"
                )
            )
        assert (await migrate("downgrade", "0003_could_have")).returncode != 0
        async with engine.connect() as connection:
            assert (
                await connection.scalar(text("SELECT version_num FROM alembic_version"))
                == "0004_challenge_source_scope"
            )
            assert await connection.scalar(text("SELECT count(*) FROM source_document")) == 2
    finally:
        await engine.dispose()
