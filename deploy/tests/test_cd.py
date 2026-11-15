"""Regression coverage for component selection, collection binding and rollback."""

import hashlib
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


def load_script(name):
    spec = importlib.util.spec_from_file_location(
        name.replace("-", "_"), ROOT / "deploy/azure" / name
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


release = load_script("release.py")
prepare = load_script("prepare-bundle.py")
importer = load_script("import-nasa.py")


@pytest.mark.parametrize(
    "paths, expected",
    [
        (["FlameInFreewall_Tourbillion/src/app/page.tsx"], {"frontend"}),
        (["flameguard-ai-backend/app/main.py"], {"backend"}),
        (["integrations/nasa_data/export.py"], {"backend"}),
        (["deploy/azure/production.json"], {"backend", "frontend"}),
        ([".github/workflows/deploy.yml"], {"backend", "frontend"}),
        (["README.md"], set()),
    ],
)
def test_component_selection(paths, expected):
    assert release.changed_components(paths) == expected


def test_manual_deploy_selects_both_components():
    assert release.event_changes({}, "workflow_dispatch") == {"backend", "frontend"}


def test_rollout_restores_previous_image_after_failed_checks(monkeypatch):
    images = iter(["registry/api:old", "registry/api:new"])
    monkeypatch.setattr(release, "current_image", lambda *_: next(images))
    updates = []
    monkeypatch.setattr(release, "update_image", lambda _c, _s, image: updates.append(image))

    def fail(*_):
        raise RuntimeError("Failed smoke check")

    monkeypatch.setattr(release, "smoke", fail)
    with pytest.raises(RuntimeError, match="Failed smoke check"):
        release.rollout({}, "backend", "registry/api:new")
    assert updates == ["registry/api:new", "registry/api:old"]


def test_rollout_preserves_a_concurrent_deployment(monkeypatch):
    images = iter(["registry/api:old", "registry/api:another-release"])
    monkeypatch.setattr(release, "current_image", lambda *_: next(images))
    updates = []
    monkeypatch.setattr(release, "update_image", lambda _c, _s, image: updates.append(image))

    def fail(*_):
        raise RuntimeError("Failed smoke check")

    monkeypatch.setattr(release, "smoke", fail)
    with pytest.raises(RuntimeError):
        release.rollout({}, "backend", "registry/api:new")
    assert updates == ["registry/api:new"]


def test_binding_rejects_a_changed_snapshot_before_publishing(tmp_path):
    (tmp_path / "release.json").write_text(json.dumps({"revision": "source-v1"}))
    (tmp_path / "snapshot.json").write_text(json.dumps({"collectionId": "changed"}))
    collection = {"sourceRevision": "source-v1", "snapshotContentSha256": "0" * 64}
    with pytest.raises(ValueError, match="differs from the imported Azure collection"):
        prepare.bind_collection(tmp_path, collection)
    assert not (tmp_path / "collection.json").exists()


def test_binding_preserves_database_identity_and_review_state(tmp_path, monkeypatch):
    snapshot = {"collectionId": "collection-v1"}
    (tmp_path / "release.json").write_text(json.dumps({"revision": "source-v1"}))
    (tmp_path / "snapshot.json").write_text(json.dumps(snapshot))
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    target = {"database": "flameguard", "databaseOid": 24764, "readRole": "reader"}
    collection = {
        "sourceRevision": "source-v1",
        "snapshotContentSha256": hashlib.sha256(canonical.encode()).hexdigest(),
        "target": target,
    }
    monkeypatch.setattr(prepare, "write_corpus_policy", lambda *_: None)
    manifest = prepare.bind_collection(tmp_path, collection)
    result = json.loads(manifest.read_text("utf-8"))
    assert result["target"] == target
    assert result["reviewState"] == "unreviewed"


def test_importer_publishes_mission_release_with_the_manifest(tmp_path, monkeypatch):
    (tmp_path / "snapshot.json").write_text("{}")

    def policy(manifest, _release):
        assert (manifest.parent / "snapshot.json").read_text() == "{}"
        (manifest.parent / "corpus-registry.json").write_text("{}")
        (manifest.parent / "mission-release.json").write_text('{"revision":"source-v1"}')

    monkeypatch.setattr(importer, "write_corpus_policy", policy)
    importer.write_manifest(tmp_path, {"snapshot": "snapshot.json"}, {})
    assert (tmp_path / "collection.json").exists()
    assert json.loads((tmp_path / "mission-release.json").read_text())["revision"] == "source-v1"
