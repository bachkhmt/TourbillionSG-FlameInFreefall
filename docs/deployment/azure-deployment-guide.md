# FlameGuard AI — triển khai Azure và demo dự phòng

Ngày chuẩn bị: 2026-11-14. Đây là **deployment preparation**, chưa phải biên bản deploy thành công.
Đọc cùng [verification](deployment-verification.md). Chạy lệnh tại root monorepo
`TourbillionSG-FlameInFreefall`, không phải thư mục backend đứng riêng.

## 1. Baseline thực tế và giới hạn

Checkout được chỉnh: local `main`, commit `0710ce8`, working tree ban đầu sạch.
Remote main được kiểm tra trước đó là `5b6c720`. Không tự pull/merge hay chuyển branch.
Không đưa code từ PR chat chưa merge vào deployment này.

| Mô tả cũ | Thực tế baseline này |
| --- | --- |
| workspace/phase4 profiles, 22 bảng | Một `app.main:app`, 21 bảng, migrations 0001–0003 |
| dataset_release JSONB và NASA publisher | Không có; catalog yêu cầu manifest ràng buộc chính xác với DB |
| RAG BM25/vector, Anthropic | Core chỉ có mock/unavailable provider; chưa có AI adapter thật |
| BACKEND_URL | `BACKEND_INTERNAL_URL`; browser mặc định dùng Next rewrite `/api/proxy` |
| playbook-rag, Flame Studio, rebuild-kit | Không nằm trong checkout này; không có asset để đóng gói |
| NASA ingestion | Chỉ có `scripts/seed_demo_data.py` cho DB disposable/synthetic |

Không thêm các biến `CATALOG_API_PROFILE`, `ARTIFACT_DIR`, `RAG_LLM_ENABLED`,
`ANTHROPIC_API_KEY` vì app hiện không dùng chúng. Thêm key không tạo ra AI integration.
Không đổi models, migrations, API contracts hay admission policy để deploy.

**Có thể chuẩn bị/chạy:** backend, frontend, DB, migrations và catalog synthetic được gắn nhãn.
**Chưa thể nghiệm thu:** NASA import/publication, source artifact endpoint, chat retrieval thật,
Advisor thật, prediction thật và Flame Studio. Cần team Data/AI bàn giao, backend review,
sau đó bổ sung image assets/commands và tests. Không thay bằng dữ liệu bịa.

## 2. Kiến trúc nhỏ nhất

- Phương án chính: Vercel frontend → HTTPS Container App → PostgreSQL Flexible Server.
- Một backend image Linux/amd64, một process Uvicorn, cổng 8000; không tách AI microservice.
- ACR Basic hoặc GHCR chứa image. Dùng tag phiên bản mới cho mỗi lần build; ghi lại digest.
- Ban đầu 0.5 CPU/1 GiB, tối đa một replica; min=0 khi chuẩn bị, min=1 lúc chấm nếu đủ credit.
- Manifest/source artifacts có version phải được mount bền vững hoặc đóng gói bất biến.
- VM + Compose + Caddy là phương án dự phòng; Compose local là phương án khẩn cấp.

Đây là cấu hình khởi đầu để đo, chưa có số đo tải/RAM. Không bật HA, dedicated profile,
GPU, AKS, Redis hay vector DB. Không triển khai LLM trả phí trong baseline này.

## 3. Chạy local trước — không cần Azure/GitHub

Yêu cầu Docker Desktop Linux Engine đang chạy, Compose >=2.24.4, đủ RAM và dung lượng.
Các lệnh bên dưới **tạo DB demo riêng**, không dùng DB nghiên cứu hiện tại. Không chạy
`down -v`, không tái sử dụng volume đang chứa dữ liệu khoa học.

```powershell
Copy-Item deploy/.env.example deploy/.env
# Sửa 3 password CHANGE_ME trong file local. Dùng password random URL-safe.
# Không gửi file này lên chat, Git hoặc chụp ảnh có password.
docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml build
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d postgres
docker compose --env-file deploy/.env -f deploy/compose.yaml run --rm migrate
docker compose --env-file deploy/.env -f deploy/compose.yaml run --rm seed-demo
docker compose --env-file deploy/.env -f deploy/compose.yaml up -d backend frontend
./deploy/azure/smoke-test.ps1 -BaseUrl http://localhost:8000 -AllowLocalHttp -RequireCatalog
Invoke-RestMethod http://localhost:3000/api/proxy/api/v1/health
```

Mở <http://localhost:3000/dashboard>, Explorer, Detail, Comparison. Các số liệu này
là **synthetic**, không phải NASA. Mission/prediction frontend vẫn có logic demo riêng
đã tồn tại; không xem đó là model được khoa học xác nhận. Chat NASA chưa được tích hợp.

`seed-demo` gọi lại seeder có guard hiện tại, không tạo ETL khác. Nó chỉ chấp nhận
`flameguard_demo_local`, role owner không superuser, loopback trong network namespace
của container PostgreSQL, explicit `--allow-synthetic`, OID đúng và fixture đúng.
Bootstrap chỉ tạo manifest sau khi seed thành công. Không chạy tự động ở API startup.
Migration phải chạy trước. Tái chạy seed cùng fixture không ghi đè dữ liệu khoa học.

PostgreSQL không publish port ra host. Admin role chỉ dùng lúc init; owner chạy
migration/seed; reader chỉ SELECT. Default grants áp dụng cho bảng do owner tạo.
Không cấp runtime writer: chat persistence chưa được cấu hình; không dùng owner URL
làm API URL để ép chat hoạt động. Password init chỉ áp dụng khi volume trống; đổi `.env`
không tự đổi password role đã tồn tại. Rotate có kiểm soát, không xóa volume để sửa.

```powershell
docker compose --env-file deploy/.env -f deploy/compose.yaml ps
docker compose --env-file deploy/.env -f deploy/compose.yaml logs --tail 100 backend
docker compose --env-file deploy/.env -f deploy/compose.yaml stop
docker compose --env-file deploy/.env -f deploy/compose.yaml start
# Hoặc down (KHÔNG có -v): giữ named volumes.
docker compose --env-file deploy/.env -f deploy/compose.yaml down
```

Không chia sẻ output `docker compose config` đầy đủ hoặc `docker inspect` vì có env secrets.
Chỉ dùng `config --quiet` khi kiểm tra. Local logs không bật access log/private chat payload.

## 4. Azure cho người mới: account, region, quota

Subscription là tài khoản tính tiền/credit; Resource Group là nhóm tài nguyên;
region là vị trí datacenter; Container Apps Environment là vùng chạy Container Apps.
Registry lưu image, PostgreSQL giữ dữ liệu, Azure Files giữ file ngoài vòng đời container.

Cài Azure CLI, đăng nhập tương tác; không đưa token vào Git:

Nếu PowerShell báo scripts disabled, kiểm tra `Get-ExecutionPolicy -List` và chính sách
của máy. Chỉ khi bạn được phép, dùng `Set-ExecutionPolicy -Scope Process RemoteSigned`
cho cửa sổ hiện tại hoặc dùng script đã ký; không thay policy toàn máy/tổ chức.

```powershell
az login
az account list --query "[].{name:name,id:id,state:state}" -o table
Copy-Item deploy/azure/config.example.ps1 deploy/azure/config.local.ps1
# Điền SubscriptionId, resource names. Chưa tự chọn southeastasia.
./deploy/azure/preflight.ps1
```

Script chỉ đọc, dùng `--subscription` từng lệnh, không đổi default subscription,
không đăng ký providers, không tạo resources, không đọc secret values. Cần quyền đọc
resources/policy/providers; nếu không có quyền, nhờ subscription admin cung cấp evidence.
Script liệt kê policy assignments kế thừa và tham số region có thể nhận diện được;
**không phải policy evaluator đầy đủ**, không tự kết luận region hợp lệ.

Portal: **Policy → Assignments**, chọn subscription rồi Resource Group; xem
`Allowed resource deployment regions`, `Allowed locations`, inherited initiatives,
definition, parameters, enforcement, exclusions và exemptions. Lưu region được phép
và assignment ID trong ghi chú local. `az account list-locations` chỉ là danh mục Azure,
không phải danh sách bạn được quyền deploy. Điền `Location`, `ApprovedLocations`
trong config sau khi xác nhận; region vẫn có thể bị policy khác từ chối.

Phân biệt:

| Lỗi | Kiểm tra |
| --- | --- |
| RequestDisallowedByAzure/Policy | Details của deployment failure, assignment/definition và allowed region |
| SKU/capacity unavailable | SKU có cung cấp ở region đó không; dịch vụ đang thiếu capacity không |
| Quota exceeded | Subscription → Usage + quotas của đúng service/region |
| Provider not registered | Resource providers; chỉ đăng ký sau khi bạn duyệt |

Kiểm tra trước khi duyệt tạo resources:

```powershell
az postgres flexible-server list-skus --location YOUR_ALLOWED_REGION --subscription YOUR_SUB_ID -o table
az vm list-skus --location YOUR_ALLOWED_REGION --size Standard_B --all --subscription YOUR_SUB_ID -o table
az provider show --namespace Microsoft.App --subscription YOUR_SUB_ID --query registrationState -o tsv
```

Không bypass policy, không tự upgrade Pay-As-You-Go. Nếu policy không cho service/region,
chọn region/dịch vụ hợp lệ hoặc chuyển local demo; mở support ticket nếu cần.

## 5. Tạo hoặc tái sử dụng resources — bạn thực hiện thủ công

Kiểm tra `rg-flameguard`, `cae-flameguard`, `ca-flameguard-api` trước. Resource Group có
location riêng, không bắt buộc trùng location mọi resource. Chỉ tái sử dụng Environment
khi đúng region/network và Consumption; không đổi Environment của app đang dùng ngầm.

Trong Portal, xem estimate trước khi bấm Create:

1. Resource Group: giữ `rg-flameguard` nếu phù hợp.
2. Container Apps Environment: Consumption, region đã duyệt; logging tối thiểu theo
   lựa chọn được hỗ trợ, không tạo dedicated workload profile.
3. PostgreSQL Flexible Server: Burstable B1ms nếu có, minimum storage được hỗ trợ,
   không HA; chọn backup retention phù hợp và ghi lại hostname. Không giả định free offer.
4. Registry: ACR Basic nếu cần private image; GHCR public có thể tránh ACR cost nhưng
   chỉ publish image sau khi rà bí mật và quyền phân phối source artifacts.
5. Container App: dùng Environment có sẵn, image được duyệt, external ingress,
   target port 8000, HTTPS-only, 0.5 CPU/1 GiB, min 0, max 1.

Image private ACR: dùng managed identity được cấp **AcrPull** ở đúng registry.
Portal → Container App → Identity, rồi ACR → Access control. Không bật ACR admin account
chỉ cho tiện. Với app chưa tồn tại, dùng user-assigned identity được cấp quyền trước,
hoặc cấu hình quickstart app trước rồi cập nhật image. Scripts chỉ UPDATE app đã tồn tại.
Migration Job cũng cần identity/pull permissions của riêng nó.

## 6. PostgreSQL, role và TLS

Tạo owner/migrator riêng, reader SELECT riêng, không chạy API bằng Azure admin.
DDL local trong `deploy/local/init-roles.sh` minh họa quyền; cloud dùng password riêng,
không copy password local. Reader cần USAGE public và SELECT các bảng; owner tạo bảng
và cấp default privileges. Giữ boundary runtime writer của ADR-0004 khi sau này bật chat.

Trong Portal bật TLS; thiết lập firewall chỉ cho địa chỉ quản trị và egress đã xác định
của Environment. **Không dùng 0.0.0.0–255.255.255.255 hoặc “allow all Azure services”**
như giải pháp mặc định. Egress có thể đổi; kiểm tra sau thay đổi network/revision.
Nếu không thu hẹp được an toàn, cần network design được duyệt; không tự mua NAT/VNet.

SQLAlchemy/asyncpg hiện tại dùng dạng sau (password phải percent-encode):

```text
postgresql+asyncpg://READER:URL_ENCODED_PASSWORD@SERVER.postgres.database.azure.com:5432/flameguard?ssl=verify-full
```

Không dùng `sslmode=require` của libpq cho URL này; SQLAlchemy truyền `ssl` xuống
asyncpg. `verify-full` xác thực CA và hostname. Image cài system CA; nếu CA của server
không nằm trong trust store, cần image cập nhật CA được xác nhận, không tắt verification.
Launcher deployment từ chối production URL thiếu `ssl=verify-full`; không đổi engine app.
URL owner dùng cho Job phải cùng server/database, khác role reader. Secret URLs không
in trong logs. Không ghi raw password vào shell history hoặc `NEXT_PUBLIC_*`.

Portal → Container App → Secrets: thêm `database-url` là reader URL. Job dùng secret
owner riêng ở phạm vi Job. App Settings chỉ reference secret, không nhập URL plaintext.
Entry point cho phép command override để migration dùng cùng image, không tự migrate.

## 7. Manifest và file artifacts bền vững

DB một mình chưa đủ: manifest phải chứa đúng identity/OID/reader, fixture hoặc snapshot,
slugs, origin/review state và chính xác nội dung scientific collection. **Không sửa
manifest hoặc snapshot để hợp thức hóa dữ liệu không được duyệt**. Restore sang DB khác
đổi OID: cần owner rebind có review, không bỏ kiểm tra.

Local/VM có named volumes `postgres_data`, `collection_data`, `artifact_data`. API mount
collection/artifacts read-only; bootstrap synthetic chỉ ghi collection volume.
Baseline chưa có source-file serving endpoint nên artifact volume hiện là chỗ dành sẵn,
không phải xác nhận NASA integration. Không cấu hình ARTIFACT_DIR giả vì app không đọc nó.

Cloud chọn một trong hai khi Data bundle được chấp nhận:

- **Immutable bundle:** Data/Backend xác nhận manifest, raw originals, checksum, license,
  locators và version; đóng gói chính xác trong image. Migration/ingestion/API phải dùng
  cùng digest. Hiện Dockerfile chỉ chứa `backend/data`, không tự kéo external NASA assets.
- **Azure Files:** Storage account Standard LRS, file share; Container Apps Environment
  → Azure Files/storage mount; app/Job dùng cùng storage name và mount path. Trong app
  revision, thêm volume loại AzureFile và mount `/var/lib/flameguard`; đặt manifest path.
  Kiểm tra UID 10001, read-only API và quyền ghi riêng cho importer; không chmod 777.
  Không đưa storage key vào config Git; dùng Portal/secret và hạn chế RBAC.

Nguồn tham khảo cú pháp mount chính thức ở cuối tài liệu. Environment storage, volume và
container volumeMount là ba cấu hình khác nhau. Scripts giữ volumes/mounts đã có, không
tự tạo share hay lấy storage account key. ManifestPath không tự upload/mount dữ liệu.

Nếu DB đã có release nhưng thiếu artifacts: đối chiếu version/hash với raw archive;
restore đúng file vào staging cùng mount, verify checksum rồi chuyển atomically. Không
xóa release, reset DB hoặc chạy lại importer idempotent và mặc định rằng nó sẽ restore.
Baseline này không có dataset_release/publisher; logic repair cụ thể chờ implementation
thật và acceptance tests (có thể chưa cần sửa nếu bundle bất biến đã đầy đủ).

## 8. Build, migration và rollout có kiểm soát

Chuẩn bị image không phụ thuộc remote GitHub:

```powershell
# Docker Engine phải chạy. Sửa tag/version chưa từng dùng trong config.
./deploy/azure/build-push.ps1 -WhatIf
./deploy/azure/build-push.ps1
# Chỉ sau khi duyệt push và xác nhận registry:
az acr login --name YOUR_ACR --subscription YOUR_SUB_ID
./deploy/azure/build-push.ps1 -Push
```

Script từ chối overwrite ACR tag có sẵn. Nếu GHCR, dùng cùng docker build, xác nhận tag
chưa tồn tại rồi `docker push` thủ công sau login qua credential helper; không đặt PAT
trong command line/Git. Ghi digest sau push; khóa tag ACR write/delete hoặc dùng digest
khi vận hành ngoài helper. Không build lại và ghi đè cùng tag. Với thay đổi chưa commit,
ghi inventory/hash và unique version; không tự commit vì deployment.

Trong Portal tạo **Manual Container Apps Job** sau khi duyệt chi phí:

- cùng Environment, image tag/digest, mạng và mounts với API;
- 0.5 CPU/1 GiB, timeout 600s, retry 0, parallelism 1, completion count 1;
- command override: `python`, `deployment/entrypoint.py`;
- args: `alembic`, `upgrade`, `head`;
- env `APP_ENV=production`, `DEBUG=false`, `DATABASE_URL` reference secret owner TLS;
- không chạy scheduler, không chạy nhiều Job khác vào cùng DB.

Trước khi chạy: kiểm hostname/database/owner secret trong Portal, backup, đọc migration
impact và `alembic history`. Có thể tạo Job kiểm tra với args `alembic current` riêng.
Không nhầm DB đang chấm và DB test. Dừng mọi migration runner khác, chỉ một người điều phối.
Guard active execution trong script là kiểm tra hỗ trợ, không phải distributed lock.

```powershell
./deploy/azure/run-migration.ps1 -WhatIf
./deploy/azure/run-migration.ps1
# Chờ Job → Executions → Succeeded. Nếu Failed/Unknown: xem logs đã làm sạch,
# kiểm tra alembic current bằng Job read-only; không tự retry.
./deploy/azure/run-ingestion.ps1 # Hiện chủ động báo BLOCKED, không ghi DB.
./deploy/azure/deploy-containerapp.ps1 -WhatIf
./deploy/azure/deploy-containerapp.ps1
# Nếu chỉ duyệt kiểm tra hạ tầng khi CHƯA có collection:
./deploy/azure/deploy-containerapp.ps1 -AllowHealthOnly
./deploy/azure/smoke-test.ps1 -BaseUrl https://YOUR_APP_FQDN -RequireCatalog
```

Helper rollout đặt provider unavailable, không bật runtime writer hoặc LLM. Muốn image
có AI adapter mới cần merge được review và cập nhật deployment riêng; không chỉ bật env.
Mỗi external command fail sẽ dừng. Không in output app configuration/secret.

`/api/v1/health` là liveness, không phụ thuộc DB/LLM; `/api/v1/ready` chỉ kiểm DB;
`GET /api/v1/investigations?limit=2` mới kiểm catalog admission. Probe readiness không
chứng minh dữ liệu được khoa học nghiệm thu. Startup probe cho tối đa khoảng 240s;
đo lại khi có RAG init thật. Max concurrency 32 là backpressure, **không phải rate limit**.
Để public paid LLM sau này phải có quota/request controls, bounded tokens, timeout,
abstention/fallback và chống lạm dụng được duyệt. Không bật trước khi có integration.

## 9. Vercel frontend

Root Directory: `FlameInFreewall_Tourbillion`, framework Next.js; npm lockfile đã có.
Server-side env `BACKEND_INTERNAL_URL=https://YOUR_APP_FQDN` (**không có `/api/v1`**).
Mặc định browser gọi `/api/proxy/api/v1`, Next rewrite chuyển sang backend.
Không đặt `NEXT_PUBLIC_API_BASE_URL` nếu dùng proxy; nếu dùng direct API thì phải có
`/api/v1`, CORS đúng origin và hiểu URL này công khai. API keys/DB URLs luôn backend-only.

Next rewrites được resolve lúc build: đổi backend URL rồi **redeploy/rebuild frontend**.
Local image cũng nhận BACKEND_INTERNAL_URL ở build arg; runtime env không tự sửa rewrite.
`next.config.ts` chỉ thêm `output: standalone` để runtime image không cần dev dependencies;
SSR, proxy và static assets giữ nguyên. Container chạy generated `server.js`; không dùng
`next start` cho standalone image. Vercel vẫn tự xử lý Next build theo platform.
Vercel deployed preview có origin khác production; chỉ thêm origin cần thiết, không `*`.
SSR dùng URL riêng theo code API config; kiểm cả browser và server-side khi nghiệm thu.
Đây là hướng dẫn; không tự cấu hình project Vercel/GitHub.

## 10. VM dự phòng và App Service

**VM:** chỉ tạo sau khi duyệt region/SKU/cost. Chọn Linux nhỏ dựa trên đo đạc; khởi đầu
xem xét RAM 2 GiB trở lên vì Next + API + PG cùng máy, không khẳng định đủ khi chưa đo.
SSH key, NSG port 22 chỉ admin public IP/32; 80/443 cho HTTPS. Không mở 5432/8000/3000.
Cài Docker + Compose từ nguồn chính thức; build image ở máy dev, dùng cùng backend image
trên VM, tránh build Next ngốn RAM trên VM nhỏ.

DNS A record `DEMO_DOMAIN` trỏ public IP VM; mở 80/443 để Caddy cấp/renew certificate.
Copy source deployment và images hợp lệ; secret `.env` tạo riêng, chmod 600 trên Linux.

```powershell
# Chạy trên VM (shell có Docker), đặt image tags trong deploy/.env.
docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.vm.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.vm.yaml up -d postgres
docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.vm.yaml run --rm migrate
docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.vm.yaml run --rm seed-demo
docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.vm.yaml up -d backend frontend caddy
```

VM example này vẫn là synthetic demo, không phải NASA production import. Backend image
giống Option A nhưng APP_ENV=development cho isolated demo; không dùng cấu hình này để
bỏ TLS của managed PostgreSQL. Local PG ở network riêng, không có host port. Caddy giới
hạn request 1 MiB; không mở paid LLM. Khi đưa dữ liệu thật vào VM phải thay bootstrap bằng
Data importer được duyệt, TLS/network/persistence được rà lại trước.

**App Service Linux containers:** cùng backend image, managed PG TLS và secret settings;
không đặt PostgreSQL trong ephemeral filesystem của App Service. Chọn một model:

- Classic custom container: image/registry trong Deployment Center; app setting
  `WEBSITES_PORT=8000`. Đặt APP_ENV, DATABASE_URL, manifest path, CORS như trên.
- Sidecar-enabled app: main container `isMain=true`, targetPort=8000 qua sitecontainers;
  không dựa vào WEBSITES_PORT của classic. Không trộn hai model.

HTTPS endpoint `https://NAME.azurewebsites.net`, HTTPS Only bật. Mount Azure Files hoặc
bundle bất biến; `/home` persistent tùy setting/plan không phải bảo đảm cho mọi path.
Migration dùng one-off runner đã duyệt cùng network/image, không API startup. App Service
Plan vẫn tính phí khi app idle/stopped; chỉ chọn nếu estimate và subscription cho phép.

## 11. Rollback, backup và giữ demo cho ban giám khảo

Trước rollout ghi: image digest/tag cũ, revision cũ, env/secret **names**, dataset/artifact
version + hash manifest, Alembic revision và backup timestamp. Không export secret values.
Container App single revision tự chuyển traffic sau readiness; rollout helper cần chạy
smoke catalog và source tests riêng. Khi lỗi, redeploy image tag cũ qua config/script với
cùng bundle/DB tương thích. Có thể dùng Portal Revisions → activate revision cũ theo mode;
kiểm tra traffic sau đó. Không tự `alembic downgrade` hoặc restore đè shared DB.

Backup VM/local: tạo PG dump nhất quán + collection/artifact archive cùng dataset version;
giữ ngoài repo, mã hóa khi có dữ liệu nhạy cảm. Ví dụ Linux VM (không đưa binary dump qua
PowerShell 5 pipeline):

```bash
mkdir -p deploy/backups
chmod 700 deploy/backups
docker compose --env-file deploy/.env -f deploy/compose.yaml exec -T postgres \
  pg_dump -U postgres -d flameguard_demo_local -Fc -f /tmp/flameguard-demo.dump
docker compose --env-file deploy/.env -f deploy/compose.yaml cp \
  postgres:/tmp/flameguard-demo.dump deploy/backups/flameguard-demo.dump
```

Sao lưu file volumes bằng công cụ backup Docker/VM của operator; ghi hashes/version và
thử restore vào **DB/volumes riêng**. Azure PG dùng backup/PITR theo retention đã chọn;
restore thành server mới, rebind admission qua owner review do OID đổi, không sửa DB cũ.
Image rollback không tự đảo schema/data; nếu không tương thích cần quyết định riêng.

Trước giờ chấm: warm up app (min=1 nếu được duyệt), kiểm health/ready/catalog,
dashboard→detail→comparison, source/citation thực nếu đã tích hợp; giữ local demo sẵn,
đừng deploy sát giờ. Nêu rõ scientific limitations và disclosure theo luật cuộc thi.

## 12. Chi phí và thao tác thủ công trên Portal

Không có báo giá cố định trong tài liệu: dùng Pricing Calculator của đúng region/offer.
Credit $100 không bảo đảm tất cả resource miễn phí. Budget alert là thông báo, không là
spending cap. Xem Cost Management mỗi ngày; đặt nhiều ngưỡng cảnh báo theo credit còn lại.

| Resource | Rủi ro chi phí |
| --- | --- |
| Container Apps | CPU/RAM requests và min=1; Jobs cũng tính compute |
| PostgreSQL | Compute khi chạy, storage/backup; dừng không xóa storage charges |
| ACR Basic | Registry tính phí khi idle, thêm storage/egress |
| Azure Files/Storage | Capacity, operations, backup và egress |
| Log Analytics | Log ingestion/retention; giảm log không có nghĩa miễn phí |
| VM | Compute khi allocated; disks/public IP vẫn có thể tính phí sau deallocate |
| App Service Plan | Plan vẫn tính phí dù app không nhận request |
| LLM | Theo provider usage; baseline chưa tích hợp và không bật |

**What I need to do manually in Azure Portal**

1. Xác nhận đúng Azure for Students subscription và credit hiện còn.
2. Policy → Assignments: tìm region được phép; không chọn mặc định Southeast Asia.
3. Kiểm tra resources đã có và service/SKU/quota trước khi tạo thêm.
4. Duyệt estimate rồi tạo/reuse PG, Environment, registry và Container App.
5. Cấu hình roles/firewall/TLS, secrets và registry identity. Không mở PG cho mọi IP.
6. Chỉ mount/upload bundle khi Data/Backend đã nghiệm thu; hiện chấp nhận health-only
   hoặc synthetic local, không gọi đó là NASA integration hoàn chỉnh.
7. Tạo Manual migration Job đúng cấu hình, kiểm tra target/backup rồi mới chạy.
8. Duyệt rollout, đặt URL backend cho Vercel, rebuild frontend, chạy smoke/browser tests.
9. Đặt budget alerts và lịch theo dõi chi phí. Muốn dừng/xóa resource phải backup,
   xem dependency và tự duyệt từng resource; bộ scripts không có lệnh delete.

## 13. Nguồn chính thức đã đối chiếu

- [Azure region access errors](https://learn.microsoft.com/en-us/azure/azure-resource-manager/troubleshooting/error-region-access-policy)
- [Policy assignment CLI](https://learn.microsoft.com/en-us/cli/azure/policy/assignment)
- [Container Apps CLI](https://learn.microsoft.com/en-us/cli/azure/containerapp)
- [Health probes](https://learn.microsoft.com/en-us/azure/container-apps/health-probes)
- [Manual Jobs](https://learn.microsoft.com/en-us/azure/container-apps/jobs)
- [Storage mounts](https://learn.microsoft.com/en-us/azure/container-apps/storage-mounts)
- [Registry managed identity](https://learn.microsoft.com/en-us/azure/container-apps/managed-identity-image-pull)
- [Classic App Service container](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container)
- [App Service sidecars](https://learn.microsoft.com/en-us/azure/app-service/configure-sidecar)
- [asyncpg TLS](https://magicstack.github.io/asyncpg/current/api/index.html)
- [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

Portal/CLI có thể thay đổi. Scripts chưa được chạy trên Azure; kiểm tra preflight và
`-WhatIf`, rồi người phụ trách duyệt execution. Không coi file cấu hình là bằng chứng cloud thành công.
