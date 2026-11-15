# TourbillionSG — Agent Guidelines

Respond in Vietnamese; keep code, identifiers, and commands in their original language.

## Structure

| Directory | Role | Specific Rules |
| --- | --- | --- |
| `flameguard-ai-backend/` | Upstream FastAPI BE, 21 tables, migrations 0001→0004 | `flameguard-ai-backend/AGENTS.md` |
| `FlameInFreewall_Tourbillion/` | Next.js FE, TanStack Query + Axios | — |
| `integrations/nasa_data/` | Offline data adapter: build NASA releases, export 21-table snapshot, `corpusPolicy` registry | Do not call network, do not write to DB |
| `flameguard-ai-backend/app/integrations/rag/` | Extractive RAG with citations (AI team), plugged into BE via `RagProvider` + `CHAT_PROVIDER=extractive` | ADR-0005, `docs/CHATBOT_FLOW.md` |
| `integration_tests/` | Tests for `integrations/` (retrieval does not require DB; HTTP requires test PostgreSQL) | Run from root: `pytest` |

## Common Project Pitfalls

- **The BE architecture in this repo is the standard**; the `NASA` repo is for reference only. RAG plugs in via
  existing extension points (`RagProvider`, `select_provider`, `chat_provider_factory`), without
  using `dependency_overrides` and without subclassing `ChatService`. Make BE changes following the workflow in
  `flameguard-ai-backend/AGENTS.md` (spec + ADR), and notify the upstream BE maintainer before merging.
- Chat only quotes verbatim imported chunks that passed corpus policy: CC0 for PSI;
  NASA-authored article text requires separate rights evidence per ADR-0006 for challenge-level
  resources. Do not assign CC0 to NASA pages, images, or transcripts on your own. No LLMs,
  no paid providers. `review_status` is always `unreviewed`. Do not provide safe/unsafe conclusions.
- Preserve conflicting values and original units (e.g., FLEX-007 D0: 1.87 mm and 1.82 mm).
  Null is not 0. BM25 score is relevance, not risk probability.
- PSI id, internal UUID, and slug are three distinct identifiers.
- FE must not use simulated engines (`src/lib/ragKnowledgeEngine.ts`...) as a fallback for chat.
- Test DB only uses the dedicated container `tourbillion-test-pg` (127.0.0.1:55435). Do not touch
  other containers on the machine. Password-containing settings reside in `.demo/` (ignored).

## Verification

```bash
flameguard-ai-backend/.venv/bin/python -m pytest -q          # integration_tests
cd flameguard-ai-backend && .venv/bin/python -m pytest -q    # BE upstream
cd FlameInFreewall_Tourbillion && npm test && npx tsc --noEmit
```

HTTP/PG tests require `PHASE4_ADMIN_URL` (and the BE suite also requires `TEST_DATABASE_URL`) pointing to
the test container; if missing, they will skip. Do not count a skipped run as a pass. Use the helper:

```bash
python3 scripts/test_db.py create      # one-time, create tourbillion-test-pg
python3 scripts/test_db.py run -- flameguard-ai-backend/.venv/bin/python -m pytest -q
```
