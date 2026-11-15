"""Bounded bilingual search vocabulary; normalization never changes source excerpts."""

import re
import unicodedata


def fold(text):
    text = text.lower().replace("đ", "d").replace("–", "-").replace("—", "-")
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))


def language(text):
    vietnamese = set("ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ")
    if vietnamese.intersection(text.lower()):
        return "vi"
    words = set(fold(text).split())
    return (
        "vi"
        if len(
            words
            & {
                "thi",
                "nghiem",
                "nao",
                "cua",
                "nhien",
                "lieu",
                "duong",
                "kinh",
                "khong",
                "trong",
                "voi",
                "du",
                "sanh",
            }
        )
        >= 2
        else "en"
    )


# Match complete phrases, longest first. Avoid unbounded stemming of identifiers.
CONCEPTS = {
    "co2": ("carbon dioxide", "cacbon dioxit", "co₂"),
    "helium": ("heli",),
    "sf6": ("sulfur hexafluoride", "sulphur hexafluoride", "sf₆"),
    "n2": ("nitrogen", "nito"),
    "oxygen": ("o2", "o₂", "oxy", "oxi"),
    "suppress": (
        "suppression",
        "suppressants",
        "suppressant",
        "suppressing",
        "extinguishment",
        "extinguished",
        "extinguish",
        "extinguishing",
        "dap lua",
        "dap tat",
        "chua chay",
    ),
    "detect": ("detection", "detectors", "detector", "detecting", "phat hien"),
    "spread": ("spreading", "lan truyen", "lan lua"),
    "fuel": ("fuels", "nhien lieu"),
    "droplet": ("droplets", "giot"),
    "flammability": ("kha nang chay",),
    "objective": ("objectives", "purpose", "goals", "goal", "muc tieu"),
    "smoke": ("khoi",),
    "pressure": ("ap suat",),
    "diameter": ("duong kinh",),
    "hardware": ("phan cung",),
    "gas": ("gaseous", "gases", "khi"),
    "solid": ("ran",),
    "flame": ("ngon lua",),
    "inverse": ("nguoc",),
    "pmma": ("polymethyl methacrylate", "acrylic"),
}
PATTERNS = sorted(
    ((alias, key) for key, aliases in CONCEPTS.items() for alias in aliases),
    key=lambda item: -len(item[0]),
)
STOP = set(
    (
        "a an the what is are was were of to in on at for and or with does do how about "
        "this that it its which why can could tell me please la gi cua co cac nhung va "
        "ve thi sao toi ban mot hay cho biet nao nay hom gia con mau thuan "
        "conflicting conflict discrepant difference versus vs compare so "
        "sanh khac nhau run test record "
        "nghiem bang hoac nhu the duoc trong tai tren experiment "
        "experiments investigation investigations "
        "study studies studied research used use using did have has had "
        "measured measurements du lieu he she his her they their"
    ).split()
)


def terms(text):
    # English pronoun 'he' is never a gas. Chemical symbol is accepted only with gas context.
    if re.search(r"\b(?:CO2|N2|SF6|gas|gases|fraction|mixture|composition|helium)\b", text, re.I):
        text = re.sub(r"\bHe\b", "helium", text)
    text = fold(text)
    for alias, key in PATTERNS:
        text = re.sub(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", key, text)
    tokens = [t for t in re.findall(r"[a-z0-9]+", text) if t not in STOP]
    return tokens + [m[1] for t in tokens if (m := re.fullmatch(r"([a-z]{4,})x\d+", t))]


MESSAGES = {
    "mixed": {
        "en": (
            "Please ask about one test record at a time so evidence from "
            "different runs is not combined."
        ),
        "vi": "Hãy hỏi từng mã bản ghi một để tôi không trộn bằng chứng của các lượt thử.",
    },
    "safety": {
        "en": (
            "This research dataset cannot establish safety or provide "
            "certification. Ask about a specific test condition or source "
            "passage."
        ),
        "vi": (
            "Không thể đưa ra kết luận an toàn hoặc chứng nhận từ bộ dữ liệu "
            "nghiên cứu này. Hãy hỏi về điều kiện thử hoặc nội dung nguồn cụ "
            "thể."
        ),
    },
    "outside": {
        "en": "The question is outside the connected NASA combustion research corpus.",
        "vi": "Câu hỏi nằm ngoài bộ tài liệu nghiên cứu cháy NASA đang được kết nối.",
    },
    "gravity": {
        "en": (
            "No matching measurements at Mars or Moon gravity were found in "
            "the connected dataset. You can search its microgravity "
            "experiments."
        ),
        "vi": (
            "Không tìm thấy số đo phù hợp ở điều kiện trọng lực Sao Hỏa hoặc "
            "Mặt Trăng trong bộ dữ liệu đang kết nối. Có thể tra cứu các thí "
            "nghiệm vi trọng lực trong bộ này."
        ),
    },
    "aggregate": {
        "en": (
            "This assistant quotes source passages and cannot compute "
            "aggregates across records. Open Explorer to filter "
            "investigations, or ask about a specific source or test record."
        ),
        "vi": (
            "Không thể tính tổng hợp qua các bản ghi bằng trợ lý trích nguồn "
            "này. Hãy mở Explorer để lọc thí nghiệm hoặc hỏi một nguồn hay mã "
            "lượt thử cụ thể."
        ),
    },
    "found": {
        "en": (
            "Source excerpts follow. Original units and differing values are preserved by source:"
        ),
        "vi": (
            "Tìm thấy các trích đoạn nguồn sau. Giữ nguyên đơn vị và các giá "
            "trị khác nhau theo từng nguồn:"
        ),
    },
    "missing": {
        "en": (
            "No matching evidence was found in the current corpus. Specify an "
            "investigation, test record or parameter."
        ),
        "vi": (
            "Không tìm thấy bằng chứng phù hợp trong corpus hiện tại. Hãy nêu "
            "tên thí nghiệm, mã run hoặc thông số cụ thể."
        ),
    },
}


def message(key, question, lang=None):
    """Framing text in the requested language; detect from the question when unset."""
    return MESSAGES[key][lang or language(question)]
