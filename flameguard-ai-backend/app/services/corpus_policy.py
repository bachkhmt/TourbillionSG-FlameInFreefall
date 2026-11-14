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
from urllib.parse import urlparse

from app.integrations.chat import CorpusPassage

CORPUS_POLICY_VERSION = "cc0-source-registry-v1"
CHALLENGE_POLICY_VERSION = "nasa-source-rights-registry-v2"
ADMITTED_LICENSE = "CC0-1.0"
NASA_TEXT_LICENSE = "NASA-public-use-text"
NASA_RIGHTS_URL = "https://www.nasa.gov/nasa-brand-center/images-and-media/"
SHA256 = re.compile(r"[a-f0-9]{64}")


class CorpusPolicyError(Exception):
    """Declared corpus policy is invalid or conflicts with admitted data."""


@dataclass(frozen=True)
class CorpusPolicy:
    version: str
    registry: dict
    registry_sha256: str
    source_revision: str


def admit_resource_sources(rows, policy: CorpusPolicy) -> None:
    """Bind inventory entries, including deliberately unindexed links, to stored sources."""
    try:
        expected = {
            identity: entry
            for identity, entry in policy.registry["sources"].items()
            if entry.get("sourceScope") == "challenge"
        }
        if set(expected) != {str(row.id) for row in rows}:
            raise CorpusPolicyError
        for row in rows:
            entry = expected[str(row.id)]
            if (
                policy.version != CHALLENGE_POLICY_VERSION
                or row.investigation_id is not None
                or entry["investigationId"] is not None
                or row.source_scope != "challenge"
                or row.source_url != entry["sourceUrl"]
                or row.version != entry["version"]
                or row.ingestion_status != entry["status"]
                or not SHA256.fullmatch(entry["sha256"])
                or not row.version.endswith(f"/sha256:{entry['sha256']}")
            ):
                raise CorpusPolicyError
    except (KeyError, TypeError, AttributeError):
        raise CorpusPolicyError from None


def load_corpus_policy(manifest_path: str, config: dict) -> CorpusPolicy | None:
    """Return the declared policy, `None` when undeclared, or raise CorpusPolicyError."""
    declaration = config.get("corpusPolicy")
    if declaration is None:
        return None
    try:
        if (
            config["origin"] != "real"
            or config["reviewState"] != "unreviewed"
            or declaration["policyVersion"] not in {CORPUS_POLICY_VERSION, CHALLENGE_POLICY_VERSION}
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
            registry["policyVersion"] != declaration["policyVersion"]
            or registry["sourceRevision"] != declaration["sourceRevision"]
            or not registry["sources"]
            or not registry["chunks"]
        ):
            raise ValueError
        return CorpusPolicy(registry["policyVersion"], registry, digest, registry["sourceRevision"])
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
            scope = getattr(source, "source_scope", "investigation")
            registered_scope = registered.get("sourceScope", "investigation")
            investigation = str(source.investigation_id) if source.investigation_id else None
            nasa_text = (
                policy.version == CHALLENGE_POLICY_VERSION
                and scope == "challenge"
                and registered["license"] == NASA_TEXT_LICENSE
                and registered.get("rightsUrl") == NASA_RIGHTS_URL
                and registered.get("rightsScope") == "NASA-authored article text only"
                and urlparse(registered["sourceUrl"]).hostname
                in {"www.nasa.gov", "sma.nasa.gov", "spinoff.nasa.gov"}
            )
            if (
                (registered["license"] != ADMITTED_LICENSE and not nasa_text)
                or registered_scope != scope
                or scope not in {"investigation", "challenge"}
                or (scope == "investigation") != (source.investigation_id is not None)
                or (scope == "challenge" and policy.version != CHALLENGE_POLICY_VERSION)
                or not SHA256.fullmatch(registered["sha256"])
                or source.ingestion_status != "source_checked"
                or source.version != registered["version"]
                or not source.version.endswith(f"/sha256:{registered['sha256']}")
                or not registered["sourceUrl"].startswith("https://")
                or source.source_url != registered["sourceUrl"]
                or investigation != registered["investigationId"]
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
                    source_scope=scope,
                    slug=registered["slug"],
                    title=registered["title"],
                    locator=chunk.source_locator,
                    text=chunk.chunk_text,
                )
            )
    except (KeyError, TypeError, AttributeError):
        raise CorpusPolicyError from None
    return tuple(passages)
