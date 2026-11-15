# Evidence navigation readiness — 2026-11-15

User request: implement docs/HACKATHON_FIX_PROMPTS.md. Manual Specify/Clarify/Plan/Tasks/Analyze workflow; Spec Kit skills are not installed.

## Outcome and boundaries
Product pages expose admitted evidence and explicit unavailable/error states. No validated ranking/predictive model is invented. Keep 21 tables, existing contracts, corpus licensing, nulls, original measurements, and provider extension points. No LLM, paid providers, partial-gravity extrapolation or scientific approval. Backend owner review required before merge.

## Contracts
- Existing scenario/prediction/chat response envelopes remain unchanged. Frontend scenario caching keys the entire request.
- Add `GET /api/v1/catalog/descriptive` with existing catalog selection filters: origin/review context, selection semantics, selected investigation counts and raw source-record distributions/material/gravity, missing-value counts and raw oxygen/pressure observations with units. All runs inside selected investigations are counted. Source records are not independent experiments. Oxygen meaning is `unknown` unless supported by an explicitly versioned source mapping; do not infer ambient meaning from percent basis.
- Add `GET /api/v1/investigations/{investigationId}/overview`: only registry-admitted original objective/approach/impact/catalog passages; source UUID, URL, locator, text and corpus revision. Missing/mismatched corpus declaration fails closed (503); missing investigation is 404. Reuse read transaction/collection admission and corpus policy; no synthetic passages or generated summaries.
- Export deterministic code/hardware/fuel-type/pillar tags from non-null release values. Hardware labels retain original text. Pillar category is a team research-navigation annotation, unreviewed. No schema migration.
- Chat v3 uses bounded lexical normalization/chemical vocabulary/family aliases, balanced original excerpts for study comparison, query-language boilerplate and explicit abstention for unsupported cross-record aggregation. Never combine distinct named runs. FLEX D0 preserves conflicting values by source. Citations remain at most four.

## Acceptance and tasks
See ../../../../.codex/plans/hackathon-readiness-fixes-20261115.md for criteria, affected paths, sequence and verification. Add regression/contract tests before critical behavior changes. Freeze bilingual eval JSON/hash, tune only development cases, run ten held-out cases after freezing rules; report retrieval and abstention metrics by split without scientific-validation claims.

## Rollback and handoff
Unset CHAT_PROVIDER for chat rollback. Revert additive read routes/UI changes without DB changes. New tag snapshot must use a freshly admitted target/fingerprint; preserve older bundles. Validate only on dedicated PostgreSQL 55435. No deploy/shared DB import until a concrete target is provided. Record executed checks, skips, remaining URL/video/AI-use facts and upstream review separately.
