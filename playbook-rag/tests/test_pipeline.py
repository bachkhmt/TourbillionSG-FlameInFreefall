import json

from ragkit.cache import RateLimiter
from ragkit.pipeline import RagPipeline


def ids(r):
    return [c["id"] for c in r["chunks"]]


def test_offline_answer_is_cited(pipe):
    r = pipe.answer("Which experiment has an oxygen flow up to 85%?")
    assert r["meta"]["mode"] == "retrieval_only"
    assert r["answer"]["segments"] and all(s["citations"] for s in r["answer"]["segments"])
    allowed = set(ids(r))
    assert all(c in allowed for s in r["answer"]["segments"] for c in s["citations"])


def test_moon_gravity_is_refused_without_numbers(pipe):
    r = pipe.answer("Is there combustion data in Moon gravity?")
    assert (r["meta"]["mode"], r["meta"]["reason"], r["answer"]["coverage"]) == ("refusal", "no_data_gap", "none")
    assert "gap-moon-mars-gravity" in ids(r) and r["answer"]["missing"]


def test_verdict_never_full_and_never_concludes(pipe):
    r = pipe.answer("Is this fabric used in a rover with 30% O₂ safe?")
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
    q = "What does CIR stand for?"
    probe = make(None).answer(q)
    cid = probe["chunks"][0]["id"]
    good = json.dumps({"segments": [{"text": "CIR is a combustion experiment rack on the ISS.", "citations": [cid]}],
                       "coverage": "full", "missing": []})
    p = make(FakeLLM([good]))
    r1 = p.answer(q)
    assert r1["meta"]["mode"] == "full"
    r2 = p.answer(q)
    assert r2["meta"]["mode"] == "cached" and p.llm.calls == 1


def test_llm_bad_citations_retry_once_then_retrieval_only():
    bad = json.dumps({"segments": [{"text": "x", "citations": ["non-existent"]}], "coverage": "full"})
    p = make(FakeLLM([bad, bad]))
    r = p.answer("What does CIR stand for?")
    assert r["meta"]["mode"] == "retrieval_only" and p.llm.calls == 2


def test_llm_exception_falls_back():
    p = make(FakeLLM([TimeoutError("slow")]))
    assert p.answer("What is RRF?")["meta"]["mode"] == "retrieval_only"


def test_rate_limiter_window():
    rl = RateLimiter(limit=2, window_s=60)
    assert rl.allow("a", 0) and rl.allow("a", 1) and not rl.allow("a", 2)
    assert rl.allow("b", 2) and rl.allow("a", 100)
