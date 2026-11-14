import hashlib
import json
from pathlib import Path

from fastapi import HTTPException

VERSION = "nasa-extractive-v1"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def registry_for(release):
    studies = {s["id"]: s for s in release["investigations"]}
    sources = {}
    for source in release["sources"]:
        if source["license"] != "CC0-1.0":
            continue
        study = studies[source["investigationId"]]
        sources[source["id"]] = {
            "sha256": source["sha256"],
            "license": source["license"],
            "filename": source["filename"],
            "sourceUrl": source["sourceUrl"],
            "investigationId": study["uuid"],
            "slug": study["id"],
            "title": study["title"],
            "version": (
                f"study:{source['studyVersion']}/file:{source['fileVersion']}"
                f"/sha256:{source['sha256']}"
            ),
        }
    return {
        "policyVersion": VERSION,
        "sourceRevision": release["revision"],
        "sources": sources,
        "chunks": {
            c["id"]: {
                "sourceId": c["sourceId"],
                "locator": c["locator"],
                "textSha256": digest(c["text"].encode()),
            }
            for c in release["chunks"]
            if c["sourceId"] in sources
        },
    }


def write_policy(collection_path, release):
    """Only for the fresh test/preview target prepared by the operator helper."""
    collection_path = Path(collection_path)
    registry = registry_for(release)
    raw = (json.dumps(registry, sort_keys=True, ensure_ascii=False, indent=2) + "\n").encode()
    path = collection_path.parent / "nasa-chat-registry.json"
    path.write_bytes(raw)
    config = json.loads(collection_path.read_text("utf-8"))
    config.update(
        admissionVersion=2, runtimeTables=["chat_message", "chat_session", "message_citation"]
    )
    config["nasaChat"] = {
        "policyVersion": VERSION,
        "registry": path.name,
        "registrySha256": digest(raw),
        "sourceRevision": release["revision"],
    }
    collection_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")


def load_policy(collection_path, config):
    try:
        declaration = config["nasaChat"]
        if (
            config["origin"] != "real"
            or config["reviewState"] != "unreviewed"
            or declaration["policyVersion"] != VERSION
        ):
            raise ValueError
        base = Path(collection_path).resolve().parent
        path = (base / declaration["registry"]).resolve()
        if path.parent != base:
            raise ValueError
        raw = path.read_bytes()
        if digest(raw) != declaration["registrySha256"]:
            raise ValueError
        registry = json.loads(raw)
        if (
            registry["policyVersion"] != VERSION
            or registry["sourceRevision"] != declaration["sourceRevision"]
        ):
            raise ValueError
        if not registry["chunks"] or not registry["sources"]:
            raise ValueError
        return registry, digest(raw)
    except (KeyError, TypeError, ValueError, OSError):
        raise HTTPException(503, "NASA chat corpus policy unavailable") from None
