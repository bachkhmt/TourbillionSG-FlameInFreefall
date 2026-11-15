# ADR-0009 — Explicit chat answer language

Status: implementation decision for the user's 2026-11-15 request; backend upstream review pending before merge.

The extractive provider guessed the framing language from each question, so a Vietnamese question always received Vietnamese boilerplate. The product default is now English with a user-selected EN/VI switch.

Decision: add an optional `language` (`en` | `vi` | null) to the chat message request and to `RagRequest`. `null`/absent keeps per-question detection, so existing clients, the frozen evaluation and other providers are unaffected. The frontend always sends the viewer's choice (English by default). Only provider-authored framing text changes; admitted excerpts, citations, retrieval and answer state do not. The value is not persisted and needs no migration. Provider version becomes `nasa-extractive-v4` because the answer-composition rule changed after v3 was merged.

Rejected: translating excerpts (would alter source evidence); a UI-wide i18n layer (out of scope); storing language per session (would need a schema change for no current benefit).
