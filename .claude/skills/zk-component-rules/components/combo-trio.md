# datebox + timebox + spinner (the combo trio)

These three composite input components share an identical DOM pattern. Anything true for one applies to the others, unless explicitly noted.

## Shared DOM structure

```
.z-{datebox|timebox|spinner}                  (root span — Type A bordered wrapper)
├─ input.z-{c}-input                          (the text field)
└─ a.z-{c}-button                             (calendar / clock / arrow button)
```

`doublespinner` follows the same pattern as `spinner` with a different value type.

## Border location: root

These are **Type A** for inplace. The border lives on the root `<span>`. See `reference/inplace-state.md`.

## `buttonVisible="false"`

Standard pattern: `.z-{c}-disabled` class is added to the button element (`.z-{c}-button.z-{c}-disabled`). See `reference/buttonVisible-attribute.md`.

## Focus

Use `:focus-within` on the root. The actual focus target is the inner input. See `reference/focus-vs-focus-within.md`.

## Inplace + no-button combination

datebox / timebox / spinner / doublespinner **all support** the combination `buttonVisible="false"` + `inplace="true"`. Preview pages must show a real component here, not `—`.

## Spinner button positioning

Spinner buttons are rendered to the right of the input. When `buttonVisible="false"`, the up/down arrow buttons are hidden but the input remains editable; the user can still type a value or use keyboard arrow keys.

## Bundle

All four (`datebox`, `timebox`, `spinner`, `doublespinner`) live in `combo.css.dsp` alongside combobox and bandbox. A single CSS edit affects all six components. See `reference/css-file-bundling.md`.

## Data model (for preview pages)

To show a meaningful inplace value, the page needs a sample value:

```xml
<zscript><![CDATA[
java.util.Date sampleDate = new java.util.Date(125, 0, 15);
java.util.Date sampleTime = new java.util.Date(0, 0, 1, 10, 30, 0);
]]></zscript>
<datebox inplace="true" value="${sampleDate}"/>
<timebox inplace="true" value="${sampleTime}"/>
<spinner inplace="true" value="5"/>
<doublespinner inplace="true" value="3.5"/>
```

Without a value, inplace inputs render blank — not useful for visual verification.
