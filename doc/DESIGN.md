# DESIGN.md — zk-material Design Language Spec

Distilled from existing token files, component CSS, and the 49 Mira HTML reference pages.
Use this as the rulebook when styling a component that Mira does not cover.

---

## 1. Surface Palette

| Role | Color | Token |
|------|-------|-------|
| Page background | `#f7f9fc` | `--zk-color-background` / `--zk-color-surface-container-low` |
| Card / panel surface | `#ffffff` | `--zk-color-surface` |
| Content area (inner) | `#f7f9fc` | `--zk-color-surface-variant` (same as page bg in practice) |
| Surface container | `#e8eef7` | `--zk-color-surface-container-high` |
| Sidebar background | `#233044` | (dark navy, nav item bg; drawer paper is white) |
| Input background | `#ffffff` | `--zk-color-surface` |

---

## 2. Text Colors

| Role | Color | Token |
|------|-------|-------|
| Primary text | `rgba(0,0,0,0.87)` | `--zk-color-on-surface` |
| Secondary / muted | `rgba(0,0,0,0.6)` | `--zk-color-on-surface-variant` |
| Disabled text | `rgba(0,0,0,0.38)` | `--zk-color-disabled` |
| Link / branded | `#376fd0` | `--zk-color-primary` |
| On-brand (text on blue) | `#ffffff` | `--zk-color-on-primary` |
| On-error | `#ffffff` | `--zk-color-on-error` |
| Placeholder | `rgba(0,0,0,0.6)` | `--zk-color-on-surface-variant` |

---

## 3. Brand & Status Colors

| Role | Color | Token |
|------|-------|-------|
| Brand blue | `#376fd0` | `--zk-color-primary` |
| Brand container | `#d6e4ff` | `--zk-color-primary-container` |
| Error | `#d32f2f` | `--zk-color-error` |
| Warning | `#ed6c02` | `--zk-color-warning` |
| Success (badge) | `#4caf50` | `--zk-color-status-success` |
| Success (text) | `#2e7d32` | (use directly) |
| Info | `#0288d1` | `--zk-color-status-info` |
| Neutral | `#9e9e9e` | `--zk-color-status-neutral` |
| On-status (badge text) | `#ffffff` | `--zk-color-on-status` |

Chips use tinted backgrounds (`rgba(color, 0.1)`). Badges use full-strength color on white.

---

## 4. Spacing Scale (4dp baseline)

`4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 64px`  
Tokens: `--zk-spacing-1` through `--zk-spacing-16`.

---

## 5. Corner Radii

| Context | Radius | Token |
|---------|--------|-------|
| Button, input, menu | `4px` | `--zk-shape-corner-extra-small` |
| Card, alert, badge, list | `6px` | `--zk-shape-card` (custom) |
| Chip, search box | `6px` | `--zk-shape-card` (custom) |
| Dialog | `4px` | `--zk-shape-corner-extra-small` |

Rule: **default to 6px** for any container/card; **4px** for interactive controls (inputs, buttons, dropdowns).

---

## 6. Elevation / Shadow

| Level | Shadow | Semantic token |
|-------|--------|---------------|
| 0 | none | `--zk-elevation-0` |
| 1 — card resting | `rgba(50,50,93,0.024) 0px 2px 5px -1px, rgba(0,0,0,0.05) 0px 1px 3px -1px` | `--zk-elevation-1` |
| 2 — dropdown / hover | `0 2px 6px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)` | `--zk-elevation-2` |
| 3 — dialog / modal | `0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)` | `--zk-elevation-3` |

Simplified card shadow alias: `rgba(50,50,93,0.024) 0px 2px 5px -1px, rgba(0,0,0,0.05) 0px 1px 3px -1px` (`--zk-elevation-card`).  
Cards have elevation only — no border. Use outlined variant (`1px solid outline-variant`) when resting on a white surface where shadow is invisible.

---

## 7. Typography

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Section label (nav) | 11px | 500 | uppercase (`MuiTypography-subtitle2`) |
| Badge / chip | 11px | 500–600 | |
| Small helper / caption | 11px | 400 | (`MuiTypography-caption` ≈ 11.2px) |
| Sub-nav item | 13px | 400 | inactive: `rgba(255,255,255,0.7)`; active: `#fff` |
| Body / table cell | 13px | 400 | (denser than MD3 body-medium) |
| Card title / label | 16px | 500 | (`MuiTypography-h6`) |
| Input / placeholder | 13px | 400 | `--zk-typescale-body-medium-*` |
| Tab label | 14px | 500 | |
| Page subtitle | 15px | 400 | (`MuiTypography-subtitle1` ≈ 14.86px) |
| Page title | 24px | 600 | (`MuiTypography-h3`) |
| KPI value | 24px | 400 | (`MuiBox` with custom font-size) |

Font family: **Inter** (system sans-serif fallback stack). Token: `--zk-typescale-font-family`.  
Mira is denser than standard MD3 — prefer 13–14px body rather than 16px.

---

## 8. State-Layer Overlays

Apply via a `::before` pseudo-element with `background: currentColor` and `opacity`:

| State | Opacity | Token |
|-------|---------|-------|
| Hover | `0.08` | `--zk-state-hover-opacity` |
| Focus | `0.12` | `--zk-state-focus-opacity` |
| Pressed | `0.12` | `--zk-state-pressed-opacity` |
| Dragged | `0.16` | `--zk-state-dragged-opacity` |
| Disabled content | `0.38` | `--zk-state-disabled-opacity` |
| Disabled container | `0.12` | `--zk-state-disabled-container-opacity` |

For surfaces (rows, list items) prefer a solid color: `background: #f5f5f5` or `rgba(0,0,0,0.04)` on hover.

---

## 9. Motion

Default interactive transition: `250ms cubic-bezier(0.4, 0, 0.2, 1)` (MUI standard).  
Tokens:
- Duration: `--zk-motion-duration-short3` (250ms) for most controls (background-color, box-shadow, border-color).
- Easing: `--zk-motion-easing-legacy` = `cubic-bezier(0.4, 0, 0.2, 1)`.
- Preset: `--zk-motion-transition-standard` = 300ms standard easing (use for complex transitions).

---

## 10. Density

| Element | Value |
|---------|-------|
| Button height | ~35px (6px top/bottom padding) |
| Input / combobox height | ~39px inner; ~52px including floating label |
| Table header padding | `16px` (all sides) |
| Table cell padding | `16px` (all sides) |
| Nav item padding | `8px 24px` |
| Card content padding | `16px 16px 24px` |
| Topbar height | 64px |
| Page content padding | `48px` (all sides) |
| Table row height | ~52px rendered |

Rule: **table rows are ~52px** (16px padding all sides + 13px text + line-height). Inputs ~39px inner height. Buttons ~35px.

---

## 11. Border Rules

| Context | Border |
|---------|--------|
| Component default (outline) | `1px solid rgba(0,0,0,0.23)` = `--zk-color-outline` |
| Dividers / row separators | `1px solid rgba(0,0,0,0.12)` = `--zk-color-outline-variant` ≈ `#e0e0e0` |
| Very subtle row separator | `1px solid #f5f5f5` |
| Input focus | `2px solid #376fd0` (`--zk-color-primary`) |
| Input hover | `1px solid rgba(0,0,0,0.87)` (`--zk-color-on-surface`) |
| Card border | none (elevation only) |
| Outlined card | `1px solid outline-variant` + no shadow |

---

## 12. Iconography (Lucide SVG)

| Context | Size | Color |
|---------|------|-------|
| Inline / table / form | 16–18px | `--zk-color-on-surface-variant` |
| Nav item | 20px | `rgba(255,255,255,0.85)` (on blue) |
| Display / hero | 24px | `--zk-color-primary` |

Use Lucide icons via the `z-icon-*` CSS mask pattern already established in the theme.

---

## 13. ZK-Specific DOM Quirks

Patterns where ZK's rendered DOM diverges from what the CSS selector alone would suggest.
Generator agents must read this section before modifying any listed component.

### Button — vertical orient (`orient="vertical"`)

ZK renders `orient="vertical"` as `icon + <br/> + label` inside the `<button>` element.
**No separate CSS class is added.** The `<br/>` is the only DOM indicator.

**Selector:** `.z-button:has(br)`

**Required CSS:**
```css
.z-button:has(br) {
    flex-direction: column;
    gap: 2px;
    padding: 8px 16px;
    min-height: 48px;
    line-height: 1;
}
.z-button:has(br) br { display: none; }
```

Do not remove the `:has(br)` selector or replace it with a class-based selector — no such class exists in ZK's output.

### Checkbox — mold state class naming

For non-default molds, ZK prefixes the state class with the mold name. The selector pattern is **`z-checkbox-{mold}-{state}`**, not `z-checkbox-{state}`.

| mold | unchecked class | checked class | disabled class |
|------|----------------|---------------|----------------|
| default | `z-checkbox-off` | `z-checkbox-on` | `z-checkbox-disabled` |
| switch | `z-checkbox-switch-off` | `z-checkbox-switch-on` | `z-checkbox-switch-disabled` |
| toggle | `z-checkbox-toggle-off` | `z-checkbox-toggle-on` | `z-checkbox-toggle-disabled` |

**Critical:** Using `.z-checkbox-switch.z-checkbox-on` (unprefixed state) will NEVER match the switch mold DOM. Always use `.z-checkbox-switch-on` (mold-prefixed state) as the selector.

### Combobutton — dropdown button click routing

ZK's `Combobutton.doClick_()` checks `evt.domTarget` against `this.$n('btn')` (= element with id `{uuid}-btn`) to decide whether to open the popup or fire `onClick`. The `.z-combobutton-button` element must have `pointer-events: auto` (the default) so that clicks on the arrow area register on that element. Setting `pointer-events: none` causes clicks to pass through to `.z-combobutton-content`, bypassing the popup-open branch and firing `onClick` instead.

### Bandbox — popup double border

DOM structure: `<span class="z-bandbox">` → `<div class="z-bandbox-popup">` → `<div class="z-bandpopup">`.

`.z-bandbox-popup` is the sole visual frame (border, border-radius, box-shadow, background). **Never add a border or box-shadow to `.z-bandpopup`** — it is the inner content wrapper and any such styling will produce a double border.

### Bandbox — buttonVisible="false" class target

When `buttonVisible="false"`, ZK calls `RoundUtl.buttonVisible(wgt, false)` which adds `z-bandbox-disabled` to the `<a>` button element (`$n('btn')`), NOT to the root `<span>`.

The correct hide selector is: `.z-bandbox-button.z-bandbox-disabled { display: none; }`

Do not confuse with `.z-bandbox.z-bandbox-disabled` (used when the whole component is disabled).

### Bandbox — inplace editing class

When `inplace="true"` and the input is blurred, ZK adds `z-bandbox-inplace` to the root `<span>` element. On focus, the class is removed and the full input appearance is restored.

Style `.z-bandbox.z-bandbox-inplace` to look like plain text: transparent border, transparent background, no box-shadow, hidden button. Do not style the child input or button separately — targeting the root state class is sufficient.
