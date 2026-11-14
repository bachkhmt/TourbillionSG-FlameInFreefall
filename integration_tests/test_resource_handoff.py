"""Backend/Data option-A acceptance; not an AI retrieval quality evaluation."""

import copy
import hashlib
import json
import shutil

import pytest
from app.services.corpus_policy import (
    CHALLENGE_POLICY_VERSION,
)
from app.services.demo_manifest import snapshot_rows

from integrations.nasa_data.corpus_registry import registry_for
from integrations.nasa_data.export import build_snapshot
from integrations.nasa_data.resource_documents import (
    ROOT,
    article_paragraphs,
    build_resource_release,
)


@pytest.fixture(scope="module")
def release():
    return build_resource_release()


def test_option_a_preserves_experiments_and_stores_all_ten_resources(release):
    assert len(release["resources"]) == 10
    sources = {s["id"]: s for s in release["sources"]}
    resources = [s for s in sources.values() if s.get("sourceScope") == "challenge"]
    assert len(resources) == 10 and all(s["investigationId"] is None for s in resources)
    assert release["stats"]["investigations"] == 24 and release["stats"]["runs"] == 1926
    assert not any(r["sourceId"] in {s["id"] for s in resources} for r in release["runs"])
    for source in resources:
        assert (
            hashlib.sha256(release["_artifacts"][source["sha256"]]).hexdigest() == source["sha256"]
        )
    for item in release["resources"]:
        assert item["sourceId"] in sources
        assert item["indexed"] == any(c["sourceId"] == item["sourceId"] for c in release["chunks"])


def test_unavailable_or_non_document_resources_never_get_invented_chunks(release):
    by_id = {r["id"]: r for r in release["resources"]}
    assert by_id["psi-combustion"]["status"] == "discovery_link"
    assert by_id["sciencecasts-combustion"]["status"] == "transcript_not_verified"
    for name in ("psi-combustion", "sciencecasts-combustion", "apollo-1", "apollo-13"):
        assert not by_id[name]["indexed"]
    assert sum(r["indexed"] for r in by_id.values()) == 6


def test_source_scope_snapshot_and_legacy_column_compatibility(release, tmp_path):
    snapshot = build_snapshot(release)
    assert len(snapshot["tables"]) == 21
    path = tmp_path / "snapshot.json"
    path.write_text(json.dumps(snapshot), encoding="utf-8")
    admitted = snapshot_rows(path)
    assert (
        sum(s["source_scope"] == "challenge" for s in admitted["tables"]["source_document"]) == 10
    )
    legacy = copy.deepcopy(snapshot)
    challenge_ids = {
        s["id"] for s in legacy["tables"]["source_document"] if s["source_scope"] == "challenge"
    }
    legacy["tables"]["source_document"] = [
        s for s in legacy["tables"]["source_document"] if s["id"] not in challenge_ids
    ]
    legacy["tables"]["document_chunk"] = [
        c
        for c in legacy["tables"]["document_chunk"]
        if c["source_document_id"] not in challenge_ids
    ]
    for source in legacy["tables"]["source_document"]:
        source.pop("source_scope")
    legacy["version"] = 1
    path.write_text(json.dumps(legacy), encoding="utf-8")
    assert all(
        s["source_scope"] == "investigation"
        for s in snapshot_rows(path)["tables"]["source_document"]
    )


def test_artifact_tampering_is_rejected_before_export(tmp_path):
    root = tmp_path / "resources"
    shutil.copytree(ROOT, root)
    path = root / "raw/mir-fire.gz"
    path.write_bytes(path.read_bytes() + b"tampered")
    with pytest.raises((ValueError, OSError, EOFError)):
        build_resource_release(root)


def test_redirect_to_another_publisher_does_not_inherit_nasa_text_rights(tmp_path):
    root = tmp_path / "resources"
    shutil.copytree(ROOT, root)
    path = root / "acquisition.json"
    acquisition = json.loads(path.read_text("utf-8"))
    entry = next(a for a in acquisition["artifacts"] if a["id"] == "mir-fire")
    entry["resolvedUrl"] = "https://example.invalid/third-party"
    path.write_text(json.dumps(acquisition), encoding="utf-8")
    release = build_resource_release(root)
    resource = next(r for r in release["resources"] if r["id"] == "mir-fire")
    assert resource["status"] == "rights_pending" and not resource["indexed"]
    assert resource["license"] == "unknown"


def test_article_extraction_excludes_navigation_captions_and_quoted_third_party_text():
    raw = (
        b"<nav><p>Outside navigation with enough text to pass length checks.</p></nav>"
        b"<article><p>NASA article narration with original source context and enough words.</p>"
        b"<figure><p>Third-party caption should never become a source excerpt.</p></figure>"
        b"<blockquote><p>A third-party quotation that should not enter the corpus.</p>"
        b"</blockquote></article>"
    )
    assert article_paragraphs(raw) == [
        "NASA article narration with original source context and enough words."
    ]


def test_extended_registry_preserves_null_ownership_and_explicit_rights(release):
    registry = registry_for(release)
    assert registry["policyVersion"] == CHALLENGE_POLICY_VERSION
    assert sum(s["sourceScope"] == "challenge" for s in registry["sources"].values()) == 10
    for chunk in registry["chunks"].values():
        source = registry["sources"][chunk["sourceId"]]
        assert source["status"] == "source_checked"
        assert source["license"] != "unknown"
