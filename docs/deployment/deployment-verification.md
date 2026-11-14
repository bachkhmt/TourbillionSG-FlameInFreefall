# Deployment preparation — verification and handoff

Date: 2026-11-14. Target checkout: `TourbillionSG-FlameInFreefall`, local branch `main`,
baseline `0710ce8`; initially clean. No commits, pushes, merges, Azure provisioning,
real deployment, migration execution, database import or shared data changes.

## Delivered, not yet cloud-accepted

- Portable Python 3.12 backend image with Poetry 2.2.1 locked main dependencies,
  non-root UID 10001, CA certificates, app/data/Alembic assets, explicit one-off commands.
- Next standalone image, build-time proxy preserved, non-root runtime without dev modules.
- Local full-stack Compose, separate owner/reader roles, no PostgreSQL host port,
  persistent PG/collection/artifact volumes; controlled migrations and existing synthetic seeder.
- VM HTTPS override with Caddy, loopback app ports removed, DNS/certificate prerequisites.
- Read-only Azure preflight; confirmed build/push, existing-app rollout, manually configured
  migration Job trigger, read-only smoke checks. Ingestion deliberately fails closed.
- Vietnamese beginner runbook: Azure Policy, TLS, storage, costs, Vercel, VM, App Service,
  backup, rollback, local demo and manual Portal steps.

No NASA importer, RAG implementation, LLM provider, schema change or scientific algorithm added.
This is preparation against main, not a deployment of the unmerged AI PR.

## Files

New root files: `.gitignore`, `.dockerignore`, `.gitattributes`.

New deployment files:

- `deploy/backend.Dockerfile`, `deploy/frontend.Dockerfile`
- `deploy/compose.yaml`, `deploy/compose.vm.yaml`, `deploy/Caddyfile`, `deploy/.env.example`
- `deploy/runtime/entrypoint.py`, `probe.py`, `seed_local.py`
- `deploy/local/init-roles.sh`
- `deploy/azure/config.example.ps1`, `common.ps1`, `preflight.ps1`, `build-push.ps1`,
  `deploy-containerapp.ps1`, `run-migration.ps1`, `run-ingestion.ps1`, `smoke-test.ps1`
- `deploy/tests/test_launcher.py`, `validate-powershell.ps1`, `deploy/ruff.toml`
- `docs/deployment/azure-deployment-guide.md`, this report.

Modified existing files:

- `FlameInFreewall_Tourbillion/next.config.ts`: only `output: 'standalone'`.
- `flameguard-ai-backend/docs/documentation-map.md`: links to deployment guide/evidence.

No existing app Python source, model, Alembic revision, Poetry/npm lockfile, stable README,
backend implementation plan or Spec Kit feature was changed. Machine caches/build outputs
are ignored; credentials were not staged or written. Dependency installation creates ignored
`node_modules`, and local Next build creates ignored `.next`.

## Executed checks

| Check | Actual result |
| --- | --- |
| Poetry check from backend | Passed: `All set!` |
| Backend Ruff check | Passed |
| Backend Ruff format check | Passed: 257 files already formatted |
| Deployment Ruff check/format | Passed: 4 Python files formatted |
| PowerShell parser, all 9 scripts | Passed; syntax only, not Azure execution |
| Local Compose `config --quiet` | Passed with dummy environment values |
| Local + VM Compose `config --quiet` | Passed with dummy values/domain/email |
| Deployment tests | **8 passed, 0 failed, 0 skipped**; TLS required/verified writer/reader, SQLAlchemy asyncpg argument forwarding, local exception, debug guard |
| Backend full `pytest -q` | **430 passed, 18 failed, 202 skipped**; all 18 failures are missing `PHASE4_ADMIN_URL`, no configured disposable PostgreSQL |
| Backend `pytest -m 'not integration' -q` | **427 passed, 0 failed, 223 deselected**; deselected integration tests are not passes |
| Alembic heads (read-only) | `0003_could_have (head)` |
| Frontend `npm ci --no-audit --no-fund` | Passed using package-lock; no lockfile change |
| Frontend `npm test -- --reporter=dot` | **276 passed**, 23 files, 0 failed |
| Frontend `npm run build` | Passed, Next 15.5.29, compilation + TypeScript + static generation + standalone output |
| Built rewrite inspection | Passed: `/api/proxy/:path*` points to `http://backend:8000/:path*` |
| Actual Uvicorn loopback smoke | `/api/v1/health` **200**; `/api/v1/ready` **503** against intentionally unavailable `127.0.0.1:1` DB; server terminated after test |
| Docker backend image build | **Blocked**: Docker Desktop Linux Engine pipe does not exist; no successful image build claimed |
| Disposable PostgreSQL/migrations/seed | **Not executed**: Docker unavailable, no approved/configured isolated admin target |
| Frontend → backend → populated PostgreSQL | **Not executed**; proxy artifact check and unit tests are not full E2E |
| Restart persistence/source artifact readback | **Not executed**; needs Docker plus accepted source bundle/serving implementation |
| Azure preflight/deploy | **Not executed**: Azure CLI absent; subscription policy, credentials, quotas and resource compatibility unverified |
| Git diff whitespace | `git diff --check` passed; new deployment text files separately checked for trailing whitespace |

Backend tests used the existing sibling backend virtualenv, not a successfully built image.
Initial sandboxed pytest failed at temp-directory access (WinError 5); rerun with permission
to use Windows temp produced the counts above. Initial root-wide Ruff with explicit backend
config classified `app` incorrectly from monorepo cwd; final backend checks ran in its own cwd,
deployment has its own extending config. No unrelated formatting changes were applied.
Initial VM Compose check lacked domain/email dummy inputs; rerun supplied them and passed.
Host PowerShell blocks unsigned script execution; parser checks used the parser API inline
without changing execution policy. User must follow their machine policy before running scripts.

## Blockers and release gates

1. Start Docker Engine, build both images, exercise disposable PG → migrate → synthetic seed
   → catalog → frontend proxy. Test replacing containers without deleting volumes.
2. Configure a separate PostgreSQL admin test target and run all integration tests under
   `docs/runbooks/testing-and-release.md`. Do not substitute development credentials or hide skips.
3. Data Team importer, real release/artifact contract and admission/publication acceptance are
   unavailable in main. `run-ingestion.ps1` intentionally reports this; it never imports demo data.
4. AI PR/provider architecture requires its own merge review. Chat retrieval, source serving,
   paid LLM failure and Flame Studio cannot be certified for code absent from this baseline.
5. Install Azure CLI, authenticate, inspect effective region policies and available SKUs/quotas.
   No assumption about Southeast Asia, free eligibility or usable existing resources.
6. Operator creates/reuses approved resources, configures secrets/identities/network/storage,
   confirms owner/reader target and backup, then explicitly executes Job/rollout.
7. Only then claim cloud deployment, scientific integration or persistence readiness with
   actual smoke/restart/source-hash evidence. Do not mark Phase 8 complete from these files.

## Safe next actions

See the [runbook](azure-deployment-guide.md) for copy-ready commands. First start Docker,
copy/edit `deploy/.env`, validate config, build, then run the explicit demo commands.
For Azure copy config example to the ignored local config, install Azure CLI and run only
preflight first. Review output before authorizing any resource-changing commands.

Recommended hosting: Vercel + Container Apps Consumption + small managed PG if policy/cost
allow; fallback VM + identical backend image + Compose/Caddy. Emergency local Compose remains
available after Docker validation. App Service is documented only, not separately implemented.
Rollback uses previous image and matching bundle; migrations are forward-reviewed and no
automatic downgrade/reset/delete operation is provided. Resource costs and Portal work are in
the runbook; current credit/billing availability was not accessed.
