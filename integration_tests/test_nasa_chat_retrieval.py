from uuid import UUID

import pytest
from app.integrations.chat import RagRequest

from integrations.nasa_chat.provider import ExtractiveProvider
from integrations.nasa_chat.retrieval import Passage, refusal, select_passages, terms
from integrations.nasa_data.coverage import build_coverage_release


@pytest.fixture(scope="module")
def passages():
    release = build_coverage_release()
    sources = {s["id"]: s for s in release["sources"]}
    studies = {s["id"]: s for s in release["investigations"]}
    return tuple(
        Passage(
            UUID(c["id"]),
            UUID(c["sourceId"]),
            UUID(studies[c["investigationId"]]["uuid"]),
            c["investigationId"],
            studies[c["investigationId"]]["title"],
            c["locator"],
            c["text"],
        )
        for c in release["chunks"]
        if sources[c["sourceId"]]["license"] == "CC0-1.0"
    )


def test_flex_conflicts_preserve_both_original_sources(passages):
    hits = select_passages("FLEX-007 D0 đường kính mâu thuẫn?", passages)
    assert len({h.passage.source_id for h in hits}) >= 2
    assert "1.87" in " ".join(h.excerpt for h in hits)
    assert "1.82" in " ".join(h.excerpt for h in hits)
    assert all(h.excerpt in h.passage.text for h in hits)
    assert {h.passage.slug for h in hits} == {"flex"}


def test_followup_keeps_original_run_anchor(passages):
    hits = select_passages("còn áp suất thì sao?", passages, history=("FLEX-007 D0?",))
    assert hits and all("FLEX-007" in h.passage.text for h in hits)


@pytest.mark.parametrize(
    "question",
    [
        "Dữ liệu cháy ở trọng lực Sao Hỏa 0.38g?",
        "Có thí nghiệm cháy ở 0,16 g không?",
        "Are there fire measurements on Mars?",
        "Combustion at 0.38 g?",
        "Combustion at 0.380 g?",
        "Are there droplet experiments under lunar gravity?",
        "What combustion data do we have for Mars?",
        "What sample mass was measured at 0.38 g gravity?",
        "Khối lượng mẫu thử ở trọng lực 0,38 g là bao nhiêu?",
    ],
)
async def test_planetary_conditions_do_not_return_unrelated_microgravity_rows(passages, question):
    hits = select_passages(question, passages)
    assert not hits
    answer = await ExtractiveProvider().answer(
        RagRequest(
            question=question,
            corpus_version="a" * 64,
            collection_fingerprint="b" * 64,
            allowed_sources=(),
        )
    )
    assert answer.state == "abstained" and not answer.citations
    assert "bộ dữ liệu đang kết nối" in answer.text
    assert "Sao Hỏa" in answer.text


def test_general_microgravity_and_future_applications_still_retrieve(passages):
    assert select_passages("What are the FLEX objectives in microgravity?", passages)
    assert select_passages("What is the SAME fire detector for future Mars missions?", passages)
    assert select_passages(
        "What conditions did the SAME detector test for future Mars missions?", passages
    )
    assert not refusal("Find solid fuel samples with a mass of 0.38 g")


async def test_d0_conflict_is_visible_before_excerpts(passages):
    question = "FLEX-007 đường kính D0 có mâu thuẫn 1.87 và 1.82 không?"
    hits = select_passages(question, passages)
    request = RagRequest(
        question=question,
        corpus_version="a" * 64,
        collection_fingerprint="b" * 64,
        allowed_sources=tuple(h.citation for h in hits),
    )
    answer = await ExtractiveProvider().answer(request)
    assert "1.87 mm [1]" in answer.text and "1.82 mm [2]" in answer.text
    assert all(c.source_excerpt not in answer.text for c in answer.citations)
    sheet = request.allowed_sources[1]
    for modified in (
        sheet.source_excerpt.replace("1.82", "1.870"),
        sheet.source_excerpt.replace("D0  (mm)", "D0  (cm)"),
        sheet.source_excerpt.replace("FLEX-007", "FLEX-008"),
    ):
        bad = request.model_copy(
            update={
                "allowed_sources": (
                    request.allowed_sources[0],
                    sheet.model_copy(update={"source_excerpt": modified}),
                )
            }
        )
        assert "1.87 mm [1]" not in (await ExtractiveProvider().answer(bad)).text


@pytest.mark.parametrize(
    "question",
    [
        "Giá bitcoin hôm nay?",
        "Is PMMA safe in a NASA habitat at 34% oxygen?",
        "NASA rocket propulsion engine performance?",
    ],
)
def test_out_of_corpus_or_safety_verdict_abstains(passages, question):
    assert not select_passages(question, passages)


def test_bass_fan_units_are_not_fabricated_airflow(passages):
    hits = select_passages("BASS-II fan display và air display có giới hạn gì?", passages)
    text = " ".join(h.excerpt for h in hits).lower()
    assert "voltage" in text and "1 min" in text
    assert {h.passage.slug for h in hits} == {"bass-ii"}


async def test_provider_returns_real_unreviewed_original_citations(passages):
    hits = select_passages("FLEX-007", passages)
    answer = await ExtractiveProvider().answer(
        RagRequest(
            question="FLEX-007",
            corpus_version="a" * 64,
            collection_fingerprint="b" * 64,
            allowed_sources=tuple(h.citation for h in hits),
        )
    )
    assert answer.state == "answered" and answer.origin == "real"
    assert answer.review_status == "unreviewed" and answer.model_version is None
    assert all(c.source_excerpt in answer.text for c in answer.citations)


def test_token_search_expands_multipliers_without_changing_run_ids():
    assert "voltage" in terms("voltagex10")
    assert terms("FLEX007") == ["flex007"]


@pytest.mark.parametrize(
    "question",
    ["FLEX-007 population of Atlantis?", "BASS-II ticket prices in Atlantis?"],
)
def test_study_anchor_does_not_supply_unrelated_evidence(passages, question):
    assert not select_passages(question, passages)


def test_explicit_study_outside_session_scope_does_not_fall_back(passages):
    flex = tuple(p for p in passages if p.slug == "flex")
    assert not select_passages("BASS-II oxygen?", flex, study_slugs={"bass-ii", "flex"})


def test_alias_spacing_does_not_expand_to_the_shorter_study(passages):
    bass = tuple(p for p in passages if p.slug == "bass")
    assert not select_passages("BASS II objective?", bass, study_slugs={"bass-ii", "bass"})
    assert {h.passage.slug for h in select_passages("SAME R smoke", passages)} == {"same-r"}


def test_named_record_never_returns_neighboring_records(passages):
    assert not select_passages("BASS-II B999 fan display?", passages)
    assert not select_passages("SAME-R run 9999 smoke?", passages)
    hits = select_passages("BASS-II B1 fan display?", passages)
    assert hits and all(h.passage.text.startswith("B1 [bass-ii]") for h in hits)
    assert not select_passages("FLEX-007 vs FLEX-008 D0?", passages)
    assert not select_passages("Compare FLEX-007 and BASS-II oxygen conditions", passages)
    assert not select_passages("BASS-II B1 vs B2 fan display?", passages)
    follow = select_passages(
        "What about air display?", passages, history=("BASS-II B1 fan display?",)
    )
    assert follow and all(h.passage.text.startswith("B1 [bass-ii]") for h in follow)
    assert not select_passages(
        "What about B1 vs B2 fan display?",
        passages,
        history=("BASS-II B1 fan display?",),
    )
    assert not select_passages("What about run 999 D0?", passages, history=("FLEX-007 D0?",))
    changed = select_passages("What about run 008 D0?", passages, history=("FLEX-007 D0?",))
    assert changed and all("FLEX-008" in h.passage.text for h in changed)


@pytest.mark.parametrize(
    "question,study",
    [
        ("What is the objective of SAME-R smoke aerosol research?", "same-r"),
        ("What are the objectives of BASS-II material research?", "bass-ii"),
        ("FLEX007", "flex"),
    ],
)
def test_named_study_and_compact_id_stay_scoped(passages, question, study):
    hits = select_passages(question, passages)
    assert hits and {h.passage.slug for h in hits} == {study}
