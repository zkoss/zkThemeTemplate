# errorbox

`zul.inp.Errorbox` — the inline validation tooltip ZK pops next to an input when a constraint fails.

## Served CSS lives in the inp bundle, not the obvious `errorbox.css`

Errorbox styles are duplicated in two source files:

- `js/zul/wgt/css/errorbox.css` → `errorbox.css.dsp`
- `js/zul/inp/css/input.css`     → `input.css.dsp`  ← **this is the one the widget actually loads**

`Errorbox` is a `zul.inp.*` widget, so its styling is served from the **inp** bundle (`input.css.dsp`). Editing only `wgt/css/errorbox.css` changes nothing visible. Always fix `inp/css/input.css` (and keep the wgt copy in sync so they don't diverge). Verify against the served `target/.../js/zul/inp/css/input.css.dsp`.

## The pointer arrow must NOT be hidden with stylesheet `display:none`

ZK reveals the arrow in `Errorbox._fixarrow` with:

```js
jq(pointer).show();
```

jQuery `.show()` only **clears an inline `display`** value — it cannot beat a stylesheet rule `.z-errorbox-pointer { display: none }`. So if the theme hides the pointer via a stylesheet, the arrow is **permanently invisible** even though ZK positions it correctly.

Correct base: keep the pointer `display: block`. With all four `border` sides `transparent`, the 0×0 triangle is invisible anyway; ZK adds a direction class (`z-errorbox-up|down|left|right`) which colours **one** side into a visible beak. Colour it with the error border colour (not the faint `error-container`) so it reads against a light page.

`_fixarrow` sets the pointer's inline `top/left/right/bottom` (e.g. `bottom:-4px` for a down arrow) and node padding per direction — the theme only supplies `display`, `border` size, and colour.

## DOM structure

```
<div class="z-errorbox">                      (display:table; ZK positions it as a floating popup)
  <div class="z-errorbox-pointer z-errorbox-<dir>"/>   (the beak; keep display:block)
  <i   class="z-errorbox-icon z-icon-exclamation-triangle"/>  (absolute, left edge of content)
  <div class="z-errorbox-content" title="…">message</div>
  <div class="z-errorbox-close"><i class="z-errorbox-icon z-icon-times"/></div>  (if closable)
```

The warning `<i>` is absolutely positioned over the content's left padding; leave enough `content` left-padding (≥ icon-left + icon-width + gap) so the text never collides with it.

## Forcing a live errorbox for verification

Synthetic typing + Tab is unreliable in automation (focus juggling). Drive it through the widget instead:

```js
var w = zk.Widget.$(document.querySelector('input.z-textbox'));
w.focus(); w.setValue('x'); w.setValue(''); w.fireOnChange({});  // → z-textbox-invalid + errorbox
```

## Bundle

`input.css.dsp` (authoritative); mirror in `errorbox.css.dsp`.
