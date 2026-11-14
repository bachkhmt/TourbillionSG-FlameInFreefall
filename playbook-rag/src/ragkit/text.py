"""Chuẩn hóa và tách từ tiếng Việt (bỏ dấu, bigram) dùng chung cho BM25 và vector."""
from __future__ import annotations

import itertools
import re
import unicodedata

STOP = {
    "la", "va", "cua", "cho", "voi", "o", "trong", "mot", "nhung", "cac", "nay", "do", "thi", "se",
    "co", "duoc", "khi", "nhu", "tu", "den", "bang", "de", "ve", "ra", "vao", "the", "nao", "gi",
    "sao", "hay", "hoac", "neu", "ma", "da", "dang", "cung", "rat", "hon", "nhat",
    "of", "and", "is", "a", "to", "in",
    "bao", "lau", "nhieu", "dau",  # từ nghi vấn chung chung: "bao lâu", "bao nhiêu", "ở đâu"
}
_TOK = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


def fold(s: str) -> str:
    """Bỏ dấu, đ -> d, ₂ -> 2, chữ thường. 'Mặt Trăng' -> 'mat trang'."""
    s = s.replace("đ", "d").replace("Đ", "D")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()


def base_tokens(text: str) -> list[str]:
    return _TOK.findall(fold(text))


def analyze(text: str) -> list[str]:
    """Unigram + phần của từ có gạch nối + bigram liền kề (bắt cụm như 'trong luc')."""
    base = [t for t in base_tokens(text) if t not in STOP]
    out: list[str] = []
    for t in base:
        out.append(t)
        if "-" in t:
            out.extend(p for p in t.split("-") if len(p) > 1 and p not in STOP)
    out.extend(f"{a}_{b}" for a, b in itertools.pairwise(base))
    return out


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", fold(s)).strip("-") or "x"
