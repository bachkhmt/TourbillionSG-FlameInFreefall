# Data handoff items 1–2 — 2026-11-14

Tier T3. Latest user scope: item 1 (DB import/verification) and item 2 (option A).
AI evaluation/item 3 and PR2/main FE conflicts/item 4 remain with their owners.
Dedicated PostgreSQL 55435 approved; no shared DB reset, deploy or paid API. User follow-up authorizes completing Git integration/merge and preparing team handoff messages. PR2 is now merged upstream; incorporate its existing FE resolution without taking over FE acceptance.

## Preservation and implementation base
- Docker/deployment 28 files: wip/docker-deployment-20261114, b950300, plus raw backup.
- Feature branch feat/data-backend-handoff-20261114 starts at PR3 e332b7a.
- Final diff excludes FE and app/integrations/rag algorithms. The broader earlier
  attempt is backed up locally and excluded from this deliverable.

## Acceptance and dependency order
1. Preserve 21 tables and applied 0001–0003 bytes; add 0004 ownership CHECK/scope.
2. Preserve legacy snapshots, identities, raw values, units and scientific gates.
3. Store ten resource inventory entries without fake investigations/runs. Admitted
   text retains raw/hash/locator/rights evidence; unavailable content stays unindexed.
4. Bind metadata and chunks to corpus policy; support nullable ownership in source API.
5. Import PSI and complete profiles into new approved 55435 targets. Expected counts:
   24 studies/1926 records; PSI 71 sources/2508 passages; unified 81/2574 and 10 resources.
6. Execute backend/root compatibility and populated-legacy migration/guarded rollback
   checks. Record exact results and split reruns, never reuse historical test claims.
7. Hand off API/resource status to AI and FE; no quality/browser acceptance claim.

## Manual plan critic
Named kit reviewers and Spec Kit unavailable; main-agent self-check, no independent review.
Check nullability through ORM, DTOs, importer, registry, schema guard and migrations.
Version1 manifests receive legacy scope; version2 must explicitly supply scope.
Keep legacy CC0 rights policy; separate policy for documented NASA article narration.
Official links do not grant rights or prove ingestion; do not invent transcripts.
Keep study counters/scenario evidence scoped, prediction/Advisor gates unavailable.
Use bounded test setup barriers distinct from production provider deadlines.

Evidence and acquisition limits: specs/phase6c-challenge-resources/verification.md.
