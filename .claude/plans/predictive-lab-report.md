# Predictive Lab: readiness + exploratory model report

Tier T2 (FE + offline report script). Branch `feat/predictive-lab-report` from `origin/main` 8be0af8.
User decision (2026-11-15): "Báo cáo + readiness" — no per-input predictions.

## Facts
- Notebook outputs (gitignored) in `.demo/predictive-lab/outputs/<experiment>/<runId>/`
  for `flex_heptane`, `cfig_normal`, `cfi_droplet_khot`, `saffire_ii_spread`
  (numbered `00..03` dirs are earlier drafts, ignored). Every run says
  `status=blocked`, `review_status=unreviewed`, `public_readiness=not_ready`;
  reasons `validation_plan_missing; exploratory_results_only` or
  `at_least_three_groups_required; ...` (saffire, no metrics.json).
- `metrics.json.comparisons.basic.{median,ridge_basic}` hold group-held-out `row_mae`,
  `rows`, `groups`, `coverage_fraction`. cfi Ridge (0.089) is worse than median (0.078).
- BE `GET /api/v1/prediction/readiness` exists; production provider `unavailable` →
  `{state: not_ready, reasons: [model_selection_required], ...}`. FE already has
  `getPredictionReadiness` + `usePredictionReadinessQuery`. Phase 7 contract: no numeric
  prediction while unvalidated. BE untouched by this change.
- ADR-0008 removed the old panel (frontend simulated engine). `/mission?view=prediction`
  stays on evidence (tested); unchanged here.

## Design
1. `scripts/build_predictive_lab_report.py` (stdlib, offline, deterministic):
   `--outputs .demo/predictive-lab/outputs --out FlameInFreewall_Tourbillion/src/data/predictiveLabReport.json`.
   Latest run per named experiment (lexicographic run id = UTC timestamp). Per experiment:
   `experiment, runId, target, unit, protocol (id + scope sentence from model_card
   "Protocol:" line), status, reviewStatus, publicReadiness, reasons[] (split "; "),
   exploratoryResultsAvailable, comparisons{median, ridge_basic: rowMae, rows, groups,
   coverageFraction} | null, features[] (candidate.json), sources{file: sha256}` for
   evaluation/metrics/candidate/model_card. No row-level data (predictions/rows/groups CSV
   never copied). `schemaVersion: 1`, sorted keys, no generation timestamp.
2. FE route `/predictive-lab` (`src/app/(dashboard)/predictive-lab/page.tsx`,
   feature folder `src/features/predictive-lab/`):
   - Header + banner: "Exploratory · Unreviewed · No predictions are served".
   - Readiness card via `usePredictionReadinessQuery`: loading, error + Retry, state with
     reason codes mapped to plain English (unknown code shown verbatim), link back to
     Mission Evidence. Even if `ready`, this page does not execute predictions.
   - One card per experiment from the JSON: target/unit, protocol, status pills, reasons
     in plain English, table Median baseline vs Ridge (row MAE in original unit, rows,
     groups, coverage), explicit flag when Ridge does not beat the baseline, "Not enough
     independent groups to evaluate" when comparisons are null, run id + short hashes.
   - Footnote: group-held-out evaluation, MAE is not a safety or risk measure.
3. Sidebar: add "Predictive Lab" item → `/predictive-lab` (desktop + mobile lists).

## Acceptance criteria → test
- AC1 script: fields above extracted; latest run chosen; saffire → comparisons null;
  output deterministic; no row-level keys. → `integration_tests/test_predictive_lab_report.py`
  (synthetic tmp fixtures).
- AC2 committed JSON equals a fresh script run on the local outputs (manual check, recorded).
- AC3 page: loading → not_ready with plain reason; error shows Retry and refetches; four
  experiment cards with exploratory labels; cfi flagged "does not beat baseline"; saffire
  shows insufficient groups; no element presents a predicted value for user input; link to
  /mission. → `tests/predictive-lab.test.tsx`.
- AC4 sidebar has Predictive Lab → /predictive-lab. → update `tests/navigation.test.tsx`.
- AC5 gates: integration_tests, FE `npm test`, `tsc`, `build`; browser check of the page
  against local BE (8112).

## Non-goals / risks
- No BE/contract change, no prediction execution, no per-row predictions or intervals shown.
- Report is a snapshot of local notebook outputs; regeneration needs the `.demo` outputs
  (not in git). Hashes pin which files produced it.
- Numbers come from AI-team exploratory runs; labelled unreviewed, not validated.

## Plan-critic REVISE → applied
- ADR-0010 amends ADR-0008; publication of exploratory metrics confirmed by the user in chat
  (2026-11-15), recorded in the ADR. BE untouched; owner notified via PR.
- Verdict uses the notebook `candidate` (group-mean MAE selection); < 5 groups → no conclusion
  ("Only N held-out rows"); coverage note + `median_all_rows` when Ridge covers fewer rows.
- Invariant FE test: every entry blocked/unreviewed/not_ready, no row-level keys.
- `sourceNote` in JSON states data is not in git; sha256 per source file.
- Readiness reason-code map incl. real BE codes; test that mock fallback is never used.
- Script moved to `integrations/predictive_lab/report.py` (tests in integration_tests).
- Only named experiments read, numbered drafts ignored; leak test for row ids.
- BottomNav (mobile 4 tabs) unchanged; Predictive Lab reachable from the dock and mobile drawer.

## User follow-up (2026-11-15): "use the trained outputs"
- Report now includes held-out predictions from predictions.json (observed, median, Ridge or
  unsupported, run id, domain flags), shown as observed-vs-output SVG chart + table.
- Still no inference for new user inputs (Phase 7 contract); ADR-0010 updated.
- Reviewer SHOULD-FIX applied: group-mean MAE column, candidateAvailable / comparisonEligible
  verdicts, generator fails on missing model keys, no stale readiness on refetch error,
  audit.json reason mapped, mm²/s display.
