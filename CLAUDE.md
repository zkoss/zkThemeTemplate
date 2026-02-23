# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **zk-material** - a Material Design 3 theme for ZK Framework. The project uses pure CSS (no LESS) with CSS Custom Properties for theming.

- **Theme Name**: zk-material
- **Version**: 1.0.0
- **ZK Version**: 10.2.1-jakarta
- **Spring Boot Version**: 3.2.6 (for preview app)

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

- **Java Version Compatibility for Tests**: The project's test code requires JDK 17 or higher. If you are building with JDK 11 (or an older version), you must skip tests by adding `-Dmaven.test.skip=true` to your Maven command. This is due to Spring Boot 3.2.6 dependencies used in tests requiring Java 17.

### Preview and Development
```bash
# Run preview application on localhost:8080
mvn test exec:java@preview-app

# In separate terminal - watch CSS files for changes
npm run watch
```

## Preview Pages

When the preview app is running on `localhost:8080`, access individual component preview pages:

### URL Patterns
```
http://localhost:8080/{component-name}.zul
http://localhost:8080/{component-name}          # .zul extension is optional
```

### Common Component Pages
| Component | URL |
|-----------|-----|
| Overview | http://localhost:8080/preview |
| Checkbox | http://localhost:8080/checkbox |
| Button | http://localhost:8080/button |
| Listbox | http://localhost:8080/listbox |
| Grid | http://localhost:8080/grid |
| Tabbox | http://localhost:8080/tabbox |
| Combobox | http://localhost:8080/combobox |
| Datebox | http://localhost:8080/datebox |
| Tree | http://localhost:8080/tree |
| Panel | http://localhost:8080/panel |
| Window | http://localhost:8080/window |

### All Preview Pages
Preview ZUL files are located at `src/test/resources/web/*.zul`. Any ZUL file in this directory is accessible via its filename.

## Architecture and Structure

### CSS Structure
```
src/main/resources/web/css/
├── tokens/                    # Material Design 3 tokens
│   ├── _colors.css           # Color system
│   ├── _typography.css       # Type scale
│   ├── _spacing.css          # Spacing (4dp grid)
│   ├── _elevation.css        # Shadows
│   ├── _shape.css            # Border radius
│   └── _motion.css           # Animations
├── base/                      # Foundation styles
│   ├── _reset.css            # CSS reset
│   ├── _utilities.css        # Utility classes
│   └── _icons.css            # Icon fonts
├── components/                # Component styles
│   ├── layout/               # Hbox, Vbox, BorderLayout, etc.
│   ├── inputs/               # Textbox, Combobox, Datebox, etc.
│   ├── buttons/              # Button, Combobutton, Toolbarbutton
│   ├── selection/            # Checkbox, Radio, Selectbox
│   ├── data/                 # Listbox, Grid, Tree, Paging
│   ├── navigation/           # Tabbox, Menu, Toolbar
│   ├── containers/           # Window, Panel, Popup, Groupbox
│   ├── widgets/              # Link, Caption, Separator, etc.
│   └── calendar/             # Calendar/datepicker
└── zk-material.css           # Main entry point
```

### Java Integration
- **src/main/java/org/zkoss/theme/zkmaterial/**: Theme registration
  - `ZkMaterialThemeWebAppInit.java`: Registers theme with ZK framework
  - `ZkMaterialThemeProvider.java`: Theme provider implementation
  - `Version.java`: Theme version information
- **src/main/resources/metainfo/zk/**: ZK configuration
  - `config.xml`: Theme configuration
  - `lang-addon.xml`: Language addon configuration
  - `zk.xml`: Desktop configuration

### Build System
- **scripts/build-css.js**: Concatenates all CSS files into single output
- **package.json**: NPM scripts for CSS building and watching
- **pom.xml**: Maven build configuration

## Material Design 3 Token System

### Colors (CSS Custom Properties)
```css
--md-sys-color-primary
--md-sys-color-on-primary
--md-sys-color-primary-container
--md-sys-color-secondary
--md-sys-color-surface
--md-sys-color-error
--md-sys-color-outline
```

### Typography
```css
--md-sys-typescale-display-large-size
--md-sys-typescale-headline-medium-size
--md-sys-typescale-title-large-size
--md-sys-typescale-label-large-size
--md-sys-typescale-body-medium-size
```

### Spacing (4dp baseline)
```css
--md-sys-spacing-1: 4px
--md-sys-spacing-2: 8px
--md-sys-spacing-3: 12px
--md-sys-spacing-4: 16px
```

### Elevation
```css
--md-sys-elevation-1: 0px 1px 2px rgba(0, 0, 0, 0.3), ...
--md-sys-elevation-2: ...
--md-sys-elevation-3: ...
```

### Shape
```css
--md-sys-shape-corner-small: 8px
--md-sys-shape-corner-medium: 12px
--md-sys-shape-corner-large: 16px
--md-sys-shape-corner-full: 9999px
```

## Component Styling Pattern

Each ZK component follows this CSS pattern:
```css
.z-{component} {
    /* Layout */
    /* Typography using tokens */
    /* Colors using tokens */
    /* Shape using tokens */
    /* Elevation using tokens */
    /* Transitions using motion tokens */
}

/* State layer for interactions */
.z-{component}::before { /* hover/focus overlay */ }

/* States */
.z-{component}:hover { }
.z-{component}:focus-visible { }
.z-{component}:active { }
.z-{component}[disabled] { }
```

### Testing
- Preview app: `src/test/java/zk/example/ThemePreviewApp.java`
- Preview pages: `src/test/resources/web/*.zul`

## Development Workflow

1. Install dependencies: `npm install`
2. Start preview app: `mvn test exec:java@preview-app`
3. In separate terminal, watch CSS files: `npm run watch`
4. Open browser to `http://localhost:8080/preview`
5. Navigate to specific component pages as needed (e.g., `/checkbox`, `/button`)
6. Edit CSS files in `src/main/resources/web/css/`
7. Changes auto-compile and refresh in preview
8. Build final jar: `mvn clean package`

The compiled theme jar will be in `target/zk-material-1.0.0.jar` and can be deployed to ZK applications.

## ZK Source Code Reference

ZK component source code (Java and JS/TS) is available at:
`/Users/hawk/Documents/workspace/ZK10/zk/zul`

Use this to understand component DOM structure when styling.
