# PR #8: additive data rollout

PR #8 is integrated into `wip/docker-deployment-20261114` for release preparation.
It adds no Alembic revision and changes no existing scientific row. The unified
export adds 50 tags, 115 investigation/tag links and 1,127 oxygen-context conditions.
The expected snapshot content SHA-256 is
`da2157070a526c6d35674f4f1a17a12eeccd5c00f231ebdef2a71a28d130f395`.
The NASA source revision remains unchanged.

## Current gate

Keep `production.json` bound to the currently imported dataset until the import
has actually succeeded. CI/CD deliberately rejects the PR #8 export against the
old checksum. Do not merge the deployment branch into `main` before activating
and committing the new binding. This branch already contains the PR #8 commits;
coordinate its merge with the PR author/backend owner so the feature is not
released independently before the data handoff is ready.

## Existing Azure configuration

No additional Blob, Files, Container App, database, schema migration or managed
identity is required. The existing GitHub OIDC identity has AcrPush on ACR and
Container Apps Contributor on both apps. PostgreSQL has seven-day backup
retention. Confirm an available restore point and record the UTC cutover time
before writing production data. Automatic backups are not a tested restore.

## Operator cutover

Run from the monorepo root in a coordinated short maintenance window. Collection
admission validates exact membership: adding rows can make the old backend
reject requests until the new bundle is deployed. Notify the demo users and do
not leave a long gap between import and rollout.

1. Export locally (use a new output directory if this one already exists):

   ```powershell
   $env:PYTHONPATH = ".;.\flameguard-ai-backend"
   .\flameguard-ai-backend\.venv\Scripts\python.exe -m integrations.nasa_data.export --profile unified --output .demo/azure-nasa-bundle-pr8
   ```

2. Import and activate the config. Enter the owner password only at the hidden
   local prompt; never put it in Git, shell arguments or chat:

   ```powershell
   .\flameguard-ai-backend\.venv\Scripts\python.exe deploy/azure/import-nasa.py --bundle .demo/azure-nasa-bundle-pr8 --host pg-flameguard.postgres.database.azure.com --database flameguard --owner flameadmin --reader-role flameguard_reader --chat-role flameguard_chat --activate-config deploy/azure/production.json
   ```

   The importer verifies checksums, database identity/OID, migration head, role
   privileges and all existing rows. Inserts are atomic and chat tables are
   preserved. Only after the transaction commits and metadata is published does
   it atomically update `production.json`. A repeat import inserts zero rows.
   If config publication fails after the database commit, rerun the command;
   do not delete or reimport the database.

3. Expect `insertedRows: 1292` against the original production dataset, with
   tag=50, investigation_tag=115, test_condition=2805. If the database was already
   updated, zero inserts is valid. Stop on any conflicting existing row.
   Review the config diff: the target/OID/roles must remain unchanged, and only
   the snapshot checksum should change to the value above.

4. Build the bound bundle, commit the activated config on the Docker branch,
   push and complete the coordinated PR merge into `main`:

   ```powershell
   .\flameguard-ai-backend\.venv\Scripts\python.exe deploy/azure/prepare-bundle.py --output .demo/pr8-bound-validation
   git add deploy/azure/production.json
   git commit -m "deploy: activate imported PR8 dataset"
   git push origin wip/docker-deployment-20261114
   ```

5. Watch the Actions deployment. If Actions cannot run, deploy immediately from
   this activated checkout using unique tags:

   ```powershell
   .\flameguard-ai-backend\.venv\Scripts\python.exe deploy/azure/release.py deploy backend --tag pr8-BUILD-ID
   .\flameguard-ai-backend\.venv\Scripts\python.exe deploy/azure/release.py deploy frontend --tag pr8-BUILD-ID
   ```

   The smoke checks cover DB readiness, collection, descriptive records, admitted
   study overview, chat and Mission through the backend and frontend proxy.

## Recovery

Image rollback does not undo data changes. After this import the old dataset
image can fail exact collection admission. Prefer fixing/rolling forward with
the new snapshot. A full rollback requires an operator-approved database restore
and matching old bundle/image; restoring a prior database can also lose newer
chat history. Never truncate the three added-data tables as a shortcut.

## Validation boundary

Preparation verified on 2026-11-15:

- Production was inspected using `flameguard_reader` in a read-only transaction:
  database OID=24764; all existing rows match; exactly 50 tags, 115 links and
  1,127 conditions are missing. No production rows were written.
- A pre-import custom-format archive was created over TLS verify-full at
  `deploy/backups/pre-pr8-20261115T132643Z.dump` (Git-ignored, local only).
  SHA-256: `4716cfe64adee80e016ffeef5a1c6acedac9f3f6a9fcef0c254bd946d9218575`.
  `pg_restore --list` succeeds with 22 table-data entries, including Alembic.
  A complete restore rehearsal has not been performed.
- Offline Python tests: 360 passed; 14 PostgreSQL tests explicitly deselected.
  Frontend tests: 308 passed; TypeScript and Ruff checks pass.
- Linux backend/base+data and frontend images build successfully locally as
  `flameguard-api:pr8-prepared` and `flameguard-web:pr8-prepared`.
  They have not been pushed or deployed. Production config is unchanged.
- Both workflows pass actionlint. GitHub reports the repo public; all three
  Azure OIDC repository variables are present. A live Actions rollout still
  needs verification after merge.

Release preparation does not mean the production import has run. The owner
password is not stored in this checkout. Confirm the actual import and smoke
results before reporting this release as deployed. Repo visibility and Actions
availability must also be confirmed by the repository owner before cutover.
