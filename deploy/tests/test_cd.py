"""Regression coverage for component selection, collection binding and rollback."""

import hashlib
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace

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


def test_config_activation_rejects_another_database_before_connecting(tmp_path):
    config = tmp_path / "production.json"
    config.write_text(json.dumps({"collection": {"target": {"database": "other"}}}))
    args = SimpleNamespace(
        activate_config=config,
        host="server",
        port=5432,
        database="flameguard",
        reader_role="reader",
    )
    with pytest.raises(ValueError, match="another database or reader"):
        importer.deployment_config(args)


def test_config_activation_publishes_the_verified_snapshot_binding(tmp_path):
    snapshot = {"collectionId": "real", "tables": {"tag": [{"id": "new-tag"}]}}
    (tmp_path / "snapshot.json").write_text(json.dumps(snapshot))
    path = tmp_path / "production.json"
    config = {"backend": {"app": "existing-api"}, "collection": {"target": {}}}
    path.write_text(json.dumps(config))
    target = {"databaseOid": 24764, "database": "flameguard"}
    importer.activate_config(path, config, tmp_path, {"target": target}, {"revision": "source-v1"})
    actual = json.loads(path.read_text())
    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    assert actual["collection"] == {
        "sourceRevision": "source-v1",
        "snapshotContentSha256": hashlib.sha256(canonical.encode()).hexdigest(),
        "target": target,
    }
    assert actual["backend"] == {"app": "existing-api"}


def test_failed_atomic_config_publish_preserves_previous_binding(tmp_path, monkeypatch):
    (tmp_path / "snapshot.json").write_text("{}")
    path = tmp_path / "production.json"
    path.write_text('{"previous": true}')

    def fail(*_):
        raise OSError("Cannot replace config")

    monkeypatch.setattr(importer.os, "replace", fail)
    with pytest.raises(OSError, match="Cannot replace config"):
        importer.activate_config(path, {}, tmp_path, {"target": {}}, {"revision": "v2"})
    assert json.loads(path.read_text()) == {"previous": True}


@pytest.mark.parametrize("component", ["backend", "frontend"])
def test_smoke_requires_new_navigation_endpoints(component, monkeypatch):
    urls = []

    def request(url, payload=None):
        urls.append(url)
        if url.endswith("/ready"):
            return {"database": "ok"}
        if url.endswith("/investigations?limit=1"):
            return {"total": 24, "items": [{"id": "study-id"}], "context": {"origin": "real"}}
        if url.endswith("/catalog/descriptive"):
            return {"recordCount": 1926}
        if url.endswith("/overview"):
            return {"passages": [{"text": "Source passage"}]}
        if url.endswith("/chat/readiness"):
            return {"state": "ready", "source_revision": "v1", "passages": 2574}
        if url.endswith("/mission/research"):
            return {"rows": [1], "citations": [1]}
        return "FlameGuard"

    monkeypatch.setattr(release, "request", request)
    config = {component: {"url": "https://app"}, "collection": {"sourceRevision": "v1"}}
    release.check_deployment(config, component)
    prefix = "/api/v1" if component == "backend" else "/api/proxy/api/v1"
    assert "https://app" + prefix + "/catalog/descriptive" in urls
    assert "https://app" + prefix + "/investigations/study-id/overview" in urls
