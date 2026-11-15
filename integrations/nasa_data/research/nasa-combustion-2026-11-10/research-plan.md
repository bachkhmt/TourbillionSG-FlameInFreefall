# NASA Combustion Data Research Plan

Date: 2026-11-10. Scope: investigate input sources and characteristics for the FlameGuard AI backend; do not modify application, ERD, migrations, README, or frontend.

## Questions and Completion Criteria

1. Verify official data portals, access requirements, and retrieval mechanisms; distinguish metadata, papers, raw data, and media content.
2. Map representative combustion experiment families (droplets, gaseous flames, solid fuels, and large-scale spacecraft fires), prioritizing NASA sources and original publications.
3. Directly inspect selected artifacts/manifests to describe format, granularity, units, provenance, and limitations; do not infer file existence solely from introductory pages.
4. Propose an ingestion/RAG pipeline compatible with the existing 21 entities; clearly document gaps requiring decisions without unilaterally changing contracts.
5. Save report and evidence notes with URLs/locators, separating verified observations from inferences/recommendations.

## Research Methodology

- Locate and access primary sources: NASA PSI/OSDR, NASA experiment pages, NASA NTRS, author publications/datasets.
- Prioritize reading metadata and guidance documentation first; download small samples only when necessary, avoiding large videos/archives.
- Look for counter-evidence: login/data requests, data lacking conditions, structural discrepancies across campaigns, review sources vs. raw data, provenance/uncertainty limitations.
- Do not treat unverified NASA discovery endpoints as stable API contracts; explicitly document testing dates and environmental constraints.

## Outputs and Verification

- `report.md`: synthesis, data matrix, mappings, and proposed implementation sequence.
- `evidence/`: source notes and small inspected manifest/metadata samples where appropriate.
- `sources.json`: consulted sources and accessibility classification.
- Cross-check every key claim against sources; verify links/citations in documentation and Git diff. Do not claim backend testing or scientific verification outside the research scope.

