# RAG quality — narrowed scope, 2026-11-15

User narrowed the request to RAG quality only; team owns declarations and other product work. Non-RAG work is preserved separately at `codex/hackathon-readiness-fixes-20261115` (`7dd5eee`). This branch changes only product RAG, its tests/evaluation and behavior documentation. No frontend/data-schema changes or shared/prod DB writes. Manual Spec Kit workflow; skills unavailable. Backend upstream review remains required before merge.

## Criteria
- Prompt 4: chemical/bilingual vocabulary, scoped family names, balanced general comparison with explicit-topic grounding, useful overview ranking, query-language boilerplate, v3 version. Keep original source slices, citation/policy validation, D0 conflict, record/history anchors and safety/planetary refusals.
- Prompt 5 option A: unsupported aggregate intent abstains in question language; no generated corpus summary or invented maximum.
- Freeze 40 bilingual questions (20 EN/20 VI) and split hash before tuning; 30 development, 10 holdout. Only run holdout after closing retrieval changes; any later behavior tuning invalidates held-out label and needs a new held-out set. Report Recall@4 (any accepted slug), top-one, full comparison-group coverage and abstention by split, source/registry/provider versions, and limitations. CI thresholds Recall@4 >= .85 and correct abstention >= .90.
- Address independent review regressions before closing retrieval: ordinary word "same" must not replace FLEX history anchor; comparisons must not bypass topic grounding (e.g. ticket prices/Atlantis).

## Paths
`flameguard-ai-backend/app/integrations/rag/{retrieval,provider,vocabulary}.py`, `integration_tests/test_nasa_chat_{retrieval,http}.py`, `integration_tests/data/chat_eval.{json,sha256}`, `integrations/nasa_data/chat_evaluation.py`, evaluation regression tests, Phase6b quality spec/evaluation/verification and ADR-0005 addendum, docs/CHATBOT_FLOW.md. No submission edits.

## Verification
Regression tests before fixes: initial v3 8 failures; independent-review regressions 3 failures. Targeted retrieval/provider/grounding tests after fixes. Final root and backend suites with scripts/test_db.py ONLY against tourbillion-test-pg 127.0.0.1:55435; HTTP tests use fresh targets from existing helper, never deployed Azure DB. Ruff checks/format. Independent kit-reviewer final RAG-only diff; freeze retrieval and record source digest before holdout. Optional public Azure readiness GET may identify deployed provider but do not redeploy or mutate it.

## Limits
Extractive lexical assistant remains unreviewed; benchmark is small, team-authored and not scientific or independent validation. Do not reuse playbook-rag scores. No LLM/provider fees, inferred risk probabilities, changes to corpus rights, or safe/unsafe verdicts.
