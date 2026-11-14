"""Unified release: coverage release v2 plus run-level PSI workbooks (official sources only).

Adds the PSI-20 ACME Chamber Calculator workbooks (BRE chamber test points) and the
PSI-39 CFI Data Summary Spreadsheet, both re-fetched from the PSI Data Repository and
hash-checked. Cells are read without re-evaluating formulas; calculator-derived values
stay observations marked ``needs_review`` and never become run conditions. Records keep
their original cell text and an ``xlsx '<sheet>'!<cell>`` locator. See
``research/nasa-combustion-2026-11-14/psi-files/README.md``.
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import re
from collections import Counter
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

from .challenge import CONTEXT_ROOT, _unit_number
from .coverage import CHUNK_POLICY, EXTRA_ROOT, _sentence_windows, _span, build_coverage_release
from .pilot import RESEARCH_ROOT, SLUGS, digest, uid
from .xlsx import column_index, read_workbook, rows

PARSER_VERSION = "nasa-unified-v1"
PSI_FILES_ROOT = EXTRA_ROOT / "psi-files"
BRE_WORKBOOKS = (
    "PSI-20_Raw Data_Final ACME Chamber Calculator - 2019-01-31 to 2019-04-09.xlsx",
    "PSI-20_Raw Data_Final ACME Chamber Calculator - 2020-07-22 to 2021-02-03.xlsx",
)
CFI_SPREADSHEET = "PSI-39_Science Documents_CFI_DataSummary_Spreadsheet_Jan2021.xlsx"
BRE_DAY_TABLE = "evidence/samples/PSI-20_Experimental table_ACME BRE.csv"
MONTHS = {
    m: i
    for i, m in enumerate(
        ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1
    )
}
STUDY_LIMITATIONS = {
    "bre": [
        "Chamber test points come from the ACME Chamber Calculator operations log. Gas "
        "compositions and Burn Fraction are calculator values from mass-flow-controller "
        "volumes (assuming all fuel consumed when Burn Fraction = 1), not measurements.",
        "The calculator logs every ACME chamber operation in its date range; test points "
        "not within one day of a BRE day-summary date are flagged, not removed.",
        "BRE is a gaseous burner emulating solid burning, not a direct measurement of "
        "fabric or plastic flammability.",
    ],
    "cfi": [
        "The CFI Data Summary Spreadsheet covers 227 Flex Numbers; the 87 experimental-table "
        "rows cover 79 of them. Overlapping tests keep both sources with their own locators.",
        "Spreadsheet columns without a declared unit and formula columns are kept raw "
        "and marked needs_review. Camera settings are not imported.",
    ],
}


def show(value: str | None) -> str:
    """Shortest decimal form of a stored number; other text unchanged."""
    if value is None:
        return "unknown"
    try:
        number = Decimal(value.strip())
    except InvalidOperation:
        return " ".join(value.split())
    if not number.is_finite():
        return value.strip()
    return (
        str(int(number)) if number == number.to_integral_value() else format(float(number), ".15g")
    )


def as_number(value: str | None, *, signed: bool = True) -> float | None:
    try:
        number = Decimal((value or "").strip())
    except InvalidOperation:
        return None
    if not number.is_finite() or (not signed and number < 0):
        return None
    return float(number)


def letters(column: int) -> str:
    out = ""
    while column:
        column, rest = divmod(column - 1, 26)
        out = chr(65 + rest) + out
    return out


def _bre_days(root: Path) -> set[date]:
    days = set()
    text = (root / BRE_DAY_TABLE).read_text(encoding="utf-8")
    for row in csv.DictReader(io.StringIO(text)):
        month = MONTHS.get((row.get("Month") or "").strip()[:3].lower())
        if (
            month
            and row.get("Year", "").strip().isdigit()
            and row.get("Date", "").strip().isdigit()
        ):
            days.add(date(int(row["Year"]), month, int(row["Date"])))
    if not days:
        raise ValueError("BRE day-summary table yielded no dates")
    return days


def build_unified_release(
    root: Path = RESEARCH_ROOT,
    *,
    context_root: Path = CONTEXT_ROOT,
    extra_root: Path = EXTRA_ROOT,
    psi_files_root: Path = PSI_FILES_ROOT,
    parser_version: str = PARSER_VERSION,
) -> dict:
    """Build offline; every admitted byte is checked against its recorded hash."""
    release = build_coverage_release(root, context_root=context_root, extra_root=extra_root)
    base_revision = release["revision"]
    studies = {s["id"]: s for s in release["investigations"]}
    manifest_bytes = (psi_files_root / "psi-files-manifest.json").read_bytes()
    manifest = json.loads(manifest_bytes)
    for listing in manifest["file_manifests"]:
        packed = (psi_files_root / listing["local_path"]).read_bytes()
        data = gzip.decompress(packed)
        if (
            digest(packed) != listing["stored_sha256"]
            or digest(data) != listing["sha256"]
            or len(data) != listing["downloaded_bytes"]
        ):
            raise ValueError(f"PSI file-manifest hash/size mismatch: {listing['local_path']}")
    entries = {a["file_name"]: a for a in manifest["artifacts"]}
    expected = {*BRE_WORKBOOKS, CFI_SPREADSHEET}
    if set(entries) != expected:
        raise ValueError(f"PSI file manifest must list exactly {sorted(expected)}")

    def load(file_name: str, slug: str):
        entry = entries[file_name]
        data = (psi_files_root / entry["local_path"]).read_bytes()
        if digest(data) != entry["sha256"] or len(data) != entry["downloaded_bytes"]:
            raise ValueError(f"PSI file hash/size mismatch: {file_name}")
        if SLUGS.get(entry["accession"]) != slug or not file_name.startswith(
            entry["accession"] + "_"
        ):
            raise ValueError(f"PSI file identity mismatch: {file_name}")
        if entry["license"] != "CC0-1.0" or studies[slug]["license"] != "CC0-1.0":
            raise ValueError(f"PSI file requires admitted CC0 study rights: {file_name}")
        src = {
            "id": uid(f"source:{entry['accession']}:{file_name}:{entry['sha256']}"),
            "investigationId": slug,
            "filename": file_name,
            "sha256": entry["sha256"],
            "fileVersion": entry["file_version"],
            "studyVersion": entry["study_version"],
            "sourceUrl": entry["source_url"],
            "license": "CC0-1.0",
            "rightsScope": "PSI source-specific rights; "
            "linked external publications are not ingested.",
            "kind": entry["kind"],
            "byteCount": len(data),
            "status": "source_checked",
            "doi": None,
            "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        release["sources"].append(src)
        release["_artifacts"][src["sha256"]] = data
        return src, read_workbook(data)

    def chunk(src, locator, text, heading, type_="test_record"):
        for first, last, body in (
            [(1, 1, text)]
            if len(text) <= CHUNK_POLICY["maxChars"]
            else _sentence_windows(text, CHUNK_POLICY["maxChars"])
        ):
            loc = locator if first == last == 1 else f"{locator}; {_span('sentence', first, last)}"
            release["chunks"].append(
                {
                    "id": uid(f"chunk:{src['id']}:{loc}:{digest(body.encode())}"),
                    "sourceId": src["id"],
                    "investigationId": src["investigationId"],
                    "locator": loc,
                    "sourceRef": src["sourceUrl"],
                    "text": body,
                    "heading": heading,
                    "type": type_,
                    "status": "source_checked",
                    "contextual": heading,
                }
            )

    def observe(run, src, name, cell, unit, *, numeric=True, reviewed=True, raw_value=None):
        value = as_number(cell.value) if numeric and cell is not None else None
        derived = cell is not None and cell.formula
        run["observations"].append(
            {
                "name": name,
                "raw": raw_value if raw_value is not None else (cell.value or "" if cell else ""),
                "value": value,
                "unit": unit if value is not None else None,
                "originalUnit": unit,
                "sourceId": src["id"],
                "locator": cell.locator if cell is not None else "",
                "status": "source_checked" if reviewed and not derived else "needs_review",
            }
        )

    def new_run(slug, src, row, raw, key, record_kind, locator, **conditions):
        run = {
            "id": "pending-final-revision",
            "investigationId": slug,
            "externalRunKey": key,
            "sourceId": src["id"],
            "rowNumber": row,
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
                "locator": locator,
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

    # --- ACME BRE chamber test points (PSI-20) ----------------------------------------
    bre_days = _bre_days(root)
    for workbook in BRE_WORKBOOKS:
        src, book = load(workbook, "bre")
        grid = rows(book["EventData"])
        groups, group, names = {}, "", {}
        for col in sorted(set(grid.get(2, {})) | set(grid.get(3, {}))):
            if col in grid.get(2, {}):
                group = " ".join(grid[2][col].value.split())
            groups[col] = group
            if col in grid.get(3, {}):
                names[col] = " ".join(grid[3][col].value.split())
        by_name = {(groups[c], n): c for c, n in names.items()}

        def col(name, group=None, *, _by_name=by_name, _names=names, _book=workbook):
            if group is not None:
                return _by_name[(group, name)]
            matches = [c for c, n in _names.items() if n == name]
            if len(matches) != 1:
                raise ValueError(f"BRE header {name!r} is not unique in {_book}")
            return matches[0]

        c_op, c_ign, c_id = col("OP"), col("Ignite"), col("TPID")
        c_t0, c_t1, c_p0, c_p1 = (
            col("Tstart (GMT)"),
            col("Tend (GMT)"),
            col("Pstart (psia)"),
            col("Pend (psia)"),
        )
        c_fuel, c_watt, c_ms, c_burn = (
            col("Fuel Type"),
            col("Igniter Wattage"),
            col("Igniter On Time (ms)"),
            col("Burn Fraction"),
        )
        finish = sorted(c for c in names if groups[c] == "Finish Mixture (Percent)")
        temps = sorted(c for c in names if "(°C)" in names[c])
        for r in sorted(grid):
            row = grid[r]
            if r < 5 or c_op not in row or row[c_op].value != "TP":
                continue
            if c_id not in row:
                raise ValueError(f"BRE test point without TPID at EventData row {r}")
            raw = {
                f"{groups.get(c) or 'Column'} / {names.get(c) or letters(c)}": cell.value
                for c, cell in sorted(row.items())
            }
            key = row[c_id].value
            fuel = row.get(c_fuel)
            pressure = row.get(c_p0)
            run = new_run(
                "bre",
                src,
                r,
                raw,
                key,
                "chamber_test_point",
                f"xlsx 'EventData' row {r}",
                material=fuel.value if fuel else "Unknown",
                oxygenContext="chamber",
                pressurePsi=as_number(pressure.value, signed=False) if pressure else None,
                pressureConversion="as recorded (psia, telemetry FCU_MP_PT28)"
                if pressure
                else None,
            )
            run["workbook"] = workbook
            observe(
                run, src, "ignite_decision", row.get(c_ign), "operations decision", numeric=False
            )
            for name, c, unit in (
                ("chamber_pressure_start", c_p0, "psia"),
                ("chamber_pressure_end", c_p1, "psia"),
                ("igniter_wattage", c_watt, "W"),
                ("igniter_on_time", c_ms, "ms"),
            ):
                if c in row:
                    observe(run, src, name, row[c], unit)
            for c in temps:
                if c in row:
                    label = names[c].split(" (")[0].lower()
                    observe(run, src, f"chamber_temperature_{label}", row[c], "°C")
            if c_burn in row:
                observe(
                    run, src, "burn_fraction_calculator", row[c_burn], "fraction", reviewed=False
                )
            mix = []
            for c in finish:
                if c in row:
                    gas = names[c].lstrip("_")
                    observe(
                        run,
                        src,
                        f"finish_mixture_{gas.lower()}_calculator",
                        row[c],
                        "fraction of 1 (block labelled Percent; calculator, standard volume)",
                        reviewed=False,
                    )
                    if as_number(row[c].value):
                        mix.append(f"{gas} {show(row[c].value)}")
            run["issues"].append(
                "Calculator compositions and Burn Fraction are derived values, not measurements; "
                "no oxygen condition is set. Pstart is the recorded chamber pressure."
            )
            start = row.get(c_t0)
            try:
                day = date.fromisoformat((start.value if start else "")[:10])
            except ValueError:
                day = None
            if day is None:
                run["issues"].append("Test point start time could not be read as a GMT date.")
            elif not {day - timedelta(days=1), day, day + timedelta(days=1)} & bre_days:
                run["issues"].append(
                    "Test point date is not within one day of any PSI-20 BRE day-summary date; "
                    "it may belong to another ACME chamber operation."
                )
            parts = [
                f"{label}: {show(row[c].value)}"
                for label, c in (
                    ("Ignite", c_ign),
                    ("Tstart (GMT)", c_t0),
                    ("Tend (GMT)", c_t1),
                    ("Pstart (psia)", c_p0),
                    ("Pend (psia)", c_p1),
                    ("Fuel Type", c_fuel),
                    ("Igniter Wattage", c_watt),
                    ("Igniter On Time (ms)", c_ms),
                    ("Burn Fraction (calculator)", c_burn),
                )
                if c in row
            ]
            if mix:
                parts.append("Finish mixture fractions (calculator): " + ", ".join(mix))
            chunk(
                src,
                f"xlsx 'EventData' row {r}",
                f"{key} [bre] ACME chamber test point, {workbook.split(' - ', 1)[1][:-5]}, "
                f"EventData row {r}. " + "; ".join(parts),
                f"{key} bre chamber test point",
            )

    # --- CFI Data Summary Spreadsheet (PSI-39) ----------------------------------------
    src, book = load(CFI_SPREADSHEET, "cfi")
    sheets = {}
    for name in ("Master Sheet", "DATA", "Igniter", "Comments"):
        grid = rows(book[name])
        header = {c: " ".join(cell.value.split()) for c, cell in grid[1].items()}
        keyed = {}
        for r in sorted(grid):
            if r > 1 and 1 in grid[r]:
                keyed[grid[r][1].value] = (r, grid[r])
        sheets[name] = (header, keyed)
    keys = list(sheets["Master Sheet"][1])
    if any(list(sheets[s][1]) != keys for s in sheets) or len(set(keys)) != len(keys):
        raise ValueError("CFI spreadsheet sheets must list the same unique Flex Numbers")
    existing: dict[str, list[dict]] = {}
    for record in release["runs"]:
        if record["investigationId"] == "cfi":
            existing.setdefault(record["externalRunKey"], []).append(record)
    m_header = sheets["Master Sheet"][0]
    for key in keys:
        m_row, m_cells = sheets["Master Sheet"][1][key]
        master = {m_header[c]: cell.value for c, cell in sorted(m_cells.items()) if c in m_header}
        locator = f"xlsx 'Master Sheet' row {m_row}"
        targets = existing.get(key, [])
        for run in targets:
            for field, value in master.items():
                if field == "Test Date":
                    continue  # Excel serial vs text date in the CSV; both kept as written
                if field in run["raw"] and show(run["raw"][field]) != show(value):
                    run["issues"].append(
                        f"Source difference for {field}: experimental-table CSV "
                        f"{run['raw'][field]!r}, spreadsheet {value!r} ({locator}); "
                        "no value selected."
                    )
            run["issues"].append(
                f"Also in the CFI Data Summary Spreadsheet ({locator}); spreadsheet observations "
                "are attached to the first CSV row for this Flex Number with their own locators."
            )
        if targets:
            run = targets[0]
        else:
            pressure = _unit_number(master.get("Pressure"), "atm")
            run = new_run(
                "cfi",
                src,
                m_row,
                master,
                key,
                "test_record",
                locator,
                material=master.get("Fuel") or "Unknown",
                oxygenContext="chamber",
                pressurePsi=float(
                    Decimal(str(pressure)) * Decimal("101325") / Decimal("6894.757293168")
                )
                if pressure is not None
                else None,
                pressureConversion="atm × 101325 / 6894.757293168 → psia"
                if pressure is not None
                else None,
            )
            for name, field in (
                ("oxygen_fraction_unconfirmed_basis", "Oxygen"),
                ("helium_fraction_unconfirmed_basis", "Helium"),
            ):
                cell = next((x for c, x in m_cells.items() if m_header.get(c) == field), None)
                observe(run, src, name, cell, "fraction (basis not declared)", reviewed=False)
            run["issues"].append(
                "Gas composition basis is not declared in this source; "
                "no exact oxygen condition inferred. Test Date is an Excel serial number."
            )
        d_header, d_keyed = sheets["DATA"]
        d_row, d_cells = d_keyed[key]
        summary = []
        for c, cell in sorted(d_cells.items()):
            label = d_header.get(c)
            if not label or c == 1:
                continue
            unit_match = re.search(r"\(\s*([^)]*?)\s*\)", label)
            unit = unit_match.group(1) if unit_match else "not declared"
            name = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
            observe(run, src, f"cfi_summary_{name}", cell, unit, reviewed=bool(unit_match))
            summary.append(f"{label}: {show(cell.value)}{' (formula)' if cell.formula else ''}")
        i_header, i_keyed = sheets["Igniter"]
        for c, cell in sorted(i_keyed[key][1].items()):
            label = i_header.get(c, "")
            for unit in ("W", "ms"):
                if f"( {unit} )" in label:
                    value = _unit_number(cell.value, unit)
                    run["observations"].append(
                        {
                            "name": "igniter_power" if unit == "W" else "igniter_time",
                            "raw": cell.value,
                            "value": value,
                            "unit": unit if value is not None else None,
                            "originalUnit": unit,
                            "sourceId": src["id"],
                            "locator": cell.locator,
                            "status": "source_checked",
                        }
                    )
                    summary.append(f"{label}: {cell.value}")
        chunk(
            src,
            f"{locator}; 'DATA' row {d_row}",
            f"CFI Flex Number {key} [cfi] CFI Data Summary Spreadsheet, Master Sheet row {m_row}. "
            + "; ".join(
                f"{k}: {show(v)}{' (Excel serial date)' if k == 'Test Date' else ''}"
                for k, v in master.items()
                if k != "Flex Number"
            )
            + ". "
            + "; ".join(summary),
            f"{key} cfi",
        )
        c_header, c_keyed = sheets["Comments"]
        for c, cell in sorted(c_keyed[key][1].items()):
            if c_header.get(c) == "Comments":
                chunk(
                    src,
                    cell.locator,
                    f"CFI Flex Number {key} comment: " + " ".join(cell.value.split()),
                    f"{key} cfi comment",
                    "passage",
                )

    # --- Duplicate keys, study coverage and limitations -------------------------------
    new_runs = [r for r in release["runs"] if r["id"] == "pending-final-revision"]
    counts = Counter((r["investigationId"], r["externalRunKey"]) for r in new_runs)
    for run in new_runs:
        if counts[run["investigationId"], run["externalRunKey"]] > 1:
            run["issues"].append(
                "Duplicate external test key occurs in multiple source rows; "
                "each row is retained without assuming independent experiments."
            )
    for slug, notes in STUDY_LIMITATIONS.items():
        studies[slug].setdefault("limitations", []).extend(notes)
    for slug in STUDY_LIMITATIONS:
        study = studies[slug]
        records = [r for r in release["runs"] if r["investigationId"] == slug]
        study["runCount"] = len(records)
        study["coverage"] = "run_level_pilot" if records else "metadata_only"
        study["evidenceCoverage"] = {
            **study.get("evidenceCoverage", {}),
            "metadata": True,
            "records": len(records),
            "reviewed": 0,
        }

    # --- Final revision and identities ------------------------------------------------
    revision = digest(
        json.dumps(
            {
                "parser": parser_version,
                "baseRevision": base_revision,
                "psiFilesManifest": digest(manifest_bytes),
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
        "Official resources only: PSI files and PSI metadata. "
        "External publications are not ingested.",
        "ACME Chamber Calculator compositions are calculator-derived, "
        "not measured cabin conditions.",
    ]
    return release


__all__ = ["build_unified_release", "column_index"]
