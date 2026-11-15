# ADR-0005 Real-corpus extractive chat through the provider extension point

Accepted by the project owner (RAG/AI owner) on 2026-11-14.
Spec: [Phase 6b](../../specs/phase6b-real-corpus-chat/spec.md).

## Context

Phase 6 (ADR-0004) shipped persistent chat with `unavailable`/`mock` providers. Its
citation validation rejected `origin=real`, and real-source publication was waiting
on T018. An earlier prototype served real NASA excerpts from a separate app factory
that overrode `ChatService`. That bypassed this backend's gate and duplicated its
send logic.

## Decision

1. Real-corpus chat is enabled only through `CHAT_PROVIDER=extractive` (or a trusted
   `chat_provider_factory`), and only when **all** of these hold:
   - the provider implements the optional `CorpusRetriever.retrieve`;
   - the admitted v2 collection is `origin=real` and `reviewState=unreviewed`;
   - its manifest declares `corpusPolicy` (policy version, registry file, registry
     SHA-256, source revision).
2. The Data adapter produces the registry. It lists CC0-1.0 sources (SHA-256, version,
   URL, investigation, slug, filename) and chunk locator/text hashes. The backend
   validates the registry against the admitted rows. Rights other than CC0-1.0 are
   excluded.
3. The backend owns grounding:
   - only backend-verified retrieval hits become `allowed_sources`;
   - a `real` answer must match the request corpus version, name its provider
     version and cite only allowed sources;
   - on a real corpus, every standalone (signed) number in **any** answer must equal
     a whole number token of its cited excerpts. Digits inside identifiers such as
     `FLEX-007` or `D0` do not count. Registry sources must use https links.
4. Answers stay `review_status=unreviewed`. This is research navigation, not
   scientific validation or safety certification. T018's scientific evaluation
   remains open.
5. The AI team owns `app/integrations/rag/` (retrieval, refusal rules, answer
   composition). The backend owns the protocol, admission, grounding and
   persistence.

## Consequences

- Collections without `corpusPolicy` and the `unavailable`/`mock` providers behave
  exactly as in Phase 6. Their fingerprints are unchanged.
- Concurrency follows ADR-0004. Providers run outside transactions, and commits are
  serialized per session, so two simultaneous questions may both see the history
  that existed before either was answered.
- Operators enable the feature with `CHAT_PROVIDER=extractive` plus a v2 manifest
  containing `corpusPolicy`. Rollback means unsetting `CHAT_PROVIDER` or removing
  the declaration. Stored rows stay readable.


## 2026-11-15 — Extractive provider v3

Under the user-requested RAG quality fixes (Phase6b quality spec), lexical normalization, bilingual boilerplate, family comparison excerpts and explicit aggregate abstention are versioned as `nasa-extractive-v3`. The provider extension, original-source slice checks, numeric grounding and unreviewed status remain enforced. No generated condition summaries or LLM provider are admitted. See the versioned evaluation report in `specs/phase6b-real-corpus-chat/evaluation.md` (relative to backend root).
