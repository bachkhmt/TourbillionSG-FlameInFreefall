# Hackathon readiness — verification (2026-11-15)

Scope: merge of the readiness fixes (`codex/hackathon-readiness-fixes-20261115`, 7dd5eee) into
`origin/main` at 5ad0413 on branch `codex/hackathon-readiness-merge-20261115`. Covers
`docs/HACKATHON_FIX_PROMPTS.md` prompts 1, 3, 6, 7 and 8, plus the Mission merge decision.
RAG prompts 4–5 ship separately in PR #7. Plan: `.claude/plans/readiness-merge.md`.

## Merge decisions
- Mission: main's `/mission/research` lookup (ADR-0007) kept; the readiness option-A panels,
  Predictive Lab, `ConditionGapMatrix`, `RankedEvidenceList`, `ScenarioEvidenceStatus`,
  `gapMatrixEngine` and `rankingEngine` removed (no remaining importers). Readiness's honest
  `ScenarioConfigForm` wording kept.
- Readiness ADR renamed to ADR-0008 to avoid the ADR-0007 number clash.
- Readiness files were reformatted to double quotes by a formatter; content changes are the
  ones listed in the plan. No project formatter config exists to normalise this.
- Branch then merged `origin/main` at b9bc971 (gitignore + English translation); README and
  DATA_HANDOFF keep main's English text with the readiness sections appended in English. The
  RAG code, `.gitignore` and `playbook-rag/` match main except the 5-line prototype notice.
- Reviewer follow-up: the remaining mock scenario/prediction fixtures in `mockFallback.ts` were
  relabelled `synthetic`/`unreviewed` (no product code calls them; tests use them as HTTP stubs).

## Executed checks
Re-run after merging b9bc971; results unchanged from the first run.

| Check | Result |
| --- | --- |
| FE `npm test` | 29 files, **308 passed** |
| FE `npx tsc --noEmit` | exit 0 |
| FE `npm run build` | compiled; routes /, /dashboard, /explorer, /explorer/[id], /mission, /resources |
| BE suite via `scripts/test_db.py run` (55435) | **702 passed, 0 skipped** |
| Root suite via `scripts/test_db.py run` (55435) | **106 passed, 0 skipped** (includes `test_mission_http` on the tag/oxygenContext snapshot and its tamper → 503 case) |
| `scripts/verify_data_handoff.py` via `test_db.py run` | psi PASS (71 sources, 2508 passages); unified PASS (81 sources, 2574 passages, 10 resources) |
| BE `ruff check .` / `ruff format --check .` | 1 error each, both in `app/integrations/rag/retrieval.py` (E501 at line 67), which is byte-identical to main b9bc971; pre-existing on main, not touched here |
| Prompt 8 grep (SoFIE, PSI Verified Baseline, Predictive Lab, Could Have, Diagram D14, 20 Studies/NASA, 148+, Kurzgesagt Vector, Offline Fallback, Drop Tower, Terrestrial (1g), Vietnamese toast) | no user-visible matches in `src` outside `src/data` demo fallback and type comments |

## Browser smoke (fresh preview target from merged code, test container 55435)
- /dashboard: "Real · Unreviewed" badge, 24 studies, 1926 source records, descriptive charts
  from `GET /catalog/descriptive`.
- /explorer: platform and gravity filters come from data (ISS, Cygnus, Not Applicable;
  microgravity, unknown).
- /explorer/flex: tags CIR, FLEX, droplet, MDCA, suppression; verbatim objective with source link.
- /mission: `POST /mission/research` 200; 12 investigations with same-record conditions and
  "Unknown" distinct from "Different".
- Backend stopped: /dashboard shows "Unable to load dashboard telemetry" with Retry; no mock
  numbers, no "Offline Fallback" label.

## Merge with main 4a6f4f2 (PR #7 + frontend landing branch) — 2026-11-15
Six frontend files conflicted (four landing components, `landing.test.tsx`, `explorer.test.tsx`);
they are also the only files both sides changed, so no other file was merged silently.
- Landing components and `landing.test.tsx`: main's rewritten landing kept. Its counts (24
  studies, 1,926 runs) match the preview DB (24 `investigation`, 1926 `test_run`, all ISS/Cygnus).
- Re-applied Prompt 8: "SoFIE" removed from the hero and `CoreIntelligenceSection` (SoFIE is not in
  the release); LaTeX `$…$` text that rendered literally replaced with plain text.
- `LandingFooter`: main's rewrite dropped the research-scope disclaimer from 5ad0413, so its own
  test failed on main. Restored "Research scope & limitations" and the "not a fire-risk
  probability" sentence; kept the NASA non-endorsement sentence; dropped the "NASA … Fire Safety
  Protocol" heading.
- `explorer.test.tsx`: readiness `next` link kept (pagination parses the offset).

| Check | Result |
| --- | --- |
| FE `vitest` / `tsc --noEmit` / `npm run build` | 34 files, **389 passed** / exit 0 / compiled |
| Root / BE suites (55435) | **138 passed** / **702 passed**, 0 skipped |
| BE `ruff check .` / `ruff format --check .` | Passed |
| Chat benchmark development / holdout | recall@4, top-1, abstention all 1.0 |
| `verify_data_handoff.py` | psi PASS (71/2508); unified PASS (81/2574/10) |
| Browser smoke, fresh target | landing without SoFIE/`$`; dashboard 24 studies, 1926 records, charts; explorer ISS/Cygnus; /explorer/flex tags + sourced objective, 274 runs; /mission 12 investigations; chat FLEX-007 1.87 mm and 1.82 mm with 2 sources; backend stopped → error + Retry, no mock numbers |

Not changed (main content, outside this merge): the unlinked `/ember-zero` route still contains
Vietnamese demo text with unsourced figures (e.g. "94.2%" match, "SoFIE-MIST").

## Not done / open
- Backend upstream owner review is required before merge (`export.py` changes the imported
  snapshot: tags and `oxygenContext`; new read endpoints).
- Submission URLs, demo video and full team AI-use history are not filled in.
- Pages still show "10 unmapped fields" counters on study cards; cosmetic.
- No deployment or shared-database import was performed.
