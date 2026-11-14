# Verification — Data handoff items1 and2, 2026-11-14

Branch `feat/data-backend-handoff-20261114`, base PR3 `e332b7a`.
User narrowed scope to Backend/Data DB import and option A; no FE conflict resolution
or AI retrieval-quality evaluation is claimed. Named kit reviewers and Spec Kit were
unavailable; manual plan/spec/tasks and main-agent self-review were used.

## Preservation and environment
- Docker/deployment28files are on `wip/docker-deployment-20261114`, commit `b950300`.
  Compared all28 Git blobs with normalized originals; raw-byte backup remains in
  NASA/.demo/history-repair-20261114. No Docker/deployment files in feature diff.
- No FE or `app/integrations/rag/` algorithm changes relative to PR3.
- Applied migrations0001–0003 are byte/content unchanged; still21 tables.
- User approved dedicated `tourbillion-test-pg`, localhost55435. Created only fresh,
  retained test-named databases/roles; no shared/demo/prod migration or reset.
- Python3.12 with existing backend dependencies; no lockfile change or paid provider.

## Fresh executed checks

**Latest full root integration confirmation:80 passed,0 failed,0 errors,0 skipped,
458.88s (7m38s), exit0**, on the approved PostgreSQL55435 target. No application logic
was changed during this confirmation run. Sanitized machine-readable evidence:
[integration-confirmation.json](integration-confirmation.json). Initial failures below
are historical and are retained to show the fixture correction, not current failures.

Commands use the available backend Python interpreter. From the repo root, run DB
checks through `python scripts/test_db.py run -- python -m pytest ...`; this injects
only the dedicated test settings and never prints credentials. On Windows the launcher
now uses subprocess.run and propagates exit status; execvpe crashed before child startup.

| Check | Actual result |
| --- | --- |
| Full backend suite, approved PostgreSQL: `pytest -q -c flameguard-ai-backend/pyproject.toml flameguard-ai-backend/tests` | **689 passed**, 0 skipped, 114.97s |
| Additional populated0003 upgrade/guarded downgrade and source/policy/manifest regression selection | **49 passed**, 9.95s; includes overlap with backend suite |
| Latest malformed scope/version2 input tests | **2 passed**, 0.15s |
| Latest full root integration suite, real PostgreSQL/HTTP | **80 passed**,0 failed/errors/skipped,458.88s; exit0 |
| Historical first root integration run | **77 passed, 2 failed**,424.42s;10s provider-entry barriers expired while full snapshot admission was still running |
| The two affected orchestration tests rerun after bounded fixture adjustment | **2 passed, 11 deselected**, 124.13s |
| Final resource provenance/redirect/legacy snapshot and Windows launcher checks | **8 passed**, 19.16s; includes overlap with root suite and one added redirect guard |
| `scripts/verify_data_handoff.py` through approved DB launcher | **psi and unified PASS**, fresh imports, schema head/readiness/inventory/dashboard HTTP200 |
| Backend Ruff check and format check | PASS;173 files formatted/checked |
| Root Data/integration/helper Ruff check and format check | PASS;28 files formatted/checked before final redirect guard, final changed files rechecked |
| `poetry check` | PASS: All set |
| `git diff --check`; protected scope/migration/Docker checks | PASS |

Do not add overlapping test counts or describe the initial root run as an all-green run.
The latest full root run is independently all-green; it includes the final redirect guard.
The root failures were fixed only in test-specific settings/barriers (60s); production
provider timeout and stale-history concurrency semantics were not changed. The provider
still runs outside the database transaction; AI quality evaluation was not performed.

## Imported profile evidence

Sanitized machine-readable results: [http-import-smoke.json](http-import-smoke.json).
HTTP transport is HTTPX ASGI through the backend's own app with real PostgreSQL.
Both profiles have24 investigations,1926 records,0 independently reviewed records.

| Profile | Sources | Passages/readiness | Challenge sources with NULL owner | Schema head |
| --- | ---: | ---: | ---: | --- |
| psi | 71 | 2508 / ready | 0 | 0004_challenge_source_scope |
| unified | 81 | 2574 / ready | 10 | 0004_challenge_source_scope |

The migration compatibility test imports a real legacy source into a newly created
0003 schema, upgrades to0004, checks its UUID/owner/version unchanged, inserts a new
null-owned resource and verifies downgrade refuses without losing either source row.
Source ownership CHECKs, legacy/default scope admission, v2 exact fields, explicit
rights, inventory binding, hash tampering and study-scoped corpus isolation are covered.

## Source acquisition and handoffs

All10 official inventory entries are stored. Six NASA article pages supply66 context
chunks. The PSI repository link is discovery-only; YouTube transcript is unverified;
Apollo1/13 downloads are unavailable here (urllib errors; Apollo1 confirmed TLS-chain
failure and Windows curl HTTP500). TLS verification was not disabled. Researcher's
Guide covers the landing article only, not its full linked PDF. Failed/unknown-rights
entries have no invented searchable chunks. A redirect outside the reviewed NASA hosts
is rights_pending and does not inherit NASA rights.

AI owner receives the new corpus/rights/status API and owns item3 evaluation. PR2 owner
and FE own item4/main conflicts, resource UI and browser acceptance. No FE tests/build
or browser acceptance are claimed for this narrowed task. Full snapshot admission still
scans the collection per request; smoke readiness/inventory reads took about5–6s on this
Windows setup. No latency SLA or performance remediation claim.

Content acquisition responsibilities and acceptance checklist:
[RESOURCE_CONTENT_HANDOFF.md](../../../docs/RESOURCE_CONTENT_HANDOFF.md). Data leads
Apollo/PDF/transcript acquisition and parser/bundle delivery; Backend reviews any needed
adapter/rights-policy extension and imports the accepted new revision. AI owns quality
evaluation. The handoff document has not been sent to other people through tools.

Delivery follow-up: the user requested completion of integration/merge and team handoff.
PR2 was observed merged at `e3277c3` on 2026-11-14; its FE conflict resolution is upstream.
This feature is being integrated into PR3, retaining its original Data commits. See
[TEAM_HANDOFF.md](../../../docs/TEAM_HANDOFF.md) for owner tasks and integration evidence.
Docker WIP remains a separate local snapshot. No production rollout or scientific sign-off.
