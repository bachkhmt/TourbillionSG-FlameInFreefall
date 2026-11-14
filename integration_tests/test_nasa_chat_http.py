import asyncio
import json
import os
from urllib.parse import urlencode
from uuid import uuid4

import pytest
from app.repositories.chat import ChatRepository
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from integration_tests.chat_target import prepare_target, settings_for
from integrations.nasa_chat.app import create_app
from integrations.nasa_chat.provider import ExtractiveProvider


@pytest.fixture(scope="module")
def target():
    raw = os.environ.get("PHASE4_ADMIN_URL")
    if not raw:
        pytest.skip("Approved isolated PostgreSQL target required")
    return asyncio.run(prepare_target(raw))


@pytest.fixture
async def client(target):
    application = create_app(settings_for(target))
    async with application.router.lifespan_context(application):
        async with AsyncClient(
            transport=ASGITransport(app=application), base_url="http://test"
        ) as client:
            yield client, application


async def new_session(client):
    response = await client.post("/api/v1/chat/sessions", json={})
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def test_real_answer_history_source_binding_and_scientific_regression(client):
    client, _app = client
    readiness = await client.get("/api/v1/chat/readiness")
    assert readiness.headers["cache-control"] == "no-store"
    ready = readiness.json()
    assert ready["state"] == "ready" and ready["mode"] == "retrieval_only"
    assert ready["providerVersion"] == "nasa-extractive-v2"
    identity = await new_session(client)
    response = await client.post(
        f"/api/v1/chat/sessions/{identity}/messages",
        json={"question": "FLEX-007 D0 đường kính mâu thuẫn?"},
    )
    assert response.status_code == 201, response.text
    answer = response.json()["assistant"]["answer"]
    assert (
        answer["state"] == "answered"
        and answer["origin"] == "real"
        and answer["review_status"] == "unreviewed"
    )
    assert "1.87 mm [1]" in answer["text"] and "1.82 mm [2]" in answer["text"]
    assert answer["provider_version"] == ready["providerVersion"]
    assert len({c["source_document_id"] for c in answer["citations"]}) >= 2
    for citation in answer["citations"]:
        source = await client.get(
            f"/api/v1/chat/sources/{citation['source_document_id']}?"
            + urlencode(
                {
                    "locator": citation["source_locator"],
                    "corpus_version": answer["corpus_version"],
                }
            )
        )
        assert source.status_code == 200 and source.json()["sourceUrl"].startswith(
            "https://psi.nasa.gov/"
        )
        assert source.headers["cache-control"] == "no-store"
    history = (await client.get(f"/api/v1/chat/sessions/{identity}/messages")).json()
    assert [m["role"] for m in history["items"]] == ["user", "assistant"]
    assert history["items"][1]["answer"] == answer
    follow = await client.post(
        f"/api/v1/chat/sessions/{identity}/messages",
        json={"question": "còn áp suất thì sao?"},
    )
    assert follow.status_code == 201 and follow.json()["assistant"]["answer"]["citations"]
    mars = await client.post(
        f"/api/v1/chat/sessions/{identity}/messages",
        json={"question": "Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?"},
    )
    assert mars.status_code == 201
    gap = mars.json()["assistant"]["answer"]
    assert gap["state"] == "abstained" and not gap["citations"]
    summary = (await client.get("/api/v1/dashboard/summary")).json()
    assert (
        summary["investigationCount"],
        summary["runCount"],
        summary["claimCount"],
    ) == (
        18,
        910,
        0,
    )
    assert summary["context"]["reviewState"] == "unreviewed"
    advisor = await client.post(
        "/api/v1/advisor/assessments", json={"scenario": {}, "pages": {"limit": 20}}
    )
    assert advisor.status_code == 200, advisor.text
    assert all(
        a["state"] in {"unavailable", "abstained"} for a in advisor.json()["pillars"].values()
    )


async def test_provider_cannot_invent_citations_or_partial_pairs(client):
    client, app = client
    identity = await new_session(client)

    class Forged(ExtractiveProvider):
        async def answer(self, request):
            answer = await super().answer(request)
            return answer.model_copy(
                update={
                    "citations": (
                        answer.citations[0].model_copy(update={"source_document_id": uuid4()}),
                    )
                }
            )

    app.state.nasa_chat_provider_factory = Forged
    response = await client.post(
        f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"}
    )
    assert response.status_code == 502
    assert (await client.get(f"/api/v1/chat/sessions/{identity}/messages")).json()["items"] == []


async def test_policy_change_during_provider_rejects_and_rolls_back(client, target):
    client, app = client
    identity = await new_session(client)
    registry = target["collection"].parent / "nasa-chat-registry.json"
    before = registry.read_bytes()

    class Drift(ExtractiveProvider):
        async def answer(self, request):
            registry.write_bytes(before + b" ")
            return await super().answer(request)

    app.state.nasa_chat_provider_factory = Drift
    try:
        response = await client.post(
            f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"}
        )
        assert response.status_code == 409, response.text
        advisor = await client.post("/api/v1/advisor/assessments", json={"scenario": {}})
        assert advisor.status_code == 200, advisor.text
        assert all(a["state"] == "unavailable" for a in advisor.json()["pillars"].values())
    finally:
        registry.write_bytes(before)
    assert (await client.get(f"/api/v1/chat/sessions/{identity}/messages")).json()["items"] == []


async def test_full_turn_lock_includes_previous_committed_turn(client, monkeypatch):
    client, app = client
    identity = await new_session(client)
    entered = asyncio.Event()
    release = asyncio.Event()
    second_waiting = asyncio.Event()
    seen = []
    lock = ChatRepository.lock
    attempts = 0

    async def observed_lock(repo, identity):
        nonlocal attempts
        attempts += 1
        if attempts == 2:
            second_waiting.set()
        await lock(repo, identity)

    monkeypatch.setattr(ChatRepository, "lock", observed_lock)

    class Delayed(ExtractiveProvider):
        async def answer(self, request):
            seen.append(request)
            if len(seen) == 1:
                entered.set()
                await release.wait()
            return await super().answer(request)

    app.state.nasa_chat_provider_factory = Delayed
    first = asyncio.create_task(
        client.post(f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"})
    )
    await asyncio.wait_for(entered.wait(), 10)
    second = asyncio.create_task(
        client.post(
            f"/api/v1/chat/sessions/{identity}/messages",
            json={"question": "còn áp suất thì sao?"},
        )
    )
    await asyncio.wait_for(second_waiting.wait(), 10)
    assert len(seen) == 1
    release.set()
    results = await asyncio.gather(first, second)
    assert [r.status_code for r in results] == [201, 201]
    assert any(m.role == "user" and m.text == "FLEX-007" for m in seen[1].history)


async def test_missing_runtime_and_unknown_source_are_explicit(target):
    app = create_app(settings_for(target).model_copy(update={"runtime_database_url": None}))
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            assert (await client.get("/api/v1/chat/readiness")).json()["state"] == "not_ready"
            assert (await client.post("/api/v1/chat/sessions", json={})).status_code == 503


async def test_writer_cannot_change_science(target):
    from sqlalchemy import text
    from sqlalchemy.exc import DBAPIError

    engine = create_async_engine(target["writer_url"], hide_parameters=True)
    try:
        with pytest.raises(DBAPIError):
            async with engine.begin() as connection:
                await connection.execute(text("UPDATE investigation SET title=title"))
    finally:
        await engine.dispose()


async def test_cancelled_turn_rolls_back_and_releases_lock(client):
    client, app = client
    identity = await new_session(client)
    entered = asyncio.Event()

    class Blocked(ExtractiveProvider):
        async def answer(self, request):
            entered.set()
            await asyncio.sleep(20)

    app.state.nasa_chat_provider_factory = Blocked
    task = asyncio.create_task(
        client.post(f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"})
    )
    await asyncio.wait_for(entered.wait(), 10)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    del app.state.nasa_chat_provider_factory
    assert (await client.get(f"/api/v1/chat/sessions/{identity}/messages")).json()["items"] == []
    assert (
        await client.post(
            f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"}
        )
    ).status_code == 201


async def test_expiry_and_revision_pinned_lookup(client, target):
    from datetime import UTC, datetime, timedelta

    from app.models import ChatSession
    from sqlalchemy import update

    client, _app = client
    identity = await new_session(client)
    source = next(
        iter(
            json.loads((target["collection"].parent / "nasa-chat-registry.json").read_text())[
                "sources"
            ]
        )
    )
    stale = await client.get(
        f"/api/v1/chat/sources/{source}?"
        + urlencode({"locator": "CSV row 8", "corpus_version": "0" * 64})
    )
    assert stale.status_code == 409
    engine = create_async_engine(target["owner_url"], hide_parameters=True)
    try:
        async with engine.begin() as connection:
            await connection.execute(
                update(ChatSession)
                .where(ChatSession.id == identity)
                .values(created_at=datetime.now(UTC) - timedelta(hours=25))
            )
    finally:
        await engine.dispose()
    assert (await client.get(f"/api/v1/chat/sessions/{identity}")).status_code == 404


async def test_timeout_is_visible_without_fabricated_citations(client):
    client, app = client
    identity = await new_session(client)
    app.state.settings.chat_timeout_seconds = 0.01

    class Slow(ExtractiveProvider):
        async def answer(self, request):
            await asyncio.sleep(0.1)
            return await super().answer(request)

    app.state.nasa_chat_provider_factory = Slow
    response = await client.post(
        f"/api/v1/chat/sessions/{identity}/messages", json={"question": "FLEX-007"}
    )
    assert response.status_code == 201, response.text
    answer = response.json()["assistant"]["answer"]
    assert answer["state"] == "timeout" and answer["citations"] == []
