# Evidence-only product scope — 2026-11-15

User decision: remove Predictive Lab and focus the product on NASA's core
research dashboard use case: summarize, rank, compare and interpret combustion
investigations for prevention, detection and suppression.

## Delivered

- Mission always renders scenario configuration, evidence gaps and related
  studies. Removed the view switcher and predictive route branch. Old query
  strings such as `/mission?view=prediction` stay on the evidence workspace.
- Deleted PredictiveLabPanel, predictiveLabEngine and their feature export and
  unused audit types. Removed model validation/uncertainty claims from the UI.
- Updated sidebar, landing feature list and research-scope wording.
- Replaced retired prediction UI tests with evidence-only and legacy-link
  regressions. Kept scenario and partial-gravity evidence-gap behavior covered.
- Fixed existing type errors uncovered during verification: obsolete `sources`
  prop on ClaimsList, nonexistent pagination field in a test, and a `.tsx`
  extension in a test import. These do not change the backend contract.

## Boundaries

No backend, migration, database, dataset, RAG or provider changes. The upstream
prediction API/client contract scaffolding remains available for compatibility;
there is no prediction product view or local predictive engine in Mission.

Mission's local ranking/gap engines and other API mock fallbacks remain existing
limitations. Removing them and binding Mission to imported evidence is a
separate integration task. No validated model or scientific review is claimed.

## Verification

- Node22.14, `npm ci` from existing lockfile; dependency manifest/lock unchanged.
- `npm test`:306 passed across27files.
- `npx tsc --noEmit`:passed.
- `npm run build`:passed, including final type validation and `/mission` output.
- `git diff --check`:passed. Main-agent self-check; no independent agent review.
- No DB tests necessary for this UI removal; no browser validation claimed.

No commit, push or deployment performed.

## Follow-up: real API integration

The prior limitation on Mission local ranking/gap engines is addressed by the
additive admitted research API. See [current record](MISSION_API.md). Other
product views may still have their own mock fallbacks; this change scopes Mission.
