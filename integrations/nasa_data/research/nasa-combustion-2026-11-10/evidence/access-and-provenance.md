# Access and Provenance Notes

Research date: 2026-11-10. Distinguish direct HTTP observations, document contents, and technical proposals.

## A1. PSI Website and Observed Endpoints

Source: [PSI repository](https://psi.nasa.gov/physci/repo/) and public JavaScript loaded by the page itself: `main.21055b7de96cb7f9.js`.

- HTML returns HTTP 200 but contains no directly readable investigation text. Do not interpret this result as an empty catalog.
- Inspected the bundle to identify website requests, then invoked public retrieval functionality accordingly; did not log in or submit data.
- Example metadata GET: [PSI-69 JSON](https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-69). Verified for 18 accessions in the catalog snapshot.
- Discovery GET: `https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&source=psi&type=investigation&size=100`. Response contains `hits.total` and `hits.hits[].['_source']`; abbreviated records in discovery-snapshot.json.
- File manifest: POST `/geode-py/ws/files/v2`, example body `{"folder":"PSI-69/","fileType":"study","studyId":"PSI-69","version":5,"obfuscationcode":""}`. This is a read operation for listing files, not creating/modifying investigations. Request bodies and response hashes for 6 sets are in manifest-summaries.json.
- Download GET `/geode-py/ws/studies/PSI-69/download` with `file`, `version`, `redirect=false`; for file ID, `studyVersion` may be added. Response contains the URL to retrieve the file. Signed URLs are not stored in the artifact registry.
- Downloaded experimental CSV by `file_name`; TXT/DOCX by file ID obtained from manifest. Compared downloaded size with metadata size, preserving hashes and original bytes.

**Limitations:** Functioning endpoints in practice do not imply that NASA has published an API contract, SLA, rate limits, or compatibility guarantees for PSI. No official documentation confirming these was found. Implementation design must isolate adapters and support manual imports.

## A2. PSI Guide

Source: [Complete PSI Database Guide](https://assets.science.nasa.gov/content/dam/science/bps/bps-general/bps-data_osdr_psi/Complete_PSI_Database_Guide.pdf), 11 pages, text extraction section reviewed:

- PDF page 2: accession/DOI and citations.
- Page 4: Experiment Table relating to samples/runs, downloadable.
- Page 6: files grouped by category; raw/analyzed may separate Earth/reduced gravity.
- Pages 7-9: large download workflows, multi-part downloads, expiring links.
- Page 11: version history with modification dates and added/removed files.

Do not assume all experiment tables share the same granularity. CSV inspection reveals some tables only summarize by date or condition ranges.

## A3. NTRS for RAG

Source: [Harvesting Data](https://www.sti.nasa.gov/harvesting-data-from-ntrs/) and [OpenAPI documentation 2022-11-22](https://www.sti.nasa.gov/docs/20221122_OpenAPI_Documentation.pdf), PDF pages 2-5.

- NASA recommends OpenAPI; provides search, citation metadata, and download endpoints.
- Documentation describes unauthenticated public access, rate limited to 500 requests/15 minutes and 10,000 records/query; these figures reflect the consulted documentation and must be re-verified upon implementation.
- Requires monitoring redistributions at least weekly and syncing when records become unavailable. Citations prioritize landing citation URLs.
- Executed metadata GET for 4 records, then followed `downloads[].links.fulltext` paths returned by the server. Did not invent TXT filenames.
- Full text for 20240008602 contains HTML markup despite ending in `.txt`; content inspection required rather than relying solely on file extensions.

Four records: [20150023456](https://ntrs.nasa.gov/citations/20150023456), [20210011385](https://ntrs.nasa.gov/citations/20210011385), [20240008602](https://ntrs.nasa.gov/citations/20240008602), [20220005205](https://ntrs.nasa.gov/citations/20220005205). Rights metadata and fulltext hashes are in sources.json. Only relevant sections read; does not claim an exhaustive review of the works.

## A4. AWS and Access Rights

The [AWS registry](https://registry.opendata.aws/nasa-psi/) permits anonymous S3 listing. [Root listing](https://nasa-psi.s3.us-west-2.amazonaws.com/?list-type=2&delimiter=/&max-keys=100) returns `IsTruncated=false`, prefixes `DSI/`, `OASIS/`, `pk4/`, and `index.html`. Only concludes that no combustion prefix exists in the inspected root; does not conclude that all of NASA lacks combustion on AWS.

Submission portal login for uploading does not prove public dataset downloads require authentication. In this research's requests, metadata/manifests and 28 artifacts were retrieved without login. Did not test all files and did not bypass restricted access.

## A5. Discovery Scope and Coverage Gaps

Discovery keyword `combustion` returned 26 hits; 24 have Research Area = Combustion Science, comprising 19 Microgravity and 5 Ground Investigations. Not a census of the entire PSI. Ground Investigations may contain simulations/reanalyses rather than new flight observations.

Search for `Saffire` returned PSI-98/99/100. Search for `SoFIE` only returned PSI-25 mentioning SoFIE in its description. These are observed query results, not proof that datasets do not exist elsewhere. [NASA SoFIE](https://science.nasa.gov/mission/sofie/) and [NASA description of investigations](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/) used for discovery; raw SoFIE package unverified.

## A6. Evidence Retention Status

- Retained 28 small original files, totaling 339,134 bytes, under samples/; each file has SHA-256 and retrieval URL in artifacts.json.
- Large JSON metadata and full manifests were stored temporarily during research; the largest fully read metadata file was ~8.1 MB. Versions stored in the repository are projections and summaries, not full copies of responses.
- Initial metadata reads for CFI/s-Flame were truncated by a 3 MB script limit; re-fetched successfully with higher limits. Truncated responses are not considered corrupt datasets.
- NTRS full text and DOCX XML extractions were used for reading content; does not replace visual QA of tables/figures. Did not download two large FLEX/BASS-II PDFs after web reader exceeded size limits.
- Did not send large download request emails, did not download large archives, did not populate DB, and did not run backend tests in this research.
