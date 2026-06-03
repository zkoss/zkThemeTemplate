# combobox

Like bandbox, but the dropdown contains structured `<comboitem>` children rather than freeform content.

## DOM structure

```
.z-combobox                       (root span — Type B: border lives on the child input)
├─ input.z-combobox-input         (the text field with border)
└─ a.z-combobox-button            (the dropdown arrow)
```

Popup (rendered in `<body>`, not inside `.z-combobox`):

```
.z-combobox-popup
└─ ul.z-combobox-content
   └─ li.z-comboitem
      └─ .z-comboitem-content
         (selected item gets .z-comboitem-selected on the li)
```

## Border location: child input, not root

Combobox is the **Type B** inplace pattern: the border lives on `.z-combobox-input`, not on the root. The root may still carry `background-color`. When clearing styles for inplace, clear both root background AND child border/background. See `reference/inplace-state.md`.

## Split-border with the button

Visually the input and button look like one rectangle. CSS implements this by giving:

- `.z-combobox-input`: left + top + bottom borders (and left half of radius)
- `.z-combobox-button`: right border (and right half of radius)

This avoids the double-border that would result from bordering each child fully. When the focus state changes the border, both elements must be updated together.

## `buttonVisible="false"`

`.z-combobox-disabled` on the button element. Same pattern as bandbox.

## Comboitem variants

Comboitems can render with:

- **Plain**: `<comboitem label="Item 1"/>`
- **Description**: `<comboitem label="..." description="..."/>` → renders the description on a second line
- **Icon**: `<comboitem label="..." iconSclass="z-icon-..."/>` → renders an icon before the label

The icon class is whatever the developer sets in `iconSclass` (any class is allowed, conventionally a `z-icon-*` from ZK's icon set).

## State classes

- `.z-combobox-disabled` on root
- `[readonly]` on the inner input
- `.z-combobox-invalid` (sclass)
- `.z-combobox-inplace` on root when inplace + unfocused
- `.z-combobox-open` on root when popup is open

## Bundle

`combo.css.dsp`. See `reference/css-file-bundling.md`.
