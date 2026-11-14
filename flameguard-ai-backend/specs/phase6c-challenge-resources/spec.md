# Phase 6c — Data handoff items 1 and 2, option A

Accepted user scope 2026-11-14: isolated DB import/verification and option A.
AI evaluation/item 3 and PR2 FE/main conflicts/item 4 are excluded. Base is PR3,
branch feat/data-backend-handoff-20261114; Docker work stays on its WIP branch.

## Required behavior
- Preserve 21 tables, source identities and applied 0001–0003 migration bytes.
- Add source_scope: investigation sources require a real investigation UUID;
  challenge sources require NULL ownership. Existing rows default to investigation.
- Version1 snapshots gain the legacy scope default; version2 declares it explicitly.
  Validate exact columns/types/FKs and ownership before import/admission.
- Update ORM/persistence/public Source DTOs and schema guard. Keep per-study lists,
  dashboard study coverage and scenario evidence scoped to actual investigations.
- Persist all ten resource entries with acquisition/rights/index status. Article
  narration retains raw/hash/locator provenance; no images, quotes or fake transcripts.
- Preserve legacy CC0 policy; separate v2 policy for designated NASA article text.
  Bind even unindexed resource metadata to stored DB rows.
- GET /api/v1/chat/resources lists inventory/index status; citation metadata exposes
  scope and nullable investigation. No FE/provider algorithm modification.
- Preserve PSI under profile psi (24/1926/71/2508); default unified adds ten sources
  (24/1926/81/2574). Earlier coverage/challenge profiles remain available.
- Correct HTTP assertions and import both profiles on approved 55435 child DBs.

## Migration and rollback
0004 adds source_scope with investigation default and makes the FK nullable.
CHECK enforces ownership; source/citation FKs remain. Test populated 0003 upgrade.
Downgrade refuses while null-owned sources remain; never delete/reassign them
implicitly. Shared/demo/prod databases are untouched.

## Acquisition and handoff
Six NASA article pages indexed. Apollo1/13 downloads unavailable; video transcript
unverified; PSI search is a discovery link. Guide content is the landing article,
not its linked full PDF. AI owns evaluation; PR2 owner/FE owns conflicts and UI.
Scientific validation remains external. Manual plan/spec/tasks and main self-check;
kit/Spec Kit integrations unavailable, no independent-review claim.
