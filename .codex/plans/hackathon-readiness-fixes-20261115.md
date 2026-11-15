# Hackathon readiness fixes

## Scope and decisions
Implement docs/HACKATHON_FIX_PROMPTS.md on a dedicated branch. Preserve untracked user documents. No shared DB writes, paid providers, LLMs, safety verdicts, migrations or deployment without a specified approved target. Keep 21 tables and existing API contracts; add read endpoints where needed. User requested cross-team fixes, including FE. Spec Kit skills are unavailable; use manual spec/ADR workflow. Backend upstream review remains a merge prerequisite.

Choose Mission option A and aggregate-chat option A. Keep playbook-rag as an explicitly excluded educational prototype; do not delete source/history or claim competition eligibility. Public deployment/video URLs and complete team AI-use history require user-provided facts; prepare everything locally and record remaining gaps honestly.

## Acceptance criteria
1. FE tests, tsc and production build succeed; no ignoreBuildErrors.
2. Fallback defaults off, only explicitly enabled for transport/5xx errors; 4xx, cancellation and mapping failures propagate. Synthetic fallback is unreviewed and has a persistent visible banner. Real caveats never imply fallback. Chat/prediction/scenario mutations never silently return mock results.
3. Mission uses scenario evaluation/readiness APIs with loading/error/retry and actual states/reasons. No local ranking/gap/prediction engines or NASA-looking fabricated results in product routes.
4. RAG regression tests are written and demonstrated failing before changes. CO2/heli retrieves FLEX in top two; study/family comparison returns balanced verbatim excerpts; fuel/objective queries rank useful evidence; output language follows query. Preserve source slices, D0 conflicts, record anchoring, refusal and provenance validation. v3 version, no LLM. Unsupported cross-record aggregation abstains in query language.
5. Reproducible bilingual evaluation of 40–50 cases with 10 separately reported held-out cases, frozen before retrieval tuning and not consulted while tuning. Record corpus/provider version, Recall@4, top-one correctness and abstention. Report development and held-out separately; do not present these as independent scientific validation.
6. Export deterministic tags only from available release fields (code, original hardware, fuel-type, team pillar annotation). Study overview endpoint returns only admitted verbatim objective/approach/impact passages with source links. FE renders tags, overview, pagination-aware run condition summaries and readable missing fields.
7. Dashboard shows at least three API-based descriptive charts, honest denominators/missingness, material and gravity counts. If oxygen-pressure scatter is included, preserve basis and oxygen meaning, exclude incompatible/unknown conditions from ambient reference comparison, disclose excluded records; no inferred safety or partial-gravity evidence.
8. Remove stale fixed counts, internal terminology and nonexistent filter choices; show catalog-derived counts/options. Clarify illustrative visuals and source-record terminology.
9. Update submission/README with actual verification and RAG metrics, explicit prototype scope; leave unknown URLs/tool history explicitly unresolved instead of inventing them.

## Affected paths and sequence
1. FE build errors; queryHelpers, mockFallback and query/component catches; context banner, mission components/hooks, landing/navigation/filters and tests.
2. Backend specs/hackathon-readiness/, docs/decisions/ADR-0008-hackathon-evidence-navigation.md; integration_tests/data/chat_eval.json and test harness; RAG aliases/language/retrieval/provider plus behavior tests.
3. integrations/nasa_data/export.py and export tests; backend catalog/descriptive repository/service/schema/routes and read/corpus contracts; FE API/hook/overview/dashboard chart components and tests. Reuse collection admission/read unit of work/corpus policy, no ChatService overrides.
4. README, docs/CHATBOT_FLOW.md, DATA_HANDOFF.md, SPACE_APPS_SUBMISSION_EN.md and evaluation/verification records.

## Verification
Run targeted FE and Python checks for each change. Full FE npm test, npx tsc --noEmit, npm run build. Root and BE suites via scripts/test_db.py against ONLY tourbillion-test-pg at 127.0.0.1:55435, record failures/skips exactly. Validate snapshot with scripts/verify_data_handoff.py, fresh test-target import and HTTP smoke using project helpers; never print settings secrets. Browser smoke where tools permit: dashboard/charts, study sources/tags, mission states, chat bilingual citations, API failure UI. Final kit-reviewer independent review focused on provenance, error masking, scientific meaning/units/nulls, paging/filter denominators and benchmark leakage; fix findings and rerun relevant checks.

## Risks
Existing tests may encode fabricated states; replace their assertions with new acceptance behavior, not blanket removal. Snapshot tags alter collection fingerprints, so old targets must not be silently reused. Oxygen burner/ambient semantics differ: unknown means excluded/explicitly unknown. Held-out performance can fail: report honestly and never tune on those results. Source text inclusion is provenance-checked, not scientific approval. External deploy/video/AI-tool facts and BE-upstream review cannot be manufactured.

## Critic resolutions (before implementation)
- Scenario query key includes the complete request object (including airflow, oxygen meaning, pillar, pages, bindings and omitted/null distinction); add behavior tests for changes.
- Coverage map is included: raw oxygen/pressure points labelled by basis and investigation; meaning is explicitly unknown unless an admitted versioned semantic declaration exists. No ambient habitat comparison is drawn for unknown/burner values. If a semantic declaration cannot be supported, show a visibly separate reference panel rather than asserting point comparability, and record the scientific limitation.
- Descriptive endpoint query filters select investigations using existing catalog semantics; distributions explicitly count ALL records within those selected investigations (not condition-matched records). Return selection semantics in the payload/UI; test combined material/gravity selection and denominators.
- Fallback gets its own optional isFallback marker; synthetic origin alone never implies backend failure.
- Freeze evaluation JSON split and SHA-256 before tuning. Main may author holdout cases but must not execute or inspect their results until retrieval rules are frozen. Any subsequent tuning invalidates the held-out label and requires fresh cases. Report any-acceptable-slug Recall@4 separately from full comparison-group coverage.
- Overview gets settings through a new dependency in the existing admitted read transaction. It loads/hash-validates registry and calls admit_passages on DB chunk/source rows, rejects missing/invalid policy with 503 and returns only admitted original excerpts. Tests cover missing policy, registry tampering and unregistered chunks; no permissive fallback.
