# selectbox

`zul.wgt.Selectbox` renders as a **native HTML `<select>`** element — there is no ZK-managed popup widget.

```html
<select class="z-selectbox" tabindex="0">
  <option ...>Label</option>
  ...
</select>
```

## Implication for theming

The dropdown list that appears when the user clicks the control is the **browser's native `<option>` chooser**. It is controlled by the user agent (OS + browser combo) and is not styleable with CSS:

- No `.z-selectbox-popup` element exists.
- `option:hover`, `option:checked`, `option { padding: ... }` only work in a small subset of browsers (mostly Firefox on Linux), and even there the visual result varies. **Treat the popup as unstylable.**
- You can style the **closed** control (the `<select>` itself): border, padding, custom chevron via `background-image`, etc.

## When the user asks "Can I style the selectbox popup?"

Answer (legacy): **No — selectbox is a native `<select>`. To get a fully styled dropdown, use `combobox`, `bandbox`, or `listbox` (mold="select" or popup) instead.**

**Answer (Chrome 130+ / 2025+):** Yes, via the Customizable Select spec — opt the `<select>` into `appearance: base-select` and the popup becomes addressable through new pseudo-elements:

| Selector | What it styles |
|----------|----------------|
| `select` (with `appearance: base-select`) | trigger surface, can be flex/grid container |
| `::picker(select)` | the popup container (positioned via anchor-positioning) |
| `::picker-icon` | the dropdown arrow inside the trigger |
| `option`, `option:hover`, `option:checked` | individual options inside the popup |
| `option::checkmark` | the spec-provided check marker for the selected option |
| `selectedcontent` | element that mirrors the currently selected option's content |

**Trap — `:open` lives on the `<select>`, not on `::picker`.** `:open` is a pseudo-class on the originating select, never on the picker pseudo-element. Writing `::picker(select):not(:open)` makes the selector match **forever** (the picker never has `:open`), so any `opacity: 0` you put there freezes the popup invisible even when the user opens it.

```css
/* ❌ Wrong — :not(:open) always matches on a picker; popup never appears. */
.z-selectbox::picker(select):not(:open) { opacity: 0; }

/* ✅ Right — chain :open on the select side. */
.z-selectbox::picker(select) { opacity: 0; transform: translateY(-4px); }
.z-selectbox:open::picker(select) { opacity: 1; transform: translateY(0); }
```

Animate the top-layer pop-in with `transition-behavior: allow-discrete` + `@starting-style`:

```css
.z-selectbox::picker(select) {
    transition:
        opacity 200ms, transform 200ms,
        display 200ms allow-discrete, overlay 200ms allow-discrete;
}
@starting-style {
    .z-selectbox:open::picker(select) { opacity: 0; transform: translateY(-4px); }
}
```

**Debugging trap — DevTools falsely reports `:root` vars as "not defined" inside the picker.** When you inspect an `<option>` (or any node) rendered inside `::picker(select)`, the Chrome DevTools *Styles* pane strikes through every `var(--zk-*)` with a "not defined" hint, even though the page defines them on `:root` and renders correctly. The picker is hoisted into the **top layer**, and DevTools' Styles-pane variable resolver fails to walk the flat-tree ancestry back to `:root` for top-layer-hosted content. It is purely a display artifact of the inspector — the rendering engine resolves the tokens fine. Confirm with `getComputedStyle(option).getPropertyValue('--zk-spacing-2')` (returns the real value) before "fixing" anything. **Never hardcode values or re-declare tokens on the option to silence this** — the CSS is already correct.

**Always gate with `@supports (appearance: base-select)`** so non-supporting browsers keep the native fallback. Browsers that don't support it ignore the entire block and fall back to the regular `<select>` styling above.

```css
@supports (appearance: base-select) {
  .z-selectbox, .z-selectbox::picker(select) { appearance: base-select; }
  /* …rest of the popup theme… */
}
```

This is genuinely additive — none of the pre-existing rules need to change, and accessibility (keyboard nav, OS picker on mobile) is preserved by the spec.

## Why ZK uses a native `<select>`

- Accessibility: native popups handle keyboard navigation, screen readers, and mobile native pickers automatically.
- Mobile: tapping a native `<select>` triggers the OS picker (iOS wheel, Android sheet).

This is a deliberate trade-off in `zul.wgt.Selectbox` — it sacrifices visual customization for accessibility and mobile UX.

## `<listbox mold="select">` is the same native control

`zul.sel.Listbox` with `mold="select"` does **not** render the table-based listbox DOM. It renders the identical native control as Selectbox — `<select class="z-select">` with `<option class="z-option">` children. Everything in this file applies (closed control is styleable, popup is the OS chooser unless `appearance: base-select`).

Theming implication: the two controls should look identical, but their CSS bundles are separate (`selectbox.css.dsp` vs `listbox.css.dsp`) and each only loads when its own widget is on the page. So the shared `<select>` styling must be **duplicated** into both `selectbox.css` (targeting `.z-selectbox`) and `listbox.css` (targeting `.z-select`) — you cannot style `.z-select` from `selectbox.css` and expect it to load on a listbox-only page.

## Cross-reference

- For a styled, ZK-managed dropdown: see `combobox.md` / `bandbox.md` / `combo-trio.md`.
