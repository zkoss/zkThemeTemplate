# Eval Report: carousel   status: VERIFIED_WITH_VISUAL_NOTES
iteration: 1
date: 2026-07-22T18:00:00Z
tier: T2
failing-set: []
newly-passing-since-last: []
row-coverage: 48/48  <!-- c1-c33 (33) + M1-M5 + 4 named M-rows (9) + x-ctv-root/x-ctv-region/x-ctv-suite/x-density/x-fc-capture/x-brand-decl (6) -->

## Pre-flight gates
- `contract-approved: true` confirmed in `doc/contracts/carousel.md` frontmatter. Gate 0a PASS.
- `js-source-hash` recomputed: `shasum -a 256` over the four declared `js-source-files`
  (`Carousel.ts`, `Carouselitem.ts`, `mold/carousel.js`, `mold/carouselitem.js`, in that
  order) under `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/wgt/`
  → `e79a0be9cabed99f4674e4249156511d432caa24e3984ef45146cef5ef676574`, matches the contract's
  stored hash exactly. Gate 0b PASS (no drift).
- Preview app reachable: `curl -sI http://127.0.0.1:8080/carousel.zul` → HTTP 200.
- Icon-coverage pre-render check (§2.6): the preview ZUL (`src/test/resources/web/carousel.zul`)
  and the ZK widget source (`Carousel.ts`/`Carouselitem.ts`/both molds) contain **zero**
  `z-icon-*` references — the chevron is CSS-drawn via `::before` border geometry, not a
  Lucide icon, and `domIcon_()` is confirmed dead code for `Carouselitem` (per the skill).
  Nothing to check; trivially clear.

## Tooling note (read before trusting the artefact paths below)
**Chrome MCP (`mcp__claude-in-chrome__*`) was not available in this session** (absent from
both the always-on tool list and the deferred-tool index — confirmed via `ToolSearch`).
Per the agent definition's own sanctioned fallback ("Playwright capture fallback (when
gif_creator is broken)"), all navigation, computed-style measurement, and screenshot
capture in this report were performed via a standalone Playwright script driving Chromium
headless (`@playwright/test`'s `chromium.launch()`), run from the repo root so module
resolution reaches the project's own `node_modules`/Playwright install — the same engine
`npx playwright test` uses. This is a full substitute for the JS-execution parts of the
harness (`getComputedStyle`, `getBoundingClientRect`, real `:hover`/`:focus-visible` via
Playwright's `.hover()`/`.focus()` actions), not merely the screenshot fallback. Screenshots
are `.png` (Playwright's native format) rather than `.gif`; the post-condition in §3a
accepts `*.png` explicitly, so this satisfies the artefact gate.

**Preview-anchor discrepancy (observation, not a failure):** the contract's "Preview
anchors" section specifies stable ids (`#pv-carousel-default`, `#pv-carousel-loop-false`,
etc.) for each preview instance, and the preview ZUL does set `id="pv-carousel-default"`
etc. in the ZUL markup. Empirically, none of these resolve as DOM `id` attributes —
`Carousel`'s mold (`carousel$mold$`) writes the root's attributes via `this.domAttrs_()`,
which emits ZK's own internal `uuid` (e.g. `pDrA7`), not the ZUL-authored `id=`. This
appears to be standard ZK behavior (the ZUL `id` is a Java/composer fellow-reference name,
not necessarily the rendered DOM id) rather anything carousel-specific, but it means the
suggested anchor strategy in the contract does not work as written. All measurements below
instead used **document-order indexing** over `document.querySelectorAll('.z-carousel')`,
cross-checked against the ZUL's fixed instance order (0=default, 1=loop-false,
2=effect-slide, 3=effect-fade, 4=effect-none, 5=vertical, 6=single-slide, 7=autoplay) —
confirmed via each instance's distinguishing classes (`z-carousel-vertical`,
`z-carousel-effect-fade`, etc.) and slide count. Recommend spec-author revisit the
"Preview anchors" section's assumption for future iterations.

**Transition-freeze correction during measurement:** the first pass at c30 (indicator
`:hover::before` transform) read back `matrix(1, 0, 0, 1, 0, 0)` (identity — i.e., resting)
immediately after a real Playwright `.hover()`, despite `:hover` being genuinely active.
Root cause: the transition being measured lives on the **pseudo-element** itself
(`.z-carousel-indicator::before { transition: transform …, … }`), and pseudo-elements have
no inline-style surface, so the usual "set `el.style.transition = 'none'`" trick (used
successfully for c9's real-element hover) does not reach it. Fixed by injecting a temporary
global stylesheet rule (`*, *::before, *::after { transition: none !important; }`) before
hovering, then removing it — confirmed the same result (`matrix(1.25, 0, 0, 1.25, 0, 0)` =
`scale(1.25)`) is also reached by simply waiting ~400ms for the real 250ms transition to
finish naturally (no frozen/backgrounded tab in this headless run). Both the resting dot
(data-index 1) and the active dot (data-index 0) were independently confirmed to scale on
hover, per the contract's state-matrix row wording ("resting dot and active dot both
scale").

## Visual artefacts
- page: `doc/screenshots/carousel/page.png` (full-page, Playwright fallback)
- hover: `doc/screenshots/carousel/hover.png` (prev arrow, real `:hover`, clipped to default instance)
- focus: `doc/screenshots/carousel/focus.png` (prev arrow, real `:focus-visible`, clipped to default instance)
- forced-colors: `doc/screenshots/carousel-forced-colors.png` (578924 bytes, via `x-fc-capture`)
- supplementary close-up crops used only for §3d visual review (not required by the
  post-condition, kept for traceability): `doc/screenshots/carousel/vertical-crop.png`,
  `doc/screenshots/carousel/effect-2-crop.png`, `doc/screenshots/carousel/loopfalse-crop.png`

## AI visual findings
Counts: total=2, HIGH=0, MEDIUM=1, LOW=1.

| # | location | violation | severity | suspected-row | screenshot |
|---|----------|-----------|----------|---------------|------------|
| 1 | `.z-carousel-vertical` instance's arrows | Even in `orient="vertical"` (track slides on the Y axis), the prev/next arrows stay left/right-docked and keep the left/right-pointing `‹`/`›` chevron geometry — there is no top/bottom repositioning or chevron rotation to `˄`/`˅`. Functionally the buttons still work (click still advances/retreats), but the spatial affordance points the wrong way relative to the slide direction. Neither the contract's Expected-values table nor its Outcome-assertions table addresses this — M4 explicitly scopes its arrow-position check to `orient="horizontal"` only, which reads as a deliberate carve-out rather than an oversight, but it leaves the vertical case visually unverified. | MEDIUM | — (M4 explicitly excludes vertical; candidate for a new M-row, e.g. "vertical orient: arrows horizontally centered + chevrons rotated 90°") | doc/screenshots/carousel/vertical-crop.png |
| 2 | `.z-carousel-indicators` on the effect-gallery instances (flat pastel `z-bg-*-container` slide backgrounds) | The active indicator's light fill (`--zk-color-inverse-on-surface`, near-white) has noticeably low contrast against the pale pastel demo backgrounds, making it look more like a faint hollow ring than a prominent "you are here" marker, while the two resting (dark-scrim-fill) dots read clearly. This is the inverse of the intended affordance (active should stand out most). The Design Contract's two-voice scrim/inverse-on-surface system is explicitly justified against "arbitrary photographic content," which is typically mid-to-dark toned — this specific failure mode only appears against atypical flat, pale, non-photographic backgrounds (as used in this demo's effect gallery, not the default instance's actual photo slides, where the same dots read fine). | LOW | — (edge case outside the stated design assumption; not a token-value bug — c18-c21 all measured exactly as specified) | doc/screenshots/carousel/effect-2-crop.png |

## Macro assertions

| id | predicate | observed | result |
|----|-----------|----------|--------|
| M1 | `.z-carousel` non-zero bbox AND `overflow: hidden`/`clip` both axes | bbox 600×300; `overflow-x: hidden`, `overflow-y: hidden` | PASS |
| M2 | exactly one non-clone `.z-carouselitem` carries `-active`, bbox within ±2px of root content-box on all 4 edges | 4 real items + 2 clones (loop=true default); `activeCount=1`; active bbox {top:146,left:32,right:632,bottom:446} == root bbox exactly (Δ0px) | PASS |
| M3 | active item's bbox covers ≥95% of root content-box area | active 600×300 / root 600×300 = 100% | PASS |
| M4 | arrows don't intersect indicators row; horizontal-orient arrows' vertical centers within 4px of root's vertical center | no intersection either side; `rootVCenter=296`, `prevVCenter=296`, `nextVCenter=296` (Δ0px) | PASS |
| M5 | indicator vertical centers within 2px of each other; horizontal order matches ascending `data-index` | all 4 indicators `cy=426` (Δ0px); x-order 272<304<336<368 for data-index 0<1<2<3 | PASS |
| M-arrow-prev-visible | `::before` resolved bbox ≥6×6px, fully inside the button's own bbox | pre-transform 8×8 (border-box, 2px border on left+bottom), `rotate(45deg)` via matrix(0.707,0.707,-0.707,0.707,0,0), centered by flex inside a 32×32 button — post-rotation visual bbox ≈11.3×11.3, well within 32×32 | PASS |
| M-arrow-next-visible | same, mirrored | pre-transform 8×8 (border-right+border-top), same rotation matrix, same centering | PASS |
| M-indicator-dot-visible | `::before` dot ≥6×6px, centered ±2px within the 24×24 hit-area button | dot 8×8, centered via `display:flex; align-items:center; justify-content:center` on a 24×24 button (no offset overrides) | PASS |
| M-label-visible | label non-zero bbox; `bottom ≤ activeItem.bottom`; `right ≤ activeItem.right` | label bbox {w:100.1, h:24, bottom:430, right:148.1}; active item {bottom:446, right:632}; both inequalities hold with margin (16px / 483.9px respectively) | PASS |

## Layout regressions (§3c)

| id | selector | check | observed | result |
|----|----------|-------|----------|--------|
| lr-1 | `#pv-carousel-default` children | children-fit (no child overflows root's own box) | 0 overflowing children | PASS |
| lr-2 | `.z-carousel-track` | no-content-overflow | `scrollWidth > offsetWidth` is **true** — but this is the carousel's own slide mechanism (4 items + 2 loop-clones each at `flex: 0 0 100%`, i.e. the track is deliberately ~6× the visible width, and is transformed via `translateX` to bring one slide into view), not an unbounded-content leak. The ancestor `.z-carousel` carries `overflow: hidden` (already confirmed PASS at M1/c2), which is the actual clip boundary — the track itself is not meant to clip. Treated as expected-by-design, not a regression. | PASS (with rationale — see note) |
| lr-3 | `.z-carousel-arrow-prev/-next`, `.z-carousel-indicators` | absolute-overlay (scroll/overlay children must be `position: absolute`/`fixed`) | all three computed `position: absolute` | PASS |
| lr-4..lr-10 | — | hidden-but-still-occupying / toolbar-in-container / in-flow-overlay-margin / inherited-inline-width / animation-stuck-on-zero / scroll-button-side-mirror / parent-radius-without-clip | none of these conditions apply to carousel's structure (no `display:none` decoys beyond the sr-only clip-technique status span, no toolbar, no margin-reservation trick, no inline-width-copy mechanism, no slideDown cave, not a tabbox, and the root already has `overflow:hidden` so the radius-without-clip trigger condition is not met) | N/A (condition not present) |

## Cross-cutting checks (§3e)

| id | observed | result |
|----|----------|--------|
| x-ctv-root | knob `--zk-carousel-arrow-fg` → `rgb(255, 0, 0)`: arrow `color` before=`rgb(240, 244, 250)`, overridden=`rgb(255, 0, 0)`, restored=`rgb(240, 244, 250)` | PASS |
| x-ctv-region | set `--zk-carousel-arrow-fg: rgb(0,255,0)` inline on the default instance's container only: inside changed to `rgb(0, 255, 0)`, the loop-false instance (outside the container) stayed `rgb(240, 244, 250)` throughout, inside restored after `removeProperty` | PASS |
| x-ctv-suite | `npx playwright test --config src/test/playwright/playwright.config.ts --project=component-theming -g "carousel"` → 2 passed (regional-override test + whole-app `:root` override test) | PASS |
| x-density | `--zk-carousel-arrow-size` shrunk by 8px (32px→24px) at `:root`: arrow rendered height 32→24 (Δ8px, within ±2px tolerance), restored to 32 after `removeProperty` | PASS |
| x-fc-capture | `npx playwright test … --project=forced-colors-gallery -g "carousel"` → 1 passed; `doc/screenshots/carousel-forced-colors.png` exists, 578924 bytes. Gen-report confirms `tokens/_forced-colors.css` was touched this pass (new carousel-arrow + carousel-indicator guards) → also ran `npm run test:forced-colors`: **16/16 PASS**, no regression from the central-file edit | PASS |
| x-brand-decl | `grep -nE "#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|oklch\(" src/main/resources/web/js/zul/wgt/css/carousel.css \| grep -v "var(--zk-"` → 0 hits (every color in the component's own CSS file is either a `var(--zk-carousel-*)` knob or `currentColor`; the one literal default, `rgba(0, 0, 0, 0.65)` for `--zk-carousel-arrow-bg-hover`, lives in `tokens/_component-theme.css`, not the shared-css-file being graded, and is whitelisted in `brand-allowed-literals` regardless) | PASS |

## Per-component results

### carousel / carouselitem
| state | id | selector | property | expected | actual | result |
|-------|----|----------|----------|----------|--------|--------|
| default (root frame) | c1 | `.z-carousel` | border-radius | `var(--zk-carousel-radius)` → 6px | `6px` | PASS |
| default (root frame) | c2 | `.z-carousel` | overflow | `hidden` | `hidden` | PASS |
| slide-effect track | c3 | `.z-carousel-effect-slide .z-carousel-track` | transition | `transform 250ms cubic-bezier(0.4,0,0.2,1)` | `transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)` | PASS |
| fade-effect item | c4 | `.z-carousel-effect-fade .z-carouselitem` | transition | `opacity 250ms cubic-bezier(0.4,0,0.2,1)` | `opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)` | PASS |
| arrow default | c5 | `.z-carousel-arrow` | width / height | `var(--zk-carousel-arrow-size)` → 32px | `32px` / `32px` | PASS |
| arrow default | c6 | `.z-carousel-arrow` | border-radius | `var(--zk-shape-corner-full)` → 9999px | `9999px` | PASS |
| arrow default | c7 | `.z-carousel-arrow` | background-color | `var(--zk-carousel-arrow-bg)` → scrim `rgba(0,0,0,0.5)` | `rgba(0, 0, 0, 0.5)` | PASS |
| arrow default | c8 | `.z-carousel-arrow` | color | `var(--zk-carousel-arrow-fg)` → `rgb(240,244,250)` | `rgb(240, 244, 250)` | PASS |
| arrow hover | c9 | `.z-carousel-arrow:hover` | background-color | `var(--zk-carousel-arrow-bg-hover)` → `rgba(0,0,0,0.65)` | `rgba(0, 0, 0, 0.65)` (real `:hover`, transition frozen) | PASS |
| arrow focus-visible | c10 | `.z-carousel-arrow:focus-visible` | outline | `var(--zk-focus-ring)` → `2px solid #376fd0` | `rgb(55, 111, 208) solid 2px` (real `:focus-visible`) | PASS |
| arrow glyph rendered | c11 | `.z-carousel-arrow-prev::before` | border-left / border-bottom | `2px solid currentColor` | `2px rgb(240,244,250)` / `2px rgb(240,244,250)` | PASS |
| arrow glyph rendered | c11 | `.z-carousel-arrow-next::before` | border-right / border-top | `2px solid currentColor` | `2px rgb(240,244,250)` / `2px rgb(240,244,250)` | PASS |
| arrow disabled | c12 | `.z-carousel-arrow[disabled]` | opacity | `var(--zk-state-disabled-opacity)` → 0.38 | `0.38` (prev@loop-false idx0, `[disabled]` present) | PASS |
| arrows docked | c13 | `.z-carousel-arrow-prev` / `-next` | left / right | `var(--zk-spacing-2)` → 8px | `8px` / `8px` | PASS |
| indicators row | c14 | `.z-carousel-indicators` | bottom | `var(--zk-spacing-2)` → 8px | `8px` | PASS |
| indicators row | c15 | `.z-carousel-indicators` | gap | `var(--zk-spacing-2)` → 8px | `8px` | PASS |
| indicator default | c16 | `.z-carousel-indicator` | width / height | `24px` | `24px` / `24px` | PASS |
| indicator default | c17 | `.z-carousel-indicator::before` | width / height | `8px` | `8px` / `8px` | PASS |
| indicator default (resting) | c18 | `.z-carousel-indicator::before` | background-color | `var(--zk-carousel-indicator-bg)` → scrim | `rgba(0, 0, 0, 0.5)` | PASS |
| indicator default (resting) | c19 | `.z-carousel-indicator::before` | border-color | `var(--zk-carousel-indicator-active-bg)` → `rgb(240,244,250)` | `rgb(240, 244, 250)` | PASS |
| indicator active | c20 | `.z-carousel-indicator-active::before` | background-color | `var(--zk-carousel-indicator-active-bg)` → `rgb(240,244,250)` | `rgb(240, 244, 250)` | PASS |
| indicator active | c21 | `.z-carousel-indicator-active::before` | border-color | `var(--zk-carousel-indicator-bg)` → scrim | `rgba(0, 0, 0, 0.5)` | PASS |
| indicator focus-visible | c22 | `.z-carousel-indicator:focus-visible` | outline | `var(--zk-focus-ring)` | `rgb(55, 111, 208) solid 2px` (real `:focus-visible`) | PASS |
| caption label present | c23 | `.z-carouselitem-label` | background-color | `var(--zk-carousel-label-bg)` → scrim | `rgba(0, 0, 0, 0.5)` | PASS |
| caption label present | c24 | `.z-carouselitem-label` | color | `var(--zk-carousel-label-fg)` → `rgb(240,244,250)` | `rgb(240, 244, 250)` | PASS |
| caption label present | c25 | `.z-carouselitem-label` | bottom / left | `var(--zk-spacing-4)` → 16px | `16px` / `16px` | PASS |
| caption label present | c26 | `.z-carouselitem-label` | padding | `var(--zk-spacing-1) var(--zk-spacing-2)` → 4px 8px | `4px 8px` | PASS |
| caption label present | c27 | `.z-carouselitem-label` | border-radius | `var(--zk-carousel-radius)` → 6px | `6px` | PASS |
| default (root frame) | c28 | `.z-carousel > img`, `.z-carouselitem > img` | width / height / object-fit | `100%` / `100%` / `cover` | `600px`(=100% of 600px container) / `300px`(=100%) / `cover` | PASS |
| indicator default (resting) | c29 | `.z-carousel-indicator::before` | transition | `transform, background-color, border-color` × 250ms cubic-bezier | `transform 0.25s cubic-bezier(0.4,0,0.2,1), background-color 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s cubic-bezier(0.4,0,0.2,1)` | PASS |
| indicator hover | c30 | `.z-carousel-indicator:hover::before` | transform | `scale(1.25)` | `matrix(1.25, 0, 0, 1.25, 0, 0)` — confirmed on both resting (idx1) and active (idx0) dots | PASS |
| arrow default | c31 | `.z-carousel-arrow` | transition | `background-color` × 250ms cubic-bezier | `background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)` | PASS |
| caption label present | c32 | `.z-carouselitem-label` | font-size / font-weight / line-height | `12px` / `400` / `16px` | `12px` / `400` / `16px` | PASS |
| effect="none" track | c33 | `.z-carousel-effect-none .z-carousel-track` | transition | `none` | `none` | PASS |

### Structural state rows (no computed-style property, DOM presence only)
| state | check | observed | result |
|-------|-------|----------|--------|
| active slide (fills frame, unique) | exactly one non-clone active item; clones present only in loop=true+slide+≥2 slides | 4 items, 1 active, 2 clones (default instance: loop unset→true, effect=slide, 4 slides) | PASS |
| single-slide (no arrows/indicators) | `.z-carousel-arrow-prev/-next`/`.z-carousel-indicators` structurally absent when count≤1, even with `showArrows="true" showIndicators="true"` explicit | all three absent; 1 item | PASS |
| vertical orientation | `.z-carousel-vertical` class present; track `flex-direction: column`; same transition token as horizontal | class present, `flexDirection: column`, `transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)` | PASS |
| loop="false" boundary | prev `[disabled]` at index 0; next NOT disabled (not yet at last index) | prev `hasDisabledAttr: true`; next `hasDisabledAttr: false` | PASS |

## Skill-file gap (flagged for spec-author, not a CSS defect)
`.claude/skills/zk-component-rules/components/carousel.md` currently has no explicit
`## Relational invariants` / `## State-differs invariants` sections (per
`authoring/contract-tiers.md`'s B/C-tier discipline). In practice the Marble contract's
Outcome-assertions (M-rows) and several Expected-values rows already exercise the
equivalent ground — M2 is a relational/geometric invariant, c9/c30/c10/c18-c21 are all
state-differs pairs (hover-differs-from-resting, focus-differs-from-resting,
active-differs-from-resting) — but these live in the theme-specific contract rather than
the theme-portable skill file, so a future theme built on this template would not inherit
them automatically. Recommend spec-author backfill the two sections with theme-agnostic
versions of: "exactly one active slide, geometrically filling the frame" (B),
"hover/focus/active/disabled must each differ from resting by at least one of
{background-color, border-color, opacity, outline, transform}" (C).

## Findings accepted as false positive

Orchestrator triage of the two §3d AI visual findings (2026-07-22). Neither is a Marble defect; both accepted, status flipped VERIFIED_WITH_VISUAL_NOTES → GATE2_PENDING.

- **MEDIUM — vertical-orientation arrows stay left/right-docked with ‹/› chevrons** (do not move to top/bottom or rotate to up/down for the Y-axis slide). ACCEPTED as ZK platform behavior, not a Marble defect: ZK stock `zul/wgt/less/carousel.less` docks `.z-carousel-arrow-prev {left:10px}` / `-next {right:10px}` at `top:50%` and provides **no `.z-carousel-vertical` arrow override** — its `&-vertical > &-track` rule only flips the track's flex direction. Marble intentionally mirrors this, which is exactly why contract row M4 scopes its arrow-position assertion to horizontal orientation. Repositioning/rotating arrows for vertical mode would be an enhancement *beyond* ZK stock and beyond the approved contract's design substance → recorded as an optional future enhancement, surfaced to the user, not auto-promoted.
- **LOW — active indicator dot low-contrast against flat pastel demo backgrounds** (in the effect gallery). ACCEPTED: appears only against the flat `z-bg-*-container` pastel fills used as *demo* slide content, not against the real photographic slides the default instance uses. The contract's Design Contract explicitly assumes "arbitrary photographic content"; the overlay scrim + inverse-on-surface pairing is calibrated for that. Outside the stated design assumption → not a defect.
