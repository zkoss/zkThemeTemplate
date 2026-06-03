# button

A standard `<button>` element wrapped by ZK's `.z-button` class. Also rendered by `toolbarbutton`, `combobutton`, and (with different classes) inside `panel` / `window` title bars.

## `orient="vertical"` DOM quirk

When `orient="vertical"` is set, ZK does **not** add a class. Instead, it inserts a `<br/>` element between the icon and the label inside the button:

```html
<button class="z-button">
  <i class="z-icon-..."></i>
  <br/>                          <!-- the only marker that orient is vertical -->
  Label
</button>
```

To style vertical buttons, use the `:has()` selector:

```css
.z-button:has(br) {
    flex-direction: column;
    gap: 2px;
    /* hide the <br/> itself */
}
.z-button:has(br) br {
    display: none;
}
```

No `.z-button-vertical` class exists. The `:has()` selector is the only reliable way.

## State classes

- `.z-button-disabled` on root for `disabled="true"`
- Hover / focus / active rely on pseudo-classes (`:hover`, `:focus-visible`, `:active`) on the rendered `<button>` element. The root IS the button, so `:focus` (not `:focus-within`) works.

## Icon support

`iconSclass="z-icon-..."` adds an `<i>` element with that class before the label. The icon and label sit inside the button as siblings.

`image="url"` adds an `<img class="z-button-image">` element before the label instead.

## Bundle

`button.css.dsp` — one-to-one mapping.

## Related buttons

- **toolbarbutton** — lives in `footer.css.dsp` (despite the file name). Inherits much from button but adds `.z-toolbarbutton-*` classes.
- **combobutton** — has its own quirk; see `components/combobutton.md`.
