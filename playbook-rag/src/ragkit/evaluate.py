"""Evaluate the retrieval layer (Recall@5, MRR) and refusal behavior separately. Runs offline, no LLM required.

Note: the gold answers here are taken from the playbook itself, so it tests the pipeline, NOT the
scientific factual correctness regarding NASA.
"""
from __future__ import annotations

import argparse
import json
import sys

from .config import Settings
from .pipeline import RagPipeline
from .text import fold


def run(settings: Settings | None = None, k: int = 5) -> dict:
    s = settings or Settings.from_env()
    pipe = RagPipeline.from_settings(s, llm=None)
    questions = json.loads((s.data_dir / "eval_questions.json").read_text(encoding="utf-8"))
    rows, ranks, refusals = [], [], []
    for item in questions:
        if item["kind"] == "retrieval":
            hits = pipe.retriever.search(item["q"], k)
            rank = next((i + 1 for i, h in enumerate(hits)
                         if all(t in fold(h.chunk["text"]) for t in item["all"])), None)
            ranks.append(rank)
            rows.append({"q": item["q"], "kind": "retrieval", "rank": rank, "ok": rank is not None})
        else:
            r = pipe.answer(item["q"])
            text = fold(" ".join(x["text"] for x in r["answer"]["segments"]))
            ok = (r["meta"]["reason"] == item["reason"]
                  and (r["answer"]["coverage"] == "none" or item["reason"] == "safety_verdict")
                  and (r["answer"]["coverage"] != "full")
                  and (not item.get("must_mention") or item["must_mention"] in text))
            refusals.append(ok)
            rows.append({"q": item["q"], "kind": "refuse", "reason": r["meta"]["reason"], "ok": ok})
    n = len(ranks)
    return {
        "recall@5": round(sum(1 for r in ranks if r) / n, 3) if n else 0.0,
        "mrr": round(sum(1 / r for r in ranks if r) / n, 3) if n else 0.0,
        "refusal_accuracy": round(sum(refusals) / len(refusals), 3) if refusals else 1.0,
        "rows": rows,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-recall", type=float, default=0.85)
    ap.add_argument("--min-refusal", type=float, default=0.90)
    ap.add_argument("--out", default="reports/eval.json")
    a = ap.parse_args(argv)
    res = run()
    for r in res["rows"]:
        print(("PASS" if r["ok"] else "FAIL"), r["kind"].ljust(9), r["q"][:70],
              f"(rank {r['rank']})" if r["kind"] == "retrieval" else f"({r['reason']})")
    print(f"\nRecall@5 {res['recall@5']}  MRR {res['mrr']}  Refusal accuracy {res['refusal_accuracy']}")
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    return 0 if res["recall@5"] >= a.min_recall and res["refusal_accuracy"] >= a.min_refusal else 1


if __name__ == "__main__":
    sys.exit(main())
