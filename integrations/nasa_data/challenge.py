"""Versioned challenge release, retaining the original pilot as a reproducible input.

Source records are not a count of independent experiments. Configuration tables,
apparatus flow, ambiguous units and unknown rights retain their distinct meanings.
"""

from __future__ import annotations

import copy
import csv
import gzip
import io
import json
import re
from collections import Counter
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path

from .pilot import RESEARCH_ROOT, SLUGS, build_pilot, decode, digest, number, uid
from .resources import OFFICIAL_RESOURCES

PARSER_VERSION = "nasa-challenge-v1"
POLICY_VERSION = "research-navigation-v1"
CONTEXT_ROOT = RESEARCH_ROOT.parent / "nasa-combustion-2026-11-13"
TABLES = {
    "bass": "PSI-26_Experimental table_BASS.csv",
    "saffire-ii": "PSI-99_Experimental table_SAFFIRE-2.csv",
    "saffire-iii": "PSI-100_Experimental table_SAFFIRE-3.csv",
    "cfi": "PSI-39_Experimental table_CFI.csv",
    "same-r": "PSI-101_Experimental table_SAME-R.csv",
    "same": "PSI-102_Experimental table_SAME.csv",
    "bre": "PSI-20_Experimental table_ACME BRE.csv",
}
LLUV_FILE = "PSI-69_Raw Data_FLEX-007_LLUVData.txt"
PILLARS = {
    "flex": ["suppression"],
    "flex-2": ["suppression"],
    "bass": ["prevention", "suppression"],
    "bass-ii": ["prevention", "suppression"],
    "saffire-i": ["prevention"],
    "saffire-ii": ["prevention"],
    "saffire-iii": ["prevention", "detection"],
    "bre": ["prevention"],
    "cld-flame": ["prevention"],
    "e-field": ["prevention"],
    "s-flame": ["prevention", "suppression"],
    "flame-design": ["prevention"],
    "cfi-g": ["prevention", "suppression"],
    "cfi": ["suppression"],
    "slice": ["prevention"],
    "spice": ["detection"],
    "same": ["detection"],
    "same-r": ["detection"],
}
FUEL_TYPES = {
    "flex": "droplet",
    "flex-2": "droplet",
    "cfi": "droplet",
    "bass": "solid",
    "bass-ii": "solid",
    "saffire-i": "solid",
    "saffire-ii": "solid",
    "saffire-iii": "solid",
    "same": "aerosol",
    "same-r": "aerosol",
    "bre": "gas",
    "cld-flame": "gas",
    "e-field": "gas",
    "s-flame": "gas",
    "flame-design": "gas",
    "cfi-g": "gas",
    "slice": "gas",
    "spice": "gas",
}


class _PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []
        self.skipped = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style"}:
            self.skipped += 1
        elif tag in {"p", "li", "br", "div"}:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in {"script", "style"}:
            self.skipped = max(0, self.skipped - 1)
        elif tag in {"p", "li", "div"}:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.skipped:
            self.parts.append(data)


def plain_text(value: str) -> str:
    parser = _PlainText()
    parser.feed(value)
    return " ".join("".join(parser.parts).split())


def _rows(data: bytes) -> tuple[list[tuple[int, dict[str, str]]], str]:
    text, encoding = decode(data)
    result = []
    for row_number, row in enumerate(csv.DictReader(io.StringIO(text, newline=None)), 2):
        if None in row:
            raise ValueError(f"Unexpected extra CSV fields at row {row_number}")
        raw = {key.strip(): (value or "").strip() for key, value in row.items()}
        if any(raw.values()):
            result.append((row_number, raw))
    return result, encoding


def _unit_number(value: str | None, unit: str) -> float | None:
    match = re.fullmatch(
        r"\s*([+]?(?:\d+(?:\.\d*)?|\.\d+))\s*" + re.escape(unit) + r"\s*",
        value or "",
        re.IGNORECASE,
    )
    return number(match.group(1)) if match else None


def build_challenge_release(
    root: Path = RESEARCH_ROOT,
    *,
    context_root: Path = CONTEXT_ROOT,
    parser_version: str = PARSER_VERSION,
) -> dict:
    """Build without a database/network call; verify every admitted source first."""
    release = build_pilot(root)
    base_revision = release["revision"]
    studies = {study["id"]: study for study in release["investigations"]}
    catalog = {
        m["accession"]: m
        for m in json.loads((root / "evidence/catalog-snapshot.json").read_text(encoding="utf-8"))[
            "investigations"
        ]
    }
    manifest = json.loads((root / "evidence/artifacts.json").read_text(encoding="utf-8"))[
        "artifacts"
    ]
    selected = [entry for entry in manifest if entry["file_name"] in {*TABLES.values(), LLUV_FILE}]
    if len(selected) != len(TABLES) + 1:
        raise ValueError("Missing challenge source manifest entries")
    release["resources"] = copy.deepcopy(OFFICIAL_RESOURCES)
    release["telemetryChannels"] = {
        key: [copy.deepcopy(value)] for key, value in release["telemetry"].items()
    }
    context_manifest_bytes = (context_root / "context-manifest.json").read_bytes()
    context_entries = json.loads(context_manifest_bytes)["artifacts"]
    if Counter(a["accession"] for a in context_entries) != Counter(catalog.keys()):
        raise ValueError("PSI context manifest must contain one source for every investigation")

    def source(entry, data, *, kind=None, license_id=None, doi=None):
        if digest(data) != entry["sha256"] or len(data) != entry["downloaded_bytes"]:
            raise ValueError(f"Challenge source hash/size mismatch: {entry['file_name']}")
        meta = catalog[entry["accession"]]
        item = {
            "id": uid(f"source:{entry['accession']}:{entry['file_name']}:{entry['sha256']}"),
            "investigationId": SLUGS[entry["accession"]],
            "filename": entry["file_name"],
            "sha256": entry["sha256"],
            "fileVersion": entry["file_version"],
            "studyVersion": entry["study_version"],
            "sourceUrl": entry["source_url"],
            "license": license_id or meta["licenseIdentifier"] or "unknown",
            "rightsScope": "PSI source-specific rights; "
            "linked external publications are not ingested.",
            "kind": kind or entry["kind"],
            "byteCount": len(data),
            "status": "source_checked",
            "doi": doi,
        }
        release["sources"].append(item)
        release["_artifacts"][item["sha256"]] = data
        return item

    def chunk(src, locator, text, heading, *, type="passage"):
        if src["license"] != "CC0-1.0" or not text:
            return
        release["chunks"].append(
            {
                "id": uid(f"chunk:{src['id']}:{locator}:{digest(text.encode())}"),
                "sourceId": src["id"],
                "investigationId": src["investigationId"],
                "locator": locator,
                "sourceRef": src["sourceUrl"],
                "text": text,
                "heading": heading,
                "type": type,
                "status": "source_checked",
                "contextual": heading,
            }
        )

    def ref(src, field, text):
        return {"text": text, "sourceId": src["id"], "locator": f"JSON /{field}"}

    for entry in context_entries:
        packed = (context_root / entry["local_path"]).read_bytes()
        if digest(packed) != entry["stored_sha256"] or len(packed) != entry["stored_bytes"]:
            raise ValueError(f"Stored context hash/size mismatch: {entry['file_name']}")
        data = gzip.decompress(packed) if entry["compression"] == "gzip" else packed
        meta = json.loads(data)
        rights = meta.get("licenseIdentifier") or "unknown"
        if (
            meta["accession"] != entry["accession"]
            or meta["version"] != entry["study_version"]
            or rights != entry["license"]
        ):
            raise ValueError("PSI context identity/version/license mismatch")
        src = source(entry, data, kind="psi_metadata", license_id=rights, doi=meta.get("doi"))
        src["contentType"] = "application/json"
        study = studies[src["investigationId"]]
        study.update(
            {
                "pillars": copy.deepcopy(PILLARS[study["id"]]),
                "summary": [],
                "objectives": [],
                "sampleGeometry": None,
                "sensors": [],
                "sensorEvidence": [],
                "geometryEvidence": [],
                "contextSourceId": src["id"],
                "limitations": [
                    "Research-navigation annotations and source transcription "
                    "are not independent scientific review."
                ],
                "classification": {
                    "basis": "research_navigation",
                    "policyVersion": POLICY_VERSION,
                    "evidence": [],
                },
                "fuelType": FUEL_TYPES.get(study["id"]),
            }
        )
        texts = {
            key: plain_text(meta.get(key) or "")
            for key in ("objective", "approach", "description", "researchImpacts")
        }
        if rights != "CC0-1.0":
            study["pillars"] = []
            study["limitations"].append(
                "Current PSI metadata does not declare reusable text rights; "
                "context is linked and retained, not indexed."
            )
            src["previewText"] = "Context text reuse unavailable: source rights are unknown."
            continue
        for field, text in texts.items():
            chunk(
                src,
                f"JSON /{field}",
                text,
                f"{study['code']} · {field} · PSI research context",
                type="metadata_context",
            )
        if texts["objective"]:
            study["objectives"] = [ref(src, "objective", texts["objective"])]
        summary_field = "description" if texts["description"] else "approach"
        if texts[summary_field]:
            study["summary"] = [ref(src, summary_field, texts[summary_field])]
        study["classification"]["evidence"] = study["objectives"] + study["summary"]
        src["previewText"] = "\n\n".join(f"{key}: {value}" for key, value in texts.items() if value)
        approach = texts["approach"]
        sensor_terms = {
            "cameras": "Cameras",
            "thermocouples": "Thermocouples",
            "radiometers": "Radiometers",
            "photomultiplier tubes": "Photomultiplier tubes",
            "anemometer": "Anemometers",
            "smoke detectors": "Smoke detectors",
            "thermophoretic soot samplers": "Thermophoretic soot samplers",
            "Transmission Electron microscope": "Transmission electron microscopy",
            "M-pass": "M-pass",
        }
        # SAME-R explicitly replaces an old instrument: only list its named new instrument.
        if study["id"] == "same-r":
            sensor_terms = {"M-pass": "M-pass"}
        for term, label in sensor_terms.items():
            if term.casefold() in approach.casefold():
                study["sensors"].append(label)
                study["sensorEvidence"].append(ref(src, "approach", term))
        if study["sensors"]:
            study["limitations"].append(
                "Sensors describe the source methodology; "
                "their channels are not necessarily imported."
            )
        if study["id"] == "same-r":
            study["limitations"].append(
                "The CSV does not classify flight versus ground records; "
                "project metadata is not a per-record gravity assignment."
            )

    def make_run(slug, src, row_number, raw, key, record_kind):
        return {
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
            },
            "observations": [],
            "issues": [],
            "status": "source_checked",
            "recordKind": record_kind,
            "sampleGeometry": None,
        }

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

    new_sources = {}
    for entry in selected:
        data = (root / entry["local_path"]).read_bytes()
        slug = SLUGS[entry["accession"]]
        expected_slug = (
            "flex"
            if entry["file_name"] == LLUV_FILE
            else next(key for key, filename in TABLES.items() if filename == entry["file_name"])
        )
        if slug != expected_slug:
            raise ValueError("Challenge table source identity mismatch")
        kind = "configuration_table" if slug in {"same", "bre"} else entry["kind"]
        src = source(entry, data, kind=kind)
        if src["license"] != "CC0-1.0":
            raise ValueError("Challenge table requires admitted CC0 source rights")
        new_sources[entry["file_name"]] = src
        if entry["file_name"] == LLUV_FILE:
            continue
        rows, src["encoding"] = _rows(data)
        for row_number, raw in rows:
            text = "; ".join(f"{key}: {value or 'unknown'}" for key, value in raw.items())
            is_config = (
                slug in {"same", "bre"}
                or (
                    slug == "saffire-ii"
                    and not re.fullmatch(r"2-[1-9]", raw.get("Sample Number", ""))
                )
                or (slug == "bass" and not raw.get("As Run Test #") and not raw.get("Test #"))
            )
            if is_config:
                chunk(
                    src,
                    f"CSV row {row_number}",
                    text,
                    f"{slug} configuration/source notes row {row_number}",
                    type="configuration",
                )
                continue
            key_field = {
                "bass": "As Run Test #",
                "saffire-ii": "Sample Number",
                "saffire-iii": "Sample Number",
                "cfi": "Flex Number",
                "same-r": "SAME Test #",
            }[slug]
            key = raw.get(key_field, "")
            if not key:
                raise ValueError(f"Missing source test key for {slug} row {row_number}")
            run = make_run(
                slug,
                src,
                row_number,
                raw,
                key,
                "sample_test" if slug.startswith("saffire") else "test_record",
            )
            conditions = run["conditions"]
            if slug == "same-r":
                conditions.update(
                    material=raw.get("Sample Type") or "Unknown",
                    flowContext="aerosol_apparatus_inlet",
                    gravityRegime="unknown",
                    gravityScope="project_metadata_only",
                    gravityContextSourceId=studies[slug]["contextSourceId"],
                    gravityContextLocator="JSON /approach",
                )
                observe(
                    run,
                    "apparatus_inlet_velocity",
                    "Inlet velocity (cm/s)",
                    "cm/s",
                    number(raw.get("Inlet velocity (cm/s)")),
                )
                observe(run, "rt_r0_ratio", "Rt/R0", "not declared", reviewed=False)
                for field in [
                    "Duration (sec)",
                    "Primary aging time (sec)",
                    "Primary mixing time (sec)",
                    "Net aging time (sec)",
                ]:
                    observe(
                        run,
                        field.split(" (")[0].lower().replace(" ", "_"),
                        field,
                        "s",
                        number(raw.get(field)),
                    )
                run["issues"].extend(
                    [
                        "Inlet velocity refers to the aerosol apparatus; "
                        "cabin airflow is not established.",
                        "Rt/R0 physical definition is not declared in this table; "
                        "retained without normalization.",
                        "Table rows are source test records, "
                        "not an independently verified count of flight test points.",
                        "PSI metadata describes flight and post-flight ground tests, "
                        "but this CSV does not classify gravity for each row; "
                        "no per-record flight or ground assignment is inferred.",
                    ]
                )
            elif slug.startswith("saffire"):
                conditions.update(
                    material=raw.get("Material") or "Unknown", flowContext="experiment_duct"
                )
                flow_field = "Air Flow (cm/s)" if slug == "saffire-ii" else "Air Flow"
                conditions["airflowCmS"] = _unit_number(raw.get(flow_field), "cm/s")
                observe(run, "duct_airflow", flow_field, "cm/s", conditions["airflowCmS"])
                thickness = "Samle Thickness" if slug == "saffire-ii" else "Sample Thickness"
                length = "Sample Length"
                width = "Sample Width (cm)" if slug == "saffire-ii" else "Sample Width"
                run["sampleGeometry"] = (
                    "; ".join(
                        f"{field}: {raw[field]}"
                        for field in [thickness, length, width]
                        if raw.get(field)
                    )
                    or None
                )
                for field in [thickness, length, width]:
                    observe(
                        run,
                        "sample_geometry_" + field.lower().replace(" ", "_"),
                        field,
                        "as written in source",
                        reviewed=False,
                    )
                if slug == "saffire-ii":
                    observe(
                        run,
                        "oxygen_derived",
                        "Percent O2 (Note 1)",
                        "% (basis not declared)",
                        reviewed=False,
                    )
                    observe(
                        run,
                        "burn_duration",
                        "Burn Time (s)",
                        "s",
                        _unit_number(raw.get("Burn Time (s)"), "s"),
                    )
                    run["issues"].append(
                        "O2 is derived from CO2 production (source Note 1), "
                        "approximate or time-varying; no exact ambient O2 condition selected."
                    )
                    run["issues"].append(
                        "Mixed units, approximate geometry, qualitative outcomes and missing "
                        "material names remain verbatim; no forward-fill or correction of 037 mm."
                    )
                run["issues"].append(
                    "Sample test configuration is not a time series; "
                    "duct airflow is not a measured vehicle-wide ventilation field."
                )
            elif slug == "cfi":
                conditions["material"] = raw.get("Fuel") or "Unknown"
                pressure = _unit_number(raw.get("Pressure"), "atm")
                if pressure is not None:
                    conditions["pressurePsi"] = float(
                        Decimal(str(pressure)) * Decimal("101325") / Decimal("6894.757293168")
                    )
                    conditions["pressureConversion"] = "atm × 101325 / 6894.757293168 → psia"
                observe(
                    run,
                    "oxygen_fraction_unconfirmed_basis",
                    "Oxygen",
                    "fraction (basis not declared)",
                    reviewed=False,
                )
                observe(
                    run,
                    "helium_fraction_unconfirmed_basis",
                    "Helium",
                    "fraction (basis not declared)",
                    reviewed=False,
                )
                run["issues"].append(
                    "Gas composition basis is not declared in this source table; "
                    "no exact oxygen condition inferred."
                )
            elif slug == "bass":
                conditions["material"] = raw.get("Fuel Sample Material") or "Unknown"
                run["sampleGeometry"] = raw.get("Fuel Sample Material") or None
                run["issues"].append(
                    "Table identifies tests/materials only; "
                    "oxygen, pressure and calibrated airflow are unavailable here."
                )
            release["runs"].append(run)
            chunk(
                src,
                f"CSV row {row_number}",
                f"{key} [{slug}] CSV row {row_number}. {text}",
                f"{key} {slug}",
                type="test_record",
            )

    for run in release["runs"]:
        run.setdefault("recordKind", "test_record")
        run.setdefault("sampleGeometry", None)
        if run["investigationId"] in {"flex", "bass-ii", "cfi-g"}:
            run["conditions"]["oxygenContext"] = "chamber"
            run["conditions"].setdefault("flowContext", "unknown")
        if run["investigationId"] == "cfi-g":
            run["conditions"]["flameConfiguration"] = "normal"
    keys = Counter((r["investigationId"], r["externalRunKey"]) for r in release["runs"])
    for run in release["runs"]:
        if keys[run["investigationId"], run["externalRunKey"]] > 1:
            run["issues"].append(
                "Duplicate external test key occurs in multiple source rows; "
                "each row is retained without assuming independent experiments."
            )

    flex7 = next(
        r
        for r in release["runs"]
        if r["investigationId"] == "flex" and r["externalRunKey"] == "FLEX-007"
    )
    lluv = new_sources[LLUV_FILE]
    data = release["_artifacts"][lluv["sha256"]]
    text, lluv["encoding"] = decode(data)
    series = {
        "sourceId": lluv["id"],
        "channel": "lluv_flame_diameter",
        "label": "LLUV flame diameter",
        "unit": "mm",
        "timeUnit": "s",
        "timeReference": "Original LLUV source offset; "
        "no synchronization or resampling against the droplet channel.",
        "points": [
            {
                "timeSec": number(row["LLUVTime_sec"], signed=True),
                "value": number(row["LLUVFlameDiameter_mm"]),
            }
            for row in csv.DictReader(io.StringIO(text, newline=None), delimiter="\t")
        ],
    }
    release["telemetryChannels"][flex7["id"]].append(series)

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

    revision = digest(
        json.dumps(
            {
                "parser": parser_version,
                "baseRevision": base_revision,
                "sources": [
                    {
                        key: source[key]
                        for key in (
                            "id",
                            "sha256",
                            "studyVersion",
                            "fileVersion",
                            "license",
                            "kind",
                            "sourceUrl",
                        )
                    }
                    for source in release["sources"]
                ],
                "contextManifest": digest(context_manifest_bytes),
                "resources": release["resources"],
                "classification": {
                    "policyVersion": POLICY_VERSION,
                    "pillars": PILLARS,
                    "fuelTypes": FUEL_TYPES,
                },
                "annotations": {
                    "studies": release["investigations"],
                    "records": [
                        {key: value for key, value in run.items() if key != "id"}
                        for run in release["runs"]
                    ],
                    "channels": release["telemetryChannels"],
                },
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
        # Only inherited IDs are referenced by existing telemetry; new rows have no telemetry.
        if previous != "pending-final-revision":
            identities[previous] = run["id"]
    release["telemetry"] = {identities[key]: value for key, value in release["telemetry"].items()}
    release["telemetryChannels"] = {
        identities[key]: value for key, value in release["telemetryChannels"].items()
    }
    release["revision"], release["parserVersion"] = revision, parser_version
    release["stats"] = {
        "investigations": len(studies),
        "runs": len(release["runs"]),
        "sources": len(release["sources"]),
        "chunks": len(release["chunks"]),
        "independentlyReviewedRuns": 0,
        "telemetrySeries": sum(len(channels) for channels in release["telemetryChannels"].values()),
    }
    release["limitations"] = [
        "Selected source records and metadata, not the full NASA PSI inventory.",
        "Source records include duplicate external keys and sample tests; "
        "their count is not a count of independent experiments.",
        "Source-checked means hash/transcription checks, not independent scientific validation.",
        "Configuration/day-summary rows are documents, not invented test runs.",
        "Research-navigation relevance is not fire-risk probability. "
        "No validated predictive model is installed.",
        "Partial-gravity measurements, unknown composition bases "
        "and unavailable instrument channels are not synthesized.",
    ]
    return release
