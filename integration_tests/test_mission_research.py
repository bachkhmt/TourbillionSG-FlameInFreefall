"""Research screening behavior; synthetic fixtures never establish science validation."""

from copy import deepcopy

import pytest
from app.schemas.mission_research import ResearchBriefInput
from app.services.mission_research import build_research_brief
from pydantic import ValidationError

from integrations.nasa_data.challenge import build_challenge_release
from integrations.nasa_data.pilot import build_pilot


def run(key, **conditions):
    return {
        "id": key,
        "investigationId": "synthetic",
        "externalRunKey": key,
        "conditions": {
            "oxygenPct": None,
            "oxygenBasis": "volume_percent",
            "pressurePsi": None,
            "airflowCmS": None,
            "gravityRegime": "unknown",
            "material": "PMMA",
            **conditions,
        },
        "issues": [],
    }


TARGET = dict(
    oxygenPct=21,
    oxygenBasis="volume_percent",
    pressurePsi=14.7,
    gravityG=0,
    airflowCmS=5,
    material="PMMA",
)


def request(**changes):
    return ResearchBriefInput(
        workflowId="detection", question="TEST ONLY research question", **changes
    )


def synthetic(*records):
    source = dict(
        id="doc",
        investigationId="synthetic",
        filename="TEST_ONLY.csv",
        sha256="a" * 64,
        fileVersion=1,
        studyVersion=1,
        sourceUrl="https://example.org/test",
        license="CC0-1.0",
        kind="configuration_table",
        byteCount=1,
        status="TEST_ONLY",
    )
    for index, record in enumerate(records, 2):
        record.update(sourceId="doc", rowNumber=index, observations=[])
        record["conditions"].update(sourceId="doc", locator=f"CSV row {index}")
        record["conditions"].setdefault("gravitySourceId", "doc")
    return {
        "revision": "TEST_ONLY_RELEASE",
        "sources": [source],
        "investigations": [
            {
                "id": "synthetic",
                "code": "TEST ONLY",
                "title": "TEST ONLY detection",
                "psiId": "TEST_ONLY_PSI",
                "metadataSourceId": "doc",
                "pillars": ["detection"],
                "classification": {
                    "evidence": [
                        {
                            "text": "TEST ONLY detection context",
                            "sourceId": "doc",
                            "locator": "CSV heading",
                        }
                    ]
                },
            }
        ],
        "runs": list(records),
    }


@pytest.fixture(scope="module")
def official():
    return build_challenge_release()


@pytest.mark.parametrize(
    "scenario",
    [
        {},
        {"oxygenPct": 21},
        {**TARGET, "material": " "},
        {**TARGET, "gravityG": None},
        {**TARGET, "oxygenPct": 101},
        {**TARGET, "pressurePsi": 0},
        {**TARGET, "pillar": "all"},
        {**TARGET, "revision": "nested"},
        {**TARGET, "airflowCmS": float("inf")},
    ],
)
def test_explicit_scenario_rejects_partial_invalid_or_nested_authority(scenario):
    with pytest.raises(ValidationError):
        request(scenario=scenario)


def test_no_scenario_never_invents_defaults_or_selects_an_example_record():
    brief = build_research_brief(synthetic(run("r", **TARGET)), request())
    row = brief.rows[0]
    assert brief.scenario is None and row.conditionStatus == "not_requested"
    assert row.dimensions == [] and row.record is None
    assert row.availability.independentlyReviewedRecords is None


def test_condition_coverage_cannot_merge_two_records():
    first = run("a", oxygenPct=21, pressurePsi=None)
    second = run("b", oxygenPct=None, pressurePsi=14.7)
    brief = build_research_brief(synthetic(first, second), request(scenario=TARGET))
    row = brief.rows[0]
    assert row.record.id in {"a", "b"} and row.conditionStatus == "partial"
    dims = {d.dimension: d for d in row.dimensions}
    assert (dims["oxygen"].status, dims["pressure"].status) in {
        ("match", "unknown"),
        ("unknown", "match"),
    }
    record_citation = next(c for c in brief.citations if c.id == row.record.citationId)
    assert record_citation.locator == ("CSV row 2" if row.record.id == "a" else "CSV row 3")


@pytest.mark.parametrize(
    "changes,dimension,expected",
    [
        ({"oxygenBasis": "mole_percent"}, "oxygen", "unknown"),
        ({"oxygenContext": "burner"}, "oxygen", "unknown"),
        ({"flowContext": "aerosol_inlet"}, "airflow", "unknown"),
        ({"conflictedFields": ["oxygenPct"]}, "oxygen", "unknown"),
        ({"gravityG": None, "gravityRegime": "microgravity"}, "gravity", "related"),
    ],
)
def test_basis_apparatus_conflicts_and_related_regime_are_not_exact(changes, dimension, expected):
    record = run("r", **{**TARGET, **changes})
    brief = build_research_brief(synthetic(record), request(scenario=TARGET))
    row = brief.rows[0]
    assert next(d.status for d in row.dimensions if d.dimension == dimension) == expected
    assert row.conditionStatus == "partial"


def test_lunar_request_does_not_get_measured_partial_gravity_from_a_regime():
    release = synthetic(run("r", gravityRegime="microgravity"))
    brief = build_research_brief(release, request(scenario={**TARGET, "gravityG": 0.16}))
    dim = next(d for d in brief.rows[0].dimensions if d.dimension == "gravity")
    assert dim.status == "mismatch" and dim.observed is None


def test_unknown_rights_and_cross_study_sources_are_excluded_from_evidence():
    release = synthetic(run("r", **TARGET))
    release["sources"].extend(
        [
            {**release["sources"][0], "id": "restricted", "license": "unknown"},
            {**release["sources"][0], "id": "other", "investigationId": "other"},
        ]
    )
    release["investigations"][0]["summary"] = [
        {"text": "MUST NOT QUOTE", "sourceId": "restricted", "locator": "secret"},
        {"text": "WRONG STUDY", "sourceId": "other", "locator": "other"},
    ]
    release["runs"][0]["sourceId"] = "restricted"
    brief = build_research_brief(release, request(scenario=TARGET))
    row = brief.rows[0]
    assert row.conditionStatus == "no_records" and row.dimensions == []
    assert row.availability.excludedRecords == 1 and row.availability.records == 0
    assert {c.source.id for c in brief.citations} == {"doc"}
    assert "MUST NOT QUOTE" not in brief.model_dump_json()
    assert "WRONG STUDY" not in brief.model_dump_json()


def test_observations_keep_multiple_original_sources_conflicting_raw_values_and_flags():
    release = synthetic(run("r", **TARGET))
    release["sources"].append({**release["sources"][0], "id": "sheet", "filename": "TEST_SHEET"})
    release["runs"][0]["observations"] = [
        dict(
            name="diameter",
            raw=raw,
            value=value,
            unit="mm",
            originalUnit="mm",
            sourceId=source,
            locator="D0 cell",
            status="conflict",
        )
        for source, raw, value in [("doc", "1.87", 1.87), ("sheet", "1.82", None)]
    ]
    brief = build_research_brief(release, request(scenario=TARGET))
    observations = brief.rows[0].record.observations
    assert [(o.raw, o.value, o.status) for o in observations] == [
        ("1.87", 1.87, "conflict"),
        ("1.82", None, "conflict"),
    ]
    citations = {c.id: c for c in brief.citations}
    assert {citations[o.citationId].source.id for o in observations} == {"doc", "sheet"}


def test_ordering_is_deterministic_and_free_text_does_not_silently_change_selection():
    release = synthetic(run("r", **TARGET))
    other = {**deepcopy(release["investigations"][0]), "id": "a-study", "code": "TEST A"}
    release["investigations"].append(other)
    first = build_research_brief(release, request())
    changed = ResearchBriefInput(workflowId="detection", question="Another arbitrary question")
    second = build_research_brief(release, changed)
    assert [r.investigationId for r in first.rows] == ["a-study", "synthetic"]
    assert first.rows == second.rows
    with_conditions = build_research_brief(release, request(scenario=TARGET))
    assert with_conditions.rows[0].investigationId == "synthetic"
    assert with_conditions.rows[0].conditionStatus == "exact"


def test_official_detection_brief_preserves_same_configuration_and_same_r_unknown_gravity(official):
    brief = build_research_brief(official, request(scenario=TARGET))
    rows = {r.investigationId: r for r in brief.rows}
    assert rows["same"].conditionStatus == "no_records"
    assert rows["same"].availability.documents > 0
    assert (
        next(d.status for d in rows["same-r"].dimensions if d.dimension == "gravity") == "unknown"
    )
    assert all(r.availability.independentlyReviewedRecords == 0 for r in brief.rows)
    assert all(
        c.source.license == "CC0-1.0" and len(c.source.sha256) == 64 for c in brief.citations
    )
    assert "confidence" not in brief.model_dump() and "riskScore" not in brief.model_dump()


def test_historical_release_has_no_fabricated_purpose_classification():
    brief = build_research_brief(build_pilot(), request())
    assert brief.rows == [] and brief.citations == []
    assert "No studies" in brief.nextSteps[0]


@pytest.mark.parametrize("field", ["sourceId", "gravitySourceId"])
def test_unadmitted_condition_provenance_cannot_borrow_primary_record_source(field):
    release = synthetic(run("r", **TARGET))
    release["runs"][0]["conditions"][field] = "missing-source"
    row = build_research_brief(release, request(scenario=TARGET)).rows[0]
    affected = [
        d for d in row.dimensions if (d.dimension == "gravity") == (field == "gravitySourceId")
    ]
    assert affected and all(d.status == "unknown" and d.citationId is None for d in affected)
