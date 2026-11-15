# Mission on admitted NASA evidence — 2026-11-15

## NASA scope checked

Live [Details](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=details)
and [Resources](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/?tab=resources)
were fetched on15November2026. Details asks for an interactive dashboard to
summarize, rank and interpret combustion investigations for prevention,
detection and suppression, including objectives, fuels/geometry, test variables
and measurements. It identifies a lack of partial-gravity combustion data in
PSI; microgravity is not lunar/Mars experimental evidence. Prediction is not
required. Resource links include PSI, the Researcher's Guide, NASA combustion
science, incident histories, ScienceCasts and NASA Spinoff applications.
Resources are references, not a guarantee that every linked document is indexed.

## Delivered behavior

Mission posts the selected purpose and explicit conditions to
`POST /api/v1/mission/research`. No seed ranking/gap engine is called by the
page; no API-error fallback fabricates results. Responses contain source context,
objectives, raw observations, same-record condition matrix, admitted citations,
revision, lookup method, review counts and limitations. Editing any scenario
field/purpose invalidates results and cancels old requests. Errors remain visible.

The lookup ranks navigation by purpose and observed same-record coverage.
A microgravity regime is related to a0g lookup target, not an exact g measurement.
Unknown, different and related have separate text/color. Sources include locator,
URL, version and SHA256. Question text is descriptive, not semantic ranking.
No scientific review/model/operational safety is asserted. No paid provider.

## Why an additive route

The original `/mission/scenarios/evaluate` requires accepted scientific providers
and remains unchanged. The new route is an explicitly unreviewed research lookup;
it does not activate synthetic providers on real data or set curated flags.
21tables and migrations0001–0004 remain unchanged. See ADR-0007 and spec.

## Data binding / configuring a target

The relational projection cannot retain all oxygen/apparatus scope, conflicted
values and original provenance. Lookup uses the lossless release sidecar only
when its hash and snapshot hash match `researchPolicy` in the collection manifest.
The collection must first pass existing exact database/reader admission.
Data's `write_corpus_policy(manifest_path, release)` now also compares
`build_snapshot(release)` with the manifest's snapshot before declaring the
research policy. It writes `mission-release.json` beside the manifest, with
explicit SHA256 and sourceRevision. This helper is already called by
`scripts/prepare_chat_preview.py` for new isolated targets.

For an existing deployment, its Data owner reruns that helper with the matching
lossless release and existing collection manifest. Do not reset/reimport DB or
borrow another repo's settings. Missing/stale research policy returns503;
requesting a different revision returns409. Re-publish through the reviewed Data
workflow when actual scientific source content changes. Server reads local data,
not a live NASA API. Runtime dependencies have no import from integrations/.

## Verification executed

- Full FE:310passed/28files; TypeScript check and production build passed.
- Final affected FE suite after hook cleanup:30passed/3files.
- Root without PostgreSQL env:89passed,14skipped; those skips are DB tests.
- Explicit approved PostgreSQL17 on127.0.0.1:55435:
  Mission HTTP + existing NASA chat HTTP:14passed, no skips,71.50s.
- Pure Mission/data-export targeted suite:25passed; two further condition-source
  regressions were added and the full Mission pure suite passed separately.
- HTTP checks cover3purposes, real source/review states, lunar no-exact-match,
  partial input422, revision409 and tampered sidecar503. Chat history/source/
  timeout/concurrency/drift regressions also passed on separate child databases.
- Main-agent self-check, Ruff on new Python files and `git diff --check` passed.
- No browser interaction or production acceptance claimed. Tests used the existing
  reference Python environment with this repo on PYTHONPATH; no DB55434 use.

No schema change, shared/prod import, commit, push or deployment. Existing local
changes removing Predictive Lab and earlier type fixes were preserved.
