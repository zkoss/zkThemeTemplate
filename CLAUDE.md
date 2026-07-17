# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Marble** - a Material Design theme for ZK Framework targeting enterprise customers, visually aligned with MUI (React Material UI). The project uses pure CSS (no LESS) with CSS Custom Properties for theming.

- **Theme Name**: `marble`
- **Version**: 1.0.0
- **ZK Version**: 10.4.0-jakarta.FL.20260713-Eval
- **Design System**: Material Design (MUI-aligned; tokens follow MD3 naming, visual values follow MUI v7)
- **Spring Boot Version**: 3.2.6 (for preview app)
- **Browser Support**: Modern browsers only (last 2 versions of Chrome, Firefox, Safari, Edge)

### Project Status
This theme is slated to become the **default look-and-feel for the next major version, ZK 11.0**. It is **currently in development** and has **had no public release** yet.

### Project Goals
Create a modern, accessible, and high-quality Material Design theme (visually aligned with MUI) that enables enterprise users to build visually appealing ZK applications.

### Workflow
Claude acts as project manager coordinating subagents:
1. **zk-theme-creator**: Create/update component styles.
2. **md3-design-verifier**: Verify design against MD3 specifications.
3. **zk-framework-expert**: Handle ZUL changes and ZK-specific knowledge.

### Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme Name | `marble` | Short, distinct brand name (Ma- prefix retains soft link to Material) |
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

The live-reload client script is injected via `preview.zul` and the UseCase SPA host (`usecase/index.zul`).

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

### UseCase SPA (Component Browser)
The UseCase SPA supports hash-based deep linking — append `#<bookmark>` to jump directly to any sidebar page:
```
http://localhost:8080/usecase/index.zul#<bookmark>
```

Bookmark keys are the target ZUL's path relative to the web root (`src/test/resources/web/`), minus the `.zul` extension. Two shapes:
- **Use-case pages** live under `usecase/` → `~./usecase/ops-dashboard.zul` becomes `usecase/ops-dashboard`.
- **Single-component preview pages** live at the web root → `~./button.zul` becomes `button`.

The `<navitem>` entries in `usecase/index.zul` are the source of truth for the current set of pages — consult them (or the `.zul` filenames on disk) rather than a hard-coded list here, since the sidebar changes over time.

Example: `http://localhost:8080/usecase/index.zul#usecase/ops-dashboard`

**VM**: `UseCaseVM.java` — `@Init` restores bookmark, `navigate` command sets bookmark, `handleBookmarkChange` command responds to browser back/forward. Reconstruction: `"~./" + bookmark + ".zul"`.

## Documentation Index
Located in `doc/` directory:

| File | Description |
|------|-------------|
| [spec/index.md](doc/spec/index.md) | **Spec index** — normative theme specifications (the docs below marked *spec* live under `doc/spec/`) |
| [component-dom-structures.md](doc/component-dom-structures.md) | DOM structure of each ZK component |
| [zk-source-reference.md](doc/zk-source-reference.md) | How to navigate ZK source code |
| [css-dsp-file-structure.md](doc/spec/css-dsp-file-structure.md) | All required *.css.dsp output files for the theme |
| [usecase-driven-iteration.md](doc/usecase-driven-iteration.md) | Use-case driven iteration workflow (OBSERVE→AUDIT→FIX→VERIFY) |
| [preview-page-descriptions.md](doc/preview-page-descriptions.md) | ZUL page descriptions for 8 use-case enterprise scenarios |
| [zk-edition-components.md](doc/zk-edition-components.md) | Components by ZK edition (CE/PE/EE) |
| [window-design-rules.md](doc/spec/window-design-rules.md) | Window mode↔elevation mapping; `border` must not drive shadow |
| [brand-override.md](doc/spec/brand-override.md) | Brand-color override recipe — override one seed (`--zk-color-primary`) and containers/overlays/focus derive via `oklch(from …)` absolute tone (hue-consistent); solid-fill-only contrast caveat |
| [reset-scoping.md](doc/spec/reset-scoping.md) | `org.zkoss.zul.theme.browserDefault` — DSP-free reset scoping for JS-Embed host pages (global `reset.css` vs `@scope(.z-page)` `reset-embed.css`, swapped in `MarbleThemeProvider`) |
| [md3-close-affordance-placement.md](doc/spec/md3-close-affordance-placement.md) | MD3 close/dismiss icon placement (inline trailing vs surface top-corner; full-screen-dialog exception) |
| [forced-colors.md](doc/spec/forced-colors.md) | Windows High-Contrast (`@media (forced-colors: active)`) a11y guards — single central *unlayered* `tokens/_forced-colors.css` (bundled into `norm.css.dsp`); restores borders/focus/selection/glyphs with system colors; dedicated high-contrast theme is won't-do |
| [verification-harness-decisions.md](doc/verification-harness-decisions.md) | Decision records: outcome-driven contracts (DR-1), dual-gate VERIFIED (DR-2) |
| [responsive-design.md](doc/spec/responsive-design.md) | Responsive layout: `z-grid-fill` auto-fit utility + State Matrix mobile card-reflow; why not Bootstrap Grid |
| [data-dense-mode.md](doc/spec/data-dense-mode.md) | Compact density via `data-density="compact"` attribute (whole-app or per-region); control-height ladder + semantic alias layer; `MarbleDensity` Java API; ships `marble-compact.css` tuning preset |

### External CSS Reference
| Path | Description |
|------|-------------|
| `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` | MUI 9.0.0 static CSS — one file per component |
| `…/static-css-output/INDEX.md` | Index with ZK→MUI lookup table and class naming conventions |

**Rule**: When implementing or refining any ZK component CSS, read the matching MUI CSS file first for exact padding, font sizes, state-layer colors, and transitions. See the Quick Lookup table in the index.

## Quick Start for New Session

1. **Read the iteration workflow**: `doc/usecase-driven-iteration.md`
2. **Check required output files**: `doc/spec/css-dsp-file-structure.md`
3. **Research DOM structure**: `doc/component-dom-structures.md` or ZK source at `/Users/hawk/Documents/workspace/ZK10/zk/zul`
4. **Reference MUI CSS**: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/INDEX.md` → pick matching file
5. **Implement CSS**: Use MD3 token patterns; all colors via `var(--md-sys-color-*)` — no hardcoded hex
6. **Build**: `npm run build:css`
7. **Verify**: `withjdk.sh 17 mvn test exec:java@preview-app`, then screenshot use-case pages

## Project Rules

### Styling ZUL Pages: Prefer Built-in Utility Classes
When writing or editing a ZUL page (especially under `src/test/resources/web/`), use the project's built-in utility classes from `src/main/resources/web/zul/css/utility/*.css` (the `z-*` family: `z-d-flex`, `z-p-3`, `z-gap-4`, `z-bg-surface-variant`, `z-rounded`, `z-vstack`, `z-hstack`, `z-text-sm`, `z-fw-medium`, etc.) instead of inventing page-local CSS classes inside an inline `<style>` block.

- **Do**: Compose a sclass from existing `z-*` utilities — e.g. `sclass="z-bg-surface-variant z-rounded z-p-3"` instead of `.u-stack-frame { background:…; border-radius:…; padding:…; }`.
- **Don't**: Hard-code color/spacing/typography values inside a per-page `<style>` block when an equivalent utility exists.
- **If no utility fits**: Stop and raise it for discussion before adding new CSS — the gap is signal that a new utility might belong in the appropriate `zul/css/utility/_*.css` file, or that a real component variant should be added to component CSS.

This keeps preview/use-case pages consistent with the theme tokens, prevents value drift, and surfaces missing utilities as a discussion instead of silently fragmenting style.

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
│   │   └── _icons.css
│   ├── utility/              # Utility classes, split by sidebar Utility CSS category
│   │   ├── _colors.css
│   │   ├── _elevation.css
│   │   ├── _components.css   # .z-card
│   │   ├── _spacing.css      # padding + margin
│   │   ├── _layout.css       # display, grid, flex, gap, sizing, position
│   │   ├── _typography.css   # weight, size, align, transform, headings
│   │   ├── _borders.css      # border + rounded
│   │   └── _stack.css        # vstack/hstack (opt-in spacing — widgets have no default margins)
│   └── marble.css            # Global entry styles
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
Build output: `target/classes/web/marble/`

### Java Integration
- `MarbleThemeWebAppInit.java`: Registers theme with ZK framework
- `MarbleThemeProvider.java`: Theme provider implementation
- `Version.java`: Theme version information
- `config.xml`, `lang-addon.xml`, `zk.xml`: ZK configuration

## Material Design 3 Token System

### CSS Variable Naming Convention

All CSS custom properties use the `--zk-` prefix. **Never use `--md-sys-*` names.**

```css
--zk-color-primary
--zk-spacing-4
--zk-shape-corner-small
--zk-typescale-body-medium-size
--zk-motion-duration-short1
--zk-state-hover-opacity
--zk-elevation-1
```

### Colors
```css
--zk-color-primary
--zk-color-on-primary
--zk-color-surface
--zk-color-outline
```

### Spacing (4dp baseline)
```css
--zk-spacing-1: 4px
--zk-spacing-2: 8px
--zk-spacing-3: 12px
--zk-spacing-4: 16px
```

### Shape
```css
--zk-shape-corner-small: 8px
--zk-shape-corner-medium: 12px
--zk-shape-corner-large: 16px
```

## Component Styling Pattern
```css
/* src/main/resources/web/js/zul/wgt/css/button.css */
.z-{component} {
    /* Layout, Typography, Colors, Shape, Elevation using tokens */
    color: var(--zk-color-primary); /* always use tokens, never hardcode hex */
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
