# Additional PSI combustion investigations — 2026-11-14

Extends the catalog without overwriting earlier packages. Accessions come from the
2026-11-10 discovery snapshot (`term=combustion`, 26 hits): every hit with Research
Area = Combustion Science that was not in the original 18-study catalog. PSI-181
(Materials Science) and PSI-108 (Fluid Physics) are excluded.

| Accession | Slug | Project type | Related flight study | Pillar (navigation) |
| --- | --- | --- | --- | --- |
| PSI-47 DAFT / DAFT-2 | `daft` | Microgravity Investigation | SAME | detection |
| PSI-60 | `spice-analysis` | Ground Investigation | SPICE | detection |
| PSI-62 | `bass-flame-spread-model` | Ground Investigation | BASS, BASS-II | prevention |
| PSI-115 | `same-smoke-model` | Ground Investigation | SAME, SAME-R | detection |
| PSI-117 | `cool-flame-cfd` | Ground Investigation | FLEX | suppression |
| PSI-142 | `cool-flame-counterflow` | Ground Investigation | FLEX | suppression |

All six declare `CC0-1.0` and a DOI in current PSI metadata. `context/*.json.gz` keep the
original public metadata GET response bytes (gzip, `mtime=0`); `context-manifest.json`
records URL, study version, license, original and stored SHA-256/size.

Only metadata/context text (objective, approach, description, research impacts) is
indexed. No experimental tables, files or linked publications from these studies are
downloaded. Ground investigations are modelling/analysis of existing flight data; they are
labelled as such and must not be presented as new flight measurements. Pillars and related
studies are research-navigation annotations, not scientific review.

Builder: `integrations/nasa_data/coverage.py` (`EXTRA_STUDIES`, `EXTRA_ROOT`). Only official
resources are used: PSI files and PSI metadata; NTRS publications are out of scope.
