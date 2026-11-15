"""Summarise exploratory Predictive Lab notebook outputs for the frontend report page.

Offline and deterministic. Reads the latest run of each named experiment: status, scope,
group-held-out error summaries and the held-out predictions (predictions.json: observed
value, median and Ridge outputs per NASA run, with domain flags). Training rows, CSVs and
selected run-id lists are never copied. Only the named experiments are read, so the
numbered draft directories (00-03) are ignored. The notebooks mark every run blocked/
unreviewed/not_ready; this report preserves that and serves no predictions.

    python3 -m integrations.predictive_lab.report \
        --outputs .demo/predictive-lab/outputs \
        --out FlameInFreewall_Tourbillion/src/data/predictiveLabReport.json
"""

import argparse
import hashlib
import json
import re
from pathlib import Path

EXPERIMENTS = ("flex_heptane", "cfig_normal", "cfi_droplet_khot", "saffire_ii_spread")
MODELS = ("median", "median_all_rows", "ridge_basic")
SOURCE_NOTE = (
    "Generated offline from AI-team notebook outputs that are not stored in git; "
    "the sha256 values pin the exact files used. Exploratory and unreviewed."
)
SOURCES = ("model_card.md", "evaluation.json", "metrics.json", "candidate.json", "predictions.json")
TITLE = re.compile(r"^# (?P<name>\S+) · (?P<target>.+?) \((?P<unit>[^()]+)\)\s*$", re.MULTILINE)
PROTOCOL = re.compile(r"^Protocol: `(?P<id>[^`]+)`\.\s*(?P<scope>.*)$", re.MULTILINE)


def latest_run(directory: Path) -> Path:
    runs = sorted(p for p in directory.iterdir() if p.is_dir() and (p / "evaluation.json").exists())
    if not runs:
        raise FileNotFoundError(f"No evaluated run in {directory}")
    return runs[-1]  # run ids start with a UTC timestamp


def summarise(model: dict) -> dict:
    # median_all_rows has no support/coverage fields: it is scored on every row.
    rows = model["rows"]
    return {
        "rowMae": model["row_mae"],
        "groupMeanMae": model["group_mean_mae"],
        "comparisonEligible": model.get("comparison_eligible", True),
        "rows": rows,
        "groups": model["groups"],
        "supportedRows": model.get("supported_rows", rows),
        "totalRows": model.get("total_rows", rows),
        "coverageFraction": model.get("coverage_fraction", 1.0),
    }


def held_out(path: Path) -> list[dict]:
    """One entry per held-out run: observed value and each model's output (None = unsupported)."""
    if not path.exists():
        return []
    runs: dict[tuple, dict] = {}
    for item in json.loads(path.read_text("utf-8")):
        key = (item["fold"], item["group_id"], item["run_id"], item["event_id"])
        entry = runs.setdefault(
            key,
            {
                "fold": item["fold"],
                "groupId": item["group_id"],
                "runId": item["run_id"],
                "eventId": item["event_id"],
                "actual": item["actual"],
                "features": item["features"],
                "outsideTrainBounds": item["outside_train_bounds"],
                "outsideTrainJointDomain": item["outside_train_joint_domain"],
                "unsupportedCategory": item["unsupported_category"],
                "predictions": {},
            },
        )
        if entry["actual"] != item["actual"]:
            raise ValueError(f"Inconsistent observed value for {key} in {path}")
        entry["predictions"][item["model"]] = item["prediction"]
    return [runs[key] for key in sorted(runs, key=lambda k: tuple(map(str, k)))]


def experiment(directory: Path) -> dict:
    run = latest_run(directory)
    card = (run / "model_card.md").read_text("utf-8")
    title, protocol = TITLE.search(card), PROTOCOL.search(card)
    if not title or not protocol:
        raise ValueError(f"Unrecognised model card in {run}")
    evaluation = json.loads((run / "evaluation.json").read_text("utf-8"))
    comparisons = None
    if (run / "metrics.json").exists():
        basic = json.loads((run / "metrics.json").read_text("utf-8"))["comparisons"]["basic"]
        # A renamed or missing model key must fail here, not crash the page later.
        comparisons = {name: summarise(basic[name]) for name in MODELS}
    selection = run / "candidate.json"
    chosen = json.loads(selection.read_text("utf-8")) if selection.exists() else {}
    return {
        "experiment": directory.name,
        "runId": run.name,
        "target": title["target"],
        "unit": title["unit"],
        "protocol": {"id": protocol["id"], "scope": protocol["scope"].strip()},
        "status": evaluation["status"],
        "reviewStatus": evaluation["review_status"],
        "publicReadiness": evaluation["public_readiness"],
        "exploratoryResultsAvailable": evaluation["exploratory_results_available"],
        "reasons": [r.strip() for r in evaluation["reason"].split(";") if r.strip()],
        "comparisons": comparisons,
        # Notebook's own selection on group-mean MAE; None means no model beat the baseline.
        "candidate": chosen.get("candidate"),
        "candidateAvailable": selection.exists(),
        "features": chosen.get("features", []),
        "heldOut": held_out(run / "predictions.json"),
        "sources": {
            name: hashlib.sha256((run / name).read_bytes()).hexdigest()
            for name in SOURCES
            if (run / name).exists()
        },
    }


def build_report(outputs: Path) -> dict:
    return {
        "schemaVersion": 1,
        "sourceNote": SOURCE_NOTE,
        "experiments": [experiment(outputs / name) for name in EXPERIMENTS],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--outputs", type=Path, default=Path(".demo/predictive-lab/outputs"))
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("FlameInFreewall_Tourbillion/src/data/predictiveLabReport.json"),
    )
    args = parser.parse_args()
    report = build_report(args.outputs)
    args.out.write_text(
        json.dumps(report, indent=2, sort_keys=True, ensure_ascii=False) + "\n", "utf-8"
    )
    print(f"Wrote {len(report['experiments'])} experiments to {args.out}")
