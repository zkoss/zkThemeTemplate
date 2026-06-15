# Component: timebox (theme design)
tier: T1
category: input
preview: http://localhost:8080/timebox.zul
rules: see .claude/skills/zk-component-rules/components/combo-trio.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: TimePicker.css
- Mira HTML: doc/mira/forms-pickers.html
- DESIGN.md sections: §1, §2, §5, §7, §9, §10, §11

## Expected values
Same input metrics as combobox c1–c7 (selectors → `.z-timebox-*`).

## States to evaluate
- [ ] default, hover, focus, disabled, readonly, invalid
- [ ] inplace (see `reference/inplace-state.md`)
- [ ] buttonVisible-false (clock icon hidden — see `reference/buttonVisible-attribute.md`; verify `.z-timebox-button.z-timebox-disabled` has `display: none`)

## Tablet / mobile wheel picker (touch UA only)
On a mobile UA ZK swaps the desktop stepper for a scrolling **wheel picker** and
forces the input `readonly`. Open the popup on tablet to verify (see
`reference/mobile-wheel-picker.md`). Guarded by `tablet.spec.ts`
→ `tablet-timebox-wheel`.
- [ ] `.z-timebox-wheel-list` height ≈ 120px (3 rows; NEVER the full unbounded list) and `li` height = list height ÷ 3 (the `offsetHeight/3` centering invariant)
- [ ] opened popup lands on-screen (bottom sheet, not pushed off-screen by an over-tall wheel)
- [ ] **both tap targets land flush**: tapping the **input** AND tapping the **icon** both open the sheet flush to the viewport bottom (`bottom ≈ innerHeight`, overshoot ≤ 2px). ZK's inline `top` is inflated by `makeVParent` and only self-corrects on an icon tap — the theme must PIN the sheet (`position:fixed; bottom:0`) so the input tap doesn't overshoot below the fold (clipping OK/Cancel)
- [ ] centred `.z-timebox-wheel-list-selected` row is visible above the `.z-timebox-wheel-line` band (list `z-index` > line)
- [ ] mobile-readonly trigger stays interactive: `.z-timebox-readonly .z-timebox-button` is NOT `pointer-events: none`
- [ ] footer `.z-timebox-wheel-left` (confirm) = filled primary, `.z-timebox-wheel-right` (cancel) = tonal
