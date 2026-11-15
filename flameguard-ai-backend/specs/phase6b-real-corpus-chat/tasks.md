# Phase 6b tasks

- [x] T001 Spec, ADR-0005 and plan (`.claude/plans/rag-be-extension-point.md` at repo root).
- [x] T002 `CorpusPassage`/`CorpusRetriever` protocol, `CHAT_PROVIDER=extractive`,
      `app/integrations/rag/` extractive provider with unit tests. Covers US1.
- [x] T003 `app/services/corpus_policy.py` loader + `admit_passages`,
      `app/repositories/corpus.py`, unit tests for rejection cases. Covers FR-003.
- [x] T004 ChatService snapshot/corpus path, verified retrieval, real grounding,
      retrieval deadline, drift recheck; `/chat/readiness`, `/chat/sources/{id}`; unit
      tests. Covers US2/US3, FR-004–006.
- [x] T005 Data adapter writes `corpusPolicy`; root PostgreSQL HTTP tests through
      `app.main.create_app`. Covers SC-002.
- [x] T006 Docs: contracts, team ownership, project status. Frontend consumes the new
      routes (owner-authorized for this scope).

Verification 2026-11-14: backend suite 679 passed on isolated PostgreSQL; root
`integration_tests` 41 passed (0 skipped) through `app.main.create_app`; frontend vitest,
`tsc` and `next build` pass; browser smoke on `uvicorn app.main:app` + Next proxy.
External acceptance (T018 scientific evaluation, backend-upstream owner review) remains open.
