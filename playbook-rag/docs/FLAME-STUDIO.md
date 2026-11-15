# 3D Flame Observation Chamber

Open `/flame` after running `python -m ragkit serve`. The research repository contains a **3D Flame** link.
The page uses Three.js 0.186.1 and WebGL 2, without runtime API calls or CDN downloads.

## Usage

- **Teardrop / Dome** selects two reference shapes; **Morph** transitions continuously.
- Four preset colors and a **+** button to choose any custom color, independent of shape.
- Drag or swipe to rotate; scroll/pinch to zoom. Arrow keys rotate, `+`/`-` zoom, `Home` resets.
- Adjust oscillation, brightness, auto-rotate; pause to observe and **Save PNG**.
- **Auto / Detailed / Lightweight** changes the sample step count and rendering resolution.
- On mobile, **Adjust** opens the bottom sheet; Escape closes it and restores focus.

## Scientific Scope

This is a volumetric visual illustration, not a combustion reaction solver, CFD, or safety forecast.
The current version references NASA's candle flame images: a blue dome in microgravity and an elongated shape at 1g;
gas flow and fuel still affect the shape. See
[NASA: Candle Flame – 1g vs Microgravity](https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/).
The morph slider does **not** map to g, pressure, or oxygen concentration. Custom colors do not represent
temperature or chemical composition. It does not read RAG data into shaders and does not generate synthetic measurements.

## Design and Structure

Taste app direction **true-black-flat**, seed `699374517`, saved in `.taste-skill/flame/direction.json`.
Central question: "What does the flame look like when I change shape and color?"
The primary subject is the luminous volume; the background and controls use neutral tones. Saturated colors belong
to the flame and color picker, per user request. No decorative gradients or glows on the UI.

Inventory: one main canvas; one adjustment panel; two shape presets; one morph slider; four preset colors and custom color;
two oscillation/brightness sliders; one auto-rotate toggle; one quality selector; reset view; pause; save PNG;
loading state, fallback image on WebGL failure, mobile layout, and keyboard shortcuts.

- `web/flame.html`: standalone interface, `/flame` served by FastAPI.
- `web/src/flame.js`: scene, OrbitControls, Timer, interactions, PNG export, and resource cleanup.
- `web/src/flame.frag.glsl`: emission raymarching through a thin flame shell and gentle motion.
- `web/assets/flame.css`: studio layout and mobile bottom sheet.
- `web/assets/flame.js`: pre-built bundle for offline execution; rebuild required if source is modified.
- `web/assets/flame-poster.png`: image exported directly from renderer, used when device lacks WebGL 2.
- `web/assets/THREE-LICENSE.txt`, `web/assets/fonts/OFL.txt`: library and font licenses.

Raymarching accumulates emission through a thin flame shell, adding the luminous zone of a 1g candle flame.
No cloud-like noise textures or display pedestals are used. The candle wick occludes light behind it.
Transitions between teardrop and spherical dome signed distance fields; color is managed in linear space,
ACES tone mapping, and converted to sRGB. Auto mode caps pixel ratio and sheds load when
the CPU dispatches frames too slowly; GPU timer queries are not yet measured. Detailed quality requires more GPU.
Reduced-motion preference starts paused; hidden tabs do not render frames.

## Build and Testing

```powershell
cd web
npm ci --ignore-scripts
npm run build
cd ..
pytest -q
ruff check src tests scripts/check_flame_studio.py
```

Browser QA uses pre-installed Edge; add `pip install playwright pillow` and run:

```powershell
python scripts/check_flame_studio.py --url http://127.0.0.1:8000
```

The script tests real WebGL, pixel color and shape, custom colors, keyboard rotation, pause/motion,
downloadable PNG, quality settings, 768/390/320 widths, and fallback image when WebGL is unavailable.
QA screenshots default to `.taste-skill/flame/qa`. Playwright is not required to run the product.

## Visual Revisions from Feedback

The initial version was critiqued as resembling a plasma ball / smoke. Removed 3D noise textures, removed circular plinth,
reduced blue shell intensity, darkened the center, and added candle/wick as the fuel source.
The microgravity preset is now a **candle flame dome** based on reference photography, not representing all flame types in space.
QA verifies that the center is darker than the rim and does not turn into a white core.
