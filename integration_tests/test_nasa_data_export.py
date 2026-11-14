"""Acceptance checks for the offline NASA data adapter (no network, no database)."""

import hashlib
import json

# Default "unified" release: official resources only (PSI files + PSI metadata).
# See docs/DATA_HANDOFF.md.
UNIFIED_PARSER = "nasa-challenge-resources-v1"
UNIFIED = {"studies": 24, "runs": 1926, "sources": 81, "chunks": 2574}


def test_real_snapshot_preserves_sources_and_originals(tmp_path):
    from app.services.demo_manifest import snapshot_rows

    from integrations.nasa_data.export import export_bundle

    result = export_bundle(tmp_path / "bundle")
    snapshot = snapshot_rows(result / "snapshot.json")
    payload = json.loads((result / "release.json").read_text())
    stats = payload["stats"]
    assert payload["parserVersion"] == UNIFIED_PARSER
    assert len(snapshot["tables"]) == 21
    assert "dataset_release" not in snapshot["tables"]
    assert len(snapshot["tables"]["investigation"]) == stats["investigations"] == UNIFIED["studies"]
    assert len(snapshot["tables"]["test_run"]) == stats["runs"] == UNIFIED["runs"]
    assert len(snapshot["tables"]["source_document"]) == stats["sources"] == UNIFIED["sources"]
    assert len(snapshot["tables"]["document_chunk"]) == stats["chunks"] == UNIFIED["chunks"]
    assert all(
        s["license"] != "unknown" or s["investigationId"] in {"flame-design", None}
        for s in payload["sources"]
    )
    assert not any(s["sourceUrl"].startswith("https://ntrs.nasa.gov") for s in payload["sources"])
    assert snapshot["origin"] == "real"
    assert payload["stats"]["independentlyReviewedRuns"] == 0
    for source in payload["sources"]:
        artifact = result / "artifacts" / source["sha256"]
        assert artifact.is_file()
        assert hashlib.sha256(artifact.read_bytes()).hexdigest() == source["sha256"]
    assert any(o["value"] is None for r in payload["runs"] for o in r["observations"])
    assert any(r["raw"] for r in payload["runs"])
    assert not snapshot["tables"]["model_version"]
    assert not snapshot["tables"]["evidence_claim"]


def test_export_refuses_existing_destination(tmp_path):
    import pytest

    from integrations.nasa_data.export import export_bundle

    (tmp_path / "taken").mkdir()
    with pytest.raises(ValueError):
        export_bundle(tmp_path / "taken")


def test_challenge_v1_profile_is_still_reproducible(tmp_path):
    from app.services.demo_manifest import snapshot_rows

    from integrations.nasa_data.export import export_bundle

    result = export_bundle(tmp_path / "v1", profile="challenge")
    snapshot = snapshot_rows(result / "snapshot.json")
    payload = json.loads((result / "release.json").read_text())
    assert payload["revision"] == "91e411265adf5c8e801d3d8e83b633631631d2c17739d2ca2c1cd98a65d31c9f"
    assert len(snapshot["tables"]["test_run"]) == 910
    assert len(snapshot["tables"]["document_chunk"]) == 1045
