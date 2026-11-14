"""Serve the standard backend app (app.main:app) from a prepared chat preview settings file.

  flameguard-ai-backend/.venv/bin/python scripts/run_chat_backend.py \
      --settings .demo/nasa-chat-preview-<db>.json --port 8111

Settings (database URLs with credentials) are loaded into this process environment only;
they are never printed or put on the command line. HTTP access logs stay off because
request paths contain opaque chat session ids.
"""

import argparse
import json
import os
import stat
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KEYS = ("DATABASE_URL", "RUNTIME_DATABASE_URL", "CATALOG_COLLECTION_MANIFEST", "CHAT_PROVIDER")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--settings", type=Path, required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8111)
    args = parser.parse_args()

    mode = stat.S_IMODE(args.settings.stat().st_mode)
    if mode & 0o077:
        raise SystemExit("Settings file must not be readable by group/others (chmod 600)")
    settings = json.loads(args.settings.read_text("utf-8"))
    if any(not settings.get(k) for k in KEYS):
        raise SystemExit("Not a chat preview settings file")
    env = {**os.environ, **{key: settings[key] for key in KEYS}, "APP_ENV": "development"}
    backend = ROOT / "flameguard-ai-backend"
    os.chdir(backend)
    os.execvpe(
        sys.executable,
        [
            sys.executable, "-m", "uvicorn", "app.main:app",
            "--host", args.host, "--port", str(args.port), "--no-access-log",
        ],
        env,
    )  # fmt: skip


if __name__ == "__main__":
    main()
