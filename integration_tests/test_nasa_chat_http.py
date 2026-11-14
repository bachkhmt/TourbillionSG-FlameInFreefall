"""Real NASA corpus chat over HTTP through the backend's own app (ADR-0005), on PostgreSQL."""

import asyncio
import hashlib
import json
import os
import time
from urllib.parse import urlencode
from uuid import uuid4

import pytest
from app.integrations.chat import MockProvider
from app.integrations.rag.provider import VERSION, ExtractiveProvider
from app.main import create_app
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from integration_tests.chat_target import prepare_target, settings_for

pytestmark = pytest.mark.integration


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


async def ask(client, identity, question):
    return await client.post(
        f"/api/v1/chat/sessions/{identity}/messages", json={"question": question}
    )


async def history(client, identity):
    return (await client.get(f"/api/v1/chat/sessions/{identity}/messages")).json()["items"]


async def test_real_answer_history_source_binding_and_scientific_regression(client):
    client, _app = client
    readiness = await client.get("/api/v1/chat/readiness")
    assert readiness.headers["cache-control"] == "no-store"
    ready = readiness.json()
    assert (ready["state"], ready["mode"]) == ("ready", "retrieval_only")
    assert ready["provider_version"] == VERSION and ready["passages"] == 1045
    assert ready["review_status"] == "unreviewed"
    identity = await new_session(client)
    response = await ask(client, identity, "FLEX-007 D0 đường kính mâu thuẫn?")
    assert response.status_code == 201, response.text
    answer = response.json()["assistant"]["answer"]
    assert (answer["state"], answer["origin"], answer["review_status"]) == (
        "answered",
        "real",
        "unreviewed",
    )
    assert "1.87 mm [1]" in answer["text"] and "1.82 mm [2]" in answer["text"]
    assert answer["provider_version"] == ready["provider_version"]
    assert answer["corpus_version"] == ready["corpus_version"]
    assert len({c["source_document_id"] for c in answer["citations"]}) >= 2
    for citation in answer["citations"]:
        source = await client.get(
            f"/api/v1/chat/sources/{citation['source_document_id']}?"
            + urlencode(
                {"locator": citation["source_locator"], "corpus_version": answer["corpus_version"]}
            )
        )
        assert source.status_code == 200, source.text
        assert source.json()["source_url"].startswith("https://psi.nasa.gov/")
        assert source.json()["license"] == "CC0-1.0"
        assert source.headers["cache-control"] == "no-store"
    stored = await history(client, identity)
    assert [m["role"] for m in stored] == ["user", "assistant"]
    assert stored[1]["answer"] == answer
    follow = await ask(client, identity, "còn áp suất thì sao?")
    assert follow.status_code == 201 and follow.json()["assistant"]["answer"]["citations"]
    mars = await ask(client, identity, "Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?")
    assert mars.status_code == 201
    gap = mars.json()["assistant"]["answer"]
    assert gap["state"] == "abstained" and not gap["citations"]
    summary = (await client.get("/api/v1/dashboard/summary")).json()
    assert (summary["investigationCount"], summary["runCount"], summary["claimCount"]) == (
        18,
        910,
        0,
    )
    assert summary["context"]["reviewState"] == "unreviewed"


async def test_advisor_gets_no_corpus_and_reports_provider_unavailable(client):
    client, _app = client
    advisor = await client.post(
        "/api/v1/advisor/assessments", json={"scenario": {}, "pages": {"limit": 20}}
    )
    assert advisor.status_code == 200, advisor.text
    body = advisor.json()
    assert all(a["state"] == "unavailable" and not a["citations"] for a in body["pillars"].values())
    assert all("PROVIDER_UNAVAILABLE" in gaps for gaps in body["gaps"].values())


async def test_provider_cannot_invent_citations_or_partial_pairs(client):
    client, app = client
    identity = await new_session(client)

    class Forged(ExtractiveProvider):
        async def answer(self, request):
            answer = await super().answer(request)
            forged = answer.citations[0].model_copy(update={"source_document_id": uuid4()})
            return answer.model_copy(update={"citations": (forged,)})

    class Inflated(ExtractiveProvider):
        async def answer(self, request):
            answer = await super().answer(request)
            return answer.model_copy(update={"text": answer.text + "\nGiá trị đúng là 9.99 mm."})

    for factory in (Forged, Inflated):
        app.state.chat_provider_factory = factory
        response = await ask(client, identity, "FLEX-007 D0 đường kính mâu thuẫn?")
        assert response.status_code == 502, response.text
    assert await history(client, identity) == []


async def test_corpus_drift_during_provider_rejects_and_rolls_back(client, target):
    client, app = client
    identity = await new_session(client)
    manifest = target["collection"]
    registry = manifest.parent / "corpus-registry.json"
    before_registry, before_manifest = registry.read_bytes(), manifest.read_bytes()

    class Drift(ExtractiveProvider):
        async def answer(self, request):
            # A valid new registry revision: the declared hash is updated consistently.
            changed = before_registry + b" "
            registry.write_bytes(changed)
            config = json.loads(before_manifest)
            config["corpusPolicy"]["registrySha256"] = hashlib.sha256(changed).hexdigest()
            manifest.write_text(json.dumps(config))
            return await super().answer(request)

    app.state.chat_provider_factory = Drift
    try:
        response = await ask(client, identity, "FLEX-007")
        assert response.status_code == 409, response.text
    finally:
        registry.write_bytes(before_registry)
        manifest.write_bytes(before_manifest)
    assert await history(client, identity) == []


async def test_tampered_registry_reports_corpus_policy_unavailable(client, target):
    client, _app = client
    registry = target["collection"].parent / "corpus-registry.json"
    before = registry.read_bytes()
    registry.write_bytes(before + b" ")  # declared hash no longer matches
    try:
        ready = (await client.get("/api/v1/chat/readiness")).json()
        assert (ready["state"], ready["reasons"]) == ("not_ready", ["CORPUS_POLICY_UNAVAILABLE"])
    finally:
        registry.write_bytes(before)


async def test_concurrent_sends_keep_complete_pairs(client):
    client, app = client
    identity = await new_session(client)
    entered, release = asyncio.Event(), asyncio.Event()
    calls = []

    class Delayed(ExtractiveProvider):
        async def answer(self, request):
            calls.append(request.question)
            if len(calls) == 1:
                entered.set()
                await release.wait()
            return await super().answer(request)

    app.state.chat_provider_factory = Delayed
    first = asyncio.create_task(ask(client, identity, "FLEX-007"))
    await asyncio.wait_for(entered.wait(), 10)
    second = await ask(client, identity, "FLEX-007 D0?")
    assert second.status_code == 201, second.text
    release.set()
    assert (await first).status_code == 201
    stored = await history(client, identity)
    assert [m["role"] for m in stored] == ["user", "assistant"] * 2
    assert [m["answer"]["text"] for m in stored[::2]] == ["FLEX-007 D0?", "FLEX-007"]


async def test_provider_without_retrieval_abstains_on_real_corpus(client):
    client, app = client
    app.state.chat_provider_factory = MockProvider
    ready = (await client.get("/api/v1/chat/readiness")).json()
    assert (ready["state"], ready["mode"]) == ("ready", "provider")
    identity = await new_session(client)
    response = await ask(client, identity, "FLEX-007 D0?")
    assert response.status_code == 201, response.text
    answer = response.json()["assistant"]["answer"]
    assert answer["state"] == "abstained" and answer["citations"] == []


async def test_missing_runtime_and_unknown_source_are_explicit(target, client):
    client, _app = client
    corpus = (await client.get("/api/v1/chat/readiness")).json()["corpus_version"]
    unknown = await client.get(
        f"/api/v1/chat/sources/{uuid4()}?"
        + urlencode({"locator": "CSV row 8", "corpus_version": corpus})
    )
    assert unknown.status_code == 404
    app = create_app(settings_for(target).model_copy(update={"runtime_database_url": None}))
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as other:
            ready = (await other.get("/api/v1/chat/readiness")).json()
            assert ready == {
                **ready,
                "state": "not_ready",
                "reasons": ["RUNTIME_STORAGE_UNAVAILABLE"],
            }
            assert (await other.post("/api/v1/chat/sessions", json={})).status_code == 503


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


async def test_cancelled_turn_stores_nothing(client):
    client, app = client
    identity = await new_session(client)
    entered = asyncio.Event()

    class Blocked(ExtractiveProvider):
        async def answer(self, request):
            entered.set()
            await asyncio.sleep(20)

    app.state.chat_provider_factory = Blocked
    task = asyncio.create_task(ask(client, identity, "FLEX-007"))
    await asyncio.wait_for(entered.wait(), 10)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    del app.state.chat_provider_factory
    assert await history(client, identity) == []
    assert (await ask(client, identity, "FLEX-007")).status_code == 201


async def test_expiry_and_revision_pinned_lookup(client, target):
    from datetime import UTC, datetime, timedelta

    from app.models import ChatSession
    from sqlalchemy import update

    client, _app = client
    identity = await new_session(client)
    registry = json.loads((target["collection"].parent / "corpus-registry.json").read_text())
    source = next(iter(registry["sources"]))
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


async def test_provider_and_retrieval_timeouts_are_visible_without_citations(client):
    client, app = client
    identity = await new_session(client)
    app.state.settings.chat_timeout_seconds = 0.05

    class SlowAnswer(ExtractiveProvider):
        async def answer(self, request):
            await asyncio.sleep(0.2)
            return await super().answer(request)

    class SlowRetrieval(ExtractiveProvider):
        def retrieve(self, *args):
            time.sleep(0.2)
            return super().retrieve(*args)

    try:
        for factory in (SlowAnswer, SlowRetrieval):
            app.state.chat_provider_factory = factory
            response = await ask(client, identity, "FLEX-007")
            assert response.status_code == 201, response.text
            answer = response.json()["assistant"]["answer"]
            assert answer["state"] == "timeout" and answer["citations"] == []
    finally:
        app.state.settings.chat_timeout_seconds = 10
