# PSI context and official-resource source checks — 2026-11-13

This source package extends the original research snapshot without overwriting
it. User authorization covers local challenge implementation; **scientific
review remains incomplete**. Raw source records are not independent experiments.

## Retained inputs

- `context-manifest.json`: one full public PSI metadata response for each of
  the 18 investigations in the original catalog. Each `.json.gz` preserves the
  original response bytes, compressed with gzip `mtime=0`. `sha256` and
  `downloaded_bytes` describe the **uncompressed original**, while `stored_*`
  fields describe the tracked compressed artifact. No response fields were
  reconstructed or normalized in those original bytes.
- `table-source-checks.json`: seven tables were downloaded again through the
  PSI download endpoint on this date; every hash matches the tracked November
  10 artifact. URLs remain the canonical PSI URLs; temporary signed object-store
  URLs are deliberately absent.
- Original table, TXT, DOCX and catalog bytes remain in
  `../nasa-combustion-2026-11-10/evidence/`. No data are copied from the historical
  frontend seed arrays or the separately maintained Data ETL repository.

The context responses total 20,323,801 uncompressed bytes and 1,162,168 stored
gzip bytes. Current metadata declares CC0-1.0 for 17 investigations; PSI-10
declares no license identifier. Its original response is retained with
`license=unknown`; its context text is excluded from summaries/RAG and no
unsupported research pillar is assigned. NASA hosting alone does not establish
reuse rights. Linked publications retain their own rights.

## Repeating acquisition without overwriting history

1. Start with accession identities in the original `catalog-snapshot.json`.
   GET each canonical `metadata_url`, preserving the complete response bytes.
   Confirm the returned accession and record its current study version and
   license. Save a new dated package when inputs have changed.
2. Calculate SHA-256 and size before parsing. Gzip with zero timestamp; record
   both original and stored hashes/sizes in a new context manifest. Keep source
   URL, accession, version, compression and retrieval date. Never reconstruct
   a raw response by serializing a parsed dictionary.
3. For selected experimental tables, use their recorded PSI download URL and
   file version. The endpoint returns an HTTPS object-store URL as text; follow
   it to fetch the file. Confirm the expected NASA/object-store hostname and
   source version. Retain the original table bytes and update the source ledger
   in a new package. Do not commit signed query strings or credentials.
4. Review fields, units, locators and row types before adding an adapter.
   Public access, software acceptance and independent scientific review are
   separate evidence gates. Unknown rights stay unavailable for text indexing.
5. Run `tests/test_challenge_ingestion.py` using the backend environment.
   The builder itself performs no network or DB operations and checks input
   hashes, sizes, source identity, rights and deterministic publication IDs.

`build_pilot()` is unchanged. `build_challenge_release()` uses all original
pilot sources plus this package, seven additional tables and the retained
FLEX-007 LLUV file. The final revision incorporates original input hashes,
context bytes/manifest, the official resource registry, classification policy
and actual annotations. Every record ID is remapped to that final revision;
legacy and multi-channel telemetry keys are remapped together. Source IDs
remain tied to their original study, filename and bytes.

## Record mapping and cautions

| Source | Imported test/sample records | Other rows and cautions |
| --- | ---: | --- |
| FLEX / BASS-II / CFI-G normal | 274 / 129 / 179 | Original pilot values, unknowns, FLEX-007 conflict and calibration caveats retained |
| BASS | 121 | Row 67 is SOOT Cleaning with no test IDs: configuration evidence only. Duplicate external keys retained |
| Saffire-II | 9 | Two flow-visualization records and four notes are document chunks. O₂ derived from CO₂ and approximate/ranged values are not exact cabin conditions. Blank materials and `037 mm` retained |
| Saffire-III | 2 | Sample geometry/duct airflow; no sensor time series synthesized |
| CFI | 87 | 79 distinct external keys; source rows retained. Composition basis is undeclared, so numeric oxygen matching stays unavailable. Pressure conversions preserve original atm values |
| SAME-R | 109 | 108 distinct external keys; key 57 appears twice. Metadata describes 66 flight test points, demonstrating why row count is not an independent-test count. Inlet velocity is apparatus flow; `Rt/R0` meaning remains needs-review |
| SAME / BRE | 0 / 0 | Eight sample recipes and 18 daily summaries become configuration evidence, not invented runs |

Result: **910 source records**, 51 source records/documents, 1,045 chunks and
two original telemetry channels, with **zero independently reviewed records**.
The LLUV flame-diameter channel retains its own timebase and negative times;
it is not resampled onto the droplet channel. The LLUV standoff header does not
declare a unit and is retained only in the original file.

Study summaries/objectives are extracted PSI context with original source IDs
and JSON field locators, not newly validated findings. Sensor names are
source-backed methodology annotations; they do not imply the corresponding
channels are imported. Pillars are versioned research-navigation annotations.

SAME-R's CSV has no per-row flight/ground or gravity field, while its metadata
describes 66 flight test points and post-flight ground tests. All 109 imported
SAME-R records therefore keep `gravityRegime=unknown`, with the project context
and original `/approach` locator preserved. This does not assert that any
specific CSV row is a ground test or a microgravity measurement.
