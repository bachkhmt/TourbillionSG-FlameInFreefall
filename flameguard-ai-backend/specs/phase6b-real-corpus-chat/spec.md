# Phase 6b Real-corpus extractive chat

Prepared 2026-11-14 on branch `feat/rag-nasa-chat`. The project owner, who owns the
RAG (AI team) scope, approved moving source-cited chat into the backend's own
provider extension point and authorized the related Backend, Data-adapter and
Frontend edits for this scope. Decision: [ADR-0005](../../docs/decisions/ADR-0005-real-corpus-extractive-chat.md).

## User scenarios and acceptance

### US1 Source-cited answers from the admitted NASA corpus (P1)

With `CHAT_PROVIDER=extractive` and a real, unreviewed v2 collection whose manifest
declares a `corpusPolicy`, `uvicorn app.main:app` answers chat questions by quoting
admitted `document_chunk` text verbatim with citations. For example, "FLEX-007 D0"
returns both 1.87 mm (CSV row 8) and 1.82 mm (TestSheet) with their own sources.
Questions asking for safety verdicts, about Moon/Mars gravity, off-topic, or mixing
runs abstain without citations.

### US2 Backend-verified grounding (P1)

The backend, not the provider, decides which sources are allowed. It runs the
provider's optional `retrieve` on detached admitted passages, then verifies every
returned citation:

- its source/locator belongs to the admitted corpus;
- its excerpt is a verbatim slice of that chunk.

A `real` answer must carry the request corpus version and a provider version. Every
number in its text must appear in a cited excerpt. A violation returns 502 and
nothing is stored.

### US3 Readiness and citation sources (P2)

`GET /chat/readiness` tells clients whether sending can work and why not.
`GET /chat/sources/{source_document_id}` returns the registry metadata (filename,
https URL, license, SHA-256) of an admitted cited passage. The lookup is pinned to
`corpus_version`: an older version returns 409, a passage outside the corpus returns 404.

## Functional requirements

- FR-001 Reuse Router → Service → Repository and the Phase 6 `RagProvider`
  extension point (`CHAT_PROVIDER`, `app.state.chat_provider_factory`). No
  `dependency_overrides` or ChatService subclass.
- FR-002 No migration; 21 tables unchanged. No change to the shared `Citation`/
  `Answer` schemas. Phase 4–7 behavior unchanged for collections without
  `corpusPolicy` and for `unavailable`/`mock` providers.
- FR-003 Corpus admission happens in the same REPEATABLE READ snapshot as collection
  admission. The registry is re-read and re-hashed on every snapshot. Only CC0-1.0
  sources with matching SHA-256, version, URL, investigation and
  `ingestion_status=source_checked` qualify, and each chunk must match its locator
  and text hash. Any conflict returns 503.
- FR-004 `RagRequest` on the real path: `corpus_version = collection_fingerprint =`
  corpus fingerprint (scientific fingerprint + policy version + registry hash +
  source revision), and `dataset_version` = source revision.
  `phase6CollectionFingerprint` is unchanged.
- FR-005 Retrieval has the chat deadline. Exceeding it stores an explicit `timeout`
  exchange. Provider calls stay outside database transactions (ADR-0004). Drift in
  the collection or corpus fingerprint before commit returns 409.
- FR-006 Advisor keeps receiving no corpus passages. The extractive provider's
  `advise` is unavailable.

## Success criteria

- SC-001 The backend suite passes unchanged, plus the new unit tests for the policy
  loader, passage admission, retrieval, grounding and readiness.
- SC-002 Root PostgreSQL HTTP tests on the real NASA snapshot pass with 0 skips via
  `app.main.create_app` (answer, history, sources 404/409, forged citation, registry
  drift, concurrent sends, timeout, writer limits, expiry, advisor).

## Non-goals

LLM generation, embeddings, scientific review/verification, publication of
`reviewed` labels, and changes to scenario/prediction gates.
