# colorbox

Color picker widget: shows the currently-selected color as a swatch and opens a popup with a gradient picker and/or palette grid.

## Edition: EE only

Lives in `zkex.jar`. Not available in CE. See `reference/edition-availability.md`.

## DOM structure (from mold/colorbox.js)

```
.z-colorbox                            ← root <div>
├─ .z-colorbox-current   <i>           ← swatch; ZK sets inline style="background-color: <selected>"
├─ .z-colorbox-button    <span>        ← trigger area at the corner
│   └─ .z-colorbox-icon
│       .z-icon-caret-down  <i>        ← dropdown indicator
└─ .z-colorbox-popup     <div>         ← popup (only present if picker or palette enabled)
    ├─ .z-colorbox-paletteicon         ← tab toggle for palette view (when both modes enabled)
    ├─ .z-colorbox-pickericon          ← tab toggle for picker view
    ├─ .z-colorpicker                  ← gradient + hue picker (256×256 sprite-based)
    │   ├─ .z-colorpicker-gradient     ← positioned 0,0 256×256
    │   ├─ .z-colorpicker-overlay
    │   ├─ .z-colorpicker-bar          ← hue bar 12×256, hard-coded left:7px
    │   ├─ .z-colorpicker-circle       ← drag handle on gradient
    │   ├─ .z-colorpicker-arrows       ← drag handle on hue bar
    │   ├─ .z-colorpicker-color        ← preview swatch (new vs old color)
    │   ├─ .z-colorpicker-rgb / -hsv / -hex
    │   └─ .z-colorpicker-input        ← numeric inputs
    └─ .z-colorpalette                 ← grid of preset colors
        ├─ .z-colorpalette-head        ← header strip
        ├─ .z-colorpalette-newcolor    ← preview of hovered/selected
        ├─ .z-colorpalette-color       ← each preset cell
        └─ .z-colorpalette-selected    ← currently chosen
```

## Selected color comes from inline style

The currently-selected color is **not** a class — it's set inline on the swatch:

```html
<i id="…-currcolor" class="z-colorbox-current" style="background-color: rgb(24, 77, 198);">&nbsp;</i>
```

If the swatch has zero width/height in CSS, the color is invisible. The theme **must** give `.z-colorbox-current` an explicit size (e.g. `flex: 1` if the root is flex, or `width: 100%; height: 100%` if the root is positioned).

## `.z-icon-caret-down` has no global definition in this theme

The mold hard-codes `class="z-colorbox-icon z-icon-caret-down"` on the indicator `<i>`. Our theme's `_icons.css` defines `z-icon-angle-down` (chevron) but does NOT register `z-icon-caret-down`. Consumers that want a visible chevron must locally set the `--_icon` mask, e.g.:

```css
.z-colorbox-icon {
    --_icon: url("data:image/svg+xml,…chevron-down…");
    background-color: currentColor;
    -webkit-mask-image: var(--_icon);
    mask-image: var(--_icon);
    /* … other mask props inherited from [class*=' z-icon-']::before in _icons.css */
}
```

Combobox does the same thing (see `js/zul/inp/css/combobox.css`'s "Dropdown arrow icon" block). If multiple components need it, a global alias in `_icons.css` would deduplicate — but the local pattern is also valid.

## Popup detachment

`.z-colorbox-popup` follows the standard ZK floating-popup rule — at open time it is appended to `<body>` and given inline `left/top/width`. Apply `reference/floating-popup-in-body.md`:

- Do **not** put `width: 100%` / `min-width: 100%` / `max-width: 100%` on `.z-colorbox-popup` — those resolve against body.
- For the colorbox specifically, the popup is wide (~280–320px for palette, ~480–540px for picker because of the 256×256 gradient + hue + RGB inputs). Don't try to constrain.

## Picker / palette sub-layout is geometry-locked

The colorpicker uses fixed-size bitmap sprites (`colorpicker_gradient.png`, `colorpicker_hue.png`, `colorpicker_select.gif`, `colorpicker_arrows.gif`) at hard-coded pixel positions (top: 0, left: 0, etc. in `colorbox.less` lines 84–204). A theme **cannot** restyle these layouts without breaking the picker — the drag handles' positions are calculated in JavaScript against these exact coordinates.

The theme's freedom is limited to:
- Outer popup chrome: border, border-radius, padding, shadow, background
- Tab-icon (`.z-colorbox-paletteicon`, `.z-colorbox-pickericon`) hover / focus / checked colors
- Input fields inside picker (`.z-colorpicker-input`) — can use theme typography + colors
- Palette cell hover / selected outline

Everything else (gradient size, hue bar size, RGB input layout) must be preserved at the original Sapphire/Breeze geometry. Reference: `/Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web/js/zkex/inp/less/colorbox.less`.

## Tab icons sit on top of palette/picker — must be raised

DOM order inside the popup is:

```
.z-colorbox-popup
├─ .z-colorbox-paletteicon   (absolute, top:8 left:8)
├─ .z-colorbox-pickericon    (absolute, top:8 left:44)
├─ .z-colorpicker            (relative, fills popup)
└─ .z-colorpalette           (relative, fills popup)
```

The icons render **before** `.z-colorpicker` / `.z-colorpalette` in the source order. With `z-index: auto` on everything, the later-in-DOM picker/palette **paints over** the absolute-positioned icons. Visually the icons may still appear (because picker/palette reserve `top: 50px` for them at the local level), but **`elementFromPoint(iconCenter)` returns the picker/palette element**, which means real native clicks land on the picker — and the click handlers bound by `Colorbox.ts` `domListen_(paletteBtn, 'onClick', 'openPalette')` never fire.

Symptom: clicking the tab icons does nothing; `.z-colorpicker` / `.z-colorpalette` inline `style="display: none/block"` never flips. Synthetic `.click()` / `jq.trigger('click')` will toggle correctly because they bypass hit-testing — which makes this trap invisible to naive verification.

**Fix:** give both icons `z-index: 1` (or any explicit value above the siblings):

```css
.z-colorbox-paletteicon,
.z-colorbox-pickericon {
    position: absolute;
    z-index: 1;        /* lift above the later-rendered picker/palette */
    /* ... */
}
```

Verify with `document.elementFromPoint(iconRect.left + iconRect.width/2, iconRect.top + iconRect.height/2)` — must return the icon element itself, not `.z-colorpicker` / `.z-colorpalette`.

## ZK toggles palette/picker via inline `style="display: ..."`, not CSS classes

`Colorbox.ts` `openPalette()` and `openPicker()` set `pp.style.display = 'block' | 'none'` directly. The popup root also gets a `.z-colorpalette-popup` / `.z-colorpicker-popup` class added/removed for theme hooks, but the actual display gate is inline style.

Implication: writing CSS rules like `.z-colorpalette-popup .z-colorpicker { display: none }` is **redundant** (it can't override the inline `display: none` ZK already set), but harmless. The real toggle has already happened by the time CSS runs.

## Bundle

`colorbox.css.dsp` in zkex. No siblings.
