# Upgrading to the Modernized ZK Theme

## Overview

The ZK-6023 introduces a modernized default theme that establishes a professional design system based on industry standards. The new theme replaces hard-coded pixel values with standardized design tokens (spacing variables and rem-based sizing), enabling applications to scale responsively and maintain consistency across components.

This migration guide addresses breaking changes in the default theme profile and provides step-by-step solutions to ensure a smooth transition for your application.

### Why This Change Matters

The modernized theme improves:
- **Flexibility**: Scale the entire theme by adjusting a single CSS variable
- **Consistency**: Standardized spacing and sizing across all components
- **Maintainability**: Design tokens replace scattered pixel values
- **Professional Design**: Aligns with modern web design practices

**Important**: The compact profile remains unchanged, offering a migration alternative for applications requiring strict backward compatibility.

---

## Breaking Changes Summary

The ZK-6023 update introduces changes in two primary areas:

1. **Spacing Changes**: Minor pixel adjustments in padding, margin, and positioning values
2. **Unit System Changes**: Conversion from fixed pixels to rem-based units for sizing properties

These changes may cause layout shifts or sizing discrepancies in existing applications that rely on specific pixel dimensions.

---

## Core Principles for Theme Template Improvement

### Principle 1: Use Standardized Spacing Variables on Padding/Margin

*   Apply spacing variables (e.g. `@spacing-01` through `@spacing-11`) to all padding, margin, and positioning properties (left, right, top, bottom).
*   Some margin/padding px doesn't match the existing spacing variable (e.g., `30px`), then use the closest spacing variable (e.g., `@spacing-09`, which is `32px`). `3px` -> `@spacing-01`, `5px` -> `@spacing-02`, `10px` -> `@spacing-08`.
*   See "spacing variables" at `_zkvariables.less` and each variable's comment shows its pixel value.

#### Spacing Variables Mapping

**Exact px to spacing variable conversions:**

| px | Variable |
|----|----------|
| 2px | @spacing-01 |
| 4px | @spacing-02 |
| 6px | @spacing-03 |
| 8px | @spacing-04 |
| 12px | @spacing-05 |
| 16px | @spacing-06 |
| 20px | @spacing-07 |
| 24px | @spacing-08 |
| 32px | @spacing-09 |
| 40px | @spacing-10 |
| 48px | @spacing-11 |

**For values without exact matches, use closest value:**
- 3px → @spacing-01
- 5px → @spacing-02
- 7px → @spacing-03
- 10px → @spacing-04 or @spacing-08
- 14px → @spacing-05
- 18px → @spacing-06
- 30px, 36px → @spacing-09

**Applies to:**
- padding, padding-left, padding-right, padding-top, padding-bottom
- margin, margin-left, margin-right, margin-top, margin-bottom
- positioning properties: left, right, top, bottom (when used for spacing adjustment)

---

### Principle 2: Convert to Rem-Based Units

*   Replace px with rem (relative em) for all size-related CSS rules: heights, widths, min-height, max-height, min-width, max-width, border-radius, line-height.
*   Apply `font-size` for icons, as an icon should resize with a component size.
*   Formula: `rem value = px value / 8` (since 1rem = 8px in default profile).
*   NOTE: This principle ONLY converts sizing properties, NOT padding/margin/positioning (handled by Principle 1) and NOT font-size (handled by Principle 3).
*   This allows flexible resizing via root font-size changes without rebuilding the theme.

#### px to rem Conversion Table

**Conversion Formula:** `rem value = px value / 8` (since 1rem = 8px in default profile)

| px | rem | px | rem | px | rem | px | rem |
|----|-----|----|----|----|----|----|----|
| 2px | 0.25rem | 24px | 3rem | 50px | 6.25rem | 100px | 12.5rem |
| 3px | 0.375rem | 26px | 3.25rem | 52px | 6.5rem | 110px | 13.75rem |
| 4px | 0.5rem | 28px | 3.5rem | 56px | 7rem | 120px | 15rem |
| 5px | 0.625rem | 30px | 3.75rem | 58px | 7.25rem | 150px | 18.75rem |
| 6px | 0.75rem | 32px | 4rem | 60px | 7.5rem | 180px | 22.5rem |
| 8px | 1rem | 34px | 4.25rem | 64px | 8rem | 200px | 25rem |
| 10px | 1.25rem | 36px | 4.5rem | 68px | 8.5rem | 230px | 28.75rem |
| 12px | 1.5rem | 40px | 5rem | 72px | 9rem | 260px | 32.5rem |
| 14px | 1.75rem | 44px | 5.5rem | 80px | 10rem | 288px | 36rem |
| 16px | 2rem | 45px | 5.625rem | 88px | 11rem | 300px | 37.5rem |
| 18px | 2.25rem | 48px | 6rem | 96px | 12rem | 320px | 40rem |
| 20px | 2.5rem | 49px | 6.125rem | 100px | 12.5rem | 330px | 41.25rem |
| 22px | 2.75rem | | | | | 350px | 43.75rem |

#### CRITICAL EXCLUSIONS for Principle 2

These must NOT be converted (keep as px):
1.  **1px, -1px, 0px values** - Precise control values
2.  **border-related properties** - All border, border-top, border-right, border-bottom, border-left, border-width, border-radius when used in border context
3.  **shadow-related properties** - box-shadow, text-shadow
4.  **width in media queries** - `@media (max-width: Xpx)` should NOT be converted
5.  **outline property** - `outline: Xpx`
6.  **Padding, margin, positioning** - Only Principle 1 converts these (NOT Principle 2)
7.  **Font-size** - Only Principle 3 converts these (NOT Principle 2)

---

### Principle 3: Use Consistent Font Size Variables

*   Use consistent font size variables (`@fontSizeSmall`, `@fontSizeMedium`, `@fontSizeLarge`) instead of hard-coded values for `font-size`.
*   The variables are listed under "Component sizing" in `_zkvariables.less`.
*   If there is no matching font size variable, do not replace the pixel values.
*   NOTE: This principle ONLY converts `font-size` property, NOT sizing (handled by Principle 2) and NOT padding/margin/positioning (handled by Principle 1).

#### Conversion Rules for Principle 3

1.  **Only convert** `font-size` property with exact matching values (12px, 14px, 16px, 18px, 20px).
2.  **Do NOT convert** if no exact matching variable exists.
3.  **Do NOT convert** `@baseFontSize` (special variable).
4.  **Do NOT touch** padding, margin, positioning, sizing properties (handled by other principles).

#### CRITICAL EXCLUSIONS for Principle 3

These must NOT be converted:
1.  **Non-matching font-size values** - Only convert if exact match exists (12px, 14px, 16px, 18px, 20px).
2.  **`@baseFontSize` variable** - Never convert the base font size variable.
3.  **Padding, margin, positioning** - Only Principle 1 converts these (NOT Principle 3).
4.  **Sizing properties** - Only Principle 2 converts these (NOT Principle 3).
5.  **Font-size in variable definitions** - Be careful with `@var: 16px` type definitions.

---

### Principle 4: Keep px values in compact related less files

*   Keep this theme as a backward-compatible theme since the systems that adopt this theme usually upgrade from an older ZK version.
*   Applying the previous principles inevitably changes the component size in a minor degree (e.g., `3px` -> `2px`). This change might break the existing layout, so we don't change compact theme to avoid affecting the existing compact theme users.
*   Including `_compact.less` and `src/main/resources/web/zkmax/less/tablet/compact`.

---

## Compact Profile: Backward Compatibility

### Important Notice

The **compact profile remains unchanged** and continues to use pixel-based sizing. If your application requires strict backward compatibility and cannot accept any layout changes, the compact profile offers a migration path.

### Switching to Compact

In your ZK application configuration:

```java
// Programmatic approach
ZKClientInfo.setTheme("compact");
```

Or in `zk.xml`:

```xml
<library-property>
  <name>org.zkoss.zul.theme</name>
  <value>compact</value>
</library-property>
```

### Limitations of Compact

-   No responsive scaling via root font-size
-   Larger theme file size
-   Limited access to new design system improvements

### Transition Strategy

1.  Start with compact profile for immediate stability.
2.  Test default profile in development environment.
3.  Assess layout changes and determine if acceptable.
4.  Migrate to default profile as custom CSS adjustments stabilize.

---

## Step-by-Step Migration Checklist (General)

### Phase 1: Planning and Assessment

-   [ ] Identify critical UI components (forms, dialogs, lists, menus)
-   [ ] Document current sizing and spacing expectations
-   [ ] Create test environment with both default and compact profiles
-   [ ] Establish acceptance criteria for layout changes (e.g., ±2px tolerance)
-   [ ] Review custom CSS files for rem-dependent values

### Phase 2: Pre-Migration Setup

-   [ ] Back up current theme configuration
-   [ ] Back up custom CSS files
-   [ ] Update ZK Framework to version with ZK-6023
-   [ ] Create feature branch for theme migration
-   [ ] Set up continuous testing environment

### Phase 3: Configuration and Testing

-   [ ] Apply ZK-6023 theme update
-   [ ] Test application with default profile
-   [ ] Document observed layout changes
-   [ ] Capture screenshots comparing old vs. new layout
-   [ ] Test responsive behavior (browser zoom, different screen sizes)

### Phase 4: CSS Adjustments

-   [ ] Identify components requiring spacing overrides
-   [ ] Update custom CSS using solutions from Principle 1 and Principle 2 (where appropriate)
-   [ ] Test CSS changes in multiple browsers
-   [ ] Validate responsive scaling

### Phase 5: Validation and Quality Assurance

-   [ ] Test all custom components
-   [ ] Verify dialog and window positioning
-   [ ] Test menu and toolbar layout
-   [ ] Validate form input heights and alignment
-   [ ] Test with accessibility tools (screen readers, zoom levels)
-   [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Phase 6: Deployment

-   [ ] Merge migration changes to main branch
-   [ ] Update theme documentation
-   [ ] Deploy to staging environment
-   [ ] Perform user acceptance testing
-   [ ] Deploy to production
-   [ ] Monitor logs for layout-related issues

---

## Troubleshooting Common Issues (General)

### Issue 2: Custom CSS Elements Too Small or Too Large

**Symptom**: Your custom components don't match ZK component sizes.

**Cause**: Rem unit confusion between 8px and 16px bases (if not using `--zk-rem-ratio`).

**Solution**:

1.  Audit custom CSS for rem usage:

    ```css
    /* Explicit values instead of rem */
    .my-component {
      padding: 8px; /* instead of 1rem */
      font-size: 16px; /* instead of 2rem */
    }
    ```

2.  Or, consistently use the 8px base:

    ```css
    .my-component {
      padding: 1rem; /* 8px */
      font-size: 2rem; /* 16px */
    }
    ```

### Issue 3: Dialogs and Modals Misaligned

**Symptom**: Padding and margins inside dialogs are misaligned after migration.

**Cause**: Spacing variables rounded values differently than original hardcoded pixels.

**Solution**:

Apply CSS overrides for dialog-specific components:

```css
.z-window-content {
  padding: 12px; /* Explicit pixel override */
}

.z-window-header {
  padding: 8px 12px; /* Override if needed */
}
```

Or use scoped CSS variables:

```css
.z-window {
  --dialog-padding: 12px;
  --dialog-title-padding: 8px;
}

.z-window-content {
  padding: var(--dialog-padding);
}

.z-window-title {
  padding: var(--dialog-title-padding);
}
```

### Issue 4: List Items Have Incorrect Height

**Symptom**: List items appear taller or shorter; text alignment is off.

**Cause**: Line-height converted from px to rem, and spacing variables changed height values.

**Solution**:

```css
/* Override list item sizing */
.z-listitem {
  height: 24px; /* Explicit pixel value */
  line-height: 24px; /* Ensure text aligns */
}

.z-listcell {
  padding: 2px 4px; /* Use explicit pixels or @spacing variables */
}
```

### Issue 5: Icons and Badges Misaligned

**Symptom**: Icons within buttons are too large, or badge positioning is off.

**Cause**: Icon font-size converted along with component sizing.

**Solution**:

```css
/* Icon within button */
.z-button .z-icon {
  font-size: 14px; /* Explicit pixel value, matches button height */
  vertical-align: middle; /* Ensure vertical alignment */
}

/* Badge */
.z-badge {
  font-size: 12px; /* Smaller than component */
  padding: 2px 4px; /* Use spacing variables or explicit pixels */
}
```

### Issue 6: Media Queries Not Triggered

**Symptom**: Responsive behavior changes; breakpoints not working as expected.

**Cause**: Media queries use pixel widths (unchanged), but viewport sizing differs due to rem changes.

**Solution**:

Media queries should remain unchanged in the theme (not converted to rem). If responsive behavior is affected:

1.  Verify media query widths match your design breakpoints:

    ```less
    @media (max-width: 768px) {
      // Mobile styles - widths remain in px
    }
    ```

2.  Test viewport sizing with browser developer tools.
3.  Add explicit overrides for mobile viewport if needed:

    ```css
    @media (max-width: 768px) {
      .z-button {
        padding: 4px 8px;
        height: 32px;
      }
    }
    ```

---

## Code Examples: Before and After

### Example 1: Button Component

**Before (Old Theme - Pixels)**:

```less
.z-button {
  padding: 3px 10px;
  min-height: 24px;
  line-height: 24px;
  border-radius: 3px;
}
```

**After (ZK-6023 - Variables and REM)**:

```less
.z-button {
  padding: @spacing-01 @spacing-04; // 2px 8px
  min-height: 3rem; // 24px
  line-height: 3rem; // 24px
  border-radius: 0.375rem; // 3px
}
```

**Application CSS Adjustment**:

```css
/* If layout shift is unacceptable */
.z-button {
  padding: 3px 10px; /* Override to original values */
}
```

### Example 2: List Item Component

**Before (Old Theme)**:

```less
.z-listitem {
  height: 22px;
  padding: 0 5px;
}
```

**After (ZK-6023)**:

```less
.z-listitem {
  height: 2.75rem; // 22px
  padding: 0 @spacing-02; // 0 4px
}
```

**Application CSS Adjustment**:

```css
/* If height becomes 28px (22px + 6px), adjust */
.z-listitem {
  height: 22px;
  padding: 0 4px;
}
```

### Example 3: Dialog Component

**Before (Old Theme)**:

```less
.z-window-content {
  padding: 12px;
}

.z-window-header {
  padding: 8px 12px;
}
```

**After (ZK-6023)**:

```less
.z-window-content {
  padding: @spacing-05; // 12px
}

.z-window-header {
  padding: @spacing-04 @spacing-05; // 8px 12px
}
```

**No Application Change Needed**: These values happen to remain exactly the same with the spacing variables.

---

## Testing Checklist (General)

### Visual Testing

-   [ ] Button sizes and spacing look correct
-   [ ] Input field heights align with buttons
-   [ ] List items have appropriate row height
-   [ ] Dialogs and modals display correctly
-   [ ] Menus and toolbars maintain proper spacing
-   [ ] Padding around form labels is consistent
-   [ ] Icons align properly within components
-   [ ] Badges and labels position correctly

### Responsive Testing

-   [ ] Zoom to 150% in browser - components scale proportionally
-   [ ] Zoom to 75% in browser - components scale proportionally
-   [ ] Test on mobile viewport (375px width)
-   [ ] Test on tablet viewport (768px width)
-   [ ] Test on desktop viewport (1920px width)
-   [ ] Verify media query breakpoints trigger correctly

### Cross-Browser Testing

-   [ ] Chrome/Chromium (latest)
-   [ ] Firefox (latest)
-   [ ] Safari (latest)
-   [ ] Edge (latest)
-   [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility Testing

-   [ ] Screen reader announces components correctly
-   [ ] Keyboard navigation works
-   [ ] Focus indicators visible
-   [ ] Color contrast meets WCAG standards
-   [ ] Text sizing doesn't break layout at 200% zoom

### Custom Component Testing

-   [ ] Custom CSS doesn't conflict with ZK styles
-   [ ] Custom components align with ZK components
-   [ ] Custom spacing and sizing values are explicit
-   [ ] CSS custom properties work as expected

---

## FAQ (General)

### Q: Will my application break immediately?

**A**: Not necessarily. ZK-6023 creates subtle layout shifts (1-4px changes). Most applications won't break, but you may notice spacing inconsistencies. Testing is essential.

### Q: Should I migrate to the default profile or stay on compact?

**A**: If your layout remains acceptable with 1-4px changes, migrate to default for responsive scaling benefits. If layout stability is critical, use compact as a temporary solution while adjusting your custom CSS.

### Q: Can I use both the default and compact profiles?

**A**: Yes. Use `ZKClientInfo.setTheme("default")` or `setTheme("compact")` per-user or per-page. However, mixing themes may create CSS conflicts.

### Q: What if I need to support both old and new themes?

**A**: Create a feature flag:

```java
String theme = isModernUIEnabled() ? "default" : "compact";
ZKClientInfo.setTheme(theme);
```

Allow users to opt-in to the default theme while keeping compact as the default.

### Q: How do I prevent layout shifts during transition?

**A**: Use CSS custom properties for critical dimensions:

```css
:root {
  --button-height: 24px;
  --list-item-height: 22px;
}

.z-button { height: var(--button-height); }
.z-listitem { height: var(--list-item-height); }
```

Update these values gradually as you test.

### Q: Can I use the ZK-6023 theme with older ZK versions?

**A**: No. ZK-6023 requires ZK version with this update. Older versions don't recognize the new spacing variables and rem units.

---

## Getting Help

### Resources

-   **ZK Documentation**: [ZK Framework Official Docs](https://www.zkoss.org/wiki/)
-   **Theme Customization Guide**: Check `/doc/THEME_CUSTOMIZATION.md`
-   **ZK Community Forum**: [ZK Community](https://www.zkoss.org/forum/)
-   **GitHub Issues**: [ZK GitHub](https://github.com/zkoss/zk)

### Reporting Issues

If you encounter migration issues:

1.  Verify you're using the latest ZK version with ZK-6023.
2.  Check theme configuration in `zk.xml`.
3.  Review custom CSS for conflicts.
4.  Create a minimal reproducible example.
5.  Report to ZK community with:
    -   ZK version number
    -   Theme name and profile (default/compact)
    -   Screenshots of expected vs. actual behavior
    -   Relevant CSS code snippets

---

## Summary

The ZK-6023 migration modernizes the default theme with standardized spacing variables and rem-based sizing, enabling responsive scaling and consistent design practices. The migration introduces two primary breaking changes:

1.  **Spacing Variables**: Minor pixel adjustments (1-4px) for consistency with the design system.
2.  **REM Units**: Conversion to rem-based sizing with a standardized 1rem = 8px base.

---

## Related Resources

-   **Theme Variables Reference**: `src/main/resources/web/zul/less/_zkvariables.less` - Spacing and sizing variables
-   **ZK Theme Template Repository**: [ZK Theme Template GitHub](https://github.com/zkoss/zkthemetemplate) - Source and examples