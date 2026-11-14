# Phase 6b tasks

- [ ] T001 Spec, ADR-0005 and plan (`.claude/plans/rag-be-extension-point.md` at repo root).
- [ ] T002 `CorpusPassage`/`CorpusRetriever` protocol, `CHAT_PROVIDER=extractive`,
      `app/integrations/rag/` extractive provider with unit tests. Covers US1.
- [ ] T003 `app/services/corpus_policy.py` loader + `admit_passages`,
      `app/repositories/corpus.py`, unit tests for rejection cases. Covers FR-003.
- [ ] T004 ChatService snapshot/corpus path, verified retrieval, real grounding,
      retrieval deadline, drift recheck; `/chat/readiness`, `/chat/sources/{id}`; unit
      tests. Covers US2/US3, FR-004–006.
- [ ] T005 Data adapter writes `corpusPolicy`; root PostgreSQL HTTP tests through
      `app.main.create_app`. Covers SC-002.
- [ ] T006 Docs: contracts, team ownership, project status. Frontend consumes the new
      routes (owner-authorized for this scope).
