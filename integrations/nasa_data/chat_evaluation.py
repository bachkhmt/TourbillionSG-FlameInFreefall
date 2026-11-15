"""Reproducible offline team-authored retrieval evaluation; not scientific validation."""

import argparse
import asyncio
import hashlib
import json
from pathlib import Path
from uuid import UUID

from app.integrations.chat import CorpusPassage, RagRequest
from app.integrations.rag.provider import VERSION, ExtractiveProvider
from app.services.chat import validate_real_answer, verify_hits

from .corpus_registry import registry_for
from .resource_documents import build_resource_release

EVALUATION = Path(__file__).resolve().parents[2] / "integration_tests/data/chat_eval.json"


def evaluation_passages():
    release = build_resource_release()
    registry = registry_for(release)
    passages = tuple(
        CorpusPassage(
            chunk_id=UUID(chunk["id"]),
            source_document_id=UUID(chunk["sourceId"]),
            investigation_id=UUID(source["investigationId"]) if source["investigationId"] else None,
            source_scope=source["sourceScope"],
            slug=source["slug"],
            title=source["title"],
            locator=chunk["locator"],
            text=chunk["text"],
        )
        for chunk in release["chunks"]
        if chunk["id"] in registry["chunks"]
        for source in (registry["sources"][chunk["sourceId"]],)
    )
    return release, passages, registry


async def evaluate(split="development"):
    raw = EVALUATION.read_bytes()
    checksum = hashlib.sha256(raw).hexdigest()
    if checksum != EVALUATION.with_suffix(".sha256").read_text().split()[0]:
        raise ValueError("Frozen evaluation dataset changed")
    cases = [case for case in json.loads(raw) if case["split"] == split]
    release, passages, registry = evaluation_passages()
    by_source = {p.source_document_id: p.slug for p in passages}
    registry_sha256 = hashlib.sha256(
        json.dumps(registry, sort_keys=True, ensure_ascii=False, indent=2).encode() + b"\n"
    ).hexdigest()
    # Offline identity binds the complete admitted source/chunk registry. Runtime chat also
    # binds DB snapshot content; this is deliberately not presented as its serving fingerprint.
    corpus_version = registry_sha256
    provider = ExtractiveProvider()
    results = []
    for case in cases:
        citations = provider.retrieve(
            case["question"], passages, (), tuple(s["slug"] for s in registry["sources"].values())
        )
        verify_hits(citations, passages)
        answer = await provider.answer(
            RagRequest(
                question=case["question"],
                corpus_version=corpus_version,
                collection_fingerprint=release["revision"],
                allowed_sources=citations,
            )
        )
        validate_real_answer(answer, corpus_version)
        slugs = [by_source[c.source_document_id] for c in answer.citations]
        expected = set(case["expected_slugs"])
        results.append(
            {
                "id": case["id"],
                "state": answer.state,
                "slugs": slugs,
                "expected_state": case["expected_state"],
                "recall_hit": bool(expected & set(slugs)) if expected else None,
                "top_one": slugs[0] in expected
                if slugs and expected
                else False
                if expected
                else None,
                "comparison_covered": all(
                    set(group) & set(slugs) for group in case["expected_groups"]
                )
                if case.get("expected_groups")
                else None,
            }
        )
    answered = [r for r in results if r["expected_state"] == "answered"]
    abstained = [r for r in results if r["expected_state"] == "abstained"]
    comparisons = [r for r in results if r["comparison_covered"] is not None]
    return {
        "split": split,
        "provider_version": VERSION,
        "source_revision": release["revision"],
        "corpus_version": corpus_version,
        "corpus_version_kind": "offline-admitted-registry-sha256",
        "corpus_registry_sha256": registry_sha256,
        "evaluation_sha256": checksum,
        "passages": len(passages),
        "cases": len(cases),
        "answerable_cases": len(answered),
        "abstention_cases": len(abstained),
        "recall_at_4": sum(r["recall_hit"] for r in answered) / len(answered),
        "top_one_accuracy": sum(r["top_one"] for r in answered) / len(answered),
        "correct_abstention": sum(r["state"] == "abstained" for r in abstained) / len(abstained),
        "full_comparison_coverage": sum(r["comparison_covered"] for r in comparisons)
        / len(comparisons)
        if comparisons
        else None,
        "results": results,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--split", choices=["development", "holdout"], default="development")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = asyncio.run(evaluate(args.split))
    if args.output:
        args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "results"}, indent=2))
    raise SystemExit(
        0 if report["recall_at_4"] >= 0.85 and report["correct_abstention"] >= 0.90 else 1
    )
