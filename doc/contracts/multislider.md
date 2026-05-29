# Component: multislider
tier: T2
category: input
shared-css-file: src/main/resources/web/js/zkmax/slider/css/multislider.css
siblings: []
preview: http://localhost:8080/multislider.zul

## References
- MUI CSS: Slider.css
- DESIGN.md sections: §2, §3, §9, §11

## DOM key selectors
```
.z-multislider          ← root
.z-multislider-center   ← track
.z-multislider-area     ← filled range between thumbs
.z-multislider-button   ← thumb handle
.z-multislider-horizontal / -vertical
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-multislider-center` | height | ~4px (horizontal track) |
| c2 | `.z-multislider-center` | background-color | rgba(0, 0, 0, 0.12) |
| c3 | `.z-multislider-area` | background-color | rgb(55, 111, 208) |
| c4 | `.z-multislider-button` | width / height | 16–20px |
| c5 | `.z-multislider-button` | background-color | rgb(55, 111, 208) |
| c6 | `.z-multislider-button` | border-radius | 50% |

## States to evaluate
- [ ] horizontal (3 ranges), vertical (2 ranges)
