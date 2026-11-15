"""Optional vector index.

HashIndex: character n-gram hashed embedding (no model, no network required). It captures
orthographic/stem similarity, NOT true semantics. For true semantics, use
STIndex (sentence-transformers) via RAG_EMBEDDER=st:<model-name>.
"""
from __future__ import annotations

import math
import re
import zlib
from collections import Counter

from .text import fold


class HashIndex:
    def __init__(self, texts: list[str], dim: int = 1024, ngrams: tuple[int, ...] = (3, 4, 5)):
        self.dim, self.ngrams = dim, ngrams
        self.vecs = [self._embed(t) for t in texts]

    def _embed(self, text: str) -> dict[int, float]:
        counts: Counter[int] = Counter()
        for word in re.findall(r"[a-z0-9]+", fold(text)):
            w = f"<{word}>"
            for n in self.ngrams:
                for i in range(len(w) - n + 1):
                    h = zlib.crc32(w[i : i + n].encode())
                    counts[(h % self.dim) * (1 if (h >> 16) & 1 else -1)] += 1
        vec = {i: math.log1p(abs(c)) * (1 if c > 0 else -1) for i, c in counts.items() if c}
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
        return {i: v / norm for i, v in vec.items()}

    def search(self, query: str, k: int = 10) -> list[tuple[int, float]]:
        q = self._embed(query)
        out = []
        for idx, v in enumerate(self.vecs):
            small, big = (q, v) if len(q) < len(v) else (v, q)
            s = sum(x * big.get(i, 0.0) for i, x in small.items())
            if s > 0:
                out.append((idx, s))
        return sorted(out, key=lambda x: -x[1])[:k]


class STIndex:  # optional: pip install sentence-transformers
    def __init__(self, texts: list[str], model: str):
        from sentence_transformers import SentenceTransformer  # type: ignore

        self.model = SentenceTransformer(model)
        self.mat = self.model.encode(texts, normalize_embeddings=True)

    def search(self, query: str, k: int = 10) -> list[tuple[int, float]]:
        q = self.model.encode([query], normalize_embeddings=True)[0]
        sims = self.mat @ q
        order = sims.argsort()[::-1][:k]
        return [(int(i), float(sims[i])) for i in order]


def make_index(texts: list[str], spec: str):
    if spec.startswith("st:"):
        return STIndex(texts, spec[3:])
    return HashIndex(texts)
