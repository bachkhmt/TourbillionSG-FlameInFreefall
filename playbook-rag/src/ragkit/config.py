from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


@dataclass
class Settings:
    data_dir: Path = ROOT / "data"
    source_html: Path = ROOT / "data" / "source" / "Flame_in_Freefall_Playbook.html"
    corpus_dir: Path = ROOT / "data" / "corpus"
    top_k: int = 6
    timeout_s: float = 15.0
    rate_limit: int = 20  # số request / phút / IP
    embedder: str = "hash"  # "hash" | "st:<model>" | "" (tắt vector)
    llm_model: str = "claude-sonnet-5-5"

    @classmethod
    def from_env(cls) -> Settings:
        s = cls()
        s.data_dir = Path(os.getenv("RAG_DATA_DIR", s.data_dir))
        s.corpus_dir = Path(os.getenv("RAG_CORPUS_DIR", s.corpus_dir))
        s.top_k = int(os.getenv("RAG_TOP_K", s.top_k))
        s.timeout_s = float(os.getenv("RAG_TIMEOUT_S", s.timeout_s))
        s.rate_limit = int(os.getenv("RAG_RATE_LIMIT", s.rate_limit))
        s.embedder = os.getenv("RAG_EMBEDDER", s.embedder)
        s.llm_model = os.getenv("RAG_LLM_MODEL", s.llm_model)
        return s
