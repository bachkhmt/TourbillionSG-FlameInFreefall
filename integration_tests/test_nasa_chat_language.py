"""Explicit answer language: framing text follows the request; excerpts never change."""

from uuid import UUID

import pytest
from app.integrations.chat import CorpusPassage, RagRequest
from app.integrations.rag.provider import VERSION, ExtractiveProvider
from app.integrations.rag.vocabulary import MESSAGES
from pydantic import ValidationError

from integrations.nasa_data.unified import build_unified_release


@pytest.fixture(scope="module")
def release():
    return build_unified_release()


@pytest.fixture(scope="module")
def passages(release):
    sources = {s["id"]: s for s in release["sources"]}
    studies = {s["id"]: s for s in release["investigations"]}
    return tuple(
        CorpusPassage(
            chunk_id=UUID(c["id"]),
            source_document_id=UUID(c["sourceId"]),
            investigation_id=UUID(studies[c["investigationId"]]["uuid"]),
            slug=c["investigationId"],
            title=studies[c["investigationId"]]["title"],
            locator=c["locator"],
            text=c["text"],
        )
        for c in release["chunks"]
        if sources[c["sourceId"]]["license"] == "CC0-1.0"
    )


@pytest.fixture(scope="module")
def catalog_slugs(release):
    return tuple(sorted(s["id"] for s in release["investigations"]))


async def ask(question, language, passages=(), slugs=()):
    provider = ExtractiveProvider()
    citations = provider.retrieve(question, passages, (), slugs) if passages else ()
    return await provider.answer(
        RagRequest(
            question=question,
            language=language,
            corpus_version="a" * 64,
            collection_fingerprint="b" * 64,
            allowed_sources=citations,
        )
    )


REFUSALS = [
    ("mixed", "So sánh FLEX-007 và FLEX-008?", "Compare FLEX-007 and FLEX-008?"),
    ("safety", "Vật liệu PMMA có an toàn không?", "Is PMMA safe for a cabin?"),
    ("outside", "Giá bitcoin hôm nay thế nào?", "What is the bitcoin price today?"),
    (
        "gravity",
        "Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?",
        "Combustion data at Mars gravity 0.38g?",
    ),
    ("aggregate", "Liệt kê nhiệt độ cao nhất?", "What is the highest temperature?"),
]


@pytest.mark.parametrize(("key", "vi_question", "en_question"), REFUSALS)
async def test_refusals_follow_the_requested_language(key, vi_question, en_question):
    for question in (vi_question, en_question):
        assert (await ask(question, "en")).text == MESSAGES[key]["en"]
        assert (await ask(question, "vi")).text == MESSAGES[key]["vi"]


@pytest.mark.parametrize(("key", "vi_question", "en_question"), REFUSALS)
async def test_without_language_detection_is_unchanged(key, vi_question, en_question):
    assert (await ask(vi_question, None)).text == MESSAGES[key]["vi"]
    assert (await ask(en_question, None)).text == MESSAGES[key]["en"]


async def test_missing_evidence_follows_the_requested_language():
    question = "Thí nghiệm nào của zzqx?"
    assert (await ask(question, "en")).text == MESSAGES["missing"]["en"]
    assert (await ask(question, "vi")).text == MESSAGES["missing"]["vi"]


async def test_found_framing_changes_but_excerpts_and_citations_do_not(passages, catalog_slugs):
    question = "Giới hạn của màn hình quạt BASS-II là gì?"
    en = await ask(question, "en", passages, catalog_slugs)
    vi = await ask(question, "vi", passages, catalog_slugs)
    assert en.state == vi.state == "answered"
    assert en.citations == vi.citations and en.citations
    assert en.text.startswith(MESSAGES["found"]["en"])
    assert vi.text.startswith(MESSAGES["found"]["vi"])
    assert en.text.removeprefix(MESSAGES["found"]["en"]) == vi.text.removeprefix(
        MESSAGES["found"]["vi"]
    )
    for citation in en.citations:
        assert citation.source_excerpt in en.text


async def test_flex_diameter_conflict_keeps_both_values_in_either_language(passages, catalog_slugs):
    question = "FLEX-007 đường kính ban đầu D0?"
    en = await ask(question, "en", passages, catalog_slugs)
    vi = await ask(question, "vi", passages, catalog_slugs)
    assert en.citations == vi.citations
    for answer in (en, vi):
        assert "1.87" in answer.text and "1.82" in answer.text
    assert en.text.startswith("Sources report different initial diameters (D0) for FLEX-007")
    assert vi.text.startswith("Hai nguồn ghi đường kính ban đầu (D0) của FLEX-007")


async def test_answers_carry_the_new_provider_version():
    assert VERSION == "nasa-extractive-v4"
    assert (await ask("What is the bitcoin price today?", "en")).provider_version == VERSION


def test_unknown_language_is_rejected():
    with pytest.raises(ValidationError):
        RagRequest(
            question="FLEX-007?",
            language="fr",
            corpus_version="a" * 64,
            collection_fingerprint="b" * 64,
            allowed_sources=(),
        )
