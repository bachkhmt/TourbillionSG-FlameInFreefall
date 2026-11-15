"""Import an exported NASA bundle and bind its manifest to an existing database.

Run manually from the monorepo root. Migrations and reader/chat roles must already
exist. The owner password is prompted securely and is never saved or printed.
Existing scientific rows must match the bundle. Chat history is preserved.
"""

import argparse
import asyncio
import getpass
import hashlib
import json
import os
import ssl
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / "flameguard-ai-backend")]

from integrations.nasa_data.corpus_registry import write_corpus_policy  # noqa: E402
from sqlalchemy import insert, text  # noqa: E402
from sqlalchemy.engine import URL  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402

from app.models import Base  # noqa: E402
from app.repositories.collection import RUNTIME_TABLES, inspect_fixture  # noqa: E402
from app.services.demo_manifest import snapshot_rows  # noqa: E402

GENERATED_FILES = ("corpus-registry.json", "mission-release.json", "collection.json")


def deployment_config(args):
    path = getattr(args, "activate_config", None)
    if path is None:
        return None
    config = json.loads(path.read_text("utf-8"))
    target = config["collection"]["target"]
    requested = {
        "host": args.host,
        "port": args.port,
        "database": args.database,
        "readRole": args.reader_role,
    }
    if any(target.get(key) != value for key, value in requested.items()):
        raise ValueError("Deployment config targets another database or reader")
    return config


def activate_config(path, config, bundle, manifest, release):
    snapshot = json.loads((bundle / "snapshot.json").read_text("utf-8"))
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    config["collection"] = {
        "sourceRevision": release["revision"],
        "snapshotContentSha256": hashlib.sha256(canonical.encode()).hexdigest(),
        "target": manifest["target"],
    }
    # Publish only after the import transaction and bundle metadata succeed.
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent, delete=False
    ) as f:
        staged = Path(f.name)
        json.dump(config, f, indent=2)
        f.write("\n")
    try:
        os.replace(staged, path)
    finally:
        staged.unlink(missing_ok=True)


def read_bundle(bundle):
    bundle = bundle.resolve(strict=True)
    checksums = json.loads((bundle / "checksums.json").read_text("utf-8"))
    required = {"snapshot.json", "slugs.json", "release.json", "manifest.json"}
    if not required.issubset(checksums):
        raise ValueError("Bundle checksums omit required files")
    for name, expected in checksums.items():
        path = (bundle / name).resolve(strict=True)
        if not path.is_relative_to(bundle):
            raise ValueError("Bundle checksum path escapes the bundle directory")
        with path.open("rb") as source:
            actual = hashlib.file_digest(source, "sha256").hexdigest()
        if actual != expected:
            raise ValueError(f"Bundle checksum mismatch: {name}")
    snapshot = snapshot_rows(bundle / "snapshot.json")
    release = json.loads((bundle / "release.json").read_text("utf-8"))
    metadata = json.loads((bundle / "manifest.json").read_text("utf-8"))
    slugs = json.loads((bundle / "slugs.json").read_text("utf-8"))
    if (
        snapshot["origin"] != "real"
        or metadata["origin"] != "real"
        or metadata["reviewState"] != "unreviewed"
        or metadata["sourceRevision"] != release["revision"]
        or slugs["collectionId"] != snapshot["collectionId"]
        or any(snapshot["tables"][name] for name in RUNTIME_TABLES)
    ):
        raise ValueError("Bundle identity, origin or runtime rows are invalid")
    return snapshot, release


async def check_roles(session, reader, chat):
    for role in (reader, chat):
        safe = await session.scalar(
            text("""
                SELECT rolcanlogin AND NOT (
                    rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls OR rolreplication
                    OR has_schema_privilege(rolname, 'public', 'CREATE')
                    OR has_database_privilege(rolname, current_database(), 'CREATE')
                    OR EXISTS (
                        SELECT 1 FROM pg_roles other
                        WHERE other.rolname <> :role
                        AND pg_has_role(:role, other.oid, 'MEMBER')
                    )
                ) FROM pg_roles WHERE rolname = :role
            """),
            {"role": role},
        )
        if safe is not True:
            raise ValueError(f"Role is missing or has excessive privileges: {role}")
        for table in Base.metadata.sorted_tables:
            permissions = (
                (
                    await session.execute(
                        text("""
                        SELECT has_table_privilege(:role, c.oid, 'SELECT') AS readable,
                               has_table_privilege(:role, c.oid, 'INSERT') AS insertable,
                               has_table_privilege(:role, c.oid,
                                   'UPDATE,DELETE,TRUNCATE,TRIGGER') AS mutable,
                               pg_get_userbyid(c.relowner) = :role AS owner
                        FROM pg_class c WHERE c.oid = to_regclass(:table)
                    """),
                        {"role": role, "table": "public." + table.name},
                    )
                )
                .mappings()
                .one()
            )
            expected_insert = role == chat and table.name in RUNTIME_TABLES
            needs_read = role == reader or table.name in RUNTIME_TABLES
            if (
                permissions["owner"]
                or permissions["mutable"]
                or permissions["insertable"] != expected_insert
                or (needs_read and not permissions["readable"])
            ):
                raise ValueError(f"Unexpected privileges: {role} on {table.name}")


def write_manifest(bundle, config, release):
    # Stage the generated files together. Each replacement is atomic, and the
    # manifest is published last so it never references an incomplete registry.
    with tempfile.TemporaryDirectory(dir=bundle) as staging:
        manifest = Path(staging) / "collection.json"
        (Path(staging) / config["snapshot"]).write_bytes((bundle / config["snapshot"]).read_bytes())
        manifest.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
        write_corpus_policy(manifest, release)
        for name in GENERATED_FILES:
            os.replace(Path(staging) / name, bundle / name)


async def import_bundle(args, password):
    bundle = args.bundle.resolve(strict=True)
    snapshot, release = read_bundle(bundle)
    deployment = deployment_config(args)
    url = URL.create(
        "postgresql+asyncpg",
        username=args.owner,
        password=password,
        host=args.host,
        port=args.port,
        database=args.database,
    )
    engine = create_async_engine(
        url,
        hide_parameters=True,
        connect_args={"ssl": ssl.create_default_context(), "timeout": 15},
    )
    inserted = 0
    try:
        async with engine.begin() as connection:
            # Serialize this importer per database. A failure rolls back all inserts.
            await connection.execute(text("SELECT pg_advisory_xact_lock(71620420261115)"))
            actual_database = await connection.scalar(text("SELECT current_database()"))
            if actual_database != args.database:
                raise ValueError("Connected database differs from the requested target")
            revisions = (
                (await connection.execute(text("SELECT version_num FROM alembic_version")))
                .scalars()
                .all()
            )
            if revisions != ["0004_challenge_source_scope"]:
                raise ValueError("Database must be migrated to 0004_challenge_source_scope")
            database_oid = await connection.scalar(
                text("SELECT oid::bigint FROM pg_database WHERE datname = current_database()")
            )
            if deployment and database_oid != deployment["collection"]["target"]["databaseOid"]:
                raise ValueError("Database OID differs from the deployment config")
            config = {
                "collectionId": snapshot["collectionId"],
                "origin": "real",
                "reviewState": "unreviewed",
                "snapshot": "snapshot.json",
                "slugs": "slugs.json",
                "target": {
                    "host": args.host,
                    "port": args.port,
                    "database": args.database,
                    "databaseOid": database_oid,
                    "readRole": args.reader_role,
                },
            }
            existing_manifest = bundle / "collection.json"
            if existing_manifest.exists():
                old = json.loads(existing_manifest.read_text("utf-8"))
                if any(old.get(key) != value for key, value in config.items()):
                    raise ValueError("Existing manifest binds another target or collection")
            async with AsyncSession(bind=connection) as session:
                await check_roles(session, args.reader_role, args.chat_role)
                missing = await inspect_fixture(
                    session, snapshot, allow_subset=True, runtime_tables=RUNTIME_TABLES
                )
                for table in Base.metadata.sorted_tables:
                    rows = missing.get(table.name, [])
                    for offset in range(0, len(rows), 200):
                        batch = rows[offset : offset + 200]
                        await session.execute(insert(table), batch)
                        inserted += len(batch)
                await inspect_fixture(session, snapshot, runtime_tables=RUNTIME_TABLES)
    finally:
        await engine.dispose()
    write_manifest(bundle, config, release)
    if deployment is not None:
        activate_config(args.activate_config, deployment, bundle, config, release)
    print(
        json.dumps(
            {
                "database": args.database,
                "collectionId": snapshot["collectionId"],
                "insertedRows": inserted,
                "rows": {name: len(rows) for name, rows in snapshot["tables"].items() if rows},
                "manifest": str(bundle / "collection.json"),
                "origin": "real",
                "reviewState": "unreviewed",
            },
            indent=2,
        )
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--database", required=True)
    parser.add_argument("--owner", required=True)
    parser.add_argument("--reader-role", required=True)
    parser.add_argument("--chat-role", required=True)
    parser.add_argument(
        "--activate-config",
        type=Path,
        help="Update this deployment config only after the database import succeeds",
    )
    args = parser.parse_args()
    if args.reader_role == args.chat_role or args.owner in {args.reader_role, args.chat_role}:
        parser.error("Owner, reader and chat roles must be distinct")
    # Check local files before prompting for credentials or opening a connection.
    read_bundle(args.bundle)
    deployment_config(args)
    print(f"Target: {args.host}:{args.port}/{args.database}; owner: {args.owner}")
    password = getpass.getpass("PostgreSQL owner password (hidden): ")
    if not password:
        raise ValueError("Owner password is required")
    asyncio.run(import_bundle(args, password))


if __name__ == "__main__":
    try:
        main()
    except ValueError as exc:
        print(f"Import configuration error: {exc}", file=sys.stderr)
        raise SystemExit(1) from None
    except Exception as exc:
        # Never print database exceptions, URLs or credential-bearing tracebacks.
        print(f"Import failed ({type(exc).__name__}).", file=sys.stderr)
        raise SystemExit(1) from None
