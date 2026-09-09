# Component: fisheyebar
tier: T2
category: navigation
shared-css-file: src/main/resources/web/js/zkex/menu/css/fisheye.css
siblings: []
preview: ${PREVIEW_URL}/fisheyebar.zul

## References
- DESIGN.md sections: §2, §3, §9

## DOM key selectors
```
.z-fisheyebar           ← root container
.z-fisheye              ← individual item
.z-fisheye-img          ← item icon/image
.z-fisheye-text         ← item label
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-fisheyebar` | background-color | var(--zk-color-surface) or transparent |
| c2 | `.z-fisheye:hover` | transform | scale magnification (fisheye effect) |
| c3 | `.z-fisheye-text` | font-size | 12–14px |

## States to evaluate
- [ ] default, hover magnification
