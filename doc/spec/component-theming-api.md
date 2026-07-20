# Component Theming API

Marble's tokens recolor the *whole* theme coherently (see [brand-override.md](brand-override.md))
and resize it coherently (see [data-dense-mode.md](data-dense-mode.md)). But enterprise
adopters also routinely need to restyle **one component** — "make *our* buttons pill-shaped",
"give the grid header our brand tint" — without forking the theme or fighting it with
brittle `!important` overrides. Marble exposes this as **per-component appearance knobs**:
each themed component reads a small, curated set of `--zk-<comp>-*` custom properties. Set
them at `:root` (whole app) or on any container (one region) and only that component changes.
No forking, no build step, no recompilation.

This is the same mechanism the theme already uses internally for control *sizes*
(`tokens/_sizing.css`) and for the splitter family (`tokens/_splitter.css`); this API
generalizes it to the **appearance** dimension (color / border / radius / state) and
documents it as a public, supported surface.

## How it works

Knob defaults live in [`tokens/_component-theme.css`](../../src/main/resources/web/zul/css/tokens/_component-theme.css),
declared **unlayered** at `:root`, and are bundled into `norm.css.dsp`:

```css
:root {
    --zk-button-bg:     var(--zk-color-primary);
    --zk-button-radius: var(--zk-shape-button);
    /* … */
}
```

Each component consumes the knob from inside `@layer zk-components`:

```css
@layer zk-components {
.z-button {
    background-color: var(--zk-button-bg);
    border-radius:    var(--zk-button-radius);
}
}
```

Because every default equals the value the component used before, **declaring nothing
changes nothing** — the API is purely additive and render-neutral until an adopter opts in.

### Where knob defaults live — centralized, not per-component

All knob defaults are declared in the single central file `tokens/_component-theme.css`,
never inside a component's own CSS. This follows the established project convention: the
stock ZK theme (this repo's LESS-based `master` branch) declares **all** ~1,700 of its
`--zk-*` custom properties — global *and* component-specific alike — in one central `:root`
profile (`zul/less/profiles/_default.less`, with `_compact.less` for density) and **zero**
inside any component `.less`. Marble keeps that discipline, only splitting the central defs
by category (`_colors.css`, `_sizing.css`, `_splitter.css`, …); the component appearance
knobs are one more such file — the sibling of `_sizing.css`, which already centralizes every
component's *size* knob in one file. Authoring rule 1 is the other reason: a default declared
on the component element would shadow `:root`/region overrides for that element's subtree.

> A component *may* still declare a `--zk-<comp>-*` on a **variant/modifier** selector to
> re-parameterize its base rule — e.g. `.z-chip-info { --zk-chip-bg: … }`,
> `.z-avatar-small { --zk-avatar-size: … }`. That is a private *variant* mechanism, not an
> adopter-facing default, and is overridable only per-instance (inline) — not the whole-app +
> region contract this API defines. To bring such a component fully into this API, hoist its
> base default into `tokens/_component-theme.css`.

## Overriding

### Whole app — at `:root`

```css
/* adopter stylesheet, loaded AFTER the Marble bundle */
:root {
    --zk-button-radius: 9999px;   /* every button becomes a pill */
    --zk-button-bg: #6750a4;
}
```

### One region — on any container

Custom properties inherit, so setting a knob on an ancestor restyles only that subtree.
This is the common case and needs no special load order:

```xml
<div style="--zk-button-radius:9999px; --zk-button-bg:#6750a4; --zk-button-fg:#fff">
    <button label="Pill"/>          <!-- restyled -->
</div>
<button label="Default"/>            <!-- untouched — sibling, not a descendant -->
```

A runnable demo of both is [`component-theming.zul`](../../src/test/resources/web/component-theming.zul);
the knob contract is regression-tested in [`component-theming.spec.ts`](../../src/test/playwright/component-theming.spec.ts).

## Cascade & load-order rules (important)

The knob defaults are **unlayered**, and components consume them from `@layer zk-components`.
Since unlayered rules always beat layered ones, the mechanics are:

- **Regional override (on an ancestor element)** always wins by *inheritance distance* — the
  nearest ancestor that sets the property governs its subtree, regardless of cascade layer or
  source order. No load-order concern.
- **Whole-app override (at `:root`)** competes with the theme's own `:root` default on the
  *same* element. Both are unlayered with equal specificity (0,1,0), so **source order
  decides** — the adopter's stylesheet must load **after** `norm.css.dsp`, **or** use a
  slightly higher-specificity selector. The theme's own brand presets already rely on this:
  `:root[data-brand="…"]` (0,2,0) beats the base `:root` (0,1,0). `html:root { … }` works too.

## Authoring rules

1. **Declare knobs only at `:root` (or an override scope) — never on the component element.**
   A `.z-button { --zk-button-bg: … }` declaration would *shadow* any `:root` or region
   override for the button's own subtree. (Same trap `tokens/_sizing.css` layer-3 documents.)
2. **Every default must equal the current value** — the exact token or literal the component
   used before — so adopting the knob is zero visual regression.
3. **Consume without a fallback** (`var(--zk-button-bg)`, not `var(--zk-button-bg, …)`): the
   default is defined once, at `:root`, keeping the knob discoverable in DevTools and avoiding
   a fallback that could drift from the `:root` default.
4. **Curate the surface.** Expose the themeable essentials (fill / text / border / radius / key
   states / size) — not every property. A knob is a supported contract; keep the set small.

### Relationship to brand override & density

| Want to… | Use |
|----------|-----|
| Recolor the **whole theme** from one seed | `--zk-color-primary` (+ role seeds) — [brand-override.md](brand-override.md) |
| Resize the **whole theme / a region** | `data-density` + `--zk-*-height` — [data-dense-mode.md](data-dense-mode.md) |
| Restyle **one component's appearance** | this API's `--zk-<comp>-*` knobs |

> **Freeze caveat.** Overriding an upstream *global* seed (e.g. `--zk-color-primary`) on a
> *region* will **not** reflow a knob whose default is `var(--zk-color-primary)` — that value
> was substituted at `:root` and inherited frozen. To recolor a region, override the component
> **knob** directly; to recolor the whole app, override the seed at `:root`.

## Knob reference

### Button — shipped

Consumed by `.z-button` (filled base) + `.z-uploadbutton`. Color/outlined/text/icon/FAB
**variants** keep their own colors via higher-specificity rules; the disabled treatment is
intentionally not knob-driven. State is an MD3 `::before` overlay (a tint whose opacity
animates), so the knobs are an overlay color + per-state opacities — matching the real
implementation, not a per-state background.

| Knob | Default |
|------|---------|
| `--zk-button-bg` | `var(--zk-color-primary)` |
| `--zk-button-fg` | `var(--zk-color-on-primary)` |
| `--zk-button-radius` | `var(--zk-shape-button)` |
| `--zk-button-elevation` | `var(--zk-elevation-resting)` |
| `--zk-button-padding-y` / `-padding-x` | `6px` / `var(--zk-spacing-4)` |
| `--zk-button-overlay-color` | `var(--zk-color-on-primary)` |
| `--zk-button-hover-opacity` / `-focus-opacity` / `-active-opacity` | state-layer opacity tokens |
| `--zk-button-height` (size — in `_sizing.css`) | `36px` |

Their knob vocabularies differ by design because their **state models** differ: inputs drive
per-state `border-color`; window/grid swap `background-color`; only button uses the overlay
model.

### Input — shipped

Shared by `.z-textbox` / `.z-intbox` / `.z-decimalbox` / `.z-doublebox` / `.z-longbox` /
`.z-passwordbox` (outlined MD3 text field). State is a per-state `border-color` change (no
overlay). Readonly/disabled use the muted `outline-variant` treatment and are not knob-driven.

| Knob | Default |
|------|---------|
| `--zk-input-bg` | `var(--zk-color-surface)` |
| `--zk-input-fg` | `var(--zk-color-on-surface)` |
| `--zk-input-radius` | `var(--zk-shape-input)` |
| `--zk-input-border-color` | `var(--zk-color-outline)` |
| `--zk-input-border-color-hover` | `var(--zk-color-on-surface)` |
| `--zk-input-border-color-focus` | `var(--zk-color-primary)` |
| `--zk-input-border-color-error` | `var(--zk-color-error)` |
| `--zk-input-height` (size — in `_sizing.css`) | `var(--zk-control-height)` |

### Window — shipped

Consumed by `.z-window` + header. **Elevation stays mode-driven** (embedded/overlapped/modal →
`_elevation.css`, per [window-design-rules.md](window-design-rules.md)) and is intentionally
not a knob. The header shares the window surface fill.

| Knob | Default |
|------|---------|
| `--zk-window-bg` | `var(--zk-color-surface)` |
| `--zk-window-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-window-radius` | `var(--zk-shape-corner-extra-small)` |
| `--zk-window-header-fg` | `var(--zk-color-on-surface)` |
| `--zk-window-icon-hover-bg` | `var(--zk-color-surface-container)` |
| `--zk-window-close-hover-bg` | `var(--zk-color-error-container)` |
| `--zk-window-header-height` (size — in `_sizing.css`) | `56px` |

### Grid — shipped

Consumed by `.z-grid` / `.z-column` / `.z-row`. Curated to the grid "lines" + fills; secondary
accents (group/foot separators, legacy `.z-grid-striped`/`.z-grid-odd`-container fallbacks) stay
on the base tokens. `--zk-grid-row-hover-bg` keeps its stock `rgba` literal for zero regression.

| Knob | Default |
|------|---------|
| `--zk-grid-bg` | `var(--zk-color-surface)` |
| `--zk-grid-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-grid-radius` | `var(--zk-shape-card)` |
| `--zk-grid-header-fg` | `var(--zk-color-on-surface-variant)` |
| `--zk-grid-row-hover-bg` | `rgba(0, 0, 0, 0.04)` |
| `--zk-grid-stripe-bg` | `var(--zk-color-surface-container-lowest)` |
| `--zk-grid-foot-bg` | `var(--zk-color-surface-container-low)` |
| `--zk-grid-cell-padding` (size — in `_sizing.css`) | `var(--zk-spacing-4)` |

### Listbox — shipped

Grid's outlined-table model **plus row selection** (`.z-listitem` / `.z-listheader`). Selection
uses the MD3 list-row family (primary-container fill + paired text). Foot/group accents and
legacy striping fallbacks stay on the base tokens.

| Knob | Default |
|------|---------|
| `--zk-listbox-bg` | `var(--zk-color-surface)` |
| `--zk-listbox-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-listbox-radius` | `var(--zk-shape-card)` |
| `--zk-listbox-header-fg` | `var(--zk-color-on-surface-variant)` |
| `--zk-listbox-row-hover-bg` | `color-mix(… on-surface 8%, surface)` |
| `--zk-listbox-stripe-bg` | `var(--zk-color-surface-container-lowest)` |
| `--zk-listbox-selected-bg` | `var(--zk-color-primary-container)` |
| `--zk-listbox-selected-fg` | `var(--zk-color-on-primary-container)` |
| `--zk-listbox-cell-padding` (size — in `_sizing.css`) | `var(--zk-spacing-4)` |

### Tree — shipped

Same as listbox, minus striping (`.z-tree` / `.z-treerow` / `.z-treecol`).

| Knob | Default |
|------|---------|
| `--zk-tree-bg` | `var(--zk-color-surface)` |
| `--zk-tree-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-tree-radius` | `var(--zk-shape-card)` |
| `--zk-tree-header-fg` | `var(--zk-color-on-surface-variant)` |
| `--zk-tree-row-hover-bg` | `color-mix(… on-surface 8%, surface)` |
| `--zk-tree-selected-bg` | `var(--zk-color-primary-container)` |
| `--zk-tree-selected-fg` | `var(--zk-color-on-primary-container)` |
| `--zk-tree-cell-padding` (size — in `_sizing.css`) | `var(--zk-spacing-2) var(--zk-spacing-4)` |

## Recipe — adding a component to the API

Validated by the button pilot; repeat per component:

1. **Audit** the component CSS: which properties are worth exposing, and how are states
   implemented (overlay vs border-color vs background swap)? The knob names follow that model.
2. **Declare** the `--zk-<comp>-*` knobs at `:root` in `tokens/_component-theme.css`, each
   defaulting to the property's exact current value.
3. **Refactor** the component CSS to consume `var(--zk-<comp>-knob)` in place of the direct
   token/literal — surgically, only the exposed properties, no behavior change.
4. **Build** (`npm run build:css`) and confirm the knob appears in `norm.css.dsp` and is
   consumed in the component's `.css.dsp`; `npm run check:css-dsp` stays green.
5. **Demo + test**: add the component to `component-theming.zul` and assert the knob contract
   in `component-theming.spec.ts` (scoped override applies, sibling unaffected, whole-app
   override wins, defaults unchanged).

## Status

- **Shipped**: button, input (textbox family), window, grid, listbox, tree.
- **Planned**: the remaining components (tab, combobox, menu, panel, …), and hoisting the
  variant-local chip/avatar defaults into this API.
