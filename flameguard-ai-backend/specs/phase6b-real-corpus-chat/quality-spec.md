# Extractive quality v3

2026-11-15 user scope: prompts4–5 in docs/HACKATHON_FIX_PROMPTS.md, narrowed to RAG only. Backend/AI behavior change through existing provider extension; no schema/API change, LLM, paid provider, generated source text or new rights policy. Manual spec/plan/tasks/analyze workflow (Spec Kit unavailable).

Outcomes: chemical/bilingual lexical recall, family-aware source comparison, explicit topic and run/history scope, localized boilerplate/refusals, useful objective/fuel passages. Unsupported cross-record aggregate questions abstain and suggest Explorer (option A). Keep conflicting values, units, quote slices, provenance/number checks and review_status=unreviewed. Provider version v3. Final acceptance criteria/tasks/verification are in `.codex/plans/rag-quality-20261115.md` at repo root.

Evaluation: frozen40-case bilingual split/hash,30 development and10 held out until retrieval is frozen. Reproducible offline CLI and CI metrics; report both splits separately and never equate engineering/retrieval tests with scientific approval. Existing HTTP integration fixtures create fresh databases only on approved test PostgreSQL55435. Backend upstream review required before merge. Rollback: unset CHAT_PROVIDER or revert provider changes; no data migration.
