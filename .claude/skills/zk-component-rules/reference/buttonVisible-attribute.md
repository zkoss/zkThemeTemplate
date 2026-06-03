# buttonVisible attribute

The `buttonVisible="false"` attribute hides the auxiliary button (calendar icon, dropdown arrow, spin arrows) of an input component while keeping the input itself functional.

## Which components support it

Only input components that ship with a built-in auxiliary button:

- **combobox** — hides the dropdown arrow
- **bandbox** — hides the band button
- **datebox** — hides the calendar icon
- **timebox** — hides the clock icon
- **spinner / doublespinner** — hides the up/down arrows

**Not supported on**: textbox, intbox, longbox, decimalbox, doublebox, passwordbox, selectbox, searchbox, chosenbox, cascader, colorbox, slider, rating.

## Where ZK puts the resulting class

`buttonVisible="false"` adds `.z-{component}-disabled` to the **button element**, not to the root:

```html
<!-- buttonVisible="false" -->
<span class="z-bandbox">
  <input class="z-bandbox-input" />
  <a class="z-bandbox-button z-bandbox-disabled">...</a>  <!-- class on the button -->
</span>
```

Therefore the selector is:

```css
.z-bandbox-button.z-bandbox-disabled { display: none; }
```

**Not**: `.z-bandbox.z-bandbox-no-button` or `.z-bandbox[buttonVisible]` — those do not exist.

## Combining with other states

`buttonVisible="false"` composes with all other states. The button stays hidden regardless of `disabled`, `readonly`, `invalid`, `inplace`. In preview matrices, the "No button" row + any state column is a valid combination — show a real component, never `—`.

Exception: bandbox + `buttonVisible="false"` + `inplace="true"` is valid and ZK supports it; older preview pages incorrectly showed `—` here. Fix to show a real component.

## Buttons inside the input itself

Do not confuse `buttonVisible` (the auxiliary button) with controls like the spinner's `+/-` keyboard increments — those are not separate DOM elements and have no `buttonVisible` toggle. `buttonVisible="false"` only affects the trailing/leading icon button.

## Required CSS rule — per component, per file

Even though combo-family components bundle into a single `combo.css.dsp`, **each component has its own source CSS file** and a rule in `combobox.css` does NOT cascade to `datebox.css` or `timebox.css`. The hide-button rule must be added explicitly to every component's file:

| Component | File | Required rule |
|-----------|------|---------------|
| combobox | `js/zul/inp/css/combobox.css` | `.z-combobox-button.z-combobox-disabled { display: none; }` |
| bandbox | `js/zul/inp/css/bandbox.css` | `.z-bandbox-button.z-bandbox-disabled { display: none; }` |
| datebox | `js/zul/inp/css/datebox.css` | `.z-datebox-button.z-datebox-disabled { display: none; }` |
| timebox | `js/zul/inp/css/timebox.css` | `.z-timebox-button.z-timebox-disabled { display: none; }` |
| spinner | `js/zul/inp/css/spinner.css` | `.z-spinner-button.z-spinner-disabled { display: none; }` |
| doublespinner | `js/zul/inp/css/spinner.css` (shared with spinner) | `.z-doublespinner-button.z-doublespinner-disabled { display: none; }` |

This rule cannot be derived from MD3 / MUI / Mira reference — those design systems have no `buttonVisible` concept. It must be added based on this skill alone.

## Verification (live DOM, confirmed 2026-05-14)

For all six components above, ZK at runtime DOES add `.z-{c}-disabled` to the button element when `buttonVisible="false"` is set (verified via `getComputedStyle` on each preview page). The class is emitted by:

- mold render path: `redraw_` in `ComboWidget.ts` and `mold/spinner.js` push `$s('disabled')` into the button's class list when `!isButtonVisible`.
- runtime toggle: `RoundUtl.buttonVisible(wgt, v)` in `InputWidget.ts` adds/removes the class on `wgt.$n('btn')` when `setButtonVisible` is called after init.

So the rule above is enough — no JavaScript-side fix needed. If the rule is missing, the button just stays visible.

## Border architecture: split-border vs root-border

Themes choose one of two ways to render the visible border around a composite input + button widget. The choice changes what `buttonVisible="false"` does to the visual border.

### Pattern S — split-border (border lives on input + button)

```
.z-{c}                   ← root, no border
.z-{c}-input             ← border: 1px solid …; border-right: none;
                           border-radius: R 0 0 R
.z-{c}-button            ← border: 1px solid …; border-left: none (or shared)
                           border-radius: 0 R R 0
```

The visible rectangle is the union of two half-bordered elements. When `buttonVisible="false"` hides the button, the right edge is no longer drawn — **theme must restore it on the input**.

ZK provides the hook: the input gets the extra class `.z-{c}-input-full` when `buttonVisible="false"` (emitted by `redraw_` and toggled at runtime by `RoundUtl.buttonVisible`). The theme rule is:

```css
.z-{c}-input.z-{c}-input-full {
    border-right: 1px solid var(--zk-color-outline);    /* or whichever base colour */
    border-radius: var(--zk-shape-input);                /* uniform on all 4 corners */
}
```

If this rule is missing, the input renders with three borders and a square right side — the bug the harness must catch.

### Pattern R — root-border (border lives on the root)

```
.z-{c}                   ← border: 1px solid …; border-radius: R
.z-{c}-input             ← border: none
.z-{c}-button            ← border: none, sits inside the root's painted edge
                           (button may have its own border-radius for the right corners
                           but only as a clip mask, not as the visible component border)
```

The visible border is one continuous rectangle on the root. Hiding the button leaves the root border untouched, so no restoration rule is needed.

### Which components use which pattern (current theme)

| Pattern | Components |
|---------|------------|
| S (split) | combobox |
| R (root) | bandbox, datebox, timebox, spinner, doublespinner |

This split is a *theme implementation choice*, not a ZK fact — a different theme could put all six on Pattern S, or all six on Pattern R. The skill records the two patterns and the hook; the theme records which it uses.

**Implication for `buttonVisible="false"` verification:** for Pattern S components, the No-button check must verify BOTH (1) the button is hidden AND (2) the input still has a 4-side border + uniform corner radius via `.z-{c}-input-full`. For Pattern R components, only check (1).

## Selector traps

`.z-{c}-disabled` is overloaded — ZK uses the *same* class name on **two different elements**:

| Element | When the class appears | Meaning |
|---------|------------------------|---------|
| Root `.z-{c}` | `disabled="true"` on the widget | Component-disabled state |
| Button `.z-{c}-button` | `buttonVisible="false"` | Hide auxiliary button |

Selector pitfalls to avoid:

- ❌ `.z-{c}-disabled { display: none; }` — single-class selector matches **both** the root (disabling the whole input) and the button. Always use the two-class form.
- ❌ `.z-{c}.z-{c}-disabled .z-{c}-button { display: none; }` — only fires when the root is disabled; doesn't hide the button when only `buttonVisible="false"` is set.
- ✅ `.z-{c}-button.z-{c}-disabled { display: none; }` — element + state, fires only on the button element regardless of root state.
