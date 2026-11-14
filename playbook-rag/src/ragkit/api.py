"""FastAPI: POST /api/ask theo hợp đồng của playbook (answer.segments, coverage, missing, meta)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .cache import RateLimiter
from .config import ROOT, Settings
from .pipeline import RagPipeline


class AskIn(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    scenarioId: str | None = None
    mode: Literal["engineer", "student"] = "engineer"


def create_app(pipeline: RagPipeline | None = None, limiter: RateLimiter | None = None) -> FastAPI:
    settings = Settings.from_env()
    app = FastAPI(title="ragkit", version="0.1.0")
    app.mount("/assets", StaticFiles(directory=Path(ROOT) / "web" / "assets"), name="assets")

    # Cho phép CORS cho frontend tĩnh hoặc live demo
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    state: dict = {"pipe": pipeline, "limiter": limiter or RateLimiter(settings.rate_limit)}

    def pipe() -> RagPipeline:
        if state["pipe"] is None:
            state["pipe"] = RagPipeline.from_settings(settings)
        return state["pipe"]

    @app.get("/api/health")
    def health() -> dict:
        p = pipe()
        return {"ok": True, "chunks": len(p.chunks), "llm": p.llm is not None}

    @app.get("/api/scenarios")
    def scenarios() -> dict:
        return pipe().scenarios

    @app.get("/api/investigations")
    def investigations() -> list[dict]:
        inv_file = settings.data_dir / "investigations.json"
        if inv_file.exists():
            try:
                return json.loads(inv_file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                return []
        return []

    @app.post("/api/ask")
    def ask(body: AskIn, request: Request) -> dict:
        ip = request.client.host if request.client else "unknown"
        if not state["limiter"].allow(ip):
            raise HTTPException(429, "Quá nhiều yêu cầu, thử lại sau một phút.")
        return pipe().answer(body.question, body.scenarioId, body.mode)

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(Path(ROOT) / "web" / "index.html")

    @app.get("/flame")
    def flame_studio() -> FileResponse:
        return FileResponse(Path(ROOT) / "web" / "flame.html")

    @app.get("/sources/{filename}")
    def source_document(filename: str) -> FileResponse:
        """Open only the Playbook or an ingested, top-level corpus document."""
        if filename == settings.source_html.name and settings.source_html.is_file():
            return FileResponse(settings.source_html)
        if any(char in filename for char in ("/", "\\", ":")):
            raise HTTPException(404, "Không tìm thấy tài liệu nguồn.")
        corpus = settings.corpus_dir.resolve()
        candidate = (corpus / filename).resolve()
        if (candidate.parent != corpus or candidate.suffix.lower() not in {".html", ".md", ".txt"}
                or not candidate.is_file()):
            raise HTTPException(404, "Không tìm thấy tài liệu nguồn.")
        return FileResponse(candidate)

    return app


app = create_app()
