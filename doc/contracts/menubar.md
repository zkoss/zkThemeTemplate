# Component: menubar (theme design)
tier: T1
category: navigation
preview: http://localhost:8080/menubar.zul
rules: see .claude/skills/zk-component-rules/components/menubar.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: Menu.css / AppBar.css
- Mira HTML: doc/mira/menus.html
- DESIGN.md sections: §1, §7, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-menubar` | background-color | `var(--zk-color-surface-container)` (MD3 Top App Bar / Menu Bar surface; override to `transparent` at use site if nested in already-tinted region) |
| c2 | `.z-menu-content` | padding | 8px 16px |
| c3 | `.z-menu-content` | font-size | 14px |
| c4 | `.z-menu:hover .z-menu-content` | background-color | state-layer tint |
| c5 | `.z-menu-selected .z-menu-content` | background-color | `rgb(214, 228, 255)` (= `--zk-color-primary-container`) — LIST-ROW family, see `reference/selected-state-families.md` |
| c6 | `.z-menu-selected .z-menu-content` | color | `rgb(0, 28, 61)` (= `--zk-color-on-primary-container`) |
| c7 | `.z-menu-selected .z-menu-content` | background-color | MUST NOT be `rgb(178, 223, 219)` (= `--zk-color-secondary-container`) — wrong family |

## States to evaluate
- [ ] default, hover, open/selected, disabled
