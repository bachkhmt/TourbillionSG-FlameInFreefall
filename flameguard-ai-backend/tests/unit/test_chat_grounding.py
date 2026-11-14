"""ADR-0005 grounding: verified retrieval hits and real-origin answer validation."""

from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.integrations.chat import CorpusPassage
from app.schemas.api.chat import Answer, Citation
from app.services.chat import validate_citations, validate_real_answer, verify_hits

SOURCE = uuid4()
CORPUS = "c" * 64
TEXT = "FLEX-007 [row 8]; Droplet initial diameter; mm: 1.87; Test Time: 13:26:11"
PASSAGE = CorpusPassage(
    chunk_id=uuid4(),
    source_document_id=SOURCE,
    investigation_id=uuid4(),
    slug="flex",
    title="FLEX",
    locator="CSV row 8",
    text=TEXT,
)
CITATION = Citation(source_document_id=SOURCE, source_locator="CSV row 8", source_excerpt=TEXT[:52])


def real(text, citations=(CITATION,), **overrides):
    values = dict(
        state="answered" if citations else "abstained",
        text=text,
        origin="real",
        review_status="unreviewed",
        provider_version="nasa-extractive-v2",
        corpus_version=CORPUS,
        citations=citations,
    )
    values.update(overrides)
    return Answer(**values)


def test_verified_hits_must_be_verbatim_slices_of_admitted_chunks():
    assert verify_hits((CITATION, CITATION), (PASSAGE,)) == (CITATION,)
    for forged in (
        CITATION.model_copy(update={"source_excerpt": "mm: 1.88"}),
        CITATION.model_copy(update={"source_locator": "CSV row 9"}),
        CITATION.model_copy(update={"source_document_id": uuid4()}),
        CITATION.model_copy(update={"source_excerpt": None}),
        CITATION.model_copy(update={"test_run_id": uuid4()}),
    ):
        with pytest.raises(HTTPException) as error:
            verify_hits((forged,), (PASSAGE,))
        assert error.value.status_code == 502
    with pytest.raises(HTTPException):
        verify_hits(("not a citation",), (PASSAGE,))


def test_real_origin_requires_an_admitted_real_corpus_and_unreviewed_label():
    answer = real("FLEX-007 ghi 1.87 mm [1].")
    validate_citations(answer, (CITATION,), False, real_corpus=True)
    for allowed, synthetic, corpus, changed in (
        ((CITATION,), False, False, answer),
        ((CITATION,), True, True, answer),
        ((CITATION,), False, True, answer.model_copy(update={"review_status": "unknown"})),
        ((), False, True, answer),
        ((CITATION,), False, True, answer.model_copy(update={"origin": "unknown"})),
    ):
        with pytest.raises(HTTPException):
            validate_citations(changed, allowed, synthetic, real_corpus=corpus)


def test_real_answers_only_state_numbers_found_in_cited_excerpts():
    validate_real_answer(real("Bảng CSV của FLEX-007 ghi 1.87 mm [1]."), CORPUS)
    validate_real_answer(real("Không tìm thấy bằng chứng phù hợp.", citations=()), CORPUS)
    for text in ("FLEX-007 ghi 1.82 mm [1].", "Khoảng 2 lần [1].", "13:26:11 và 99 [1]"):
        with pytest.raises(HTTPException):
            validate_real_answer(real(text), CORPUS)


def test_real_answers_must_match_corpus_and_name_their_provider():
    with pytest.raises(HTTPException):
        validate_real_answer(real("1.87 [1]", corpus_version="d" * 64), CORPUS)
    with pytest.raises(HTTPException):
        validate_real_answer(real("1.87 [1]", provider_version=" "), CORPUS)
    # Non-real answers (timeouts, unavailable) are not subject to the real grounding rule.
    validate_real_answer(Answer(state="timeout", text="Provider deadline exceeded."), CORPUS)
