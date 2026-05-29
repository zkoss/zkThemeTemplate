# Component: imagemap
tier: T1
category: layout
shared-css-file: src/main/resources/web/js/zul/wgt/css/imagemap.css
siblings: []
preview: http://localhost:8080/imagemap.zul

## References
- DESIGN.md sections: §2

## DOM key selectors
```
.z-imagemap             ← root wrapper
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-imagemap` | display | inline-block or block |
| c2 | `.z-imagemap` | border | none (no extra border) |

## States to evaluate
- [ ] default
