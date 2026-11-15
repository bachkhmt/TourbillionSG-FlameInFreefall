from ragkit.bm25 import BM25
from ragkit.text import analyze, fold


def test_fold_removes_diacritics_and_subscripts():
    assert fold("Moon, CO₂ and Topic") == "moon, co2 and topic"


def test_analyze_keeps_hyphen_parts_and_bigrams():
    t = analyze("Saffire-II checks oxygen limit")
    assert "saffire-ii" in t and "saffire" in t and "oxygen_limit" in t


def test_bm25_ranks_rare_term_first():
    docs = [analyze(x) for x in ["blue spherical flame", "suppress flame flex co2", "smoke aerosol same"]]
    top = BM25(docs).search(analyze("flex"), 3)
    assert top[0][0] == 1 and len(top) == 1
