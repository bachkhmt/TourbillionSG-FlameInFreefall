from ragkit.guard import classify
from ragkit.validate import has_verdict, parse_json, validate_answer


def test_validator_drops_uncited_and_unknown_citations():
    obj = {"segments": [{"text": "A", "citations": ["c1"]}, {"text": "B", "citations": []},
                        {"text": "C", "citations": ["zzz"]}], "coverage": "full"}
    v = validate_answer(obj, {"c1"})
    assert v.ok and [s["text"] for s in v.segments] == ["A"] and v.dropped == 2


def test_validator_fails_when_nothing_survives():
    assert not validate_answer({"segments": [{"text": "A", "citations": ["x"]}]}, {"c1"}).ok
    assert not validate_answer(None, {"c1"}).ok


def test_verdict_text_is_dropped():
    assert has_verdict("This material is safe in the rover")
    assert has_verdict("That condition is unsafe")
    assert not has_verdict("The application never concludes whether a material is safe or unsafe")
    assert not has_verdict("The three pillars of fire safety include prevention, detection, suppression")
    obj = {"segments": [{"text": "This fabric is safe.", "citations": ["c1"]}]}
    assert not validate_answer(obj, {"c1"}).ok


def test_parse_json_handles_fences():
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json("not json") is None


def test_guard_intents():
    assert classify("Houston weather today?").off_topic
    assert classify("How does rocket fuel burn?").off_topic
    assert classify("Is fabric in rover 30% O₂ safe?").verdict
    g = classify("Is there combustion data in Moon gravity?")
    assert g.gap and not g.off_topic
    assert not classify("How much oxygen does the Moon base have?").gap
    assert not classify("What are the three pillars of fire safety?").verdict
