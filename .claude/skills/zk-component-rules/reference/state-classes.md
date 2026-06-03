# State classes: disabled / readonly / invalid

ZK does **not** use a single convention for state. Each component family chooses one of three mechanisms:

## 1. Attribute-based (rare)

The HTML attribute is the selector target. Use `[disabled]` or `[readonly]` directly.

- **slider** (and `multislider`): No `.z-slider-disabled` class is emitted. Style via `.z-slider[disabled]`.
- **rangeslider**: same.
- Native `<input>` elements also expose the attribute, but ZK usually emits a class too — see #2.

## 2. Class-based with `.z-{component}-{state}` suffix

Most components fall here. ZK adds a state class on the root element.

- `.z-checkbox-disabled` — on the root span of checkbox
- `.z-radio-on` / `.z-radio-off` — for radio's checked/unchecked
- `.z-button-disabled` — on button root

**Do not** assume the HTML `disabled` attribute is also present at the selector level you care about — the attribute may be on the inner `<input>`, not on the root the class is on. Always prefer the class selector.

## 3. sclass-based (`-invalid`)

Validation state is **not** automatic. The convention is for the developer to set `sclass="z-{component}-invalid"` on the component when validation fails. The CSS rule looks like:

```css
.z-textbox.z-textbox-invalid { border-color: <error>; color: <error>; }
.z-intbox.z-intbox-invalid    { ... }
.z-datebox.z-datebox-invalid  { ... }
.z-combobox.z-combobox-invalid { ... }
```

These selectors are **stacked** (`.z-textbox.z-textbox-invalid`), not standalone (`.z-textbox-invalid`). The double-class form is necessary because ZK only outputs the class on the root component, and you need both the base class (for layout) and the modifier class (for the invalid colour) to apply.

## Checkbox mold-prefixed state classes

The checkbox component has three molds (`checkbox`, `switch`, `toggle`). State classes are **mold-prefixed**, not bare:

- `.z-checkbox-disabled` ✓ (default mold)
- `.z-checkbox-switch-on` ✓
- `.z-checkbox-toggle-off` ✓
- `.z-checkbox-on` ✗ (never emitted — checked state lives on the inner `<input>`'s `checked` attribute)

When styling non-default molds, never assume the bare class works.

## Readonly visual baseline

Most inputs (textbox, intbox, datebox, timebox, spinner, combobox, bandbox) emit `[readonly]` on the inner `<input>`. The theme convention is to tint the background to distinguish from default (otherwise the user cannot tell readonly from editable). This is a **theme decision** — the rule here is only that the readonly attribute is the selector hook.

## Which components support which state

| Component | disabled | readonly | invalid |
|-----------|----------|----------|---------|
| textbox / intbox / longbox / decimalbox / doublebox / passwordbox | ✓ class | ✓ attr | ✓ sclass |
| combobox | ✓ class | ✓ attr | ✓ sclass |
| bandbox | ✓ class | ✓ attr | ✓ sclass |
| datebox / timebox | ✓ class | ✓ attr | ✓ sclass |
| spinner / doublespinner | ✓ class | ✓ attr | ✓ sclass |
| selectbox | ✓ attr  | — | — |
| searchbox | ✓ attr | — | — |
| chosenbox | ✓ attr  | — | — |
| cascader | ✓ attr  | — | — |
| colorbox | ✓ attr  | — | — |
| slider | ✓ attr | — | — |
| rating | ✓ class | ✓ class | — |
| checkbox (any mold) | ✓ class | — | — |
| radio | ✓ class | — | — |
| button | ✓ class | — | — |

If a state is `—`, the component does **not** support it. Do not add a preview cell or CSS rule for an unsupported combination.
