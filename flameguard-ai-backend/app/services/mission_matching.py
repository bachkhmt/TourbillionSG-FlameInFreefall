"""Explicit lookup tolerances, not a scientific prediction or a safety classifier."""

from decimal import Decimal

from app.schemas.mission_projection import ScenarioInput
from app.services.mission_ranking import RESEARCH_ENGINE_VERSION, SCORING, rank_studies

ALIASES = {
    "heptan": "heptane",
    "heptane": "heptane",
    "meoh": "methanol",
    "methanol": "methanol",
    "pmma": "pmma",
    "ethane": "ethane",
}


def material_name(text: str) -> str:
    folded = text.strip().casefold()
    if "pmma" in folded.split():  # explicit material token, not all polymers
        return "pmma"
    return ALIASES.get(folded, folded)


def analyze(release: dict, scenario: ScenarioInput) -> dict:
    candidates = []
    for run in release["runs"]:
        c = run["conditions"]
        dimensions = []
        for name, field, unit, tolerance in (
            ("oxygen", "oxygenPct", "%", "0.5"),
            ("pressure", "pressurePsi", "psia", "0.2"),
            ("airflow", "airflowCmS", "cm/s", "0.5"),
        ):
            target, actual = getattr(scenario, field), c.get(field)
            status = (
                "unknown"
                if actual is None
                else (
                    "match"
                    if abs(Decimal(str(actual)) - Decimal(str(target))) <= Decimal(tolerance)
                    else "mismatch"
                )
            )
            if name == "oxygen" and c.get("oxygenBasis") != scenario.oxygenBasis:
                status = "unknown"
            if name == "oxygen" and c.get("oxygenContext", "chamber") not in {
                "chamber",
                "ambient",
                "experiment_chamber",
            }:
                status = "unknown"
            if name == "airflow" and c.get("flowContext", "experiment_duct") not in {
                "experiment_duct",
                "ambient",
                "cabin",
            }:
                status = "unknown"
            if field in c.get("conflictedFields", []):
                status = "unknown"
            dimensions.append(
                {
                    "dimension": name,
                    "status": status,
                    "target": target,
                    "observed": actual,
                    "unit": unit,
                    "tolerance": float(tolerance),
                    "basis": c.get("oxygenBasis") if name == "oxygen" else None,
                    "sourceId": c.get("sourceId"),
                    "locator": c.get("locator"),
                }
            )
        gravity = c.get("gravityG")
        if gravity is not None:
            status = "match" if gravity == scenario.gravityG else "mismatch"
        elif c.get("gravityRegime") == "microgravity":
            status = "related" if scenario.gravityG == 0 else "mismatch"
        else:
            status = "unknown"
        dimensions.append(
            {
                "dimension": "gravity",
                "status": status,
                "target": scenario.gravityG,
                "observed": gravity,
                "regime": c.get("gravityRegime"),
                "unit": "g",
                "tolerance": 0,
                "sourceId": c.get("gravitySourceId"),
                "locator": "Project metadata regime; exact g not measured here",
            }
        )
        material = c.get("material")
        dimensions.append(
            {
                "dimension": "material",
                "status": "unknown"
                if not material or material_name(material) in {"unknown", "not reported", "n/a"}
                else "match"
                if material_name(material) == material_name(scenario.material)
                else "mismatch",
                "target": scenario.material,
                "observed": material,
                "sourceId": c.get("sourceId"),
                "locator": c.get("locator"),
            }
        )
        exact = all(d["status"] == "match" for d in dimensions)
        matched = sum(d["status"] == "match" for d in dimensions)
        related = sum(d["status"] == "related" for d in dimensions)
        candidates.append(
            {
                "runId": run["id"],
                "investigationId": run["investigationId"],
                "externalRunKey": run["externalRunKey"],
                "status": "MATCH" if exact else "PARTIAL" if matched else "GAP",
                "score": (matched + related * 0.5) * 20,
                "dimensions": dimensions,
                "issues": run["issues"],
            }
        )
    candidates.sort(key=lambda c: (-c["score"], c["externalRunKey"]))
    best = {}
    for candidate in candidates:
        best.setdefault(candidate["investigationId"], candidate)
    return {
        "revision": release["revision"],
        "engineVersion": "pilot-match-v1",
        "exactMatchCount": sum(c["status"] == "MATCH" for c in candidates),
        "candidates": candidates[:10],
        "investigations": list(best.values()),
        "studyRankings": rank_studies(release, scenario, best),
        "researchEngineVersion": RESEARCH_ENGINE_VERSION,
        "scoring": SCORING,
        "notice": "Lookup within this pilot only. Unknown conditions are not matches. "
        "Tolerances are demo search settings, not scientific validation or safety advice.",
        "prediction": {"available": False, "reason": "No validated model artifact installed"},
    }
