ROUND 1
Seen in one second: a luminous blue sphere on black.
Idea (one sentence): observe a flame's volume while independently changing its shape and color.
Live thing: raymarched 3D morph, free camera, palette, pause, PNG capture.
Layout words by section: stage=full canvas / controls=flat inspector / phone=canvas + bottom sheet.
Scores: design 7.5 · usability 7.5 · creativity 7.5 · content 8 → overall 7.55
Caps applied: app-screen rules apply; this is a visualization editor, not a photographic marketing page.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. mobile-fold.jpg: the sphere and pedestal are cropped horizontally; widen the vertical FOV on portrait screens.
2. desktop-fold.jpg: supporting copy is small; increase instructional text to 13px.
3. first desktop render: “Tham chiếu 1g” wraps inside a shape button; widen inspector to 352px.

ROUND 2
Seen in one second: a complete glowing flame volume, with shape controls beside it.
Idea (one sentence): observe a flame's volume while independently changing its shape and color.
Live thing: raymarched 3D morph, free camera, palette, pause, PNG capture.
Layout words by section: stage=full canvas / controls=scrolling inspector / phone=canvas + bottom sheet.
Scores: design 7.8 · usability 8 · creativity 7.5 · content 8 → overall 7.82
Caps applied: app-screen rules; subject is the renderer, not a marketing page requiring photographs.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. desktop-fold.jpg: explanatory content needs a short inspector scroll; deliberate tradeoff to keep the canvas fixed.
2. mobile-fold.jpg: camera hints and subtitles are 11–12px; retained as secondary captions, primary controls are 13px.
3. No remaining clipping or overlap found in the 320/390/768/1440 checks.
Changes: wider inspector, independent scroll, 13px instructions, portrait FOV fitting the complete volume.
Final source lint: 0 FAIL / 0 WARN. Browser inspector: 0 FAIL / 1 tiny-text WARN on mobile secondary captions.
Pixel-based WebGL interaction checks and 23 existing Python tests pass; ruff passes.

ROUND 3 — after user rejected the flame itself
Seen in one second: a blue candle-flame dome around a visible charred wick.
Idea (one sentence): use the NASA candle comparison as a visual reference for the editable flame.
Live thing: 3D envelope, continuous shape morph, independent colors, gentle oscillation and PNG capture.
Layout words by section: stage=candle observation / controls=inspector / phone=observation + bottom sheet.
Scores: design 7.5 · usability 8 · creativity 7 · content 8.5 → overall 7.65
Caps applied: app-screen rules; no marketing photography requirement for a working renderer.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Original sphere-blue image resembled plasma/cloud, despite passing UI checks. Replaced noisy opaque
   sphere with smooth optically thin candle dome; removed plinth and added candle/wick. User explicitly
   chose resemblance to NASA experiments. Prior visual score failed to catch this subject mismatch.
2. revision-inspect/desktop-fold.jpg: candle geometry is simplified; retained as a source reference,
   without claiming a photographic reconstruction or physical solver.
3. revision-inspect/mobile-fold.jpg: secondary captions stay 11–12px; main controls remain 13px.
NASA reference: https://www.nasa.gov/image-article/candle-flame-1g-vs-microgravity/
Final inspection: 0 FAIL; color-share warning belongs to blue flame imagery, not colored UI chrome.
QA now checks a dim blue center versus a brighter rim, and counts changed subject pixels rather
than averaging localized movement across the black stage. 3D camera is tested with tilt because
yaw alone preserves the silhouette of an axisymmetric flame. WebGL interaction QA and ruff pass.
