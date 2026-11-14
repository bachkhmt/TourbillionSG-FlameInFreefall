# TourbillionSG — hướng dẫn cho agent

Trả lời bằng tiếng Việt; giữ code, identifiers và commands nguyên ngôn ngữ.

## Bố cục

| Thư mục | Vai trò | Quy tắc riêng |
| --- | --- | --- |
| `flameguard-ai-backend/` | BE FastAPI upstream, 21 bảng, migrations 0001→0003 | `flameguard-ai-backend/AGENTS.md` |
| `FlameInFreewall_Tourbillion/` | FE Next.js, TanStack Query + Axios | — |
| `integrations/nasa_data/` | Data adapter offline: build release NASA, xuất snapshot 21 bảng | Không gọi network, không ghi DB |
| `integrations/nasa_chat/` | RAG extractive có citation, cắm vào BE qua app factory | `docs/CHATBOT_FLOW.md` |
| `integration_tests/` | Test cho `integrations/` (retrieval không cần DB; HTTP cần PostgreSQL test) | Chạy từ root: `pytest` |

## Những điều dễ làm lệch dự án

- **Không sửa BE để chiều phần mở rộng.** RAG/data nằm ở `integrations/`, nối vào BE
  bằng `integrations.nasa_chat.app:create_app` và FastAPI `dependency_overrides`.
  Không monkeypatch validator upstream, không đổi nhãn `real` thành `synthetic` để vượt gate.
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
container test; thiếu thì skip. Không gọi một lần skip là pass.
