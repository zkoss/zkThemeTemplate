# ZK Material Theme - Project Overview

## Project Information

- **Theme Name**: `zk-material`
- **Version**: 1.0.0
- **Target**: ZK Framework 10.2.1-jakarta
- **Design System**: Material Design 3 (Material You)
- **Styling**: Pure CSS (no LESS)
- **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge - last 2 versions)

## Project Goals

Create a Material Design 3 theme for ZK Framework community edition components (org.zkoss.zul.*) targeting enterprise customers.

## Workflow

You (Claude) act as project manager coordinating subagents:

1. Call **zk-theme-creator** to create/update component styles.
2. Call **md3-design-verifier** to verify the design against the Material Design 3 specification.
3. Repeat steps 1–2 until all components are done.

- Call **zk-framework-expert** when ZUL changes are needed or for ZK-specific knowledge.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme Name | `zk-material` | Clear, descriptive name |
| Styling Language | Pure CSS | Simpler tooling, no LESS dependency |
| Dark Theme | Light only (initial) | Reduce scope, add dark later |
| DOM Research | Browser + ZK source | Both approaches for accuracy |
| Browser Support | Modern only | Enables CSS custom properties without fallbacks |

## ZK Source Code Location

ZK component source code (for DOM structure research):
```
/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/
```

## Directory Structure

```
zkThemeTemplate/
├── doc/                           # Documentation (this folder)
├── scripts/
│   └── build-css.js              # CSS build script
├── src/main/
│   ├── java/org/zkoss/theme/zkmaterial/
│   │   ├── ZkMaterialThemeWebAppInit.java
│   │   ├── ZkMaterialThemeProvider.java
│   │   └── Version.java
│   └── resources/
│       ├── metainfo/zk/
│       │   ├── config.xml
│       │   ├── lang-addon.xml
│       │   └── zk.xml
│       └── web/css/
│           ├── tokens/           # Material Design tokens
│           ├── base/             # Reset, utilities, icons
│           ├── components/       # Component styles
│           └── zk-material.css   # Main entry point
├── src/test/
│   ├── java/zk/example/
│   │   └── ThemePreviewApp.java
│   └── resources/web/*.zul       # Preview pages
├── package.json
├── pom.xml
└── CLAUDE.md
```

## Commands

```bash
# Install dependencies
npm install

# Build CSS
npm run build:css

# Watch CSS for development
npm run watch

# Start preview app
mvn test exec:java@preview-app

# Build JAR
mvn clean package

# Build without tests (JDK 11)
mvn clean package -Dmaven.test.skip=true
```

## Output

The compiled theme JAR will be at:
```
target/zk-material-1.0.0.jar
```
