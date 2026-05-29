# Component: rangeslider
tier: T2
category: input
shared-css-file: src/main/resources/web/js/zkex/slider/css/rangeslider.css
siblings: []
preview: http://localhost:8080/rangeslider.zul

## References
- MUI CSS: Slider.css
- DESIGN.md sections: §2, §3, §9, §11

## DOM key selectors
```
.z-rangeslider          ← root
.z-rangeslider-center   ← track
.z-rangeslider-area     ← filled range between start/end thumbs
.z-rangeslider-button   ← start/end thumb
.z-rangeslider-scale    ← scale marks (markScale variant)
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-rangeslider-center` | height | ~4px (horizontal track) |
| c2 | `.z-rangeslider-center` | background-color | rgba(0, 0, 0, 0.12) |
| c3 | `.z-rangeslider-area` | background-color | rgb(55, 111, 208) |
| c4 | `.z-rangeslider-button` | width / height | 16–20px |
| c5 | `.z-rangeslider-button` | background-color | rgb(55, 111, 208) |
| c6 | `.z-rangeslider-button` | border-radius | 50% |

## States to evaluate
- [ ] horizontal default, horizontal with scale marks, vertical
