# Component: navbar
tier: T1
category: navigation
shared-css-file: src/main/resources/web/js/zkmax/nav/css/nav.css
siblings: [anchornav]
preview: http://localhost:8080/navbar.zul

## References
- MUI CSS: Drawer.css, List.css
- DESIGN.md sections: §2, §3, §7, §9

## DOM key selectors
```
.z-navbar               ← root
.z-navbar-vertical      ← vertical orientation variant
.z-nav                  ← nav group
.z-nav-header           ← group header/label
.z-navitem              ← individual item
.z-navitem-selected     ← active/selected item
.z-navseparator         ← divider
```

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c0 | `.z-navbar` | background-color | `var(--zk-color-surface-container-low)` (MD3 Navigation Drawer surface; override to `transparent` at use site if nested in already-tinted region) |
| c1 | `.z-navitem` | padding | 8–12px 16px |
| c2 | `.z-navitem` | font-size | 14px |
| c3 | `.z-navitem-selected` | background-color | rgba(55, 111, 208, 0.12) |
| c4 | `.z-navitem-selected` | color | rgb(55, 111, 208) |
| c5 | `.z-navitem:hover` | background-color | rgba(0, 0, 0, 0.08) |
| c6 | `.z-nav-header` | font-size | 12px |

## States to evaluate
- [ ] default, selected/active, hover
