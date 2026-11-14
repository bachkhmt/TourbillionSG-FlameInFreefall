# RAG theo extension point của BE (hướng B) + UI chatbot kiểu NASA

Tier T3 (sửa gate dữ liệu thật, kiểm citation, DB runtime). Branch `feat/rag-nasa-chat` (PR #2).
Chuẩn là kiến trúc BE của repo này: `flameguard-ai-backend/AGENTS.md`,
`docs/contracts/ai-backend-interface.md`, ADR-0004, `specs/phase6-rag-advisor/*`.
Repo NASA chỉ để tham khảo (code retrieval/provider, style UI chat).

## Quyết định của user (2026-11-14)
- Chọn hướng B: RAG cắm vào BE qua extension point có sẵn, chạy bằng `app.main:app`.
- UI chatbot học style chat NASA (panel, bubble, privacy, Conversation history có phân trang,
  citation/View source, textarea), **giữ backdrop mờ** của repo hiện tại khi mở.

## Thiết kế
### BE (`flameguard-ai-backend/`, thay đổi cộng thêm, không migration)
1. `app/core/config.py`: `chat_provider` thêm `"extractive"`.
2. `app/integrations/chat.py` (biên giới protocol):
   - `CorpusPassage` (chunk_id, source_document_id, investigation_id, slug, title, locator, text).
   - Protocol tùy chọn `CorpusRetriever.retrieve(question, passages, prior_questions, study_slugs)
     -> tuple[Citation, ...]`.
   - `select_provider`: `"extractive"` → `ExtractiveProvider`.
3. `app/integrations/rag/` (code thuật toán của AI team): `text.py`, `bm25.py`, `retrieval.py`,
   `provider.py` (`ExtractiveProvider`: `retrieve`, `answer`, `advise` → unavailable).
   Port từ NASA, bỏ phụ thuộc ngoài BE.
4. `app/services/corpus_policy.py` (BE admission cho corpus thật): đọc khai báo
   `corpusPolicy` trong collection manifest {policyVersion, registry, registrySha256,
   sourceRevision}; registry cùng thư mục (chặn path traversal), đúng hash/version;
   chỉ khi origin `real` + reviewState `unreviewed`. Hàm thuần `admit_passages(rows, registry)`
   đối chiếu từng chunk/source (license CC0-1.0, sha256, version, url, investigation,
   locator, text hash, `ingestion_status=source_checked`) → lỗi xung đột = 503.
5. `app/services/chat.py`:
   - `_read(investigation, corpus=False)` đọc admission + (tùy chọn) passages **trong cùng
     snapshot REPEATABLE READ**; `context()` giữ nguyên chữ ký 3-tuple.
   - Corpus fingerprint = scientific fingerprint + policy version + registry hash + revision.
   - `send`: nếu collection real có corpusPolicy và provider có `retrieve` → BE gọi retrieve
     (to_thread), **BE kiểm từng hit**: (source, locator) thuộc corpus, excerpt là lát cắt
     nguyên văn của chunk, ≤ 4 → `allowed_sources`. Provider `answer` vẫn chạy ngoài
     transaction (ADR-0004). Kiểm lại fingerprint trước khi ghi; drift → 409.
   - `validate_citations(answer, allowed, synthetic, real_corpus=False)`: `origin=real` chỉ hợp
     lệ khi `real_corpus` và `review_status=unreviewed`; các quy tắc cũ giữ nguyên.
6. `app/api/v1/endpoints/chat.py`: thêm `GET /chat/readiness` và
   `GET /chat/sources/{source_document_id}?locator&corpus_version` (snake_case, `no-store`,
   response model trong `app/schemas/api/chat.py`). 409 khi corpus_version khác, 404 khi không
   thuộc corpus.
7. Quy trình BE: `specs/phase6b-real-corpus-chat/{spec,plan,tasks}.md`, ADR-0005, cập nhật
   `docs/contracts/ai-backend-interface.md`, `docs/team-ownership.md` (AI sở hữu
   `app/integrations/rag/`), `docs/project-status.md` (dòng Phase 6).

### Data (`integrations/nasa_data/`)
- Thêm `corpus_registry.py`: `registry_for(release)`, `write_corpus_policy(manifest, release)`
  (chuyển từ `nasa_chat/policy.py`, khai báo key `corpusPolicy`).

### Gỡ bỏ
- `integrations/nasa_chat/` (app factory + override ChatService), `scripts/run_chat_backend.py`
  chuyển sang chạy `app.main:app` với `CHAT_PROVIDER=extractive`.

### FE
- DTO/mapper readiness + source chuyển sang snake_case.
- `AiDrawer` theo style NASA: panel bo góc nổi bên phải (navy header + nút Close),
  privacy `<details>`, dòng trạng thái kết nối + Retry, bubble "You"/"FlameGuard AI"
  (user nền navy), ghi chú provenance, citation (excerpt khi chưa có trong text, View source,
  license, fingerprint), quick prompts, lỗi `role=alert`, "Conversation history" có
  Refresh history / Previous / Next / Start new session (trang 50 tin, offset),
  textarea + nút "Send"/"Sending…". Lịch sử: trang server + "recent" của lần xem này,
  không chèn tin mới vào trang cũ. **Giữ backdrop `bg-black/40 backdrop-blur-xs`**, Escape.
- Giữ các fix review: callback trong mutation, epoch, đồng bộ lại khi timeout.

### Root
- `integration_tests`: chat_target dùng `write_corpus_policy`, settings `chat_provider="extractive"`,
  HTTP test chạy `app.main.create_app`; retrieval test import `app.integrations.rag`.
- Docs: CHATBOT_FLOW, AGENTS, README.

## Tiêu chí chấp nhận
- AC1 `uvicorn app.main:app` + `CHAT_PROVIDER=extractive` + manifest có corpusPolicy → readiness
  `ready`, FLEX-007 ra 1.87/1.82 mm có citation (HTTP test PG + smoke trình duyệt).
- AC2 Không có corpusPolicy / origin không phải real / provider mock|unavailable → hành vi Phase 6
  cũ giữ nguyên (BE suite 650 test cũ pass, không sửa test cũ trừ khi contract đổi).
- AC3 Unit BE: policy loader từ chối hash sai, path traversal, version sai, license khác CC0,
  origin/reviewState sai; admit_passages bắt xung đột; hit có excerpt không nguyên văn bị loại;
  `validate_citations` từ chối real khi không có real_corpus hoặc review khác unreviewed.
- AC4 Không còn `dependency_overrides`/subclass ChatService; `integrations/nasa_chat` bị xóa.
- AC5 Root integration_tests 0 skip trên container 55435; ruff BE + root sạch.
- AC6 FE: vitest (history phân trang Refresh/Previous/Next, recent không chèn vào trang, backdrop
  có mặt và click đóng drawer, các test cũ về readiness/source/timeout/epoch), tsc, build.
- AC7 Mỗi commit build/test được độc lập.

## Thứ tự commit
1. docs(be): spec + ADR-0005 (+ plan này).
2. feat(be): corpus policy + protocol + config (kèm unit test).
3. feat(be): `app/integrations/rag` extractive provider (kèm unit test).
4. feat(be): ChatService real-corpus path + readiness/sources (kèm unit test).
5. refactor: registry sang nasa_data, xóa nasa_chat, cập nhật integration_tests/scripts.
6. feat(fe): DTO snake_case + UI kiểu NASA (kèm test).
7. docs: CHATBOT_FLOW, AGENTS, README, project-status/contracts.

## Chỉnh sửa sau plan-critic (REVISE → xử lý)
1. Commit: gộp config + protocol + `app/integrations/rag` + unit test vào **một** commit.
2. Grounding cho `origin=real` (`validate_real_answer`):
   - `corpus_version` phải bằng corpus fingerprint của request; `provider_version` không rỗng.
   - Mọi số trong text (bỏ marker `[n]`) phải có trong excerpt được trích.
   - `allowed_sources` chỉ gồm hit do BE gọi retrieve rồi BE tự kiểm.
   - Collection real có policy: citation chỉ được kèm theo `origin=real`.
3. Request trên đường real: `corpus_version = collection_fingerprint = phase6CorpusFingerprint`,
   `dataset_version = sourceRevision`. `phase6CollectionFingerprint` giữ nguyên byte-for-byte;
   các key mới chỉ thêm khi đọc corpus và có policy.
4. Kiểm lại sau provider: so collection fingerprint, nguồn của `context()` và corpus fingerprint.
   `context()` vẫn trả `()` cho collection real, nên Advisor không nhận passage.
5. Registry được đọc và hash lại ở mỗi lần đọc snapshot, không cache.
6. Đồng thời: giữ ADR-0004 (provider chạy ngoài transaction, lock khi commit). Test hai câu
   gửi đồng thời trên đường real: cả hai 201, các cặp user/assistant liền nhau.
7. `/chat/sources`: admission đầy đủ + `admit_passages`, chỉ trả passage đã admit.
8. Readiness:
   - provider unavailable → `not_ready [PROVIDER_UNAVAILABLE]`
   - thiếu runtime → `[RUNTIME_STORAGE_UNAVAILABLE]`
   - admission hoặc writer lỗi → `[CHAT_CONFIGURATION_UNAVAILABLE]`
   - có retrieve mà không có policy hoặc passage → `[CORPUS_POLICY_UNAVAILABLE]`
   - có retrieve và corpus → `ready/retrieval_only`
   - provider khác → `ready/provider`
   Schema mới riêng; không đổi `Citation`/`Answer`.
9. Test thêm:
   - collection real + provider không có retrieve → abstain;
   - answer real trên collection synthetic → 502 (test cũ giữ nguyên);
   - timeout trên đường real lưu `state=timeout`;
   - Advisor với provider extractive → `PROVIDER_UNAVAILABLE`.
10. Retrieval có deadline `chat_timeout_seconds` → `state=timeout`. Ghi trong spec: user là
    owner RAG (AI) và đã cho phép sửa FE và BE trong scope này (2026-11-14).

## Rủi ro
- Sửa BE upstream: cần báo người giữ BE trước khi merge.
- Provider chạy ngoài lock (ADR-0004) → hai câu gửi đồng thời cùng đọc một history; khác NASA
  (giữ lock cả lượt) nhưng đúng contract BE.
- Admission quét toàn DB mỗi request (đã biết, không đổi).
