"""Extractive NASA source answers (AI-team owned)."""

import re
from decimal import Decimal

from app.integrations.chat import CorpusPassage
from app.integrations.rag.retrieval import fold, refusal, select_passages
from app.schemas.api.chat import Answer, Citation

# Answer-composition version; bump when the text/selection rules change.
VERSION = "nasa-extractive-v2"
MAX_CITATIONS = 4

FLEX_RUN = re.compile(r"\bflex[- ]?(\d{3})\b")
INITIAL_DIAMETER = re.compile(r"\b(?:d0|initial (?:droplet )?diameter|duong kinh ban dau)\b")
TABLE_D0 = re.compile(r"(?:^|; )Droplet initial diameter; mm: (\d+(?:\.\d+)?)(?=;|$)")
SHEET_D0 = re.compile(r"^\s*D0\s*\(mm\)\s*=\s*(\d+(?:\.\d+)?)\s*$", re.MULTILINE)


def flex_diameter_comparison(question, citations):
    query = fold(question)
    run = FLEX_RUN.search(query)
    if not run or not INITIAL_DIAMETER.search(query):
        return None
    run_id = f"flex-{run[1]}"
    values = {}
    for index, citation in enumerate(citations, 1):
        excerpt = citation.source_excerpt or ""
        if not re.match(rf"{run_id}(?=\s|$)", fold(excerpt)):
            continue
        if re.fullmatch(r"CSV row \d+", citation.source_locator):
            label, match = "Bảng CSV", TABLE_D0.search(excerpt)
        elif citation.source_locator == "TEST CONDITIONS / D0 / kavg":
            label, match = "Phiếu thí nghiệm", SHEET_D0.search(excerpt)
        else:
            continue
        if match:
            values.setdefault(citation.source_document_id, (index, label, match[1]))
    if len({Decimal(value) for _, _, value in values.values()}) < 2:
        return None
    lines = "\n".join(
        f"• {label} ghi {value} mm [{index}]." for index, label, value in values.values()
    )
    return (
        f"Hai nguồn ghi đường kính ban đầu (D0) của {run_id.upper()} khác nhau.\n"
        f"{lines}\n"
        "Giữ cả hai giá trị theo từng nguồn. Mở trích đoạn để xem các điều kiện thử đi kèm."
    )


class ExtractiveProvider:
    """Quotes admitted source passages verbatim; never composes new facts.

    Implements the backend RagProvider/AdvisorProvider protocols plus the optional
    CorpusRetriever capability. Advisor stays unavailable for this provider.
    """

    version = VERSION

    def retrieve(
        self,
        question: str,
        passages: tuple[CorpusPassage, ...],
        prior_questions: tuple[str, ...],
        study_slugs: tuple[str, ...],
    ) -> tuple[Citation, ...]:
        hits = select_passages(question, passages, prior_questions, study_slugs)
        return tuple(hit.citation for hit in hits[:MAX_CITATIONS])

    async def advise(self, scenario, evidence):
        return Answer(state="unavailable", text="Advisor provider unavailable.")

    async def answer(self, request):
        reason = refusal(request.question)
        citations = () if reason else request.allowed_sources[:MAX_CITATIONS]
        text = (
            reason
            or flex_diameter_comparison(request.question, citations)
            or (
                "Tìm thấy các trích đoạn nguồn sau. Giữ nguyên đơn vị "
                "và các giá trị khác nhau theo từng nguồn:\n\n"
                + "\n\n".join(
                    f"[{index}] {citation.source_excerpt}"
                    for index, citation in enumerate(citations, 1)
                )
                if citations
                else (
                    "Không tìm thấy bằng chứng phù hợp trong corpus hiện tại. "
                    "Hãy nêu tên thí nghiệm, mã run hoặc thông số cụ thể."
                )
            )
        )
        return Answer(
            state="answered" if citations else "abstained",
            text=text,
            origin="real",
            review_status="unreviewed",
            provider_version=VERSION,
            corpus_version=request.corpus_version,
            citations=citations,
        )
