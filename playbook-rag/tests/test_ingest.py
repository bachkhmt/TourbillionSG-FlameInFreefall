import collections

from ragkit import ingest
from ragkit.config import Settings
from ragkit.text import fold


def test_playbook_ingest_has_every_chunk_type():
    chunks = ingest.build(Settings())
    types = collections.Counter(c["type"] for c in chunks)
    # Nếu playbook đổi cách khai báo biến JS (G, SRC, rows), parse sẽ rỗng và test này báo ngay.
    assert types["glossary"] >= 30 and types["source"] >= 30 and types["plan"] >= 10
    assert types["passage"] >= 40 and types["gap_note"] == 3


def test_ids_unique_and_schema():
    chunks = ingest.build(Settings())
    assert len({c["id"] for c in chunks}) == len(chunks)
    for c in chunks:
        assert {"id", "type", "section", "heading", "text", "contextual", "sourceRef", "status"} <= set(c)
        assert c["text"].strip()


def test_eval_table_is_not_indexed():
    text = fold(" ".join(c["text"] for c in ingest.build(Settings())))
    assert "cau hoi mau | ky vong" not in text and "nhien lieu ten lua chay the nao" not in text


def test_corpus_dir_is_ingested(tmp_path):
    (tmp_path / "ghi-chu.md").write_text("# Tiêu đề\n\nĐây là một đoạn ghi chú dài hơn sáu từ để thành chunk.", encoding="utf-8")
    chunks = ingest.corpus_chunks(tmp_path)
    assert len(chunks) == 1 and chunks[0]["id"].startswith("corpus-") and "ghi chú" in chunks[0]["text"]
