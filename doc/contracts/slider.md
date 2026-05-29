# Component: slider (theme design)
tier: T1
category: input
preview: http://localhost:8080/slider.zul
rules: see .claude/skills/zk-component-rules/components/slider.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Slider.css
- Mira HTML: doc/mira/forms-selection-controls.html (slider section)
- DESIGN.md sections: §2, §3, §9, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-slider-center` | height | ~4px |
| c2 | `.z-slider-center` | background-color | rgba(0, 0, 0, ~0.12) (track) |
| c3 | `.z-slider-area` | background-color | rgb(55, 111, 208) (primary) |
| c4 | `.z-slider-button` | width / height | 16–20px square (or circle if sphere) |
| c5 | `.z-slider-button` | background-color | rgb(55, 111, 208) |
| c6 | `.z-slider-button` | border-radius | 50% |
| c7 | `.z-slider-button:hover` | box-shadow | state-layer ring expansion |
| c8 | `.z-slider-button:focus-visible` | outline / shadow | visible focus ring |

## States to evaluate
- [ ] default, hover, focus-visible, disabled, dragging
