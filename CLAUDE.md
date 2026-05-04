# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **zk-material** - a Material Design 3 theme for ZK Framework targeting enterprise customers. The project uses pure CSS (no LESS) with CSS Custom Properties for theming.

- **Theme Name**: `zk-material`
- **Version**: 1.0.0
- **ZK Version**: 10.2.1-jakarta
- **Design System**: Material Design 3 (Material You)
- **Spring Boot Version**: 3.2.6 (for preview app)
- **Browser Support**: Modern browsers only (last 2 versions of Chrome, Firefox, Safari, Edge)

### Project Goals
Create a modern, accessible, and high-quality MD3 theme that enables enterprise users to build visually appealing ZK applications.

### Workflow
Claude acts as project manager coordinating subagents:
1. **zk-theme-creator**: Create/update component styles.
2. **md3-design-verifier**: Verify design against MD3 specifications.
3. **zk-framework-expert**: Handle ZUL changes and ZK-specific knowledge.

### Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme Name | `zk-material` | Clear, descriptive name |
| Styling Language | Pure CSS | Simpler tooling, no LESS dependency |
| Dark Theme | Light only (initial) | Reduce scope, add dark later |
| DOM Research | Browser + ZK source | Both approaches for accuracy |
| Browser Support | Modern only | Enables CSS custom properties without fallbacks |

## Key Commands

### Initial Setup
```bash
# Install CSS build dependencies
npm install
```

### Build and Package
```bash
# Build jar file (compiles CSS and packages)
mvn clean package

# Build without tests (if using JDK 11)
mvn clean package -Dmaven.test.skip=true

# Build CSS only
npm run build:css

# Watch CSS files for development
npm run watch
```

### Build Notes
- **Java Version Compatibility for Tests**: The project's test code requires JDK 17 or higher. If you are building with JDK 11 (or an older version), you must skip tests by adding `-Dmaven.test.skip=true` to your Maven command.

### Preview and Development
```bash
# Run preview application on localhost:8080
# This also starts npm run watch (live-reload on port 50000) automatically via process-resources phase
withjdk.sh 17 mvn test exec:java@preview-app
```

The `watch-css` Maven execution (bound to `process-resources`, `async: true`) starts `npm run watch` automatically. It watches:
- `src/main/resources/web/**/*.css` → rebuilds theme CSS → browser hot-swaps (no reload)
- `src/test/resources/web/**/*.zul` → copies to target → browser reloads page
- `src/test/resources/web/**/*.css` → copies to target → browser hot-swaps (no reload)
- `src/test/resources/web/**/*.{png,jpg,gif,svg,webp}` → copies to target → browser reloads page

The live-reload client script is injected via `_sidebar.zul` (included by all usecase2 pages) and `preview.zul`.

## Preview Pages

### URL Patterns
```
http://localhost:8080/{component-name}.zul
```
`.zul` extension is required. The catch-all is restricted to `*.zul` only to avoid intercepting static resources.

### Common Component Pages
| Component | URL |
|-----------|-----|
| Overview | http://localhost:8080/preview.zul |
| Checkbox | http://localhost:8080/checkbox.zul |
| Button | http://localhost:8080/button.zul |
| Listbox | http://localhost:8080/listbox.zul |
| Grid | http://localhost:8080/grid.zul |
| Tabbox | http://localhost:8080/tabbox.zul |
| Combobox | http://localhost:8080/combobox.zul |
| Datebox | http://localhost:8080/datebox.zul |
| Tree | http://localhost:8080/tree.zul |
| Panel | http://localhost:8080/panel.zul |
| Window | http://localhost:8080/window.zul |

Preview ZUL files are located at `src/test/resources/web/*.zul`.

### UseCase2 SPA (Mira Dashboard)
The UseCase2 SPA supports hash-based deep linking — append `#<pagename>` to jump directly to any sidebar page:
```
http://localhost:8080/usecase2/index.zul#<pagename>
```
**WARNING**: `/index.zul` (root) returns 404 — always use the full `/usecase2/index.zul` path.

Example: `http://localhost:8080/usecase2/index.zul#analytics`

Valid page names: `default`, `analytics`, `saas`, `pages`, `projects`, `orders`, `products`, `invoice-list`, `invoice-detail`, `tasks`, `sign-in`, `sign-up`, `reset-password`, `pages-profile`, `pages-settings`, `pages-pricing`, `pages-chat`, `pages-blank`, `accordion`, `alerts`, `avatars`, `badges`, `buttons`, `cards`, `chips`, `dialogs`, `lists`, `menus`, `pagination`, `progress`, `tabs`, `tooltips`, `charts-apex`, `charts-chartjs`, `forms-editors`, `forms-pickers`, `forms-selection-controls`, `forms-selects`, `forms-text-fields`, `tables-simple`, `tables-advanced`, `tables-datagrid`, `icons-lucide`

## Documentation Index
Located in `doc/` directory:

| File | Description |
|------|-------------|
| [component-dom-structures.md](doc/component-dom-structures.md) | DOM structure of each ZK component |
| [zk-source-reference.md](doc/zk-source-reference.md) | How to navigate ZK source code |
| [css-dsp-file-structure.md](doc/css-dsp-file-structure.md) | All required *.css.dsp output files for the theme |
| [usecase-driven-iteration.md](doc/usecase-driven-iteration.md) | Use-case driven iteration workflow (OBSERVE→AUDIT→FIX→VERIFY) |
| [preview-page-descriptions.md](doc/preview-page-descriptions.md) | ZUL page descriptions for 8 use-case enterprise scenarios |
| [zk-edition-components.md](doc/zk-edition-components.md) | Components by ZK edition (CE/PE/EE) |
| [mira/](doc/mira/) | 49 Mira HTML reference pages + MUI stylesheet (index-BnB_Ifri.css) |

### External CSS Reference
| Path | Description |
|------|-------------|
| `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` | MUI 9.0.0 static CSS — one file per component |
| `…/static-css-output/INDEX.md` | Index with ZK→MUI lookup table and class naming conventions |

**Rule**: When implementing or refining any ZK component CSS, read the matching MUI CSS file first for exact padding, font sizes, state-layer colors, and transitions. See the Quick Lookup table in the index.

## Quick Start for New Session

1. **Read the iteration workflow**: `doc/usecase-driven-iteration.md`
2. **Check required output files**: `doc/css-dsp-file-structure.md`
3. **Research DOM structure**: `doc/component-dom-structures.md` or ZK source at `/Users/hawk/Documents/workspace/ZK10/zk/zul`
4. **Reference MUI CSS**: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/INDEX.md` → pick matching file
5. **Implement CSS**: Use MD3 token patterns; all colors via `var(--md-sys-color-*)` — no hardcoded hex
6. **Build**: `npm run build:css`
7. **Verify**: `withjdk.sh 17 mvn test exec:java@preview-app`, then screenshot use-case pages

## Architecture and Structure

### CSS Structure
```
src/main/resources/web/
├── zul/css/
│   ├── tokens/               # MD3 design tokens (bundled → norm.css.dsp)
│   │   ├── _colors.css
│   │   ├── _typography.css
│   │   ├── _spacing.css
│   │   ├── _elevation.css
│   │   ├── _shape.css
│   │   └── _motion.css
│   ├── base/                 # Foundation styles (bundled → norm.css.dsp)
│   │   ├── _reset.css
│   │   ├── _utilities.css
│   │   └── _icons.css
│   └── zk-material.css       # Global entry styles
└── js/zul/                   # Component CSS (auto-scanned → *.css.dsp 1:1)
    ├── box/css/
    ├── db/css/
    ├── grid/css/
    ├── inp/css/              # combobox/datebox/timebox/spinner/bandbox → combo.css.dsp
    ├── layout/css/
    ├── menu/css/
    ├── mesh/css/
    ├── sel/css/
    ├── tab/css/
    ├── wgt/css/              # toolbarbutton → footer.css.dsp
    └── wnd/css/
```
Build output: `target/classes/web/zk-material/`

### Java Integration
- `ZkMaterialThemeWebAppInit.java`: Registers theme with ZK framework
- `ZkMaterialThemeProvider.java`: Theme provider implementation
- `Version.java`: Theme version information
- `config.xml`, `lang-addon.xml`, `zk.xml`: ZK configuration

## Material Design 3 Token System

### Colors
```css
--md-sys-color-primary
--md-sys-color-on-primary
--md-sys-color-surface
--md-sys-color-outline
```

### Spacing (4dp baseline)
```css
--md-sys-spacing-1: 4px
--md-sys-spacing-2: 8px
--md-sys-spacing-3: 12px
--md-sys-spacing-4: 16px
```

### Shape
```css
--md-sys-shape-corner-small: 8px
--md-sys-shape-corner-medium: 12px
--md-sys-shape-corner-large: 16px
```

## Component Styling Pattern
```css
/* src/main/resources/web/js/zul/wgt/css/button.css */
.z-{component} {
    /* Layout, Typography, Colors, Shape, Elevation using tokens */
    color: var(--md-sys-color-primary); /* always use tokens, never hardcode hex */
}
.z-{component}::before { /* hover/focus overlay */ }
.z-{component}:hover { }
.z-{component}:focus-visible { }
```

## ZK Source Code Reference
ZK component source code is available at:
`/Users/hawk/Documents/workspace/ZK10/zk/zul`

Specific path for DOM structure research (JS/TS components):
`/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/`
