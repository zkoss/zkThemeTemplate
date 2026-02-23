# Material Design 3 Verification Report

## Component: Button (z-button)
**Date**: 2026-02-10
**Files Reviewed**:
- `/Users/hawk/Documents/workspace/zkThemeTemplate/src/main/resources/web/css/components/buttons/_button.css`
- Token files in `/Users/hawk/Documents/workspace/zkThemeTemplate/src/main/resources/web/css/tokens/`
**M3 Reference Component**: Filled Button (with Outlined, Text, Elevated, and Tonal variants)

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Color Tokens | ✅ | Correct M3 color roles used for all button variants |
| Typography | ✅ | Uses Label Large (14px/500) per M3 spec |
| Shape | ✅ | Full corner radius for buttons (9999px) matches M3 |
| Elevation | ✅ | Correct elevation levels (0, 1, 2) for states and variants |
| Spacing & Layout | ✅ | 4dp grid adherence, proper padding (24px = 6×4dp) |
| State Layers | ✅ | Correct opacity values (0.08, 0.12, 0.12) and implementation |
| Disabled State | ❌ | Hardcoded rgba values instead of using tokens with opacity |
| Motion | ✅ | Correct M3 easing and duration tokens |
| Sizing & Touch Targets | ⚠️ | Button height 40px meets minimum but below 48dp touch target |
| Iconography | ✅ | Correct icon size (18px) per M3 specification |

**Overall Compliance**: Medium-High (8/10 categories passing or partial)

## Detailed Findings

### Color Tokens
**Status**: ✅ **Pass**

**M3 Specification**: M3 defines specific color roles for each button type:
- Filled button: primary (container), on-primary (content)
- Outlined button: primary (content), outline (border), transparent background
- Text button: primary (content), transparent background
- Elevated button: primary (content), surface-container-low (container)
- Tonal button: secondary-container (container), on-secondary-container (content)

**Current Implementation**:
```css
/* Filled Button */
color: var(--md-sys-color-on-primary);
background-color: var(--md-sys-color-primary);

/* Outlined Button */
color: var(--md-sys-color-primary);
border: 1px solid var(--md-sys-color-outline);

/* Text Button */
color: var(--md-sys-color-primary);
background-color: transparent;

/* Elevated Button */
color: var(--md-sys-color-primary);
background-color: var(--md-sys-color-surface-container-low);

/* Tonal Button */
color: var(--md-sys-color-on-secondary-container);
background-color: var(--md-sys-color-secondary-container);
```

**Evidence**: Lines 35-36 (filled), 152-154 (outlined), 183-184 (text), 210-211 (elevated), 235-236 (tonal)

**Recommendation**: None. Implementation correctly follows M3 color system.

---

### Typography
**Status**: ✅ **Pass**

**M3 Specification**: Buttons use Label Large type scale: 14px size, 500 weight, 20px line height, 0.1px letter spacing

**Current Implementation**:
```css
font-family: var(--md-sys-typescale-label-large-font-family);
font-size: var(--md-sys-typescale-label-large-size);
font-weight: var(--md-sys-typescale-label-large-weight);
line-height: var(--md-sys-typescale-label-large-line-height);
letter-spacing: var(--md-sys-typescale-label-large-tracking);
```

Token values confirm: 14px / 500 / 20px / 0.1px

**Evidence**: Lines 26-30 in `_button.css`, lines 95-99 in `_typography.css`

**Recommendation**: None. Typography implementation is fully M3-compliant.

---

### Shape
**Status**: ✅ **Pass**

**M3 Specification**: Buttons use full corner radius (pill shape). M3 specifies this as "full" corner radius.

**Current Implementation**:
```css
border-radius: var(--md-sys-shape-button);

/* Token definition */
--md-sys-shape-button: var(--md-sys-shape-corner-full);
--md-sys-shape-corner-full: 9999px;
```

**Evidence**: Line 39 in `_button.css`, lines 20, 13 in `_shape.css`

**Recommendation**: None. Shape implementation matches M3 specification perfectly.

---

### Elevation
**Status**: ✅ **Pass**

**M3 Specification**:
- Filled button: elevation 0 at rest, elevation 1 on hover
- Outlined button: elevation 0 (no shadow)
- Text button: elevation 0 (no shadow)
- Elevated button: elevation 1 at rest, elevation 2 on hover
- All buttons: elevation 0 when pressed/active

**Current Implementation**:
```css
/* Filled button */
box-shadow: var(--md-sys-elevation-0);  /* rest */
.z-button:hover { box-shadow: var(--md-sys-elevation-1); }
.z-button:active { box-shadow: var(--md-sys-elevation-0); }

/* Elevated button */
box-shadow: var(--md-sys-elevation-1);  /* rest */
.z-button--elevated:hover { box-shadow: var(--md-sys-elevation-2); }
```

**Evidence**: Lines 42, 73, 93, 212, 222 in `_button.css`

**Recommendation**: None. Elevation system correctly implements M3 specification.

---

### Spacing & Layout
**Status**: ✅ **Pass**

**M3 Specification**: Buttons follow 4dp baseline grid with specific padding. M3 buttons typically use 24dp (6×4dp) horizontal padding.

**Current Implementation**:
```css
gap: var(--md-sys-spacing-2);              /* 8px = 2×4dp */
min-height: var(--md-sys-size-button-height);  /* 40px = 10×4dp */
padding: 0 var(--md-sys-spacing-6);        /* 24px = 6×4dp */

/* Text button uses less padding */
padding: 0 var(--md-sys-spacing-3);        /* 12px = 3×4dp */

/* Icon-text gap */
gap: var(--md-sys-spacing-2);              /* 8px */
```

**Evidence**: Lines 20-23 in `_button.css`, spacing tokens in `_spacing.css`

**Recommendation**: None. Spacing adheres to 4dp baseline grid correctly.

---

### State Layers
**Status**: ✅ **Pass**

**M3 Specification**: State layers use the content color (on-primary for filled, primary for others) at specific opacities:
- Hover: 0.08
- Focus: 0.12
- Pressed: 0.12
- Dragged: 0.16

**Current Implementation**:
```css
/* State layer setup */
.z-button::before {
    background-color: var(--md-sys-color-on-primary);
    opacity: 0;
}

/* State opacities */
.z-button:hover::before { opacity: var(--md-sys-state-hover-opacity); }
.z-button:focus::before { opacity: var(--md-sys-state-focus-opacity); }
.z-button:active::before { opacity: var(--md-sys-state-pressed-opacity); }
```

Token values: hover 0.08, focus 0.12, pressed 0.12

**Evidence**: Lines 59-68, 76-78, 86-98 in `_button.css`, lines 181-183 in `_colors.css`

**Recommendation**: None. State layer implementation is M3-compliant.

---

### Disabled State
**Status**: ❌ **Fail**

**M3 Specification**: Disabled buttons should use:
- Content: on-surface at 38% opacity
- Container: on-surface at 12% opacity
- Should use semantic color tokens with opacity, not hardcoded values

**Current Implementation**:
```css
.z-button[disabled],
.z-button:disabled {
    color: rgba(0, 0, 0, 0.38);
    background-color: rgba(0, 0, 0, 0.12);
}
```

**Evidence**: Lines 119-121 in `_button.css`

**Issues**:
1. Uses hardcoded `rgba(0, 0, 0, ...)` instead of semantic color tokens
2. Does not reference `--md-sys-color-on-surface` token
3. Does not use `--md-sys-state-disabled-opacity` (0.38) or `--md-sys-state-disabled-container-opacity` (0.12) tokens
4. Will not adapt to dark theme or custom color schemes
5. Duplicates the opacity specification at lines 103-104 and 119-121

**Recommendation**:
```css
.z-button[disabled],
.z-button:disabled {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-on-surface);
    opacity: 1;
}

/* Use separate opacity for content vs container via pseudo-elements or adjust approach */
.z-button[disabled] {
    color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}
```

Or better yet, use the token-based approach:
```css
.z-button[disabled] {
    color: rgb(from var(--md-sys-color-on-surface) r g b / var(--md-sys-state-disabled-opacity));
    background-color: rgb(from var(--md-sys-color-on-surface) r g b / var(--md-sys-state-disabled-container-opacity));
}
```

---

### Motion
**Status**: ✅ **Pass**

**M3 Specification**: Buttons should use standard easing with short duration for state changes. M3 recommends:
- Duration: short2 (100ms) for quick feedback
- Easing: standard cubic-bezier(0.2, 0, 0, 1)

**Current Implementation**:
```css
transition:
    box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard),
    background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);

/* State layer transition */
transition: opacity var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
```

Token values: short2 = 100ms, standard = cubic-bezier(0.2, 0, 0, 1)

**Evidence**: Lines 53-55, 66 in `_button.css`, lines 10, 37 in `_motion.css`

**Recommendation**: None. Motion implementation correctly follows M3 specification.

---

### Sizing & Touch Targets
**Status**: ⚠️ **Partial**

**M3 Specification**:
- Button height: 40dp
- Minimum width: 64dp
- Touch target: 48dp minimum for accessibility
- Small variant: 32dp height
- Large variant: 48dp height (optional)

**Current Implementation**:
```css
min-height: var(--md-sys-size-button-height);  /* 40px */
min-width: 64px;

/* Small button */
min-height: 32px;

/* Large button */
min-height: 48px;
```

**Evidence**: Lines 21-22, 257, 265 in `_button.css`, line 55 in `_spacing.css` (defines button-height as 40px)

**Issues**:
1. Button height is 40px which meets M3 visual spec but falls short of the 48dp minimum touch target recommendation for accessibility
2. M3 recommends using invisible padding/margin to ensure 48dp touch area even when visual height is 40dp
3. No explicit touch target padding defined

**Note**: M3 allows 40dp visual height IF the touch target area extends to 48dp through padding or transparent hit area. The current implementation provides 40px height with no additional touch target padding.

**Recommendation**: Consider adding touch target padding:
```css
.z-button {
    min-height: var(--md-sys-size-button-height);  /* 40px visual */
    padding-block: var(--md-sys-spacing-1);  /* 4px top/bottom for 48px touch target */
}
```

Or ensure parent containers provide adequate spacing for touch targets.

---

### Iconography
**Status**: ✅ **Pass**

**M3 Specification**: Button icons should be 18dp (small) or 24dp (medium) depending on context. For standard buttons with text, 18dp is typical.

**Current Implementation**:
```css
/* Button image */
.z-button-image {
    width: var(--md-sys-size-icon-sm);
    height: var(--md-sys-size-icon-sm);
}

/* Icon font */
.z-button [class^="z-icon-"] {
    font-size: var(--md-sys-size-icon-sm);
}
```

Token value: `--md-sys-size-icon-sm: 18px`

**Evidence**: Lines 128-129, 138 in `_button.css`, line 68 in `_spacing.css`

**Recommendation**: None. Icon sizing matches M3 specification.

---

## Additional Strengths

1. **Comprehensive Variant Support**: The implementation includes all five M3 button types (filled, outlined, text, elevated, tonal) plus color variants (error, secondary, tertiary)

2. **Proper State Layer Implementation**: Uses `::before` pseudo-element with isolated z-index for clean state layer compositing

3. **Accessibility Features**: Includes `focus-visible` for keyboard navigation, proper `cursor: not-allowed` and `pointer-events: none` for disabled state

4. **Icon-Only Variant**: Properly implements circular icon-only buttons with full border radius

5. **Flexible Sizing**: Provides small, default, and large size variants

6. **Token-Based System**: Extensive use of CSS custom properties ensures maintainability and theme consistency

---

## Recommendations

### Critical (Must Fix)

1. **Replace hardcoded disabled state colors with tokens**
   - Current: `rgba(0, 0, 0, 0.38)` and `rgba(0, 0, 0, 0.12)`
   - Should use: `--md-sys-color-on-surface` with `--md-sys-state-disabled-opacity` tokens
   - Impact: Theme consistency, dark mode support, accessibility
   - Location: Lines 119-121, also affects outlined/text/elevated/tonal disabled states (lines 175, 177, 204, 227, 228, 246, 247)

### Suggested (Nice to Have)

1. **Consider touch target padding for accessibility**
   - Add transparent padding or ensure parent spacing provides 48dp touch area
   - Particularly important for mobile/tablet contexts
   - Could be handled at layout level rather than component level

2. **Add aria-disabled attribute handling**
   - Consider styling for `[aria-disabled="true"]` in addition to `[disabled]`
   - Enhances accessibility for custom button implementations

3. **Document variant usage patterns**
   - Add CSS comments explaining when to use each button type per M3 guidelines
   - Example: "Filled for high-emphasis actions, outlined for medium-emphasis"

---

## References

- [Material Design 3 Buttons Specification](https://m3.material.io/components/buttons/specs)
- [Material Design 3 All Buttons Overview](https://m3.material.io/components/all-buttons)
- [Material Design 3 States and Interaction](https://m3.material.io/foundations/interaction/states/applying-states)
- [Material Design 3 Button Groups](https://m3.material.io/components/button-groups/specs)
- [Material Design 3 Icon Buttons](https://m3.material.io/components/icon-buttons/specs)

---

## Conclusion

The ZK Button implementation demonstrates **strong M3 compliance** overall with correct use of:
- Color system and semantic tokens
- Typography scale (Label Large)
- Shape tokens (full corner radius)
- Elevation levels
- State layer opacities
- Motion/animation tokens
- Spacing system (4dp grid)

The primary compliance issue is the **hardcoded disabled state colors** which should use semantic tokens for proper theme adaptation. The touch target sizing is acceptable but could be enhanced for optimal mobile accessibility.

**Recommended Priority**: Fix disabled state token usage first, as this affects theme consistency across all button variants and impacts dark mode support.
