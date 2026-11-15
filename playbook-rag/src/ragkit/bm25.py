"""BM25 Okapi thuần Python, không phụ thuộc thư viện."""
from __future__ import annotations

import math
from collections import Counter, defaultdict


class BM25:
    def __init__(self, docs: list[list[str]], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.n = len(docs)
        self.dl = [len(d) for d in docs]
        self.avgdl = (sum(self.dl) / self.n) if self.n else 0.0
        self.post: dict[str, list[tuple[int, int]]] = defaultdict(list)
        for i, d in enumerate(docs):
            for term, tf in Counter(d).items():
                self.post[term].append((i, tf))
        self.idf = {
            t: math.log(1 + (self.n - len(p) + 0.5) / (len(p) + 0.5)) for t, p in self.post.items()
        }

    def search(self, query: list[str], k: int = 10) -> list[tuple[int, float]]:
        scores: dict[int, float] = defaultdict(float)
        for term in set(query):
            idf = self.idf.get(term)
            if idf is None:
                continue
            for i, tf in self.post[term]:
                norm = self.k1 * (1 - self.b + self.b * self.dl[i] / (self.avgdl or 1))
                scores[i] += idf * tf * (self.k1 + 1) / (tf + norm)
        return sorted(scores.items(), key=lambda x: -x[1])[:k]
