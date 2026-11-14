"""Prepare a NEW retained chat preview target inside the dedicated test container only.

Creates a fresh child database plus reader/writer roles in tourbillion-test-pg
(127.0.0.1:55435), imports the offline NASA snapshot and writes the chat policy.
Existing databases and roles are never reset. Prints the path of the 0600 settings JSON.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "flameguard-ai-backend")]


async def main():
    from integration_tests.chat_target import TEST_SERVER, persist_preview, prepare_target

    config = json.loads((ROOT / ".demo/test-db-settings.json").read_text("utf-8"))
    if (config["container"], config["host"], config["port"]) != (
        "tourbillion-test-pg",
        *TEST_SERVER,
    ):
        raise ValueError("Settings do not point at the dedicated test container")
    target = await prepare_target(config["PHASE4_ADMIN_URL"])
    print(persist_preview(target))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--prepare-new-test-target",
        action="store_true",
        required=True,
        help="Create and retain a new child DB/roles in tourbillion-test-pg (55435) only",
    )
    parser.parse_args()
    try:
        asyncio.run(main())
    except Exception as exc:
        print(
            f"Could not prepare chat preview ({type(exc).__name__}); no existing target was reset.",
            file=sys.stderr,
        )
        raise SystemExit(1) from None
