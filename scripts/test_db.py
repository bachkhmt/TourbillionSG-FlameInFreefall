"""Dedicated PostgreSQL test container for this repo (never touches other containers).

  python3 scripts/test_db.py create          # one-time: container tourbillion-test-pg on 55435
  python3 scripts/test_db.py run -- <cmd...> # run <cmd> with PHASE4_ADMIN_URL/TEST_DATABASE_URL

Credentials are generated locally and stored only in .demo/ (git-ignored, mode 0600).
They are never printed or passed on a command line.
"""

import argparse
import json
import os
import secrets
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / ".demo"
SETTINGS = DEMO / "test-db-settings.json"
ENV_FILE = DEMO / "test-db.env"
CONTAINER = "tourbillion-test-pg"
PORT = 55435
IMAGE = "postgres:17-alpine"
ADMIN_DB = "flameguard_test_admin"


def private_write(path: Path, text: str) -> None:
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w", encoding="utf-8") as file:
        file.write(text)


def create() -> None:
    if SETTINGS.exists():
        raise SystemExit(f"{SETTINGS.name} already exists; container was created before.")
    DEMO.mkdir(exist_ok=True)
    password = secrets.token_hex(24)
    private_write(ENV_FILE, f"POSTGRES_PASSWORD={password}\nPOSTGRES_DB={ADMIN_DB}\n")
    url = f"postgresql+asyncpg://postgres:{password}@127.0.0.1:{PORT}/{ADMIN_DB}"
    private_write(
        SETTINGS,
        json.dumps(
            {
                "container": CONTAINER,
                "host": "127.0.0.1",
                "port": PORT,
                "PHASE4_ADMIN_URL": url,
                "TEST_DATABASE_URL": url,
            }
        ),
    )
    subprocess.run(
        [
            "docker", "run", "-d", "--name", CONTAINER,
            "--env-file", str(ENV_FILE),
            "-p", f"127.0.0.1:{PORT}:5432",
            "--label", "purpose=test-only",
            IMAGE,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
    )  # fmt: skip
    for _ in range(60):
        ready = subprocess.run(
            ["docker", "exec", CONTAINER, "pg_isready", "-U", "postgres", "-q"], check=False
        )
        if ready.returncode == 0:
            print(f"{CONTAINER} ready on 127.0.0.1:{PORT}")
            return
        time.sleep(1)
    raise SystemExit(f"{CONTAINER} did not become ready")


def run(command: list[str]) -> None:
    settings = json.loads(SETTINGS.read_text("utf-8"))
    if (settings["container"], settings["host"], settings["port"]) != (
        CONTAINER,
        "127.0.0.1",
        PORT,
    ):
        raise SystemExit("Settings do not point at the dedicated test container")
    env = {
        **os.environ,
        "PHASE4_ADMIN_URL": settings["PHASE4_ADMIN_URL"],
        "TEST_DATABASE_URL": settings["TEST_DATABASE_URL"],
    }
    env.pop("DATABASE_URL", None)
    # The backend fixtures write isolated manifests under this ignored directory.
    (ROOT / "flameguard-ai-backend" / ".tools").mkdir(exist_ok=True)
    os.execvpe(command[0], command, env)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawTextHelpFormatter
    )
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("create")
    runner = sub.add_parser("run")
    runner.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.action == "create":
        create()
    else:
        command = args.command[1:] if args.command[:1] == ["--"] else args.command
        if not command:
            raise SystemExit("Usage: test_db.py run -- <command>")
        run(command)
