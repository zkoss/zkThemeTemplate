# Component: cropper
tier: T2
category: media
shared-css-file: src/main/resources/web/js/zkmax/cropper/css/cropper.css
siblings: []
preview: http://localhost:8080/cropper.zul

## References
- DESIGN.md sections: §2, §3

## DOM key selectors
```
.z-cropper              ← root wrapper
.z-cropper-canvas       ← image editing canvas area
.z-cropper-toolbar      ← action toolbar (rotate, flip, zoom)
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-cropper` | border | 1px solid rgba(0, 0, 0, 0.12) |
| c2 | `.z-cropper` | border-radius | 4–8px |
| c3 | `.z-cropper-toolbar` | background-color | var(--zk-color-surface) |
| c4 | `.z-cropper-toolbar` | border-top | 1px solid rgba(0, 0, 0, 0.12) |

## States to evaluate
- [ ] default with image loaded
