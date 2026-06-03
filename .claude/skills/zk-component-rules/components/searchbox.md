# searchbox

A trigger that opens a popup for searching and selecting items from a model-backed list. Supports single or multi-select. Looks like a chip-style input when closed; opens a search-and-pick popup when clicked.

## Edition: EE only

Lives in `zkmax.jar` (`org.zkoss.zkmax.zul.Searchbox`). Not available in CE or PE. See `reference/edition-availability.md`.

## NOT a textbox

Common mistake: writing CSS as if `<searchbox>` is a `<textbox>` with a built-in search button. It is **not**. The visible widget is a **read-only trigger** that displays selected labels; users do not type in it directly. The actual text input lives **inside the popup** and only exists while the popup is open.

If you style `.z-searchbox` as `display: flex; <input>: flex: 1`, the selected label, two icons, and the popup wrapper will lay out incorrectly — there is no top-level input to flex around.

## DOM structure (from mold/searchbox.js + Searchbox.ts `_redrawpp`)

```
.z-searchbox[.z-searchbox-disabled][.z-searchbox-open][.z-searchbox-focus]   ← root <div>, tabindex
├─ .z-searchbox-label          <div>  ← selected text (comma-joined for multi-select); hidden when no selection
├─ .z-searchbox-placeholder    <div>  ← shown when no selection (display:inline-block / none)
├─ .z-searchbox-icon .z-searchbox-clear .z-icon-times    <i>  ← clear button (toggled visible by JS when there is a selection)
├─ .z-searchbox-icon .z-icon-caret-down                  <i>  ← dropdown indicator
└─ .z-searchbox-popup .z-searchbox-shadow                <div id="…-pp">
    ├─ .z-searchbox-search        <input type="text" placeholder="…">  ← actual search field
    └─ .z-searchbox-cave          <ul>
        └─ .z-searchbox-item[.z-searchbox-selected][.z-searchbox-active]   <li> (one per model item)
            ├─ .z-searchbox-item-check  <i>   ← checkbox-style icon (only when multiple="true")
            └─ rendered content (raw HTML from <template name="model">; may contain <i class="z-icon-…">)
```

`.z-searchbox-search` is the input the user types into; the **placeholder** of that input is set from `searchMessage` (default `"Type to search"`), independent of the trigger's `placeholder`.

## States ZK emits on the root

| State | Class / mechanism |
|-------|-------------------|
| disabled | `[disabled]` attribute **and** `.z-searchbox-disabled` class — toggle both in CSS |
| open | `.z-searchbox-open` (added/removed in `open()` / `close()`) |
| focused | `.z-searchbox-focus` (added/removed in `_focusinContent` / `_focusoutContent`) |

`.z-searchbox-item`:

| State | Class |
|-------|-------|
| selected | `.z-searchbox-selected` — toggled in `_doSelectItem` |
| keyboard-active (highlighted by arrow keys) | `.z-searchbox-active` — moved by `_shiftSelection` |

There is no `readonly` / `invalid` / `inplace` for searchbox.

## Popup detachment

`.z-searchbox-popup` follows the standard ZK floating-popup rule — `open()` calls `zkpp.makeVParent()` which re-parents the popup to `<body>`, plus inline `min-width` is set to `node.offsetWidth` to match trigger width. Apply `reference/floating-popup-in-body.md`:

- Do **not** put `width: 100%` / `max-width: 100%` / `min-width: 100%` on `.z-searchbox-popup` — those resolve against `<body>`.
- The trigger's width is propagated as `style="min-width: Npx"` on the popup root; you can give the popup a larger `width` or let `min-width` win.

## Clear icon visibility is JS-controlled

`Searchbox.ts` `_toggleClearButtonVisible()` uses `jq(...).toggle(visible)` which directly sets `display: inline-block` or `display: none` as **inline style**. CSS rules like `.z-searchbox-clear { display: none }` are overridden by inline style and have no effect once `bind_` runs.

You can style its **appearance** freely (color / hover / position) but not its visibility — that is bound to whether the selection is non-empty.

## Multiple-select uses an `<i>`, not a real `<input type=checkbox>`

When `multiple="true"`, each item gets a leading `<i class="z-searchbox-item-check">`. There is no native checkbox. The check-mark glyph must come from the theme — typically a CSS mask on `::before` keyed off `.z-searchbox-selected .z-searchbox-item-check`. The `<i>` reserves its own space whether selected or not; only the glyph changes on selection.

For single-select (`multiple="false"`), the `<i class="z-searchbox-item-check">` is **not rendered** — items only have content. Don't reserve space for a check column in single-select mode (use a descendant selector under `.z-searchbox-popup` that doesn't depend on the icon's presence).

## How to tell if `multiple` is on at CSS time

Searchbox does **not** add a `.z-searchbox-multiple` class. The only DOM tell is the presence of `.z-searchbox-item-check` inside items. If you need a mode-specific rule, use `:has()`:

```css
.z-searchbox-popup:has(.z-searchbox-item-check) .z-searchbox-cave { … }
```

Or rely on the item-check element existing/not existing.

## Keyboard model

Captured in `Searchbox.ts` `doKeyDown_`:

| Key | Action |
|-----|--------|
| Esc | close popup |
| Tab | close popup |
| Enter | select currently-active item (shift+Enter = bulk select since last) |
| Backspace / Delete (when closed) | clear selection |
| Arrow Up/Down | open popup if closed, else move `.z-searchbox-active` |
| PageUp / PageDown | ±30 items |
| Home / End | first / last visible item |

The active item is **not** scrolled into view by CSS — JS calls `scrollIntoView({block: 'nearest'})`. The `.z-searchbox-active` class is purely for highlighting (background tint).

## Bundle

`searchbox.css.dsp` in zkmax — its own bundle, not part of `input.css.dsp` (despite the path containing `zkmax/inp/`).

## Related components

- **combobox** (CE) — single-select, displays open list. Use when items are short and don't need filtering.
- **bandbox** (CE) — generic popup attached to a textbox; you build the popup contents yourself.
- **chosenbox** (EE) — chip-style multi-select, items appear inside the trigger as removable chips. Different visual model than searchbox.
- **cascader** (EE) — hierarchical multi-level picker.

Searchbox is the right choice when:
- The dataset is large (hundreds of items) and needs in-popup filtering
- Multi-select with a checkbox column is desired
- The trigger should show selected labels comma-joined, not as chips
