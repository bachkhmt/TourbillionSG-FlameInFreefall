"""Read the lossless sidecar only after database collection admission."""

import hashlib
import json
from pathlib import Path

from app.services.corpus_policy import load_corpus_policy
from app.services.errors import Phase4Error


def load_mission_release(manifest_path: str, config: dict) -> dict:
    try:
        policy = config["researchPolicy"]
        base = Path(manifest_path).resolve().parent
        path = (base / policy["release"]).resolve()
        if policy["version"] != "mission-research-v1" or path.parent != base:
            raise ValueError
        if path.stat().st_size > 64 * 1024 * 1024:
            raise ValueError
        raw = path.read_bytes()
        snapshot = (base / config["snapshot"]).read_bytes()
        corpus = load_corpus_policy(manifest_path, config)
        if (
            hashlib.sha256(raw).hexdigest() != policy["sha256"]
            or hashlib.sha256(snapshot).hexdigest() != policy["snapshotSha256"]
            or corpus is None
            or corpus.source_revision != policy["sourceRevision"]
        ):
            raise ValueError
        release = json.loads(raw)
        if release["revision"] != policy["sourceRevision"]:
            raise ValueError
        return release
    except Exception:
        raise Phase4Error("MISSION_RESEARCH_UNAVAILABLE", 503) from None
