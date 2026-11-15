"""Import legacy root illustrations without replacing reviewed English pages.

Run from any directory: python3 scripts/sync_studio_examples.py
Three.js r128 is vendored separately in public/assets/vendor with its MIT license.
English Studio pages are maintained in public/studio/experiments. Translate a
newly imported legacy page there before publishing; later imports preserve it.
"""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "FlameInFreewall_Tourbillion/public"
EXAMPLES = {
    "mist": "MIST – Mô phỏng mồi lửa và dập tắt.html",
    "nca": "NCA_ lửa lan trên PMMA trong khe hẹp.html",
    "rtdfs": "RTDFS – lan lửa ngược dòng trên PMMA mỏng (3D).html",
    "smurf": "SMuRF_ lửa trên Trái Đất và trong vũ trụ.html",
    "gel-comparison": "SoFIE.html",
    "gel": "gel-simulation-v3.html",
}


def main() -> None:
    destination = PUBLIC / "studio/experiments"
    destination.mkdir(parents=True, exist_ok=True)
    for slug, filename in EXAMPLES.items():
        output = destination / f"{slug}.html"
        if output.exists() and re.search(
            r'<html\b[^>]*\blang=[\"\']en[\"\']', output.read_text()
        ):
            print(f"Preserved English {slug} (maintained in {output.relative_to(ROOT)})")
            continue
        text = (ROOT / filename).read_text()
        text = text.replace(
            '<html lang="vi">', f'<html lang="vi" data-theme="dark" data-studio-demo="{slug}">'
        )
        text = re.sub(
            r'<link\b[^>]*https://fonts\.googleapis\.com[^>]*>',
            '<link rel="stylesheet" href="/assets/fonts/inter.css">',
            text,
        ).replace('"Be Vietnam Pro"', 'Inter')
        text = text.replace(
            "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
            "/assets/vendor/three-r128.min.js",
        )
        text = text.replace("LOC-FS đo được", "LOC-FS trong mô phỏng")
        text = text.replace(
            "Nguy hiểm: thử nghiệm trên Trái Đất báo “an toàn” nhưng trong vũ trụ lửa vẫn cháy",
            "Trong mô phỏng: lửa tắt ở 1g và tiếp tục cháy ở μg",
        ).replace("vùng nguy hiểm", "vùng khác biệt mô phỏng")
        text = text.replace(
            "</head>",
            '<link rel="stylesheet" href="/assets/studio-experiment.css">'
            '<script src="/assets/studio-demo.js"></script></head>',
            1,
        )
        output.write_text(text)
        print(f"Published {slug} ← {filename}")


if __name__ == "__main__":
    main()
