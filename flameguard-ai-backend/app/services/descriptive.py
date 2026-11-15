import asyncio
import json
from collections import Counter, defaultdict
from pathlib import Path

from app.models import Investigation
from app.repositories.corpus import chunk_rows
from app.repositories.descriptive import descriptive_rows
from app.services.catalog import CatalogService
from app.services.corpus_policy import CorpusPolicyError, admit_passages, load_corpus_policy
from app.services.errors import Phase4Error


def describe_records(studies, runs, conditions, slugs):
    """Descriptive counts only; never combine values from separate source records."""
    by_run = defaultdict(lambda: defaultdict(list))
    for condition in conditions:
        by_run[condition.test_run_id][condition.variable].append(condition)
    counts = Counter(r.investigation_id for r in runs)
    points = []
    missing_oxygen = missing_pressure = incompatible = 0
    studies_by_id = {s.id: s for s in studies}
    for run in runs:
        values = by_run[run.id]
        oxygen = [c for c in values["oxygenPct"] if c.value_numeric is not None]
        pressure = [c for c in values["pressurePsi"] if c.value_numeric is not None]
        missing_oxygen += not oxygen
        missing_pressure += not pressure
        if not oxygen or not pressure:
            continue
        if (
            len(oxygen) != 1
            or len(pressure) != 1
            or oxygen[0].unit not in {"mole_percent", "volume_percent"}
            or pressure[0].unit != "psia"
            or not oxygen[0].value_numeric.is_finite()
            or not pressure[0].value_numeric.is_finite()
        ):
            incompatible += 1
            continue
        meanings = {c.value_text for c in values["oxygenContext"] if c.value_text}
        meaning = next(iter(meanings)) if len(meanings) == 1 else "unknown"
        if meaning not in {"chamber", "burner_oxidizer_stream"}:
            meaning = "unknown"
        points.append(
            {
                "runId": run.id,
                "investigationId": run.investigation_id,
                "slug": slugs.get(studies_by_id[run.investigation_id].psi_id),
                "oxygenPct": format(oxygen[0].value_numeric, "f"),
                "oxygenBasis": oxygen[0].unit,
                "pressurePsi": format(pressure[0].value_numeric, "f"),
                "pressureUnit": "psia",
                "oxygenMeaning": meaning,
            }
        )

    def bins(attribute):
        counter = Counter(getattr(r, attribute) or "not recorded" for r in runs)
        return [
            {"label": value, "count": n}
            for value, n in sorted(counter.items(), key=lambda item: (-item[1], item[0]))
        ]

    return {
        "investigationCount": len(studies),
        "recordCount": len(runs),
        "investigationDistribution": [
            {
                "investigationId": s.id,
                "psiId": s.psi_id,
                "slug": slugs.get(s.psi_id),
                "title": s.title,
                "count": counts[s.id],
            }
            for s in studies
        ],
        "materialDistribution": bins("material_type"),
        "gravityDistribution": bins("gravity"),
        "missingMaterial": sum(not r.material_type for r in runs),
        "missingGravity": sum(not r.gravity or r.gravity == "unknown" for r in runs),
        "missingOxygen": missing_oxygen,
        "missingPressure": missing_pressure,
        "oxygenRecordCount": len(runs) - missing_oxygen,
        "incompatibleConditions": incompatible,
        "conditionPoints": points,
        "platforms": sorted({s.platform for s in studies if s.platform}),
        "gravities": sorted({r.gravity for r in runs if r.gravity}),
    }


class DescriptiveService(CatalogService):
    async def descriptive(self, query):
        studies, runs, conditions = await descriptive_rows(self.session, query)
        return {
            **describe_records(studies, runs, conditions, self.slugs),
            "selection": {
                k: str(v) for k, v in query.model_dump(by_alias=True, exclude_none=True).items()
            },
            "selectionSemantics": (
                "All source records within investigations selected by catalog "
                "filters; not condition-matched records."
            ),
            "context": self.context,
        }

    async def overview(self, identity, settings):
        await self.require(Investigation, identity)
        try:
            path = settings.catalog_collection_manifest
            config = (
                await asyncio.to_thread(lambda: json.loads(Path(path).read_text("utf-8")))
                if path
                else {}
            )
            policy = await asyncio.to_thread(load_corpus_policy, path, config) if path else None
            if policy is None:
                raise CorpusPolicyError("Missing corpus declaration")
            passages = admit_passages(await chunk_rows(self.session, identity), policy)
        except (CorpusPolicyError, ValueError, OSError, TypeError):
            raise Phase4Error("COLLECTION_SCOPE_INVALID", 503) from None
        output = []
        for passage in sorted(passages, key=lambda p: (p.locator, str(p.chunk_id))):
            section = next(
                (
                    name
                    for name in ("objective", "approach", "researchImpacts")
                    if passage.locator.startswith(f"JSON /{name}")
                ),
                "catalog" if passage.locator.startswith("investigations/") else None,
            )
            if section:
                output.append(
                    {
                        "sourceDocumentId": passage.source_document_id,
                        "sourceUrl": policy.registry["sources"][str(passage.source_document_id)][
                            "sourceUrl"
                        ],
                        "locator": passage.locator,
                        "text": passage.text,
                        "section": section,
                    }
                )
        return {
            "investigationId": identity,
            "sourceRevision": policy.source_revision,
            "passages": output,
            "context": self.context,
        }
