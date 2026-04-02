# Component Styling Guide

This guide explains how to style ZK components following Material Design 3.

---

## CSS Pattern

Every component follows this structure:

```css
/* Component Name - Material Design 3 Style */

/* ============================================
   Base Component
   ============================================ */
.z-{component} {
    /* Reset browser defaults */
    appearance: none;
    border: none;
    outline: none;

    /* Layout */
    display: ...;
    align-items: ...;
    gap: var(--md-sys-spacing-2);
    min-height: var(--md-sys-size-...);
    padding: ...;

    /* Typography */
    font-family: var(--md-sys-typescale-{role}-font-family);
    font-size: var(--md-sys-typescale-{role}-size);
    font-weight: var(--md-sys-typescale-{role}-weight);
    line-height: var(--md-sys-typescale-{role}-line-height);
    letter-spacing: var(--md-sys-typescale-{role}-tracking);

    /* Colors */
    color: var(--md-sys-color-on-...);
    background-color: var(--md-sys-color-...);

    /* Shape */
    border-radius: var(--md-sys-shape-...);

    /* Elevation */
    box-shadow: var(--md-sys-elevation-...);

    /* Interaction */
    cursor: pointer;
    position: relative;
    overflow: hidden;

    /* Motion */
    transition:
        box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard),
        background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

/* State Layer (for ripple effect) */
.z-{component}::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: currentColor; /* or specific color */
    opacity: 0;
    transition: opacity var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
    pointer-events: none;
}

/* Hover State */
.z-{component}:hover::before {
    opacity: var(--md-sys-state-hover-opacity); /* 0.08 */
}

/* Focus State */
.z-{component}:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
}

.z-{component}:focus::before {
    opacity: var(--md-sys-state-focus-opacity); /* 0.12 */
}

/* Active/Pressed State */
.z-{component}:active::before {
    opacity: var(--md-sys-state-pressed-opacity); /* 0.12 */
}

/* Disabled State */
.z-{component}[disabled] {
    opacity: 1; /* Don't use opacity, use specific colors */
    color: rgba(0, 0, 0, 0.38);
    background-color: rgba(0, 0, 0, 0.12);
    cursor: not-allowed;
    pointer-events: none;
}

.z-{component}[disabled]::before {
    display: none;
}
```

---

## State Layer Implementation

Material Design 3 uses a "state layer" for interactive feedback instead of changing background colors directly.

### How It Works

1. Add `::before` pseudo-element covering the component
2. Set background to contrast color (e.g., `on-primary` for primary buttons)
3. Control visibility with opacity
4. Opacity values from spec:
   - Hover: 8% (0.08)
   - Focus: 12% (0.12)
   - Pressed: 12% (0.12)
   - Dragged: 16% (0.16)

### Example

```css
.z-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--md-sys-color-on-primary);
    opacity: 0;
    pointer-events: none;
}

.z-button:hover::before {
    opacity: 0.08;
}
```

---

## Typography Usage

### Common Roles

| Component Type | Typography Role |
|---------------|-----------------|
| Buttons | Label Large |
| Form labels | Label Medium |
| Input text | Body Large |
| Helper text | Body Small |
| Titles | Title Medium/Large |
| Headers | Headline Small/Medium |

### Implementation

```css
.z-button {
    font-family: var(--md-sys-typescale-label-large-font-family);
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: var(--md-sys-typescale-label-large-weight);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
}
```

---

## Color Usage

### Primary Actions
- Background: `--md-sys-color-primary`
- Text: `--md-sys-color-on-primary`

### Secondary Actions
- Background: `--md-sys-color-secondary-container`
- Text: `--md-sys-color-on-secondary-container`

### Surfaces
- Background: `--md-sys-color-surface`
- Text: `--md-sys-color-on-surface`
- Secondary text: `--md-sys-color-on-surface-variant`

### Borders
- Default: `--md-sys-color-outline`
- Subtle: `--md-sys-color-outline-variant`

### Error States
- Background: `--md-sys-color-error`
- Text: `--md-sys-color-on-error`
- Container: `--md-sys-color-error-container`

---

## Spacing Guidelines

### Component Internal Padding

| Size | Token | Pixels |
|------|-------|--------|
| XS | `--md-sys-spacing-1` | 4px |
| SM | `--md-sys-spacing-2` | 8px |
| MD | `--md-sys-spacing-3` | 12px |
| LG | `--md-sys-spacing-4` | 16px |
| XL | `--md-sys-spacing-6` | 24px |

### Common Patterns

```css
/* Button padding */
padding: 0 var(--md-sys-spacing-6); /* 24px horizontal */

/* Input padding */
padding: var(--md-sys-spacing-4); /* 16px all sides */

/* Card padding */
padding: var(--md-sys-spacing-4); /* 16px all sides */

/* Icon gap */
gap: var(--md-sys-spacing-2); /* 8px between icon and text */
```

### Layout & Container Spacing

To ensure components are not crowded, the following defaults are applied to ZK layout and container components:

1. **Layout Containers** (vlayout, hlayout, hbox, vbox):
   - Use `gap` for child spacing.
   - Default: `var(--md-sys-spacing-3)` (12px).
   - Compact: `var(--md-sys-spacing-2)` (8px).
2. **Container Components** (groupbox, panel, window):
   - Internal padding: `var(--md-sys-spacing-4)` (16px).
3. **Inline Components** (buttons/labels in toolbars):
   - Inline margin: `var(--md-sys-spacing-1)` (4px) to ensure separation.

---

## Elevation Guidelines

| Level | Use Case |
|-------|----------|
| 0 | Default state, text buttons |
| 1 | Cards at rest, buttons on hover |
| 2 | Raised cards, dropdown menus |
| 3 | Dialogs, FAB |
| 4 | Navigation drawer |
| 5 | Modal dialogs |

```css
.z-card {
    box-shadow: var(--md-sys-elevation-1);
}

.z-card:hover {
    box-shadow: var(--md-sys-elevation-2);
}
```

---

## Shape Guidelines

| Component | Shape Token |
|-----------|-------------|
| Buttons | `--md-sys-shape-corner-full` (pill) |
| Text fields | `--md-sys-shape-corner-extra-small` (4px) |
| Cards | `--md-sys-shape-corner-medium` (12px) |
| Dialogs | `--md-sys-shape-corner-extra-large` (28px) |
| Chips | `--md-sys-shape-corner-small` (8px) |

---

## Variants via sclass

ZK allows adding custom CSS classes via the `sclass` attribute. Use this for variants:

```xml
<button label="Primary" />
<button label="Outlined" sclass="z-button--outlined" />
<button label="Text" sclass="z-button--text" />
<button label="Small" sclass="z-button--small" />
```

### Variant Naming Convention

```css
.z-{component}--{variant}
```

Examples:
- `.z-button--outlined`
- `.z-button--text`
- `.z-button--small`
- `.z-button--large`
- `.z-button--error`

---

## Accessibility Considerations

### Focus Visible

Always provide visible focus indicator:

```css
.z-button:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
}
```

### Color Contrast

- Text on backgrounds must meet WCAG AA (4.5:1 for normal text)
- The Material 3 color system is designed to meet these requirements

### Touch Targets

Minimum touch target: 48x48px

```css
min-height: var(--md-sys-size-touch-target-minimum); /* 48px */
```

---

## Testing Checklist

For each component:

- [ ] Default state looks correct
- [ ] Hover state shows state layer (8% opacity)
- [ ] Focus shows outline
- [ ] Active/pressed shows state layer (12% opacity)
- [ ] Disabled has reduced opacity, no interaction
- [ ] Works with icons/images
- [ ] Variants work via sclass
- [ ] Respects all design tokens
- [ ] Accessible focus indicator
