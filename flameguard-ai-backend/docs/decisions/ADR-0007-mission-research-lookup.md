# ADR-0007: Unreviewed Mission research lookup

2026-11-15, user requested real API integration after removing prediction.
Accepted local implementation: add a read-only research lookup API; preserve
Phase5 scientific evaluation admission guards. No scientific acceptance claimed.

The 21-table projection omits oxygen scope/conflicts and exact gravity provenance.
Use a Data-owned lossless release sidecar, hash-bound to the exact admitted DB
snapshot. Data checks projection equivalence before writing declaration. Backend
validates declaration, path confinement, hashes, revision and corpus policy.
Absent/stale policy fails closed. Existing targets need re-publication of local
policy by the Data helper; no DB change is needed. No migrations or runtime writer.

Frontend displays source context/objectives/observations, same-record lookup and
explicit unknowns. Purpose classification is navigation, not verified findings;
question text is descriptive, not a semantic relevance model. Tolerances are
search settings, never NASA safety limits. No new AI/provider/scientific policy.
