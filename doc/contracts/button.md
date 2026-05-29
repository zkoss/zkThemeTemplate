# Component: button (theme design)
tier: T1
category: button
preview: http://localhost:8080/button.zul
rules: see .claude/skills/zk-component-rules/components/button.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: /Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/Button.css
- Mira HTML: doc/mira/buttons.html
- DESIGN.md sections: §3, §5, §7, §8, §9, §10, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-button` | height | 34–36px |
| c2 | `.z-button` | padding (top/bottom) | 6px |
| c3 | `.z-button` | padding (left/right) | ≥ 12px |
| c4 | `.z-button` | font-size | 14px |
| c5 | `.z-button` | font-weight | 500 |
| c6 | `.z-button` | text-transform | uppercase OR none (per DESIGN; allow either) |
| c7 | `.z-button` | border-radius | 4px |
| c8 | `.z-button` | background-color | rgb(55, 111, 208) (primary filled) |
| c9 | `.z-button` | color | rgb(255, 255, 255) |
| c10 | `.z-button` | transition-duration | 250ms |
| c11 | `.z-button:hover` | background-color | darker tint of c8 (state layer 0.08) |
| c12 | `.z-button:focus-visible` | outline | visible (ring or state layer) |
| c13 | `.z-button[disabled]` | opacity | 0.38 |
| c14 | `.z-button` | box-shadow | elevation level 1 (resting) |

## States to evaluate
- [ ] default, hover, focus-visible, active (pressed), disabled
- [ ] variants if applicable: outlined, text (sclass="z-button-outlined", "z-button-text")
