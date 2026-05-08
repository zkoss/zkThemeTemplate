# DESIGN.md — zk-material Design Language Spec

Distilled from existing token files, component CSS, and the 49 Mira HTML reference pages.
Use this as the rulebook when styling a component that Mira does not cover.

---

## 1. Surface Palette

| Role | Color | Token |
|------|-------|-------|
| Page background | `#f7f9fc` | `--zk-color-background` / `--zk-color-surface-container-low` |
| Card / panel surface | `#ffffff` | `--zk-color-surface` |
| Content area (inner) | `#f0f4fa` | `--zk-color-surface-variant` |
| Surface container | `#e8eef7` | `--zk-color-surface-container-high` |
| Sidebar background | `#376fd0` | (brand blue, not a token) |
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
| Warning | `#f57c00` | `--zk-color-warning` |
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
| Chip, search box | `8px` | `--zk-shape-corner-small` |
| Dialog | `16px` | `--zk-shape-corner-large` |

Rule: **default to 6px** for any container/card; **4px** for interactive controls (inputs, buttons, dropdowns).

---

## 6. Elevation / Shadow

| Level | Shadow | Semantic token |
|-------|--------|---------------|
| 0 | none | `--zk-elevation-0` |
| 1 — card resting | `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)` | `--zk-elevation-1` |
| 2 — dropdown / hover | `0 2px 6px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.14)` | `--zk-elevation-2` |
| 3 — dialog / modal | `0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)` | `--zk-elevation-3` |

Simplified card shadow alias: `0 1px 3px rgba(0,0,0,0.08)` (`--zk-elevation-card`).  
Cards have elevation only — no border. Use outlined variant (`1px solid outline-variant`) when resting on a white surface where shadow is invisible.

---

## 7. Typography

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Section label (nav) | 10.5px | 600 | uppercase, letter-spacing 0.8px |
| Badge / chip | 11px | 500–600 | |
| Small helper / caption | 12px | 400–500 | |
| Sub-nav item | 12.5px | 400 | |
| Body / table cell | 13px | 400 | (denser than MD3 body-medium) |
| Card title / label | 14px | 600 | |
| Input / placeholder | 14px | 400 | `--zk-typescale-body-medium-*` |
| Tab label | 14px | 500 | |
| Page subtitle | 13px | 400 | |
| Page title | 20px | 600 | |
| KPI value | 28px | 600 | |

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

Default interactive transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)` (legacy/MUI standard).  
Tokens:
- Duration: `--zk-motion-duration-short3` (150ms) for most controls; `--zk-motion-duration-short4` (200ms) for color/border changes.
- Easing: `--zk-motion-easing-legacy` = `cubic-bezier(0.4, 0, 0.2, 1)`.
- Preset: `--zk-motion-transition-standard` = 300ms standard easing (use for complex transitions).

---

## 10. Density

| Element | Value |
|---------|-------|
| Button height | 36px min |
| Input / combobox height | 40px min |
| Table header padding | `8px 16px` |
| Table cell padding | `16px` (default); `8px 16px` (dense) |
| Nav item padding | `6px 14px` |
| Card padding | `16–24px` |
| Topbar height | 64px |
| Page content padding | 48px top, 108px horizontal (on wide screens) |

Rule: **rows are 36–40px** rendered height. Inputs 40px. Buttons 36px. All denser than stock MD3.

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
