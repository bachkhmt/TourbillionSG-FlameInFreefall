"""Coverage release layered on ``nasa-challenge-v1`` without changing it.

Adds source tables that were already downloaded and hash-recorded in the
November 10 snapshot but not parsed, and repacks retrieval chunks so that very
short DOCX fragments and very long PSI context fields do not dominate RAG.

Semantics follow ``evidence/quality-findings.md``: day-summary rows stay
configuration evidence (no invented runs, no forward-fill), burner oxidizer
streams and coflow air are apparatus quantities rather than cabin conditions,
and source text/values are retained verbatim. ``build_challenge_release()`` and
``build_pilot()`` remain reproducible inputs.
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

from .challenge import (
    CONTEXT_ROOT,
    POLICY_VERSION,
    _rows,
    build_challenge_release,
    plain_text,
)
from .pilot import RESEARCH_ROOT, SLUGS, decode, digest, document_text, number, uid

PARSER_VERSION = "nasa-challenge-v2"


def split_sentences(text: str) -> list[str]:
    """Same rule as the NASA reference ragkit: split after . ! ? or ellipsis."""
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


CHUNK_POLICY = {"version": "chunk-pack-v1", "maxChars": 900, "docxMinChars": 120}

RECORD_TABLES = {
    "cfi-g": "PSI-159_Experimental table_CFI-G_Inverse Flames.csv",
    "spice": "PSI-107_Experimental table_Spice.csv",
    "saffire-i": "PSI-98_Experimental table_SAFFIRE-1.csv",
}
SUMMARY_TABLES = {
    "flex-2": "PSI-68_Experimental table_Flex2.csv",
    "slice": "PSI-106_Experimental table_Slice.csv",
    "cld-flame": "PSI-21_Experimental table_CLD Flame.csv",
    "e-field": "PSI-22_Experimental table_ACME E-FIELD Flames.csv",
    "s-flame": "PSI-23_Experimental table_ACME s-Flame.csv",
}
CALIBRATION_FILES = {
    "PSI-69_Calibration_20CAL08_Chamber_Gases.txt": "flex",
    "PSI-69_Calibration_20CAL08_Testpoint_Settings.txt": "flex",
}
DOCUMENTS = {"PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx": "saffire-i"}
EXTRA_ROOT = RESEARCH_ROOT.parent / "nasa-combustion-2026-11-14"
# accession -> (slug, research-navigation pillars, fuel type, related flight studies)
EXTRA_STUDIES = {
    "PSI-47": ("daft", ("detection",), "aerosol", ("same",)),
    "PSI-60": ("spice-analysis", ("detection",), "gas", ("spice",)),
    "PSI-62": ("bass-flame-spread-model", ("prevention",), "solid", ("bass", "bass-ii")),
    "PSI-115": ("same-smoke-model", ("detection",), "aerosol", ("same", "same-r")),
    "PSI-117": ("cool-flame-cfd", ("suppression",), "droplet", ("flex",)),
    "PSI-142": ("cool-flame-counterflow", ("suppression",), "droplet", ("flex",)),
}
STUDY_LIMITATIONS = {
    "cfi-g": "Inverse-flame XO2 is the burner oxidizer stream and Xf the chamber fuel "
    "fraction; neither is a cabin oxygen condition.",
    "spice": "Rows are fuel-rate set points within a flame (shared GMT day/ignition); "
    "coflow air rate is burner apparatus flow, not cabin airflow.",
    "saffire-i": "Percent O2 is approximate/ranged; image sets and diagnostics "
    "figures in the ReadMe are not imported as channels.",
    "flex-2": "The table lists fuels and condition sets/ranges, not individual tests.",
    "slice": "Rows are test-day summaries, not individual flames.",
    "cld-flame": "Rows are test-day summaries. Fuel Bottle values such as 'CH5'…'CH14' "
    "are retained verbatim and are not corrected.",
    "e-field": "Rows are test-day summaries; continuation rows without a test day are "
    "retained as written and are not forward-filled. Mesh voltage is not gravity.",
    "s-flame": "Rows are test-day summaries. Atmosphere values such as 'N3'…'N6' are "
    "retained verbatim and are not corrected; O2 is approximate and drops with vitiation.",
}


def _pack(parts: list[tuple[int, str]], limit: int, sep: str) -> list[tuple[int, int, str]]:
    """Greedy, order-preserving packing of numbered parts into ``limit``-sized windows."""
    packs: list[tuple[int, int, str]] = []
    for n, text in parts:
        if packs and len(packs[-1][2]) + len(sep) + len(text) <= limit:
            first, _, body = packs[-1]
            packs[-1] = (first, n, body + sep + text)
        else:
            packs.append((n, n, text))
    return packs


def _fold_tail(packs: list[tuple[int, int, str]], sep: str) -> list[tuple[int, int, str]]:
    """Fold a trailing fragment into its predecessor rather than leave a tiny chunk."""
    if len(packs) > 1 and len(packs[-1][2]) < CHUNK_POLICY["docxMinChars"]:
        first, _, body = packs[-2]
        packs[-2:] = [(first, packs[-1][1], body + sep + packs[-1][2])]
    return packs


def _sentence_windows(text: str, limit: int) -> list[tuple[int, int, str]]:
    """Sentence windows of at most ``limit`` chars with one sentence of overlap."""
    sentences = split_sentences(text)
    windows, start = [], 0
    while start < len(sentences):
        end, body = start, sentences[start]
        while end + 1 < len(sentences) and len(body) + 1 + len(sentences[end + 1]) <= limit:
            end += 1
            body += " " + sentences[end]
        windows.append((start + 1, end + 1, body))
        if end + 1 >= len(sentences):
            break
        start = end if end > start else end + 1
    return windows


def _span(label: str, first: int, last: int) -> str:
    return f"{label}s {first}–{last}" if first != last else f"{label} {first}"


def build_coverage_release(
    root: Path = RESEARCH_ROOT,
    *,
    context_root: Path = CONTEXT_ROOT,
    extra_root: Path = EXTRA_ROOT,
    parser_version: str = PARSER_VERSION,
) -> dict:
    """Build without database/network access; every admitted byte is hash-checked."""
    release = build_challenge_release(root, context_root=context_root)
    base_revision = release["revision"]
    studies = {s["id"]: s for s in release["investigations"]}
    manifest = json.loads((root / "evidence/artifacts.json").read_text())["artifacts"]
    wanted = {
        **{f: s for s, f in RECORD_TABLES.items()},
        **{f: s for s, f in SUMMARY_TABLES.items()},
        **CALIBRATION_FILES,
        **DOCUMENTS,
    }
    selected = {a["file_name"]: a for a in manifest if a["file_name"] in wanted}
    if set(selected) != set(wanted):
        raise ValueError(f"Missing coverage source manifest entries: {set(wanted) - set(selected)}")

    def source(entry, data, kind):
        if digest(data) != entry["sha256"] or len(data) != entry["downloaded_bytes"]:
            raise ValueError(f"Coverage source hash/size mismatch: {entry['file_name']}")
        slug = SLUGS[entry["accession"]]
        if slug != wanted[entry["file_name"]]:
            raise ValueError(f"Coverage source identity mismatch: {entry['file_name']}")
        if studies[slug]["license"] != "CC0-1.0":
            raise ValueError("Coverage source requires admitted CC0 study rights")
        item = {
            "id": uid(f"source:{entry['accession']}:{entry['file_name']}:{entry['sha256']}"),
            "investigationId": slug,
            "filename": entry["file_name"],
            "sha256": entry["sha256"],
            "fileVersion": entry["file_version"],
            "studyVersion": entry["study_version"],
            "sourceUrl": entry["source_url"],
            "license": "CC0-1.0",
            "rightsScope": "PSI source-specific rights; "
            "linked external publications are not ingested.",
            "kind": kind,
            "byteCount": len(data),
            "status": "source_checked",
            "doi": None,
        }
        release["sources"].append(item)
        release["_artifacts"][item["sha256"]] = data
        return item

    def chunk(src, locator, text, heading, type_):
        release["chunks"].append(
            {
                "id": uid(f"chunk:{src['id']}:{locator}:{digest(text.encode())}"),
                "sourceId": src["id"],
                "investigationId": src["investigationId"],
                "locator": locator,
                "sourceRef": src["sourceUrl"],
                "text": text,
                "heading": heading,
                "type": type_,
                "status": "source_checked",
                "contextual": heading,
            }
        )

    def load(file_name, kind):
        entry = selected[file_name]
        data = (root / entry["local_path"]).read_bytes()
        return source(entry, data, kind), data

    def fields(raw):
        return "; ".join(f"{k}: {v}" for k, v in raw.items() if v)

    def new_run(slug, src, row_number, raw, key, record_kind, **conditions):
        run = {
            "id": "pending-final-revision",
            "investigationId": slug,
            "externalRunKey": key,
            "sourceId": src["id"],
            "rowNumber": row_number,
            "raw": raw,
            "conditions": {
                "oxygenPct": None,
                "oxygenBasis": None,
                "oxygenContext": "unknown",
                "pressurePsi": None,
                "pressureConversion": None,
                "airflowCmS": None,
                "flowContext": "unknown",
                "gravityG": None,
                "gravityRegime": "microgravity",
                "gravitySourceId": studies[slug]["metadataSourceId"],
                "material": "Unknown",
                "sourceId": src["id"],
                "locator": f"CSV row {row_number}",
                **conditions,
            },
            "observations": [],
            "issues": [],
            "status": "source_checked",
            "recordKind": record_kind,
            "sampleGeometry": None,
        }
        release["runs"].append(run)
        return run

    def observe(run, name, header, unit, value=None, *, reviewed=True):
        run["observations"].append(
            {
                "name": name,
                "raw": run["raw"].get(header, ""),
                "value": value,
                "unit": unit if value is not None else None,
                "originalUnit": unit,
                "sourceId": run["sourceId"],
                "locator": f"CSV row {run['rowNumber']}; {header}",
                "status": "source_checked" if reviewed else "needs_review",
            }
        )

    def record_chunk(src, run, slug):
        chunk(
            src,
            f"CSV row {run['rowNumber']}",
            f"{run['externalRunKey']} [{slug}] CSV row {run['rowNumber']}. "
            + "; ".join(f"{k}: {v or 'unknown'}" for k, v in run["raw"].items()),
            f"{run['externalRunKey']} {slug}",
            "test_record",
        )

    # --- Run-level tables -------------------------------------------------------------
    src, data = load(RECORD_TABLES["cfi-g"], "experimental_table")
    rows, src["encoding"] = _rows(data)
    for row_number, raw in rows:
        pressure = number(raw.get("approx p (bar)"))
        run = new_run(
            "cfi-g",
            src,
            row_number,
            raw,
            raw["Test"],
            "test_record",
            material=raw.get("Fuel") or "Unknown",
            oxygenContext="burner_oxidizer_stream",
            flameConfiguration="inverse",
            pressurePsi=float(Decimal(str(pressure)) * Decimal(100000) / Decimal("6894.757293168"))
            if pressure is not None
            else None,
            pressureConversion="bar × 100000 / 6894.757293168 → psia"
            if pressure is not None
            else None,
        )
        observe(run, "oxygen_burner_stream_fraction", "XO2", "mole fraction", number(raw["XO2"]))
        observe(
            run,
            "ambient_fuel_fraction_before",
            "Xf  before test",
            "mole fraction",
            number(raw.get("Xf  before test")),
        )
        observe(
            run,
            "ambient_fuel_fraction_after",
            "Xf  after test",
            "mole fraction",
            number(raw.get("Xf  after test")),
        )
        observe(run, "burn_duration", "burn time (sec)", "s", number(raw.get("burn time (sec)")))
        observe(run, "adiabatic_temperature_model", "Tad (K)", "K", reviewed=False)
        observe(
            run,
            "peak_burner_temperature",
            "Peak burner Temp (C)",
            "°C",
            number(raw.get("Peak burner Temp (C)"), signed=True),
        )
        run["issues"].append(
            "Inverse flame: XO2 is the burner oxidizer stream and Xf the chamber fuel fraction; "
            "no cabin oxygen condition is set. Pressure is approximate. Tad is a model quantity."
        )
        record_chunk(src, run, "cfi-g")

    src, data = load(RECORD_TABLES["spice"], "experimental_table")
    rows, src["encoding"] = _rows(data)
    for row_number, raw in rows:
        key = f"SPICE day {raw['GMT date']} {raw['GMT ignition']}"
        run = new_run(
            "spice",
            src,
            row_number,
            raw,
            key,
            "flame_setpoint",
            material=raw.get("Fuel") or "Unknown",
            flowContext="coflow_burner_air",
        )
        observe(run, "nozzle_diameter", "Nozzle (mm)", "mm", number(raw.get("Nozzle (mm)")))
        observe(
            run,
            "fuel_rate_volumetric",
            "Fuel Rate (sccm)",
            "sccm",
            number(raw.get("Fuel Rate (sccm)")),
        )
        observe(
            run, "fuel_rate_mass", "Fuel Rate (mg/s)", "mg/s", number(raw.get("Fuel Rate (mg/s)"))
        )
        observe(
            run,
            "coflow_air_velocity",
            "Air Rate (cm/s)",
            "cm/s",
            number(raw.get("Air Rate (cm/s)")),
        )
        run["issues"].append(
            "Fuel-rate set point within a flame identified by GMT day/ignition time; "
            "coflow air rate is apparatus flow, not cabin airflow. GMT date is day of year "
            "without a year in this table."
        )
        record_chunk(src, run, "spice")

    src, data = load(RECORD_TABLES["saffire-i"], "experimental_table")
    rows, src["encoding"] = _rows(data)
    for row_number, raw in rows:
        key = raw.get("Sample Number", "")
        if not key.startswith("S"):
            chunk(
                src,
                f"CSV row {row_number}",
                f"saffire-i configuration/source notes row {row_number}. {fields(raw)}",
                f"saffire-i configuration/source notes row {row_number}",
                "configuration",
            )
            continue
        airflow = number(raw.get("Air Flow (cm/s)"))
        run = new_run(
            "saffire-i",
            src,
            row_number,
            raw,
            key,
            "sample_test",
            material=raw.get("Material") or "Unknown",
            flowContext="experiment_duct",
            airflowCmS=airflow,
        )
        dims = ["Sample Thickness (cm)", "Sample Length (cm)", "Sample Width (cm)"]
        run["sampleGeometry"] = "; ".join(f"{d}: {raw[d]}" for d in dims if raw.get(d)) or None
        observe(run, "duct_airflow", "Air Flow (cm/s)", "cm/s", airflow)
        for d in dims:
            observe(
                run,
                "sample_" + d.split(" (")[0].lower().replace(" ", "_"),
                d,
                "cm",
                number(raw.get(d)),
            )
        observe(
            run,
            "oxygen_ambient_approximate",
            "Percent O2",
            "% (basis not declared)",
            reviewed=False,
        )
        observe(
            run, "ignition_power", "Ignition Power (W)", "W", number(raw.get("Ignition Power (W)"))
        )
        observe(
            run, "ignition_time", "Ignition Time (s)", "s", number(raw.get("Ignition Time (s)"))
        )
        observe(run, "burn_duration", "Burn Time (s)", "s", number(raw.get("Burn Time (s)")))
        run["issues"].append(
            "Percent O2 is approximate or a range; no exact ambient O2 condition selected. "
            "Duct airflow is not a vehicle-wide ventilation field."
        )
        record_chunk(src, run, "saffire-i")

    # --- Day/condition summaries: configuration evidence only --------------------------
    for slug, file_name in SUMMARY_TABLES.items():
        src, data = load(file_name, "configuration_table")
        rows, src["encoding"] = _rows(data)
        code = studies[slug]["code"]
        for row_number, raw in rows:
            day = raw.get("Test Day") or raw.get("Test Day*") or raw.get("Test Date")
            note = "" if day or slug == "flex-2" else " Continuation row without a test day."
            chunk(
                src,
                f"CSV row {row_number}",
                f"{code} [{slug}] summary row {row_number} (not an individual test run)."
                f"{note} {fields(raw)}",
                f"{code} {slug} configuration summary row {row_number}",
                "configuration",
            )

    # --- FLEX calibration records and Saffire ReadMe ----------------------------------
    gases, data = load("PSI-69_Calibration_20CAL08_Chamber_Gases.txt", "configuration_table")
    text, gases["encoding"] = decode(data)
    chunk(gases, "file", " ".join(text.split()), "FLEX 20CAL08 chamber gases", "configuration")
    settings, data = load(
        "PSI-69_Calibration_20CAL08_Testpoint_Settings.txt", "configuration_table"
    )
    text, settings["encoding"] = decode(data)
    for row_number, row in enumerate(csv.DictReader(io.StringIO(text, newline=None)), 2):
        pairs = [(i, f"{k}: {v}") for i, (k, v) in enumerate(row.items(), 1) if k and v]
        prefix = "FLEX 20CAL08 test point settings. "
        packs = _fold_tail(_pack(pairs, CHUNK_POLICY["maxChars"] - len(prefix), "; "), "; ")
        for first, last, body in packs:
            chunk(
                settings,
                f"row {row_number}; {_span('field', first, last)}",
                prefix + body,
                "FLEX 20CAL08 test point settings",
                "configuration",
            )
    for file_name in DOCUMENTS:
        doc, data = load(file_name, "source_document")
        for n, para in enumerate(document_text(data), 1):
            chunk(doc, f"paragraph {n}", para, doc["filename"], "passage")

    # --- Additional PSI combustion investigations (metadata/context only) -------------
    extra_manifest = json.loads((extra_root / "context-manifest.json").read_text())["artifacts"]
    if {a["accession"] for a in extra_manifest} != set(EXTRA_STUDIES):
        raise ValueError("Additional study manifest must match EXTRA_STUDIES")
    for entry in extra_manifest:
        slug, pillars, fuel, related = EXTRA_STUDIES[entry["accession"]]
        if slug in studies:
            raise ValueError(f"Additional study slug already exists: {slug}")
        packed_bytes = (extra_root / entry["local_path"]).read_bytes()
        if (
            digest(packed_bytes) != entry["stored_sha256"]
            or len(packed_bytes) != entry["stored_bytes"]
        ):
            raise ValueError(f"Stored context hash/size mismatch: {entry['file_name']}")
        data = gzip.decompress(packed_bytes)
        if digest(data) != entry["sha256"] or len(data) != entry["downloaded_bytes"]:
            raise ValueError(f"Context hash/size mismatch: {entry['file_name']}")
        meta = json.loads(data)
        rights = meta.get("licenseIdentifier") or "unknown"
        if (
            meta["accession"] != entry["accession"]
            or meta["version"] != entry["study_version"]
            or rights != entry["license"]
        ):
            raise ValueError("PSI context identity/version/license mismatch")
        src = {
            "id": uid(f"source:{entry['accession']}:{entry['file_name']}:{entry['sha256']}"),
            "investigationId": slug,
            "filename": entry["file_name"],
            "sha256": entry["sha256"],
            "fileVersion": entry["file_version"],
            "studyVersion": entry["study_version"],
            "sourceUrl": entry["source_url"],
            "license": rights,
            "rightsScope": "PSI source-specific rights; "
            "linked external publications are not ingested.",
            "kind": "psi_metadata",
            "byteCount": len(data),
            "status": "source_checked",
            "doi": meta.get("doi"),
            "contentType": "application/json",
        }
        release["sources"].append(src)
        release["_artifacts"][src["sha256"]] = data
        ground = meta.get("projectType") == "Ground Investigation"
        texts = {
            key: plain_text(meta.get(key) or "")
            for key in ("objective", "approach", "description", "researchImpacts")
        }
        code = meta.get("investigationAcronym") or entry["accession"]
        refs = {
            key: [{"text": text, "sourceId": src["id"], "locator": f"JSON /{key}"}]
            for key, text in texts.items()
            if text
        }
        limitations = [
            "Research-navigation annotations and source transcription "
            "are not independent scientific review.",
            "Metadata/context only: no experimental tables from this study are imported.",
        ]
        if ground:
            limitations.append(
                "Ground investigation: modelling or analysis of existing data "
                f"(related: {', '.join(related)}); not new flight measurements."
            )
        studies[slug] = {
            "id": slug,
            "uuid": uid(entry["accession"]),
            "psiId": entry["accession"],
            "code": code,
            "title": meta["title"],
            "platform": meta.get("flightProgram") or "Not Applicable",
            "hardware": meta.get("experimentHardware") or "",
            "researchArea": meta.get("researchArea"),
            "projectType": meta.get("projectType"),
            "relatedInvestigations": list(related),
            "sourceUrl": entry["landing_url"],
            "metadataSourceId": src["id"],
            "contextSourceId": src["id"],
            "version": meta["version"],
            "license": rights,
            "doi": meta.get("doi"),
            "fuelType": fuel,
            "runCount": 0,
            "coverage": "metadata_only",
            "pillars": list(pillars) if rights == "CC0-1.0" else [],
            "summary": refs.get("description") or refs.get("approach") or [],
            "objectives": refs.get("objective", []),
            "sampleGeometry": None,
            "sensors": [],
            "sensorEvidence": [],
            "geometryEvidence": [],
            "limitations": limitations,
            "classification": {
                "basis": "research_navigation",
                "policyVersion": POLICY_VERSION,
                "evidence": refs.get("objective", [])
                + (refs.get("description") or refs.get("approach") or []),
            },
        }
        release["investigations"].append(studies[slug])
        if rights != "CC0-1.0":
            studies[slug]["summary"] = studies[slug]["objectives"] = []
            studies[slug]["classification"]["evidence"] = []
            studies[slug]["limitations"].append(
                "Current PSI metadata does not declare reusable text rights; not indexed."
            )
            continue
        kind_label = "ground investigation" if ground else "PSI research context"
        for key, text in texts.items():
            if text:
                chunk(
                    src,
                    f"JSON /{key}",
                    text,
                    f"{code} · {key} · {kind_label}",
                    "metadata_context",
                )
        src["previewText"] = "\n\n".join(f"{k}: {v}" for k, v in texts.items() if v)

    # --- Chunk hygiene ----------------------------------------------------------------
    limit = CHUNK_POLICY["maxChars"]
    packed: list[dict] = []
    docx = {s["id"] for s in release["sources"] if s["filename"].endswith(".docx")}
    pending: list[dict] = []

    def flush():
        if not pending:
            return
        parts = [(int(c["locator"].split()[1]), c["text"]) for c in pending]
        packs = _fold_tail(_pack(parts, limit, "\n"), "\n")
        base = pending[0]
        for first, last, body in packs:
            locator = _span("paragraph", first, last)
            packed.append(
                {
                    **base,
                    "id": uid(f"chunk:{base['sourceId']}:{locator}:{digest(body.encode())}"),
                    "locator": locator,
                    "text": body,
                }
            )
        pending.clear()

    for c in release["chunks"]:
        is_paragraph = c["sourceId"] in docx and c["locator"].startswith("paragraph ")
        if not (is_paragraph and pending and pending[0]["sourceId"] == c["sourceId"]):
            flush()
        if is_paragraph:
            pending.append(c)
        elif c["type"] == "metadata_context" and len(c["text"]) > limit:
            for first, last, body in _sentence_windows(c["text"], limit):
                locator = f"{c['locator']}; {_span('sentence', first, last)}"
                packed.append(
                    {
                        **c,
                        "id": uid(f"chunk:{c['sourceId']}:{locator}:{digest(body.encode())}"),
                        "locator": locator,
                        "text": body,
                    }
                )
        else:
            packed.append(c)
    flush()
    release["chunks"] = packed

    # --- Duplicate keys, study coverage and limitations -------------------------------
    new_runs = [r for r in release["runs"] if r["id"] == "pending-final-revision"]
    keys = Counter((r["investigationId"], r["externalRunKey"]) for r in new_runs)
    rows_seen = Counter(
        (r["investigationId"], json.dumps(r["raw"], sort_keys=True)) for r in new_runs
    )
    for run in new_runs:
        if keys[run["investigationId"], run["externalRunKey"]] > 1:
            run["issues"].append(
                "Duplicate external test key occurs in multiple source rows; "
                "each row is retained without assuming independent experiments."
            )
        if rows_seen[run["investigationId"], json.dumps(run["raw"], sort_keys=True)] > 1:
            run["issues"].append("Identical row repeated in the source table; retained as-is.")

    for slug, note in STUDY_LIMITATIONS.items():
        studies[slug].setdefault("limitations", []).append(note)
    for study in studies.values():
        records = [r for r in release["runs"] if r["investigationId"] == study["id"]]
        study["runCount"] = len(records)
        study["coverage"] = "run_level_pilot" if records else "metadata_only"
        study["evidenceCoverage"] = {
            "metadata": True,
            "documents": sum(
                s["investigationId"] == study["id"]
                and s["license"] == "CC0-1.0"
                and s["kind"] in {"psi_metadata", "source_document"}
                for s in release["sources"]
            ),
            "records": len(records),
            "reviewed": 0,
        }
        geometry = [r for r in records if r["sampleGeometry"]]
        if geometry:
            study["sampleGeometry"] = " | ".join(
                dict.fromkeys(r["sampleGeometry"] for r in geometry)
            )
            study["geometryEvidence"] = [
                {
                    "text": r["sampleGeometry"],
                    "sourceId": r["sourceId"],
                    "locator": f"CSV row {r['rowNumber']}",
                }
                for r in geometry
            ]

    # --- Final revision and identities ------------------------------------------------
    revision = digest(
        json.dumps(
            {
                "parser": parser_version,
                "baseRevision": base_revision,
                "chunkPolicy": CHUNK_POLICY,
                "sources": [
                    {
                        k: s[k]
                        for k in (
                            "id",
                            "sha256",
                            "studyVersion",
                            "fileVersion",
                            "license",
                            "kind",
                            "sourceUrl",
                        )
                    }
                    for s in release["sources"]
                ],
                "studies": release["investigations"],
                "records": [{k: v for k, v in r.items() if k != "id"} for r in release["runs"]],
                "chunks": [[c["id"], c["type"]] for c in release["chunks"]],
            },
            sort_keys=True,
        ).encode()
    )
    identities = {}
    for run in release["runs"]:
        previous = run["id"]
        run["id"] = uid(
            f"run:{revision}:{run['sourceId']}:{run['rowNumber']}:{run['externalRunKey']}"
        )
        if previous != "pending-final-revision":
            identities[previous] = run["id"]
    release["telemetry"] = {identities[k]: v for k, v in release["telemetry"].items()}
    release["telemetryChannels"] = {
        identities[k]: v for k, v in release["telemetryChannels"].items()
    }
    release["revision"], release["parserVersion"] = revision, parser_version
    release["stats"] = {
        "investigations": len(studies),
        "runs": len(release["runs"]),
        "sources": len(release["sources"]),
        "chunks": len(release["chunks"]),
        "independentlyReviewedRuns": 0,
        "telemetrySeries": sum(len(v) for v in release["telemetryChannels"].values()),
    }
    release["limitations"] = [
        *release["limitations"],
        "Day/condition summary tables (FLEX-2, SLICE, CLD Flame, E-FIELD, s-Flame) are "
        "configuration evidence, not test runs.",
        "Inverse-flame burner oxygen and burner coflow air are apparatus quantities, "
        "not cabin conditions.",
    ]
    return release


def coverage_report(release: dict) -> dict:
    """Retrieval-corpus profile for dry runs; counts are not experiment counts."""
    chunks = release["chunks"]
    lengths = sorted(len(c["text"]) for c in chunks) or [0]
    by_study = Counter(c["investigationId"] for c in chunks)
    return {
        "chunksByType": dict(sorted(Counter(c["type"] for c in chunks).items())),
        "chunksByStudy": dict(sorted(by_study.items())),
        "studiesWithoutChunks": sorted(
            s["id"] for s in release["investigations"] if not by_study[s["id"]]
        ),
        "chunksWithoutLocator": sum(not c.get("locator") for c in chunks),
        "chunkLength": {
            "min": lengths[0],
            "median": lengths[len(lengths) // 2],
            "max": lengths[-1],
            "over900": sum(n > 900 for n in lengths),
            "under60": sum(n < 60 for n in lengths),
        },
    }
