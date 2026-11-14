"""Extractive provider behavior on small hand-built passages (no database, no NASA files)."""

from uuid import uuid4

from app.integrations.chat import CorpusPassage, RagRequest
from app.integrations.rag.provider import VERSION, ExtractiveProvider

FLEX = uuid4()
CSV, SHEET, SAME_DOC = uuid4(), uuid4(), uuid4()


def passage(source, slug, title, locator, text):
    return CorpusPassage(
        chunk_id=uuid4(),
        source_document_id=source,
        investigation_id=FLEX if slug == "flex" else uuid4(),
        slug=slug,
        title=title,
        locator=locator,
        text=text,
    )


PASSAGES = (
    passage(
        CSV,
        "flex",
        "Flame Extinguishment Experiment",
        "CSV row 8",
        "FLEX-007 [row 8]; Fuel; heptane; Droplet initial diameter; mm: 1.87; O2; %: 21",
    ),
    passage(
        SHEET,
        "flex",
        "Flame Extinguishment Experiment",
        "TEST CONDITIONS / D0 / kavg",
        "FLEX-007 \n\nTEST CONDITIONS \n\tFuel: \tHeptane \n\tD0  (mm) = \t1.82 \n",
    ),
    passage(
        SAME_DOC,
        "same",
        "Smoke and Aerosol Measurement Experiment",
        "README / Objective",
        "SAME measured smoke aerosol particle size for spacecraft fire detection.",
    ),
)
SLUGS = ("flex", "same")


def request(question, citations):
    return RagRequest(
        question=question,
        corpus_version="c" * 64,
        collection_fingerprint="c" * 64,
        allowed_sources=citations,
    )


async def test_conflicting_values_keep_both_sources_verbatim():
    provider = ExtractiveProvider()
    question = "FLEX-007 D0 đường kính mâu thuẫn?"
    citations = provider.retrieve(question, PASSAGES, (), SLUGS)
    by_source = {p.source_document_id: p for p in PASSAGES}
    assert {c.source_document_id for c in citations} == {CSV, SHEET}
    for citation in citations:
        original = by_source[citation.source_document_id]
        assert citation.source_locator == original.locator
        assert citation.source_excerpt in original.text

    answer = await provider.answer(request(question, citations))
    assert answer.state == "answered"
    assert (answer.origin, answer.review_status) == ("real", "unreviewed")
    assert answer.provider_version == VERSION
    assert "1.87 mm [" in answer.text and "1.82 mm [" in answer.text
    assert answer.citations == citations


async def test_safety_verdicts_and_planetary_gravity_are_refused():
    provider = ExtractiveProvider()
    for question in (
        "Is PMMA safe at 30% oxygen?",
        "Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?",
    ):
        assert provider.retrieve(question, PASSAGES, (), SLUGS) == ()
        answer = await provider.answer(request(question, ()))
        assert answer.state == "abstained" and answer.citations == ()


def test_follow_up_reuses_the_previous_study_anchor():
    citations = ExtractiveProvider().retrieve(
        "còn đường kính của nó?", PASSAGES, ("FLEX-007 D0?",), SLUGS
    )
    assert citations
    assert {c.source_document_id for c in citations} <= {CSV, SHEET}


def test_mixed_runs_are_not_combined():
    assert ExtractiveProvider().retrieve("FLEX-007 vs FLEX-008 D0?", PASSAGES, (), SLUGS) == ()


async def test_unmatched_question_abstains_and_advisor_is_unavailable():
    provider = ExtractiveProvider()
    answer = await provider.answer(request("FLEX-007 D0?", ()))
    assert answer.state == "abstained"
    assert (await provider.advise({}, {})).state == "unavailable"


def test_extractive_provider_is_selected_from_settings():
    from types import SimpleNamespace

    from app.core.config import Settings
    from app.integrations.chat import select_provider

    app = SimpleNamespace(
        state=SimpleNamespace(settings=Settings(_env_file=None, chat_provider="extractive"))
    )
    assert isinstance(select_provider(app), ExtractiveProvider)
