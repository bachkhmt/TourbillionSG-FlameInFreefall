# Missing Resource Content Handoff — 2026-11-14

The backend already has storage for challenge-level sources and an importer/admission mechanism for option A.
The remaining work here is to supplement/verify source content; no further schema modifications are needed.
This is a checklist for the user to assign tasks, not for sending messages or self-assigning tasks to the team.

| Source | Current Status | Lead | Required Deliverables |
| --- | --- | --- | --- |
| Apollo 1 | Metadata/link only; download fails from the current machine | Data | Successfully downloaded official source bytes, original/final URL, hash, download date, usage rights, text, and locators |
| Apollo 13 | Metadata/link only; download fails | Data | Similar to Apollo 1; do not skip TLS verification or substitute with articles outside the approved sources |
| ScienceCasts video | Link/page saved; no verified transcript yet | Data, AI co-reviewing | Transcript with clear source and rights, aligned with video, timestamp-based locators; preserve placeholders for inaudible segments |
| Researcher's Guide | Landing article available; full PDF content missing | Data | Original PDF/hash/version, usage rights, page-by-page text; isolate images/third-party sources if not permitted |

PSI search is a data discovery link, not a document that needs to be forced into chunks. The
PSI experiment files have already been handled separately. The six indexed resources consist of NASA Combustion Science,
Guide landing article, Mir, and three Spinoff articles. The four unindexed entries are PSI search,
the video, and the two Apollo pages; the Guide is partially indexed but does not yet include the complete PDF.

## Handoff Acceptance Criteria

- Preserve independent raw bytes, original/stored SHA256, URL, version/download date, and original units.
- Text/chunks must have verifiable locators: HTML section/paragraph, PDF page, or video timestamp.
- Usage rights must be declared separately for each source; do not unilaterally convert unknown to CC0.
- Do not overwrite published versions. Create a new release revision and update raw/manifest/registry.
- Sources with errors, unclear rights, or unverified status must retain their true status without fabricated content.
- Data provides the bundle and source reports; Backend runs verification/import against approved
  targets; AI handles retrieval/citation/abstention quality under item 3. PR2/FE handles item 4.

The current adapter only processes narration from HTML articles. When adding PDFs/transcripts,
Data needs to hand over the corresponding parser/chunks; Backend reviews mapping and rights policy against
the new evidence prior to import. Schema A can store these sources, but does not automatically make
PDFs/videos readable or permitted for indexing. Do not assign article/CC0 labels to bypass gates.

Having a source row or passing technical checks does not constitute scientific validation.
