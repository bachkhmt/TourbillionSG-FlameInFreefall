# Data Team → Backend compatibility audit (Phase 3B)

**Date:** 2026-11-12
**Status:** Temporary audit for review and decision-making; not an approved import contract.
**Scope:** Read-only across Data Team repository and backend repository. No ETL/import/test execution, no changes to database or Phase 4.

## A. Current compatibility assessment

**Partially compatible.** The backend can represent investigations, runs, conditions, and most numeric measurements using the current schema. However, it cannot yet ingest and publish the Data Team's output intact: categorical/text measurements, quality flags, run/measurement-level provenance, time series, and ranking results lack complete mappings. Phase 4 also lacks an admission and publication mechanism for Data Team-curated collections.

The [Build report](../../../Nasa-hackathon-dataprocessing/data/unified/BUILD_REPORT.md) records **19 investigations, 1,687 runs, 6,574 measurements, 882 time series samples, 43 facts, and 456 ranking rows**. These figures are from the existing build report; this audit does not re-run ETL or scientifically verify the results. There are 11 investigations with run-level data; the remaining 8 investigations currently consist primarily of metadata.

The Dataset Report is located at [Data Team docs](../../../Nasa-hackathon-dataprocessing/docs/Flame%20in%20Freefall%20-%20Dataset%20Report.md). Prior to creating this audit file, the backend did not have a `docs/references/` directory.

## B. Field mapping matrix

**Direct** means a corresponding column exists. **Adapter** means type/unit conversion or splitting into multiple rows is required. **Missing** means full semantics cannot be preserved in the current schema.

| Data output and field | Target backend | Assessment and rules |
| --- | --- | --- |
| `experiments.psi_id`, `full_name` | `investigation.psi_id`, `title` | **Direct.** `experiment_id` requires a stable mapping manifest to UUID; public slug is a third identity, not a replacement for PSI ID. |
| `experiments` purpose/objectives, platform | `investigation.research_purpose`, `platform` | **Adapter**, only when source metadata is confirmed by Data Team. Do not infer platform from hardware name. |
| `experiments.pillar[]`, family | `tag` + `investigation_tag` | **Adapter** with tag dictionary and versioning rules. |
| `experiments` PI, sensors, hardware, aliases, tier, envelope, report paths, counts | No corresponding catalog columns | **Missing** if needed to store/return per field. Do not cram everything into `research_purpose` or `platform`. Counts can be recomputed; envelope should only be inferred from matching runs or stored as sourced metadata. |
| `runs.run_id`, `experiment_id`, `psi_id` | `test_run.external_run_key`, `investigation_id` → `investigation.psi_id` | **Adapter.** Generate separate UUID; verify unique `run_id` within the agreed scope. Current schema does not enforce uniqueness on external run key. |
| `runs.fuel`, `geometry`, `gravity_g` | `test_run.material_type`, `sample_geometry`, `gravity` | **Adapter with risk of detail loss.** `fuel` is not synonymous with material in all cases; numeric gravity and unknown state require consistent representation. |
| `runs.campaign`, `date`, `fuel_base`, `fuel_fraction`, `fuel_secondary`, `fraction_basis`, `fuel_phase`, `flame_config`, `size_mm`, `size_kind`, `flow_kind`, `atmosphere_status`, `aging_s`, `notes` | Primarily `test_condition.variable`, `value_numeric`/`value_text`, `unit`, `data_status` | **Adapter**, each property becomes a separate condition, preserving original variable name, unit, and status. `date`/campaign/notes lack dedicated run columns; condition-based representation requires approval if used for queries. |
| `runs.x_o2`, `x_n2`, `x_co2`, `x_he`, `oxidizer_x_o2`, `pressure_kpa`, `flow_cm_s`, `fuel_velocity_cm_s` | `test_condition` | **Appropriate adapter.** Preserve mole fraction `0–1`, kPa, cm/s. `oxidizer_x_o2` must be a distinct variable from ambient `x_o2`; inverse flames have ambient O₂ as null. |
| `measurements.metric`, `value`, `unit` | `measurement.observable`, `measured_value`, `unit` | **Direct after renaming**, using Decimal from source string. Do not alter 0, null, or units without approved conversion rules. |
| `measurements.value_text` for `ignition`, `flame_outcome`, `end_mode`, `cool_flame`, `lifted` | No `measurement.value_text` | **Missing.** Could be temporarily represented as `test_condition.value_text`, but that reclassifies a measurement as a condition and distorts API groupings. Requires schema/contract decision. |
| `measurements.flag`, `provenance`, `source` | No corresponding column in `measurement` | **Missing, risk of data loss.** Flags such as `reported_zero`, `within_sensor_noise`, `operational_no_ignition` must stay attached to the correct measurement. |
| `timeseries.time_s`, `metric`, `value`, `unit`, `source_file` | `measurement.raw_asset_ref` | **Suitable only at asset reference level.** No time sample table, channel, or time axis exists. Do not collapse 882 samples into a single scalar measurement. |
| `experiments.doi`, `runs.source`/`source_file` | `source_document.doi`, `source_url`, `document_type`, `version` | **Source reconciliation required.** Citation text and repo paths do not automatically constitute original document URLs. Detailed sources exist in `research/*/SOURCES.md`, records, and download manifests, but have not been compiled into a canonical document manifest linking each row. |
| `facts.statement`, `condition`, `source_ref`, `confidence`, values/limits/formulas | `evidence_claim.claim_text`, `limitation`; `claim_source` → `source_document` | **Partial only.** `source_ref` must resolve to actual document ID and locator. Structured storage is lacking for numeric range, formula, confidence, and discrete conditions. Do not unilaterally classify a fact as a reviewed claim. |
| `scenarios` | `scenario` | **Adapter**: `x_o2` fraction → `oxygen_pct`; kPa → `pressure_psi`; numeric gravity → conventional string. `material` and `ventilation` are required columns but Data scenarios do not supply counterparts, precluding faithful creation of complete records. |
| `scenario_priors`, `rankings` | `scenario_match`/`match_dimension` | **Semantic mismatch.** Data Team ranking is at investigation level, by scenario and pillar; `scenario_match` currently represents **scenario → test_run**. Do not assign investigation score to an arbitrary run. |
| `fuel_properties`, five `ml_*` views | No equivalent persistence target | **Out of scope for Phase 4.** Auxiliary/AI input data requiring independent versioning, sources, and contracts. ML views may intentionally drop or NaN flagged values; do not use in place of raw measurement tables. |

Cross-reference sources: [unified schema](../../../Nasa-hackathon-dataprocessing/etl/schema.py), [ETL build](../../../Nasa-hackathon-dataprocessing/etl/build.py), [catalog models](../../app/models/catalog.py), [evidence models](../../app/models/evidence.py), [scenario models](../../app/models/scenarios.py).

## C. Backend gaps

1. **Insufficient provenance granularity.** `source_document` belongs to investigation and `claim_source` links claims to documents/runs, but there is no direct source link for individual runs or measurements. `measurements.source` can differ from `runs.source`; using the run source in place of the measurement source breaks traceability.
2. **Categorical measurements and quality flags lack proper storage targets.** A nullable numeric column is insufficient to preserve `value_text`, `flag`, and provenance of measurements.
3. **Telemetry is limited to file references.** Asset, channel, time, unit, access permissions, and version contracts are needed before exposing a time series API.
4. **Catalog metadata is insufficient for Data Team experience.** Hardware, sensors, year, family, tier, envelope, and ranking lack corresponding DTOs or columns. Phase 4 currently returns unavailable for many fields instead of inventing data.
5. **Admission/publication remains locked.** [Collection service](../../app/services/collection.py) accepts only synthetic or unreviewed real/unknown data via exact-matching 21-table snapshots and a read role; `reviewState=curated` is rejected. `seed_demo_data.py` is strictly for synthetic data, not an importer for the Data Team.
6. **Sources and review are unstandardized.** `source_url` is required, whereas `source` in unified data is citation text. Original document URLs, locators, checksums/versions, retrieval timestamps, and curator decisions are needed prior to publication. Phase 4's `verifiedRunCount` remains unknown.
7. **Conflicting documentation requiring resolution.** At the time of this audit, [AGENTS.md](../../AGENTS.md) and [documentation map](../documentation-map.md) designated the ERD as frozen/authoritative. This policy was updated in [ADR-0003](../decisions/ADR-0003-schema-evolution-and-hackathon-prototype.md): the 21-table ERD is the current baseline and can evolve via approved migrations. [Masterplan](../../../Nasa-hackathon-dataprocessing/Masterplan.md) describes E-FIELD as simulating partial gravity, whereas the Dataset Report rejects that conversion. The two calculation methods for **usefulness score** (`dataset_catalog`) and **scenario ranking score** (`rank.py`) also differ; APIs must assign separate names and versions rather than referring generically to "score".

## D. Proposed adapter boundary

- **Data Team:** owns ETL, scientific normalization, source manifests, quality flags, unit dictionary, review, and import execution.
- **Backend Phase 3B:** receives **versioned exports**, verifies schema/identity/units/nulls/sources, establishes UUID–PSI–run key–slug mapping plans, verifies lossless fidelity, and generates accepted/rejected reports. The adapter transforms curated output into the persistence schema; it does not rewrite NASA parsers.
- **Read API:** continues using repository/service layers to read admitted data. Data Team rankings should flow through a result contract containing `algorithmVersion`, scenario, pillar, components, data version, and caveats; do not disguise them as Phase 4 sorting.
- **Scientific/AI gate:** models, advisors, and derived comparisons require separate AI/Data review. Backend only verifies contracts, provenance, and publication prerequisites.

For a different official NASA dataset on **2026-11-14**, the layered architecture and long-form `test_condition`/`measurement` schema help ingest **new numeric variables and metrics** via adapters. This capability **does not guarantee** preserving new data types, telemetry, row-level provenance, or investigation-level rankings. Extension contracts should be finalized after examining the official sample, rather than designed around PSI prototype assumptions.

## E. Potential schema changes

| Level | Conditional proposal |
| --- | --- |
| Feasible via adapter only | New numeric/text conditions; documented unit conversion while preserving originals; stable UUID generation; tag mapping; linking `psi_id` to investigation; file-level asset references. |
| Migration recommended | `measurement.value_text`, quality flag/status, and measurement-level provenance or metadata table; run/measurement → source document + locator linkage; run date/campaign if filtering/querying is required; structured catalog metadata; investigation/scenario/pillar/version ranking result tables if storage and querying are required. |
| Defer until official sample | Time series/channel/asset design; multiple sources per observation; composite uncertainty; dataset identity/versioning; new measurement types beyond scalar/categorical. |

Do not modify migrations `0001–0003`. If approved, generate a new revision and document an ADR along with a data preservation plan.

## F. Phase 3B readiness checklist and acceptance tests

1. Data Team delivers a versioned manifest including original NASA sources, URL/DOI, file hashes, locators, license/access, timestamps, vocabulary, unit dictionary, review records, and known issues.
2. Finalize `experiment_id` ↔ `psi_id` ↔ UUID ↔ slug, along with `run_id` uniqueness scope; verify collisions and mutations across builds.
3. Finalize storage strategy for categorical measurements, flags, row-level provenance, and time series prior to import.
4. Use a small sample with **no DB writes** to test mappings and generate a field-level loss report: every source field must be preserved, linked to a managed asset/version, or flagged as unsupported.
5. Mandatory test cases: inverse flames do not become ambient O₂; null is distinct from 0; CFI `reported_zero` retains its flag; BRE operational no-ignition does not become a scientific label; identical units with differing methods are not subjected to derived comparison; per-measurement sources are not misattributed; DOI/locator can trace back to documents.
6. Once contracts and migrations are approved, run acceptance tests on an **isolated test PostgreSQL**, verifying FKs, idempotency, retry, raw value/unit/flag/source, and API readback. Publish only curator-accepted collections.
7. T078 remains a dedicated Phase 4 **Frontend acceptance** gate; Phase 3B does not close it on its own.

## G. Four modules and existing API levels

| Data Team module | Existing Phase 4 | Missing / owner |
| --- | --- | --- |
| **Summarize & Rank** | Investigation list/detail, dashboard, run/condition/measurement/source/claim pages. | No API for scenario/pillar ranking, component scores, algorithm/data version, or sourced summaries. Data supplies results and explanations; Backend defines DTOs/APIs after review. |
| **Compare** | `POST /compare` returns 2–3 investigations and raw observations; `comparability=not_established`, no delta computation. | Quantitative comparison requires Data/scientific rules for identical observable, unit, geometry, run condition, method, and uncertainty. Backend does not unilaterally apply medians from Dataset Report. |
| **Partial-Gravity Predictor** | No Phase 4 prediction API; models storing version/result are structural only. | AI Team must deliver models, validation, domain, and uncertainty. There are no direct measurements at 1/6 g or 3/8 g in the prototype dataset; E-FIELD does not establish a gravity mapping. |
| **Prevention–Detection–Suppression Advisor** | Tags, sources, claims, and observations can supply raw evidence. | No advice/grounded reasoning API. Data/AI must provide fact–source mapping, review, and inference constraints; Backend verifies citation/abstention, issuing no confirmed safety advice. |

## H. Achievable before November 14

Finalize export manifest and version, field mapping table, identity policy, unit/status vocabulary, lossy field list, source/locator samples, ranking contract, along with acceptance test suite on fixtures and isolated test DB. Proposed ADRs/migrations can be drafted for categorical measurements, provenance, and ranking, then decided once the official sample is available.

## I. Pending official dataset

Confirm metrics, data types, counts, provenance, access permissions, and identity of the competition-provided dataset; verify adapter against real samples; decide on final migrations; run Data Team import and curator review; demonstrate API readback; re-evaluate ranking, comparison, and model scope. Prototype PSI results cannot be treated as evidence that the official dataset will share the same structure or suffice to validate prediction/advice.

## Verification notes

Read-only audit. This Markdown file is the sole change requested for recording the report. No import/test execution, no database modifications, no code edits, no commit or push.
