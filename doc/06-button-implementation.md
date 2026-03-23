# Button Component Implementation

This document details the complete Button implementation as a reference for implementing other components.

---

## DOM Structure

**Source Files**:
- `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/wgt/mold/button.js`
- `/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/wgt/Button.ts`

**HTML Output**:
```html
<button type="button" class="z-button" [disabled]>
    <img class="z-button-image" src="..." alt="" aria-hidden="true" />
    <i class="z-icon-xxx" aria-hidden="true"></i>
    Label Text
</button>
```

**Key Properties**:
- `type`: button | submit | reset
- `disabled`: boolean
- `label`: string
- `image`: URL string
- `iconSclass`: CSS class for icon
- `orient`: horizontal | vertical
- `dir`: normal | reverse

---

## Material Design 3 Mapping

| ZK Button | Material 3 Equivalent |
|-----------|----------------------|
| Default | Filled Button |
| With sclass="z-button--outlined" | Outlined Button |
| With sclass="z-button--text" | Text Button |
| With sclass="z-button--elevated" | Elevated Button |
| With sclass="z-button--tonal" | Filled Tonal Button |

---

## CSS Implementation

### File Location
`src/main/resources/web/css/components/buttons/_button.css`

### Base Styles

```css
.z-button {
    /* Reset */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    border: none;
    outline: none;
    text-decoration: none;

    /* Layout */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-sys-spacing-2);
    min-height: var(--md-sys-size-button-height);
    min-width: 64px;
    padding: 0 var(--md-sys-spacing-6);

    /* Typography - Label Large */
    font-family: var(--md-sys-typescale-label-large-font-family);
    font-size: var(--md-sys-typescale-label-large-size);
    font-weight: var(--md-sys-typescale-label-large-weight);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-tracking);
    text-transform: none;
    white-space: nowrap;

    /* Colors - Filled Button */
    color: var(--md-sys-color-on-primary);
    background-color: var(--md-sys-color-primary);

    /* Shape */
    border-radius: var(--md-sys-shape-button);

    /* Elevation */
    box-shadow: var(--md-sys-elevation-0);

    /* Interaction */
    cursor: pointer;
    user-select: none;
    vertical-align: middle;
    position: relative;
    overflow: hidden;
    isolation: isolate;

    /* Transitions */
    transition:
        box-shadow var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard),
        background-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}
```

### State Layer

```css
.z-button::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: var(--md-sys-color-on-primary);
    opacity: 0;
    transition: opacity var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
    pointer-events: none;
    z-index: -1;
}
```

### Interactive States

```css
/* Hover */
.z-button:hover {
    box-shadow: var(--md-sys-elevation-1);
}
.z-button:hover::before {
    opacity: var(--md-sys-state-hover-opacity); /* 0.08 */
}

/* Focus */
.z-button:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
}
.z-button:focus::before,
.z-button:focus-visible::before {
    opacity: var(--md-sys-state-focus-opacity); /* 0.12 */
}

/* Active */
.z-button:active {
    box-shadow: var(--md-sys-elevation-0);
}
.z-button:active::before {
    opacity: var(--md-sys-state-pressed-opacity); /* 0.12 */
}

/* Disabled */
.z-button[disabled],
.z-button:disabled {
    color: rgba(0, 0, 0, 0.38);
    background-color: rgba(0, 0, 0, 0.12);
    box-shadow: var(--md-sys-elevation-0);
    cursor: not-allowed;
    pointer-events: none;
}
.z-button[disabled]::before {
    display: none;
}
```

### Image and Icon

```css
.z-button-image {
    display: inline-block;
    width: var(--md-sys-size-icon-sm);
    height: var(--md-sys-size-icon-sm);
    object-fit: contain;
    vertical-align: middle;
    flex-shrink: 0;
}

.z-button [class^="z-icon-"],
.z-button [class*=" z-icon-"] {
    font-size: var(--md-sys-size-icon-sm);
    line-height: 1;
    flex-shrink: 0;
}
```

---

## Variants

### Outlined Button

```css
.z-button.z-button--outlined {
    color: var(--md-sys-color-primary);
    background-color: transparent;
    border: 1px solid var(--md-sys-color-outline);
    box-shadow: none;
}

.z-button.z-button--outlined::before {
    background-color: var(--md-sys-color-primary);
}

.z-button.z-button--outlined[disabled] {
    color: rgba(0, 0, 0, 0.38);
    background-color: transparent;
    border-color: rgba(0, 0, 0, 0.12);
}
```

### Text Button

```css
.z-button.z-button--text {
    color: var(--md-sys-color-primary);
    background-color: transparent;
    border: none;
    box-shadow: none;
    min-width: auto;
    padding: 0 var(--md-sys-spacing-3);
}

.z-button.z-button--text::before {
    background-color: var(--md-sys-color-primary);
}
```

### Elevated Button

```css
.z-button.z-button--elevated {
    color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: var(--md-sys-elevation-1);
}

.z-button.z-button--elevated:hover {
    box-shadow: var(--md-sys-elevation-2);
}
```

### Tonal Button

```css
.z-button.z-button--tonal {
    color: var(--md-sys-color-on-secondary-container);
    background-color: var(--md-sys-color-secondary-container);
}

.z-button.z-button--tonal::before {
    background-color: var(--md-sys-color-on-secondary-container);
}
```

### Size Variants

```css
/* Small */
.z-button.z-button--small {
    min-height: 32px;
    padding: 0 var(--md-sys-spacing-4);
    font-size: var(--md-sys-typescale-label-medium-size);
}

/* Large */
.z-button.z-button--large {
    min-height: 48px;
    padding: 0 var(--md-sys-spacing-8);
    font-size: var(--md-sys-typescale-title-medium-size);
}

/* Full Width */
.z-button.z-button--full-width {
    width: 100%;
}

/* Icon Only */
.z-button.z-button--icon-only {
    min-width: var(--md-sys-size-button-height);
    width: var(--md-sys-size-button-height);
    padding: 0;
    border-radius: var(--md-sys-shape-corner-full);
}
```

### Color Variants

```css
/* Error */
.z-button.z-button--error {
    color: var(--md-sys-color-on-error);
    background-color: var(--md-sys-color-error);
}

/* Secondary */
.z-button.z-button--secondary {
    color: var(--md-sys-color-on-secondary);
    background-color: var(--md-sys-color-secondary);
}

/* Tertiary */
.z-button.z-button--tertiary {
    color: var(--md-sys-color-on-tertiary);
    background-color: var(--md-sys-color-tertiary);
}
```

---

## Usage in ZUL

```xml
<!-- Default Filled Button -->
<button label="Primary" />

<!-- Outlined Button -->
<button label="Outlined" sclass="z-button--outlined" />

<!-- Text Button -->
<button label="Text" sclass="z-button--text" />

<!-- Elevated Button -->
<button label="Elevated" sclass="z-button--elevated" />

<!-- Tonal Button -->
<button label="Tonal" sclass="z-button--tonal" />

<!-- Small Button -->
<button label="Small" sclass="z-button--small" />

<!-- Large Button -->
<button label="Large" sclass="z-button--large" />

<!-- Error Button -->
<button label="Delete" sclass="z-button--error" />

<!-- With Icon -->
<button label="Save" iconSclass="z-icon-save" />

<!-- Icon Only -->
<button iconSclass="z-icon-plus" sclass="z-button--icon-only" />

<!-- Disabled -->
<button label="Disabled" disabled="true" />
```

---

## Testing Checklist

- [x] Default filled button renders correctly
- [x] Hover shows elevation + 8% state layer
- [x] Focus shows outline + 12% state layer
- [x] Active shows 12% state layer, no elevation
- [x] Disabled shows reduced opacity, no interaction
- [x] Outlined variant works
- [x] Text variant works
- [x] Elevated variant works
- [x] Tonal variant works
- [x] Size variants work
- [x] Color variants work
- [x] Icon support works
- [x] Image support works
