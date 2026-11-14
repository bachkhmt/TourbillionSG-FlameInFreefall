from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.evidence import SourceDocumentCreate


def test_source_ownership_requires_an_explicit_consistent_scope():
    base = dict(
        source_url="https://www.nasa.gov/history/",
        document_type="case_study",
        ingestion_status="linked",
    )
    challenge = SourceDocumentCreate(**base, source_scope="challenge")
    assert challenge.investigation_id is None
    assert SourceDocumentCreate(**base, investigation_id=uuid4()).source_scope == "investigation"
    for changes in (
        {},
        {"source_scope": "challenge", "investigation_id": uuid4()},
        {"source_scope": "other"},
    ):
        with pytest.raises(ValidationError):
            SourceDocumentCreate(**base, **changes)


def test_manifest_scope_is_explicit_in_v2_and_malformed_values_are_conflicts(tmp_path):
    import copy
    import json

    from app.services.demo_manifest import DEMO_ROOT, fixture_rows
    from app.services.errors import Phase4Error

    original = json.loads((DEMO_ROOT / "phase4-v1.json").read_text("utf-8"))
    path = tmp_path / "scope.json"
    for bad in (None, [], {}, "other", "challenge"):
        document = copy.deepcopy(original)
        document["tables"]["source_document"][0]["source_scope"] = bad
        path.write_text(json.dumps(document), encoding="utf-8")
        with pytest.raises(Phase4Error, match="DATASET_CONFLICT"):
            fixture_rows(path)
    original["version"] = 2
    path.write_text(json.dumps(original), encoding="utf-8")
    with pytest.raises(Phase4Error, match="DATASET_CONFLICT"):
        fixture_rows(path)
