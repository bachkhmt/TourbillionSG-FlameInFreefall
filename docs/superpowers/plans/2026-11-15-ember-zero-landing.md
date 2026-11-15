# Ember Zero — The Flame That Forgot Gravity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic, scroll-driven landing page experience at `/ember-zero` (`FlameGuard AI × Ember Zero`), showcasing the physical transformation of a flame from 1.00g to 0.00g, the transition into StructPaper light theme, and the 6 Value Reveal beats demonstrating FlameGuard AI's core innovations.

**Architecture:** A modular feature structure under `src/features/ember-zero/` with a unified Zustand scroll state (`useEmberStore`), GPU-accelerated canvas flame physics engine, dual atmospheric dials, seamless dark-to-light theme transition, interactive Value Reveal deck, and non-destructive route at `src/app/(landing)/ember-zero/page.tsx`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS 4, Framer Motion 12, Zustand 5, HTML5 Canvas 2D/WebGL Particle & Flame Shading, Vitest.

**Spec:** [docs/lading-page/FlameGuard AI × Ember Zero — Kịch bản hoàn hảo (Master Script).pdf](file:///c:/Users/OWNER/source/Eatzy/TourbillionSG-FlameInFreefall/FlameInFreewall_Tourbillion/docs/lading-page/FlameGuard%20AI%20%C3%97%20Ember%20Zero%20%E2%80%94%20K%E1%BB%8Bch%20b%E1%BA%A3n%20ho%C3%A0n%20h%E1%BA%A3o%20(Master%20Script).pdf) & [docs/lading-page/Prompt Pack dựng landing 3D mượt, đẹp, không “AI slop”.pdf](file:///c:/Users/OWNER/source/Eatzy/TourbillionSG-FlameInFreefall/FlameInFreewall_Tourbillion/docs/lading-page/Prompt%20Pack%20d%E1%BB%B1ng%20landing%203D%20m%C6%B0%E1%BB%A3t%2C%20%C4%91%E1%BA%B9p%2C%20kh%C3%B4ng%20%E2%80%9CAI%20slop%E2%80%9D.pdf).

## Global Constraints

- Never modify or overwrite the existing landing page at `src/app/(landing)/page.tsx`.
- All new files must live strictly under `src/features/ember-zero/` and `src/app/(landing)/ember-zero/page.tsx`.
- Dark palette for Act I: `#07080B` near-black background, `#F2EFE8` off-white text, `#FFB454` amber accent for Earth flame, `#4CC9F0` cyan for microgravity flame.
- Light palette for Act II/III: `#F8F9FA` paper background, `#0B2374` Royal Navy primary, `#D4FC02` Electric Lime fill accent (never as body text on white).
- 60 fps target, no per-frame React state re-renders during scrolling (use refs or Zustand selective subscriptions).
- Respect `prefers-reduced-motion` and provide an instant "Skip intro / Jump to Mission Control" control.
- Never certify safety; display strict NASA safety warnings and label illustrative elements with `ILLUSTRATIVE`.

## Review Focus

1. **Hydration / SSR Safety:** Ensure client-only canvas and window-dependent scroll code are wrapped in dynamic imports (`ssr: false`) and mount safely without React 19 hydration mismatches.
2. **Smoothstep Gravity Curve:** Verify gravity transitions cleanly: 1.00g during Scenes 0-1, dropping to 0.00g during Scene 2 (The Drop), holding 0.00g through Scene 5, smoothly rising to 0.16g at Moon scene.
3. **Dual Dial Accuracy:** Ensure ppO2 displays psia ($P \times \%O_2$) with correct physiological ranges, while O2 flammability percentage displays flammability risk surge at 34% O2.
4. **Safety Lock Verification:** Confirm that selecting Moon 0.16g or Mars 0.38g displays the LOCKED state in the predictive simulation with the 3 prerequisites audit.
5. **Clean Navigation Links:** Verify all CTA buttons (`Enter Mission Control`, `Explore 20 Studies`, `Open Scenario Workbench`) link to the live app routes (`/dashboard`, `/explorer`, `/mission`).

---

### Task 1: Core State, Types & Gravity Curve Scaffolding

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/types.ts`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/sceneRanges.ts`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/lib/gravityCurve.ts`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/store/useEmberStore.ts`
- Test: `FlameInFreewall_Tourbillion/tests/ember-zero-store.test.ts`

- [ ] **Step 1:** Write the failing unit tests in `tests/ember-zero-store.test.ts` covering gravity interpolation curve, scene range bounds detection, and Zustand store updates.
- [ ] **Step 2:** Run `npx vitest run tests/ember-zero-store.test.ts` to confirm test failure.
- [ ] **Step 3:** Implement `types.ts` defining `SceneRangeId`, `EmberState`, `DialState`, `ValueBeat`, and `IgnitionStatus`.
- [ ] **Step 4:** Implement `sceneRanges.ts` defining default progress marks (Scene 0 through Scene 7b).
- [ ] **Step 5:** Implement `lib/gravityCurve.ts` with piecewise smoothstep logic mapping progress to gravity (1.00g -> 0.00g -> 0.16g).
- [ ] **Step 6:** Implement `store/useEmberStore.ts` with Zustand store maintaining progress, gravity, oxygenPct, ignition state, audio state, and debug HUD visibility.
- [ ] **Step 7:** Run `npx vitest run tests/ember-zero-store.test.ts` to verify all tests pass.
- [ ] **Step 8:** Commit: `feat(ember-zero): scaffold core types, scene ranges, gravity curve, and zustand store`.

---

### Task 2: Act I — Procedural Flame Simulation & Interactive Igniter

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act1-flame/ProceduralFlameCanvas.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act1-flame/InteractiveIgniter.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act1-flame/FloatingPropsLayer.tsx`
- Test: `FlameInFreewall_Tourbillion/tests/ember-zero-flame.test.tsx`

- [ ] **Step 1:** Write the failing component tests in `tests/ember-zero-flame.test.tsx` testing the igniter trigger, canvas mount, and floating props calculations.
- [ ] **Step 2:** Run `npx vitest run tests/ember-zero-flame.test.tsx` to verify failure.
- [ ] **Step 3:** Implement `InteractiveIgniter.tsx` supporting mouse drag, touch swipe, or spacebar hold to strike flint sparks and ignite the wick.
- [ ] **Step 4:** Implement `ProceduralFlameCanvas.tsx` with GPU particle/fluid shading: rendering a flickering teardrop flame at 1.00g transitioning to a soft, breathing blue sphere at 0.00g with no pointed tip.
- [ ] **Step 5:** Implement `FloatingPropsLayer.tsx` featuring drifting props (water droplet becoming a sphere, matchbox, pencil, paper) during "The Drop" (0.15–0.31 progress).
- [ ] **Step 6:** Run `npx vitest run tests/ember-zero-flame.test.tsx` to confirm tests pass.
- [ ] **Step 7:** Commit: `feat(ember-zero): build procedural flame canvas, interactive igniter, and floating props layer`.

---

### Task 3: Act I — Dual Atmosphere Dials & Story Typography Layer

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act1-flame/DualAtmosphereDial.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/story/EmberStoryOverlay.tsx`
- Test: `FlameInFreewall_Tourbillion/tests/ember-zero-dials.test.tsx`

- [ ] **Step 1:** Write failing tests in `tests/ember-zero-dials.test.tsx` testing dual dial computation (ppO2 vs O2 Flammability), narrative text progression per scene, and reduced motion fallback.
- [ ] **Step 2:** Run `npx vitest run tests/ember-zero-dials.test.tsx` to verify failure.
- [ ] **Step 3:** Implement `DualAtmosphereDial.tsx` showing both Breathing dial (ppO2 normoxic in green) and Fire dial (O2 concentration surge in amber) with the punchline: *"Bạn thở vẫn thấy ổn. Ngọn lửa thì không."*
- [ ] **Step 4:** Implement `EmberStoryOverlay.tsx` with editorial serif typography, floating weight-decay letter animations, and monospace telemetry annotations (NO BUOYANCY, DIFFUSION-LIMITED).
- [ ] **Step 5:** Run `npx vitest run tests/ember-zero-dials.test.tsx` to verify all tests pass.
- [ ] **Step 6:** Commit: `feat(ember-zero): build dual atmosphere dials and story typography overlay`.

---

### Task 4: Act II — Lab Lights Transition & Value Reveal Deck (6 Beats)

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act2-machine/LabLightsTransition.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act2-machine/ValueRevealDeck.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act2-machine/InteractiveGapDemo.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act2-machine/LockedPredictiveDemo.tsx`
- Test: `FlameInFreewall_Tourbillion/tests/ember-zero-value-reveal.test.tsx`

- [ ] **Step 1:** Write failing tests in `tests/ember-zero-value-reveal.test.tsx` testing the dark-to-light theme transition, rendering of the 6 value beats, gap matrix highlight, and safety lock simulation.
- [ ] **Step 2:** Run `npx vitest run tests/ember-zero-value-reveal.test.tsx` to verify failure.
- [ ] **Step 3:** Implement `LabLightsTransition.tsx` providing the dramatic "Turn on the lab lights" transition: cinematic dark dissolves into StructPaper paper aesthetic (`#F8F9FA` + `#0B2374` + `#D4FC02`).
- [ ] **Step 4:** Implement `InteractiveGapDemo.tsx` showcasing the 6-dimension Evidence Gap Matrix with Moon 0.16g flagged as RED GAP.
- [ ] **Step 5:** Implement `LockedPredictiveDemo.tsx` demonstrating the LOCKED state when Lunar conditions are requested, explaining the 3 prerequisites audit.
- [ ] **Step 6:** Implement `ValueRevealDeck.tsx` showcasing all 6 beats: 1. Tro tàn $\to$ Kho tàng, 2. Chòm sao so sánh, 3. Bản đồ lỗ hổng, 4. So khớp SoFIE-MIST, 5. Cỗ máy trung thực, 6. Về Trái Đất.
- [ ] **Step 7:** Run `npx vitest run tests/ember-zero-value-reveal.test.tsx` to verify all tests pass.
- [ ] **Step 8:** Commit: `feat(ember-zero): build lab lights transition and 6-beat value reveal deck`.

---

### Task 5: Act III — Earth Impact Showcase, Mission Brief CTA & Route Integration

**Files:**
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act3-unknown/EarthImpactShowcase.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/act3-unknown/MissionBriefCTA.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/DebugHUD.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/components/EmberZeroExperience.tsx`
- Create: `FlameInFreewall_Tourbillion/src/features/ember-zero/index.ts`
- Create: `FlameInFreewall_Tourbillion/src/app/(landing)/ember-zero/page.tsx`
- Test: `FlameInFreewall_Tourbillion/tests/ember-zero-page.test.tsx`

- [ ] **Step 1:** Write failing tests in `tests/ember-zero-page.test.tsx` verifying page layout, navigation CTA links, 60s demo mode, and Debug HUD toggling.
- [ ] **Step 2:** Run `npx vitest run tests/ember-zero-page.test.tsx` to verify failure.
- [ ] **Step 3:** Implement `EarthImpactShowcase.tsx` detailing verified spinoff applications (zero-leak water mist valve, submarine smoke sensors, firefighter breathing equipment).
- [ ] **Step 4:** Implement `MissionBriefCTA.tsx` with primary CTAs: "Enter Mission Control", "Explore 20 Studies", "60-Second Guided Tour", and "Skip Intro".
- [ ] **Step 5:** Implement `DebugHUD.tsx` (toggled by 'D' key) tracking progress, gravity, active scene, and FPS.
- [ ] **Step 6:** Implement `EmberZeroExperience.tsx` unifying Acts I, II, and III into a cohesive, scroll-driven experience with top navigation bar and audio ambient controller.
- [ ] **Step 7:** Create `index.ts` barrel export and `src/app/(landing)/ember-zero/page.tsx` page component with dynamic import.
- [ ] **Step 8:** Run `npx vitest run tests/ember-zero-page.test.tsx` to verify all tests pass.
- [ ] **Step 9:** Commit: `feat(ember-zero): assemble master experience, earth impact showcase, and page route`.

---

### Task 6: Full Verification & Browser Subagent Review

**Files:**
- Verify: `http://localhost:3000/ember-zero`
- Verify: `http://localhost:3000/` (ensure existing landing is completely intact)

- [ ] **Step 1:** Run full test suite: `npx vitest run tests/ember-zero*.test.ts*` to verify 100% test pass rate.
- [ ] **Step 2:** Run typecheck and lint: `npm run lint` or `npx tsc --noEmit` to ensure clean compile.
- [ ] **Step 3:** Launch browser subagent to navigate to `http://localhost:3000/ember-zero`, interact with igniter, scroll through Acts I, II, III, test 60s demo mode, and capture visual proof screenshots.
- [ ] **Step 4:** Push commit to origin/frontend.
