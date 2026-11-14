"""Luồng xử lý một câu hỏi: guard -> truy xuất -> (LLM + validator | trích câu) -> coverage."""
from __future__ import annotations

import json
import time

from . import guard
from . import llm as llm_mod
from .cache import TTLCache, cache_key
from .config import Settings
from .ingest import load_or_build
from .retrieve import Hit, Retriever
from .text import STOP, base_tokens, fold, split_sentences
from .validate import COVERAGE, parse_json, validate_answer

OFF_TOPIC_NOTE = ("Câu hỏi này nằm ngoài phạm vi kho tài liệu hiện có nên tôi không trả lời. "
                  "Bạn có thể hỏi về thí nghiệm cháy, điều kiện thử, kiến trúc hay kế hoạch trong playbook.")
NO_EVIDENCE_NOTE = "Kho tài liệu chưa có đủ bằng chứng để trả lời câu này. Dưới đây là các đoạn gần nhất."
VERDICT_MISSING = "Kết luận an toàn hoặc không an toàn nằm ngoài phạm vi công cụ"
GAP_MISSING = "Dữ liệu cháy đo ở trọng lực Mặt Trăng (0,16g) hoặc Sao Hỏa (0,38g)"


def _sys(text: str, cites: list[str] | None = None) -> dict:
    return {"text": text, "citations": cites or [], "system": True}


class RagPipeline:
    def __init__(self, chunks: list[dict], aliases: dict | None = None, scenarios: dict | None = None,
                 llm: llm_mod.LLM | None = None, embedder: str | None = "hash", top_k: int = 6,
                 timeout_s: float = 15.0, cache: TTLCache | None = None):
        self.chunks = chunks
        self.by_id = {c["id"]: c for c in chunks}
        self.scenarios = scenarios or {}
        self.llm, self.top_k, self.timeout_s = llm, top_k, timeout_s
        self.cache = cache or TTLCache()
        self.retriever = Retriever(chunks, aliases, embedder or None)
        self.extra_terms = [c["heading"] for c in chunks if c["type"] == "glossary"]

    @classmethod
    def from_settings(cls, s: Settings | None = None, llm: llm_mod.LLM | None = None) -> RagPipeline:
        s = s or Settings.from_env()

        def load(name: str) -> dict:
            f = s.data_dir / name
            return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}

        return cls(load_or_build(s), load("aliases.json"), load("scenarios.json"),
                   llm if llm is not None else llm_mod.from_env(s), s.embedder, s.top_k, s.timeout_s)

    # ---------- public ----------
    def answer(self, question: str, scenario_id: str | None = None, mode: str = "engineer") -> dict:
        t0 = time.perf_counter()
        key = cache_key(fold(question).strip(), scenario_id or "", mode)
        cached = self.cache.get(key)
        if cached:
            return {**cached, "meta": {**cached["meta"], "mode": "cached", "latencyMs": self._ms(t0)}}
        resp = self._answer(question, scenario_id, mode, t0)
        if resp["meta"]["mode"] == "full":
            self.cache.set(key, resp)
        return resp

    # ---------- internals ----------
    def _answer(self, question: str, scenario_id: str | None, mode: str, t0: float) -> dict:
        intent = guard.classify(question, self.extra_terms)
        if intent.off_topic:
            return self._pack([_sys(OFF_TOPIC_NOTE)], "none", [], [], "refusal", t0, "off_topic")

        hint = (self.scenarios.get(scenario_id or "") or {}).get("hint", "")
        boost = {"gap_note": 1.5} if (intent.gap or intent.verdict) else None
        hits = self.retriever.search(f"{question} {hint}".strip(), self.top_k, boost)
        notes = {c["applies"]: c for c in self.chunks if c["type"] == "gap_note" and "applies" in c}

        segments: list[dict] = []
        if intent.verdict and "safety_verdict" in notes:
            n = notes["safety_verdict"]
            segments.append(_sys("Công cụ này không kết luận 'an toàn' hay 'không an toàn'. "
                                 "Chỉ trình bày bằng chứng đã có và điều kiện đã thử.", [n["id"]]))

        if intent.gap and "moon_mars_gravity" in notes:
            n = notes["moon_mars_gravity"]
            segments += [_sys(s, [n["id"]]) for s in split_sentences(n["text"])]
            shown = [n] + [h.chunk for h in hits if h.chunk["id"] != n["id"]][:3]
            if intent.verdict and "safety_verdict" in notes:
                shown.insert(0, notes["safety_verdict"])
            missing = [GAP_MISSING] + ([VERDICT_MISSING] if intent.verdict else [])
            return self._pack(segments, "none", missing, shown, "refusal", t0, "no_data_gap")

        ctx = [h.chunk for h in hits]
        if intent.verdict and "safety_verdict" in notes and notes["safety_verdict"] not in ctx:
            ctx.insert(0, notes["safety_verdict"])
        heur = self._coverage(question, hits)

        if heur == "none":
            return self._pack(segments + [_sys(NO_EVIDENCE_NOTE)], "none", [], ctx[:3], "refusal",
                              t0, "insufficient_evidence")

        res = self._try_llm(question, ctx, mode, scenario_id, t0)
        if res:
            body, missing, coverage, out_mode = res.segments, res.missing, _min_cov(heur, res.coverage), "full"
        else:
            body, missing, coverage, out_mode = self._extractive(question, hits), [], heur, "retrieval_only"
        if intent.verdict:
            coverage = _min_cov(coverage, "partial")
            missing = missing + [VERDICT_MISSING]
        return self._pack(segments + body, coverage, missing, ctx, out_mode, t0,
                          "safety_verdict" if intent.verdict else None)

    def _try_llm(self, question, chunks, mode, scenario_id, t0):
        if not self.llm:
            return None
        allowed = {c["id"] for c in chunks}
        prompt = llm_mod.build_prompt(question, chunks, mode, scenario_id)
        for _ in range(2):  # thử lại đúng 1 lần
            remaining = self.timeout_s - (time.perf_counter() - t0)
            if remaining <= 1:
                return None
            try:
                raw = self.llm.complete(llm_mod.SYSTEM, prompt, remaining)
            except Exception:  # noqa: BLE001  # timeout, mạng, HTTP lỗi -> lùi về retrieval-only
                return None
            res = validate_answer(parse_json(raw), allowed)
            if res.ok:
                return res
        return None

    @staticmethod
    def _extractive(question: str, hits: list[Hit], n: int = 3) -> list[dict]:
        q = {t for t in base_tokens(question) if t not in STOP and len(t) > 1}
        segs, seen = [], set()
        for h in hits[:n]:
            sents = split_sentences(h.chunk["text"]) or [h.chunk["text"]]
            best = max(sents, key=lambda s: len(q & set(base_tokens(s))))
            best = best if len(best) <= 320 else best[:317] + "…"
            if best not in seen:
                seen.add(best)
                segs.append({"text": best, "citations": [h.chunk["id"]]})
        return segs

    @staticmethod
    def _coverage(question: str, hits: list[Hit]) -> str:
        q = {t for t in base_tokens(question) if t not in STOP and len(t) > 1}
        if not q or not hits:
            return "none"
        pool: set[str] = set()
        for h in hits[:3]:
            pool |= set(base_tokens(h.chunk["text"] + " " + h.chunk.get("contextual", "")))
        frac = len(q & pool) / len(q)
        return "full" if frac >= 0.7 else "partial" if frac >= 0.4 else "none"

    @staticmethod
    def _ms(t0: float) -> int:
        return round((time.perf_counter() - t0) * 1000)

    def _pack(self, segments, coverage, missing, chunks, mode, t0, reason=None) -> dict:
        seen, out = set(), []
        for c in chunks:
            if c["id"] not in seen:
                seen.add(c["id"])
                out.append({k: c.get(k) for k in ("id", "type", "section", "heading", "text", "sourceRef", "status")})
        return {"answer": {"segments": segments, "coverage": coverage, "missing": missing},
                "chunks": out, "meta": {"mode": mode, "reason": reason, "latencyMs": self._ms(t0)}}


def _min_cov(a: str, b: str) -> str:
    return a if COVERAGE.index(a) <= COVERAGE.index(b) else b
