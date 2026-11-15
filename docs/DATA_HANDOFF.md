# NASA Unified Dataset: Data → Web/RAG Handoff

## Backend/Data Update — 2026-11-14, Items 1 and 2

Branch `feat/data-backend-handoff-20261114` is based on PR #3. Option A was selected:
migration `0004_challenge_source_scope`, still 21 tables. Challenge-level sources have
`source_scope=challenge`, `investigation_id=NULL`; a CHECK constraint prevents invalid scope/ownership.
No mock investigations or runs are created. Existing migrations remain intact; older snapshots are still readable.

| Current Profile | Investigations | Records | Sources | Chunks |
| --- | ---: | ---: | ---: | ---: |
| `unified` (default, adds resources) | 24 | 1,926 | 81 | 2,574 |
| `psi` (reproduces previous unified PSI) | 24 | 1,926 | 71 | 2,508 |
| `coverage` | 24 | 1,535 | 68 | 1,811 |
| `challenge` | 18 | 910 | 51 | 1,045 |

Both `psi` and `unified` have been imported and verified on a dedicated new child DB on the test server
`127.0.0.1:55435` approved by the user. Existing DB was not reset. `GET /chat/readiness`
reports 2508 / 2574 respectively; `/chat/resources` returns 0 / 10 sources respectively. This endpoint
provides `indexed`, `status`, usage rights, and source ID for downstream AI/FE integration.
Citation source metadata supports NULL investigation and source scope.

All 10 resource entries are stored. Six NASA articles contain 66 narration chunks with raw/hash/
locator and `NASA-public-use-text` rights, separate from the previous CC0 policy. PSI search is a discovery
link; video lacks a verified transcript; Apollo 1/13 failed to download so they are not indexed.
The Researcher's Guide currently only has the landing article, not the full linked PDF.
Raw details and statuses: `integrations/nasa_data/research/challenge-resources-2026-11-14/`.

Item 3 (AI evaluation) and Item 4 (PR2 FE conflicts) remain the responsibility of AI / PR2 author.

Checklist for missing Apollo/video/full Guide PDF content and leads:
[`RESOURCE_CONTENT_HANDOFF.md`](RESOURCE_CONTENT_HANDOFF.md). PSI search is an intentional
discovery link, not a missing document bug. The checklist has not yet been sent to the team.

End-of-day integration confirmation on 2026-11-14: **80 passed, 0 failed, 0 skipped**, 458.88s on
test PostgreSQL 55435. The 77 passed / 2 failed line in verification is historical from before the fixture
fix; new full-run results and JSON evidence have been moved to the top of the report.
This branch does not modify FE or the `app/integrations/rag/` algorithm. Unreviewed Docker/deployment
work is stored separately on `wip/docker-deployment-20261114` (`b950300`).

Commands for reproducible verification/import: `scripts/verify_data_handoff.py` via
`scripts/test_db.py run`; prepare dedicated preview using
`prepare_chat_preview.py --prepare-new-test-target --profile psi|unified`.
New evidence, migration impact, and limitations are in
`flameguard-ai-backend/specs/phase6c-challenge-resources/verification.md` and ADR-0006.

## Original PR #3 Handoff — Preserved as Historical Record

The section below describes the Data branch prior to the Backend/Option A extension; metrics and pending
items in this section do not supersede the current status above.

Updated 2026-11-14, branch `data/unified-dataset`. Branch branched from `feat/rag-nasa-chat`.

## Summary

`integrations/nasa_data/` builds a **unified release** shared between the dashboard
(21-table snapshot) and RAG chatbot (hashed CC0 chunks). The release runs offline, makes no
network calls, and writes no DB data.

**Official sources only.** The challenge's Resources page designates PSI as the "source of the
data". The release strictly uses **PSI files** and **PSI metadata**. NTRS papers are not in
the resource list, so they are not included.

| Release (`--profile`) | Parser | Investigations | Source records | Sources | Chunks |
| --- | --- | ---: | ---: | ---: | ---: |
| `unified` (default) | `nasa-unified-v1` | 24 | 1,926 | 71 | 2,508 |
| `coverage` | `nasa-challenge-v2` | 24 | 1,535 | 68 | 1,811 |
| `challenge` | `nasa-challenge-v1` | 18 | 910 | 51 | 1,045 |

Subsequent releases build upon prior releases. Earlier releases remain byte-for-byte reproducible.
For example, `challenge` still produces revision `91e41126…`.

The source record count is **not** the number of independent experiments. Reasons: duplicate keys exist, test
points occurred on the same day, and a single test may come from two sources. There are **0** records that have
been independently peer-reviewed / scientifically validated.

## What is in `unified`

| Layer | Content | Source |
| --- | --- | --- |
| v1 (Bach) | FLEX, BASS-II, CFI-G normal, BASS, Saffire-II/III, CFI (CSV), SAME-R; SAME/BRE converted to configuration; PSI context for 18 studies | `research/nasa-combustion-2026-11-10`, `…-11-13` |
| v2 (`coverage.py`) | CFI-G inverse 154, SPICE 469 set points, Saffire-I 2. FLEX-2/SLICE/CLD/E-FIELD/s-Flame are configuration only. FLEX calibration, Saffire ReadMe. Chunks ≤ 900 characters | Bytes already in 11/10 snapshot |
| v2 | 6 missing PSI combustion studies: PSI-47 DAFT, PSI-60/62/115/117/142. Metadata only; ground investigations labeled modeling | `research/nasa-combustion-2026-11-14/context` |
| unified (`unified.py`) | **ACME BRE**: 243 chamber test points from 2 Chamber Calculator workbooks (PSI-20). **CFI**: 227 Flex Numbers from Data Summary Spreadsheet (PSI-39), linked to 87 old CSV rows | `research/nasa-combustion-2026-11-14/psi-files` |

Detailed workbook parsing rules are in `research/nasa-combustion-2026-11-14/psi-files/README.md`.

**What Web/RAG needs to know:**
- Gas composition and Burn Fraction for BRE are **calculator values** with status
  `needs_review`. They are never converted into run O₂ conditions.
- 40 BRE test points with mismatched dates in summary sheets are **flagged**, not deleted.
- CFI has no conflicting values between CSV and spreadsheet. Columns without declared units and
  formula columns are preserved raw.
- Every observation from workbooks has locator `xlsx '<sheet>'!<cell>` pointing to the exact original cell. Tests verify
  this behavior.

## How to Build and Test

```bash
PYTHONPATH=.:flameguard-ai-backend flameguard-ai-backend/.venv/bin/python -m integrations.nasa_data.export --output /tmp/nasa-bundle
```

```bash
flameguard-ai-backend/.venv/bin/python -m pytest -q
```

Results as of 2026-11-14 (without DB):
- `integration_tests`: 59 passed, 9 skipped. HTTP/PostgreSQL tests were not run.
- Ruff passed for `integrations/` and `integration_tests/`.
- Upstream BE suite (`flameguard-ai-backend`) had 18 failed tests due to missing
  `PHASE4_ADMIN_URL`. These are PostgreSQL tests that do not auto-skip and were not caused by this branch:
  the branch did not modify any files in `flameguard-ai-backend/`.

## Action Items for Other Teams

### 1. Import new bundle into DB — **DB team**

- Run `scripts/prepare_chat_preview.py --prepare-new-test-target` (test container
  `tourbillion-test-pg`) or import into another approved target. The script automatically exports using the
  default `unified` profile.
- No new migrations required: still 21 tables, `0001`–`0003`. Snapshot has passed `snapshot_rows`.
- After importing, run `python3 scripts/test_db.py run -- … pytest -q` to execute HTTP/PostgreSQL tests as well.
  Chat readiness must report `passages=2508`.
- Bundle is approximately 40 MB (original artifacts + `release.json`).

### 2. Storing 10 official resources not belonging to an investigation — **Backend + DB Decision**

Currently `source_document.investigation_id` is NOT NULL, so Researcher's Guide, Apollo 1/13,
Mir, and 3 spinoffs have no valid place to be stored. Evaluated options:

| # | Option | Pros | Cons |
| --- | --- | --- | --- |
| A (recommended) | Additive migration `0004`: make `investigation_id` nullable, add classification column for challenge-level sources | Fewer tables, semantically accurate | Must audit publish/API/FE code wherever it assumes a source always has an investigation |
| B | Dedicated `resource_document` table + link table resource↔investigation | Does not touch existing tables | More widespread changes |
| C | Store only in `release.json`, not in relational tables | No schema changes | Difficult to query; chat cannot use it |

**Do not** create dummy investigations or assign resources to the "closest" study.

### 3. Retrieval — **AI team**

- Retrieval tests are in place for BRE, CFI, SPICE, CFI-G inverse, and DAFT.
- No large evaluation question benchmark exists yet on the new corpus. In the reference NASA repo, a 59-question gold set
  ran against `AnswerService` and identified 4 known gaps at the answering layer. That test set has not been ported
  to `nasa_chat`.

## Out of Scope for This Branch

- NTRS papers (including FLEX TP Table IX) and thesis datasets (SPICE DeBold/Dotson).
- PSI-10 (license unknown, not indexed).
- `facts`/`rankings`/`ml_*` from the legacy Data repo: no per-row hash/locator.
- All schema changes, DB imports, and pushes.
