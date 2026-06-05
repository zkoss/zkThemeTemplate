# Component: splitter (theme design)
tier: T2
category: layout
preview: http://localhost:8080/splitter.zul   (or any borderlayout-with-splitter page)
rules: see .claude/skills/zk-component-rules/components/splitter.md
contract-approved: true
zk-version: 10.2.1-jakarta

> Revised 2026-06-04 per user splitter-family unification ruling (`tasks/feedback-goldenlayout-splitlayout-plan.md`, gap log `doc/skill-gaps.md`): the splitter now follows the canonical family spec in DESIGN.md §14 — shared with borderlayout region splitters, splitlayout, and goldenlayout (colors only).

## References
- DESIGN.md sections: **§14 (splitter family — canonical spec)**, §8 (state layers), §9 (motion), §11 (border rules)
- Closest siblings: `borderlayout` region splitters and `splitlayout` splitter — identical ZK mold pattern (bar + `<span>-button` + grip/caret/grip icons) and identical `setBtnPos_` JS centering (see skill file).
- Visual goal: one resize affordance across the app — unobtrusive tonal strip at rest, primary-tinted on hover, pill actuator.

## Expected values (T2) — DESIGN.md §14
- Bar: 8px thick (`--zk-spacing-2`), background `--zk-color-surface-container` at rest.
- Bar hover: `color-mix(in srgb, var(--zk-color-primary) calc(var(--zk-state-hover-opacity) * 100%), var(--zk-color-surface-container))`.
- Bar drag (`:active`): same mix with `--zk-state-pressed-opacity`.
- Actuator pill (`.z-splitter-button`): 8px cross-axis × 28px long-axis, `--zk-shape-corner-full`, `--zk-color-outline-variant` fill, no border, no elevation.
- Pill hover: `--zk-color-primary` fill, icons `--zk-color-on-primary`.
- Grip icons (`.z-splitter-icon.z-icon-ellipsis-*`): 8px, `--zk-color-on-surface-variant`, always visible (`opacity: 1`).
- Collapse caret (middle `.z-splitter-icon`): hidden at idle (`opacity: 0`), fades in on pill hover.
- Cursor: `col-resize` (`.z-splitter-horizontal`) / `row-resize` (`.z-splitter-vertical`).
- Non-resizable (`.z-splitter-nosplitter`): cursor `default`; `:hover` keeps the idle `--zk-color-surface-container` background — no primary tint on a bar that cannot resize (DESIGN.md §14 non-resizable row; Gate-2 finding 2026-06-04).
- Transition: `background-color var(--zk-motion-duration-short3) var(--zk-motion-easing-standard)`.
- Centering: pill midpoint within ±2px of bar midpoint on the long axis. Mechanism (errata 2026-06-04, outcome unchanged): never half-mix CSS and JS centering — either the axis is fully JS-owned (`setBtnPos_` inline margin; only safe when the bar's long-axis size is CSS-fixed at bind time) or fully CSS-owned (`margin-left/top: 0 !important` to neutralize the JS inline margin + `left/top: 50% + transform`). CSS ownership is required on a flex-resolved axis — `setBtnPos_` can run while the bar offset is still 0 (see skill file timing-trap notes; both half-mixing and JS-only-on-flex-axis shipped as real splitlayout bugs).
- Ghost (`.z-splitter-ghost`): `--zk-color-primary` at 0.3 opacity (matches borderlayout c41/c42).

## States to evaluate
- [ ] default, hover, active (drag), pill hover (primary fill + caret fade-in), nosplitter (cursor default), button centering both orientations
