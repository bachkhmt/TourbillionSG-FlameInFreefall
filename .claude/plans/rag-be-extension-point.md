# RAG via BE extension point (Option B) + NASA-style chatbot UI

Tier T3 (modify real data gate, verify citations, DB runtime). Branch `feat/rag-nasa-chat` (PR #2).
The canonical standard is the BE architecture of this repo: `flameguard-ai-backend/AGENTS.md`,
`docs/contracts/ai-backend-interface.md`, ADR-0004, `specs/phase6-rag-advisor/*`.
The NASA repo is for reference only (retrieval/provider code, chat UI style).

## User decisions (2026-11-14)
- Chose Option B: RAG integrates into BE via the existing extension point, running with `app.main:app`.
- Chatbot UI adopts the NASA chat style (panel, bubble, privacy, paginated Conversation history,
  citation/View source, textarea), **keeping the blurred backdrop** of the current repo when open.

## Design
### BE (`flameguard-ai-backend/`, additive changes, no migration)
1. `app/core/config.py`: `chat_provider` adds `"extractive"`.
2. `app/integrations/chat.py` (protocol boundary):
   - `CorpusPassage` (chunk_id, source_document_id, investigation_id, slug, title, locator, text).
   - Optional protocol `CorpusRetriever.retrieve(question, passages, prior_questions, study_slugs)
     -> tuple[Citation, ...]`.
   - `select_provider`: `"extractive"` → `ExtractiveProvider`.
3. `app/integrations/rag/` (AI team algorithm code): `text.py`, `bm25.py`, `retrieval.py`,
   `provider.py` (`ExtractiveProvider`: `retrieve`, `answer`, `advise` → unavailable).
   Ported from NASA, removing external dependencies outside BE.
4. `app/services/corpus_policy.py` (BE admission for real corpus): reads declaration
   `corpusPolicy` in collection manifest {policyVersion, registry, registrySha256,
   sourceRevision}; registry in the same directory (blocks path traversal), matching hash/version;
   only when origin `real` + reviewState `unreviewed`. Pure function `admit_passages(rows, registry)`
   cross-checks each chunk/source (license CC0-1.0, sha256, version, url, investigation,
   locator, text hash, `ingestion_status=source_checked`) → conflict error = 503.
5. `app/services/chat.py`:
   - `_read(investigation, corpus=False)` reads admission + (optional) passages **in the same
     snapshot REPEATABLE READ**; `context()` retains the 3-tuple signature.
   - Corpus fingerprint = scientific fingerprint + policy version + registry hash + revision.
   - `send`: if real collection has corpusPolicy and provider has `retrieve` → BE calls retrieve
     (to_thread), **BE verifies each hit**: (source, locator) belongs to corpus, excerpt is a verbatim
     slice of chunk, ≤ 4 → `allowed_sources`. Provider `answer` still runs outside
     transaction (ADR-0004). Re-check fingerprint before writing; drift → 409.
   - `validate_citations(answer, allowed, synthetic, real_corpus=False)`: `origin=real` is only valid
     when `real_corpus` and `review_status=unreviewed`; old rules remain intact.
6. `app/api/v1/endpoints/chat.py`: add `GET /chat/readiness` and
   `GET /chat/sources/{source_document_id}?locator&corpus_version` (snake_case, `no-store`,
   response model in `app/schemas/api/chat.py`). 409 when corpus_version differs, 404 when not
   in corpus.
7. BE process: `specs/phase6b-real-corpus-chat/{spec,plan,tasks}.md`, ADR-0005, update
   `docs/contracts/ai-backend-interface.md`, `docs/team-ownership.md` (AI owns
   `app/integrations/rag/`), `docs/project-status.md` (Phase 6 row).

### Data (`integrations/nasa_data/`)
- Add `corpus_registry.py`: `registry_for(release)`, `write_corpus_policy(manifest, release)`
  (transferred from `nasa_chat/policy.py`, declaring key `corpusPolicy`).

### Removal
- `integrations/nasa_chat/` (app factory + override ChatService), `scripts/run_chat_backend.py`
  switch to running `app.main:app` with `CHAT_PROVIDER=extractive`.

### FE
- DTO/mapper readiness + source switched to snake_case.
- `AiDrawer` following NASA style: rounded floating panel on the right (navy header + Close button),
  privacy `<details>`, connection status line + Retry, "You"/"FlameGuard AI" bubbles
  (navy background for user), provenance note, citation (excerpt when not yet in text, View source,
  license, fingerprint), quick prompts, `role=alert` error, "Conversation history" with
  Refresh history / Previous / Next / Start new session (50 messages per page, offset),
  textarea + "Send"/"Sending…" button. History: server page + "recent" for current view,
  does not insert new messages into old pages. **Keep backdrop `bg-black/40 backdrop-blur-xs`**, Escape.
- Keep review fixes: callback in mutation, epoch, resync on timeout.

### Root
- `integration_tests`: chat_target uses `write_corpus_policy`, settings `chat_provider="extractive"`,
  HTTP test runs `app.main.create_app`; retrieval test imports `app.integrations.rag`.
- Docs: CHATBOT_FLOW, AGENTS, README.

## Acceptance criteria
- AC1 `uvicorn app.main:app` + `CHAT_PROVIDER=extractive` + manifest has corpusPolicy → readiness
  `ready`, FLEX-007 outputs 1.87/1.82 mm with citation (PG HTTP test + browser smoke test).
- AC2 No corpusPolicy / origin is not real / provider mock|unavailable → legacy Phase 6 behavior
  remains intact (BE suite 650 legacy tests pass, no modifying legacy tests unless contract changes).
- AC3 BE Unit: policy loader rejects wrong hash, path traversal, wrong version, license other than CC0,
  wrong origin/reviewState; admit_passages catches conflicts; hits with non-verbatim excerpt are rejected;
  `validate_citations` rejects real when there is no real_corpus or review is not unreviewed.
- AC4 No more `dependency_overrides`/subclass ChatService; `integrations/nasa_chat` deleted.
- AC5 Root integration_tests 0 skip on container 55435; ruff BE + root clean.
- AC6 FE: vitest (paginated history Refresh/Previous/Next, recent not inserted into page, backdrop
  present and click closes drawer, legacy tests for readiness/source/timeout/epoch), tsc, build.
- AC7 Each commit builds/tests independently.

## Commit sequence
1. docs(be): spec + ADR-0005 (+ this plan).
2. feat(be): corpus policy + protocol + config (with unit tests).
3. feat(be): `app/integrations/rag` extractive provider (with unit tests).
4. feat(be): ChatService real-corpus path + readiness/sources (with unit tests).
5. refactor: registry to nasa_data, delete nasa_chat, update integration_tests/scripts.
6. feat(fe): DTO snake_case + NASA-style UI (with tests).
7. docs: CHATBOT_FLOW, AGENTS, README, project-status/contracts.

## Revisions after plan-critic (REVISE → addressed)
1. Commit: merge config + protocol + `app/integrations/rag` + unit test into **one** commit.
2. Grounding for `origin=real` (`validate_real_answer`):
   - `corpus_version` must match the request's corpus fingerprint; `provider_version` non-empty.
   - Every number in text (excluding marker `[n]`) must exist in the cited excerpt.
   - `allowed_sources` only includes hits retrieved by BE and verified by BE.
   - Real collection with policy: citations may only be accompanied by `origin=real`.
3. Request on real path: `corpus_version = collection_fingerprint = phase6CorpusFingerprint`,
   `dataset_version = sourceRevision`. `phase6CollectionFingerprint` preserved byte-for-byte;
   new keys are only added when reading corpus and policy is present.
4. Re-check after provider: compare collection fingerprint, source of `context()`, and corpus fingerprint.
   `context()` still returns `()` for real collection, so Advisor receives no passage.
5. Registry is read and re-hashed on each snapshot read, no caching.
6. Concurrency: retain ADR-0004 (provider runs outside transaction, lock on commit). Test two messages
   sent concurrently on real path: both 201, consecutive user/assistant pairs.
7. `/chat/sources`: full admission + `admit_passages`, only return admitted passages.
8. Readiness:
   - provider unavailable → `not_ready [PROVIDER_UNAVAILABLE]`
   - runtime missing → `[RUNTIME_STORAGE_UNAVAILABLE]`
   - admission or writer error → `[CHAT_CONFIGURATION_UNAVAILABLE]`
   - has retrieve without policy or passage → `[CORPUS_POLICY_UNAVAILABLE]`
   - has retrieve and corpus → `ready/retrieval_only`
   - other provider → `ready/provider`
   Separate new schema; do not modify `Citation`/`Answer`.
9. Additional tests:
   - real collection + provider without retrieve → abstain;
   - real answer on synthetic collection → 502 (legacy test intact);
   - timeout on real path saves `state=timeout`;
   - Advisor with extractive provider → `PROVIDER_UNAVAILABLE`.
10. Retrieval has deadline `chat_timeout_seconds` → `state=timeout`. Note in spec: user is
    RAG owner (AI) and has permitted modifying FE and BE within this scope (2026-11-14).

## Risks
- Modifying upstream BE: need to notify upstream BE maintainer before merging.
- Provider runs outside lock (ADR-0004) → two messages sent concurrently read the same history; differs from NASA
  (holds lock entire turn) but conforms to BE contract.
- Admission scans entire DB on each request (known, unchanged).
