"""Real-corpus admission for source-cited chat (ADR-0005).

The Data adapter declares a registry in the collection manifest under `corpusPolicy`.
The backend re-reads and re-hashes it on every snapshot and admits a chunk only when
its source and text agree exactly with that registry. Nothing here grants review status.
"""

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

from app.integrations.chat import CorpusPassage

CORPUS_POLICY_VERSION = "cc0-source-registry-v1"
ADMITTED_LICENSE = "CC0-1.0"
SHA256 = re.compile(r"[a-f0-9]{64}")


class CorpusPolicyError(Exception):
    """Declared corpus policy is invalid or conflicts with admitted data."""


@dataclass(frozen=True)
class CorpusPolicy:
    version: str
    registry: dict
    registry_sha256: str
    source_revision: str


def load_corpus_policy(manifest_path: str, config: dict) -> CorpusPolicy | None:
    """Return the declared policy, `None` when undeclared, or raise CorpusPolicyError."""
    declaration = config.get("corpusPolicy")
    if declaration is None:
        return None
    try:
        if (
            config["origin"] != "real"
            or config["reviewState"] != "unreviewed"
            or declaration["policyVersion"] != CORPUS_POLICY_VERSION
        ):
            raise ValueError
        base = Path(manifest_path).resolve().parent
        path = (base / declaration["registry"]).resolve()
        if path.parent != base:
            raise ValueError
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != declaration["registrySha256"]:
            raise ValueError
        registry = json.loads(raw)
        if (
            registry["policyVersion"] != CORPUS_POLICY_VERSION
            or registry["sourceRevision"] != declaration["sourceRevision"]
            or not registry["sources"]
            or not registry["chunks"]
        ):
            raise ValueError
        return CorpusPolicy(CORPUS_POLICY_VERSION, registry, digest, registry["sourceRevision"])
    except (KeyError, TypeError, ValueError, OSError):
        raise CorpusPolicyError from None


def admit_passages(rows, policy: CorpusPolicy) -> tuple[CorpusPassage, ...]:
    """Cross-check (chunk, source) rows read in the admission snapshot against the registry."""
    sources, chunks = policy.registry["sources"], policy.registry["chunks"]
    passages = []
    try:
        for chunk, source in rows:
            registered = sources.get(str(source.id))
            if registered is None:
                continue
            expected = chunks.get(str(chunk.id))
            if (
                registered["license"] != ADMITTED_LICENSE
                or not SHA256.fullmatch(registered["sha256"])
                or source.ingestion_status != "source_checked"
                or source.version != registered["version"]
                or not source.version.endswith(f"/sha256:{registered['sha256']}")
                or source.source_url != registered["sourceUrl"]
                or str(source.investigation_id) != registered["investigationId"]
                or not expected
                or expected["sourceId"] != str(source.id)
                or expected["locator"] != chunk.source_locator
                or expected["textSha256"] != hashlib.sha256(chunk.chunk_text.encode()).hexdigest()
            ):
                raise CorpusPolicyError
            passages.append(
                CorpusPassage(
                    chunk_id=chunk.id,
                    source_document_id=source.id,
                    investigation_id=source.investigation_id,
                    slug=registered["slug"],
                    title=registered["title"],
                    locator=chunk.source_locator,
                    text=chunk.chunk_text,
                )
            )
    except (KeyError, TypeError, AttributeError):
        raise CorpusPolicyError from None
    return tuple(passages)
