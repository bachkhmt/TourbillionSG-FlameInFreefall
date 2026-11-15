"""Deterministic research inventory over published source bytes, not generated findings."""

from copy import deepcopy

from app.schemas.mission_projection import ScenarioInput
from app.schemas.mission_research import ResearchBriefInput, ResearchBriefRead
from app.services.mission_matching import analyze

ENGINE_VERSION = "research-brief-v1"
METHOD = [
    "The selected purpose filters catalog classifications. The free-text question labels this "
    "brief; it does not perform semantic search or establish relevance to every phrase.",
    "Quoted passages are source context, classification or objectives, not verified findings. "
    "Recorded observations preserve original values, units and review flags.",
    "Only CC0-1.0 sources belonging to the investigation are used as evidence. "
    "Data availability and independently reviewed record counts are reported separately.",
    "Without a target scenario, studies are ordered by public identifier and conditions are "
    "not compared. With a target, the existing same-record lookup chooses one record per study "
    "by matched dimensions plus half-weight related dimensions, then external record key. "
    "Studies are ordered by that coverage, fewer mismatches, then public identifier. "
    "No composite record is formed and no score represents fire risk or probability.",
    "Lookup tolerances: oxygen ±0.5 percentage points with compatible basis and chamber scope; "
    "pressure ±0.2 psia; airflow ±0.5 cm/s with compatible apparatus scope. Gravity and material "
    "use the existing exact-value/alias rules. A microgravity regime is related, not measured 0g.",
]
LIMITATIONS = [
    "Research screening only. This brief does not certify spacecraft safety or predict fire risk.",
    "Unknown values, incompatible measurement scopes and conflicts are not condition matches.",
    "A best record is a lookup example, not a representative result or a pooled study conclusion.",
    "Objectives and metadata do not establish experimental outcomes. Review original artifacts "
    "before interpreting observations or comparing different geometries and measurements.",
]


def build_research_brief(release: dict, request: ResearchBriefInput) -> ResearchBriefRead:
    sources = {s["id"]: s for s in release["sources"] if s.get("license") == "CC0-1.0"}
    citations: dict[tuple[str, str], dict] = {}

    def cite(source_id, locator, study_id):
        source = sources.get(source_id)
        if not source or source["investigationId"] != study_id or not locator:
            return None
        key = (source_id, locator)
        if key not in citations:
            citations[key] = {
                "id": f"ref-{len(citations) + 1}",
                "source": source,
                "locator": locator,
            }
        return citations[key]["id"]

    studies = sorted(
        (s for s in release["investigations"] if request.workflowId in s.get("pillars", [])),
        key=lambda s: s["id"],
    )
    study_ids = {s["id"] for s in studies}
    admitted_runs = [
        r
        for r in release["runs"]
        if r["investigationId"] in study_ids
        and r["sourceId"] in sources
        and sources[r["sourceId"]]["investigationId"] == r["investigationId"]
    ]
    best = {}
    if request.scenario:
        scenario = ScenarioInput(**request.scenario.model_dump(), pillar=request.workflowId)
        lookup_runs = deepcopy(admitted_runs)
        for run in lookup_runs:
            conditions = run["conditions"]
            origin = sources.get(conditions.get("sourceId"))
            if (
                not origin
                or origin["investigationId"] != run["investigationId"]
                or not conditions.get("locator")
            ):
                for field in ("oxygenPct", "pressurePsi", "airflowCmS", "material"):
                    conditions[field] = None
            gravity_origin = sources.get(conditions.get("gravitySourceId"))
            if not gravity_origin or gravity_origin["investigationId"] != run["investigationId"]:
                conditions["gravityG"] = None
                conditions["gravityRegime"] = "unknown"
        lookup = analyze({**release, "runs": lookup_runs}, scenario)
        best = {c["investigationId"]: c for c in lookup["investigations"]}
    run_by_id = {r["id"]: r for r in admitted_runs}
    rows = []
    for study in studies:
        study_id = study["id"]
        passages = []
        seen = set()
        for kind, entries in (
            ("purpose", (study.get("classification") or {}).get("evidence", [])),
            ("context", study.get("summary", [])),
            ("objective", study.get("objectives", [])),
        ):
            for passage in entries[:2]:
                citation = cite(passage.get("sourceId"), passage.get("locator"), study_id)
                key = (passage.get("text"), citation, kind)
                if citation and passage.get("text") and key not in seen:
                    passages.append({"text": passage["text"], "citationId": citation, "kind": kind})
                    seen.add(key)
        records = [r for r in admitted_runs if r["investigationId"] == study_id]
        total_records = sum(r["investigationId"] == study_id for r in release["runs"])
        candidate = best.get(study_id)
        record = run_by_id.get(candidate["runId"]) if candidate else None
        record_view = None
        dimensions = []
        if record and candidate:
            record_citation = cite(record["sourceId"], f"CSV row {record['rowNumber']}", study_id)
            for dimension in candidate["dimensions"]:
                d = {
                    k: v for k, v in dimension.items() if k not in {"sourceId", "locator", "regime"}
                }
                d["citationId"] = cite(
                    dimension.get("sourceId"), dimension.get("locator"), study_id
                )
                d["reason"] = dimension_reason(
                    dimension, record["conditions"], request.scenario.oxygenBasis
                )
                dimensions.append(d)
            observations = []
            for observation in record.get("observations", []):
                citation = cite(observation.get("sourceId"), observation.get("locator"), study_id)
                if citation:
                    observations.append({**observation, "citationId": citation})
            record_view = {
                "id": record["id"],
                "externalRunKey": record["externalRunKey"],
                "citationId": record_citation,
                "recordKind": record.get("recordKind", "source_record"),
                "observations": observations,
                "issues": record.get("issues", []),
            }
        coverage = study.get("evidenceCoverage") or {}
        limitations = list(study.get("limitations", []))
        if not any(p["kind"] == "purpose" for p in passages):
            limitations.append(
                "No admitted source passage explains this catalog purpose annotation."
            )
        if not records:
            limitations.append("No admitted source records are available for condition comparison.")
        if total_records > len(records):
            limitations.append("Records without admitted same-study CC0 sources were excluded.")
        rows.append(
            {
                "investigationId": study_id,
                "code": study["code"],
                "title": study["title"],
                "purpose": request.workflowId,
                "selectionReason": f"Catalog classified for {request.workflowId}; inspect the "
                "cited purpose context before applying it to your question.",
                "passages": passages,
                "availability": {
                    "records": len(records),
                    "documents": sum(
                        s["investigationId"] == study_id
                        and s["kind"] in {"psi_metadata", "source_document", "configuration_table"}
                        for s in sources.values()
                    ),
                    "excludedRecords": total_records - len(records),
                    "independentlyReviewedRecords": coverage.get("reviewed"),
                },
                "conditionStatus": "not_requested"
                if not request.scenario
                else "no_records"
                if not candidate
                else "exact"
                if all(d["status"] == "match" for d in dimensions)
                else "partial",
                "dimensions": dimensions,
                "record": record_view,
                "limitations": limitations,
            }
        )
    if request.scenario:
        rows.sort(
            key=lambda row: (
                -sum(
                    1 if d["status"] == "match" else 0.5 if d["status"] == "related" else 0
                    for d in row["dimensions"]
                ),
                sum(d["status"] == "mismatch" for d in row["dimensions"]),
                row["investigationId"],
            )
        )
    next_steps = [
        "Read cited context and objectives; identify outcome evidence in the original artifacts.",
        "Check material, geometry, sensor observable and measurement scope "
        "before comparing studies.",
        "Ask a domain reviewer to assess any proposed interpretation or application.",
    ]
    if not rows:
        next_steps.insert(
            0,
            "No studies are classified for this purpose in this release. "
            "Browse the catalog or select a release with purpose annotations.",
        )
    elif not request.scenario:
        next_steps.insert(
            0, "Optionally supply explicit target conditions to inspect same-record gaps."
        )
    else:
        unknown = sorted(
            {d["dimension"] for r in rows for d in r["dimensions"] if d["status"] == "unknown"}
        )
        if unknown:
            next_steps.insert(
                0,
                "Seek original measurements or clarified metadata for: " + ", ".join(unknown) + ".",
            )
    return ResearchBriefRead.model_validate(
        {
            "revision": release["revision"],
            "engineVersion": ENGINE_VERSION,
            "workflowId": request.workflowId,
            "question": request.question,
            "scenario": request.scenario,
            "method": METHOD,
            "rows": rows,
            "citations": list(citations.values()),
            "limitations": list(dict.fromkeys([*LIMITATIONS, *release.get("limitations", [])])),
            "nextSteps": next_steps,
        }
    )


def dimension_reason(dimension: dict, conditions: dict, target_basis: str) -> str:
    name, status = dimension["dimension"], dimension["status"]
    field = {
        "oxygen": "oxygenPct",
        "pressure": "pressurePsi",
        "airflow": "airflowCmS",
        "gravity": "gravityG",
        "material": "material",
    }[name]
    if field in conditions.get("conflictedFields", []):
        return "Conflicting source values; condition remains unknown."
    if name == "oxygen" and dimension.get("basis") != target_basis:
        return "Oxygen basis unavailable or incompatible."
    if name == "oxygen" and status == "unknown" and dimension.get("observed") is not None:
        return "Oxygen basis or measurement scope is incompatible with the target."
    if name == "airflow" and status == "unknown" and dimension.get("observed") is not None:
        return "Apparatus flow scope is incompatible with the target."
    if name == "gravity" and status == "related":
        return "Project reports a microgravity regime; exact 0g was not measured in this record."
    if name == "gravity" and dimension.get("observed") is None and status == "mismatch":
        return "A microgravity regime does not establish the requested partial/Earth gravity."
    return {
        "match": "Matches the explicit target under the documented lookup rules.",
        "unknown": "Missing, ambiguous or incompatible source value; not a match.",
        "mismatch": "Reported condition differs from the explicit target.",
        "related": "Related context, without an exact measured condition match.",
    }[status]
