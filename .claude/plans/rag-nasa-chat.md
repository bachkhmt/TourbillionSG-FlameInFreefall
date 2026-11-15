# RAG NASA chat end-to-end (port from /Users/mac/Projects/NASA)

Tier: T3 (DB roles/writer, concurrency/advisory lock, citation accuracy).
Branch: `feat/rag-nasa-chat` from `main@5b6c720`. One commit per step; finally push + PR.

## Decisions finalized with user (2026-11-14)
- Scope: End-to-end RAG (data adapter → chat extension → tests → FE AI Drawer → docs).
- Generation: extractive, no LLM (`nasa-extractive-v2`), no paid provider.
- Push: separate branch + PR into main.
- Test DB: new Postgres 17 container, dedicated to this repo, port 127.0.0.1:55435.

## Architecture principles brought over
1. **BE remains unchanged.** `flameguard-ai-backend/` is not modified. Extensions live outside BE,
   in `integrations/`, and connect via app factory + `dependency_overrides`
   (`integrations/nasa_chat/app.py:create_app`). No monkeypatching upstream validators.
2. **Offline data adapter** (`integrations/nasa_data/`): builds releases from NASA files
   already saved in the repo, exports snapshots of 21 tables + slugs + registry. No network calls,
   no DB writes.
3. **Source policy**: only chunks from CC0-1.0 sources, with hash and registry pinned to
   sourceRevision. Corpus fingerprint = scientific snapshot + policy + registry hash.
4. **Extractive provider**: only quotes verbatim chunks (≤4 citations), rejects by
   rules (safe/unsafe, out of scope, Moon/Mars gravity, mixing multiple runs).
   Service verifies provider's answer using ExtractiveProvider itself.
5. **Atomic storage**: per-session advisory lock from history read until commit,
   `lock_timeout` 5s, checks corpus drift before INSERT, rollback on error.
6. **No simulated FE fallback**: AI Drawer calls the real API; if readiness is `not_ready`,
   lock Send + Retry. Remove `ragKnowledgeEngine` from runtime.

## Steps and acceptance criteria
S1. Monorepo scaffolding: root `.gitignore` (.demo/, .venv/…), root `pytest.ini`
    (testpaths integration_tests, pythonpath `. flameguard-ai-backend`), root `AGENTS.md`.
    AC: `pytest --collect-only` at root collects integration_tests.
S2. `integrations/nasa_data/` (challenge, pilot, export, resources, research data).
    AC: test export: revision `91e41126…`, 21 tables, 18 investigations, 910 runs,
    51 sources, 1045 chunks, origin real, 0 reviewed, artifacts match sha256.
S3. `integrations/nasa_chat/` + `integration_tests/` (retrieval 14 tests without DB;
    HTTP 9 tests requiring DB; `chat_target.py` only accepts 127.0.0.1:55435).
    AC: retrieval tests pass (FLEX-007 preserves both 1.87 and 1.82 mm; follow-up keeps anchor;
    rejects safe/unsafe, Mars/Moon; excerpt is a verbatim slice of chunk).
S4. Test container `tourbillion-test-pg` (postgres:17, 127.0.0.1:55435, random password
    stored in `.demo/test-db-settings.json` mode 0600, not committed).
    AC: full BE suite passes with TEST_DATABASE_URL (0 skip for PG portion);
    9 HTTP chat tests pass: answer/history/source binding, fake citation gets 502,
    registry change → 409/rollback, 2 messages sent concurrently in order, writer role
    permissions restricted, timeout, session expiration 404.
S5. FE: `src/api/dto/chat.ts`, `src/api/services/chatService.ts`,
    `src/hooks/api/useChatQueries.ts`, session token in sessionStorage,
    AiDrawer/AiMessageItem/CitationBadge use API; remove import ragKnowledgeEngine.
    AC: vitest pass (new tests mock API: readiness not_ready locks Send; send creates session
    then shows answer + citation; 404 session → delete token; View source calls
    `/chat/sources/{id}` with corpus_version, 409 displays stale version notice);
    `tsc --noEmit` and `next build` pass.
S6. `scripts/prepare_chat_preview.py` (creates new preview target on 55435) +
    run BE factory on port 8111, FE on port 3311 via proxy; browser smoke test.
    AC: query "FLEX-007 D0" shows 1.87/1.82 mm with citation, reload shows history.
S7. Docs: `docs/CHATBOT_FLOW.md`, update root README (how to run RAG).
S8. Reviewer (focus: concurrency, data integrity, security of writer role/CORS),
    full gate, push branch, open PR.

## Revisions after plan-critic (REVISE → addressed)
1. HTTP chat tests read `PHASE4_ADMIN_URL`; BE suite reads `TEST_DATABASE_URL`. AC S4 requires
   both and **0 skip** for `integration_tests`.
2. Container admin: superuser `postgres` (container used only for tests), URL points to DB
   `flameguard_test_admin` (matching `flameguard_test_[a-z0-9_]{1,35}`); fixture creates child DB/roles.
3. Port 55433 → 55435 in `chat_target.py` (guard + error message) and
   `scripts/prepare_chat_preview.py` (assert, URL, help text); container name changed accordingly.
4. `/chat/sources/{id}` requires both `corpus_version` and `locator`; FE tests both 404 and 409.
5. Readiness/sources returns camelCase, core chat part snake_case → FE DTO declares exact shape for each.
6. POST message uses separate 30s timeout (BE chat 10s + lock_timeout 5s).
7. `.gitattributes` for `integrations/nasa_data/research/** -text` (done in S2).
8. Only port export tests from `test_remote_authority.py` (omit source-lock/rebuild-kit).
9. Root run command: `flameguard-ai-backend/.venv/bin/python -m pytest` (venv has pytest-asyncio);
   `ruff check integrations integration_tests` using venv ruff.
10. Preview S6: load JSON settings into env (`DATABASE_URL`, `RUNTIME_DATABASE_URL`,
    `CATALOG_COLLECTION_MANIFEST`) then run factory; document in CHATBOT_FLOW.
11. FE routes through `/api/proxy` so no CORS needed for 3311; `persist_preview` creates file via
    `os.open(..., 0o600)` from the start.
12. S5 write vitest before modifying AiDrawer; cover 409/timeout/not_ready. QUICK_PROMPTS moved
    to separate FE file (`src/lib/chatPrompts.ts`); `ragKnowledgeEngine`/`ragSyntheses` removed from
    runtime, delete if no longer imported (update related tests).

## Out of scope / risks
- Do not touch simulated Mission/Predictive Lab (different task). No BE source-lock,
  rebuild-kit, playbook-rag, Windows launcher.
- `admit_collection` scans entire DB on each request (known, unchanged due to upstream BE).
- Session ID is only a demo token, not auth.
- Rollback: delete branch; test container can be stopped/deleted independently (contains test data only).
