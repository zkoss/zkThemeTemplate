# Handling Custom Root Font Size with REM Ratio

## Executive Summary

This document outlines the architecture and implementation strategy for introducing a `--zk-rem-ratio` CSS custom property to the ZK Theme Template. This feature solves the problem where ZK components render at incorrect sizes when the user's application has a different root font-size than ZK's expected `1rem = 8px` assumption.

**Key Innovation**: A single CSS custom property that acts as a multiplier for all rem-based sizing values, allowing users to adjust ZK component sizes without changing their application's root font-size or rebuilding the theme.

**Impact**:
-   Enables ZK themes to work correctly with browser default font-size (16px) and other common root sizes.
-   No breaking changes for existing users (default ratio = 1).
-   Simple one-line CSS override for integration.
-   Maintains separation between ZK sizing and application typography.

---

## Problem Statement

### Current Situation

ZK themes use rem units for component sizing with an implicit assumption:

```css
:root {
  font-size: 8px; /* 1rem = 8px */
}

.z-button {
  height: 4rem; /* Expected: 32px */
}
```

### The Issue

When users have different root font-size settings:

```css
/* User's application */
:root {
  font-size: 16px; /* Browser default */
}

/* ZK button now renders incorrectly */
.z-button {
  height: 4rem; /* Actual: 64px instead of 32px! */
}
```

### User Impact

-   ZK components render at 2x intended size with browser defaults (16px).
-   Components appear too large or too small depending on root font-size.
-   Users must either:
    -   Change their application's root font-size (breaks their typography).
    -   Rebuild ZK theme with custom values (complex, not maintainable).
    -   Override every component individually (hundreds of overrides).

---

## Solution Architecture: The `--zk-rem-ratio` Approach

### High-Level Concept

Introduce a CSS custom property `--zk-rem-ratio` that multiplies all rem-based sizing values:

```css
/* ZK Theme */
:root {
  --zk-rem-ratio: 1; /* Default: no change */
}

.z-button {
  height: calc(4rem * var(--zk-rem-ratio));
}
```

```css
/* User Override (when root font-size = 16px) */
:root {
  --zk-rem-ratio: 0.5; /* 8px / 16px = 0.5 */
}

/* Button now correctly renders at 32px:
   4rem * 0.5 = 2rem
   2rem * 16px = 32px */
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Application                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :root { font-size: 16px; }                            │  │
│  │ :root { --zk-rem-ratio: 0.5; } /* User override */    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      ZK Theme Layer                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ _zkvariables.less                                     │  │
│  │   :root { --zk-rem-ratio: 1; }                        │  │
│  │   .zk-rem(@value) mixin → calc(@value * ratio)        │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Component LESS Files (41 files)                       │  │
│  │   height: .zk-rem(4rem);                              │  │
│  │   width: .zk-rem(2.5rem);                             │  │
│  │   min-height: .zk-rem(5rem);                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Compiled CSS Output                      │
│  .z-button {                                                 │
│    height: calc(4rem * var(--zk-rem-ratio));                │
│    width: calc(2.5rem * var(--zk-rem-ratio));               │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Formula for Users

To calculate the correct `--zk-rem-ratio` for their root font-size:

```
--zk-rem-ratio = 8 / YOUR_ROOT_FONT_SIZE_IN_PX
```

**Common Presets:**
-   Root 16px (browser default): `--zk-rem-ratio: 0.5;` (8/16)
-   Root 10px: `--zk-rem-ratio: 0.8;` (8/10)
-   Root 12px: `--zk-rem-ratio: 0.667;` (8/12)
-   Root 8px (ZK default): `--zk-rem-ratio: 1;` (8/8)

### Advantages of `--zk-rem-ratio`

1.  **Single Point of Control**: Users only need to set one CSS variable (`--zk-rem-ratio`) to adjust all ZK component sizes.
2.  **Runtime Adjustability**: The ratio can be changed dynamically via JavaScript without page reload.
    ```javascript
document.documentElement.style.setProperty('--zk-rem-ratio', '0.5');
    ```
3.  **No Theme Rebuild Required**: Works without recompiling LESS - pure CSS override.
4.  **Backward Compatible**: Default ratio of 1 maintains existing behavior for all current users.
5.  **Simple Formula**: Easy calculation for users: `8 / root-font-size-in-px`.
6.  **Browser Support**: CSS custom properties and `calc()` are well-supported in all modern browsers.

### Limitations of `--zk-rem-ratio`

1.  **Loss of LESS Variable Abstraction**: Variable names are replaced with hardcoded values in the compiled `calc()` expressions, making future changes to original LESS variables not propagate automatically.
2.  **LESS Arithmetic Not Available**: LESS operations cannot be used inside escaped strings; all arithmetic must use CSS `calc()`.
3.  **Readability Degradation**: `calc()` wrappers make the CSS more verbose.
4.  **Maintenance Burden**: Hidden dependencies and manual updates if LESS variables change.
5.  **Granular Control**: This approach offers less granular control over individual component sizes compared to semantic CSS variables.

---

## Alternative Approach: Tailwind v4-Style Semantic CSS Variables

This approach defines **sizing as CSS custom properties** that users can override at runtime, similar to Tailwind CSS v4, requiring no theme rebuild.

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     _zkvariables.less                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ :root {                                               │  │
│  │   --zk-height-input: 4.5rem;   // 36px at 8px root   │  │
│  │   --zk-height-button: 3rem;    // 24px               │  │
│  │   --zk-height-bar: 4rem;       // 32px               │  │
│  │   --zk-line-height: 2rem;      // 16px               │  │
│  │ }                                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Component LESS Files                      │
│  .z-textbox {                                                │
│    height: var(--zk-height-input);                          │
│    line-height: var(--zk-line-height);                      │
│  }                                                           │
│  .z-button {                                                 │
│    min-height: var(--zk-height-button);                     │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    User Override (16px root)                 │
│  :root {                                                     │
│    font-size: 16px;                                         │
│    --zk-height-input: 2.25rem;   // 36px at 16px root       │
│    --zk-height-button: 1.5rem;   // 24px                    │
│    --zk-height-bar: 2rem;        // 32px                    │
│    --zk-line-height: 1rem;       // 16px                    │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Advantages of Tailwind v4 Style

1.  **Clean Component Code** — No escaped strings or `calc()` wrappers.
2.  **Semantic Variable Names** — Self-documenting, clear purpose for each variable.
3.  **Single Source of Truth** — Change a CSS variable once, affects all usages.
4.  **Granular Control** — Users can adjust specific components or scope overrides to different sections of the app.
5.  **Minimal Migration Effort**: Only `_zkvariables.less` needs updating to point to CSS variables; component files using LESS variables require no changes.

### Disadvantages of Tailwind v4 Style

1.  **User Override Complexity** — Users must override multiple CSS variables (~15-20) instead of a single ratio value.
2.  **LESS Arithmetic Limitation** — LESS cannot perform arithmetic directly with CSS variables, requiring CSS `calc()` for complex expressions, similar to the `--zk-rem-ratio` approach.
3.  **Variable Proliferation** — Requires managing many CSS custom properties for different sizing values.

---

## Comparison: `--zk-rem-ratio` vs. Tailwind v4 Style

| Aspect | `--zk-rem-ratio` (Multiplier) | Tailwind v4 Style (Semantic Vars) |
|--------|-------------------------------|-----------------------------------|
| **Theme Pattern** | `calc(Xrem * var(--zk-rem-ratio))` | `var(--zk-height-input)` |
| **User Override** | Single value: `--zk-rem-ratio: 0.5` | Multiple values (one per sizing var) |
| **LESS Syntax** | Escaped strings: `~"calc(...)"` | Clean: `@inputHeight` unchanged |
| **Component File Changes** | **All 75+ files** (add calc wrapper) | **None** (LESS vars → CSS vars) |
| **Readability** | Low (verbose calc wrappers) | High (semantic names) |
| **Source of Truth** | Lost (values hardcoded in strings) | Preserved (CSS variables) |
| **Granular Control** | No (ratio affects everything) | Yes (override individual sizes) |
| **Migration Effort** | Higher (modify all component files) | **Lower** (only `_zkvariables.less`) |
| **User Complexity** | Lower (one value to set) | Higher (many values to override) |

### Rationale for Choosing `--zk-rem-ratio`

Despite the advantages of the Tailwind v4-style in terms of migration effort and clean component code, the `--zk-rem-ratio` approach was chosen for the ZK theme primarily due to its **simpler user override experience** (a single variable to adjust) and **backward compatibility**. The existing LESS codebase and override patterns also made a full transition to CSS-native variables more complex to implement without breaking changes. The `--zk-rem-ratio` provides a practical and effective solution with minimal impact on existing user customizations.

---

## User Guide: Overriding with `--zk-rem-ratio`

If your application sets a root font-size different from 8px, ZK components will appear smaller or larger than expected. The recommended solution is to use the `--zk-rem-ratio` CSS variable.

### How it Works

All sizing properties (height, width, min-height, max-height, min-width, max-width, line-height, icon font-sizes) in ZK components are multiplied by `--zk-rem-ratio`.

### Formula

```
--zk-rem-ratio = 8 / YOUR_ROOT_FONT_SIZE_IN_PX
```

### Common Configurations

| Your Root Font-Size | `--zk-rem-ratio` Value |
|---------------------|------------------------|
| 8px (ZK default) | 1 |
| 10px | 0.8 |
| 12px | 0.667 |
| 14px | 0.571 |
| 16px (browser default) | 0.5 |
| 18px | 0.444 |
| 20px | 0.4 |

### Example: Application with 16px root font-size

```css
:root {
  font-size: 16px;  /* Your application's root font-size */
  --zk-rem-ratio: 0.5;  /* 8 / 16 = 0.5 */
}
```

With this setting:
-   ZK components render at the correct size (e.g., a 4rem button height = 4 × 16px × 0.5 = 32px, same as the intended 4 × 8px = 32px).
-   Your custom CSS using rem units works normally with the 16px base.
-   Both ZK and your application coexist without conflicts.

### Where to Add the Override

Add this to your application's main CSS file or in a `<style>` tag in your HTML, ensuring it loads after the ZK theme CSS.

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Your application styles */
    :root {
      font-size: 16px; /* Browser default for better accessibility */
      --zk-rem-ratio: 0.5; /* Adjust ZK components for 16px root */
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 1rem; /* 16px - comfortable reading size */
    }
  </style>

  <!-- ZK theme CSS -->
  <link rel="stylesheet" href="/zkau/web/mytheme/css/zk.wcs" />
</head>
<body>
  <!-- Your ZK application -->
</body>
</html>
```

### Verification

After applying the override:
1.  Open browser DevTools.
2.  Inspect a ZK button.
3.  Check its computed height (should be approximately 32px or the intended pixel size).
4.  If incorrect, adjust the `--zk-rem-ratio` value.

### Troubleshooting: Components Appear Smaller or Larger Than Expected

**Symptom**: Buttons, inputs, and panels are noticeably smaller or larger after migration.

**Cause**: Your application sets a root font-size different from 8px without adjusting `--zk-rem-ratio`.

**Solution (Recommended)**: Use the `--zk-rem-ratio` CSS variable as described above:

```css
:root {
  font-size: 16px;  /* Your application's font-size */
  --zk-rem-ratio: 0.5;  /* 8 / 16 = 0.5 */
}
```

Calculate the ratio using: `--zk-rem-ratio = 8 / YOUR_ROOT_FONT_SIZE_IN_PX`

**Alternative Solution**: Check and adjust your CSS font-size definitions:

1.  Check your CSS for root font-size definitions:

    ```bash
grep -r "font-size" src/main/webapp/css/
grep -r ":root" src/main/webapp/css/
    ```

2.  Set the root font-size to 8px if you prefer ZK's convention:

    ```html
<style>
  :root { font-size: 8px; }
</style>
<!-- ZK resources load here -->
    ```

---

## Implementation Status: COMPLETED

**Completion Date**: December 20, 2025

### Phase Completion Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Add --zk-rem-ratio CSS variable | ✅ Completed |
| Phase 2 | Convert core input components (7 files) | ✅ Completed |
| Phase 3 | Convert layout components (9 files) | ✅ Completed |
| Phase 4 | Convert data components (4 files) | ✅ Completed |
| Phase 5 | Convert premium components (zkmax) | ✅ Completed |
| Phase 6 | Convert remaining components (zkex) | ✅ Completed |
| Phase 7 | Update documentation and migration guide | ✅ Completed |

### Implementation Notes

1.  **Pattern Used**: Direct string escaping pattern for all sizing properties:
    ```less
height: ~"calc(@{variableName} * var(--zk-rem-ratio))";
    ```

2.  **Files Converted**: 75 LESS files successfully compile with the rem-ratio feature.

3.  **Scope Applied**:
    -   ✅ height, min-height, max-height
    -   ✅ width, min-width, max-width
    -   ✅ line-height
    -   ✅ font-size (icons only)
    -   ❌ padding, margin (excluded - handled by spacing variables)
    -   ❌ border, shadow, outline (excluded)
    -   ❌ compact profile files (excluded)

4.  **Documentation Updated**:
    -   `ZK-6023_MIGRATION_GUIDE.md` - Added `--zk-rem-ratio` as recommended solution
    -   Test page available at `rem-ratio-test.zul`

### Verification

All 75 files compile successfully:

```
npm run zklessc
success: compiled 75 file(s)
```