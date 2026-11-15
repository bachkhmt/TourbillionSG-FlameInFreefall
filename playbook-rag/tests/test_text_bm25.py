from ragkit.bm25 import BM25
from ragkit.text import analyze, fold


def test_fold_removes_diacritics_and_subscripts():
    assert fold("Mặt Trăng, CO₂ và Đề") == "mat trang, co2 va de"


def test_analyze_keeps_hyphen_parts_and_bigrams():
    t = analyze("Saffire-II kiểm giới hạn oxy")
    assert "saffire-ii" in t and "saffire" in t and "gioi_han" in t


def test_bm25_ranks_rare_term_first():
    docs = [analyze(x) for x in ["lua cau xanh", "dap lua flex co2", "khoi aerosol same"]]
    top = BM25(docs).search(analyze("flex"), 3)
    assert top[0][0] == 1 and len(top) == 1
