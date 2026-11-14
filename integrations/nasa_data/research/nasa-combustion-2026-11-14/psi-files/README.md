# PSI run-level files — ACME BRE (PSI-20) and CFI (PSI-39)

Retrieved 2026-11-14 from the **PSI Data Repository**, the data source named by the
Flame in Freefall challenge resources. Both studies declare `CC0-1.0` in PSI metadata.
These files were fetched again from PSI, rather than copied from the earlier Data ETL
repository, so that every value can be traced to its original bytes.

## Contents

| File | PSI version | Bytes | Role |
| --- | --- | ---: | --- |
| `files/PSI-20_Raw Data_Final ACME Chamber Calculator - 2019-01-31 to 2019-04-09.xlsx` | study 4 / file 2 | 438,434 | ACME chamber operations log (`EventData` sheet) |
| `files/PSI-20_Raw Data_Final ACME Chamber Calculator - 2020-07-22 to 2021-02-03.xlsx` | study 4 / file 3 | 525,509 | Same calculator, second campaign |
| `files/PSI-39_Science Documents_CFI_DataSummary_Spreadsheet_Jan2021.xlsx` | study 4 / file 2 | 208,743 | CFI summary for 227 tests |
| `manifests/PSI-20.v4.files.json.gz`, `manifests/PSI-39.v4.files.json.gz` | study 4 | — | Original PSI file-manifest responses (gzip, `mtime=0`) |

`psi-files-manifest.json` records, for each file:
- its PSI key and file/study version;
- the canonical download URL;
- the size listed by PSI and the size downloaded;
- its SHA-256.

Presigned object-store URLs are followed once and never stored.

## Reading rules

All rules below are implemented in `integrations/nasa_data/unified.py` and
`integrations/nasa_data/xlsx.py`.

- Cells are read directly from the workbook XML. Formulas are **not** re-evaluated: a
  formula cell keeps its stored (cached) result, and observations built from formula
  cells are marked `needs_review` as calculator-derived. Every observation carries an
  `xlsx '<sheet>'!<cell>` locator.
- Numbers are kept as stored text in `raw`. Chunk text shows the shortest decimal form of
  the same number (for example `4.0389999999999997` becomes `4.039`). Excel dates stay
  as serial numbers.

**ACME BRE (`EventData`)**
- Each `OP = TP` row becomes one `chamber_test_point` record keyed by TPID. The
  `Ignite` column is the decision taken during operations, kept verbatim.
- The chamber pressures `Pstart/Pend (psia)` come from telemetry channel `FCU_MP_PT28`.
  `Pstart` is used as the run's chamber pressure.
- Gas compositions (`Finish Mixture (Percent)`) and `Burn Fraction` are calculator
  values derived from mass-flow-controller volumes. Per the workbook notes, they assume
  all fuel was consumed when Burn Fraction = 1. They are observations only and never set
  the run's oxygen condition.
- The calculator logs every ACME chamber operation in its date range. A test point
  whose GMT date is not within one day of a date in the PSI-20 BRE day-summary table
  is flagged in its `issues`; it is not removed.
- BRE is a gaseous burner that emulates solid-material burning. It is not a direct
  measurement of fabric or plastic flammability.

**CFI (PSI-39)**
- `Master Sheet`, `DATA`, `Igniter` and `Comments` are joined on `Flex Number`; each
  sheet holds the same 227 keys.
- The 87 rows of the existing PSI-39 experimental-table CSV are an exact subset. Those
  runs gain observations from the spreadsheet (with the spreadsheet's own source and
  locator), and any field that differs between the two sources is recorded as an issue.
  The other 140 tests become new records.
- `DATA` values with a unit in the header (mm, mm^2/s) are numeric observations.
  Columns without a declared unit, and formula columns (`Rad Ratio`,
  `CF Rad Ratio`), are kept raw with `needs_review`.
- Gas composition basis is not declared, so no oxygen condition is inferred, as for the
  existing CFI CSV. `Camera Settings` is not imported.

Source checks (hash, size, identity) are not independent scientific review.
