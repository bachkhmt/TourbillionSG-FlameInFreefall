# ADR-0006 — Challenge sources without fabricated investigations

Accepted user scope, 2026-11-14: implement Data handoff items1 and2 using option A.
Items3 (AI quality evaluation) and4 (PR2/main FE conflicts) stay with their owners.

## Decision and impact

Keep21 tables. Add migration `0004_challenge_source_scope`, preserving applied0001–0003.
`source_document.source_scope` is `investigation` (default for existing rows) or
`challenge`. A database CHECK requires an investigation UUID exactly when the scope
is `investigation`. Challenge sources have NULL investigation ownership; source/chunk/
citation FKs remain unchanged. A downgrade refuses while null-owned sources exist.

Legacy version1 fixtures/snapshots gain explicit investigation scope before exact
validation. Version2 snapshots must supply it. Schema-head checks, ORM/persistence
DTOs and the public Source schema are updated; historical Phase2 reports/ERD are kept.
Existing per-investigation lists/counts and scenario evidence keep their study scope.

The complete `unified` export adds ten resource source rows; `psi` reproduces the
previous 24/1926/71/2508 release, and `coverage`/`challenge` remain available. Raw bytes,
hashes and extraction locators remain recoverable. Non-document links and unavailable
content are persisted with explicit status and no invented searchable text.

`GET /api/v1/chat/resources` exposes the admitted inventory and indexed status.
Citation metadata includes nullable investigation ID and explicit source scope.
Investigation-scoped corpus reads exclude challenge sources; unscoped reads admit them
only under an explicitly declared rights policy. No retrieval/provider algorithm changes.

## Source rights and acquisition

Legacy `cc0-source-registry-v1` remains CC0-only. The separate
`nasa-source-rights-registry-v2` permits explicitly reviewed NASA-authored article
narration under NASA's factual/educational public-use guidance, with attribution and
no endorsement claim. It does not classify NASA pages as CC0 or grant rights to
images, third-party quotes or video transcripts. The backend requires the matching
NASA host, rights URL/scope, source status, source ownership, version and chunk hashes.
Even unindexed inventory entries must match stored source rows.

Acquisition snapshot: six article pages admitted; PSI discovery link and unverified
YouTube transcript deliberately unindexed. Apollo1/13 acquisition unavailable in this
environment (Python TLS certificate failure; Windows curl returned HTTP500 for Apollo1).
Researcher's Guide content here is its linked NASA landing article, not the full PDF.
These limits are visible in the registry/API and do not become scientific review.

## Environment and rollback

Only dedicated localhost55435 test server was approved. Fixtures create and retain new
test-named databases/roles. No shared/demo/prod migration, reset, deploy or paid provider.
Docker/deployment WIP is independently preserved at branch
`wip/docker-deployment-20261114`, commit `b950300`; it is not part of this feature.
Source/model/API rollback requires exporting/removing challenge records explicitly
before downgrading. Never assign them to a convenient investigation to satisfy an FK.

Spec/verification: `specs/phase6c-challenge-resources/`.
