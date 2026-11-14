from fastapi.testclient import TestClient

from ragkit import evaluate
from ragkit.api import create_app
from ragkit.cache import RateLimiter


def test_api_contract(pipe):
    c = TestClient(create_app(pipe, RateLimiter(100)))
    assert c.get("/api/health").json()["ok"]
    r = c.post("/api/ask", json={"question": "FLEX dập lửa bằng cách nào?", "mode": "student"})
    d = r.json()
    assert r.status_code == 200 and set(d) == {"answer", "chunks", "meta"}
    assert set(d["answer"]) == {"segments", "coverage", "missing"}


def test_api_validation_and_rate_limit(pipe):
    c = TestClient(create_app(pipe, RateLimiter(1)))
    assert c.post("/api/ask", json={"question": "x"}).status_code == 422
    assert c.post("/api/ask", json={"question": "RRF là gì?"}).status_code == 200
    assert c.post("/api/ask", json={"question": "RRF là gì?"}).status_code == 429


def test_local_source_can_be_opened_without_exposing_other_files(pipe):
    c = TestClient(create_app(pipe))
    response = c.get("/sources/Flame_in_Freefall_Playbook.html")
    assert response.status_code == 200 and "Flame in Freefall" in response.text
    asset = c.get("/assets/mermaid-11.16.1.min.js")
    assert asset.status_code == 200 and "javascript" in asset.headers["content-type"]
    assert c.get("/sources/README.md").status_code == 404
    assert c.get("/sources/..%5CREADME.md").status_code == 404


def test_eval_thresholds_from_playbook():
    res = evaluate.run()
    assert res["recall@5"] >= 0.85 and res["refusal_accuracy"] >= 0.90
