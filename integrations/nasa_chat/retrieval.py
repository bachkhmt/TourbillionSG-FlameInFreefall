import re
import unicodedata
from dataclasses import dataclass
from uuid import UUID

from app.schemas.api.chat import Citation

from .bm25 import BM25

STOP = set(
    (
        "a an the what is are was were of to in on at for and or with does do how about "
        "this that it its which why can could tell me please la gi cua co cac nhung va "
        "ve thi sao toi ban mot hay cho biet nao nay hom gia con mau thuan "
        "conflicting conflict discrepant difference versus vs run test record"
    ).split()
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


def fold(text):
    text = text.lower().replace("đ", "d").replace("–", "-").replace("—", "-")
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))


def terms(text):
    tokens = [t for t in re.findall(r"[a-z0-9]+", fold(text)) if t not in STOP]
    return tokens + [
        m.group(1) for token in tokens if (m := re.fullmatch(r"([a-z]{4,})x\d+", token))
    ]


def refusal(question):
    query = fold(question)
    if len(set(re.findall(r"\bflex[- ]?(\d{3})\b", query))) > 1:
        return "Hãy hỏi từng mã FLEX một để tôi không trộn bằng chứng của hai lượt thử."
    if re.search(r"\bbass[- ]ii\b", query) and len(set(re.findall(r"\bb\d{1,5}\b", query))) > 1:
        return "Hãy hỏi từng mã BASS-II một để tôi không trộn bằng chứng của hai lượt thử."
    if re.search(r"\bsaffire[- ]iii\b", query) and len(set(re.findall(r"\bs\d{1,5}\b", query))) > 1:
        return "Hãy hỏi từng mã Saffire-III một để tôi không trộn bằng chứng của hai lượt thử."
    if len(set(re.findall(r"\b(?:run|test|record)\s*(?:#\s*)?([a-z]*\d[a-z0-9-]*)\b", query))) > 1:
        return "Hãy hỏi từng mã bản ghi một để tôi không trộn bằng chứng của hai lượt thử."
    if re.search(r"\b(safe|unsafe|an toan|certify|certified|xac suat chay)\b", query):
        return (
            "Không thể đưa ra kết luận an toàn hoặc chứng nhận từ bộ dữ liệu nghiên cứu này. "
            "Hãy hỏi về điều kiện thử hoặc nội dung nguồn cụ thể."
        )
    if re.search(r"\b(bitcoin|weather|thoi tiet|propulsion|stock price|gia co phieu)\b", query):
        return "Câu hỏi nằm ngoài bộ tài liệu nghiên cứu cháy NASA đang được kết nối."
    if (
        PLANETARY_CONDITIONS.search(query)
        or GRAVITY_UNIT.search(query)
        or (PLANETARY_GRAVITY.search(query) and not MASS_CONTEXT.search(query))
    ):
        return (
            "Không tìm thấy số đo phù hợp ở điều kiện trọng lực Sao Hỏa hoặc Mặt Trăng "
            "trong bộ dữ liệu đang kết nối. "
            "Có thể tra cứu các thí nghiệm vi trọng lực trong bộ này."
        )
    return None


@dataclass(frozen=True)
class Passage:
    chunk_id: UUID
    source_id: UUID
    investigation_id: UUID
    slug: str
    title: str
    locator: str
    text: str


@dataclass(frozen=True)
class Hit:
    passage: Passage
    excerpt: str

    @property
    def citation(self):
        return Citation(
            source_document_id=self.passage.source_id,
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
    ranking = BM25(documents).search(query, k=30)
    if not ranking:
        return ()
    hits = []
    seen = set()
    for index, _score in ranking:
        p = candidates[index]
        if (p.source_id, p.locator) in seen:
            continue
        seen.add((p.source_id, p.locator))
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
