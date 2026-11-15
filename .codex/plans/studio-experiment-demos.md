# Studio experiment demos

## Scope and acceptance
- Extend the existing static Studio with a responsive experiment selector and one active embedded illustration.
- Include the six root HTML files as six selectable demos (five SoFIE studies; two GEL variants), plus the existing candle viewer.
- Preserve original root files and existing candle controls, screenshots and camera behavior. Avoid backend/data/chat changes and preserve unrelated dirty work.
- Label all imported demos as qualitative illustrations with assumed parameters, not PSI measurements or validated models. MIST generated points must not say measured data.
- Use stable local asset URLs, vendor the exact existing Three.js r128 dependency with its MIT license, replace remote fonts with existing local fonts. No external runtime requests needed.
- Support direct hash links, reload, back/forward, keyboard selection and mobile widths. Navigating away unloads the old iframe so only one simulation uses rendering resources.
- Provide a load/error state and a usable direct-view link for each demo.

## Files
- `FlameInFreewall_Tourbillion/public/studio.html` and `public/studio/index.html`: identical Studio shell entry points.
- `public/assets/studio.css`, `public/assets/studio.js`: shell layout and navigation.
- `public/studio/experiments/*.html`: candle page and published demo copies; original source files remain unchanged.
- `public/assets/vendor/three-r128.min.js` and license: dependency for existing examples.
- `scripts/sync_studio_examples.py`: repeatable import of named root HTML files with only dependency, theme and provenance-label adaptations.

## Verification
- Critic review before implementation; reviewer on final diff.
- Run importer twice and confirm deterministic generated HTML; inspect scripts for syntax errors.
- Run frontend `npm test` and `npx tsc --noEmit`.
- Browser smoke on local server: all seven selections render canvas without page errors; interact with a meaningful control per imported demo and candle, verify single iframe, direct hash, reload/back, invalid-hash handling and 390px mobile layout.
- Verify local asset HTTP responses and no unexpected remote requests. Open the resulting Studio demo for the user.
