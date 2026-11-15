import json
import os

import pytest
from app.main import create_app
from httpx import ASGITransport, AsyncClient

from integration_tests.chat_target import prepare_target, settings_for


@pytest.mark.integration
async def test_real_mission_http_and_release_tamper():
    url = os.environ.get("PHASE4_ADMIN_URL")
    if not url:
        pytest.skip("Separate approved PostgreSQL target not configured")
    target = await prepare_target(url)
    settings = settings_for(target)
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            for purpose in ["prevention", "detection", "suppression"]:
                response = await client.post(
                    "/api/v1/mission/research",
                    json={
                        "workflowId": purpose,
                        "question": "Research source context",
                        "scenario": {
                            "oxygenPct": 30,
                            "oxygenBasis": "volume_percent",
                            "pressurePsi": 10.2,
                            "airflowCmS": 5,
                            "gravityG": 0.16,
                            "material": "PMMA",
                        },
                    },
                )
                assert response.status_code == 200, response.text
                body = response.json()
                assert body["rows"] and body["citations"]
                assert all(row["conditionStatus"] != "exact" for row in body["rows"])
                assert all(
                    row["availability"]["independentlyReviewedRecords"] == 0 for row in body["rows"]
                )
            assert (
                await client.post(
                    "/api/v1/mission/research",
                    json={"workflowId": "detection", "question": "Smoke research", "scenario": {}},
                )
            ).status_code == 422
            assert (
                await client.post(
                    "/api/v1/mission/research",
                    json={
                        "workflowId": "detection",
                        "question": "Smoke research",
                        "revision": "unavailable",
                    },
                )
            ).status_code == 409
            config = json.loads(target["collection"].read_text())
            path = target["collection"].parent / config["researchPolicy"]["release"]
            path.write_bytes(path.read_bytes() + b" ")
            assert (
                await client.post(
                    "/api/v1/mission/research",
                    json={"workflowId": "detection", "question": "Smoke research"},
                )
            ).status_code == 503
