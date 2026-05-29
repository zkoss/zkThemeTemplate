# Component: checkbox (theme design)
tier: T1
category: selection
preview: http://localhost:8080/checkbox.zul
rules: see .claude/skills/zk-component-rules/components/checkbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Checkbox.css
- Mira HTML: doc/mira/forms-selection-controls.html
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

## States to evaluate
- [ ] unchecked, checked, indeterminate (if supported), hover, focus-visible, disabled
- [ ] switch variant, toggle variant
