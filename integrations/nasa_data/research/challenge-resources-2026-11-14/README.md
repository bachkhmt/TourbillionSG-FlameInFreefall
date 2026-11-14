# Official challenge-resource acquisition — 2026-11-14

`acquisition.json` records the ten original registry URLs and the NASA usage guidance.
`raw/*.gz` preserves downloaded response bytes with original/stored SHA256 and byte
count. Original research inputs are `-text` in Git to prevent newline conversion.
Acquisition is offline during build; network refresh is an explicit Data operation.

The versioned `resource_documents.py` parser selects one HTML article, omits navigation,
figures/captions, block quotations and paragraphs containing quoted text/copyright marks.
Locators enumerate the retained article paragraphs, then sentence windows. This is an
explicit extraction policy, not a claim to ingest the whole website or linked PDFs.

| Resource | Acquired content / status |
| --- | --- |
| PSI Data Repository | Discovery link only; PSI experiment files are ingested separately |
| NASA Combustion Science | NASA article narration |
| ScienceCasts video | Video page bytes retained; no verified transcript, no chunks |
| Researcher's Guide | NASA landing article only; full linked PDF not ingested |
| Apollo1 / Apollo13 | Acquisition unavailable; link/attempt metadata stored, no chunks |
| Mir fire | NASA article narration, excluding quoted third-party paragraphs |
| Three Spinoff articles | Article narration, excluding imagery/captions/quoted paragraphs |

Six article pages yield66 challenge-context chunks. All ten have challenge-scoped source
rows without investigation IDs. Only admissible paragraphs have `source_checked` status
and `NASA-public-use-text` rights designation. Unknown rights and failures stay explicit.
The local NASA usage-guidelines snapshot supports the recorded rights decision; see
https://www.nasa.gov/nasa-brand-center/images-and-media/ for the authoritative guidance.

Apollo diagnostics: Python urllib rejected the certificate chain; Windows Schannel/curl
returned HTTP500 for Apollo1. TLS verification was not disabled. No alternative URL or
transcript was substituted. A future successful acquisition requires versioned bytes and
a new release revision; existing unavailable entries must not be relabeled as indexed.

Source checks are engineering provenance, not independent scientific validation.
