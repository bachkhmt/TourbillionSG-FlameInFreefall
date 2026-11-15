"""Rebuild the deployed NASA collection offline for a release image."""

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT), str(ROOT / "flameguard-ai-backend")]

from integrations.nasa_data.corpus_registry import write_corpus_policy  # noqa: E402
from integrations.nasa_data.export import export_bundle  # noqa: E402


def bind_collection(bundle, collection):
    release = json.loads((bundle / "release.json").read_text("utf-8"))
    snapshot = json.loads((bundle / "snapshot.json").read_text("utf-8"))
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    if (
        release["revision"] != collection["sourceRevision"]
        or hashlib.sha256(canonical.encode()).hexdigest() != collection["snapshotContentSha256"]
    ):
        raise ValueError(
            "Export differs from the imported Azure collection. "
            "Import and bind the new release before deployment."
        )
    manifest = bundle / "collection.json"
    config = {
        "collectionId": snapshot["collectionId"],
        "origin": "real",
        "reviewState": "unreviewed",
        "snapshot": "snapshot.json",
        "slugs": "slugs.json",
        "target": collection["target"],
    }
    manifest.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    write_corpus_policy(manifest, release)
    return manifest


def prepare(output, config):
    bundle = export_bundle(output, profile="unified")
    manifest = bind_collection(bundle, config["collection"])
    print(f"Prepared NASA collection at {manifest}")
    return bundle


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--config", type=Path, default=Path(__file__).with_name("production.json"))
    args = parser.parse_args()
    prepare(args.output, json.loads(args.config.read_text("utf-8")))
