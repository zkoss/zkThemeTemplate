# Component: biglistbox
tier: T2
category: data
shared-css-file: src/main/resources/web/js/zkmax/big/css/biglistbox.css
siblings: []
preview: http://localhost:8080/biglistbox.zul

## References
- MUI CSS: DataGrid.css (closest analog)
- DESIGN.md sections: §2, §3, §4, §9

## DOM key selectors
```
.z-biglistbox           ← root
.z-biglistbox-header    ← column header row
.z-biglistbox-row       ← data row
.z-biglistbox-cell      ← individual cell
.z-biglistbox-odd       ← alternating row
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-biglistbox` | border | 1px solid rgba(0, 0, 0, 0.12) |
| c2 | `.z-biglistbox-header` | background-color | transparent or surface |
| c3 | `.z-biglistbox-header` | border-bottom | 1px solid rgba(0, 0, 0, 0.12) |
| c4 | `.z-biglistbox-cell` | padding | 8–16px |
| c5 | `.z-biglistbox-row:hover` | background-color | rgba(0, 0, 0, 0.04) |

## States to evaluate
- [ ] default with rows, header visible
