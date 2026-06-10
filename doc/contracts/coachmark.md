# Component: coachmark (theme design)
tier: T2
category: feedback
preview: http://localhost:8080/coachmark.zul
rules: see .claude/skills/zk-component-rules/components/coachmark.md
contract-approved: true
zk-version: 10.2.1-jakarta
js-source-files:
  - zkmax/src/main/resources/web/js/zkmax/nav/Coachmark.ts
  - zkmax/src/main/resources/web/js/zkmax/nav/mold/coachmark.js
js-source-hash: 6673edf25b28d7ea66babb6c1b873cf9b1a96c0b3791dac8ecedac5e059f125e
closest-sibling: none — novel guided-tour card pattern
mockup-needed: Y
mockup-rationale: ZKDoc has Coachmark-4.png but Marble's primary-filled card with on-primary text significantly diverges from iceblue's neutral-background default; mockup needed to pin the primary-surface design intent.

## References
- MUI CSS: no direct analog — MUI has Tooltip.css (bare tooltip) and Popover.css but neither has
  a guided-tour card with pointer arrow + mask + close button. Closest spirit: MUI Snackbar + Tooltip combined.
- Mira HTML: no analog
- DESIGN.md sections: §3 (primary color), §5 (shape — card radius), §6 (elevation), §7 (spacing), §8 (motion)
- ZKDoc canonical: /Users/hawk/Documents/workspace/DOC/zkdoc/zk_component_ref/images/Coachmark-4.png
- Iceblue baseline: doc/contracts/baselines/coachmark-iceblue.png
- HTML contract: doc/contracts/coachmark.html

## Design Contract

Coachmark is a primary-surface guided-tour card. The visual card element (`.z-coachmark-content`)
uses `--zk-color-primary` as its background and `--zk-color-on-primary` (white) as its text color,
making it visually pop above the semi-transparent mask. Corner radius is `--zk-shape-card` (6px),
consistent with all card/alert surfaces in Marble. Elevation is `--zk-elevation-2` (dropdown level)
since the card floats above the page but is not a modal dialog. Padding is `--zk-spacing-4` (16px)
for comfortable reading. The pointer arrow triangle inherits the same primary background color via
`border-color` so it reads as an extension of the card. The close button (`×`) is
`--zk-color-on-primary` (white) to remain legible on the primary background. The full-page mask
uses a semi-transparent dark overlay to dim the content beneath, guiding attention to the target.
Entrance animation: Marble does not override the ZK default `expand` keyframe animation
(scale 0 → 1 + opacity 0 → 1). The duration, delay, and easing are inherited from ZK's
built-in coachmark JS — they are not Marble-themed values and no `--zk-motion-*` token is
bound to them. The Marble CSS (`coachmark.css`) contains no animation rule.

## Outcome assertions

| id | predicate | rationale |
|----|-----------|-----------|
| M1 | `.z-coachmark-content` has `background-color ≠ transparent AND background-color ≠ rgb(255,255,255)` — it must read as a distinct colored card | visual identity — "reads as a guided-tour card, not a plain tooltip" |
| M2 | `.z-coachmark-content` bbox `height ≥ 40px AND width ≥ 120px` when containing at least one `.z-label` child | card must have minimum legible body size |
| M3 | `.z-coachmark-close` bbox is non-zero (`width ≥ 12px AND height ≥ 12px`) AND **`width ≤ 32px`** (it is a corner affordance, NOT a full-width row) AND `bbox.right ≤ (coachmark-content.bbox.right + 4px)` AND **`bbox.top ≤ (coachmark-content.bbox.top + 32px)`** — close button is visible and pinned at the TOP-right of the card (not flowed below the content) | close affordance must be reachable at the top-right corner; a static full-width close collapsed to the card bottom must FAIL |
| M4 | `.z-coachmark-pointer` bbox is non-zero (`width ≥ 10px AND height ≥ 10px`) when `.z-coachmark-open` is present | pointer arrow must be visible when open |
| M7 | `.z-coachmark-pointer` computed `position === 'absolute'` — the mold JS (`_fixarrow`) writes inline `top`/`left` on the pointer to align the triangle with the target; with `position:static` those coordinates are ignored and the triangle collapses to the card's left edge (does NOT point at the target) | pointer must actually point at the target |
| M5 | `.z-coachmark.z-coachmark-open` has `opacity > 0` (animation fill-mode forwards preserves final state) | card must not remain invisible after opening |
| M6 | Text nodes inside `.z-coachmark-content` have WCAG contrast ≥ 4.5:1 against the `background-color` of `.z-coachmark-content` | legibility on primary background |
| M8 | Every filled action control inside `.z-coachmark-content` — `.z-button` AND each half of a `.z-combobutton` (`.z-combobutton-content`, `.z-combobutton-button`) — has `background-color` **distinct from** the card's `background-color` (NOT both `--zk-color-primary`) AND its `background-color` has WCAG contrast ≥ 3:1 against the card | the default filled button/combobutton is primary-on-primary; on the brand-filled card it loses its shape/affordance entirely — a nested action control MUST contrast with the colored surface |

## Expected values

| id | selector | property | expected (token preferred) | source |
|----|----------|----------|----------------------------|--------|
| c1 | `.z-coachmark-content` | background-color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | DESIGN.md §3 — primary surface for guided-tour prominence |
| c2 | `.z-coachmark-content` | color | `var(--zk-color-on-primary)` → `rgb(255, 255, 255)` | DESIGN.md §3 — on-primary text on primary bg |
| c3 | `.z-coachmark-content` | border-radius | `var(--zk-shape-card)` → `6px` | DESIGN.md §5 — card radius for container surfaces |
| c4 | `.z-coachmark-content` | box-shadow | `var(--zk-elevation-2)` → `0px 2px 6px 0px rgba(0,0,0,0.12), 0px 1px 2px 0px rgba(0,0,0,0.14)` | DESIGN.md §6 — dropdown/hover elevation for floating card |
| c5 | `.z-coachmark-content` | padding | `16px 28px 16px 16px` (= `var(--zk-spacing-4)` with right `calc(var(--zk-spacing-4) + var(--zk-spacing-3))`) | DESIGN.md §7 — comfortable body padding; extra right padding reserves space for the absolutely-positioned close button (mirrors ZK default's asymmetric `@coachmarkPaddingRight`) |
| c6 | `.z-coachmark-pointer.z-coachmark-up` | border-bottom-color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | pointer triangle must match card background |
| c7 | `.z-coachmark-pointer.z-coachmark-down` | border-top-color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | pointer triangle must match card background |
| c8 | `.z-coachmark-pointer.z-coachmark-left` | border-right-color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | pointer triangle must match card background |
| c9 | `.z-coachmark-pointer.z-coachmark-right` | border-left-color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | pointer triangle must match card background |
| c10 | `.z-coachmark-close` | color | `var(--zk-color-on-primary)` → `rgb(255, 255, 255)` | close icon must be legible on primary background |
| c11 | `.z-coachmark-close` | cursor | `pointer` | interaction contract — close is clickable |
| c12 | `.z-coachmark-mask` | background | `var(--zk-color-scrim)` → `rgba(0,0,0,0.5)` | mask must use the system scrim token for theme-wide consistency |
| c13 | `.z-coachmark` | position | `absolute` | structural — JS-positioned wrapper |
| c14 | `.z-coachmark` | opacity | `0` (when NOT `.z-coachmark-open`) | closed state must be invisible |
| c15 | `.z-coachmark-pointer` | position | `absolute` | REQUIRED so the mold JS's inline `top`/`left` apply — otherwise the triangle does not align to the target |
| c16 | `.z-coachmark-close` | position | `absolute` | close is pinned to the card's top-right corner relative to the `.z-coachmark` root; static positioning flows it to the card bottom |
| c17 | `.z-coachmark-content .z-button` | background-color | `var(--zk-color-on-primary)` → `rgb(255, 255, 255)` | inverse button on the brand-filled card — white fill so the button reads against the primary surface (the global filled button is primary-on-primary and would vanish) |
| c18 | `.z-coachmark-content .z-button` | color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | inverse button label color — primary text on the white button fill |
| c19 | `.z-coachmark-content .z-combobutton-content`, `.z-coachmark-content .z-combobutton-button` | background-color | `var(--zk-color-on-primary)` → `rgb(255, 255, 255)` | inverse combobutton — both halves get the white fill so the split button reads against the primary card (the global combobutton is primary-on-primary and would vanish) |
| c20 | `.z-coachmark-content .z-combobutton-content`, `.z-coachmark-content .z-combobutton-button` | color | `var(--zk-color-primary)` → `rgb(55, 111, 208)` | inverse combobutton label/arrow color — primary on the white fill |

## State matrix

| state | selector | properties to check |
|-------|----------|---------------------|
| open (default on page load) | `.z-coachmark.z-coachmark-open` | c1, c2, c3, c4, c5, c10, c11, c15, c16, c17, c18, M8 |
| nested-button | `.z-coachmark-content .z-button` | c17, c18, M8 |
| nested-combobutton | `.z-coachmark-content .z-combobutton` | c19, c20, M8 |
| closed | `.z-coachmark` (without `.z-coachmark-open`) | c14 (opacity = 0) |
| pointer-up | `.z-coachmark-pointer.z-coachmark-up` | c6, c15 |
| pointer-down | `.z-coachmark-pointer.z-coachmark-down` | c7, c15 |
| pointer-left | `.z-coachmark-pointer.z-coachmark-left` | c8, c15 |
| pointer-right | `.z-coachmark-pointer.z-coachmark-right` | c9, c15 |
| mask-visible | `.z-coachmark-mask` | c12 |
| close-hover | `.z-coachmark-close:hover` | cursor: pointer; visual hover state |

## States to evaluate
- [ ] open (with .z-coachmark-open)
- [ ] nested-button (.z-button inside .z-coachmark-content — must contrast with the card)
- [ ] nested-combobutton (.z-combobutton inside .z-coachmark-content — both halves must contrast)
- [ ] closed (without .z-coachmark-open)
- [ ] pointer-up
- [ ] pointer-down
- [ ] pointer-left
- [ ] pointer-right
- [ ] mask-visible
- [ ] close-hover
