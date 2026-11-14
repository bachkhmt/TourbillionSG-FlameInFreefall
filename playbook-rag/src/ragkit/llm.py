"""LLM tùy chọn. Không có khóa API thì pipeline tự lùi về chế độ retrieval-only."""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Protocol

from .config import Settings


class LLM(Protocol):
    def complete(self, system: str, user: str, timeout: float) -> str: ...


class AnthropicLLM:
    URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str, max_tokens: int = 900):
        self.api_key, self.model, self.max_tokens = api_key, model, max_tokens

    def complete(self, system: str, user: str, timeout: float) -> str:
        body = json.dumps({
            "model": self.model, "max_tokens": self.max_tokens, "temperature": 0,
            "system": system, "messages": [{"role": "user", "content": user}],
        }).encode()
        req = urllib.request.Request(self.URL, data=body, headers={
            "content-type": "application/json", "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
        return "".join(b.get("text", "") for b in data.get("content", []))


def from_env(settings: Settings | None = None) -> LLM | None:
    s = settings or Settings.from_env()
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key or os.getenv("RAG_OFFLINE") == "1":
        return None
    return AnthropicLLM(key, s.llm_model)


SYSTEM = """Bạn là trợ lý hỏi đáp trên một kho tài liệu nhỏ. Quy tắc bắt buộc:
1. Chỉ dùng thông tin trong các CHUNK được cấp. Không dùng kiến thức ngoài.
2. Mỗi câu trong câu trả lời phải kèm ít nhất một id chunk hỗ trợ nó.
3. Không bao giờ kết luận một vật liệu hay điều kiện là "an toàn" hoặc "không an toàn".
4. Thiếu bằng chứng thì đặt coverage là "none" hoặc "partial" và nêu phần thiếu trong "missing".
5. Không nội suy số liệu cho điều kiện mà chunk không đo (ví dụ trọng lực Mặt Trăng).
6. Chỉ trả JSON đúng schema, không thêm chữ nào ngoài JSON:
{"segments":[{"text":"...","citations":["chunk_id"]}],"coverage":"full|partial|none","missing":["..."]}"""


def build_prompt(question: str, chunks: list[dict], mode: str, scenario: str | None) -> str:
    style = ("Giải thích đơn giản, mở nghĩa các từ viết tắt." if mode == "student"
             else "Ngắn gọn, đúng thuật ngữ kỹ thuật.")
    ctx = "\n\n".join(f"[{c['id']}] {c['text']}" for c in chunks)
    sc = f"Kịch bản người dùng chọn: {scenario}\n" if scenario else ""
    return f"{sc}Phong cách: {style}\n\nCHUNK:\n{ctx}\n\nCÂU HỎI: {question}"
