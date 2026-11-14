"""Truy xuất lai: mở rộng alias -> BM25 + vector -> RRF -> tăng điểm theo loại chunk."""
from __future__ import annotations

import re
from dataclasses import dataclass

from .bm25 import BM25
from .text import analyze, fold
from .vector import make_index


@dataclass
class Hit:
    chunk: dict
    score: float
    bm25_rank: int | None = None
    vec_rank: int | None = None


def index_text(c: dict) -> str:
    return f"{c.get('contextual', '')} {c['text']}"


class Retriever:
    def __init__(self, chunks: list[dict], aliases: dict[str, list[str]] | None = None,
                 vector: str | None = "hash"):
        self.chunks = chunks
        self.aliases = {fold(k): v for k, v in (aliases or {}).items()}
        self.bm25 = BM25([analyze(index_text(c)) for c in chunks])
        self.vec = make_index([index_text(c) for c in chunks], vector) if vector else None

    def expand(self, query: str) -> str:
        f = fold(query)
        extra = [" ".join(v) for k, v in self.aliases.items() if re.search(rf"\b{re.escape(k)}\b", f)]
        return query + " " + " ".join(extra) if extra else query

    def search(self, query: str, k: int = 6, boost: dict[str, float] | None = None,
               pool: int = 20) -> list[Hit]:
        q = self.expand(query)
        b = {i: r for r, (i, _) in enumerate(self.bm25.search(analyze(q), pool))}
        v = {i: r for r, (i, _) in enumerate(self.vec.search(q, pool))} if self.vec else {}
        hits = []
        for i in set(b) | set(v):
            s = sum(1 / (60 + r) for r in (b.get(i), v.get(i)) if r is not None)  # RRF
            s *= (boost or {}).get(self.chunks[i]["type"], 1.0)
            hits.append(Hit(self.chunks[i], s, b.get(i), v.get(i)))
        return sorted(hits, key=lambda h: -h.score)[:k]
