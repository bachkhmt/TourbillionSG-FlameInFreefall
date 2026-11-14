# Bộ dữ liệu thống nhất NASA: bàn giao Data → Web/RAG

## Cập nhật Backend/Data — 2026-11-14, chỉ mục 1 và 2

Nhánh `feat/data-backend-handoff-20261114` dựa trên PR #3. Đã chọn phương án A:
migration `0004_challenge_source_scope`, vẫn21 bảng. Nguồn cấp challenge có
`source_scope=challenge`, `investigation_id=NULL`; CHECK ngăn scope/ownership sai.
Không tạo investigation hoặc run giả. Migration cũ giữ nguyên; snapshot cũ vẫn đọc được.

| Profile hiện tại | Investigations | Records | Sources | Chunks |
| --- | ---: | ---: | ---: | ---: |
| `unified` (mặc định, thêm resources) | 24 | 1.926 | 81 | 2.574 |
| `psi` (tái lập unified PSI trước đây) | 24 | 1.926 | 71 | 2.508 |
| `coverage` | 24 | 1.535 | 68 | 1.811 |
| `challenge` | 18 | 910 | 51 | 1.045 |

Đã import và kiểm cả `psi` và `unified` trên child DB mới riêng của server test
`127.0.0.1:55435` được user duyệt. Không reset DB có sẵn. `GET /chat/readiness`
báo2508/2574 tương ứng; `/chat/resources` trả0/10 nguồn tương ứng. Endpoint này
cho biết `indexed`, `status`, quyền sử dụng và source ID để AI/FE tích hợp tiếp.
Citation source metadata hỗ trợ investigation NULL và source scope.

10 resource entries đều được lưu. Sáu bài NASA có66 chunk narration với raw/hash/
locator và quyền `NASA-public-use-text`, tách khỏi policy CC0 cũ. PSI search là link
khám phá; video chưa có transcript xác minh; Apollo1/13 bị lỗi tải nên không index.
Researcher's Guide hiện chỉ có landing article, chưa có toàn bộ PDF liên kết.
Chi tiết raw và trạng thái: `integrations/nasa_data/research/challenge-resources-2026-11-14/`.

Mục3 đánh giá AI và mục4 conflict FE của PR2 vẫn do AI/tác giả PR2 thực hiện.

Checklist phần nội dung Apollo/video/full Guide PDF còn thiếu và chủ trì:
[`RESOURCE_CONTENT_HANDOFF.md`](RESOURCE_CONTENT_HANDOFF.md). PSI search là discovery
link có chủ đích, không phải lỗi thiếu tài liệu. Checklist chưa được gửi cho team.

Xác nhận integration cuối ngày14/11: **80 passed,0 failed,0 skipped**,458.88s trên
PostgreSQL test55435. Dòng77passed/2failed trong verification là lịch sử trước sửa
fixture; kết quả full-run mới và JSON evidence đã được đưa lên đầu báo cáo.
Nhánh này không sửa FE hay thuật toán `app/integrations/rag/`. Docker/deployment
chưa review được cất riêng trên `wip/docker-deployment-20261114` (`b950300`).

Lệnh kiểm tra/import tái lập: `scripts/verify_data_handoff.py` qua
`scripts/test_db.py run`; chuẩn bị preview riêng bằng
`prepare_chat_preview.py --prepare-new-test-target --profile psi|unified`.
Bằng chứng mới, migration impact và giới hạn ở
`flameguard-ai-backend/specs/phase6c-challenge-resources/verification.md` và ADR-0006.

## Bàn giao gốc PR #3 — lưu làm bằng chứng lịch sử

Phần dưới mô tả nhánh Data trước phần mở rộng Backend/A; số liệu và các việc
pending ở phần này không thay thế trạng thái hiện tại bên trên.

Cập nhật 2026-11-14, branch `data/unified-dataset`. Branch tạo từ `feat/rag-nasa-chat`.

## Tóm tắt

`integrations/nasa_data/` build một **release thống nhất** dùng chung cho dashboard
(snapshot 21 bảng) và chatbot RAG (chunk CC0 có hash). Release chạy offline, không gọi
network và không ghi DB.

**Chỉ dùng nguồn chính thức.** Trang Resources của challenge ghi PSI là "source of the
data". Release chỉ dùng **file PSI** và **metadata PSI**. Paper NTRS không có trong
danh sách resources nên không được đưa vào.

| Release (`--profile`) | Parser | Investigations | Source records | Sources | Chunks |
| --- | --- | ---: | ---: | ---: | ---: |
| `unified` (mặc định) | `nasa-unified-v1` | 24 | 1.926 | 71 | 2.508 |
| `coverage` | `nasa-challenge-v2` | 24 | 1.535 | 68 | 1.811 |
| `challenge` | `nasa-challenge-v1` | 18 | 910 | 51 | 1.045 |

Release sau xây chồng lên release trước. Release trước vẫn tái lập được byte-for-byte.
Ví dụ `challenge` vẫn ra revision `91e41126…`.

Số source record **không phải** số thí nghiệm độc lập. Lý do: có key trùng, có test
point trong ngày, và cùng một test có thể có hai nguồn. Có **0** record được thẩm định
khoa học độc lập.

## Có gì trong `unified`

| Lớp | Nội dung | Nguồn |
| --- | --- | --- |
| v1 (Bach) | FLEX, BASS-II, CFI-G normal, BASS, Saffire-II/III, CFI (CSV), SAME-R; SAME/BRE thành configuration; context PSI của 18 study | `research/nasa-combustion-2026-11-10`, `…-11-13` |
| v2 (`coverage.py`) | CFI-G inverse 154, SPICE 469 set points, Saffire-I 2. FLEX-2/SLICE/CLD/E-FIELD/s-Flame chỉ là configuration. FLEX calibration, Saffire ReadMe. Chunk ≤ 900 ký tự | Bytes đã có trong snapshot 10/11 |
| v2 | 6 study PSI combustion còn thiếu: PSI-47 DAFT, PSI-60/62/115/117/142. Chỉ metadata; ground investigation được gắn nhãn modeling | `research/nasa-combustion-2026-11-14/context` |
| unified (`unified.py`) | **ACME BRE**: 243 chamber test point từ 2 workbook Chamber Calculator (PSI-20). **CFI**: 227 Flex Number từ Data Summary Spreadsheet (PSI-39), liên kết với 87 dòng CSV cũ | `research/nasa-combustion-2026-11-14/psi-files` |

Quy tắc đọc workbook chi tiết nằm trong `research/nasa-combustion-2026-11-14/psi-files/README.md`.

**Những điều phía Web/RAG cần biết:**
- Thành phần khí và Burn Fraction của BRE là **giá trị calculator**, có status
  `needs_review`. Chúng không bao giờ thành điều kiện O₂ của run.
- 40 test point BRE không khớp ngày trong bảng tổng hợp được **gắn cờ**, không bị xóa.
- CFI không có giá trị nào lệch giữa CSV và spreadsheet. Cột không khai báo đơn vị và
  cột công thức được giữ raw.
- Mọi observation từ workbook có locator `xlsx '<sheet>'!<ô>` trỏ đúng ô gốc. Test kiểm
  tra điều này.

## Cách build và kiểm tra

```bash
PYTHONPATH=.:flameguard-ai-backend flameguard-ai-backend/.venv/bin/python -m integrations.nasa_data.export --output /tmp/nasa-bundle
```

```bash
flameguard-ai-backend/.venv/bin/python -m pytest -q
```

Kết quả ngày 2026-11-14 (không có DB):
- `integration_tests`: 59 passed, 9 skipped. Test HTTP/PostgreSQL chưa chạy.
- Ruff pass cho `integrations/` và `integration_tests/`.
- Suite BE upstream (`flameguard-ai-backend`) có 18 test fail vì thiếu
  `PHASE4_ADMIN_URL`. Đây là test PostgreSQL không tự skip, không do branch này gây ra:
  branch không sửa file nào trong `flameguard-ai-backend/`.

## Cần người khác làm

### 1. Import bundle mới vào DB — **DB team**

- Chạy `scripts/prepare_chat_preview.py --prepare-new-test-target` (container test
  `tourbillion-test-pg`) hoặc import lên target khác đã được duyệt. Script tự export bằng
  profile mặc định `unified`.
- Không cần migration mới: vẫn 21 bảng, `0001`–`0003`. Snapshot đã qua `snapshot_rows`.
- Sau khi import, chạy `python3 scripts/test_db.py run -- … pytest -q` để chạy cả test
  HTTP/PostgreSQL. Chat readiness phải báo `passages=2508`.
- Bundle khoảng 40 MB (artifacts gốc + `release.json`).

### 2. Lưu 10 resources chính thức không thuộc investigation — **Backend + DB quyết**

Hiện `source_document.investigation_id` là NOT NULL, nên Researcher's Guide, Apollo 1/13,
Mir và 3 spinoff chưa có chỗ lưu hợp lệ. Các phương án:

| # | Phương án | Ưu | Nhược |
| --- | --- | --- | --- |
| A (đề xuất) | Migration additive `0004`: cho `investigation_id` nullable, thêm cột phân loại nguồn cấp challenge | Ít bảng, đúng ngữ nghĩa | Phải rà publish/API/FE chỗ nào giả định source luôn có investigation |
| B | Bảng `resource_document` riêng + bảng liên kết resource↔investigation | Không đụng bảng cũ | Nhiều thay đổi hơn |
| C | Chỉ lưu trong `release.json`, không vào bảng quan hệ | Không đổi schema | Khó truy vấn; chat không dùng được |

**Không nên** tạo investigation giả hoặc gán resource vào study "gần nhất".

### 3. Retrieval — **AI team**

- Đã có test retrieval cho BRE, CFI, SPICE, CFI-G inverse và DAFT.
- Chưa có bộ câu hỏi đánh giá lớn trên corpus mới. Ở repo NASA tham chiếu, gold set 59 câu
  chạy trên `AnswerService` và phát hiện 4 known gap ở tầng trả lời. Bộ đó chưa được port
  sang `nasa_chat`.

## Ngoài phạm vi branch này

- Paper NTRS (kể cả FLEX TP Table IX) và dữ liệu luận văn (SPICE DeBold/Dotson).
- PSI-10 (license unknown, không index).
- `facts`/`rankings`/`ml_*` của repo Data cũ: không có hash/locator theo dòng.
- Mọi thay đổi schema, import DB, push.
