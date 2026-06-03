# checkbox

Three molds rendered by the same component: default checkbox, switch, toggle.

## Three molds

| Mold | Markup | Visual |
|------|--------|--------|
| (default) | `<checkbox label="..."/>` | Square box with checkmark |
| switch | `<checkbox mold="switch" label="..."/>` | iOS-style on/off switch |
| toggle | `<checkbox mold="toggle" label="..."/>` | Binary toggle button (looks like a pressed/unpressed button) |

The mold adds `.z-checkbox-{mold}` to the root. Default mold gets no mold modifier.

## State classes are **mold-prefixed**

This is a non-intuitive ZK choice:

- `.z-checkbox-disabled` ✓ (default mold)
- `.z-checkbox-switch-on` ✓ (switch when checked)
- `.z-checkbox-switch-disabled` ✓
- `.z-checkbox-toggle-off` ✓ (toggle when unchecked)
- `.z-checkbox-toggle-on` ✓
- `.z-checkbox-on` ✗ (does not exist — checked state for default mold lives on the inner `<input>`'s `checked` attribute)

When writing CSS for switch / toggle, **always include the mold in the state class**.

## Checked state for default mold

The default mold's checked state comes from `:checked` on the inner `<input type="checkbox">`, not from a class:

```css
.z-checkbox input:checked + .z-checkbox-content::before {
    /* checkmark styles */
}
```

(The exact selector depends on the DOM rendered by the version; check `doc/component-dom-structures.md`.)

For switch and toggle, the on/off state IS class-based: `.z-checkbox-switch-on` / `.z-checkbox-switch-off` etc.

## DOM structure (default mold)

```
.z-checkbox
├─ input.z-checkbox-input[type="checkbox"]   (hidden native input)
├─ .z-checkbox-mold                          (the visual indicator box)
└─ .z-checkbox-content                       (the label text)
```

## Radio is similar but uses on/off classes

`<radio>` always emits `.z-radio-on` / `.z-radio-off` (no inner-input `:checked` reliance), and `<radiogroup>` holds them.

## Bundle

`checkbox.css.dsp` for checkbox; `radio.css.dsp` for radio.
