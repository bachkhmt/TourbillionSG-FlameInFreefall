"""Optional LLM. Without an API key, the pipeline automatically falls back to retrieval-only mode."""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Protocol

from .config import Settings


class LLM(Protocol):
    def complete(self, system: str, user: str, timeout: float) -> str: ...


class AnthropicLLM:
    URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str, max_tokens: int = 900):
        self.api_key, self.model, self.max_tokens = api_key, model, max_tokens

    def complete(self, system: str, user: str, timeout: float) -> str:
        body = json.dumps({
            "model": self.model, "max_tokens": self.max_tokens, "temperature": 0,
            "system": system, "messages": [{"role": "user", "content": user}],
        }).encode()
        req = urllib.request.Request(self.URL, data=body, headers={
            "content-type": "application/json", "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
        return "".join(b.get("text", "") for b in data.get("content", []))


def from_env(settings: Settings | None = None) -> LLM | None:
    s = settings or Settings.from_env()
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key or os.getenv("RAG_OFFLINE") == "1":
        return None
    return AnthropicLLM(key, s.llm_model)


SYSTEM = """You are a question-answering assistant for a small document repository. Mandatory rules:
1. Only use information in the provided CHUNKS. Do not use external knowledge.
2. Every sentence in the answer must include at least one supporting chunk id.
3. Never conclude that a material or condition is "safe" or "unsafe".
4. If evidence is lacking, set coverage to "none" or "partial" and state the missing part in "missing".
5. Do not interpolate data for conditions not measured in the chunks (e.g., lunar gravity).
6. Return only valid JSON matching the schema, with no additional text outside the JSON:
{"segments":[{"text":"...","citations":["chunk_id"]}],"coverage":"full|partial|none","missing":["..."]}"""


def build_prompt(question: str, chunks: list[dict], mode: str, scenario: str | None) -> str:
    style = ("Explain simply, expand abbreviations." if mode == "student"
             else "Concise, precise technical terminology.")
    ctx = "\n\n".join(f"[{c['id']}] {c['text']}" for c in chunks)
    sc = f"User-selected scenario: {scenario}\n" if scenario else ""
    return f"{sc}Style: {style}\n\nCHUNK:\n{ctx}\n\nQUESTION: {question}"
