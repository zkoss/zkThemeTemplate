# Component: rating (theme design)
tier: T1
category: input
preview: ${PREVIEW_URL}/rating.zul
rules: see .claude/skills/zk-component-rules/components/rating.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Rating.css
- DESIGN.md sections: §3, §12

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-rating-icon` | width / height | 20–24px |
| c2 | `.z-rating-icon` | color | rgba(0, 0, 0, 0.38) (empty) |
| c3 | `.z-rating-icon-checked` | color | rgb(237, 108, 2) (warning amber) or primary, per DESIGN.md §3 |
| c4 | `.z-rating-icon:hover` | color | hover tint of c3 |
| c5 | `.z-rating` | gap | ≥ 2px between stars |

## States to evaluate
- [ ] default (empty), hover, checked (filled), readonly, disabled
