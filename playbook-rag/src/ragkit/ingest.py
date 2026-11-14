"""HTML/Markdown/TXT -> chunks.json.

Chunk loại: passage (đoạn văn), glossary, source, plan (lấy từ mảng JS của playbook),
gap_note (viết tay trong data/gap_notes.json). Mỗi chunk có id, section, heading, text,
contextual (tiền tố ngữ cảnh sinh bằng quy tắc, không cần LLM) và sourceRef.
"""
from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path

from .config import Settings
from .text import slug, split_sentences

SKIP = {"script", "style", "svg", "pre", "nav", "button", "head", "noscript"}
BLOCK = {"p", "div", "li", "tr", "h1", "h2", "h3", "h4", "dt", "dd", "section", "header",
         "footer", "figure", "blockquote", "summary", "details", "ul", "ol", "table"}
MAX_WORDS, MIN_WORDS = 200, 40

Block = tuple[str, str, str, str]  # (section_id, h2, h3, text)


class _Extractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[Block] = []
        self.sec, self.h2, self.h3 = "doc", "", ""
        self.buf: list[str] = []
        self.skip_tag: str | None = None
        self.skip_depth = 0
        self.in_head: str | None = None
        self.head_buf: list[str] = []

    def _flush(self) -> None:
        text = re.sub(r"\s+", " ", "".join(self.buf)).strip(" |")
        self.buf = []
        if len(text) >= 3:
            self.blocks.append((self.sec, self.h2, self.h3, text))

    def handle_starttag(self, tag, attrs):
        if self.skip_tag:
            if tag == self.skip_tag:
                self.skip_depth += 1
            return
        if tag in SKIP:
            self.skip_tag, self.skip_depth = tag, 1
            return
        if tag in BLOCK:
            self._flush()
        if tag == "section":
            self.sec = dict(attrs).get("id") or self.sec
        if tag in ("h2", "h3"):
            self.in_head, self.head_buf = tag, []
        if tag == "br":
            self.buf.append(" ")

    def handle_endtag(self, tag):
        if self.skip_tag:
            if tag == self.skip_tag:
                self.skip_depth -= 1
                if self.skip_depth == 0:
                    self.skip_tag = None
            return
        if tag in ("td", "th"):
            self.buf.append(" | ")
        if tag in ("h2", "h3") and self.in_head == tag:
            title = re.sub(r"\s+", " ", "".join(self.head_buf)).strip()
            if tag == "h2":
                self.h2, self.h3 = title, ""
            else:
                self.h3 = title
            self.in_head, self.buf = None, []
            return
        if tag in BLOCK:
            self._flush()

    def handle_data(self, data):
        if self.skip_tag:
            return
        (self.head_buf if self.in_head else self.buf).append(data)


def html_blocks(html: str) -> list[Block]:
    p = _Extractor()
    p.feed(html)
    p._flush()
    return p.blocks


def text_blocks(text: str, sec: str, markdown: bool) -> list[Block]:
    blocks: list[Block] = []
    h2 = h3 = ""
    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        if not para:
            continue
        m = re.match(r"(#{1,6})\s+(.*)", para) if markdown else None
        if m and "\n" not in para:
            if len(m.group(1)) <= 2:
                h2, h3 = m.group(2), ""
            else:
                h3 = m.group(2)
            continue
        blocks.append((sec, h2, h3, re.sub(r"\s+", " ", para)))
    return blocks


def chunk_blocks(blocks: list[Block], doc_title: str, doc_url: str) -> list[dict]:
    """Gom các block cùng tiêu đề thành chunk ~100-200 từ, tách theo câu nếu quá dài."""
    groups: dict[tuple, list[str]] = {}
    for sec, h2, h3, text in blocks:
        groups.setdefault((sec, h2, h3), []).append(text)
    chunks, counter = [], {}
    for (sec, h2, h3), texts in groups.items():
        pieces: list[str] = []
        for t in texts:
            pieces.extend(_split_long(t))
        cur: list[str] = []
        parts: list[list[str]] = []
        for piece in pieces:
            if cur and sum(len(x.split()) for x in cur) + len(piece.split()) > MAX_WORDS:
                parts.append(cur)
                cur = []
            cur.append(piece)
        if cur:
            if parts and sum(len(x.split()) for x in cur) < MIN_WORDS:
                parts[-1].extend(cur)
            else:
                parts.append(cur)
        for part in parts:
            if sum(len(x.split()) for x in part) < 6:  # nhãn/eyebrow lẻ, không đáng làm chunk
                continue
            counter[sec] = counter.get(sec, 0) + 1
            heading = h3 or h2
            chunks.append({
                "id": f"{slug(sec)}-{counter[sec]:02d}",
                "type": "passage",
                "section": sec,
                "heading": heading,
                "text": " ".join(part),
                "contextual": " > ".join(x for x in (doc_title, h2, h3) if x),
                "sourceRef": {"title": f"{doc_title}: {heading or sec}", "url": f"{doc_url}#{sec}"},
                "status": "source-text",
            })
    return chunks


def _split_long(text: str) -> list[str]:
    if len(text.split()) <= MAX_WORDS:
        return [text]
    out, cur = [], ""
    for s in split_sentences(text):
        if cur and len((cur + " " + s).split()) > MAX_WORDS:
            out.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    return out + ([cur] if cur else [])


def _js_array(js: str, name: str) -> list:
    """Lấy `var NAME=[ ... ];` trong script của playbook và parse bằng JSON."""
    m = re.search(rf"var {name}=\[(.*?)\n\];", js, re.DOTALL)
    if not m:
        return []
    raw = m.group(1).replace('N.replace("citations/","api/citations/")+"',
                             '"https://ntrs.nasa.gov/api/citations/')
    raw = raw.replace('N+"', '"https://ntrs.nasa.gov/citations/')
    raw = re.sub(r"\[\s*\n", "[", raw)
    try:
        return json.loads(f"[{raw}]")
    except json.JSONDecodeError:
        return []


def drop_eval_leak(blocks: list[Block]) -> list[Block]:
    """Bảng "Bộ câu hỏi mẫu" chứa cả câu hỏi lẫn đáp án. Để nó trong chỉ mục thì Recall@5 đẹp giả
    (truy xuất ra đúng câu hỏi chứ không phải nội dung). Bỏ các dòng bảng cho tới "Chỉ số và mục tiêu"."""
    out, in_qa = [], False
    for b in blocks:
        if b[2] == "Bộ câu hỏi mẫu":
            if b[3].startswith("Chỉ số và mục tiêu"):
                in_qa = False
            elif "|" in b[3] and not b[3].startswith("Chỉ số |"):
                in_qa = True if b[3].startswith("Câu hỏi mẫu") or in_qa else in_qa
            if in_qa and "|" in b[3]:
                continue
        out.append(b)
    return out


def playbook_chunks(path: Path) -> list[dict]:
    html = path.read_text(encoding="utf-8")
    title = "Flame in Freefall Playbook"
    chunks = chunk_blocks(drop_eval_leak(html_blocks(html)), title, path.name)
    js = "\n".join(re.findall(r"<script[^>]*>(.*?)</script>", html, re.DOTALL))
    status = {"ok": "link-confirmed", "chk": "needs-check", "unk": "unconfirmed"}
    seen: dict[str, int] = {}
    for term, desc in _js_array(js, "G"):
        seen[slug(term)] = seen.get(slug(term), 0) + 1
        suffix = "" if seen[slug(term)] == 1 else f"-{seen[slug(term)]}"
        chunks.append({
            "id": f"gl-{slug(term)}{suffix}", "type": "glossary", "section": "de-bai", "heading": term,
            "text": f"{term}: {desc}", "contextual": f"{title} > Từ điển các từ viết tắt",
            "sourceRef": {"title": f"{title}: Từ điển ({term})", "url": f"{path.name}#de-bai"},
            "status": "source-text"})
    for i, row in enumerate(_js_array(js, "SRC"), 1):
        group, name, url, kind, st, note = (list(row) + [""] * 6)[:6]
        chunks.append({
            "id": f"src-{i:02d}", "type": "source", "section": "du-lieu", "heading": name,
            "text": f"{name} (nhóm {group}). {note}".strip(),
            "contextual": f"{title} > Danh sách link nguồn > {group}",
            "sourceRef": {"title": name, "url": url}, "status": status.get(st, "unconfirmed"),
            "storage": kind})
    for i, (level, feat, hours, people) in enumerate(_js_array(js, "rows"), 1):
        who = "; ".join(f"{p} {r}".strip() for p, r in people) or "chưa giao"
        chunks.append({
            "id": f"plan-{i:02d}", "type": "plan", "section": "ke-hoach", "heading": feat,
            "text": f"[{level}] {feat}. Giờ công ước lượng: {hours}. Người làm: {who}.",
            "contextual": f"{title} > Kế hoạch 48 giờ > Danh sách tính năng",
            "sourceRef": {"title": f"{title}: Kế hoạch", "url": f"{path.name}#ke-hoach"},
            "status": "source-text"})
    return chunks


def load_gap_notes(data_dir: Path) -> list[dict]:
    f = data_dir / "gap_notes.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else []


def corpus_chunks(corpus_dir: Path) -> list[dict]:
    chunks: list[dict] = []
    for f in sorted(corpus_dir.glob("*")):
        if f.suffix.lower() not in {".md", ".txt", ".html"}:
            continue
        raw = f.read_text(encoding="utf-8", errors="ignore")
        sec = slug(f.stem)
        blocks = html_blocks(raw) if f.suffix.lower() == ".html" else text_blocks(
            raw, sec, f.suffix.lower() == ".md")
        for c in chunk_blocks(blocks, f.stem, f.name):
            c["id"] = f"corpus-{c['id']}"
            chunks.append(c)
    return chunks


def build(settings: Settings | None = None) -> list[dict]:
    s = settings or Settings.from_env()
    chunks: list[dict] = []
    if s.source_html.exists():
        chunks += playbook_chunks(s.source_html)
    chunks += load_gap_notes(s.data_dir)
    chunks += corpus_chunks(s.corpus_dir)
    ids = [c["id"] for c in chunks]
    assert len(ids) == len(set(ids)), "id chunk bị trùng"
    return chunks


def save(chunks: list[dict], settings: Settings | None = None) -> Path:
    s = settings or Settings.from_env()
    out = s.data_dir / "chunks.json"
    out.write_text(json.dumps(chunks, ensure_ascii=False, indent=1), encoding="utf-8")
    return out


def load_or_build(settings: Settings | None = None) -> list[dict]:
    s = settings or Settings.from_env()
    f = s.data_dir / "chunks.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    return build(s)
