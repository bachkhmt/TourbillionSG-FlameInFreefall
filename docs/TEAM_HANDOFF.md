# Bàn giao Backend/Data — 2026-11-14

Phạm vi user chốt: mục1 import/kiểm tra DB và mục2 phương án A. User yêu cầu tiếp tục
tích hợp/merge và soạn tin nhắn bàn giao. Mục3 chất lượng AI và mục4 FE thuộc owner.

## Tích hợp

- PR2 đã merge vào main tại `e3277c3`; tác giả đã đưa phần giải conflict FE lên upstream.
- Phần Backend/Data bổ sung tiếp nối PR3; giữ các commit Data gốc và cập nhật main trước
  khi merge. Không tự giải lại FE hoặc thay thuật toán RAG trong phần bổ sung này.
- Docker chưa review nằm riêng tại nhánh local `wip/docker-deployment-20261114`,
  commit `b950300`; không nằm trong PR Data, chưa push/deploy.
- Không import/migrate DB dùng chung. Chỉ kiểm tra trên test PostgreSQL đã được duyệt
  tại `127.0.0.1:55435`; migration mới cần áp dụng trước khi import bundle mới.

## Đã bàn giao về kỹ thuật

Phương án A giữ21 bảng, thêm migration `0004_challenge_source_scope`, giữ nguyên0001–0003.
Nguồn cấp challenge có `source_scope=challenge` và `investigation_id=NULL`, được CHECK
bảo vệ. Nguồn study cũ giữ owner. Downgrade từ chối nếu vẫn có nguồn NULL owner.

| Profile | Investigations | Records | Sources | Passages | Challenge resources |
| --- | ---: | ---: | ---: | ---: | ---: |
| `psi` (tái lập unified của PR3 gốc) | 24 | 1926 | 71 | 2508 | 0 |
| `unified` (mặc định mới) | 24 | 1926 | 81 | 2574 | 10 |

`GET /api/v1/chat/resources` báo inventory/status/indexed. Sáu trang resource cung cấp66
chunks; số resource được lưu không đồng nghĩa mọi nội dung nguồn đã tải/index đầy đủ.

Bằng chứng: [verification](../flameguard-ai-backend/specs/phase6c-challenge-resources/verification.md),
[HTTP/DB smoke](../flameguard-ai-backend/specs/phase6c-challenge-resources/http-import-smoke.json),
[full root confirmation](../flameguard-ai-backend/specs/phase6c-challenge-resources/integration-confirmation.json).
Backend full suite689passed; root full suite80passed/0fail/0skip; các lượt regression
bổ sung có overlap nên không cộng tổng. Hai lỗi barrier10s của lượt đầu đã được sửa ở
fixture và full root chạy lại pass. Không đổi timeout production hoặc concurrency semantics.

## Việc còn lại theo owner

| Owner đề nghị | Việc cần làm | Điều kiện hoàn tất |
| --- | --- | --- |
| Data / tác giả PR3 | Apollo1/13, Guide full PDF, transcript video có nguồn/quyền rõ; bổ sung parser và release mới | Raw/hash/URL/rights/locator kiểm chứng được, không overwrite revision; checklist tại [RESOURCE_CONTENT_HANDOFF](RESOURCE_CONTENT_HANDOFF.md) |
| Backend + DB | Nhận bundle bổ sung; rà adapter và rights policy cho PDF/transcript; migrate/import lên target triển khai khi target được duyệt | Chạy kiểm tra tương thích và HTTP readiness/inventory trên target đó; không coi DB test là DB dùng chung đã cập nhật |
| AI | Đánh giá retrieval, citation, abstention VI/EN trên corpus2574 và các nguồn chưa index; ghi hạn chế/benchmark theo corpus version | Báo cáo chất lượng và regression; không suy ra chất lượng từ việc test HTTP pass |
| Tác giả PR2 + FE | Xác nhận chat sau merge với main: UI mới, mở/đóng, reload/history, pagination, citation/source, timeout/error; chạy FE tests/types/build và browser smoke | Evidence trên main mới; conflict cũ đã được giải upstream, chỉ xử lý conflict mới nếu phát sinh |

PSI search là discovery link có chủ đích. Apollo1/13 chưa tải được; video chưa transcript
xác minh; Guide mới có landing article, chưa full PDF. Parser hiện tại dành cho HTML
article narration; schema hỗ trợ nguồn không đồng nghĩa PDF/video tự index được.

Full corpus admission vẫn scan mỗi request; GET smoke khoảng5–6s trên máy hiện tại.
Nếu độ trễ ảnh hưởng demo, Backend/AI đo trước khi tối ưu và giữ kiểm tra provenance.
Stale-history concurrency vẫn là giới hạn đã trao đổi, chưa được sửa trong phạm vi này.
Mọi câu trả lời vẫn unreviewed; chưa có scientific sign-off hoặc production acceptance.

Tài liệu này để user bàn giao; agent không tự gửi tin nhắn cho các team.
