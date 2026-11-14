# RAG NASA chat end-to-end (port từ /Users/mac/Projects/NASA)

Tier: T3 (DB roles/writer, concurrency/advisory lock, độ chính xác citation).
Branch: `feat/rag-nasa-chat` từ `main@5b6c720`. Mỗi bước một commit; cuối cùng push + PR.

## Quyết định đã chốt với user (2026-11-14)
- Phạm vi: RAG end-to-end (data adapter → chat extension → tests → FE AI Drawer → docs).
- Generation: extractive, không LLM (`nasa-extractive-v2`), không provider trả phí.
- Push: branch riêng + PR vào main.
- DB test: container Postgres 17 mới, riêng cho repo này, cổng 127.0.0.1:55435.

## Nguyên tắc kiến trúc mang sang
1. **BE giữ nguyên.** `flameguard-ai-backend/` không bị sửa. Mở rộng nằm ngoài BE,
   ở `integrations/`, và nối vào qua app factory + `dependency_overrides`
   (`integrations/nasa_chat/app.py:create_app`). Không monkeypatch validator upstream.
2. **Data adapter offline** (`integrations/nasa_data/`): build release từ file NASA
   đã lưu trong repo, xuất snapshot 21 bảng + slugs + registry. Không gọi network,
   không ghi DB.
3. **Policy nguồn**: chỉ chunk từ nguồn CC0-1.0, có hash và registry pin theo
   sourceRevision. Fingerprint corpus = scientific snapshot + policy + registry hash.
4. **Extractive provider**: chỉ trích nguyên văn chunk (≤4 citations), từ chối theo
   quy tắc (safe/unsafe, ngoài phạm vi, trọng lực Mặt Trăng/Sao Hỏa, trộn nhiều run).
   Service kiểm lại câu trả lời của provider bằng chính ExtractiveProvider.
5. **Lưu trữ atomic**: advisory lock theo session từ lúc đọc history đến commit,
   `lock_timeout` 5s, kiểm drift corpus trước khi INSERT, rollback nếu lỗi.
6. **FE không fallback giả lập**: AI Drawer gọi API thật; readiness `not_ready` thì
   khóa Send + Retry. Bỏ `ragKnowledgeEngine` khỏi runtime.

## Các bước và tiêu chí chấp nhận
S1. Scaffolding monorepo: root `.gitignore` (.demo/, .venv/…), root `pytest.ini`
    (testpaths integration_tests, pythonpath `. flameguard-ai-backend`), root `AGENTS.md`.
    AC: `pytest --collect-only` ở root thu được test của integration_tests.
S2. `integrations/nasa_data/` (challenge, pilot, export, resources, research data).
    AC: test export: revision `91e41126…`, 21 bảng, 18 investigations, 910 runs,
    51 sources, 1045 chunks, origin real, 0 reviewed, artifacts đúng sha256.
S3. `integrations/nasa_chat/` + `integration_tests/` (retrieval 14 tests không DB;
    HTTP 9 tests cần DB; `chat_target.py` chỉ chấp nhận 127.0.0.1:55435).
    AC: retrieval tests pass (FLEX-007 giữ cả 1.87 và 1.82 mm; follow-up giữ anchor;
    từ chối safe/unsafe, Mars/Moon; excerpt là slice nguyên văn của chunk).
S4. Container test `tourbillion-test-pg` (postgres:17, 127.0.0.1:55435, mật khẩu ngẫu
    nhiên lưu trong `.demo/test-db-settings.json` mode 0600, không commit).
    AC: BE suite đầy đủ pass với TEST_DATABASE_URL (0 skip phần PG);
    9 HTTP chat tests pass: answer/history/source binding, citation giả bị 502,
    đổi registry → 409/rollback, 2 tin gửi đồng thời theo thứ tự, writer giới hạn
    quyền, timeout, hết hạn phiên 404.
S5. FE: `src/api/dto/chat.ts`, `src/api/services/chatService.ts`,
    `src/hooks/api/useChatQueries.ts`, session token trong sessionStorage,
    AiDrawer/AiMessageItem/CitationBadge dùng API; bỏ import ragKnowledgeEngine.
    AC: vitest pass (test mới mock API: readiness not_ready khóa Send; gửi tạo session
    rồi hiện answer + citation; 404 session → xóa token; View source gọi
    `/chat/sources/{id}` với corpus_version, 409 hiện thông báo bản cũ);
    `tsc --noEmit` và `next build` pass.
S6. `scripts/prepare_chat_preview.py` (tạo target preview mới trên 55435) +
    chạy BE factory cổng 8111, FE cổng 3311 qua proxy; smoke trên trình duyệt.
    AC: hỏi "FLEX-007 D0" thấy 1.87/1.82 mm có citation, reload thấy history.
S7. Docs: `docs/CHATBOT_FLOW.md`, cập nhật root README (cách chạy RAG).
S8. Reviewer (focus: concurrency, data integrity, security của writer role/CORS),
    full gate, push branch, mở PR.

## Ngoài phạm vi / rủi ro
- Không đụng Mission/Predictive Lab giả lập (task khác). Không source-lock BE,
  rebuild-kit, playbook-rag, launcher Windows.
- `admit_collection` quét toàn DB mỗi request (đã biết, giữ nguyên vì BE upstream).
- Session ID chỉ là token demo, không phải auth.
- Rollback: xóa branch; container test có thể dừng/xóa riêng (chỉ chứa dữ liệu test).
