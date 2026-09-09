# Component: checkbox (theme design)
tier: T1
category: selection
preview: ${PREVIEW_URL}/checkbox.zul
rules: see .claude/skills/zk-component-rules/components/checkbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Checkbox.css; Inputs/Switch.css (switch mold — visual benchmark is MUI v7 medium, NOT the MD3 spec sheet)
- DESIGN.md sections: §2, §3, §7, §8, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-checkbox-mold` | width / height | 18–20px |
| c2 | `.z-checkbox-mold` | border | 2px solid rgba(0, 0, 0, 0.6) (unchecked) |
| c3 | `.z-checkbox-mold` | border-radius | 2px (checkbox) or 50% (radio) |
| c4 | `.z-checkbox-input:checked + .z-checkbox-mold` | background-color | rgb(55, 111, 208) |
| c5 | `.z-checkbox-input:checked + .z-checkbox-mold` | content/check-mark | white check icon |
| c6 | `.z-checkbox:hover .z-checkbox-mold` | background-color | state-layer overlay |
| c7 | `.z-checkbox-input:focus-visible + .z-checkbox-mold` | outline / shadow | focus ring |
| c8 | `.z-checkbox[disabled]` | opacity | 0.38 |
| c9 | `.z-checkbox-content` | font-size | 13–14px |

### Switch mold (`mold="switch"`) — MUI v7 medium values, token-adapted

MUI medium: root 58×38 = 34×14 visible track (radius 7, no border) + 20px thumb that
**overhangs the track** by 3px on every side; checked travel = translateX(20px).
The MD3 spec-sheet switch (52×32 track, 2px outline border) must NOT be used — it is
~2.3× the visual height of the theme's other row controls (18px checkbox, 13–14px labels).

| id | selector | property | expected |
|----|----------|----------|----------|
| sw1 | `.z-checkbox-switch > .z-checkbox-mold` (track) | width × height | 34 × 14px |
| sw2 | track | border-radius / border | 7px / none |
| sw3 | track (off) | background-color | on-surface via color-mix ≈ rgba(0, 0, 0, 0.38) (MUI: #000 @ .38) |
| sw4 | `.z-checkbox-switch-on > .z-checkbox-mold` | background-color | `color-mix(… var(--zk-color-primary) 50% …)` ≈ rgba(55, 111, 208, 0.5) |
| sw5 | thumb (`::after`) | size / shape / clipping | 20 × 20px, border-radius 50%, overhangs track 3px each side (track must NOT be `overflow: hidden`) |
| sw6 | thumb (off) | background / box-shadow | `var(--zk-color-surface)` (#fff) / `var(--zk-elevation-1)` |
| sw7 | thumb (on) | background / position | `var(--zk-color-primary)` rgb(55, 111, 208); `left: calc(100% - 17px)` ⇒ 20px travel from off (`left: -3px`) |
| sw8 | hover (non-disabled) | state-layer halo (`::before`) | 38px circle centered on the thumb; opacity `--zk-state-hover-opacity`; on-surface (off) / primary (on) |
| sw9 | `.z-checkbox-switch-disabled` | opacity | 0.38 |

### Toggle mold (`mold="toggle"`) — MD3 filled-toggle reading, compact

ZK renders the mold element **empty** (label is always a sibling — see skill "The mold element
is always EMPTY"), so the fill is the only on/off signal. Per user decision (2026-06-04): a
check icon reads as *selection confirmation*, which diverges from a toggle's press semantics —
so ON = **solid primary fill** (MD3 toggle button "selected = filled container" reading; no
glyph), NO inset shadow. Sizing stays MUI-compact (32×32, r4).

| id | selector | property | expected |
|----|----------|----------|----------|
| tg1 | `.z-checkbox-toggle > .z-checkbox-mold` | width × height | 32 × 32px |
| tg2 | mold (off) | border / border-radius | 1px solid `--zk-color-outline-variant` rgba(0, 0, 0, 0.12) / 4px |
| tg3 | mold (off) | background | transparent; hover (non-disabled) = on-surface 8% state layer |
| tg4 | `.z-checkbox-toggle-on > .z-checkbox-mold` | background / border / shadow / content | solid `var(--zk-color-primary)` rgb(55, 111, 208); border-color primary; box-shadow none (no inset); NO injected glyph (`::after` display none) |
| tg6 | on hover (non-disabled) | background | on-primary 8% state layer over primary (`color-mix(… var(--zk-color-on-primary) 8%, var(--zk-color-primary))` — filled-button convention) |
| tg7 | `.z-checkbox-toggle-disabled` | opacity | 0.38 |

(tg5 retired 2026-06-04 — check icon removed by user decision; id not reused.)

### Tristate mold (`mold="tristate"`) — three visually distinct states

ZK emits mold-**prefixed** state classes for this mold (`.z-checkbox-tristate-off` / `-on` /
`-indeterminate`), NOT the unprefixed default-mold classes — see the checkbox skill entry. The box
reuses the default-mold visual (18px square, `::after` glyph). Each state must be distinguishable:
checked = checkmark on a primary fill, indeterminate = dash on a primary fill. (Gap 2026-07-14.)

| id | selector | property | expected |
|----|----------|----------|----------|
| tr1 | `.z-checkbox-tristate-off > .z-checkbox-mold` | background / `::after` | transparent box, outline border; `::after` display none (no glyph) |
| tr2 | `.z-checkbox-tristate-on > .z-checkbox-mold` | background / `::after` | `var(--zk-color-primary)` fill; `::after` display block = **checkmark** SVG |
| tr3 | `.z-checkbox-tristate-indeterminate > .z-checkbox-mold` | background / `::after` | `var(--zk-color-primary)` fill; `::after` display block = **dash** SVG |
| tr4 | tr2 vs tr3 | `::after` background-image | must **differ** (checkmark ≠ dash) — the two states are not interchangeable |
| tr5 | `.z-checkbox-disabled.z-checkbox-tristate-{on,indeterminate}` | opacity | 0.38 |

## States to evaluate
- [ ] unchecked, checked, indeterminate (if supported), hover, focus-visible, disabled
- [ ] switch mold: off, on, hover, focus-visible, disabled (sw1–sw9)
- [ ] toggle mold: off, on, hover, focus-visible, disabled (tg1–tg7)
- [ ] tristate mold: off, on (checkmark), indeterminate (dash), disabled (tr1–tr5)
