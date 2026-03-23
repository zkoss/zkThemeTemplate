# Material Design 3 Token System

## Overview

This theme implements Material Design 3 (Material You) design tokens as CSS custom properties. All tokens are defined in `src/main/resources/web/css/tokens/`.

---

## Color System (`_colors.css`)

### Reference Palette

The reference palette provides the raw color values from which semantic colors are derived.

```
Primary (Purple):    10-100 scale
Secondary (Grey):    10-100 scale
Tertiary (Pink):     10-100 scale
Error (Red):         10-100 scale
Neutral (Grey):      0-100 scale
Neutral Variant:     0-100 scale
```

### Semantic Colors

These are the colors to use in components:

| Token | Usage |
|-------|-------|
| `--md-sys-color-primary` | Primary actions, buttons |
| `--md-sys-color-on-primary` | Text/icons on primary |
| `--md-sys-color-primary-container` | Container backgrounds |
| `--md-sys-color-on-primary-container` | Text on containers |
| `--md-sys-color-secondary` | Secondary actions |
| `--md-sys-color-tertiary` | Tertiary accents |
| `--md-sys-color-error` | Error states |
| `--md-sys-color-surface` | Page/card backgrounds |
| `--md-sys-color-on-surface` | Body text |
| `--md-sys-color-surface-variant` | Variant backgrounds |
| `--md-sys-color-on-surface-variant` | Secondary text |
| `--md-sys-color-outline` | Borders, dividers |
| `--md-sys-color-outline-variant` | Subtle borders |

### Surface Containers

For cards, dialogs, and elevated surfaces:

```css
--md-sys-color-surface-container-lowest
--md-sys-color-surface-container-low
--md-sys-color-surface-container
--md-sys-color-surface-container-high
--md-sys-color-surface-container-highest
```

### State Layer Opacities

```css
--md-sys-state-hover-opacity: 0.08;
--md-sys-state-focus-opacity: 0.12;
--md-sys-state-pressed-opacity: 0.12;
--md-sys-state-dragged-opacity: 0.16;
--md-sys-state-disabled-opacity: 0.38;
--md-sys-state-disabled-container-opacity: 0.12;
```

---

## Typography (`_typography.css`)

### Font Families

```css
--md-sys-typescale-font-family-brand: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
--md-sys-typescale-font-family-plain: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
--md-sys-typescale-font-family-code: 'Roboto Mono', 'Consolas', 'Monaco', monospace;
```

### Type Scale

| Role | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| Display Large | 57px | 400 | 64px | Hero text |
| Display Medium | 45px | 400 | 52px | Large headings |
| Display Small | 36px | 400 | 44px | Section headings |
| Headline Large | 32px | 400 | 40px | Page titles |
| Headline Medium | 28px | 400 | 36px | Section titles |
| Headline Small | 24px | 400 | 32px | Subsection titles |
| Title Large | 22px | 400 | 28px | Card titles |
| Title Medium | 16px | 500 | 24px | List item titles |
| Title Small | 14px | 500 | 20px | Small titles |
| Label Large | 14px | 500 | 20px | **Buttons, form labels** |
| Label Medium | 12px | 500 | 16px | Tags, badges |
| Label Small | 11px | 500 | 16px | Captions |
| Body Large | 16px | 400 | 24px | Primary body text |
| Body Medium | 14px | 400 | 20px | Secondary body text |
| Body Small | 12px | 400 | 16px | Captions, helper text |

### Usage Pattern

```css
.my-component {
    font-family: var(--md-sys-typescale-label-large-font-family);
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: var(--md-sys-typescale-label-large-weight);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
```

---

## Spacing (`_spacing.css`)

### Base Scale (4dp grid)

| Token | Value | Use Case |
|-------|-------|----------|
| `--md-sys-spacing-0` | 0 | None |
| `--md-sys-spacing-1` | 4px | Minimal gap |
| `--md-sys-spacing-2` | 8px | Icon gaps, small padding |
| `--md-sys-spacing-3` | 12px | Medium padding |
| `--md-sys-spacing-4` | 16px | Standard padding |
| `--md-sys-spacing-6` | 24px | Large padding |
| `--md-sys-spacing-8` | 32px | Section spacing |

### Component Sizes

| Token | Value | Use Case |
|-------|-------|----------|
| `--md-sys-size-button-height` | 40px | Standard button |
| `--md-sys-size-input-height` | 56px | Text field |
| `--md-sys-size-input-height-dense` | 40px | Dense text field |
| `--md-sys-size-chip-height` | 32px | Chips |
| `--md-sys-size-icon-button` | 48px | Icon buttons |
| `--md-sys-size-touch-target-minimum` | 48px | Touch target |

### Icon Sizes

| Token | Value |
|-------|-------|
| `--md-sys-size-icon-xs` | 16px |
| `--md-sys-size-icon-sm` | 18px |
| `--md-sys-size-icon-md` | 24px |
| `--md-sys-size-icon-lg` | 36px |
| `--md-sys-size-icon-xl` | 48px |

---

## Elevation (`_elevation.css`)

### Elevation Levels

| Level | Use Case | Shadow |
|-------|----------|--------|
| 0 | Flat surfaces | None |
| 1 | Cards at rest, app bars | Subtle |
| 2 | Cards on hover, raised buttons | Low |
| 3 | Menus, dialogs, FAB | Medium |
| 4 | Navigation drawer | High |
| 5 | Modal dialogs | Highest |

### Usage

```css
.my-card {
    box-shadow: var(--md-sys-elevation-1);
}

.my-card:hover {
    box-shadow: var(--md-sys-elevation-2);
}
```

---

## Shape (`_shape.css`)

### Corner Radius Scale

| Token | Value | Use Case |
|-------|-------|----------|
| `--md-sys-shape-corner-none` | 0 | No rounding |
| `--md-sys-shape-corner-extra-small` | 4px | Text fields, menus |
| `--md-sys-shape-corner-small` | 8px | Chips |
| `--md-sys-shape-corner-medium` | 12px | Cards |
| `--md-sys-shape-corner-large` | 16px | FAB |
| `--md-sys-shape-corner-extra-large` | 28px | Dialogs |
| `--md-sys-shape-corner-full` | 9999px | Buttons, pills |

### Component-Specific Shapes

```css
--md-sys-shape-button: var(--md-sys-shape-corner-full);
--md-sys-shape-textfield: var(--md-sys-shape-corner-extra-small);
--md-sys-shape-card: var(--md-sys-shape-corner-medium);
--md-sys-shape-dialog: var(--md-sys-shape-corner-extra-large);
--md-sys-shape-chip: var(--md-sys-shape-corner-small);
--md-sys-shape-menu: var(--md-sys-shape-corner-extra-small);
```

---

## Motion (`_motion.css`)

### Duration Scale

| Duration | Value | Use Case |
|----------|-------|----------|
| Short 1-4 | 50-200ms | Quick feedback, state changes |
| Medium 1-4 | 250-400ms | Standard transitions |
| Long 1-4 | 450-600ms | Complex animations |

### Easing Functions

| Easing | Curve | Use Case |
|--------|-------|----------|
| Standard | `cubic-bezier(0.2, 0, 0, 1)` | General purpose |
| Emphasized | `cubic-bezier(0.2, 0, 0, 1)` | Expressive animations |
| Emphasized Decelerate | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Enter animations |
| Emphasized Accelerate | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Exit animations |

### Common Transitions

```css
/* State changes */
transition: var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);

/* Enter animations */
transition: var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);

/* Exit animations */
transition: var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-accelerate);
```
