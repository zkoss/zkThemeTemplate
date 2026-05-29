# Component: cascader
tier: T1
category: selection
shared-css-file: src/main/resources/web/js/zkmax/inp/css/cascader.css
siblings: []
preview: http://localhost:8080/cascader.zul

## References
- MUI CSS: Autocomplete.css (closest analog)
- DESIGN.md sections: §2, §3, §7, §11

## DOM key selectors
```
.z-cascader             ← root
.z-cascader-input       ← text input area
.z-cascader-button      ← dropdown arrow button
.z-cascader-popup       ← dropdown panel
.z-cascader-item        ← individual option
.z-cascader-item-active ← selected item
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-cascader` | border | 1px solid rgba(0, 0, 0, 0.23) |
| c2 | `.z-cascader` | border-radius | 4px |
| c3 | `.z-cascader-input` | font-size | 14px |
| c4 | `.z-cascader:hover` | border-color | rgba(0, 0, 0, 0.87) |
| c5 | `.z-cascader[disabled]` | opacity | 0.38 |
| c6 | `.z-cascader-popup` | background-color | rgb(255, 255, 255) |
| c7 | `.z-cascader-popup` | box-shadow | elevation-2 |

## States to evaluate
- [ ] default, hover, disabled, dropdown open
