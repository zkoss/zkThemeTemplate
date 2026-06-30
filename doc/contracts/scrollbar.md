# Component: scrollbar
tier: T2
category: scrollbar
preview: http://localhost:8080/scrollbar.zul
zk-version: 10.2.1-jakarta

## References
- DESIGN.md sections: §5 (Corner Radii), §9 (Motion), §15 (Scrollbar)
- Skill: `.claude/skills/zk-component-rules/components/scrollbar.md` (DOM tree, gating, must-bundle loading rule)
- MUI / Mira: **none** — both ship native browser scrollbars only; the native `::-webkit-scrollbar` bar in `base/_reset.css` is the de-facto MD3 baseline.

This contract covers the **simulated** scrollbar (`zul.Scrollbar`, rendered only when
`org.zkoss.zul.nativebar="false"`). The native `::-webkit-scrollbar` bar is covered by the
reset/frozen CSS, not here.

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| s0 | `.z-scrollbar-indicator` | (rule present in a LOADED stylesheet) | **border-radius ≠ 0px** — proves `scrollbar.css` is bundled into `norm.css.dsp` and served (regression guard for the 2026-06-30 orphan gap) |
| s1 | `.z-scrollbar-indicator` | border-radius | pill — `var(--zk-shape-corner-full)` = 9999px (NOT 4px) |
| s2 | `.z-scrollbar-indicator` | background-color | `--zk-color-outline` @ idle opacity 0.6 (bolder draggable thumb) |
| s3 | `.z-scrollbar-indicator` | opacity | 0.6 |
| s4 | `.z-scrollbar-indicator` | transition-timing-function | `cubic-bezier(0.4, 0, 0.2, 1)` (`--zk-motion-easing-standard`, NOT `ease`) |
| s5 | `.z-scrollbar-indicator:hover` | background-color | `--zk-color-on-surface-variant` |
| s6 | `.z-scrollbar-indicator:hover` | opacity | 0.85 |
| s7 | `.z-scrollbar-rail` | background | `--zk-color-surface-container` (a **visible** faint track channel — NOT transparent; distinguishes the simulated bar from the track-less native overlay) |
| s8 | `.z-scrollbar-rail` | border-radius | pill — `var(--zk-shape-corner-full)` |
| s9 | `.z-scrollbar-vertical` | width | 12px (lane); track `.z-scrollbar-rail` width 8px; `.z-scrollbar-indicator` width 6px (1px inset in track) |
| s10 | `.z-scrollbar-horizontal` | height | 12px (lane); track height 8px; `.z-scrollbar-indicator` height 6px |
| s11 | `.z-scrollbar-vertical-embed`, `.z-scrollbar-horizontal-embed` | background-color / border-radius | `--zk-color-outline-variant` / pill; 6px cross-axis thickness; **no `:hover` rule** |
| s12 | `.z-scrollbar-up`, `.z-scrollbar-down`, `.z-scrollbar-left`, `.z-scrollbar-right` | display | **NOT none** — step buttons are shown (12×12, flat, neutral caret `i` ~11px, faint hover state layer). They appear only on hover with the rest of the bar. |
| s13 | `.z-scrollbar-vertical .z-scrollbar-wrapper` | top | 12px (inset by the up-button height so `syncSize()` math aligns); horizontal wrapper `left` 12px |

## States to evaluate
- [ ] gating: `nativebar="false"` renders the simulated `.z-scrollbar`; `nativebar="true"` renders the native bar (no `.z-scrollbar*` DOM)
- [ ] mode: overlay (`data-embedscrollbar="false"` — no `*-embed`, hover-only float) vs embedded (`data-embedscrollbar="true"` — static `*-embed` rail at rest)
- [ ] orientation: vertical + horizontal (both lanes present when content overflows both axes)
- [ ] thumb states: idle, hover (darkens to on-surface-variant), drag/active
- [ ] step buttons shown in every mode/orientation; caret icon renders; hover state layer
- [ ] visible track channel present behind the thumb (distinct from native)
- [ ] **loading**: the `.z-scrollbar-indicator` rule must come from a served stylesheet (bundled, not an orphaned standalone `.dsp`)
