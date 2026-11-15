"""Transparent research navigation; never combine conditions from different records."""

RESEARCH_ENGINE_VERSION = "research-relevance-v1"
SCORING = (
    "Navigation heuristic: selected purpose 60 points (all purposes 30), imported records 20, "
    "context documents 10, best same-record condition score / 10 (maximum 10). "
    "Scores are research relevance, not fire risk, probabilities or scientific validation. "
    "Mission labels do not add points. Ties are ordered by investigation slug."
)


def rank_studies(release: dict, scenario, best_runs: dict) -> list[dict]:
    ranks = []
    source_ids = {s["id"] for s in release.get("sources", [])}
    for study in release.get("investigations", []):
        pillars = study.get("pillars", [])
        if scenario.pillar != "all" and scenario.pillar not in pillars:
            continue
        records = [r for r in release["runs"] if r["investigationId"] == study["id"]]
        sources = [s for s in release["sources"] if s["investigationId"] == study["id"]]
        documents = [
            s
            for s in sources
            if s["kind"] in {"psi_metadata", "source_document", "configuration_table"}
            and s.get("license") == "CC0-1.0"
        ]
        best = best_runs.get(study["id"])
        run = next((r for r in records if best and r["id"] == best["runId"]), None)
        reasons = []
        evidence = (study.get("classification") or {}).get("evidence", [])
        for reason in [*evidence, *study.get("summary", []), *study.get("objectives", [])]:
            if reason.get("sourceId") in source_ids and reason.get("locator"):
                item = {key: reason[key] for key in ("text", "sourceId", "locator")}
                if item not in reasons:
                    reasons.append(item)
        if not reasons:
            reasons = [
                {
                    "text": f"{study['code']}: catalog context; purpose has not been classified.",
                    "sourceId": study["metadataSourceId"],
                    "locator": f"investigations/{study['psiId']}",
                }
            ]
        purpose_score = 30 if scenario.pillar == "all" else 60
        score = purpose_score + (20 if records else 0) + (10 if documents else 0)
        score += best["score"] / 10 if best else 0
        dims = best["dimensions"] if best else []
        coverage = {
            "runId": best["runId"] if best else None,
            "sourceId": run["sourceId"] if run else None,
            "locator": f"CSV row {run['rowNumber']}" if run else None,
            "matched": sum(d["status"] == "match" for d in dims),
            "unknown": sum(d["status"] == "unknown" for d in dims) if dims else 5,
            "mismatched": sum(d["status"] == "mismatch" for d in dims),
            "related": sum(d["status"] == "related" for d in dims),
        }
        ranks.append(
            {
                "investigationId": study["id"],
                "pillars": pillars,
                "relevanceScore": min(100, score),
                "reasons": reasons[:3],
                "coverage": coverage,
                "evidenceLevel": "source_records"
                if records
                else "documents"
                if documents
                else "metadata_only",
                "reviewStatus": "source_checked_not_independently_reviewed",
            }
        )
    return sorted(ranks, key=lambda item: (-item["relevanceScore"], item["investigationId"]))
