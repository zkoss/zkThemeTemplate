# Component Theme Variables

> **Feature name:** *Component Theme Variables* (CTV). The individual `--zk-<comp>-*` custom
> properties are the theme variables; this doc also calls a single one a **knob** informally.
> This is a **declarative CSS custom-property** surface — there is **no** JS/Java call API (that
> role belongs to `MarbleBrand` / `MarbleDensity`).

Marble's tokens recolor the *whole* theme coherently (see [brand-override.md](brand-override.md))
and resize it coherently (see [data-dense-mode.md](data-dense-mode.md)). But enterprise
adopters also routinely need to restyle **one component** — "make *our* buttons pill-shaped",
"give the grid header our brand tint" — without forking the theme or fighting it with
brittle `!important` overrides. Marble exposes this as **per-component theme variables**:
each themed component reads a small, curated set of `--zk-<comp>-*` custom properties. Set
them at `:root` (whole app) or on any container (one region) and only that component changes.
No forking, no build step, no recompilation.

This is the same mechanism the theme already uses internally for control *sizes*
(`tokens/_sizing.css`) and for the splitter family (`tokens/_splitter.css`); Component Theme
Variables generalize it to the **appearance** dimension (color / border / radius / state) and
document it as a public, supported surface.

> **Progress tracking:** conformance of each component against the criteria below is tracked
> separately in [`../component-theme-variables-progress.md`](../component-theme-variables-progress.md).

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
changes nothing** — Component Theme Variables are purely additive and render-neutral until an
adopter opts in.

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
> region contract Component Theme Variables define. To bring such a component fully in, hoist its
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
| Restyle **one component's appearance** | this feature's `--zk-<comp>-*` variables |

> **Freeze caveat.** Overriding an upstream *global* seed (e.g. `--zk-color-primary`) on a
> *region* will **not** reflow a knob whose default is `var(--zk-color-primary)` — that value
> was substituted at `:root` and inherited frozen. To recolor a region, override the component
> **knob** directly; to recolor the whole app, override the seed at `:root`.

## Conformance criteria (檢驗條件)

The purpose in one line: *let an adopter restyle **one** component — whole-app or in one
region — by overriding **only that component's** `--zk-<comp>-*` variables, **never** a shared
global token, and with **zero regression** when they override nothing.*

A component **conforms** when it satisfies every applicable criterion below. The
[progress tracker](../component-theme-variables-progress.md) records each component's status
against these IDs. CTV-1…4 are the load-bearing *purpose* gates; CTV-5…9 are the
mechanics / hygiene / verification that keep them true.

| ID | Criterion | How to check |
|----|-----------|--------------|
| **CTV-1** | **Zero-regression default.** Every `--zk-<comp>-*` default resolves to the component's exact pre-existing value; overriding nothing renders identically to before the variables existed. | Default in `_component-theme.css` equals the old token/literal; computed style unchanged before/after. |
| **CTV-2** | **Isolation from global tokens (core purpose).** The exposed appearance properties are read *through* the component's own variables, so an adopter restyles them by overriding only `--zk-<comp>-*` — **never** a global `--zk-color-*` / `--zk-shape-*` / …. No exposed property still reads a global token directly, bypassing the variable. | Overriding the component variable changes only this component; the global token it defaults to and other components are unaffected. |
| **CTV-3** | **Region scoping.** Setting a variable on a container restyles only that subtree's instances; siblings outside are unchanged. | Playwright: scoped instance takes the value, sibling default does not. Documented per-variant exceptions (e.g. severity-pinned chip/badge) are stated in the component entry. |
| **CTV-4** | **Whole-app override wins.** A `:root` override loaded after `norm.css.dsp` (or at higher specificity) wins for all instances. | Inject a `:root` override; assert it applies. |
| **CTV-5** | **Declared at `:root`, unlayered, not on the element.** Defaults live in `tokens/_component-theme.css` at `:root`; not declared on the base component element (which would shadow region overrides for its own subtree). Variant/modifier re-parameterization is allowed but must be documented. | Grep the component CSS: no base `.z-<comp> { --zk-<comp>-*: … }`; default present in `_component-theme.css`. |
| **CTV-6** | **Meaningful coverage.** The variables cover the component's salient appearance axes (as applicable: fill, text, border, radius, the defining state/accent) — enough for a recognizable restyle without forking. Size lives in `_sizing.css`; elevation may be intentionally mode-driven. | Review against the component's DOM + states; record deliberate exclusions. |
| **CTV-7** | **State integrity.** Disabled / readonly / selected / error treatments stay correct under an override (they don't accidentally inherit a fill/border variable and lose their state distinction) — unless a state is itself an intentional, documented variable. | Override the region; assert the disabled (etc.) instance keeps its treatment. |
| **CTV-8** | **Documented.** Variable names + defaults (+ scope/exceptions) are listed in this doc's per-family table. | This file's reference section has the entry. |
| **CTV-9** | **Regression-tested.** A demo instance in `component-theming.zul` + a Playwright assertion in `component-theming.spec.ts` prove CTV-1/2/3/4. | Test exists and is green. |

> CTV-6 and CTV-7 are judgment calls (what counts as "enough" coverage / a preserved state);
> the tracker records the rationale, not just a checkmark.

## Variable reference (per component)

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

### Panel — shipped

Card container with header (`.z-panel`). Window-like, but carries a **resting elevation**
(so `--zk-panel-elevation` is a knob, unlike window). Note the stock panel renders border-less
(`.z-panel-noborder`), so `--zk-panel-border-color` only paints when a bordered mold is used.

| Knob | Default |
|------|---------|
| `--zk-panel-bg` | `var(--zk-color-surface)` |
| `--zk-panel-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-panel-radius` | `var(--zk-shape-card)` |
| `--zk-panel-elevation` | `var(--zk-elevation-resting)` |
| `--zk-panel-header-fg` | `var(--zk-color-on-surface)` |
| `--zk-panel-icon-hover-bg` | `var(--zk-color-surface-container)` |
| `--zk-panel-header-height` (size — in `_sizing.css`) | `48px` |

### Groupbox — shipped

Bordered container with collapsible header (`.z-groupbox`).

| Knob | Default |
|------|---------|
| `--zk-groupbox-bg` | `var(--zk-color-surface)` |
| `--zk-groupbox-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-groupbox-radius` | `var(--zk-shape-card)` |
| `--zk-groupbox-elevation` | `var(--zk-elevation-card)` |
| `--zk-groupbox-header-fg` | `var(--zk-color-on-surface)` |
| `--zk-groupbox-icon-hover-bg` | `var(--zk-color-surface-container)` |
| `--zk-groupbox-header-height` (size — in `_sizing.css`) | `48px` |

### Combobox — shipped

Outlined input field (`.z-combobox-input` + `.z-combobox-button`) + dropdown popup
(`.z-combobox-popup`) + option selection (`.z-comboitem`). Head of the dropdown-input
family; datebox/timebox/spinner/bandbox share this field-knob vocabulary (see below).
Note combobox uses a **split-border** DOM (input + button each carry half the border,
focus grows border-width 1px→2px); the other four use a **wrapper-border** DOM (border
on the root, focus = inset ring). Same knobs, different plumbing.

| Knob | Default |
|------|---------|
| `--zk-combobox-bg` | `var(--zk-color-surface)` |
| `--zk-combobox-fg` | `var(--zk-color-on-surface)` |
| `--zk-combobox-radius` | `var(--zk-shape-input)` |
| `--zk-combobox-border-color` | `var(--zk-color-outline)` |
| `--zk-combobox-border-color-hover` | `var(--zk-color-on-surface)` |
| `--zk-combobox-border-color-focus` | `var(--zk-color-primary)` |
| `--zk-combobox-popup-bg` | `var(--zk-color-surface)` |
| `--zk-combobox-popup-radius` | `var(--zk-shape-menu)` |
| `--zk-combobox-item-hover-bg` | `rgba(0, 0, 0, 0.08)` |
| `--zk-combobox-selected-bg` | `var(--zk-color-primary-container)` |
| `--zk-combobox-selected-fg` | `var(--zk-color-on-primary-container)` |

### Datebox / Timebox / Spinner / Bandbox — shipped

The rest of the dropdown-input family. All four use the **wrapper-border** model: the
border sits on the root wrapper (`.z-datebox` / `.z-timebox` / `.z-spinner` / `.z-bandbox`)
and focus is an inset ring (Mechanism A — see `reference/focus-affordance-no-layout-shift.md`),
so `--zk-<comp>-border-color-focus` tints **both** the outline and the ring (and, for datebox,
the open-state trigger glyph). Datebox and bandbox add a popup surface; timebox and spinner are
steppers with no popup. `.z-doublespinner` shares the spinner ruleset, so it reads the same
`--zk-spinner-*` knobs. Invalid/error states stay on `--zk-color-error` (not a knob), and the
internal stepper/divider lines + datebox's nested timezone `<select>` keep their base tokens.

| Knob | Default | Applies to |
|------|---------|------------|
| `--zk-datebox-bg` / `--zk-timebox-bg` / `--zk-spinner-bg` / `--zk-bandbox-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-datebox-fg` / `--zk-timebox-fg` / `--zk-spinner-fg` / `--zk-bandbox-fg` | `var(--zk-color-on-surface)` | input text |
| `--zk-datebox-radius` / `--zk-timebox-radius` / `--zk-spinner-radius` / `--zk-bandbox-radius` | `var(--zk-shape-input)` | wrapper + trigger corners |
| `--zk-<comp>-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-<comp>-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-<comp>-border-color-focus` | `var(--zk-color-primary)` | focus/open outline + inset ring |
| `--zk-datebox-popup-bg` | `var(--zk-color-surface)` | calendar popup surface |
| `--zk-datebox-popup-radius` | `var(--zk-shape-corner-medium)` | calendar popup corners |
| `--zk-bandbox-popup-bg` | `var(--zk-color-surface)` | band popup surface |
| `--zk-bandbox-popup-radius` | `var(--zk-shape-menu)` | band popup corners |

### Daterangebox — shipped

Two-ended date-range picker field + range-calendar popup (EE, `zkmax/db/daterangebox.css`).
Same **wrapper-border** model as datebox/timebox/spinner/bandbox above: the border sits on the
root `.z-daterangebox` and focus is an inset ring (Mechanism A — see
`reference/focus-affordance-no-layout-shift.md`), so `--zk-daterangebox-border-color-focus` tints
both the outline and the ring. The trigger button's `border-radius` reuses the same
`--zk-daterangebox-radius` knob (it caps one corner of the shared field). Invalid state stays on
`--zk-color-error` (not a knob, same convention as datebox); disabled's surface/border likewise
stay on base tokens, not knob-driven. The range-highlight fills (begin/mid/end/preview-mid/
preview-end `::before` cells), the popup footer's Clear/Today/Cancel buttons, and the
begin/end input separator stay on base tokens — secondary sub-features kept out of the curated
surface (same convention as calendar/toolbar's minor sub-features).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-daterangebox-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-daterangebox-fg` | `var(--zk-color-on-surface)` | begin/end input text |
| `--zk-daterangebox-radius` | `var(--zk-shape-corner-extra-small)` | wrapper + trigger-button corners |
| `--zk-daterangebox-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-daterangebox-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-daterangebox-border-color-focus` | `var(--zk-color-primary)` | focus outline + inset ring |
| `--zk-daterangebox-popup-bg` | `var(--zk-color-surface)` | range-calendar popup surface |
| `--zk-daterangebox-popup-radius` | `var(--zk-shape-menu)` | range-calendar popup corners |

### Timepicker — shipped

Composite time-input field + time-list popup (PE, `zkmax/inp/timepicker.css`). Same
**wrapper-border** model as datebox/timebox/spinner/bandbox/daterangebox above: the border sits on
the root `.z-timepicker` and focus is an inset ring (Mechanism A — see
`reference/focus-affordance-no-layout-shift.md`), so `--zk-timepicker-border-color-focus` tints
both the outline and the ring. The clock trigger button's `border-radius` reuses the same
`--zk-timepicker-radius` knob (it caps one corner of the shared field, same convention as the
datebox/daterangebox trigger buttons). Invalid state (`:has(.z-timepicker-invalid)`) stays on
`--zk-color-error` (not a knob, same convention as datebox/timebox); the clock button's hover fill
(`color-mix` on-surface 8%) and disabled's opacity fade likewise stay on base tokens, not
knob-driven (same convention as button/input). The popup's `.z-timepicker-option`/`-selected` text
and hover fill stay on base tokens — a secondary sub-feature kept out of the curated surface (same
convention as calendar/toolbar's minor sub-features).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-timepicker-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-timepicker-fg` | `var(--zk-color-on-surface)` | input text |
| `--zk-timepicker-radius` | `var(--zk-shape-corner-extra-small)` | wrapper + trigger-button corners |
| `--zk-timepicker-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-timepicker-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-timepicker-border-color-focus` | `var(--zk-color-primary)` | focus outline + inset ring |
| `--zk-timepicker-popup-bg` | `var(--zk-color-surface)` | time-list popup surface |
| `--zk-timepicker-popup-radius` | `var(--zk-shape-menu)` | time-list popup corners |

### Chosenbox — shipped

Multi-select input field + option popup (EE, `zkmax/inp/css/chosenbox.css`). Same
**wrapper-border** model as datebox/timebox/spinner/bandbox/daterangebox/timepicker above: the
border sits on the root `.z-chosenbox` and focus (`.z-chosenbox-focus`) is a `box-shadow` inset
ring, so `--zk-chosenbox-border-color-focus` tints both the outline and the ring.
`--zk-chosenbox-fg` covers **both** the search input's text (`.z-chosenbox-input`) **and** each
selected chip's text (`.z-chosenbox-item-content`) — both read `var(--zk-color-on-surface)`
today, so one shared knob keeps them in lockstep, the same "one knob, several roles" precedent as
tab/calendar's accent. The selected chip has its own resting/defining-state fill pair:
`--zk-chosenbox-item-bg` is the resting chip fill (`.z-chosenbox-item`), and
`--zk-chosenbox-item-focus-bg` is the fill a chip swaps to once clicked and armed for keyboard
delete (`.z-chosenbox-item-focus`) — the defining state, same "one knob per state" precedent as
listbox/tree's `-selected-bg`. The delete-button's hover fill, the popup option's hover fill, and
the creatable-option accent stay on base tokens — secondary sub-features kept out of the curated
surface (same convention as calendar/toolbar's minor sub-features). Disabled
(`.z-chosenbox-disabled`) stays on its own surface token, not knob-driven (same convention as
input/button).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-chosenbox-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-chosenbox-fg` | `var(--zk-color-on-surface)` | search-input text + selected-chip text |
| `--zk-chosenbox-radius` | `var(--zk-shape-input)` | wrapper corners |
| `--zk-chosenbox-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-chosenbox-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-chosenbox-border-color-focus` | `var(--zk-color-primary)` | focus outline + inset ring |
| `--zk-chosenbox-popup-bg` | `var(--zk-color-surface)` | option-popup surface |
| `--zk-chosenbox-popup-radius` | `var(--zk-shape-menu)` | option-popup corners |
| `--zk-chosenbox-item-bg` | `var(--zk-color-surface-container-high)` | selected-chip resting fill |
| `--zk-chosenbox-item-focus-bg` | `var(--zk-color-primary-container)` | selected-chip armed-for-delete fill |

### Cascader — shipped

Read-only trigger field (not an `<input>` — shows the selected-path text or a placeholder,
`.z-cascader`) + a right-expanding tree popup (EE, `zkmax/inp/css/cascader.css`). Same
**wrapper-border** model as datebox/timebox/spinner/bandbox/daterangebox/timepicker/chosenbox
above: the border sits on the root `.z-cascader` and focus/open (`.z-cascader-focus` /
`.z-cascader-open`, one shared rule) is a `box-shadow` inset ring, so
`--zk-cascader-border-color-focus` tints both the outline and the ring. `--zk-cascader-fg` covers
**both** the trigger's selected-path label (`.z-cascader-label`) **and** each popup item's text
(`.z-cascader-item`) — both read `var(--zk-color-on-surface)` today, the same "one knob, several
roles" precedent as chosenbox's `fg`. `--zk-cascader-accent` is the component's one path-selection
signal: the currently-selected node's text color (`.z-cascader-item.z-cascader-selected`), the
defining state. The placeholder text, the trigger/item icons, the item hover/active fill (a
literal `rgba`), the cave-column divider, and the popup's own `border-color` stay on base tokens —
secondary sub-features kept out of the curated surface (same convention as
calendar/toolbar/timepicker's minor sub-features). Disabled (`.z-cascader-disabled`) dims via
`opacity` only, not knob-driven (same convention as button/input/rating).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-cascader-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-cascader-fg` | `var(--zk-color-on-surface)` | trigger's selected-path text + popup item text |
| `--zk-cascader-radius` | `var(--zk-shape-input)` | wrapper corners |
| `--zk-cascader-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-cascader-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-cascader-border-color-focus` | `var(--zk-color-primary)` | focus/open outline + inset ring |
| `--zk-cascader-popup-bg` | `var(--zk-color-surface)` | tree-popup surface |
| `--zk-cascader-popup-radius` | `var(--zk-shape-menu)` | tree-popup corners |
| `--zk-cascader-accent` | `var(--zk-color-primary)` | selected-path node text |

### Searchbox — shipped

Multi-select dropdown trigger field (not an `<input>` — shows the selected-label text or a
placeholder, `.z-searchbox`) + a detached search popup (EE, `zkmax/inp/css/searchbox.css`). Same
**wrapper-border** model as datebox/timebox/spinner/bandbox/daterangebox/timepicker/chosenbox/
cascader above: the border sits on the root `.z-searchbox` and focus/open is a `box-shadow` inset
ring (Mechanism A), so `--zk-searchbox-border-color-focus` tints both the outline and the ring.
`--zk-searchbox-fg` covers **four** roles: the trigger's selected-label text
(`.z-searchbox-label`), the popup's own text color, the search input's text, and each
(non-selected) item's text — all four read `var(--zk-color-on-surface)` today, the same "one
knob, several roles" precedent as chosenbox/cascader's `fg`. The selected item is the component's
one defining state, and per `doc/contracts/searchbox.md` it belongs to the **LIST-ROW** selection
family (primary-container fill + paired text — NOT the chip/secondary-container family), so it
gets its own pair: `--zk-searchbox-selected-bg` / `-selected-fg` (same pairing precedent as
combobox's `-selected-bg`/`-fg`); the selected item's hover fill (`color-mix`) also reads this
pair, so an override stays tonally consistent. The placeholder text, trigger/item icons, item
hover/keyboard-active background, the nested search input's own bg/border/radius, and the
multi-select check-icon's fill stay on base tokens — secondary sub-features kept out of the
curated surface (same convention as chosenbox/cascader's minor sub-features). Disabled dims via
opacity (plus its own surface token), not knob-driven (same convention as button/input).

**CTV-3 scope note** (same convention as combobox/datebox/bandbox/daterangebox/timepicker/
chosenbox/cascader's option popups): `.z-searchbox-popup` is reparented to `<body>` via
`makeVParent()` on open, so the region/whole-app assertions cover only the trigger field left in
place (wrapper `border-radius`/`border-color` and `.z-searchbox-label`'s `fg`), not the
reparented popup or its selected item — the `popup-bg`/`-popup-radius`/`-selected-bg`/
`-selected-fg` knobs are declared and consumed but not individually asserted, matching the
existing treatment of the other wrapper-border family members' popup knobs.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-searchbox-bg` | `var(--zk-color-surface)` | wrapper fill |
| `--zk-searchbox-fg` | `var(--zk-color-on-surface)` | trigger's selected-label text + popup text + search-input text + item text |
| `--zk-searchbox-radius` | `var(--zk-shape-input)` | wrapper corners |
| `--zk-searchbox-border-color` | `var(--zk-color-outline)` | resting outline |
| `--zk-searchbox-border-color-hover` | `var(--zk-color-on-surface)` | hover outline |
| `--zk-searchbox-border-color-focus` | `var(--zk-color-primary)` | focus/open outline + inset ring |
| `--zk-searchbox-popup-bg` | `var(--zk-color-surface)` | search-popup surface |
| `--zk-searchbox-popup-radius` | `var(--zk-shape-corner-medium)` | search-popup corners |
| `--zk-searchbox-selected-bg` | `var(--zk-color-primary-container)` | selected-item fill (+ hover) |
| `--zk-searchbox-selected-fg` | `var(--zk-color-on-primary-container)` | selected-item text |

### Tab (tabbox) — shipped

Nav chrome + active accent. State is a `::before` overlay; `--zk-tab-accent` colors the
state-layer tint, the selected label, and the bottom indicator. `--zk-tab-border-color` drives
every tab-component border (bar divider across top/bottom/left/right molds + tabpanel frames).

| Knob | Default |
|------|---------|
| `--zk-tab-bg` | `var(--zk-color-surface)` |
| `--zk-tab-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-tab-fg` | `var(--zk-color-on-surface-variant)` |
| `--zk-tab-fg-hover` | `var(--zk-color-on-surface)` |
| `--zk-tab-accent` | `var(--zk-color-primary)` |
| `--zk-tab-height` (size — in `_sizing.css`) | `48px` |

### Menu — shipped

Menubar surface + dropdown popup + selected item (`.z-menubar` / `.z-menupopup` / `.z-menuitem`).
Menu/menuitem hover uses a shared `::before` overlay (not knob-driven).

| Knob | Default |
|------|---------|
| `--zk-menubar-bg` | `var(--zk-color-surface-container)` |
| `--zk-menupopup-bg` | `var(--zk-color-surface)` |
| `--zk-menupopup-radius` | `var(--zk-shape-menu)` |
| `--zk-menupopup-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-menuitem-selected-bg` | `var(--zk-color-primary-container)` |

### Avatar / avatar-group — shipped

Native ZK-6097 components. Base defaults were declared on the `.z-avatar` element (which
shadowed region overrides); they are hoisted here so a `:root`/region override reaches plain
avatars. Size variants (`.z-avatar-small/-large`) still set size/font per-variant.

| Knob | Default |
|------|---------|
| `--zk-avatar-bg` | `var(--zk-color-primary-container)` |
| `--zk-avatar-fg` | `var(--zk-color-on-primary-container)` |
| `--zk-avatar-size` | `40px` |
| `--zk-avatar-font-size` | `var(--zk-typescale-label-large-size)` |
| `--zk-avatargroup-overlap` | `-8px` |

### Chip — shipped (with a caveat)

Base defaults (`--zk-chip-bg` / `-border` / `-color`) are hoisted here for consistency (no
more inline fallback). **Caveat:** ZK stamps a default severity class (`z-chip-info`) on every
chip, and the severity variants (`.z-chip-info/-success/…`) set these vars *on the element* —
which shadows a `:root`/region override. So chip is themed **per-severity / inline**
(`style="--zk-chip-bg:…"`), not regionally. The base knob applies only to a severity-less chip.

| Knob | Default |
|------|---------|
| `--zk-chip-bg` | `var(--zk-color-surface-container-high)` |
| `--zk-chip-border` | `var(--zk-color-outline-variant)` |
| `--zk-chip-color` | `var(--zk-color-on-surface-variant)` |

### Badge — shipped

The fourth ZK-6097 native (completing the badge/chip/avatar/avatar-group set). The
`.z-badge-indicator` resolves the knobs from `:root`. ZK always stamps a severity class
(default `info`) and the indicator is a **child** of it, so a per-severity rule on the indicator
shadows any inherited value. We exploit that deliberately: the default `info` fill is routed
through the base `--zk-badge-bg` (there is **no** `.z-badge-info` rule), so a **default badge is
region- and inline-overridable**; the non-default severities (`.z-badge-success/-warning/-danger/-secondary`)
pin `--zk-badge-bg` per-variant and keep their semantic color. `--zk-badge-fg` and
`--zk-badge-radius` have no per-severity override, so they apply to **every** badge. Dot-mode
radius (`50%`) is a shape concern and stays hardcoded, not a knob.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-badge-bg` | `var(--zk-color-status-info)` | default (info) badge only; non-default severities pin their own |
| `--zk-badge-fg` | `var(--zk-color-on-status)` | every badge |
| `--zk-badge-radius` | `10px` | every badge (count/pill; dot stays `50%`) |

### Rating — shipped

Star-rating glyph fill only (`.z-rating-icon`) — an icon-only component, so there is no
background, border, or radius knob to expose. Two color axes cover it: `--zk-rating-fg` for
the resting (outline) star and `--zk-rating-accent` for the selected/hover (filled) star —
the defining state. Disabled dims via `--zk-state-disabled-opacity`; readonly disables
interaction only, at full opacity. Neither disabled nor readonly is knob-driven.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-rating-fg` | `var(--zk-color-outline)` | resting (outline) star |
| `--zk-rating-accent` | `var(--zk-color-primary)` | selected/hover (filled) star |

### Progressmeter — shipped

MD3 linear progress: a two-layer bar (track + fill), no icon, no text. Two color knobs
cover it — `--zk-progressmeter-bg` for the track and `--zk-progressmeter-fill` for the
progress bar — plus a shared radius knob for both layers. The color **variants**
(`.z-progressmeter-secondary/-success/-warning/-error`) keep their own semantic colors via
higher-specificity rules on the element (same treatment as button's color variants); they
are intentionally **not** knob-driven, so only the default (primary) bar responds to an
override.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-progressmeter-bg` | `var(--zk-color-primary-container)` | track (default/primary bar only) |
| `--zk-progressmeter-fill` | `var(--zk-color-primary)` | fill bar (default/primary bar only) |
| `--zk-progressmeter-radius` | `2px` | every progressmeter (track + fill) |

### Paging — shipped

MD3 pagination bar. Two color/shape axes cover the pager buttons —
`--zk-paging-fg` for the button text/icon and `--zk-paging-radius` for the
shared pill shape — plus the current-page indicator's own fill/text pair
(`--zk-paging-selected-bg` / `-fg`, the defining state). The jump-to-page
input (rendered only by the **default** mold) gets its own bg/fg/border-color
trio, curated separately from the pager buttons.

Numbered page buttons — and therefore `.z-paging-selected` — only render in
the **`os`** mold; the default mold shows prev/next buttons plus the
jump-to-page input, with no page numbers. `component-theming.zul` demos
paging with `mold="os"` so `--zk-paging-selected-bg/-fg/-radius` are actually
exercised; the jump-to-page input knobs are shipped but not demoed on that
page (it uses the `os` mold, which never renders the input). Disabled
buttons/input are intentionally not knob-driven (same convention as
button/input). The jump-input's `border-radius` also stays hardcoded on
`--zk-shape-corner-extra-small` rather than exposed as a knob — a defensible
curation choice (the shared `--zk-paging-radius` only applies to pager
buttons), noted here rather than fixed.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-paging-fg` | `var(--zk-color-on-surface-variant)` | every pager button (text/icon) |
| `--zk-paging-radius` | `var(--zk-shape-corner-full)` | every pager button (pill shape) |
| `--zk-paging-selected-bg` | `var(--zk-color-primary-container)` | current-page button fill |
| `--zk-paging-selected-fg` | `var(--zk-color-primary)` | current-page button text |
| `--zk-paging-input-bg` | `var(--zk-color-surface)` | jump-to-page input (default mold only) |
| `--zk-paging-input-fg` | `var(--zk-color-on-surface)` | jump-to-page input (default mold only) |
| `--zk-paging-input-border-color` | `var(--zk-color-outline)` | jump-to-page input (default mold only) |

### Combobutton — shipped

Split button (primary action + dropdown arrow), `.z-combobutton` /
`.z-combobutton-content` / `.z-combobutton-button`. Reuses button's overlay
state model (an MD3 `::before` tint over the content area whose opacity
animates per state) rather than a per-state background, plus a
`-divider-color` knob for the 1px seam between the content and arrow areas
(default is the stock literal `rgba(255, 255, 255, 0.3)`, kept as-is — it
only reads against the filled `bg`, so it isn't promoted to a token).
`toolbar` mold is a **color variant** (same treatment as button's
outlined/text variants): it pins its own semantic colors
(`--zk-color-on-surface-variant` / `--zk-color-outline`) directly on the
element at higher specificity, so it does not read the base knobs. Disabled
is likewise not knob-driven (button convention).

| Knob | Default |
|------|---------|
| `--zk-combobutton-bg` | `var(--zk-color-primary)` |
| `--zk-combobutton-fg` | `var(--zk-color-on-primary)` |
| `--zk-combobutton-radius` | `var(--zk-shape-button)` |
| `--zk-combobutton-divider-color` | `rgba(255, 255, 255, 0.3)` |
| `--zk-combobutton-overlay-color` | `var(--zk-color-on-primary)` |
| `--zk-combobutton-hover-opacity` / `-focus-opacity` / `-active-opacity` | state-layer opacity tokens |

### Selectbox — shipped

Native `<select>` element — `<listbox mold="select">` renders `<select
class="z-select">` directly (no wrapper); Listbox's `css-uri` covers every
mold, so listbox.css's `.z-select` block is the effective ruleset (not
select.css's — see note below). State is a per-state border-color change, no
overlay, same model as Input. Disabled is opacity-only, not knob-driven (same
convention as input/button). The dropdown chevron is a literal-color SVG
baked into a `background-image` data URI — a custom property can't be
interpolated inside a `url()` string, so its stroke color stays hardcoded,
not a knob.

| Knob | Default |
|------|---------|
| `--zk-selectbox-bg` | `var(--zk-color-surface)` |
| `--zk-selectbox-fg` | `var(--zk-color-on-surface)` |
| `--zk-selectbox-radius` | `var(--zk-shape-input)` |
| `--zk-selectbox-border-color` | `var(--zk-color-outline)` |
| `--zk-selectbox-border-color-hover` | `var(--zk-color-on-surface)` |
| `--zk-selectbox-border-color-focus` | `var(--zk-color-primary)` |

**Duplicate `.z-select` ruleset note**: `js/zul/sel/css/select.css` also
declares a `.z-select` block (reading the same six knobs), but its
`select.css.dsp` is never requested by Listbox's `css-uri` (confirmed via
`check:css-dsp` — it's an unreferenced "extra"); it is dormant duplicate
coverage, not the effective stylesheet. Both files consume the identical
knobs so they stay in lockstep regardless of which one ever loads.

### Inputgroup — shipped

Input + addon(s) combined into a single field (`.z-inputgroup` +
`.z-inputgroup-text` addon + the grouped textbox/combobox). Border color and
radius are **shared** axes: `--zk-inputgroup-border-color` paints both the
addon's `border` and the grouped input/combobox's border override, so the
whole group reads as one continuous outline; `--zk-inputgroup-radius` drives
the rounded ends in both horizontal and vertical layout, plus the
`:focus-within` ring's corner. The addon also carries its own fill/text pair.
Focus stays on the global `--zk-focus-ring` (same convention as
button/window/grid), not a knob.

| Knob | Default |
|------|---------|
| `--zk-inputgroup-text-bg` | `var(--zk-color-surface-container-low)` |
| `--zk-inputgroup-text-fg` | `var(--zk-color-on-surface-variant)` |
| `--zk-inputgroup-border-color` | `var(--zk-color-outline)` |
| `--zk-inputgroup-radius` | `var(--zk-shape-input)` |

### Calendar — shipped

Self-contained month grid + nav header (`.z-calendar`); also the shell used inside a
datebox popup, which flattens it back to flat content (see the `:not()` guard in
calendar.css) — unaffected by these knobs. `--zk-calendar-fg` is the day-number/title
text; `--zk-calendar-header-fg` is the muted weekday-label + nav-icon (resting) text.
`--zk-calendar-accent` / `-accent-fg` is a single defining-state pair — it colors the
selected-day disc fill (`::before`) + text, the today ring, and the Today-link label
together (all four read `var(--zk-color-primary)`/`-on-primary` today), the same "one
knob, several roles" precedent as tab's `--zk-tab-accent`. Hover state layers
(title/icon/day-cell hover tints, the Today-link hover tint) stay on base tokens, not
knob-driven (same convention as menu's `::before` overlay). Disabled/outside/out-of-range
days, the week-of-year column, and the month/year/decade picker's pill radius
(`--zk-shape-button`) also stay on base tokens — secondary/minor sub-features kept out of
the curated surface (same convention as grid/listbox).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-calendar-bg` | `var(--zk-color-surface)` | card + header fill |
| `--zk-calendar-fg` | `var(--zk-color-on-surface)` | day-number + title text |
| `--zk-calendar-header-fg` | `var(--zk-color-on-surface-variant)` | weekday-label + nav-icon (resting) text |
| `--zk-calendar-border-color` | `var(--zk-color-outline-variant)` | card border + today-link divider |
| `--zk-calendar-radius` | `var(--zk-shape-card)` | card corners |
| `--zk-calendar-accent` | `var(--zk-color-primary)` | selected-day fill, today ring, Today-link text |
| `--zk-calendar-accent-fg` | `var(--zk-color-on-primary)` | selected-day text |

### Toolbar — shipped

Full-width chrome bar (`.z-toolbar`), no radius (same treatment as menubar). A
single shared border-color knob styles two things: the bar's own edge
(`border-bottom` in the horizontal mold, `border-right` in the vertical mold —
the only edge with a real DOM match, and the one the Playwright test asserts)
and the `.z-toolbarseparator` item divider (both orientations). **Caveat**:
`.z-toolbarseparator` has no matching class in current ZK 10 core —
`<separator bar="true">` renders `z-separator-horizontal-bar`/
`-vertical-bar`, not `z-toolbarseparator` — so that half of the knob's
"family-wide" reach is CSS-only (pre-existing dead code, unrelated to this
knob, zero regression either way). The app-bar context variant (`.z-north
.z-toolbar`, including its toolbarseparator color-mix tint) is a distinct
color **VARIANT** (same treatment as combobutton's `toolbar` mold): it pins
its own semantic colors (`--zk-color-primary`/`-on-primary`) directly on the
element at higher specificity, so it does not read the base knobs. The
tabs-embedded variant (`.z-toolbar-tabs`, transparent/no-border) and the
overflow popup (`.z-toolbar-popup`, a minor sub-feature) also stay on base
tokens, not knob-driven.

| Knob | Default |
|------|---------|
| `--zk-toolbar-bg` | `var(--zk-color-surface)` |
| `--zk-toolbar-border-color` | `var(--zk-color-outline-variant)` |
| `--zk-toolbar-height` (size — in `_sizing.css`) | `48px` |

### Slider — shipped

MD3 range input — track + fill + thumb (`.z-slider`); no text/border, so the knob
surface is: the resting track color (`--zk-slider-track-bg`), a single defining accent
(`--zk-slider-accent`) that drives both the active fill and the thumb (both read
`var(--zk-color-primary)` today, so they share one knob — the same "one knob, several
roles" precedent as tab/calendar's accent), a shared corner radius used by the track,
fill, and thumb alike (`--zk-slider-radius`), and the thumb's resting elevation
(`--zk-slider-elevation`). The thumb's hover/focus/active state-layer ring (a
`color-mix` tint) reads the same accent, so an override stays tonally consistent; the
knob mold (PE)'s SVG arc strokes (`.z-slider-knob-inner` / `-area`) mirror the
identical track/fill concept and read the same two knobs too. The sphere mold's
3D-gradient thumb is a color **VARIANT** (like button's outlined/text variants) that
pins its own gradient at higher specificity, deliberately not knob-driven. The
numeric-input overlay (`.z-slider-input`) and the value tooltip (`.z-slider-popup`)
are minor sub-features kept on base tokens (same convention as calendar's
week-of-year column); disabled dims via `opacity` only, not knob-driven (same
convention as button/input/rating). **Out of scope**: rangeslider (PE) / multislider
(EE) are separate style files (`zkex/slider/css/rangeslider.css`,
`zkmax/slider/css/multislider.css`) and were not touched in this pass — still
candidates for a follow-up.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-slider-track-bg` | `var(--zk-color-outline-variant)` | resting track fill |
| `--zk-slider-accent` | `var(--zk-color-primary)` | active fill + thumb fill (+ PE knob-mold arc stroke) |
| `--zk-slider-radius` | `var(--zk-shape-corner-full)` | track / fill / thumb corner radius |
| `--zk-slider-elevation` | `var(--zk-elevation-1)` | thumb resting shadow |

### Checkbox — shipped (default mold only)

Consumed by the default mold (`.z-checkbox` / `.z-checkbox-mold` / `.z-checkbox-content`).
Resting (unchecked) reads the border/text knobs; checked and indeterminate swap to a single
accent (mold fill + border + the hover-ring tint), the defining state — the same "one knob,
several roles" precedent as tab/calendar's accent. The checkmark/dash glyph is a literal-color
SVG baked into a `background-image` data URI (same limitation as selectbox's chevron), so it
stays hardcoded, not a knob. Disabled dims via opacity only, not knob-driven (same convention as
button/input/rating). **Out of scope for this pass**: the `switch` and `toggle` molds are
distinct visual treatments (different DOM/state model) and keep reading base tokens directly —
natural follow-on candidates; radio/radiogroup are a separate widget and untouched here.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-checkbox-fg` | `var(--zk-color-on-surface)` | wrapper + label text |
| `--zk-checkbox-border-color` | `var(--zk-color-on-surface-variant)` | resting (unchecked) mold border |
| `--zk-checkbox-radius` | `2px` | mold corner radius |
| `--zk-checkbox-accent` | `var(--zk-color-primary)` | checked/indeterminate fill + border + hover-ring tint |

### Messagebox — shipped

Consumed by the alert dialog `Messagebox.show()` creates (`.z-messagebox-window.z-window` +
`.z-messagebox` + `.z-messagebox-buttons`). A distinct family from `--zk-window-*`: the dialog
owns a fixed, mode-independent surface/border/elevation rather than window's mode-driven chrome,
so it gets its own knobs. `--zk-messagebox-bg` covers the dialog surface, header, and content
areas alike (all three read the same fill — the same "one knob, several roles" precedent as
window's header sharing its surface fill). `--zk-messagebox-border-color` covers both divider
lines — the header's `border-bottom` and the button row's `border-top` — the same "one knob,
several dividers" precedent as toolbar's `--zk-toolbar-border-color`. Icon-type colors
(information/exclamation/error/question) are semantic status colors tied to the message type,
kept on their own tokens, not knob-driven (same convention as button/progressmeter's color
variants).

**CTV-3 (region scoping) is structurally N/A here, not a defect.** `Messagebox.show()` calls
`Executions.createComponents(_templ, desktop.getFirstPage(), null, arg)`, so the dialog Window is
always parented to the page root — never to the container that triggered it. A region override
on an ancestor of the triggering button cannot reach the dialog: verified empirically (the
dialog's DOM parent chain is `BODY`/`HTML`, a sibling of the triggering container, not its
descendant; `isDescendantOf` the container is `false`). This is the same "not regionally
demonstrable" class as chip, for a different root cause (chip pins vars on the component itself;
messagebox re-mounts to the page root). The whole-app (`:root`) override path is unaffected and
works normally.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-messagebox-bg` | `var(--zk-color-surface)` | dialog surface + header + content fill |
| `--zk-messagebox-fg` | `var(--zk-color-on-surface-variant)` | message body text |
| `--zk-messagebox-header-fg` | `var(--zk-color-on-surface)` | title text |
| `--zk-messagebox-border-color` | `var(--zk-color-outline-variant)` | header bottom border + button-row top border |
| `--zk-messagebox-radius` | `var(--zk-shape-dialog)` | dialog corners |
| `--zk-messagebox-elevation` | `var(--zk-elevation-dialog)` | dialog shadow (static — always modal, not mode-driven) |

### Notification — shipped (untyped/default card only)

Floating alert card created by `Clients.showNotification()` (`.z-notification` wrapper +
`.z-notification-content` card + a left accent stripe on `::before`). Only the **untyped**
(`type=null`) default card reads these knobs: `--zk-notification-bg` / `-fg` / `-radius` color
the content card's fill, text, and corners; `--zk-notification-accent` colors the left accent
stripe — the defining visual for the untyped/default state (default is
`var(--zk-color-status-info)`, the same value the untyped card rendered before). The
`.z-notification-info/-warning/-error` type variants pin their own bg/fg/accent via
higher-specificity compound selectors (e.g. `.z-notification-info .z-notification-content`) —
the same color-**variant** convention as button/progressmeter — so these knobs affect only an
untyped notification; a typed notification's semantic color is unaffected by an override
(CTV-7). Elevation (`box-shadow`) stays on its base token, not knob-driven — a deliberate
curation choice to keep the surface small (same convention as calendar/slider's minor
sub-features). Width/height are a size-dimension concern and already have their own knob
(`--zk-notification-height` in `tokens/_sizing.css`), not duplicated here. The close button's
icon `color: inherit` reads from `.z-notification`, not `.z-notification-content`, so it is
unaffected by these knobs either way.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-notification-bg` | `var(--zk-color-surface-container-highest)` | untyped card fill |
| `--zk-notification-fg` | `var(--zk-color-on-surface)` | untyped card text |
| `--zk-notification-radius` | `var(--zk-shape-corner-extra-small)` | untyped card corners |
| `--zk-notification-accent` | `var(--zk-color-status-info)` | untyped card's left accent stripe |

### Toast — shipped (info-default variant only)

Floating MD3 snackbar created by `Toast.show()` (`.z-toast` wrapper + `.z-toast-content` card +
icon + optional close button). Unlike notification, `Toast.show()` always defaults a `null` type
to `"info"`, so there is no untyped/bare card to route through — these knobs drive the **info
(default)** variant: `--zk-toast-bg` / `-fg` color `.z-toast-info .z-toast-content`'s fill and
text; `--zk-toast-accent` colors both the icon and the left accent stripe (`::before`) — the
defining visual, the same "one knob, several roles" precedent as notification's
`--zk-notification-accent`. `--zk-toast-radius` is shared by **every** toast (declared on the base
`.z-toast-content` rule, not per-type). The `.z-toast-warning` / `-error` type variants pin their
own bg/fg/accent via higher-specificity compound selectors (same color-variant convention as
notification/button/progressmeter), so they are unaffected by an override (CTV-7). The
close-button icon's color per type stays on its own token, not knob-driven (same convention as
notification's close icon). Elevation (`box-shadow`) stays on its base token, not knob-driven
(same convention as notification/calendar/slider's minor sub-features).

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-toast-bg` | `var(--zk-color-surface-container-highest)` | info (default) toast card fill |
| `--zk-toast-fg` | `var(--zk-color-on-surface)` | info (default) toast card text |
| `--zk-toast-radius` | `var(--zk-shape-corner-extra-small)` | every toast's card corners |
| `--zk-toast-accent` | `var(--zk-color-status-info)` | info (default) toast's icon + left accent stripe |

### A (anchor) — shipped

Consumed by `.z-a`, the plain-text MD3 link — no background, border, or radius knob applies.
Resting and hover text color are the same value (`var(--zk-color-primary)`) today, so a single
`fg` knob covers both — the same "one knob, several roles" precedent as tab/calendar's accent.
Focus stays on the global `--zk-focus-ring` (same convention as button/window/grid), not a knob;
disabled keeps its own `--zk-color-disabled` literal, also not knob-driven (same convention as
button/input/rating). `.z-a` renders in place (no client-side reparenting), so region scoping
works normally — unlike messagebox/popup's structural exceptions.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-a-fg` | `var(--zk-color-primary)` | resting + hover text color |

### Drawer — shipped

MD3 side-sheet panel (EE, `zkmax/wgt/css/drawer.css`) — `.z-drawer` fixed-position container +
`.z-drawer-mask` backdrop scrim + `.z-drawer-real` sliding panel + `.z-drawer-header` +
`.z-drawer-close` button + `.z-drawer-container`/`-cave` content area. All four directions
(left/right/top/bottom) share the same ruleset. `--zk-drawer-elevation` is a single **static**
shadow — every position gets the same shadow, unlike window's mode-driven elevation (same
convention as panel's resting-elevation knob). `--zk-drawer-border-color` is the header's bottom
divider, the panel's only dividing line (same convention as window/panel's shared border-color
knob). The close button's hover fill (`--zk-drawer-close-hover-bg`) mirrors the
window/panel/groupbox icon-hover-bg precedent; its resting/hover text color and the backdrop
mask's scrim color (a literal `rgba(0, 0, 0, 0.32)`, distinct from `--zk-color-scrim`'s `0.5`)
stay on base tokens/literals, not knob-driven (same convention as window's icon text color and the
shared modal-mask scrim). The panel renders edge-to-edge with no border-radius, so there is no
radius knob.

**CTV-3 (region scoping) is structurally N/A here, not a defect** — same exception class as
messagebox/popup, for a different root cause. `Drawer.prototype.setVisible()` calls
`zk.makeVParent()` on open (reparenting the **entire** `.z-drawer` root — header + real + close +
mask together — to the floating root, `document.body`) and `undoVParent()` on close (confirmed in
the compiled zkmax 10.4 widget bundle). Verified empirically: overriding
`--zk-drawer-border-color`/`--zk-drawer-header-fg` on a container ancestor of the trigger button
does not reach the open drawer (its `parentElement` is `BODY`, a sibling of the container, not a
descendant); the same override at `:root` hits normally. Unlike the
combobox/datebox/…/searchbox popup family — which reparents only the popup and leaves a trigger
wrapper in place to assert region scoping against — drawer reparents its whole root, so there is
no in-place remnant to test region scoping on; only the whole-app (`:root`) path is exercised.

| Knob | Default | Scope |
|------|---------|-------|
| `--zk-drawer-bg` | `var(--zk-color-surface)` | sliding panel fill |
| `--zk-drawer-border-color` | `var(--zk-color-outline-variant)` | header bottom divider |
| `--zk-drawer-elevation` | `var(--zk-elevation-3)` | panel shadow (static — every direction, not mode-driven) |
| `--zk-drawer-header-fg` | `var(--zk-color-on-surface)` | header title text |
| `--zk-drawer-close-hover-bg` | `var(--zk-color-surface-container)` | close-button hover fill |

## Recipe — adding a component

Validated by the button pilot; repeat per component (then update the
[progress tracker](../component-theme-variables-progress.md)):

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

- **Shipped**: button, input (textbox family), window, grid, listbox, tree, panel, groupbox,
  combobox, datebox, timebox, spinner (+ doublespinner), bandbox, daterangebox, timepicker, tab (tabbox), menu,
  avatar/avatar-group, chip (base hoisted; see caveat), badge (base hoisted; see caveat), rating,
  progressmeter, paging, combobutton, selectbox, inputgroup, calendar, toolbar, slider, checkbox
  (default mold only — see entry for the switch/toggle-mold and radio/radiogroup exclusions),
  messagebox (see entry for the CTV-3 structural exception), notification (untyped/default card
  only — see entry for the info/warning/error type-variant exclusion), toast (info-default
  variant only — see entry for the warning/error type-variant exclusion), a (anchor), chosenbox,
  cascader, searchbox, drawer (see entry for the CTV-3 structural exception — whole-root
  reparenting on open).
- **Not exposed** (by design): purely structural/layout components (box, div, cell, separator,
  layouts) and content atoms (label, image) have no meaningful appearance knob — this excludes
  the anchor/link, which **is** exposed despite its similarly minimal text-only vocabulary (see
  the A entry above); radio/radiogroup and checkbox's switch/toggle molds are candidates for a
  future pass if adopter demand appears — add via the Recipe above. rangeslider (PE) /
  multislider (EE) are out of scope for this pass (see the Slider entry above) but are natural
  follow-on candidates given the shared `--zk-slider-*` vocabulary.
