# ADR-0008 — Evidence navigation without simulated scientific results

Status: implementation decision for the user's 2026-11-15 hackathon fixes; backend upstream review pending before merge.

Amended by [ADR-0010](ADR-0010-predictive-lab-report.md): Predictive Lab returns as a readiness + exploratory report page without predictions.

Keep existing schema/contracts. Mission is superseded by [ADR-0007](ADR-0007-mission-research-lookup.md): when the branches were merged on 2026-11-15, main's `/mission/research` lookup replaced the Prompt 2 option A scenario-state panels, and Predictive Lab is removed. Chat abstains on unsupported cross-record aggregate questions (Prompt 5 option A), rather than generating derived corpus summaries. Extractive provider v3 may normalize lexical search and localize boilerplate; admitted source excerpts remain unchanged and answers unreviewed. No LLM or paid provider. The chat v3 code and its evaluation ship separately in PR #7 (`codex/rag-quality-20261115`).

Add separate descriptive catalog and corpus-checked study overview read endpoints. Descriptive distributions count all source records in the investigations selected by catalog filters; they are not run-matching scores. Preserve oxygen basis and unknown physical meaning. Unknown/burner oxygen points cannot establish ambient habitat coverage. Show habitat reference conditions separately when comparability is not established. Missing values remain missing.

Use existing tag tables for deterministic source-derived code, original hardware and fuel-type labels; pillar tags are explicitly team annotations, unreviewed. Tag exports change collection fingerprints and require fresh target admission, never silent mutation of an existing bundle.

Fallback is explicit opt-in for transport/server errors and always marked synthetic/unreviewed with a distinct fallback marker. Errors from validation, mapping, not-found and cancellation propagate. Mutating evaluation/prediction calls never silently fabricate results.

Evaluation is a small team-authored bilingual retrieval benchmark, with a frozen split/hash and separately reported held-out results; it is not scientific validation. Scientific review and deployment acceptance remain separate.


Implementation clarification: the existing release already preserves an explicit `oxygenContext` value per record (`chamber`, `burner_oxidizer_stream`, or unknown). Export it losslessly as a textual test_condition variable, without migration. The descriptive read service uses only that explicit stored context; older targets without it remain `unknown`. Chamber context and burner/unknown points appear on separate maps; atmosphere references are shown only on the chamber-context map. Percent basis stays separately encoded and does not establish scientific comparability.
