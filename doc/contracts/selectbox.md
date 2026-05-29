# Component: selectbox (theme design)
tier: T1
category: selection
preview: http://localhost:8080/selectbox.zul
rules: see .claude/skills/zk-component-rules/components/selectbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Select.css
- Mira HTML: doc/mira/forms-selects.html
- DESIGN.md sections: §1, §2, §5, §7, §10, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-selectbox` | height | 39–40px |
| c2 | `.z-selectbox` | padding-right | ≥ 24px (space for dropdown icon) |
| c3 | `.z-selectbox` | border | 1px solid rgba(0, 0, 0, 0.23) |
| c4 | `.z-selectbox` | border-radius | 4px |
| c5 | `.z-selectbox` | font-size | 13px |
| c6 | `.z-selectbox` | background-image | SVG dropdown chevron (data: URL) |
| c7 | `.z-selectbox:hover` | border-color | rgba(0, 0, 0, 0.87) |
| c8 | `.z-selectbox:focus` | border-color | rgb(55, 111, 208) |
| c9 | `.z-selectbox:focus` | border-width | 2px |
| c10 | `.z-selectbox[disabled]` | opacity | 0.38 |

## States to evaluate
- [ ] default, hover, focus-visible, disabled
