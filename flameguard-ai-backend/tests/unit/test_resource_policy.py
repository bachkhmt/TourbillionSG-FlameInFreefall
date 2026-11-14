import hashlib
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.services.corpus_policy import (
    CHALLENGE_POLICY_VERSION,
    CORPUS_POLICY_VERSION,
    NASA_RIGHTS_URL,
    NASA_TEXT_LICENSE,
    CorpusPolicy,
    CorpusPolicyError,
    admit_passages,
    admit_resource_sources,
)


def admitted_resource(license=NASA_TEXT_LICENSE, version=CHALLENGE_POLICY_VERSION):
    identity, chunk_id = uuid4(), uuid4()
    sha = "a" * 64
    body = "NASA article narration, preserved as source text."
    source = SimpleNamespace(
        id=identity,
        investigation_id=None,
        source_scope="challenge",
        source_url="https://www.nasa.gov/history/example/",
        version=f"resource:example/file:1/sha256:{sha}",
        ingestion_status="source_checked",
    )
    chunk = SimpleNamespace(
        id=chunk_id, source_locator="HTML article / paragraph 1", chunk_text=body
    )
    entry = dict(
        sha256=sha,
        license=license,
        filename="example.html",
        sourceUrl=source.source_url,
        investigationId=None,
        sourceScope="challenge",
        slug="example",
        title="Example resource",
        version=source.version,
        status=source.ingestion_status,
        rightsUrl=NASA_RIGHTS_URL,
        rightsScope="NASA-authored article text only",
    )
    policy = CorpusPolicy(
        version,
        {
            "sources": {str(identity): entry},
            "chunks": {
                str(chunk_id): dict(
                    sourceId=str(identity),
                    locator=chunk.source_locator,
                    textSha256=hashlib.sha256(body.encode()).hexdigest(),
                )
            },
        },
        "b" * 64,
        "resource-rev",
    )
    return source, chunk, entry, policy


def test_explicit_nasa_text_policy_admits_null_ownership_without_claiming_cc0():
    source, chunk, _, policy = admitted_resource()
    admit_resource_sources([source], policy)
    (passage,) = admit_passages([(chunk, source)], policy)
    assert passage.source_scope == "challenge" and passage.investigation_id is None


@pytest.mark.parametrize(
    "changes",
    [
        {"license": "unknown"},
        {"sourceScope": "investigation"},
        {"rightsScope": "all NASA content"},
        {"rightsUrl": "https://example.invalid/"},
    ],
)
def test_resource_policy_rejects_unconfirmed_rights_and_scope(changes):
    source, chunk, entry, policy = admitted_resource()
    entry.update(changes)
    with pytest.raises(CorpusPolicyError):
        admit_passages([(chunk, source)], policy)


def test_legacy_cc0_policy_is_not_silently_broadened_to_nasa_text():
    source, chunk, _, policy = admitted_resource(version=CORPUS_POLICY_VERSION)
    with pytest.raises(CorpusPolicyError):
        admit_passages([(chunk, source)], policy)


def test_unindexed_resource_inventory_is_bound_to_database_rows():
    source, _, entry, policy = admitted_resource(license="unknown")
    source.ingestion_status = entry["status"] = "linked"
    policy.registry["chunks"] = {}
    admit_resource_sources([source], policy)
    assert admit_passages([], policy) == ()
    source.source_url = "https://example.invalid/forged"
    with pytest.raises(CorpusPolicyError):
        admit_resource_sources([source], policy)
