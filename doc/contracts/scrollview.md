# Component: scrollview
tier: T2
category: layout
shared-css-file: src/main/resources/web/js/zkmax/layout/css/scrollview.css
siblings: []
preview: ${PREVIEW_URL}/scrollview.zul

## References
- DESIGN.md sections: §2

## DOM key selectors
```
.z-scrollview           ← root container
.z-scrollview-inner     ← scrollable content wrapper
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-scrollview` | overflow | auto or hidden |
| c2 | `.z-scrollview` | background-color | transparent |

## States to evaluate
- [ ] default with content
