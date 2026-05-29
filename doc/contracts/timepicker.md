# Component: timepicker
tier: T3
category: input
shared-css-file: src/main/resources/web/js/zkmax/inp/css/timepicker.css
siblings: [timebox]
preview: http://localhost:8080/timepicker.zul

## Notes
No timepicker.css.dsp found in ZK source. May share timebox.css or need its own file.
Evaluator should identify the CSS file in use and flag if missing.

## DOM key selectors
```
.z-timepicker           ← root
.z-timepicker-input     ← time input field
.z-timepicker-button    ← clock icon button
.z-timepicker-popup     ← clock face picker popup
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-timepicker` | border | 1px solid rgba(0, 0, 0, 0.23) |
| c2 | `.z-timepicker` | border-radius | 4px |
| c3 | `.z-timepicker-input` | font-size | 14px |
| c4 | `.z-timepicker[disabled]` | opacity | 0.38 |

## States to evaluate
- [ ] default, disabled
