"""NASA pilot parser. Original bytes and values survive every normalization.

Only these explicitly selected run tables are parsed. Summary tables are metadata,
fan voltage is not airflow, and suspected units are never silently corrected.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import zipfile
from decimal import Decimal, InvalidOperation
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5
from xml.etree import ElementTree

PARSER_VERSION = "nasa-pilot-v2"
RESEARCH_ROOT = Path(__file__).resolve().parent / "research/nasa-combustion-2026-11-10"
SLUGS = {
    "PSI-69": "flex",
    "PSI-68": "flex-2",
    "PSI-26": "bass",
    "PSI-25": "bass-ii",
    "PSI-98": "saffire-i",
    "PSI-99": "saffire-ii",
    "PSI-100": "saffire-iii",
    "PSI-20": "bre",
    "PSI-21": "cld-flame",
    "PSI-22": "e-field",
    "PSI-23": "s-flame",
    "PSI-10": "flame-design",
    "PSI-159": "cfi-g",
    "PSI-39": "cfi",
    "PSI-106": "slice",
    "PSI-107": "spice",
    "PSI-102": "same",
    "PSI-101": "same-r",
}
TABLES = {
    "flex": "PSI-69_Experimental table_FLEX.csv",
    "bass-ii": "PSI-25_Experimental table_BASS-II.csv",
    "cfi-g": "PSI-159_Experimental table_CFI-G_Normal Flames.csv",
}
EXTRAS = (
    "PSI-69_Raw Data_FLEX-007_TestSheet.txt",
    "PSI-69_Raw Data_FLEX-007_DropletData.txt",
    "PSI-69_Science Documents_FLEX DoD.docx",
    "PSI-25_Science Documents_BASS-II_ReadMe.docx",
)


def uid(value: str) -> str:
    return str(uuid5(NAMESPACE_URL, "flameguard:" + value))


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def decode(data: bytes) -> tuple[str, str]:
    try:
        return data.decode("utf-8-sig"), "utf-8-sig"
    except UnicodeDecodeError:
        return data.decode("cp1252"), "cp1252"


def number(value: str | None, *, signed: bool = False) -> float | None:
    try:
        n = Decimal((value or "").strip())
        return float(n) if n.is_finite() and (signed or n >= 0) else None
    except InvalidOperation:
        return None


def document_text(data: bytes) -> list[str]:
    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    return [
        text
        for p in root.iter(ns + "p")
        if (text := "".join(t.text or "" for t in p.iter(ns + "t")).strip())
    ]


def presets() -> list[dict]:
    return [
        {
            "id": "iss",
            "name": "ISS research scenario",
            "oxygenPct": 21,
            "oxygenBasis": "volume_percent",
            "pressurePsi": 14.7,
            "gravityG": 0,
            "airflowCmS": 5,
            "material": "PMMA",
            "status": "illustrative_scenario",
        },
        {
            "id": "lunar",
            "name": "Lunar habitat — illustrative",
            "oxygenPct": 30,
            "oxygenBasis": "volume_percent",
            "pressurePsi": 10.2,
            "gravityG": 0.16,
            "airflowCmS": 5,
            "material": "PMMA",
            "status": "illustrative_scenario",
        },
        {
            "id": "mars",
            "name": "Mars habitat — illustrative",
            "oxygenPct": 28,
            "oxygenBasis": "volume_percent",
            "pressurePsi": 9,
            "gravityG": 0.38,
            "airflowCmS": 5,
            "material": "PMMA",
            "status": "illustrative_scenario",
        },
        {
            "id": "flex",
            "name": "FLEX nominal comparison",
            "oxygenPct": 21,
            "oxygenBasis": "mole_percent",
            "pressurePsi": 14.7,
            "gravityG": 0,
            "airflowCmS": 0,
            "material": "Heptane",
            "status": "illustrative_scenario",
        },
    ]


def build_pilot(root: Path = RESEARCH_ROOT, *, parser_version: str = PARSER_VERSION) -> dict:
    catalog_bytes = (root / "evidence/catalog-snapshot.json").read_bytes()
    catalog = json.loads(catalog_bytes)["investigations"]
    manifest = json.loads((root / "evidence/artifacts.json").read_text(encoding="utf-8"))[
        "artifacts"
    ]
    selected = [a for a in manifest if a["file_name"] in {*TABLES.values(), *EXTRAS}]
    if len(selected) != len(TABLES) + len(EXTRAS):
        raise ValueError("Missing pilot source manifest")
    inputs = []
    for a in sorted(selected, key=lambda a: a["file_name"]):
        data = (root / a["local_path"]).read_bytes()
        if digest(data) != a["sha256"] or len(data) != a["downloaded_bytes"]:
            raise ValueError(f"Source hash/size mismatch: {a['file_name']}")
        inputs.append((a, data))
    revision = digest(
        json.dumps(
            {
                "parser": parser_version,
                "catalog": digest(catalog_bytes),
                "inputs": [
                    {
                        k: a[k]
                        for k in (
                            "accession",
                            "file_name",
                            "file_version",
                            "study_version",
                            "sha256",
                            "source_url",
                        )
                    }
                    for a, _ in inputs
                ],
            },
            sort_keys=True,
        ).encode()
    )
    release = {
        "revision": revision,
        "parserVersion": parser_version,
        "investigations": [],
        "runs": [],
        "sources": [],
        "chunks": [],
        "telemetry": {},
        "issues": [],
        "presets": presets(),
        "_artifacts": {},
    }
    by_accession = {i["accession"]: i for i in catalog}

    def source(a: dict, data: bytes) -> dict:
        meta = by_accession[a["accession"]]
        sid = uid(f"source:{a['accession']}:{a['file_name']}:{a['sha256']}")
        item = {
            "id": sid,
            "investigationId": SLUGS[a["accession"]],
            "filename": a["file_name"],
            "sha256": a["sha256"],
            "fileVersion": a["file_version"],
            "studyVersion": a["study_version"],
            "sourceUrl": a["source_url"],
            "license": meta["licenseIdentifier"] or "unknown",
            "rightsScope": "Dataset metadata license; no external paper fulltext ingested",
            "kind": a["kind"],
            "byteCount": len(data),
            "status": "source_checked",
        }
        release["sources"].append(item)
        release["_artifacts"][a["sha256"]] = data
        return item

    def chunk(s: dict, locator: str, text: str, heading: str) -> None:
        release["chunks"].append(
            {
                "id": uid(f"chunk:{s['id']}:{locator}:{digest(text.encode())}"),
                "sourceId": s["id"],
                "investigationId": s["investigationId"],
                "locator": locator,
                "sourceRef": s["sourceUrl"],
                "text": text,
                "heading": heading,
                "type": "passage",
                "status": "source_checked",
                "contextual": heading,
            }
        )

    for meta in catalog:
        accession = meta["accession"]
        slug = SLUGS[accession]
        s = source(
            {
                "accession": accession,
                "file_name": "catalog-snapshot.json",
                "sha256": digest(catalog_bytes),
                "file_version": 1,
                "study_version": meta["version"],
                "source_url": meta["metadata_url"],
                "kind": "catalog_metadata",
            },
            catalog_bytes,
        )
        release["investigations"].append(
            {
                "id": slug,
                "uuid": uid(accession),
                "psiId": accession,
                "code": meta["investigationAcronym"],
                "title": meta["title"],
                "platform": meta["flightProgram"],
                "hardware": meta["experimentHardware"],
                "researchArea": meta["researchArea"],
                "sourceUrl": meta["landing_url"],
                "metadataSourceId": s["id"],
                "version": meta["version"],
                "license": meta["licenseIdentifier"] or "unknown",
                "doi": meta.get("doi"),
                "fuelType": {"flex": "droplet", "bass-ii": "solid", "cfi-g": "gas"}.get(slug),
                "runCount": 0,
                "coverage": "metadata_only",
            }
        )
        if s["license"] == "CC0-1.0":
            chunk(
                s,
                f"investigations/{accession}",
                f"{meta['investigationAcronym']} ({accession}): {meta['title']}. "
                f"Platform: {meta['flightProgram']}. Hardware: {meta['experimentHardware']}. "
                "Catalog metadata only; this is not a measurement or safety verdict.",
                meta["title"],
            )

    sources = {}
    for a, data in inputs:
        s = source(a, data)
        if s["license"] != "CC0-1.0":
            raise ValueError("Pilot content requires reviewed CC0 dataset license")
        sources[a["file_name"]] = s
        if a["file_name"].endswith(".docx"):
            # Only data descriptions; linked bibliography is not ingested paper fulltext.
            for n, para in enumerate(document_text(data), 1):
                if "Presentations and Publications to date" in para:
                    break
                chunk(s, f"paragraph {n}", para, s["filename"])
        if a["file_name"].endswith("TestSheet.txt"):
            chunk(s, "TEST CONDITIONS / D0 / kavg", decode(data)[0], "FLEX-007 TestSheet")

    for slug, filename in TABLES.items():
        s = sources[filename]
        data = release["_artifacts"][s["sha256"]]
        text, encoding = decode(data)
        s["encoding"] = encoding
        reader = csv.DictReader(io.StringIO(text, newline=None))
        for row_number, original in enumerate(reader, 2):
            raw = {k.strip(): (v or "").strip() for k, v in original.items() if k is not None}
            if not any(raw.values()):
                continue
            key = (
                f"FLEX-{int(raw['FLEX Test #']):03d}"
                if slug == "flex"
                else raw["Test #"]
                if slug == "bass-ii"
                else raw["Test"]
            )
            rid = uid(f"run:{revision}:{s['id']}:{row_number}:{key}")
            c = {
                "oxygenPct": None,
                "oxygenBasis": None,
                "pressurePsi": None,
                "airflowCmS": None,
                "gravityG": None,
                "gravityRegime": "microgravity",
                "gravitySourceId": next(
                    i["metadataSourceId"] for i in release["investigations"] if i["id"] == slug
                ),
                "material": raw.get("Fuel") or raw.get("Fuel Sample Material") or "Unknown",
            }
            run = {
                "id": rid,
                "investigationId": slug,
                "externalRunKey": key,
                "sourceId": s["id"],
                "rowNumber": row_number,
                "raw": raw,
                "conditions": c,
                "observations": [],
                "issues": [],
                "status": "source_checked",
            }

            def observation(
                name,
                header,
                unit,
                *,
                normalize=True,
                other_source=None,
                value=None,
                locator=None,
                _source=s,
                _raw=raw,
                _run=run,
                _row=row_number,
            ):
                src = other_source or _source
                original_value = _raw.get(header, "") if value is None else value
                _run["observations"].append(
                    {
                        "name": name,
                        "raw": original_value,
                        "value": number(original_value) if normalize else None,
                        "unit": unit if normalize else None,
                        "originalUnit": unit,
                        "sourceId": src["id"],
                        "locator": locator or f"row {_row}; {header}",
                        "status": "source_checked" if normalize else "needs_review",
                    }
                )

            if slug == "flex":
                o2 = number(raw.get("O initial ambient composition; mole fraction"))
                p = number(raw.get("Ambient pressure; mmHg"))
                c.update(
                    oxygenPct=o2 * 100 if o2 is not None else None,
                    oxygenBasis="mole_percent",
                    pressurePsi=float(
                        Decimal(str(p)) * Decimal("133.322387415") / Decimal("6894.757293168")
                    )
                    if p is not None
                    else None,
                )
                observation("initial_droplet_diameter", "Droplet initial diameter; mm", "mm")
                observation(
                    "visible_extinction_diameter", "Visible flame extinction diameter; mm", "mm"
                )
                observation("burning_rate_table", "Burning rate; mm", "mm", normalize=False)
                observation("burn_duration", "Burn time; s", "s")
                run["issues"].append(
                    "Burning-rate table header says mm; ambiguous unit, not normalized."
                )
                if key == "FLEX-007":
                    ts = sources["PSI-69_Raw Data_FLEX-007_TestSheet.txt"]
                    sheet = decode(release["_artifacts"][ts["sha256"]])[0]
                    d0 = re.search(r"D0\s+\(mm\)\s*=\s*([\d.]+)", sheet).group(1)
                    kavg = re.search(r"kavg\s+\(mm2/s\)\s*=\s*([\d.]+)", sheet).group(1)
                    observation(
                        "initial_droplet_diameter",
                        "D0",
                        "mm",
                        other_source=ts,
                        value=d0,
                        locator="TEST CONDITIONS / D0 (mm)",
                    )
                    observation(
                        "burning_rate_testsheet",
                        "kavg",
                        "mm²/s",
                        other_source=ts,
                        value=kavg,
                        locator="TEST CONDITIONS / kavg (mm2/s)",
                    )
                    run["issues"].append(
                        f"Source conflict: CSV D0 = {raw['Droplet initial diameter; mm']} mm, "
                        f"TestSheet D0 = {d0} mm; "
                        f"CSV rate = {raw['Burning rate; mm']} (header mm), "
                        f"TestSheet kavg = {kavg} mm²/s. "
                        "No value selected."
                    )
            elif slug == "bass-ii":
                c.update(
                    oxygenPct=number(raw.get("Calibrated  initial O2 % by vol")),
                    oxygenBasis="volume_percent",
                )
                observation("oxygen_initial", "Calibrated  initial O2 % by vol", "% by volume")
                observation("oxygen_final", "Calibrated final O2 % by vol", "% by volume")
                observation("fan_display", "Fan display", "display (voltage ×10)", normalize=False)
                observation(
                    "air_display", "Air display", "cm/s (slow-response display)", normalize=False
                )
                observation("CO_final", "Final CO (ppm)", "ppm")
                run["issues"].append(
                    "BASS-II ReadMe: fan display is voltage ×10; air display responds ~1 minute; "
                    "steady calibrated airflow unavailable in this pilot. O2 uses daily offset; "
                    "radiometer uncalibrated. OR means >1000 ppm; "
                    "negative/sentinel values retained raw."
                )
            else:
                o2 = number(raw.get("XO2 before test"))
                p = number(raw.get("approx p (bar)"))
                c.update(
                    oxygenPct=o2 * 100 if o2 is not None else None,
                    oxygenBasis="mole_percent",
                    pressurePsi=float(Decimal(str(p)) * Decimal(100000) / Decimal("6894.757293168"))
                    if p is not None
                    else None,
                )
                observation("burn_duration", "burn time (sec)", "s")
                observation("adiabatic_temperature_model", "Tad (K)", "K", normalize=False)
                observation("peak_burner_temperature", "Peak burner T (C )", "°C")
                run["issues"].append(
                    "Normal flame only; pressure is approximate. Tad is a model quantity, "
                    "not measured flame temperature. Mass flow is not cabin airflow velocity."
                )
            c["sourceId"] = s["id"]
            c["locator"] = f"CSV row {row_number}"
            c["pressureConversion"] = (
                "mmHg × 133.322387415 / 6894.757293168 → psia"
                if slug == "flex"
                else "bar × 100000 / 6894.757293168 → psia"
                if slug == "cfi-g"
                else None
            )
            release["runs"].append(run)
            text = f"{key} [{slug}] CSV row {row_number}. " + "; ".join(
                f"{k}: {v or 'unknown'}" for k, v in raw.items()
            )
            chunk(s, f"CSV row {row_number}", text, f"{key} {slug}")

    ts = sources["PSI-69_Raw Data_FLEX-007_DropletData.txt"]
    rows = csv.DictReader(
        io.StringIO(decode(release["_artifacts"][ts["sha256"]])[0], newline=None), delimiter="\t"
    )
    points = [
        {
            "timeSec": number(r["DropletTime_sec"], signed=True),
            "value": number(r["DropletDiameter_mm"]),
        }
        for r in rows
    ]
    flex7 = next(r for r in release["runs"] if r["externalRunKey"] == "FLEX-007")
    release["telemetry"][flex7["id"]] = {
        "sourceId": ts["id"],
        "channel": "droplet_diameter",
        "unit": "mm",
        "timeUnit": "s",
        "timeReference": "Original source offset; negative times preserved",
        "points": points,
    }
    for study in release["investigations"]:
        study["runCount"] = sum(r["investigationId"] == study["id"] for r in release["runs"])
        study["coverage"] = "run_level_pilot" if study["runCount"] else "metadata_only"
    release["stats"] = {
        "investigations": len(catalog),
        "runs": len(release["runs"]),
        "sources": len(release["sources"]),
        "chunks": len(release["chunks"]),
        "independentlyReviewedRuns": 0,
        "telemetrySeries": len(release["telemetry"]),
    }
    release["limitations"] = [
        "Selected local NASA PSI snapshot, not the full NASA inventory.",
        "Source-checked means hash/transcription checks, not independent scientific validation.",
        "Three run-level pilots; other investigations have metadata only. No validated predictor.",
    ]
    return release
