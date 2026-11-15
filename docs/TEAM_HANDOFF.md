# Backend/Data Handoff — 2026-11-14

Scope finalized by user: item 1 DB import/verification and item 2 Option A. User requested proceeding
with integration/merge and drafting the handoff message. Item 3 AI quality and item 4 FE belong to respective owners.

## Integration

- PR2 has been merged into main at `e3277c3`; author pushed FE conflict resolutions upstream.
- Supplementary Backend/Data work continues from PR3; keep original Data commits and update with main before
  merging. Do not re-resolve FE conflicts or change RAG algorithm in this supplement.
- Unreviewed Docker changes reside separately on local branch `wip/docker-deployment-20261114`,
  commit `b950300`; not included in Data PR, not yet pushed/deployed.
- Do not import/migrate shared DB. Only verify on approved test PostgreSQL
  at `127.0.0.1:55435`; new migration must be applied before importing new bundle.

## Technical Deliverables

Option A retains 21 tables, adds migration `0004_challenge_source_scope`, and keeps 0001–0003 intact.
Challenge-level sources have `source_scope=challenge` and `investigation_id=NULL`, protected by a CHECK
constraint. Legacy study sources retain their owner. Downgrades are rejected if NULL owner sources still exist.

| Profile | Investigations | Records | Sources | Passages | Challenge resources |
| --- | ---: | ---: | ---: | ---: | ---: |
| `psi` (reproduces unified from original PR3) | 24 | 1926 | 71 | 2508 | 0 |
| `unified` (new default) | 24 | 1926 | 81 | 2574 | 10 |

`GET /api/v1/chat/resources` reports inventory/status/indexed. Six resource pages provide 66
chunks; the number of stored resources does not imply that all source contents are fully downloaded/indexed.

Evidence: [verification](../flameguard-ai-backend/specs/phase6c-challenge-resources/verification.md),
[HTTP/DB smoke](../flameguard-ai-backend/specs/phase6c-challenge-resources/http-import-smoke.json),
[full root confirmation](../flameguard-ai-backend/specs/phase6c-challenge-resources/integration-confirmation.json).
Backend full suite: 689 passed; root full suite: 80 passed / 0 failed / 0 skipped; additional regression
runs overlap, so counts should not be summed. Two 10s barrier errors from the first run were fixed in
fixtures and the full root re-run passed. Production timeouts and concurrency semantics were not changed.

## Remaining Tasks by Owner

| Proposed Owner | Tasks | Completion Criteria |
| --- | --- | --- |
| Data / PR3 author | Apollo 1/13, Guide full PDF, video transcripts with clear source/rights; add parser and new release | Raw/hash/URL/rights/locator verifiable, no revision overwrites; checklist at [RESOURCE_CONTENT_HANDOFF](RESOURCE_CONTENT_HANDOFF.md) |
| Backend + DB | Receive supplementary bundle; review adapter and rights policy for PDF/transcript; migrate/import to deployment target once target is approved | Run compatibility checks and HTTP readiness/inventory on that target; do not treat test DB as updated shared DB |
| AI | Evaluate retrieval, citation, abstention VI/EN on corpus 2574 and unindexed sources; document limitations/benchmarks by corpus version | Quality and regression report; do not infer quality solely from passing HTTP tests |
| PR2 author + FE | Verify chat after merging with main: new UI, open/close, reload/history, pagination, citation/source, timeout/error; run FE tests/types/build and browser smoke | Evidence on new main; previous conflicts resolved upstream, only handle new conflicts if they arise |

PSI search is an intentional discovery link. Apollo 1/13 has not been downloaded yet; video lacks verified
transcripts; Guide currently has only the landing article, not the full PDF. The current parser is designed for HTML
article narration; schema support for sources does not imply that PDF/video can be indexed automatically.

Full corpus admission still scans on every request; GET smoke takes approximately 5–6s on the current machine.
If latency impacts demo, Backend/AI should measure before optimizing and maintain provenance checks.
Stale-history concurrency remains a known limitation previously discussed, not fixed within this scope.
All answers remain unreviewed; no scientific sign-off or production acceptance has been granted.

This document is for user handoff; agent does not send messages to teams directly.
