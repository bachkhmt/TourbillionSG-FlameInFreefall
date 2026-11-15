"""Published v3 benchmark regression gates. No network or database required."""

import hashlib
import json

import pytest

from integrations.nasa_data.chat_evaluation import EVALUATION, evaluate


def test_evaluation_split_and_original_hash_are_preserved():
    raw = EVALUATION.read_bytes()
    assert (
        hashlib.sha256(raw).hexdigest() == EVALUATION.with_suffix(".sha256").read_text().split()[0]
    )
    cases = json.loads(raw)
    assert len(cases) == 40 and len({case["id"] for case in cases}) == 40
    assert sum(case["split"] == "holdout" for case in cases) == 10
    assert sum(case["language"] == "vi" for case in cases) == 20
    assert sum(case["language"] == "en" for case in cases) == 20


@pytest.mark.parametrize("split", ["development", "holdout"])
async def test_published_bilingual_retrieval_benchmark(split):
    report = await evaluate(split)
    print(json.dumps({key: value for key, value in report.items() if key != "results"}, indent=2))
    assert report["recall_at_4"] >= 0.85, report["results"]
    assert report["correct_abstention"] >= 0.90, report["results"]
    if report["full_comparison_coverage"] is not None:
        assert report["full_comparison_coverage"] == 1, report["results"]
