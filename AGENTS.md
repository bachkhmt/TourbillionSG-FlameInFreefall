# TourbillionSG — hướng dẫn cho agent

Trả lời bằng tiếng Việt; giữ code, identifiers và commands nguyên ngôn ngữ.

## Bố cục

| Thư mục | Vai trò | Quy tắc riêng |
| --- | --- | --- |
| `flameguard-ai-backend/` | BE FastAPI upstream, 21 bảng, migrations 0001→0003 | `flameguard-ai-backend/AGENTS.md` |
| `FlameInFreewall_Tourbillion/` | FE Next.js, TanStack Query + Axios | — |
| `integrations/nasa_data/` | Data adapter offline: build release NASA, xuất snapshot 21 bảng, registry `corpusPolicy` | Không gọi network, không ghi DB |
| `flameguard-ai-backend/app/integrations/rag/` | RAG extractive có citation (AI team), cắm vào BE qua `RagProvider` + `CHAT_PROVIDER=extractive` | ADR-0005, `docs/CHATBOT_FLOW.md` |
| `integration_tests/` | Test cho `integrations/` (retrieval không cần DB; HTTP cần PostgreSQL test) | Chạy từ root: `pytest` |

## Những điều dễ làm lệch dự án

- **Kiến trúc BE của repo này là chuẩn**; repo `NASA` chỉ để tham khảo. RAG cắm vào qua
  extension point có sẵn (`RagProvider`, `select_provider`, `chat_provider_factory`), không
  dùng `dependency_overrides`, không subclass `ChatService`. Thay đổi BE theo workflow của
  `flameguard-ai-backend/AGENTS.md` (spec + ADR), báo người giữ BE upstream trước khi merge.
- Chat chỉ trích nguyên văn chunk đã nhập từ nguồn CC0 có hash; không LLM, không
  provider trả phí. `review_status` luôn `unreviewed`. Không đưa kết luận safe/unsafe.
- Giữ nguyên giá trị mâu thuẫn và đơn vị gốc (ví dụ FLEX-007 D0: 1.87 mm và 1.82 mm).
  Null không phải 0. Điểm BM25 là độ liên quan, không phải xác suất rủi ro.
- PSI id, UUID nội bộ và slug là ba định danh khác nhau.
- FE không dùng engine giả lập (`src/lib/ragKnowledgeEngine.ts`…) làm fallback cho chat.
- DB test chỉ dùng container riêng `tourbillion-test-pg` (127.0.0.1:55435). Không đụng
  các container khác trên máy. Settings có mật khẩu nằm trong `.demo/` (bị ignore).

## Kiểm tra

```bash
flameguard-ai-backend/.venv/bin/python -m pytest -q          # integration_tests
cd flameguard-ai-backend && .venv/bin/python -m pytest -q    # BE upstream
cd FlameInFreewall_Tourbillion && npm test && npx tsc --noEmit
```

Test HTTP/PG cần `PHASE4_ADMIN_URL` (và BE suite cần thêm `TEST_DATABASE_URL`) trỏ tới
container test; thiếu thì skip. Không gọi một lần skip là pass. Dùng helper:

```bash
python3 scripts/test_db.py create      # một lần, tạo tourbillion-test-pg
python3 scripts/test_db.py run -- flameguard-ai-backend/.venv/bin/python -m pytest -q
```
