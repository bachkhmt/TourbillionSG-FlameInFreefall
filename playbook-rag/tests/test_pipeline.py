import json

from ragkit.cache import RateLimiter
from ragkit.pipeline import RagPipeline


def ids(r):
    return [c["id"] for c in r["chunks"]]


def test_offline_answer_is_cited(pipe):
    r = pipe.answer("Thí nghiệm nào có luồng oxy cao tới 85%?")
    assert r["meta"]["mode"] == "retrieval_only"
    assert r["answer"]["segments"] and all(s["citations"] for s in r["answer"]["segments"])
    allowed = set(ids(r))
    assert all(c in allowed for s in r["answer"]["segments"] for c in s["citations"])


def test_moon_gravity_is_refused_without_numbers(pipe):
    r = pipe.answer("Có dữ liệu cháy ở trọng lực Mặt Trăng không?")
    assert (r["meta"]["mode"], r["meta"]["reason"], r["answer"]["coverage"]) == ("refusal", "no_data_gap", "none")
    assert "gap-moon-mars-gravity" in ids(r) and r["answer"]["missing"]


def test_verdict_never_full_and_never_concludes(pipe):
    r = pipe.answer("Vải này dùng trong rover 30% O₂ có an toàn không?")
    assert r["answer"]["coverage"] != "full"
    assert r["answer"]["segments"][0].get("system")


class FakeLLM:
    def __init__(self, outputs):
        self.outputs, self.calls = list(outputs), 0

    def complete(self, system, user, timeout):
        self.calls += 1
        out = self.outputs.pop(0)
        if isinstance(out, Exception):
            raise out
        return out


def make(llm):
    base = RagPipeline.from_settings(llm=None)
    return RagPipeline(base.chunks, llm=llm, embedder="hash")


def test_llm_valid_answer_full_then_cached():
    q = "CIR là viết tắt của gì?"
    probe = make(None).answer(q)
    cid = probe["chunks"][0]["id"]
    good = json.dumps({"segments": [{"text": "CIR là tủ thí nghiệm cháy trên ISS.", "citations": [cid]}],
                       "coverage": "full", "missing": []})
    p = make(FakeLLM([good]))
    r1 = p.answer(q)
    assert r1["meta"]["mode"] == "full"
    r2 = p.answer(q)
    assert r2["meta"]["mode"] == "cached" and p.llm.calls == 1


def test_llm_bad_citations_retry_once_then_retrieval_only():
    bad = json.dumps({"segments": [{"text": "x", "citations": ["khong-ton-tai"]}], "coverage": "full"})
    p = make(FakeLLM([bad, bad]))
    r = p.answer("CIR là viết tắt của gì?")
    assert r["meta"]["mode"] == "retrieval_only" and p.llm.calls == 2


def test_llm_exception_falls_back():
    p = make(FakeLLM([TimeoutError("chậm")]))
    assert p.answer("RRF là gì?")["meta"]["mode"] == "retrieval_only"


def test_rate_limiter_window():
    rl = RateLimiter(limit=2, window_s=60)
    assert rl.allow("a", 0) and rl.allow("a", 1) and not rl.allow("a", 2)
    assert rl.allow("b", 2) and rl.allow("a", 100)
