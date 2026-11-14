"""Import/check named profiles on NEW approved55435 targets; no AI quality evaluation.

Run through scripts/test_db.py run. Writes a sanitized evidence JSON and keeps
private preview settings in .demo; never prints credentials or resets databases.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "flameguard-ai-backend")]


async def verify(profiles):
    from app.main import create_app
    from httpx import ASGITransport, AsyncClient
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    from integration_tests.chat_target import persist_preview, prepare_target, settings_for

    expected = {"psi": (71, 2508, 0), "unified": (81, 2574, 10)}
    records = []
    for profile in profiles:
        target = await prepare_target(os.environ["PHASE4_ADMIN_URL"], profile=profile)
        settings_path = persist_preview(target)
        app = create_app(settings_for(target))
        async with app.router.lifespan_context(app):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                ready_response = await client.get("/api/v1/chat/readiness")
                ready = ready_response.json()
                assert ready_response.status_code == 200 and ready["state"] == "ready"
                source_count, passages, resources = expected[profile]
                assert ready["passages"] == passages
                inventory = await client.get("/api/v1/chat/resources")
                assert inventory.status_code == 200
                inventory = inventory.json()["items"]
                assert len(inventory) == resources
                summary = (await client.get("/api/v1/dashboard/summary")).json()
                assert (summary["investigationCount"], summary["runCount"]) == (24, 1926)
        engine = create_async_engine(target["owner_url"], hide_parameters=True)
        try:
            async with engine.connect() as connection:
                head = await connection.scalar(text("SELECT version_num FROM alembic_version"))
                count = await connection.scalar(text("SELECT count(*) FROM source_document"))
                nulls = await connection.scalar(
                    text(
                        "SELECT count(*) FROM source_document WHERE source_scope='challenge' "
                        "AND investigation_id IS NULL"
                    )
                )
        finally:
            await engine.dispose()
        assert head == "0004_challenge_source_scope"
        assert (count, nulls) == (source_count, resources)
        records.append(
            {
                "profile": profile,
                "database": target["owner_url"].database,
                "migrationHead": head,
                "sources": count,
                "nullOwnedResources": nulls,
                "readiness": ready,
                "resourceStatuses": [
                    {k: r[k] for k in ("resource_id", "status", "indexed")} for r in inventory
                ],
                "settingsPath": str(settings_path.relative_to(ROOT)),
                "status": "PASS",
            }
        )
        print(
            f"{profile}: PASS, sources={count}, passages={passages}, resources={resources}",
            flush=True,
        )
    report = ROOT / ".demo/data-handoff-smoke.json"
    report.write_text(
        json.dumps(
            {"date": "2026-11-14", "target": "127.0.0.1:55435", "profiles": records}, indent=2
        )
        + "\n",
        encoding="utf-8",
    )
    print("Sanitized evidence: .demo/data-handoff-smoke.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--profiles", nargs="+", choices=["psi", "unified"], default=["psi", "unified"]
    )
    args = parser.parse_args()
    asyncio.run(verify(args.profiles))
