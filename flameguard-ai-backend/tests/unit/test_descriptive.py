from decimal import Decimal
from types import SimpleNamespace as Row
from uuid import uuid4

from app.services.descriptive import describe_records


def test_descriptive_counts_unknowns_zero_and_same_record_pairs():
    study = Row(id=uuid4(), psi_id="PSI-TEST", title="TEST_ONLY", platform=None)
    a, b, c = [
        Row(id=uuid4(), investigation_id=study.id, material_type=value, gravity=gravity)
        for value, gravity in [(None, None), ("Fuel", "microgravity"), ("Fuel", "unknown")]
    ]

    def condition(run, variable, value=None, unit=None, text=None):
        return Row(
            test_run_id=run.id,
            variable=variable,
            value_numeric=Decimal(value) if value is not None else None,
            unit=unit,
            value_text=text,
        )

    conditions = [
        condition(a, "oxygenPct", "0", "mole_percent"),
        condition(a, "pressurePsi", "1", "psia"),
        condition(a, "oxygenContext", text="chamber"),
        condition(b, "oxygenPct", "21", "volume_percent"),
        condition(c, "pressurePsi", "2", "psia"),
    ]
    result = describe_records([study], [a, b, c], conditions, {"PSI-TEST": "test"})
    assert result["recordCount"] == 3
    assert sum(x["count"] for x in result["materialDistribution"]) == 3
    assert sum(x["count"] for x in result["gravityDistribution"]) == 3
    assert result["missingOxygen"] == 1 and result["missingPressure"] == 1
    assert result["oxygenRecordCount"] == 2
    assert len(result["conditionPoints"]) == 1
    assert result["conditionPoints"][0]["oxygenPct"] == "0"
    assert result["conditionPoints"][0]["oxygenMeaning"] == "chamber"


def test_ambiguous_duplicate_conditions_are_not_selected_arbitrarily():
    study = Row(id=uuid4(), psi_id="PSI-TEST", title="TEST_ONLY", platform=None)
    run = Row(id=uuid4(), investigation_id=study.id, material_type=None, gravity=None)
    conditions = [
        Row(
            test_run_id=run.id,
            variable="oxygenPct",
            value_numeric=Decimal(x),
            unit="mole_percent",
            value_text=None,
        )
        for x in ("20", "30")
    ]
    conditions.append(
        Row(
            test_run_id=run.id,
            variable="pressurePsi",
            value_numeric=Decimal("1"),
            unit="psia",
            value_text=None,
        )
    )
    result = describe_records([study], [run], conditions, {})
    assert not result["conditionPoints"] and result["incompatibleConditions"] == 1
