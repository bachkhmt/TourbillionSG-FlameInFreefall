# ADR-0010 — Predictive Lab returns as a readiness + exploratory report page

Status: implementation decision for the user's 2026-11-15 request; backend upstream review pending before merge. Amends [ADR-0008](ADR-0008-hackathon-evidence-navigation.md), which removed the Predictive Lab panel because it showed values from a frontend simulation engine.

Context: the AI team trained first models in notebooks (`flex_heptane`, `cfig_normal`, `cfi_droplet_khot`, `saffire_ii_spread`). Every run marks itself `status=blocked`, `review_status=unreviewed`, `public_readiness=not_ready` (validation plan missing, exploratory results only, or too few independent groups). The Phase 7 contract keeps numeric predictions closed until a validated model and dataset are admitted.

Decision: add `/predictive-lab` (navigation item after Mission Scenario) that shows
1. live `GET /api/v1/prediction/readiness` with plain-language reasons, loading, error and retry; the page never executes predictions, even if readiness becomes `ready`;
2. a static report generated offline by `integrations/predictive_lab/report.py` from the notebook outputs: scope, blocking reasons, held-out row and group-mean MAE for the median baseline and Ridge, rows, groups, coverage, the notebook's own model selection, run id and source hashes;
3. the trained models' outputs on held-out NASA runs (from `predictions.json`): observed value, median and Ridge output (or "unsupported") per run, NASA run id, and flags for runs outside the training range/domain or with unseen categories, as an observed-vs-output chart and table. These are evaluation outputs on past experiments, labelled as such; nothing is predicted for new user inputs. Training rows and selected run-id lists are not copied.

Presentation rules: every entry stays labelled Blocked · Unreviewed · Not public (frontend test fails otherwise); fewer than five held-out groups never yields a "better model" conclusion; a missing notebook selection is shown as "does not beat the median baseline"; MAE is described as model error, not a safety or risk measure. `/mission?view=prediction` keeps showing evidence.

Publication: displaying these exploratory metrics on the public site was confirmed in chat by the requesting team member on 2026-11-15. Scientific acceptance of any model remains a separate, open gate. Backend code and contracts are unchanged.

Rejected for now: serving Ridge predictions for new user input labelled exploratory (contradicts the notebooks' own `not_ready` and the Phase 7 contract); hiding the page behind a build flag (not chosen).
