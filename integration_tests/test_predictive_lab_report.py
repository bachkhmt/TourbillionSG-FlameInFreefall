"""Offline Predictive Lab report: summary fields only, latest run, deterministic, no row data."""

import hashlib
import json
from pathlib import Path

from integrations.predictive_lab.report import EXPERIMENTS, build_report

CARD = """# {name} · {target} ({unit})

Status: blocked. Review: unreviewed. Public: not_ready.

Protocol: `{protocol}`. TEST_ONLY scope sentence for {name}.

Baseline: train-fold median.
"""


def comparison(mae, rows=10, groups=4, supported=10, total=10):
    return {
        "comparison_eligible": True,
        "coverage_fraction": supported / total,
        "group_mae": {"g1": mae},
        "group_mean_mae": mae,
        "groups": groups,
        "row_mae": mae,
        "rows": rows,
        "supported_rows": supported,
        "total_rows": total,
        "unsupported_rows": total - supported,
    }


def write_run(
    root, name, run_id, *, metrics=True, reason="validation_plan_missing; exploratory_results_only"
):
    run = root / name / run_id
    run.mkdir(parents=True)
    (run / "model_card.md").write_text(
        CARD.format(name=name, target="burn_duration", unit="s", protocol=f"{name}-protocol"),
        encoding="utf-8",
    )
    (run / "evaluation.json").write_text(
        json.dumps(
            {
                "experiment": name,
                "exploratory_results_available": metrics,
                "public_readiness": "not_ready",
                "reason": reason,
                "review_status": "unreviewed",
                "status": "blocked",
                "unit": "s",
            }
        ),
        encoding="utf-8",
    )
    # Row-level artefacts must never reach the report.
    (run / "predictions.csv").write_text("run,pred\nSECRET-ROW,1\n", encoding="utf-8")
    (run / "rows.json").write_text('[{"run": "SECRET-ROW"}]', encoding="utf-8")
    point = {
        "fold": 0,
        "group_id": "G-1",
        "run_id": "RUN-7",
        "event_id": "E-7",
        "actual": 8.9,
        "features": {"oxygen_mol_pct": 21.0},
        "outside_train_bounds": False,
        "outside_train_joint_domain": True,
        "unsupported_category": False,
    }
    (run / "predictions.json").write_text(
        json.dumps(
            [
                {**point, "model": "median", "prediction": 3.15, "absolute_error": 5.75},
                {**point, "model": "ridge_basic", "prediction": None, "absolute_error": None},
            ]
        ),
        encoding="utf-8",
    )
    if metrics:
        (run / "metrics.json").write_text(
            json.dumps(
                {
                    "comparisons": {
                        "basic": {
                            "median": comparison(4.0),
                            # Real notebooks omit support fields for the all-rows median.
                            "median_all_rows": {
                                "group_mae": {"g1": 4.5},
                                "group_mean_mae": 4.5,
                                "groups": 5,
                                "row_mae": 4.5,
                                "rows": 12,
                            },
                            "ridge_basic": comparison(3.0, supported=8),
                        }
                    },
                    "unit": "s",
                }
            ),
            encoding="utf-8",
        )
        (run / "candidate.json").write_text(
            json.dumps(
                {
                    "candidate": "ridge_basic",
                    "features": ["oxygen_mol_pct", "pressure_bar"],
                    "selected_run_ids": ["SECRET-ROW"],
                    "status": "exploratory",
                }
            ),
            encoding="utf-8",
        )
    return run


def make_outputs(tmp_path):
    for name in EXPERIMENTS:
        write_run(tmp_path, name, "20261115T090000000000Z-old00000")
    latest = write_run(tmp_path, "cfig_normal", "20261115T100000000000Z-new00000")
    (tmp_path / "saffire_ii_spread" / "20261115T090000000000Z-old00000" / "metrics.json").unlink()
    (tmp_path / "saffire_ii_spread" / "20261115T090000000000Z-old00000" / "candidate.json").unlink()
    (tmp_path / "03" / "20261115T110000000000Z-draft000").mkdir(parents=True)
    return latest


def test_report_summarises_latest_runs_without_row_data(tmp_path: Path):
    latest = make_outputs(tmp_path)
    report = build_report(tmp_path)

    assert report["schemaVersion"] == 1
    assert "not stored in git" in report["sourceNote"]
    assert [e["experiment"] for e in report["experiments"]] == list(EXPERIMENTS)
    cfig = next(e for e in report["experiments"] if e["experiment"] == "cfig_normal")
    assert cfig["runId"] == "20261115T100000000000Z-new00000"
    assert cfig["target"] == "burn_duration" and cfig["unit"] == "s"
    assert cfig["protocol"] == {
        "id": "cfig_normal-protocol",
        "scope": "TEST_ONLY scope sentence for cfig_normal.",
    }
    assert (cfig["status"], cfig["reviewStatus"], cfig["publicReadiness"]) == (
        "blocked",
        "unreviewed",
        "not_ready",
    )
    assert cfig["reasons"] == ["validation_plan_missing", "exploratory_results_only"]
    assert cfig["features"] == ["oxygen_mol_pct", "pressure_bar"]
    assert cfig["candidate"] == "ridge_basic" and cfig["candidateAvailable"] is True
    assert cfig["comparisons"] == {
        "median": {
            "rowMae": 4.0,
            "groupMeanMae": 4.0,
            "comparisonEligible": True,
            "rows": 10,
            "groups": 4,
            "supportedRows": 10,
            "totalRows": 10,
            "coverageFraction": 1.0,
        },
        "median_all_rows": {
            "rowMae": 4.5,
            "groupMeanMae": 4.5,
            "comparisonEligible": True,
            "rows": 12,
            "groups": 5,
            "supportedRows": 12,
            "totalRows": 12,
            "coverageFraction": 1.0,
        },
        "ridge_basic": {
            "rowMae": 3.0,
            "groupMeanMae": 3.0,
            "comparisonEligible": True,
            "rows": 10,
            "groups": 4,
            "supportedRows": 8,
            "totalRows": 10,
            "coverageFraction": 0.8,
        },
    }
    expected = hashlib.sha256((latest / "metrics.json").read_bytes()).hexdigest()
    assert cfig["sources"]["metrics.json"] == expected
    assert set(cfig["sources"]) == {
        "model_card.md",
        "evaluation.json",
        "metrics.json",
        "candidate.json",
        "predictions.json",
    }
    assert cfig["heldOut"] == [
        {
            "fold": 0,
            "groupId": "G-1",
            "runId": "RUN-7",
            "eventId": "E-7",
            "actual": 8.9,
            "features": {"oxygen_mol_pct": 21.0},
            "outsideTrainBounds": False,
            "outsideTrainJointDomain": True,
            "unsupportedCategory": False,
            "predictions": {"median": 3.15, "ridge_basic": None},
        }
    ]

    text = json.dumps(report)
    assert "SECRET-ROW" not in text and "selected_run_ids" not in text


def test_insufficient_groups_have_no_comparisons(tmp_path: Path):
    make_outputs(tmp_path)
    saffire = next(
        e for e in build_report(tmp_path)["experiments"] if e["experiment"] == "saffire_ii_spread"
    )
    assert saffire["comparisons"] is None and saffire["features"] == []
    assert saffire["candidate"] is None and saffire["candidateAvailable"] is False
    assert set(saffire["sources"]) == {"model_card.md", "evaluation.json", "predictions.json"}


def test_report_is_deterministic(tmp_path: Path):
    make_outputs(tmp_path)
    first = json.dumps(build_report(tmp_path), sort_keys=True)
    assert first == json.dumps(build_report(tmp_path), sort_keys=True)


def test_no_selected_model_is_kept_as_none(tmp_path: Path):
    make_outputs(tmp_path)
    candidate = tmp_path / "cfig_normal" / "20261115T100000000000Z-new00000" / "candidate.json"
    candidate.write_text(json.dumps({"candidate": None, "features": ["pressure_atm"]}), "utf-8")
    cfig = next(
        e for e in build_report(tmp_path)["experiments"] if e["experiment"] == "cfig_normal"
    )
    assert cfig["candidate"] is None and cfig["features"] == ["pressure_atm"]


def test_missing_model_key_fails_loudly(tmp_path: Path):
    import pytest

    make_outputs(tmp_path)
    metrics = tmp_path / "cfig_normal" / "20261115T100000000000Z-new00000" / "metrics.json"
    data = json.loads(metrics.read_text("utf-8"))
    del data["comparisons"]["basic"]["ridge_basic"]
    metrics.write_text(json.dumps(data), "utf-8")
    with pytest.raises(KeyError):
        build_report(tmp_path)


def test_missing_candidate_file_is_not_reported_as_a_baseline_win(tmp_path: Path):
    make_outputs(tmp_path)
    (tmp_path / "cfig_normal" / "20261115T100000000000Z-new00000" / "candidate.json").unlink()
    cfig = next(
        e for e in build_report(tmp_path)["experiments"] if e["experiment"] == "cfig_normal"
    )
    assert cfig["candidateAvailable"] is False and cfig["candidate"] is None


def test_inconsistent_observed_values_fail(tmp_path: Path):
    import pytest

    make_outputs(tmp_path)
    path = tmp_path / "cfig_normal" / "20261115T100000000000Z-new00000" / "predictions.json"
    items = json.loads(path.read_text("utf-8"))
    items[1]["actual"] = 9.9
    path.write_text(json.dumps(items), "utf-8")
    with pytest.raises(ValueError):
        build_report(tmp_path)
