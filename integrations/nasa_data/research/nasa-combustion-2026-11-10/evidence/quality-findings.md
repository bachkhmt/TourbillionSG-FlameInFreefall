# Located Quality Findings

CSVs under samples/ preserve original bytes. "CSV row" below treats the header as line 1; the referenced files do not contain multiline quoted records that would affect these locators. Artifact URLs, file versions, and hashes are in [artifacts.json](artifacts.json).

## Q1. FLEX: same run, conflicting values

Source: PSI-69 v5, `PSI-69_Experimental table_FLEX.csv`, row 8 / test 7 / CIR `20CAL13`; `PSI-69_Raw Data_FLEX-007_TestSheet.txt`, section TEST PARAMETERS / TEST CONDITIONS.

| Field | CSV | Test sheet |
| --- | --- | --- |
| Initial diameter | 1.87 mm | 1.82 mm |
| Burning-rate value | 0.67, header lacks unit | 0.68 mm2/s |

Test date/time and CIR key confirm that both records belong to the same test. The reason for the discrepancy and which source takes precedence have not been verified. Recommendation: preserve both, link locators, open an issue; do not average.

## Q2. FLEX: units and coverage

CSV header states `Burning rate; mm`; test sheet states `kavg (mm2/s)`. [NTRS 20150023456](https://ntrs.nasa.gov/citations/20150023456), Appendix A.1 and A.2/Table IX, explains the burning-rate constant from fitting squared diameter over time, with units of mm2/s.

The downloaded CSV table contains 274 data rows, whereas the report abstract states 284 tests. The discrepancy is unexplained, and there is no claim that the CSV represents all tests in the report. The web UI once displayed a total of 275, so do not use the UI row count as the run count.

## Q3. FLEX: time series and missingness

Source: `PSI-69_Raw Data_FLEX-007_DropletData.txt` and `PSI-69_Raw Data_FLEX-007_LLUVData.txt`, header and initial rows.

- Tab-separated, line endings contain carriage returns.
- Negative time values are present in the source; do not discard or clamp to zero on your own.
- Position or flame-standoff fields have blanks; do not interpolate without a policy.
- Channel time/axis differ. Do not assume camera data are synchronized row by row.

These observations do not confirm frame rate/uncertainty across the entire dataset. Time origin must be verified according to per-run methodology; do not infer epoch timestamps from time-series offsets.

## Q4. BASS-II: README needed to interpret measurements

Source: PSI-25 v4, `PSI-25_Science Documents_BASS-II_ReadMe.docx`; sections under Test Matrix explanation / Columns in test matrix.

- The same sample can be used across multiple runs; suffix `a/b` distinguishes attempts.
- Video date differs from actual date by one day because software did not handle leap years correctly; GMT is day-of-year.
- Fan display is voltage times 10 or possibly pot setting; not airflow.
- Air display measures cm/s but has a slow response time of approximately one minute.
- Radiometer gain is not absolutely calibrated; can be used for relative levels per instructions, do not convert directly to physical heat flux.
- O2 sensor offset is calibrated daily against MCA.
- `OR` means over 1000 ppm, not an exact number or standard null.

These are dataset-specific rules documented in the instructions; do not apply them to other sensors merely due to matching column names.

## Q5. BASS-II: anomalies and qualitative states

Source: `PSI-25_Experimental table_BASS-II.csv`:

- Row 52, test O4: air display contains text regarding flow reduction to extinction, final CO is `OR`.
- Row 62, test O12: air display describes no ignition across tested flows.
- Row 129, T28b: final O2 = `40.4`; initial CO2 and CO are `none`.
- Row 130, T29: fan/air display contains multiple levels; initial CO = `-1`.

[NTRS 20210011385](https://ntrs.nasa.gov/citations/20210011385), Appendix B/test T28b in full text, also contains `40.4`. Confirming that a number appears in two representations does not confirm that it is metrologically valid. Do not alter or delete based solely on intuition or UI range checks.

## Q6. Summary rows are not runs

- PSI-68 FLEX-2, 8 rows: fuel/mixed-fuel and ranges/sets of diameter/O2/pressure/flow; no per-ignition ID.
- PSI-20 BRE: test date + `Flames Ignited`, contains note about pressure changes but does not enumerate them in the summary.
- PSI-21 CLD: `Test Day`, MFC maxima, fuel-concentration range, and number of flames; MFC maximum is not the actual flow of every run.
- PSI-22 E-FIELD: rows 4/7 and several trailing rows only continue fuel concentration, lacking test-day. Do not forward-fill on your own and create new runs.

Recommendation: tier staging and use raw logs/test sheets to reconstruct runs; do not insert summary rows into `TestRun` to pad data.

## Q7. Saffire: notes, images, and units

Source: PSI-99 v5, `PSI-99_Experimental table_SAFFIRE-2.csv`:

- Rows 2-10 are nine samples; rows 11-12 are flow records; rows 13-16 are notes.
- Units appear inside cells, approximate values, qualitative outcomes, and figure references instead of thickness numbers.
- Do not fill empty material from the row above without evidence.

Supplementary source: PSI-98 v4, `PSI-98_Science Documents_SAFFIRE-I and SAFFIRE-III Readme.docx`, Table 1 / Table 3 and raw data section. The file explains camera/sample identities, telemetry Excel, image transformations, and RAW having offsets prior to color interpolation. Part of the diagnostics table is an image within the DOCX, not visually read; do not extract an exhaustive sensor list from XML extraction alone.

## Q8. Blanks, encoding, and derived variables

- PSI-159 inverse CSV: 1,015 rows after header, only 154 nonempty; 861 empty rows must not generate `TestRun`.
- PSI-69 CSV: UTF-8 decoding fails at byte `0x96` offset 2389; CP1252 decoding succeeds. This is an encoding observation, not an official provider declaration.
- PSI-10/159 contain `Tad`, `Zst`, and mixture/flow columns. A methodology is needed to distinguish input, measured, and derived values; do not treat every numeric field as a sensor output.

## Q9. Scope of scientific inference

[NTRS 20220005205](https://ntrs.nasa.gov/citations/20220005205), sections 2-3: ACME features a constant-volume chamber, optical diagnostics, and varying burner configurations. BRE emulates condensed-phase burning using a gas-fed burner. Recommendation: retrieval must retain experiment configuration and observation type, and not treat two results sharing a keyword as equivalent measurements.

[NTRS 20240008602](https://ntrs.nasa.gov/citations/20240008602): Saffire V study combining sensor data with vehicle modeling. This is a source for methodology/modeling results; the raw Saffire V package has not been located through attempted PSI queries. Do not assign model outputs as new flight observations.

## Q10. Legacy accessions in filenames

PSI-25 v4 manifest contains a metadata ZIP named `PSI-25_metadata_PSI_metadata_PSI-101_BASS-II.zip`; PSI-69 v5 manifest contains `PSI-69_metadata_PSI-133_FLEX.zip`. In the checked catalog, PSI-101 is SAME-R. Do not use regex to match every `PSI-<number>` string in filenames to assign investigations. Preserve raw filenames, canonical accessions, and legacy aliases alongside context/version; do not overwrite identity based on file names.
