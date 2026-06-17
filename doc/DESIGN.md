# DESIGN.md — Marble Design Language Spec

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

### Table-header background: no fill

Grid, Listbox, and Tree headers share **one rule**: **no background color**. Header cells inherit the body surface; visual hierarchy comes from three signals:

| Signal | Value |
|--------|-------|
| Font weight | 500 (label-large, `--zk-typescale-label-large-weight`) |
| Text color  | `--zk-color-on-surface-variant` (slightly muted vs row body) |
| Divider     | `1px solid --zk-color-outline-variant` border-bottom under the header row |

**Why no fill?**

1. **Mira reference (MUI Simple Table)** — `MuiTableCell-head` has only `font-weight: 500` and the table's body `border-bottom`; no `background-color`. Our reference theme set the precedent.
2. **MD3 Data Table spec** — Material Design 3 Data Tables use the same `surface` color for header and body; differentiation is typography + dividers, not fills. Fills are reserved for selected / hovered / pinned rows.
3. **Density & calm** — Enterprise dashboards often stack 3–5 tables on one screen. A tinted header on every table creates visual noise; an unfilled header keeps the eye on the data.

If a future variant needs strong header separation (e.g. for sticky-header reporting tables on a busy background), introduce a `--zk-grid-header-fill` token rather than re-instating the global fill.

This rule is **uniform across grid / listbox / tree**. Do not let one diverge from the others.

### Auxhead: faint tonal band on the row (ZK-only)

ZK's `<auxhead>` is a multi-level header row (no native HTML equivalent) used to group columns under a span (e.g. `<auxheader colspan="2">`). With column headers now transparent, the auxhead row needs **one** distinguishing signal so the multi-level structure reads at a glance.

**Decision**: apply a faint band on the auxhead **row** only:

| Element | Background |
|---------|------------|
| `.z-auxhead` (TR) | `--zk-color-surface-container-low` (faint tonal tint) |
| `.z-auxheader` (TH) | `transparent` |
| `.z-column` (TH below) | `transparent` |

The faint band on the row visually anchors the parent grouping; transparent cells let `colspan` groupings inherit the band cleanly. This is the same banding pattern Excel and financial tables use for category rows above leaf columns.

**Why a tinted row (not a stronger border)**: the boundary between auxhead and columns is already a `1px outline-variant` border, and a thicker border would compete with the column-header divider. The tonal band gives a 4th hierarchy tier (row band → header row → body rows → footer) without adding linework.

If a future use-case needs auxhead to match the column-header transparency exactly, downgrade to typographic-only hierarchy (label-large weight on auxheader, label-medium on column) — but keep the rule symmetric across grid / listbox / tree.

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

### Data-table frame (grid / listbox / tree)

These three are **outlined by default** (`1px solid outline-variant`, **no shadow**) — they
are assumed standalone, and on the near-white page the elevation shadow is invisible, so the
border is the only readable boundary. **Never border + shadow together.** When nested in a
bounded parent, strip the frame: automatically inside panel/groupbox
(`.z-panel-body .z-{comp}` / `.z-groupbox .z-{comp}` → `border: none`), or explicitly via the
opt-in variant sclass **`z-{grid,listbox,tree}-noborder`** (ZK emits no border attribute for
these, unlike `window`'s `z-window-noborder` — the variant name mirrors that ZK convention).
Full rationale + decision record: `doc/data-table-frame-rationale.md`.

---

## 12. Iconography (Lucide SVG)

| Context | Size | Color |
|---------|------|-------|
| Inline / table / form | 16–18px | `--zk-color-on-surface-variant` |
| Nav item | 20px | `rgba(255,255,255,0.85)` (on blue) |
| Display / hero | 24px | `--zk-color-primary` |

Use Lucide icons via the `z-icon-*` CSS mask pattern already established in the theme.

### Header control icon buttons (close / maximize / minimize / collapse)

One family across every header strip that carries window-management controls (user ruling
2026-06-05 — goldenlayout had invented its own 20px text-glyph controls):

| Host | Button box | Icon size | Icons (Lucide) |
|------|------------|-----------|----------------|
| `window` (56px header) | 32×32 | 16px | `x` (close), `expand` (maximize), `compress` → `minimize-2` (restore), `minus` (minimize) |
| `panel` (48px header) | 28×28 | 14px | same set |
| `goldenlayout` `.lm_controls` (44px strip) | 28×28 (panel size — nearest header height) | 14px | `expand` (maximize), `x` (close) — the SAME icons panel's `z-icon-expand`/`z-icon-times` resolve to |

Shared rules: `--zk-shape-corner-full` radius, `--zk-color-on-surface-variant` at rest,
hover reveals a circular state layer. Hover fill is `--zk-color-surface-container` where the
host header is lighter than it (window, panel); on a strip that is already `surface-container`
(goldenlayout), use a mix-based layer (`color-mix(in srgb, var(--zk-color-on-surface) 8%, transparent)`)
so the circle stays visible. Icons render as Lucide masks (via `z-icon-*` classes when ZK
emits them, or embedded data-URI masks on library-injected elements that carry no class —
the signature.css / colorbox.css precedent). Text glyphs (`×`, `⤢`, …) are banned in this
family: their optical size and side-bearings never match the SVG icons.

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

### Label ↔ field horizontal alignment (form rows)

A standalone `<label>` placed on the same line as a taller field has **no MD3 spec** — MD3 labels live inside/above the field. The parity target (MUI `FormLabel` / `FormControlLabel` rows, `align-items:center`) is **centre alignment** of the label against the field's control box.

Why a separate `<label>` is needed at all: most ZK inputs (textbox, combobox, datebox, …) have **no `label` attribute**, so a field caption must be an adjacent `<label>` component. Only selection controls (radio, checkbox) carry their own `label` — and those captions are part of the control, centred by the component itself.

Theme stance:
- The theme does **not** auto-centre a bare `<label>` — alignment is a container concern, never a `.z-label` property (a label must still baseline-align in running text and wrap as a caption). See skill `reference/inline-label-alignment.md`.
- The flex centre is **required only for selection controls** (radio / checkbox): a label beside a `textbox`/`combobox` already centres in a plain block row, so leave those alone. For a radio/checkbox row, wrap it: `<div sclass="z-d-flex z-align-center z-gap-3">` (verified 0px; `z-gap-*` sets the label↔field gap since flex collapses inter-element whitespace). `<hlayout valign="middle">` / `<hbox valign="middle">` are equivalent ZK-attribute alternatives. Applying the wrapper to an input row is harmless but unnecessary; for a column of mixed rows you may apply it uniformly for visual consistency.
- A bare `<div>` row is a **baseline context**: it coincidentally centres single-line inputs (textbox via `vertical-align:middle`, combobox via baseline-at-centre) but drops radio/checkbox labels ~4–5px (their baseline is the caption text, below the box centre). The default `<hlayout>` (`valign="top"`) puts every label ~10px high. Neither is a reliable form-row container — the divergence is correct CSS for the mode, not a theme defect.
- Live demo of both states: `src/test/resources/web/label.zul` (a "Default block row" group showing the radio/checkbox drop, and a "Correct" flex-centred group).

---

## 14. Splitter Family (unified spec — user ruling 2026-06-04)

One resize affordance across the app. Four implementations share this spec:
`splitter` (zul.box), `borderlayout` region splitters, `splitlayout` (zkmax), and
`goldenlayout` `.lm_splitter`.

**Implementation source (2026-06-06):** the canonical values below are defined ONCE as
`--zk-splitter-*` tokens in `zul/css/tokens/_splitter.css` (globally loaded via
`norm.css.dsp`). Component CSS must consume the tokens — never restate these values as
literals (gap log 2026-06-04 family fragmentation; 2026-06-06 cursor drift). Documented
per-component exceptions (GL transparent gutter, splitlayout 1px bar border, borderlayout
44px pill growth) stay local in their component file with a comment citing this section.

| Property | Canonical value |
|----------|-----------------|
| Bar thickness | **8px** (`--zk-spacing-2`) — both axes/orientations |
| Bar idle background | `--zk-color-surface-container` |
| Bar hover background | `color-mix(in srgb, var(--zk-color-primary) calc(var(--zk-state-hover-opacity) * 100%), var(--zk-color-surface-container))` |
| Bar drag/active background | same mix with `--zk-state-pressed-opacity` (12%) |
| Cursor | `col-resize` (vertical bar) / `row-resize` (horizontal bar) |
| Transition | `background-color var(--zk-motion-duration-short3) var(--zk-motion-easing-standard)` |
| Non-resizable (`*-nosplitter`) | cursor `default` AND hover keeps the idle background — no primary tint on a bar that cannot resize (false affordance; Gate-2 finding 2026-06-04). borderlayout is exempt: ZK hides the strip entirely when `splittable="false"` |

**Actuator pill** (the three ZK-mold splitters — `splitter`, `borderlayout`, `splitlayout` —
all render `<span>-button` + grip/caret/grip icons):

| Property | Canonical value |
|----------|-----------------|
| Pill size | cross-axis = bar thickness (8px), long-axis 28px, `--zk-shape-corner-full` |
| Pill idle | `--zk-color-outline-variant` fill, no border, no elevation |
| Pill hover/active | `--zk-color-primary` fill, icons `--zk-color-on-primary` |
| Grip icons | 8px, `--zk-color-on-surface-variant`, always visible (`opacity: 1`) |
| Collapse caret | hidden at idle (`opacity: 0`), fades in on hover |

Rationale: MD3 has no splitter; the spec composes the MD3 bottom-sheet drag handle
(slim inline pill) with a surface-tinted divider (originally designed for borderlayout —
that CSS's comment block is the source of record for the pill reasoning).

**GoldenLayout (revised 2026-06-05 — full family alignment; idle fill re-ruled
2026-06-06):** `.lm_splitter` is GoldenLayout-library-injected — no button element — but
that does NOT exempt it from the pill: GL has no `setBtnPos_` JS centering, so the actuator
pill is drawn entirely in CSS via `::before` (pill: bar-thickness × 28px, `outline-variant`,
`corner-full`) with grip dots via `::after` (8px Lucide `ellipsis-vertical`/`ellipsis` mask,
`on-surface-variant`, `opacity: 1`; hover → pill `primary`, dots `on-primary`). The earlier
"no pill, opacity-.5 dot marker" exception shipped an imperceptible affordance (user finding
2026-06-05) and is retired. GL's bundled CSS is never loaded in ZK, so the theme must also
set the family cursors (`col-resize` on `.lm_horizontal`, `row-resize` on `.lm_vertical`).
Remaining structural exception: no collapse caret (GoldenLayout has no collapse feature).

**GL idle-fill exception (user re-ruling 2026-06-06):** the family's `surface-container`
idle fill is REPLACED by `transparent` for GL only. The family fill exists to make the bar
visible *between surface panes*; GL bars abut `surface-container` `.lm_header` strips, so
the identical fill erased the very boundary it marks — bar + header read as one region
(worst on `lm_vertical`). GL panels are self-bordered cards on a transparent canvas: the
splitter region reads as a card *gutter*, with the pill + grips carrying the affordance.
Hover/drag tints become translucent: `color-mix(in srgb, var(--zk-color-primary)
<hover|pressed opacity>%, transparent)`. General principle for future splitter contexts:
**the bar idle fill must contrast with every surface it abuts** — when neighbors are
`surface-container`, the family fill is disqualified (contract outcome row M21 encodes
this as an adjacent-surface comparison).

**JS centering rule (refined 2026-06-04):** all three ZK-mold splitters center the pill on
the bar's long axis via JS inline margin (`setBtnPos_`). Never **half-mix** CSS and JS
centering on the same axis — either leave the axis fully to JS (only safe when the bar's
long-axis size is CSS-fixed at bind time), or take full CSS ownership: neutralize the JS
inline margin with `margin-left/top: 0 !important` and center via `left/top: 50% +
transform`. CSS ownership is required on a flex-resolved axis (`setBtnPos_` can run while
the offset is still 0 and write margin 0 permanently) — see
`.claude/skills/zk-component-rules/components/splitlayout.md` (family-wide rule; both
half-mixing and JS-only-on-flex-axis shipped as real bugs).
