# Chat answer language (EN default, EN/VI switch)

Status: implemented on `feat/chat-language-toggle`; backend upstream review pending before merge.
Decision: [ADR-0009](../../docs/decisions/ADR-0009-chat-answer-language.md).

## Outcome
The grounded chat answers in English by default. The chat drawer offers an EN/VI switch that
selects the language of the provider's own framing text. Source excerpts are never translated.

## Contract (additive, backward compatible)
`POST /api/v1/chat/sessions/{id}/messages`

```json
{ "question": "FLEX-007 D0?", "language": "en" }
```

- `language`: `"en" | "vi" | null`, optional. Omitted or `null` keeps per-question detection
  (previous behaviour). Any other value → 422 and nothing is stored or sent to the provider.
- Passed to providers as `RagRequest.language` (same values, default `None`).
- Not persisted: the stored assistant text already carries the language it was produced in.

## Behaviour
- Extractive provider (`nasa-extractive-v4`): `found`, `missing`, refusal messages (`mixed`,
  `safety`, `outside`, `gravity`, `aggregate`) and the FLEX D0 source-conflict text follow
  `language`; with `None` they follow the question as before.
- Retrieval, ranking, citations, answer state and excerpt text are identical for `en` and `vi`.
- Messages produced by `ChatService` before the provider is called (`timeout`, `unavailable`)
  stay English regardless of `language`.
- Frontend: drawer header `EN | VI` group (`aria-pressed`), English by default, choice kept in
  `localStorage` (`flameguard.chat.language.v1`) and read client-side only; blocked storage
  falls back to English. Every send, including the retry after an expired session, carries it.

## Non-goals
No UI-wide i18n, no translation of excerpts/titles/citations/history, quick prompts unchanged,
no LLM or paid provider, answers stay `unreviewed`.

## Verification
- `integration_tests/test_nasa_chat_language.py` — framing per language and key, `None` parity,
  excerpt/citation equality, FLEX 1.87/1.82 kept in both languages, v4, invalid value rejected.
- `tests/integration/test_phase6.py::test_answer_language_reaches_the_provider_and_is_optional`
  (PostgreSQL) — en/vi/null/absent reach the provider; `fr`, `EN`, `""` → 422 with no provider call.
- FE `tests/aiAssistant.test.tsx` (answer language), `tests/api/chat.test.ts`.
