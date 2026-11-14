"""Lossless offline bundle plus a read-only snapshot matching upstream's 21 tables.

No database/network calls. Raw/context artifacts and the complete release payload
retain fields the upstream schema cannot represent. This grants no review status.
"""

import argparse
import hashlib
import json
from pathlib import Path

from app.models import Base
from app.services.demo_manifest import snapshot_rows

from .challenge import build_challenge_release
from .coverage import build_coverage_release
from .pilot import uid
from .unified import build_unified_release

# "unified" is the default dataset for web + RAG (official resources only);
# "coverage" and "challenge" rebuild the earlier releases unchanged.
BUILDERS = {
    "unified": build_unified_release,
    "coverage": build_coverage_release,
    "challenge": build_challenge_release,
}


def build_snapshot(release):
    tables = {table.name: [] for table in Base.metadata.sorted_tables}
    studies = {s["id"]: s["uuid"] for s in release["investigations"]}
    for study in release["investigations"]:
        tables["investigation"].append(
            {
                "id": study["uuid"],
                "psi_id": study["psiId"],
                "title": study["title"],
                "research_purpose": study["researchArea"],
                "platform": study["platform"],
            }
        )
    for source in release["sources"]:
        tables["source_document"].append(
            {
                "id": source["id"],
                "investigation_id": studies[source["investigationId"]],
                "source_url": source["sourceUrl"],
                "doi": source.get("doi"),
                "document_type": source["kind"],
                "version": (
                    f"study:{source['studyVersion']}/file:{source['fileVersion']}"
                    f"/sha256:{source['sha256']}"
                ),
                "ingestion_status": "source_checked",
            }
        )
    for run in release["runs"]:
        tables["test_run"].append(
            {
                "id": run["id"],
                "investigation_id": studies[run["investigationId"]],
                "external_run_key": run["externalRunKey"],
                "material_type": run["conditions"]["material"],
                "sample_geometry": run.get("sampleGeometry"),
                "gravity": run["conditions"]["gravityRegime"],
            }
        )
        for name, unit in (
            ("oxygenPct", run["conditions"]["oxygenBasis"]),
            ("pressurePsi", "psia"),
            ("airflowCmS", "cm/s"),
        ):
            value = run["conditions"].get(name)
            if value is not None:
                tables["test_condition"].append(
                    {
                        "id": uid(f"{run['id']}:condition:{name}"),
                        "test_run_id": run["id"],
                        "variable": name,
                        "value_numeric": str(value),
                        "value_text": None,
                        "unit": unit,
                        "data_status": "source_checked",
                    }
                )
        for index, observation in enumerate(run["observations"]):
            tables["measurement"].append(
                {
                    "id": uid(f"{run['id']}:observation:{index}"),
                    "test_run_id": run["id"],
                    "observable": observation["name"],
                    "measured_value": None
                    if observation["value"] is None
                    else str(observation["value"]),
                    "unit": observation["originalUnit"],
                    "raw_asset_ref": f"{observation['sourceId']}#{observation['locator']}",
                    "uncertainty": None,
                }
            )
    for index, chunk in enumerate(release["chunks"]):
        tables["document_chunk"].append(
            {
                "id": chunk["id"],
                "source_document_id": chunk["sourceId"],
                "chunk_index": index,
                "source_locator": chunk["locator"],
                "chunk_text": chunk["text"],
                "embedding_ref": None,
            }
        )
    return {
        "collectionId": "nasa-challenge-" + release["revision"][:16],
        "origin": "real",
        "version": 1,
        "tables": tables,
    }


def export_bundle(destination, profile="unified"):
    destination = Path(destination)
    if destination.exists():
        raise ValueError("Output already exists; choose a new directory")
    release = BUILDERS[profile]()
    snapshot = build_snapshot(release)
    destination.mkdir(parents=True)
    (destination / "artifacts").mkdir()
    for digest, data in release["_artifacts"].items():
        if hashlib.sha256(data).hexdigest() != digest:
            raise ValueError("Artifact hash mismatch")
        (destination / "artifacts" / digest).write_bytes(data)
    payload = {key: value for key, value in release.items() if not key.startswith("_")}
    for name, value in {
        "release.json": payload,
        "snapshot.json": snapshot,
        "slugs.json": {
            "collectionId": snapshot["collectionId"],
            "version": 1,
            "entries": [{"psiId": s["psiId"], "slug": s["id"]} for s in release["investigations"]],
        },
        "manifest.json": {
            "sourceRevision": release["revision"],
            "origin": "real",
            "reviewState": "unreviewed",
            "schemaTables": 21,
            "limitations": release["limitations"],
            "unmappedFields": (
                "Complete originals, raw strings, context and telemetry are in "
                "release.json/artifacts; no upstream asset contract."
            ),
        },
    }.items():
        (destination / name).write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    snapshot_rows(destination / "snapshot.json")
    checksums = {
        str(p.relative_to(destination)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(destination.rglob("*"))
        if p.is_file()
    }
    (destination / "checksums.json").write_text(
        json.dumps(checksums, indent=2) + "\n", encoding="utf-8"
    )
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--profile", choices=sorted(BUILDERS), default="unified")
    args = parser.parse_args()
    print(export_bundle(args.output, args.profile))
