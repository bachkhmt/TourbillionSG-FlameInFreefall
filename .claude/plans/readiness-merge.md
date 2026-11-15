# Merge readiness fixes into main — 2026-11-15

Tier T2. Branch `codex/hackathon-readiness-merge-20261115` from `origin/main` (5ad0413),
merging local-only `codex/hackathon-readiness-fixes-20261115` (7dd5eee, single wip commit
implementing HACKATHON_FIX_PROMPTS 1, 3, 6, 7, 8 and part of 9). RAG (prompts 4–5) is in
PR7 and does not overlap these files. Goal: one PR that brings readiness into main without
regressing main's Mission API work (5ad0413, xviehung).

## Conflict resolution (12 files)
| File | Take | Reason |
| --- | --- | --- |
| `app/(dashboard)/mission/page.tsx` | main | Real `/mission/research` lookup; readiness still renders view switcher + Predictive Lab |
| `features/mission/components/PredictiveLabPanel.tsx` | delete (main) | Prediction removed upstream |
| `features/mission/hooks/useScenarioQueries.ts` | main | Full-request key, no fallback; readiness-only `useActiveScenarioEvaluation` loses its caller |
| `features/mission/components/ScenarioConfigForm.tsx` | main ppO2 label; keep readiness auto-merged parts | Readiness removed "PSI Verified Baseline"/SoFIE text elsewhere in file — verify |
| `components/layout/Sidebar.tsx` | main | "Research evidence & condition gaps" (readiness kept "predictive lab") |
| `features/landing/LandingFooter.tsx`, `MissionControlCTA.tsx` | main in conflict hunks | Main rewrote the disclaimers honestly; readiness only reformatted old text |
| `tests/mission.test.tsx` | rewrite from both | Keep main's ScenarioConfigForm + MissionPage tests; drop tests for removed components |
| `tests/landing.test.tsx`, `phase5ExtendedApis.test.tsx`, `resources.test.tsx` | main in hunks | Assert main's wording; quote style only otherwise |
| `tests/explorer.test.tsx` | readiness | Adds `next` link needed by readiness pagination fixture |

## Dead Mission code removed
Not rendered by main's page and no other importer: `ConditionGapMatrix`, `RankedEvidenceList`,
`ScenarioEvidenceStatus`, `lib/gapMatrixEngine.ts` (+ its test). Update `components/index.ts`.
Keeps fabricated-engine code out of product routes (Prompt 2 criterion).

## Readiness loose ends fixed in the same PR
- ADR number clash: readiness `ADR-0007-hackathon-evidence-navigation` → `ADR-0008`; its text
  says Mission uses scenario-evaluation states (option A) — amend to point at ADR-0007 mission
  research lookup.
- README links `specs/hackathon-readiness/verification.md`, which does not exist → write it
  with this merge's executed checks.
- Remaining strings on main pages: grep for "SoFIE", "PSI Verified Baseline", "Predictive",
  "Could Have", "20 Studies", "148+", "Kurzgesagt Vector", "Offline Fallback".
- Never commit the local symlinks (`node_modules`, `.venv`, `.demo`): add files by path.

## Acceptance criteria → check
1. No conflict markers; FE `npm test`, `npx tsc --noEmit`, `npm run build` green.
2. BE suite and root suite green via `scripts/test_db.py` on 55435, 0 skipped.
3. `scripts/verify_data_handoff.py` passes on the tag/oxygen-context snapshot; fresh preview
   target prepared with `prepare_chat_preview.py` (main's corpus registry also writes the
   mission sidecar — both must hold on the same snapshot).
4. Browser smoke on fresh target: /dashboard charts from `/catalog/descriptive`; /explorer
   real filters; /explorer/flex overview + tags; /mission research lookup returns rows;
   backend stopped → error states, no mock numbers, no "Offline Fallback".
5. Prompt 8 grep list empty in `src` user-visible strings.
6. Reviewer (focus: provenance, error masking, units/nulls) PASS or PASS-WITH-NOTES.

## Plan-critic changes (APPROVE-WITH-CHANGES)
- `useScenarioQueries.ts`: restore main's whole file (`git checkout --ours`); readiness deleted
  `const key = …` outside the hunks, so hunk-by-hunk breaks tsc.
- Every "main" row: after resolving, diff the file against main and accept only intended
  readiness changes (counts, labels); nothing else silently.
- Delete ConditionGapMatrix/RankedEvidenceList/ScenarioEvidenceStatus/PredictiveLabPanel and
  their exports in the same step; delete `tests/gapMatrixEngine.test.ts`.
- `phase5ExtendedApis.test.tsx`: keep one scenario-error test, not both.
- Snapshot order: fresh export with merged `export.py` → `write_corpus_policy` (mission sidecar)
  → import. Confirm an integration test covers `/mission/research` on the tag/oxygenContext
  snapshot; extend `integration_tests/test_mission_http.py` if not.
- ADR rename to 0008: grep old filename references. `export.py` changes the imported snapshot →
  flameguard-ai-backend/AGENTS.md applies: state in the PR that BE owner review is required.
- AC4 adds: stale sidecar hash → `/mission` shows the 503 error state. AC5 list = the grep list
  in "Readiness loose ends". Check main's explorer assertions are not lost.

## Out of scope
Submission URLs/video/AI-use history; deploy; origin/frontend landing branch; PR7 RAG.
Rollback: close PR; readiness branch and main unchanged.
