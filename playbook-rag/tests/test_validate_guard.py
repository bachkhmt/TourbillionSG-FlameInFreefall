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
    assert has_verdict("Vật liệu này là an toàn trong rover")
    assert has_verdict("Điều kiện đó không an toàn")
    assert not has_verdict("Ứng dụng không bao giờ kết luận vật liệu là an toàn hoặc không an toàn")
    assert not has_verdict("Ba trụ cột an toàn cháy gồm phòng ngừa, phát hiện, dập lửa")
    obj = {"segments": [{"text": "Vải này là an toàn.", "citations": ["c1"]}]}
    assert not validate_answer(obj, {"c1"}).ok


def test_parse_json_handles_fences():
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json("không phải json") is None


def test_guard_intents():
    assert classify("Thời tiết Houston hôm nay?").off_topic
    assert classify("Nhiên liệu tên lửa cháy thế nào?").off_topic
    assert classify("Vải trong rover 30% O₂ có an toàn không?").verdict
    g = classify("Có dữ liệu cháy ở trọng lực Mặt Trăng không?")
    assert g.gap and not g.off_topic
    assert not classify("Căn cứ Mặt Trăng có oxy bao nhiêu?").gap
    assert not classify("Ba trụ cột an toàn cháy là gì?").verdict
