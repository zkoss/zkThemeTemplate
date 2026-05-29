# Component: coachmark
tier: T3
category: feedback
shared-css-file: src/main/resources/web/js/zkmax/wgt/css/coachmark.css
siblings: []
preview: http://localhost:8080/coachmark.zul

## Notes
No coachmark.css.dsp found in ZK source. May have its own CSS or be inline-styled.
Evaluator should verify which CSS rules apply to .z-coachmark elements.

## DOM key selectors
```
.z-coachmark            ← root overlay/tooltip-like element
.z-coachmark-body       ← content area
.z-coachmark-title      ← heading text
.z-coachmark-button     ← next/close button
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-coachmark` | background-color | rgb(55, 111, 208) (primary) or surface |
| c2 | `.z-coachmark` | border-radius | 8–12px |
| c3 | `.z-coachmark` | box-shadow | elevation-2+ |
| c4 | `.z-coachmark-title` | color | rgb(255, 255, 255) or on-primary |
| c5 | `.z-coachmark-body` | padding | 16–20px |

## States to evaluate
- [ ] visible coachmark tooltip
