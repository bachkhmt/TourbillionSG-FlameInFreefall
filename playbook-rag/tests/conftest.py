import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
os.environ["RAG_OFFLINE"] = "1"

import pytest

from ragkit.pipeline import RagPipeline


@pytest.fixture(scope="session")
def pipe():
    return RagPipeline.from_settings(llm=None)
