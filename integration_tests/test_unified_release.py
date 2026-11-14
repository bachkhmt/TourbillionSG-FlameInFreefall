"""Acceptance for the coverage (v2) and unified releases over official PSI sources only."""

import json
import shutil
from collections import Counter

import pytest

from integrations.nasa_data import coverage, unified
from integrations.nasa_data.challenge import build_challenge_release
from integrations.nasa_data.pilot import digest, uid


@pytest.fixture(scope="module")
def release():
    return coverage.build_coverage_release()


@pytest.fixture(scope="module")
def base():
    return build_challenge_release()


def runs_of(release, slug):
    return [r for r in release["runs"] if r["investigationId"] == slug]


def test_counts_and_challenge_v1_is_unchanged(release, base):
    assert base["stats"]["runs"] == 910 and base["parserVersion"] == "nasa-challenge-v1"
    counts = Counter(r["investigationId"] for r in release["runs"])
    assert counts["cfi-g"] == 179 + 154
    assert counts["spice"] == 469
    assert counts["saffire-i"] == 2
    assert release["stats"]["runs"] == 1535
    assert release["stats"]["sources"] == 68
    assert release["stats"]["independentlyReviewedRuns"] == 0
    assert release["parserVersion"] == "nasa-challenge-v2"
    assert release["revision"] != base["revision"]
    assert coverage.build_coverage_release()["revision"] == release["revision"]


def test_summary_tables_never_become_runs(release):
    for slug in coverage.SUMMARY_TABLES:
        assert not runs_of(release, slug)
        rows = [c for c in release["chunks"] if c["investigationId"] == slug]
        assert any(c["type"] == "configuration" for c in rows)
        assert all(
            "not an individual test run" in c["text"] for c in rows if c["type"] == "configuration"
        )
    efield = [c for c in release["chunks"] if c["investigationId"] == "e-field"]
    continuation = [c for c in efield if "Continuation row without a test day" in c["text"]]
    assert continuation and all("Test Day:" not in c["text"] for c in continuation)


def test_suspect_source_values_are_verbatim(release):
    cld = " ".join(c["text"] for c in release["chunks"] if c["investigationId"] == "cld-flame")
    assert "40% CH5" in cld and "100% C2H11" in cld
    sflame = " ".join(c["text"] for c in release["chunks"] if c["investigationId"] == "s-flame")
    assert "~21% O2 with N3" in sflame


def test_inverse_burner_oxygen_is_not_a_cabin_condition(release):
    inverse = [
        r
        for r in runs_of(release, "cfi-g")
        if r["conditions"].get("flameConfiguration") == "inverse"
    ]
    assert len(inverse) == 154
    for run in inverse:
        assert run["conditions"]["oxygenPct"] is None
        assert run["conditions"]["oxygenContext"] == "burner_oxidizer_stream"
    first = next(r for r in inverse if r["externalRunKey"] == "21196 A2")
    xo2 = next(o for o in first["observations"] if o["name"] == "oxygen_burner_stream_fraction")
    assert xo2["raw"] == "0.21" and xo2["value"] == 0.21
    assert first["conditions"]["pressurePsi"] == pytest.approx(1.10 * 100000 / 6894.757293168)
    normal = [
        r for r in runs_of(release, "cfi-g") if r["conditions"]["flameConfiguration"] == "normal"
    ]
    assert len(normal) == 179


def test_spice_coflow_air_is_apparatus_flow_and_repeats_are_kept(release):
    spice = runs_of(release, "spice")
    assert all(r["conditions"]["airflowCmS"] is None for r in spice)
    assert all(r["conditions"]["flowContext"] == "coflow_burner_air" for r in spice)
    first = [r for r in spice if r["externalRunKey"] == "SPICE day 45 14:37:08"]
    assert len(first) == 2 and len({r["id"] for r in first}) == 2
    assert all(any("Identical row" in i for i in r["issues"]) for r in first)
    air = next(o for o in first[0]["observations"] if o["name"] == "coflow_air_velocity")
    assert air["raw"] == "36.39" and air["unit"] == "cm/s"


def test_saffire_i_samples_and_notes(release):
    records = {r["externalRunKey"]: r for r in runs_of(release, "saffire-i")}
    assert set(records) == {"S1", "S2"}
    assert records["S1"]["conditions"]["airflowCmS"] == 20
    assert records["S1"]["conditions"]["oxygenPct"] is None
    assert records["S2"]["raw"]["Percent O2"] == "~ 21.5"
    assert "Sample Thickness (cm): 0.37" in records["S1"]["sampleGeometry"]
    notes = [
        c
        for c in release["chunks"]
        if c["investigationId"] == "saffire-i" and c["type"] == "configuration"
    ]
    assert len(notes) == 2


def test_chunk_hygiene(release):
    chunks = release["chunks"]
    assert len({c["id"] for c in chunks}) == len(chunks)
    assert all(c["sourceId"] and c["locator"] for c in chunks)
    assert max(len(c["text"]) for c in chunks) <= 925
    prose = [c for c in chunks if c["type"] in {"passage", "metadata_context"}]
    assert all(len(c["text"]) >= 60 for c in prose)
    split = [c for c in chunks if c["type"] == "metadata_context" and "; sentence" in c["locator"]]
    assert split and all(c["locator"].startswith("JSON /") for c in split)
    packed = [c for c in chunks if c["locator"].startswith("paragraphs ")]
    assert packed
    sources = {s["id"]: s for s in release["sources"]}
    for c in packed:
        assert sources[c["sourceId"]]["filename"].endswith(".docx")


def test_unknown_rights_still_fail_closed(release):
    flame_design = {s["id"] for s in release["sources"] if s["investigationId"] == "flame-design"}
    assert not any(c["sourceId"] in flame_design for c in release["chunks"])
    assert not runs_of(release, "flame-design")


def test_identities_follow_final_revision(release):
    for run in release["runs"]:
        assert run["id"] == uid(
            f"run:{release['revision']}:{run['sourceId']}:{run['rowNumber']}:{run['externalRunKey']}"
        )
    assert set(release["telemetry"]) == set(release["telemetryChannels"])
    flex7 = next(r for r in runs_of(release, "flex") if r["externalRunKey"] == "FLEX-007")
    assert set(release["telemetry"]) == {flex7["id"]}
    for source in release["sources"]:
        assert digest(release["_artifacts"][source["sha256"]]) == source["sha256"]


def test_tampered_coverage_source_is_rejected(tmp_path):
    copied = tmp_path / "research"
    shutil.copytree(coverage.RESEARCH_ROOT, copied)
    manifest = json.loads((copied / "evidence/artifacts.json").read_text())
    entry = next(
        a for a in manifest["artifacts"] if a["file_name"] == coverage.RECORD_TABLES["spice"]
    )
    path = copied / entry["local_path"]
    path.write_bytes(path.read_bytes() + b"\n")
    with pytest.raises(ValueError, match="hash/size"):
        coverage.build_coverage_release(copied)


def test_coverage_table_cannot_move_to_another_study(tmp_path):
    copied = tmp_path / "research"
    shutil.copytree(coverage.RESEARCH_ROOT, copied)
    manifest_path = copied / "evidence/artifacts.json"
    manifest = json.loads(manifest_path.read_text())
    entry = next(
        a for a in manifest["artifacts"] if a["file_name"] == coverage.SUMMARY_TABLES["slice"]
    )
    entry["accession"] = "PSI-107"
    manifest_path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match="identity"):
        coverage.build_coverage_release(copied)


def test_sentence_windows_overlap_and_respect_limit():
    text = " ".join(f"Sentence number {i} is here." for i in range(1, 40))
    windows = coverage._sentence_windows(text, 120)
    assert all(len(body) <= 120 for _, _, body in windows)
    assert windows[0][0] == 1 and windows[-1][1] == 39
    for (_, end, _), (start, _, _) in zip(windows, windows[1:], strict=False):
        assert start == end


def test_coverage_report_counts_every_chunk(release):
    report = coverage.coverage_report(release)
    assert sum(report["chunksByType"].values()) == len(release["chunks"])
    assert sum(report["chunksByStudy"].values()) == len(release["chunks"])
    assert report["chunksWithoutLocator"] == 0
    assert report["chunkLength"]["max"] <= 925
    assert report["studiesWithoutChunks"] == ["flame-design"]


NEW_STUDIES = {
    "daft",
    "spice-analysis",
    "bass-flame-spread-model",
    "same-smoke-model",
    "cool-flame-cfd",
    "cool-flame-counterflow",
}


def test_additional_psi_studies_are_context_only_and_labelled(release):
    studies = {s["id"]: s for s in release["investigations"]}
    assert release["stats"]["investigations"] == 24
    assert NEW_STUDIES <= set(studies)
    for slug in NEW_STUDIES:
        study = studies[slug]
        assert study["license"] == "CC0-1.0" and study["doi"]
        assert study["runCount"] == 0 and study["coverage"] == "metadata_only"
        assert study["objectives"] and study["pillars"]
        assert study["metadataSourceId"] == study["contextSourceId"]
        chunks = [c for c in release["chunks"] if c["investigationId"] == slug]
        assert chunks and all(c["type"] == "metadata_context" for c in chunks)
        assert all(c["locator"].startswith("JSON /") for c in chunks)
        if study["projectType"] == "Ground Investigation":
            assert any("not new flight measurements" in x for x in study["limitations"])
    assert studies["daft"]["projectType"] == "Microgravity Investigation"
    assert studies["spice-analysis"]["relatedInvestigations"] == ["spice"]


def test_additional_context_tamper_is_rejected(tmp_path):
    copied = tmp_path / "extra"
    shutil.copytree(coverage.EXTRA_ROOT, copied)
    manifest = json.loads((copied / "context-manifest.json").read_text())
    path = copied / manifest["artifacts"][0]["local_path"]
    path.write_bytes(path.read_bytes() + b"\0")
    with pytest.raises(ValueError, match="hash/size"):
        coverage.build_coverage_release(extra_root=copied)


def test_official_sources_only(release):
    assert not any("ntrs.nasa.gov" in s["sourceUrl"] for s in release["sources"])
    assert not any(c["type"] == "publication_finding" for c in release["chunks"])


# --- Unified release: PSI-20 ACME Chamber Calculator and PSI-39 CFI spreadsheet --------


@pytest.fixture(scope="module")
def full():
    return unified.build_unified_release()


def test_unified_counts_and_layering(full, release):
    counts = Counter(r["investigationId"] for r in full["runs"])
    assert counts["bre"] == 92 + 151
    assert counts["cfi"] == 87 + 148
    assert len({r["externalRunKey"] for r in runs_of(full, "cfi")}) == 227
    assert full["stats"] == {
        "investigations": 24,
        "runs": 1926,
        "sources": 71,
        "chunks": 2508,
        "independentlyReviewedRuns": 0,
        "telemetrySeries": 2,
    }
    assert full["parserVersion"] == "nasa-unified-v1"
    assert full["revision"] != release["revision"]
    assert unified.build_unified_release()["revision"] == full["revision"]
    assert release["stats"]["runs"] == 1535  # coverage release is unchanged


def test_bre_calculator_values_never_become_conditions(full):
    bre = runs_of(full, "bre")
    assert all(r["recordKind"] == "chamber_test_point" for r in bre)
    assert all(r["conditions"]["oxygenPct"] is None for r in bre)
    first = next(r for r in bre if r["externalRunKey"] == "19039A1")
    assert first["conditions"]["pressurePsi"] == 14.67
    assert first["conditions"]["material"] == "Ethylene"
    obs = {o["name"]: o for o in first["observations"]}
    assert obs["ignite_decision"]["raw"] == "Yes" and obs["ignite_decision"]["value"] is None
    assert obs["chamber_pressure_start"]["status"] == "source_checked"
    o2 = obs["finish_mixture_o2_calculator"]
    assert o2["status"] == "needs_review" and o2["raw"] == "0.38935824731269136"
    assert o2["locator"] == "xlsx 'EventData'!BX14"
    assert obs["burn_fraction_calculator"]["status"] == "needs_review"
    assert any("not measurements" in i for i in first["issues"])


def test_bre_no_ignition_and_unmatched_days_are_kept_and_flagged(full):
    bre = runs_of(full, "bre")
    decisions = Counter(
        next(o["raw"] for o in r["observations"] if o["name"] == "ignite_decision") for r in bre
    )
    assert decisions == {"Yes": 196, "No": 47}
    flagged = [r for r in bre if any("BRE day-summary" in i for i in r["issues"])]
    assert flagged and len(flagged) < len(bre)
    h2 = next(r for r in bre if r["externalRunKey"] == "20204MFCA3_01-19")
    assert h2 in flagged and h2["conditions"]["material"] == "Hydrogen / Helium (45/55)"


def test_cfi_spreadsheet_links_both_sources_without_choosing(full):
    cfi = runs_of(full, "cfi")
    sheet = next(s for s in full["sources"] if s["filename"] == unified.CFI_SPREADSHEET)
    csv_rows = [r for r in cfi if r["sourceId"] != sheet["id"]]
    assert len(csv_rows) == 87
    assert all(any("CFI Data Summary Spreadsheet" in i for i in r["issues"]) for r in csv_rows)
    assert not any("Source difference" in i for r in cfi for i in r["issues"])
    first = next(r for r in cfi if r["externalRunKey"] == "1206")
    d0 = next(o for o in first["observations"] if o["name"] == "cfi_summary_d0_mm")
    assert d0["value"] == pytest.approx(4.039) and d0["unit"] == "mm"
    assert d0["sourceId"] == sheet["id"] and d0["locator"] == "xlsx 'DATA'!B2"
    ratio = next(o for o in first["observations"] if o["name"] == "cfi_summary_rad_ratio")
    assert ratio["status"] == "needs_review"  # formula cell, undeclared unit
    new = [r for r in cfi if r["sourceId"] == sheet["id"]]
    assert len(new) == 148 and all(r["conditions"]["oxygenPct"] is None for r in new)


def test_xlsx_locators_point_at_real_cells(full):
    from integrations.nasa_data.xlsx import read_workbook

    sources = {s["id"]: s for s in full["sources"]}
    books = {}
    checked = 0
    for run in runs_of(full, "bre") + runs_of(full, "cfi"):
        for obs in run["observations"]:
            if not obs["locator"].startswith("xlsx "):
                continue
            src = sources[obs["sourceId"]]
            if src["id"] not in books:
                books[src["id"]] = {
                    (name, c.ref): c
                    for name, cells in read_workbook(full["_artifacts"][src["sha256"]]).items()
                    for c in cells
                }
            sheet, ref = obs["locator"][6:].rsplit("!", 1)
            cell = books[src["id"]][(sheet.strip("'"), ref)]
            assert (cell.value or "") == obs["raw"]
            checked += 1
    assert checked > 5000


def test_unified_chunks_stay_within_policy(full):
    report = coverage.coverage_report(full)
    assert report["chunksWithoutLocator"] == 0
    assert report["chunkLength"]["max"] <= 925
    assert report["studiesWithoutChunks"] == ["flame-design"]
    assert len({c["id"] for c in full["chunks"]}) == len(full["chunks"])


def test_tampered_psi_workbook_is_rejected(tmp_path):
    copied = tmp_path / "psi-files"
    shutil.copytree(unified.PSI_FILES_ROOT, copied)
    target = copied / "files" / unified.CFI_SPREADSHEET
    target.write_bytes(target.read_bytes() + b"\0")
    with pytest.raises(ValueError, match="hash/size"):
        unified.build_unified_release(psi_files_root=copied)


def test_psi_workbook_cannot_move_to_another_study(tmp_path):
    copied = tmp_path / "psi-files"
    shutil.copytree(unified.PSI_FILES_ROOT, copied)
    path = copied / "psi-files-manifest.json"
    manifest = json.loads(path.read_text())
    entry = next(a for a in manifest["artifacts"] if a["file_name"] == unified.CFI_SPREADSHEET)
    entry["accession"] = "PSI-20"
    path.write_text(json.dumps(manifest))
    with pytest.raises(ValueError, match="identity"):
        unified.build_unified_release(psi_files_root=copied)
