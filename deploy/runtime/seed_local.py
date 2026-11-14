"""Adapt the existing guarded synthetic seeder to ONE isolated Compose demo database.

Not a NASA importer. No migrations, role grants or database creation here.
"""

import argparse
import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path

from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.repositories.collection import database_identity  # noqa: E402
from app.services.demo_manifest import DEMO_ROOT, fixture_rows  # noqa: E402
from app.services.demo_seed import seed  # noqa: E402

ROOT = Path("/var/lib/flameguard/collection")
DATABASE = "flameguard_demo_local"


async def prepare():
    config_path = ROOT / "collection.json"
    fixture = fixture_rows()
    if config_path.exists():
        old = json.loads(config_path.read_text("utf-8"))
        if old.get("origin") != "synthetic" or old.get("collectionId") != fixture["collectionId"]:
            raise ValueError("Refusing to replace another collection")
    url = URL.create(
        "postgresql+asyncpg",
        username="flameguard_owner",
        password=os.environ["OWNER_PASSWORD"],
        host="127.0.0.1",
        port=5432,
        database=DATABASE,
    )
    engine = create_async_engine(url, hide_parameters=True)
    try:
        async with async_sessionmaker(engine)() as session:
            identity = await database_identity(session)
    finally:
        await engine.dispose()
    authorization = {
        "exclusiveDisposable": True,
        "environment": "development",
        "host": "127.0.0.1",
        "port": 5432,
        "database": DATABASE,
        "role": "flameguard_owner",
        "owner": identity["owner"],
        "databaseOid": identity["databaseOid"],
        "collectionId": fixture["collectionId"],
    }
    with tempfile.TemporaryDirectory() as temporary:
        auth = Path(temporary) / "authorization.json"
        auth.write_text(json.dumps(authorization), "utf-8")
        result = await seed(
            url.render_as_string(hide_password=False), "development", True, DATABASE, str(auth)
        )
    await asyncio.to_thread(ROOT.mkdir, parents=True, exist_ok=True)
    for name in ("phase4-v1.json", "slugs-v1.json"):
        source = (DEMO_ROOT / name).read_bytes()
        destination = ROOT / name
        if destination.exists() and destination.read_bytes() != source:
            raise ValueError("Existing fixture differs; require explicit operator review")
        destination.write_bytes(source)
    config = {
        "collectionId": fixture["collectionId"],
        "origin": "synthetic",
        "reviewState": "unreviewed",
        "fixture": "phase4-v1.json",
        "slugs": "slugs-v1.json",
        "target": {
            "host": "postgres",
            "port": 5432,
            "database": DATABASE,
            "databaseOid": identity["databaseOid"],
            "readRole": "flameguard_reader",
        },
    }
    temporary = ROOT / "collection.json.tmp"
    temporary.write_text(json.dumps(config, indent=2) + "\n", "utf-8")
    temporary.replace(config_path)
    print(json.dumps({"origin": "synthetic", "result": result}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-synthetic", action="store_true", required=True)
    parser.parse_args()
    try:
        asyncio.run(prepare())
    except Exception:
        print(
            "Synthetic setup failed; check roles, migrations, fixture and volume permissions.",
            file=sys.stderr,
        )
        sys.exit(1)
