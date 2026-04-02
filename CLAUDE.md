# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **zk-material** - a Material Design 3 theme for ZK Framework community edition components (`org.zkoss.zul.*`) targeting enterprise customers. The project uses pure CSS (no LESS) with CSS Custom Properties for theming.

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
mvn test exec:java@preview-app

# In separate terminal - watch CSS files for changes
npm run watch
```

## Preview Pages

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

Preview ZUL files are located at `src/test/resources/web/*.zul`.

## Documentation Index
Located in `doc/` directory:

| File | Description |
|------|-------------|
| [01-implementation-plan.md](doc/01-implementation-plan.md) | Phase breakdown, task list, workflow |
| [02-material-design-tokens.md](doc/02-material-design-tokens.md) | Complete token system reference |
| [03-component-dom-structures.md](doc/03-component-dom-structures.md) | DOM structure of each ZK component |
| [04-component-styling-guide.md](doc/04-component-styling-guide.md) | How to style components with M3 |
| [05-progress-tracker.md](doc/05-progress-tracker.md) | Current progress, next steps |
| [06-button-implementation.md](doc/06-button-implementation.md) | Detailed Button implementation reference |
| [07-zk-source-reference.md](doc/07-zk-source-reference.md) | How to navigate ZK source code |

## Quick Start for New Session

1. **Read the progress tracker**: `05-progress-tracker.md`
2. **Check which component is next**: Follow Tier order in `01-implementation-plan.md`
3. **Research DOM structure**: Use `07-zk-source-reference.md` to find component source
4. **Document DOM**: Add to `03-component-dom-structures.md`
5. **Implement CSS**: Follow patterns in `04-component-styling-guide.md`
6. **Update progress**: Mark complete in `05-progress-tracker.md`

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
└── zk-material.css           # Main entry point
```

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
.z-{component} {
    /* Layout, Typography, Colors, Shape, Elevation using tokens */
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
