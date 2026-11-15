"""Exercise the real WebGL studio with Edge; saves rendered PNGs and responsive views.

Install playwright and pillow, start ragkit serve, then run:
python scripts/check_flame_studio.py --url http://127.0.0.1:8000 --out /path/to/artifacts
"""
import argparse
import io
from pathlib import Path

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import expect, sync_playwright


def changed(first: bytes, second: bytes) -> bool:
    diff = ImageChops.difference(Image.open(io.BytesIO(first)).convert("RGB"),
                                 Image.open(io.BytesIO(second)).convert("RGB"))
    # Measure changed subject pixels, without diluting the result across the black stage.
    red, green, blue = diff.split()
    maximum = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    significant = sum(maximum.histogram()[9:])
    return significant > diff.width * diff.height * .001


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    parser.add_argument("--out", type=Path, default=Path(".taste-skill/flame/qa"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 960}, reduced_motion="reduce")
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error"
                and "404" not in message.text else None)
        page.goto(args.url + "/flame", wait_until="networkidle")
        expect(page.locator("#capture")).to_be_enabled()
        expect(page.locator("#fallback")).to_be_hidden()
        expect(page.locator("#pause")).to_have_attribute("aria-pressed", "true")
        page.wait_for_timeout(400)

        def export(name: str) -> bytes:
            with page.expect_download() as download:
                page.locator("#capture").click()
            path = args.out / name
            download.value.save_as(path)
            image = Image.open(path).convert("RGB")
            assert image.width > 500 and image.height > 500
            assert max(ImageStat.Stat(image).mean) > 8, "Export is blank"
            return path.read_bytes()

        blue = export("flame-dome-blue.png")
        page.screenshot(path=str(args.out / "studio-desktop.png"))
        assert not changed(blue, export("flame-dome-paused.png")), "Paused scene moves"
        # A photographed candle envelope has a bright edge and a dim center, not a white plasma core.
        blue_image = Image.open(io.BytesIO(blue)).convert("RGB")
        w, h = blue_image.size
        center = blue_image.getpixel((int(w*.50), int(h*.43)))
        rim = blue_image.getpixel((int(w*.50), int(h*.34)))
        assert center[0] < 25 and center[2] < rim[2]*.85, "Blue envelope has become an opaque bright core"
        page.locator('[data-palette="amber"]').click()
        amber = export("flame-dome-amber.png")
        assert changed(blue, amber), "Palette changes do not reach the renderer"
        blue_mean = ImageStat.Stat(Image.open(io.BytesIO(blue)).convert("RGB")).mean
        amber_mean = ImageStat.Stat(Image.open(io.BytesIO(amber)).convert("RGB")).mean
        assert blue_mean[2] > blue_mean[0] * 1.2
        assert amber_mean[0] > amber_mean[2] * 1.2
        page.locator('[data-shape="drop"]').click()
        drop = export("flame-drop-amber.png")
        assert changed(amber, drop), "Shape does not change the rendered volume"
        page.locator("#morph").focus()
        page.keyboard.press("Home")
        for _ in range(50):
            page.keyboard.press("ArrowRight")
        expect(page.locator("#morph-value")).to_have_text("50%")
        expect(page.locator('[data-shape="sphere"]')).to_have_attribute("aria-pressed", "false")
        assert changed(drop, export("flame-morph.png"))
        page.locator("#custom-color").evaluate("el=>{el.value='#00ff44';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        custom = export("flame-custom.png")
        expect(page.locator("#palette-name")).to_have_text("Custom")
        assert changed(drop, custom)
        page.locator("#scene").focus()
        # Yawing an axisymmetric candle barely changes its silhouette; tilt to verify the 3D view.
        for _ in range(4):
            page.keyboard.press("ArrowUp")
        page.wait_for_timeout(500)
        assert changed(custom, export("flame-orbit.png")), "Keyboard orbit does not change the view"
        page.locator("#quality").select_option("low")
        expect(page.locator("#render-status")).to_have_text("Performance mode")
        page.locator('[data-shape="drop"]').click()
        page.locator('[data-palette="amber"]').click()
        page.locator("#turbulence").focus()
        page.keyboard.press("End")
        page.locator("#pause").click()
        page.wait_for_timeout(800)
        moving = export("flame-moving.png")
        page.wait_for_timeout(800)
        assert changed(moving, export("flame-moving-next.png")), "Simulation time is not advancing"

        for width in (768, 390, 320):
            page.set_viewport_size({"width": width, "height": 844})
            page.wait_for_timeout(300)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Horizontal overflow"
            expect(page.locator("#controls")).not_to_be_visible()
            page.locator("#open-controls").click()
            expect(page.locator("#controls")).to_have_attribute("aria-modal", "true")
            expect(page.locator("#close-controls")).to_be_focused()
            page.screenshot(path=str(args.out / f"studio-controls-{width}.png"))
            page.keyboard.press("Escape")
            expect(page.locator("#open-controls")).to_be_focused()
            page.screenshot(path=str(args.out / f"studio-{width}.png"))

        fallback = context.new_page()
        fallback.add_init_script("""const get=HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext=function(type,...args){
            return type==='webgl2'?null:get.call(this,type,...args);
          };""")
        fallback.goto(args.url + "/flame", wait_until="networkidle")
        expect(fallback.locator("#fallback")).to_be_visible()
        expect(fallback.locator("#capture")).to_be_disabled()
        assert fallback.locator("#fallback img").evaluate("img=>img.complete && img.naturalWidth>0")
        fallback.screenshot(path=str(args.out / "studio-fallback.png"))
        assert not errors, errors
        browser.close()
    print("PASS: WebGL, color/shape pixels, custom color, orbit, pause/motion, PNG, quality, mobile, fallback")


if __name__ == "__main__":
    main()
