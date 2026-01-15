# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the ZK Theme Template - a base theme for creating custom ZK UI themes. ZK is a Java web framework that uses LESS for styling. The template includes continuous/incremental compile and live-reload features for theme development.

## Key Commands

### Initial Setup
```bash
# Initialize project with theme name (interactive script)
./init.sh

# Install LESS dependencies
npm install
```

### Build and Package
```bash
# Build jar file (compiles LESS and packages)
mvn clean package

# Compile LESS files only  
npm run zklessc

# Watch/continuous compile LESS files
npm run zklessc-dev
```

### Build Notes

- **Java Version Compatibility for Tests**: The project's test code requires JDK 17 or higher. If you are building with JDK 11 (or an older version), you must skip tests by adding `-Dmaven.test.skip=true` to your Maven command (e.g., `mvn clean package -Dmaven.test.skip=true`). This is due to Spring Boot 3.2.6 dependencies used in tests requiring Java 17, while the main project might target an older Java version for compatibility.

### Preview and Development
```bash
# Run preview application on localhost:8080
mvn test exec:java@preview-app

# In separate terminal - watch LESS files for changes
npm run zklessc-dev
```

## Architecture and Structure

### Theme Structure
- **src/main/resources/web/**: Web resources including LESS files
  - **zul/less/**: Core ZK component styles
    - `_zkvariables.less`: Main theme variables (colors, fonts, sizing)
    - `_header.less`: Import structure for themes
    - `profiles/`: Theme profiles (default, compact)
    - `colors/`: Color palettes (iceblue, etc.)
  - **zkmax/less/**: Premium component styles
  - **js/**: Component-specific LESS files organized by ZK module
    - `zul/`: Standard components (buttons, inputs, layouts, etc.)
    - `zkmax/`: Premium components (biglistbox, goldenlayout, etc.)
    - `zkex/`: Extension components

### Java Integration
- **src/main/java/org/zkoss/theme/mytheme/**: Theme registration
  - `MythemeThemeWebAppInit.java`: Registers theme with ZK framework
  - `Version.java`: Theme version information
- **src/main/resources/metainfo/zk/**: ZK configuration
  - `config.xml`: Theme configuration
  - `lang-addon.xml`: Language addon configuration

### Customization Approach
1. **Variable Override**: Customize by overriding variables in `_zkvariables.less`
2. **Profile Selection**: Switch between "default" and "compact" profiles
3. **Color Palettes**: Use built-in palettes or create custom ones
4. **Component-Specific**: Override specific component styles as needed

### Key Variables
- `@colorPrimary`: Primary theme color (#0093F9)
- `@themeProfile`: "default" or "compact"
- `@themePalette`: Color palette name (e.g., "iceblue")
- `@baseFontSize`: Base font size (16px)
- `@baseTitleFontFamily`: Title font family


### Testing
- Preview app available at `src/test/java/zk/example/ThemePreviewApp.java`
- Custom preview pages can be added under `src/test/resources/web/`

## Development Workflow

1. Run `./init.sh` to initialize with custom theme name
2. Install dependencies: `npm install`
3. Start preview app: `mvn test exec:java@preview-app`
4. In separate terminal - watch LESS files for changes
5. Edit LESS files in `src/main/resources/web/`
6. Changes auto-compile and refresh in preview
7. Build final jar: `mvn clean package`

The compiled theme jar will be in `target/[theme-name].jar` and can be deployed to ZK applications.
