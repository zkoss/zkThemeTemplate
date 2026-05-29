# Component: dropupload
tier: T2
category: media
shared-css-file: src/main/resources/web/js/zkmax/wgt/css/dropupload.css
siblings: []
preview: http://localhost:8080/dropupload.zul

## References
- DESIGN.md sections: §2, §3, §11

## DOM key selectors
```
.z-dropupload           ← root drop zone
.z-dropupload-active    ← drag-over active state
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-dropupload` | border | 2px dashed rgba(0, 0, 0, 0.23) |
| c2 | `.z-dropupload` | border-radius | 4–8px |
| c3 | `.z-dropupload` | background-color | transparent or rgba(55,111,208,0.04) |
| c4 | `.z-dropupload-active` | border-color | rgb(55, 111, 208) |
| c5 | `.z-dropupload-active` | background-color | rgba(55, 111, 208, 0.08) |

## States to evaluate
- [ ] default drop zone
