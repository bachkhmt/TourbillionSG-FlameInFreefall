import collections

from ragkit import ingest
from ragkit.config import Settings
from ragkit.text import fold


def test_playbook_ingest_has_every_chunk_type():
    chunks = ingest.build(Settings())
    types = collections.Counter(c["type"] for c in chunks)
    # If the playbook changes how JS variables (G, SRC, rows) are declared, parsing will be empty and this test will fail immediately.
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
    assert "sample questions | expected" not in text and "how does rocket fuel burn" not in text


def test_corpus_dir_is_ingested(tmp_path):
    (tmp_path / "notes.md").write_text("# Title\n\nThis is a note paragraph longer than six words to become a chunk.", encoding="utf-8")
    chunks = ingest.corpus_chunks(tmp_path)
    assert len(chunks) == 1 and chunks[0]["id"].startswith("corpus-") and "note" in chunks[0]["text"]
