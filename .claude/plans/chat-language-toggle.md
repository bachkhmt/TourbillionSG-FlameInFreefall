# Chat answer language toggle (EN default, EN/VI switch)

Tier T2 (FE + BE contract + RAG provider). Branch `feat/chat-language-toggle` from `origin/main` 25fdb25.

## Goal
The grounded chat answers in English by default. A visible EN/VI switch in the chat drawer
selects the language of the provider's own framing text. Source excerpts stay verbatim.

## Current behaviour
- `POST /chat/sessions/{id}/messages` body `Question{question}` (extra=forbid).
- `ExtractiveProvider` guesses language per question (`vocabulary.language`) for: `found`,
  `missing`, refusals (`mixed`, `safety`, `outside`, `gravity`, `aggregate`) and the FLEX D0
  comparison text. A Vietnamese question therefore gets Vietnamese framing.
- FE `AiDrawer` → `useSendChatMessageMutation` → `sendChatMessage(id, question)`. No language state.

## Design
1. **API (additive, backward compatible):** `Question.language: Literal["en","vi"] | None = None`.
   Absent/null keeps the current auto-detect, so existing clients, integration tests and the
   frozen evaluation (which call the provider without a language) are unchanged. Other values → 422.
2. **Provider contract:** `RagRequest.language: Literal["en","vi"] | None = None`.
   `ChatService.send(identity, question, language=None)` passes it through. The endpoint passes
   `value.language`. Language is not persisted (no schema/migration change); stored answer text
   already carries the language it was produced in.
3. **RAG:** `vocabulary.message(key, question, lang=None)` → `lang or language(question)`.
   `retrieval.refusal(question, lang=None)` forwards it. `flex_diameter_comparison(question,
   citations, lang=None)` uses `lang or language(question)`. Retrieval/ranking (`retrieve`,
   `select_passages`, `bm25`) are untouched, so citations/state are identical across languages.
   Bump `VERSION` to `nasa-extractive-v4` (answer-composition rule changed; v3 already merged).
4. **FE:** `useAiAssistantStore.answerLanguage: 'en'|'vi'` (default `'en'`), `setAnswerLanguage`.
   Persisted per browser in localStorage via `src/lib/chatSession.ts`-style helpers wrapped in
   try/catch (falls back to `'en'`). `resetConversation` does not change it. Drawer header gets a
   two-button group `EN | VI` (`role="group"`, `aria-label="Answer language"`, `aria-pressed`),
   with a hint "Source excerpts stay in their original language." `SendChatVariables.language`
   → `sendChatMessage(id, question, language)` → body `{question, language}`. Quick prompts stay
   English (they are queries; retrieval is bilingual).
5. **Docs:** spec `flameguard-ai-backend/specs/chat-answer-language/spec.md`, ADR-0009, update
   `docs/CHATBOT_FLOW.md`, `docs/contracts/ai-backend-interface.md`, post-freeze note in
   `specs/phase6b-real-corpus-chat/evaluation.md` with new provider/retrieval/vocabulary hashes.

## Acceptance criteria → test
- AC1 API accepts `language` en/vi/null; `"fr"` → 422; field absent behaves as before.
  → BE contract test on `Question` + HTTP test (PG) that `language` reaches the provider.
- AC2 `ChatService` forwards language into `RagRequest`. → unit test with a capturing provider.
- AC3 With `language="en"` a Vietnamese question gets English framing for found / missing /
  each refusal key / FLEX D0 comparison; with `"vi"` an English question gets Vietnamese framing.
  Excerpt text, citations and state identical between en and vi. → `integration_tests/test_nasa_chat_language.py`.
- AC4 `language=None` keeps detection: existing integration + evaluation tests pass unchanged.
- AC5 Provider version `nasa-extractive-v4` on answers. → existing/updated assertion.
- AC6 FE: drawer shows EN pressed by default; first send body has `language:'en'`; click VI →
  next send has `'vi'`; choice survives store reset and reload (localStorage); storage throwing
  does not crash and falls back to EN. → vitest in `tests/aiAssistant.test.tsx` (or new file).
- AC7 Full gates: integration_tests, BE pytest (PG), ruff check/format, FE vitest, tsc, build.
- Manual: browser check of toggle against a local BE on the test DB, if the chat corpus is available.

## Non-goals / risks
- No translation of source excerpts, titles, citation labels or stored history.
- No UI-wide i18n. Quick prompts not localized.
- Risk: frozen evaluation hashes change → documented post-freeze note; behaviour with
  `language=None` must be byte-identical (AC4 guards it).
- BE contract change: report to BE upstream owner before merge (repo AGENTS.md).

## Plan-critic notes (PASS-WITH-NOTES) — applied
- `integration_tests/test_nasa_chat_http.py` asserts `nasa-extractive-v3`: update to v4 (AC5), not "unchanged".
- FE exact-argument assertions to update: `tests/aiAssistant.test.tsx` (sendChatMessage calls),
  `tests/api/chat.test.ts`, `tests/api/phase5ExtendedApis.test.tsx`.
- `useChatQueries` retry after 404 must also pass `language`; add a test.
- `sendChatMessage` omits `language` from the body when undefined.
- Store must not read localStorage at creation (SSR hydration mismatch); hydrate in an effect.
- `timeout` / `unavailable` answers built in `ChatService` before the provider stay English; documented in spec.
- AC3 includes `language=None` parity per refusal key (guards byte-identical detection).
