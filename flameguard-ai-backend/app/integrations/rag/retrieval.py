"""Lexical retrieval over admitted NASA chunks (AI-team owned algorithm)."""

import re
from dataclasses import dataclass

from app.integrations.chat import CorpusPassage
from app.integrations.rag.bm25 import BM25
from app.integrations.rag.vocabulary import fold, message, terms
from app.schemas.api.chat import Citation

FAMILIES = {
    "saffire": {"saffire-i", "saffire-ii", "saffire-iii"},
    "acme": {"bre", "cfi-g", "cld-flame", "e-field", "flame-design", "s-flame"},
    "bass": {"bass", "bass-ii"},
    "same": {"same", "same-r"},
}
COMPARISON = re.compile(r"\b(?:compare|versus|vs|so sanh|khac nhau)\b")
AGGREGATE = re.compile(
    "\\b(?:highest|lowest|maximum|minimum|range|how many|list all|cao "
    "nhat|thap nhat|bao nhieu|liet ke|khoang gia tri)\\b"
)

ALIASES = {
    "fan display": "fan voltage",
    "air display": "air response slow min",
    "duong kinh": "diameter droplet d0",
    "d0": "diameter d0",
    "ap suat": "pressure ambient atm mmhg",
    "nhien lieu": "fuel methanol heptane",
    "khoi": "smoke aerosol detection",
    "muc tieu": "objective purpose",
    "quat": "fan display voltage",
    "gioi han": "limit minute min",
    "oxy": "oxygen o2 fraction",
    "nguon": "source",
}
PLANETARY_GRAVITY = re.compile(r"(?<![\d.,])0[.,](?:16|38)0*\s*g\b")
MASS_CONTEXT = re.compile(r"\b(?:mass|weigh\w*|grams?|khoi luong|can nang|gam)\b")
GRAVITY_UNIT = re.compile(
    rf"(?:\b(?:gravity|trong luc)\s+(?:of\s+)?{PLANETARY_GRAVITY.pattern}"
    rf"|{PLANETARY_GRAVITY.pattern}\s+(?:gravity|trong luc)\b)"
)
PLANETARY_CONDITIONS = re.compile(
    r"\b(?:lunar|martian|moon|mars)\s+(?:gravity|conditions)\b"
    r"|\b(?:gravity|trong luc|dieu kien|on|under|at|o|tai|tren)\s+"
    r"(?:(?:of|cua|the)\s+)*(?:moon|mars|mat trang|sao hoa)\b"
    r"|\b(?:data|measurements|du lieu|so do)\b.{0,30}\b(?:for|o|tai)\s+"
    r"(?:the\s+)?(?:moon|mars|mat trang|sao hoa)\b"
)


def refusal(question):
    query = fold(question)
    mixed = (
        len(set(re.findall(r"\bflex[- ]?(\d{3})\b", query))) > 1
        or (
            re.search(r"\bbass[- ]ii\b", query) and len(set(re.findall(r"\bb\d{1,5}\b", query))) > 1
        )
        or (
            re.search(r"\bsaffire[- ]iii\b", query)
            and len(set(re.findall(r"\bs\d{1,5}\b", query))) > 1
        )
        or len(set(re.findall(r"\b(?:run|test|record)\s*(?:#\s*)?([a-z]*\d[a-z0-9-]*)\b", query)))
        > 1
    )
    if mixed:
        return message("mixed", question)
    if re.search(r"\b(safe|unsafe|an toan|certify|certified|xac suat chay)\b", query):
        return message("safety", question)
    if re.search(r"\b(bitcoin|weather|thoi tiet|propulsion|stock price|gia co phieu)\b", query):
        return message("outside", question)
    if (
        PLANETARY_CONDITIONS.search(query)
        or GRAVITY_UNIT.search(query)
        or (PLANETARY_GRAVITY.search(query) and not MASS_CONTEXT.search(query))
    ):
        return message("gravity", question)
    named_run = re.search(
        r"\bflex[- ]?\d{3}\b|\b(?:run|test|record)\s*#?\s*[a-z]*\d|\bb\d{1,5}\b", query
    )
    if AGGREGATE.search(query) and not named_run:
        return message("aggregate", question)
    return None


@dataclass(frozen=True)
class Hit:
    passage: CorpusPassage
    excerpt: str

    @property
    def citation(self):
        return Citation(
            source_document_id=self.passage.source_document_id,
            source_locator=self.passage.locator,
            source_excerpt=self.excerpt,
        )


def anchors(question, study_slugs):
    query = fold(question)
    run = re.search(r"\bflex[- ]?(\d{3})\b", query)
    slugs = set()
    covered = []
    for slug in sorted(study_slugs, key=lambda slug: (-len(slug), slug)):
        if (
            slug == "same"
            and "SAME" not in question
            and not re.search(r"smoke|aerosol|khoi|^same$", query)
        ):
            continue
        aliases = [slug, slug.replace("-", " ")]
        for alias in aliases:
            pattern = rf"(?<![a-z0-9-]){re.escape(alias)}(?![a-z0-9-])"
            for match in re.finditer(pattern, query):
                start, end = match.span()
                if not any(start < right and end > left for left, right in covered):
                    slugs.add(slug)
                    covered.append((start, end))
    for family, members in FAMILIES.items():
        if (
            family == "same"
            and "SAME" not in question
            and not re.search(r"smoke|aerosol|khoi|^same$", query)
        ):
            continue
        if re.search(rf"(?<![a-z0-9-]){family}(?![a-z0-9-]| (?:ii|iii|r)\b)", query):
            slugs.update(members & set(study_slugs))
    if run:
        return slugs | {"flex"}, f"flex-{int(run.group(1)):03d}"
    return slugs, None


def explicit_records(question, slugs):
    query = fold(question)
    records = set(re.findall(r"\b(?:run|test|record)\s*(?:#\s*)?([a-z]*\d[a-z0-9-]*)\b", query))
    if "bass-ii" in slugs:
        records.update(re.findall(r"\bb\d{1,5}\b", query))
    if "saffire-iii" in slugs:
        records.update(re.findall(r"\bs\d{1,5}\b", query))
    if slugs == {"flex"}:
        records = {
            f"flex-{int(m[1]):03d}" if (m := re.fullmatch(r"(?:flex-?)?(\d{1,3})", r)) else r
            for r in records
        }
    return records


def select_passages(question, passages, history=(), study_slugs=()):
    if refusal(question):
        return ()
    study_slugs = set(study_slugs) | {p.slug for p in passages}
    slugs, run = anchors(question, study_slugs)
    previous_ids = set()
    if (
        not slugs
        and history
        and re.search(r"\b(con|the|no|do|it|its|those|nguon|source|what about)\b", fold(question))
    ):
        for previous in reversed(history):
            slugs, previous_run = anchors(previous, study_slugs)
            if slugs:
                if refusal(previous):
                    return ()
                previous_ids = explicit_records(previous, slugs)
                if previous_run:
                    previous_ids.add(previous_run)
                break
    records = explicit_records(question, slugs)
    if run:
        records.add(run)
    records = records or previous_ids
    if len(records) > 1 or (records and len(slugs) != 1):
        return ()
    record = next(iter(records), None)
    run = record if slugs == {"flex"} and record and re.fullmatch(r"flex-\d{3}", record) else None
    run_pattern = re.compile(rf"(?<![a-z0-9-]){re.escape(run)}(?![a-z0-9-])") if run else None
    candidates = [
        p
        for p in passages
        if (not slugs or p.slug in slugs)
        and (not run_pattern or run_pattern.search(fold(p.text)))
        and (record is None or run or fold(p.text).startswith(f"{record} ["))
    ]
    if not candidates:
        return ()
    if slugs - {p.slug for p in candidates}:
        return ()
    if COMPARISON.search(fold(question)) and len(slugs) >= 2 and not records:
        # Generic comparisons use objectives; specific topics need original evidence on each side.
        name_terms = {t for slug in slugs for t in terms(slug)} | set(FAMILIES)
        topics = set(terms(question)) - name_terms
        # Round-robin families keeps each requested side represented within four citations.
        groups = []
        covered = set()
        for family, members in FAMILIES.items():
            if re.search(rf"\b{family}\b", fold(question)):
                group = members & slugs
                if group:
                    groups.append(group)
                    covered.update(group)
        groups.extend([{slug} for slug in sorted(slugs - covered)])
        choices = []
        for group in groups:
            group_passages = [
                p
                for p in candidates
                if p.slug in group
                and topics <= set(terms(p.text + " " + p.locator))
                and (
                    p.locator.startswith("JSON /objective")
                    or p.locator.startswith("investigations/")
                )
            ]
            group_passages.sort(
                key=lambda p: (not p.locator.startswith("JSON /objective"), p.slug, p.locator)
            )
            # Prefer one objective for each study over several chunks of a single study.
            distinct = []
            for p in group_passages:
                if p.slug not in {x.slug for x in distinct}:
                    distinct.append(p)
            if not distinct:
                return ()
            choices.append(distinct)
        result = []
        for turn in range(4):
            for group in choices:
                if turn < len(group) and len(result) < 4:
                    result.append(Hit(group[turn], group[turn].text[:1800]))
        return tuple(result)
    expanded = (
        question + " " + " ".join(value for key, value in ALIASES.items() if key in fold(question))
    )
    anchor_terms = {t for slug in slugs for t in terms(slug)}
    if run:
        anchor_terms.update([*terms(run), run.replace("-", "")])
    if record:
        anchor_terms.update(terms(record))
    content_terms = {t for t in terms(expanded) if t not in anchor_terms and not t.isdecimal()}
    # Names identify a scope, but do not substantiate another topic in the question.
    # Preserve direct identifier lookups when no additional topic was requested.
    if not content_terms and not slugs:
        return ()
    query = sorted(content_terms or anchor_terms)
    documents = [terms(p.text + " " + p.title) for p in candidates]
    ranking = BM25(documents).search(query, k=len(documents))
    if not ranking:
        return ()
    query_words = set(query)

    def relevance(item):
        index, score = item
        passage = candidates[index]
        words = set(terms(passage.text))
        # Topical evidence must occur in the excerpt, not merely the repeated title.
        if content_terms and not (query_words & words):
            return -1
        if "pmma" in query_words and "pmma" not in words:
            return -1
        metadata = passage.locator.startswith(("JSON /objective", "investigations/"))
        overview_query = bool(
            re.search(r"\b(?:which|what|muc tieu|thi nghiem nao)\b", fold(question))
        )
        if overview_query and metadata and not records:
            score = score * 2.5 + (20 if query_words & {"fuel", "objective", "hardware"} else 0)
        if "suppress" in query_words and "suppress" in words:
            score *= 2
            if "co2" in query_words and "co2" in words:
                score *= 2
        if len(passage.text) < 80:
            score *= 0.2
        return score

    ranking = sorted(ranking, key=relevance, reverse=True)
    hits = []
    seen = set()
    seen_text = set()
    seen_studies = set()
    for index, _score in ranking:
        if relevance((index, _score)) <= 0:
            continue
        p = candidates[index]
        normalized = fold(p.text)
        if normalized in seen_text or (not slugs and p.slug in seen_studies):
            continue
        seen_text.add(normalized)
        seen_studies.add(p.slug)
        if (p.source_document_id, p.locator) in seen:
            continue
        seen.add((p.source_document_id, p.locator))
        # A citation excerpt is an unchanged contiguous slice of its original chunk.
        start = 0
        if len(p.text) > 1800:
            matches = [
                m.start() for token in query for m in re.finditer(re.escape(token), fold(p.text))
            ]
            start = max(0, min(matches, default=0) - 150)
        hits.append(Hit(p, p.text[start : start + 1800]))
        if len(hits) == 4:
            break
    return tuple(hits)
