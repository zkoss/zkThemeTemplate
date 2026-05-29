# Component: stepbar (theme design)
tier: T3
category: feedback
preview: http://localhost:8080/stepbar.zul
rules: see .claude/skills/zk-component-rules/components/stepbar.md
contract-approved: true
zk-version: 10.2.1-jakarta
js-source-files:
  - zkmax/src/main/resources/web/js/zkmax/wgt/Step.ts
  - zkmax/src/main/resources/web/js/zkmax/wgt/Stepbar.ts
  - zkmax/src/main/resources/web/js/zkmax/wgt/mold/step.js
  - zkmax/src/main/resources/web/js/zkmax/wgt/mold/stepbar.js
js-source-hash: f0f2377442f72eaabc1287e74fc4f68752b68bc5eda633c106dd46dc7e5cdf38
closest-sibling: none — novel pattern (no ZK component renders connected-circle progress markers)

## References
- MUI CSS: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/Stepper.css` — consulted for circle size, connector thickness, primary fill semantics (visual cues only; ZK's DOM is independent of MUI's)
- Mira HTML: no analog — Mira does not ship a stepper component
- DESIGN.md sections: §3 (color roles), §4 (typography scale), §5 (spacing), §6 (shape), §7 (motion)
- Iceblue baseline: `doc/contracts/baselines/stepbar-iceblue.png`
- HTML contract: `doc/contracts/stepbar.html`

## Design Contract

A horizontal row of equally-spaced circular step markers connected by 2px lines. Upcoming steps render as an outlined circle (transparent fill, primary-color border, primary-color empty interior — ring-only treatment keeps upcoming visually distinct from the filled active/complete states without resorting to a neutral grey that would conflict with the connector color). The active step is a filled primary circle holding a centered icon in `on-primary`. Completed steps are filled primary circles holding a check glyph in `on-primary`. Connector lines are `outline-variant` for upcoming segments and `primary` for completed segments (the segment leading to a `.z-step-active` or `.z-step-complete` is "lit"). Step titles sit in body-small typography, color shifts from `on-surface-variant` (upcoming) to `on-surface` with medium weight (active) to `on-surface-variant` (completed). State transitions animate at short2/250ms.

## Expected values

NOTE ON SELECTORS: `.z-step-content` is always present in the DOM between `.z-step` and its icon/title children (unconditionally emitted by `mold/step.js`). All icon and title selectors include `.z-step-content` in the path. Selectors of the form `.z-step > .z-step-icon` do NOT match the live DOM.

| id | selector | property | expected (token preferred) | source |
|----|----------|----------|----------------------------|--------|
| s1 | `.z-stepbar` | display | `flex` | structural |
| s2 | `.z-stepbar` | align-items | `center` | layout |
| s3 | `.z-stepbar` | gap | `0` (gap is provided by step connector flex:1) | layout |
| s4 | `.z-stepbar` | padding | `var(--zk-spacing-2) 0` | DESIGN.md §5 |
| s5 | `.z-stepbar` | background | `transparent` | DESIGN.md §3 (use cases embed stepbar in page surface; do not add a panel background) |
| s6 | `.z-stepbar` | font-family | `var(--zk-typescale-font-family)` | DESIGN.md §4 |
| step-root-1 | `.z-step` | display | `flex` | structural |
| step-root-2 | `.z-step` | flex-direction | `row` | layout |
| step-root-3 | `.z-step` | align-items | `center` | layout |
| step-root-4 | `.z-step` | flex | `1 1 auto` | layout |
| step-root-5 | `.z-step:first-child` | flex | `0 1 auto` | layout (kills leading connector slot) |
| content-1 | `.z-step-content` | display | `flex` | structural |
| content-2 | `.z-step-content` | align-items | `center` | layout (keeps icon and title aligned; also centres connector on icon) |
| content-3 | `.z-step-content` | gap | `var(--zk-spacing-2)` | DESIGN.md §5 (icon ↔ title spacing) |
| conn-1 | `.z-step::before` | content | `''` | structural |
| conn-2 | `.z-step::before` | flex | `1` | layout (consume row gap between steps) |
| conn-3 | `.z-step::before` | height | `2px` | DESIGN.md §6 (connector stroke) |
| conn-4 | `.z-step::before` | margin | `0 var(--zk-spacing-3) 0 calc(-1 * var(--zk-spacing-3))` | layout (overlap onto step padding) |
| conn-5 | `.z-step::before` | background-color | `var(--zk-color-outline-variant)` | DESIGN.md §3 (upcoming connector) |
| conn-6 | `.z-step:first-child::before` | display | `none` | structural (no leading line) |
| conn-7 | `.z-stepbar-linear .z-step-active::before` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 (active connector lit) |
| conn-8 | `.z-stepbar-linear .z-step-complete::before` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 (complete connector lit) |
| conn-9 | `.z-step::before` | transition | `background-color var(--zk-motion-duration-short2) var(--zk-motion-easing-standard)` | DESIGN.md §7 |
| icon-1 | `.z-step-content > .z-step-icon` | width | `24px` | DESIGN.md §6 (marker geometry; MUI Stepper uses 24px) |
| icon-2 | `.z-step-content > .z-step-icon` | height | `24px` | DESIGN.md §6 |
| icon-3 | `.z-step-content > .z-step-icon` | border-radius | `50%` | structural (circle marker) |
| icon-4 | `.z-step-content > .z-step-icon` | display | `inline-flex` | layout |
| icon-5 | `.z-step-content > .z-step-icon` | align-items | `center` | layout |
| icon-6 | `.z-step-content > .z-step-icon` | justify-content | `center` | layout |
| icon-7 | `.z-step-content > .z-step-icon` | font-size | `16px` | DESIGN.md §6 (glyph inside 24px circle) |
| icon-8 | `.z-step-content > .z-step-icon` | box-sizing | `border-box` | structural |
| icon-9 | `.z-step-content > .z-step-icon` | transition | `background-color var(--zk-motion-duration-short2) var(--zk-motion-easing-standard), border-color var(--zk-motion-duration-short2) var(--zk-motion-easing-standard), color var(--zk-motion-duration-short2) var(--zk-motion-easing-standard)` | DESIGN.md §7 |
| upcoming-1 | `.z-step-content > .z-step-icon-empty` | background-color | `transparent` | DESIGN.md §3 (upcoming = ring only) |
| upcoming-2 | `.z-step-content > .z-step-icon-empty` | border | `2px solid var(--zk-color-primary)` | DESIGN.md §3 (ring-only treatment distinguishes upcoming from filled active/complete states without resorting to a neutral grey that would conflict with the connector color) |
| upcoming-3 | `.z-step-content > .z-step-icon-empty` | color | `transparent` | DESIGN.md §3 (no glyph) |
| active-1 | `.z-step-active .z-step-content > .z-step-icon` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 |
| active-2 | `.z-step-active .z-step-content > .z-step-icon` | border | `2px solid var(--zk-color-primary)` | DESIGN.md §3 |
| active-3 | `.z-step-active .z-step-content > .z-step-icon` | color | `var(--zk-color-on-primary)` | DESIGN.md §3 |
| complete-1 | `.z-step-complete .z-step-content > .z-step-icon` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 |
| complete-2 | `.z-step-complete .z-step-content > .z-step-icon` | border | `2px solid var(--zk-color-primary)` | DESIGN.md §3 |
| complete-3 | `.z-step-complete .z-step-content > .z-step-icon` | color | `var(--zk-color-on-primary)` | DESIGN.md §3 |
| error-1 | `.z-step-error .z-step-content > .z-step-icon` | background-color | `var(--zk-color-error)` | DESIGN.md §3 |
| error-2 | `.z-step-error .z-step-content > .z-step-icon` | border | `2px solid var(--zk-color-error)` | DESIGN.md §3 |
| error-3 | `.z-step-error .z-step-content > .z-step-icon` | color | `var(--zk-color-on-error)` | DESIGN.md §3 |
| title-1 | `.z-step-content > .z-step-title` | font-size | `var(--zk-typescale-body-medium-size)` | DESIGN.md §4 |
| title-2 | `.z-step-content > .z-step-title` | font-weight | `var(--zk-typescale-body-medium-weight)` | DESIGN.md §4 |
| title-3 | `.z-step-content > .z-step-title` | line-height | `var(--zk-typescale-body-medium-line-height)` | DESIGN.md §4 |
| title-4 | `.z-step-content > .z-step-title` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §3 (upcoming title) |
| title-5 | `.z-step-active .z-step-content > .z-step-title` | color | `var(--zk-color-on-surface)` | DESIGN.md §3 |
| title-6 | `.z-step-active .z-step-content > .z-step-title` | font-weight | `var(--zk-typescale-label-large-weight)` | DESIGN.md §4 (medium-weight emphasis on active) |
| title-7 | `.z-step-complete .z-step-content > .z-step-title` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §3 |
| title-8 | `.z-step-error .z-step-content > .z-step-title` | color | `var(--zk-color-error)` | DESIGN.md §3 |
| click-1 | `.z-stepbar:not(.z-stepbar-linear) .z-step` | cursor | `pointer` | DESIGN.md §7 (only non-linear steps are clickable per JS gate) |
| vert-1 | `.z-stepbar-vertical` | flex-direction | `column` | structural (vertical orient stacks steps top-to-bottom) |
| vert-2 | `.z-stepbar-vertical .z-step` | flex-direction | `row` | layout (within each vertical step, icon still precedes title left-to-right) |
| vert-3 | `.z-stepbar-vertical .z-step` | flex | `0 1 auto` | layout (vertical steps do NOT stretch to equal height; each step is intrinsic-height) |
| vert-4 | `.z-stepbar-vertical .z-step::before` | width | `2px` | DESIGN.md §6 (connector stroke; width/height roles swap from horizontal) |
| vert-5 | `.z-stepbar-vertical .z-step::before` | height | `auto` (or a `min-height` ≥ step gap) | layout (connector fills the vertical gap between adjacent icons) |
| vert-6 | `.z-stepbar-vertical .z-step::before` | flex | `1` | layout (vertical connector consumes column gap between steps) |
| vert-7 | `.z-stepbar-vertical .z-step:first-child::before` | display | `none` | structural (no leading connector on first step, vertical as horizontal) |
| vert-8 | `.z-stepbar-vertical .z-step-active::before` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 (lit connector, same token as horizontal) |
| vert-9 | `.z-stepbar-vertical .z-step-complete::before` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 |

## State matrix

| state | selector | property ids |
|-------|----------|--------------|
| stepbar-root | `.z-stepbar` | s1, s2, s3, s4, s5, s6 |
| step-root (any) | `.z-step` | step-root-1, step-root-2, step-root-3, step-root-4 |
| step-root (first) | `.z-step:first-child` | step-root-5, conn-6 |
| step-content (any) | `.z-step-content` | content-1, content-2, content-3 |
| connector (upcoming) | `.z-step::before` | conn-1, conn-2, conn-3, conn-4, conn-5, conn-9 |
| connector (active or complete, linear) | `.z-stepbar-linear .z-step-active::before`, `.z-stepbar-linear .z-step-complete::before` | conn-7, conn-8 |
| icon base (any) | `.z-step-content > .z-step-icon` | icon-1, icon-2, icon-3, icon-4, icon-5, icon-6, icon-7, icon-8, icon-9 |
| upcoming (default state) | `.z-step-content > .z-step-icon-empty` | upcoming-1, upcoming-2, upcoming-3 |
| active | `.z-step-active .z-step-content > .z-step-icon` | active-1, active-2, active-3 |
| complete | `.z-step-complete .z-step-content > .z-step-icon` | complete-1, complete-2, complete-3 |
| error | `.z-step-error .z-step-content > .z-step-icon` | error-1, error-2, error-3 |
| title (upcoming) | `.z-step-content > .z-step-title` | title-1, title-2, title-3, title-4 |
| title (active) | `.z-step-active .z-step-content > .z-step-title` | title-5, title-6 |
| title (complete) | `.z-step-complete .z-step-content > .z-step-title` | title-7 |
| title (error) | `.z-step-error .z-step-content > .z-step-title` | title-8 |
| non-linear hover affordance | `.z-stepbar:not(.z-stepbar-linear) .z-step` | click-1 |
| vertical root | `.z-stepbar-vertical` | vert-1 |
| vertical step | `.z-stepbar-vertical .z-step` | vert-2, vert-3 |
| vertical connector (upcoming) | `.z-stepbar-vertical .z-step::before` | vert-4, vert-5, vert-6 |
| vertical connector (first — hidden) | `.z-stepbar-vertical .z-step:first-child::before` | vert-7 |
| vertical connector (active/complete) | `.z-stepbar-vertical .z-step-active::before`, `.z-stepbar-vertical .z-step-complete::before` | vert-8, vert-9 |

## States to evaluate
- [ ] upcoming (default — no state class on step)
- [ ] active (first step, activeIndex=0 — connector should still be neutral because there is nothing before it)
- [ ] active (middle/last step — preceding steps are complete; preceding connectors are primary)
- [ ] complete (step preceding the active one in linear mode)
- [ ] error (step.error="true")
- [ ] linear mode (default — no click cursor on steps)
- [ ] non-linear mode (linear="false" — pointer cursor on steps)
- [ ] vertical orient — root carries `.z-stepbar-vertical`; connector pseudo-elements must have width/height roles swapped (connector becomes a vertical stripe, not a horizontal bar); verify vert-1 through vert-9 in the Expected values table
- [ ] wrapped-label (root carries `.z-stepbar-wrapped-label`; connector pseudo-elements move from `.z-step` to `.z-step-content`)

## T3 wrapper boundary

stepbar is novel enough to flag as T3 (no Mira/MUI Sapphire-grade analog in this codebase), but its DOM is fully ZK-owned — there is no third-party library injected DOM to firewall. No `forbidden-selectors`, no `theme-bridge` needed. T3 here means: review the contract carefully before turning the ralph-loop loose, not that styles need to dodge an opaque library.

## Change log

| Date | Hash (before) | Hash (after) | Cause | Contract changes |
|------|--------------|--------------|-------|-----------------|
| 2026-05-26 | `b09571285d7b559ed2be0d3045df17fa0c8179b667bb59c37dab6e5f9ed2aea9` | `6549c549e6302649c9f1305f836f45283fa3c640fdf4118d909f1f3b718df3d7` | commit 009fb2b6c "ZK-5597: vertical stepbar" — `orient` attribute + `setOrient()` + `.z-stepbar-vertical` added to `Stepbar.ts` | Added vert-1 through vert-9 to Expected values; added 5 vertical-orient rows to State matrix; promoted vertical-orient from "out of scope" to a first-class item in States to evaluate; flipped `contract-approved: false`. Skill updated: added `rerender()` / validation-gate behavior to Notes. |
| 2026-05-26 | `6549c549e6302649c9f1305f836f45283fa3c640fdf4118d909f1f3b718df3d7` | `f0f2377442f72eaabc1287e74fc4f68752b68bc5eda633c106dd46dc7e5cdf38` | CORRECTIVE re-run: mold files `mold/step.js` and `mold/stepbar.js` added to `js-source-files`. Hash now covers all four source files. Root cause: previous pass read only `.ts` files and incorrectly assumed `.z-step-content` was a conditional wrapper inserted only in `wrappedLabels=true` mode. Mold reveals it is **unconditionally** emitted around both icon and title in all modes. | (1) `js-source-files` extended to include both mold files. (2) Hash recomputed. (3) All icon selectors changed: `.z-step-icon` → `.z-step-content > .z-step-icon` (icon-1 through icon-9). (4) All title selectors changed: `.z-step-title` → `.z-step-content > .z-step-title` (title-1 through title-8). (5) All state-scoped icon selectors changed: `.z-step-active .z-step-icon` → `.z-step-active .z-step-content > .z-step-icon` (active, complete, error rows). (6) `.z-step .z-step-icon-empty` → `.z-step-content > .z-step-icon-empty` (upcoming-1 through upcoming-3). (7) Added content-1/2/3 rows for `.z-step-content` layout. (8) Removed `step-root-5` gap row from `.z-step` (gap now lives on `.z-step-content`). (9) State matrix updated: removed obsolete `.z-step-icon` rows; added `.z-step-content` row. (10) Skill DOM section completely rewritten: `.z-step-content` documented as unconditional; `wrappedLabels` role clarified as layout-direction change only, not DOM insertion. `wrappedLabels` entry in Attribute support corrected. Notes section adds `.z-step-icon` element-type correction (`<span>` not `<i>`). `contract-approved` flipped to `false` — re-approval required. |
