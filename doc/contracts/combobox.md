# Component: combobox (theme design)
tier: T1
category: input
preview: http://localhost:8080/combobox.zul
rules: see .claude/skills/zk-component-rules/components/combobox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: /Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/Autocomplete.css
- Mira HTML: doc/mira/forms-selects.html
- DESIGN.md sections: §1, §2, §5, §7, §9, §10, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-combobox-input` | height | 39–40px |
| c2 | `.z-combobox-input` | font-size | 13px |
| c3 | `.z-combobox-input` | border | 1px solid rgba(0, 0, 0, 0.23) |
| c4 | `.z-combobox-input` | border-radius | 4px |
| c5 | `.z-combobox-input:hover` | border-color | rgba(0, 0, 0, 0.87) |
| c6 | `.z-combobox-input:focus` | border-color | rgb(55, 111, 208) |
| c7 | `.z-combobox-input:focus` | border-width | 2px |
| c8 | `.z-combobox-button` | width | 24–32px (small icon area) |
| c9 | `.z-combobox-popup` | box-shadow | dropdown shadow (DESIGN.md §6, level 2) |
| c10 | `.z-combobox-popup` | border-radius | 4px |
| c11 | `.z-comboitem` | padding | 8px ≤ px ≤ 12px vertically |
| c12 | `.z-comboitem:hover` | background-color | tinted (rgba(0,0,0,~0.04)) |
| c13 | `.z-comboitem-selected` | background-color | `rgb(214, 228, 255)` (= `--zk-color-primary-container`) — LIST-ROW family, see `reference/selected-state-families.md` |
| c14 | `.z-comboitem-selected` | color | `rgb(0, 28, 61)` (= `--zk-color-on-primary-container`) |
| c15 | `.z-comboitem-selected` | background-color | MUST NOT be `rgb(178, 223, 219)` (= `--zk-color-secondary-container`) — wrong family |

## States to evaluate
- [ ] default
- [ ] hover (input + popup items)
- [ ] focus-visible (input)
- [ ] disabled
- [ ] readonly
- [ ] invalid
- [ ] open (popup visible)
- [ ] item-selected
- [ ] inplace (border/background collapse when blurred — see `reference/inplace-state.md`)
- [ ] buttonVisible-false — combobox uses split-border pattern (see `reference/buttonVisible-attribute.md`). Two sub-checks both required:
  - (a) `.z-combobox-button.z-combobox-disabled` has `display: none`
  - (b) `.z-combobox-input.z-combobox-input-full` has 4-side border (`border-right` is NOT `none`) and uniform `border-radius` (no flat-right rectangle)
