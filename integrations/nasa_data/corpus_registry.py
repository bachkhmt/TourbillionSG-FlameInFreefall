"""Corpus registry handoff for source-cited chat (backend ADR-0005).

The Data adapter lists CC0-1.0 sources and their chunks; the backend admits the corpus
only when this registry, its declared hash and the imported rows agree exactly.
Writing the declaration is an operator step for a prepared target; it grants no review.
"""

import hashlib
import json
from pathlib import Path

from app.services.corpus_policy import (
    ADMITTED_LICENSE,
    CHALLENGE_POLICY_VERSION,
    CORPUS_POLICY_VERSION,
    NASA_TEXT_LICENSE,
)

REGISTRY_FILENAME = "corpus-registry.json"


def registry_for(release: dict) -> dict:
    studies = {s["id"]: s for s in release["investigations"]}
    sources = {}
    for source in release["sources"]:
        scope = source.get("sourceScope", "investigation")
        if scope != "challenge" and source["license"] != ADMITTED_LICENSE:
            continue  # unknown or restricted rights never enter the chat corpus
        study = studies.get(source["investigationId"])
        sources[source["id"]] = {
            "sha256": source["sha256"],
            "license": source["license"],
            "filename": source["filename"],
            "sourceUrl": source["sourceUrl"],
            "investigationId": study["uuid"] if study else None,
            "sourceScope": scope,
            "slug": study["id"] if study else source["resourceId"],
            "title": study["title"] if study else source["title"],
            "status": source.get("status", "source_checked"),
            "rightsUrl": source.get("rightsUrl"),
            "rightsScope": source.get("rightsScope"),
            "version": source.get("version")
            or (
                f"study:{source['studyVersion']}/file:{source['fileVersion']}"
                f"/sha256:{source['sha256']}"
            ),
        }
    return {
        "policyVersion": CHALLENGE_POLICY_VERSION
        if any(s.get("sourceScope") == "challenge" for s in sources.values())
        else CORPUS_POLICY_VERSION,
        "sourceRevision": release["revision"],
        "sources": sources,
        "chunks": {
            chunk["id"]: {
                "sourceId": chunk["sourceId"],
                "locator": chunk["locator"],
                "textSha256": hashlib.sha256(chunk["text"].encode()).hexdigest(),
            }
            for chunk in release["chunks"]
            if chunk["sourceId"] in sources
            and sources[chunk["sourceId"]]["license"] in {ADMITTED_LICENSE, NASA_TEXT_LICENSE}
        },
    }


def write_corpus_policy(manifest_path, release: dict) -> Path:
    """Write the registry next to a v2 collection manifest and declare it there."""
    manifest_path = Path(manifest_path)
    registry = registry_for(release)
    raw = (json.dumps(registry, sort_keys=True, ensure_ascii=False, indent=2) + "\n").encode()
    path = manifest_path.parent / REGISTRY_FILENAME
    path.write_bytes(raw)
    config = json.loads(manifest_path.read_text("utf-8"))
    config.update(
        admissionVersion=2, runtimeTables=["chat_message", "chat_session", "message_citation"]
    )
    config["corpusPolicy"] = {
        "policyVersion": registry["policyVersion"],
        "registry": REGISTRY_FILENAME,
        "registrySha256": hashlib.sha256(raw).hexdigest(),
        "sourceRevision": release["revision"],
    }
    manifest_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    return path
