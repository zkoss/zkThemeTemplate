# Component: drawer
tier: T2
category: container
shared-css-file: src/main/resources/web/js/zkmax/wgt/css/drawer.css
siblings: []
preview: http://localhost:8080/drawer.zul

## References
- MUI CSS: Drawer.css
- DESIGN.md sections: §2, §3, §6, §10

## DOM key selectors
```
.z-drawer               ← root overlay panel
.z-drawer-header        ← title area
.z-drawer-body          ← content area
.z-drawer-mask          ← backdrop overlay
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-drawer` | background-color | rgb(255, 255, 255) |
| c2 | `.z-drawer` | box-shadow | elevation-3+ shadow |
| c3 | `.z-drawer-mask` | background-color | rgba(0, 0, 0, 0.32) (scrim) |
| c4 | `.z-drawer-header` | padding | 16–24px |
| c5 | `.z-drawer-header` | font-size | 16px or headline-sm |

## States to evaluate
- [ ] visible drawer with content
