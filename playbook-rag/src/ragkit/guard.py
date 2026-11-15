"""Cổng phạm vi: ngoài chủ đề, đòi kết luận an toàn, hay hỏi vùng chưa có dữ liệu."""
from __future__ import annotations

import re
from dataclasses import dataclass

from .text import fold

OFF_TOPIC = [r"\bten lua\b", r"\bthoi tiet\b", r"\bco phieu\b", r"\bbong da\b", r"\bnau an\b"]
VERDICT = (r"\b(co an toan|thi an toan|la an toan|se an toan|khong an toan|an toan khong|"
           r"an toan tren|an toan o|co on khong|on khong)\b")
MOON_MARS = r"\b(mat trang|sao hoa|moon|mars|luci|fm2)\b"
GRAV_DATA = r"\b(trong luc|gravity|0,16|0\.16|0,38|0\.38|1g|du lieu|thi nghiem)\b"
DOMAIN = [
    "lua", "chay", "dap", "khoi", "oxy", "o2", "ap suat", "psi", "trong luc", "thi nghiem",
    "nasa", "vat lieu", "nhien lieu", "iss", "rover", "moon", "mat trang", "sao hoa", "mars",
    "saffire", "bass", "same", "daft", "flex", "cfi", "acme", "cir", "msg", "mdca", "slice",
    "spice", "luci", "fm2", "e-field", "hackathon", "space apps", "playbook", "rag", "chunk",
    "bm25", "vector", "embedding", "rrf", "reranker", "jev", "coverage", "citation", "trich dan",
    "validator", "retrieval", "api", "cache", "timeout", "kien truc", "ke hoach", "investigation",
    "evidence map", "mission brief", "claim checker", "scorecard", "ranking", "xep hang",
    "recall", "tu choi", "bo do", "can cu", "ngay", "gio", "du lieu", "nguon", "link",
]


@dataclass
class Intent:
    off_topic: bool = False
    verdict: bool = False
    gap: bool = False


def _has(f: str, term: str) -> bool:
    return re.search(rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])", f) is not None


def classify(question: str, extra_terms: list[str] | None = None) -> Intent:
    f = fold(question)
    if any(re.search(p, f) for p in OFF_TOPIC):
        return Intent(off_topic=True)
    if not any(_has(f, t) for t in DOMAIN + [fold(t) for t in (extra_terms or [])]):
        return Intent(off_topic=True)
    verdict = re.search(VERDICT, f) is not None
    gap = bool(re.search(MOON_MARS, f) and re.search(GRAV_DATA, f))
    return Intent(verdict=verdict, gap=gap)
