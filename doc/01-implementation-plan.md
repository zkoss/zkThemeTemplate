# ZK Material Theme - Implementation Plan

## Phase Overview

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Project Restructuring | ✅ Complete |
| Phase 2 | Material Design Token System | ✅ Complete |
| Phase 3 | Base Styles | ✅ Complete |
| Phase 4 | Component Implementation | 🔄 In Progress |

---

## Phase 1: Project Restructuring ✅

### Completed Tasks

1. **Created new Java package** `org.zkoss.theme.zkmaterial`
   - `ZkMaterialThemeWebAppInit.java`
   - `ZkMaterialThemeProvider.java`
   - `Version.java`

2. **Updated configuration files**
   - `pom.xml` - Changed artifact to `zk-material`
   - `package.json` - Replaced zkless-engine with CSS tools
   - `metainfo/zk/config.xml`
   - `metainfo/zk/lang-addon.xml`
   - `metainfo/zk/zk.xml`

3. **Removed LESS infrastructure**
   - Deleted all `.less` files
   - Removed `zkless-engine` dependency
   - Deleted old Java package `org.zkoss.theme.iceblue_rem`

4. **Created CSS directory structure**
   ```
   src/main/resources/web/css/
   ├── tokens/
   ├── base/
   └── components/
       ├── layout/
       ├── inputs/
       ├── buttons/
       ├── selection/
       ├── data/
       ├── navigation/
       ├── containers/
       ├── widgets/
       └── calendar/
   ```

5. **Created build script** `scripts/build-css.js`

---

## Phase 2: Material Design Token System ✅

### Created Token Files

| File | Content |
|------|---------|
| `tokens/_colors.css` | Full M3 color system (primary, secondary, tertiary, error, surface, neutral) |
| `tokens/_typography.css` | Type scale (display, headline, title, label, body) |
| `tokens/_spacing.css` | 4dp baseline grid (4px-96px) |
| `tokens/_elevation.css` | 5 elevation levels with shadows |
| `tokens/_shape.css` | Corner radius system |
| `tokens/_motion.css` | Duration and easing curves |

---

## Phase 3: Base Styles ✅

### Created Base Files

| File | Content |
|------|---------|
| `base/_reset.css` | CSS normalize/reset |
| `base/_utilities.css` | Flexbox, spacing, typography utilities |
| `base/_icons.css` | Icon sizing and icon button styles |
| `zk-material.css` | Main entry point with ZK integration styles |

---

## Phase 4: Component Implementation 🔄

### Component Priority Order

#### Tier 1 - Core Components (Start Here)
1. ✅ Button (`components/buttons/_button.css`)
2. ⬜ Textbox (`components/inputs/_textbox.css`)
3. ⬜ Checkbox, Radio (`components/selection/_checkbox.css`)
4. ⬜ Combobox (`components/inputs/_combobox.css`)

#### Tier 2 - Data Components
5. ⬜ Listbox (`components/data/_listbox.css`)
6. ⬜ Grid (`components/data/_grid.css`)
7. ⬜ Tree (`components/data/_tree.css`)
8. ⬜ Paging (`components/data/_paging.css`)

#### Tier 3 - Navigation
9. ⬜ Tabbox (`components/navigation/_tabbox.css`)
10. ⬜ Menu (`components/navigation/_menu.css`)
11. ⬜ Toolbar (`components/navigation/_toolbar.css`)

#### Tier 4 - Containers
12. ⬜ Window (`components/containers/_window.css`)
13. ⬜ Panel (`components/containers/_panel.css`)
14. ⬜ Popup (`components/containers/_popup.css`)
15. ⬜ Groupbox (`components/containers/_groupbox.css`)

#### Tier 5 - Remaining
16. ⬜ Datebox, Timebox, Spinner, Slider, Bandbox
17. ⬜ Layout components (Box, BorderLayout, etc.)
18. ⬜ Misc widgets (Progressmeter, Rating, Separator, etc.)
19. ⬜ Calendar

### Component Implementation Workflow

For each component:

1. **Research DOM Structure**
   - Check ZK source at `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/`
   - Look for `mold/*.js` (HTML template)
   - Look for `*.ts` (component logic)
   - Look for `less/*.less` (existing styles for reference)

2. **Document DOM Structure** in `doc/03-component-dom-structures.md`

3. **Implement CSS** following Material Design 3 guidelines
   - Use design tokens
   - Implement all states (hover, focus, active, disabled)
   - Add variants via sclass

4. **Test** in preview app at `http://localhost:8080/{component}.zul`

---

## Verification Checklist

### Per Component
- [ ] All states work (hover, focus, active, disabled)
- [ ] Respects design tokens
- [ ] Accessible (focus visible, contrast ratios)
- [ ] Consistent with Material Design 3 guidelines

### Final
- [ ] All 25 components styled
- [ ] Preview app tested
- [ ] Build successful
- [ ] JAR deployable
