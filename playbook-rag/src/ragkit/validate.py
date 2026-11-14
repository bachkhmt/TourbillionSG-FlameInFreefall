"""Validator: biến "AI không bịa" thành kiểm tra được. Câu nào không có trích dẫn hợp lệ bị loại."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from .text import fold

COVERAGE = ("none", "partial", "full")
_VERDICT = re.compile(
    r"\b(la|se|hoan toan|duoc coi la|co the coi la)\s+(khong\s+)?(an toan|on)\b|\bkhong an toan\b")
# Câu nói rõ là KHÔNG kết luận (ví dụ trích quy tắc của chính tài liệu) thì không phải phán quyết.
_DISCLAIM = re.compile(r"\bkhong\s+(bao gio\s+)?(dua ra\s+)?ket luan\b")


@dataclass
class Validated:
    ok: bool
    segments: list[dict] = field(default_factory=list)
    coverage: str = "none"
    missing: list[str] = field(default_factory=list)
    dropped: int = 0


def parse_json(raw: str) -> dict | None:
    raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    i, j = raw.find("{"), raw.rfind("}")
    if i < 0 or j <= i:
        return None
    try:
        obj = json.loads(raw[i : j + 1])
    except json.JSONDecodeError:
        return None
    return obj if isinstance(obj, dict) else None


def has_verdict(text: str) -> bool:
    f = fold(text)
    return _VERDICT.search(f) is not None and _DISCLAIM.search(f) is None


def validate_answer(obj: dict | None, allowed_ids: set[str]) -> Validated:
    if not obj or not isinstance(obj.get("segments"), list):
        return Validated(False)
    kept, dropped = [], 0
    for seg in obj["segments"]:
        text = seg.get("text") if isinstance(seg, dict) else None
        cites = [c for c in (seg.get("citations") or []) if c in allowed_ids] if text else []
        if not text or not cites or has_verdict(text):
            dropped += 1
            continue
        kept.append({"text": text.strip(), "citations": cites})
    cov = obj.get("coverage") if obj.get("coverage") in COVERAGE else "partial"
    missing = [m for m in (obj.get("missing") or []) if isinstance(m, str)]
    return Validated(bool(kept), kept, cov if kept else "none", missing, dropped)
