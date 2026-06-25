# Focus affordance must not change layout

An outlined input's focus ring must be visible **without resizing the field**. If focusing a widget
makes it grow (and blurring shrinks it back), the surrounding layout jitters — a quality bug users
notice immediately. This page records the two correct mechanisms and the one trap.

## The trap: increasing `border-width` on focus

The obvious implementation is "1px border at rest, 2px primary border on focus":

```css
.z-thing { border: 1px solid var(--zk-color-outline); box-sizing: border-box; min-height: 40px; }
.z-thing:focus-within { border-color: var(--zk-color-primary); border-width: 2px; }  /* ← BUG */
```

With `box-sizing: border-box` the 2nd border pixel grows **inward**, shrinking the content box by 2px
on each axis. Whether that shifts layout depends on the structure:

- **Single `<input>` element** (textbox, intbox, …): the content is shorter than the box, so vertical
  is fine, but the box's `width: auto` grows 2px horizontally. → fixable by compensating padding.
- **Composite input** (a flex root wrapping an `<input>` child + an icon/spinner `<button>` child):
  the children are pinned at `min-height` equal to the **rest** content box. When the focus border
  shrinks the content box 2px, the children **cannot** shrink to match → they force the root **2px
  taller**. Padding compensation on the root does nothing here (the growth comes from the children,
  not root padding). Measured live 2026-06-08: timepicker 36→38px, datebox 40→42px on focus.

`outline` is not a fix either — it paints outside the border, reads as a halo (not "the outline
became 2px"), and historically ignored `border-radius`.

## Correct mechanism A — inset box-shadow ring (composite inputs)

Keep the border at **1px** in every state; render the 2nd pixel of the ring as an **inset box-shadow**.
A box-shadow is not a layout box, so nothing shifts. This is the MUI approach (its notched outline is
an absolutely-positioned, non-layout `<fieldset>`).

```css
.z-thing { border: 1px solid var(--zk-color-outline); box-sizing: border-box;
           transition: border-color …, box-shadow …; }
.z-thing:focus-within {
    border-color: var(--zk-color-primary);
    box-shadow: inset 0 0 0 1px var(--zk-color-primary);   /* border stays 1px → no growth */
}
/* invalid + focus: same shape, error colour */
.z-thing.<state>-invalid:focus-within {
    border-color: var(--zk-color-error);
    box-shadow: inset 0 0 0 1px var(--zk-color-error);
}
```

Use **`inset`**, not an outset `0 0 0 1px` ring: an outset ring extends into neighbour space and is
clipped if any ancestor has `overflow: hidden`; the inset ring stays within the element's border box
and is never clipped.

### Caveat: an opaque child background occludes a root inset ring

An inset box-shadow paints **below** the element's children. If any child has an **opaque** background,
it paints over the ring on that child's side — so the ring shows only where children are transparent,
reading thicker on the transparent side. (The 1px border itself stays symmetric — it's in the border
box, outside the children's content box — only the inset 2nd pixel is occluded.)

This bit **timepicker** (caught 2026-06-09): it is the only **always-readonly** composite, so its input
always carries the opaque `surface-container` readonly tint while the button is transparent → the focus
ring looked thicker around the button. The transparent-input siblings (datebox/timebox/bandbox/spinner)
are unaffected and stay on the plain root inset ring above.

When a composite input has an opaque child background, draw the ring on an **always-present `::after`
overlay** that paints *above* the children instead:

```css
.z-thing { position: relative; overflow: hidden; }        /* overlay clips to the rounded shape */
.z-thing::after {
    content: ""; position: absolute; inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px transparent;               /* present but invisible at rest */
    pointer-events: none;                                  /* never intercept clicks */
    transition: box-shadow …;
}
.z-thing:focus-within { border-color: var(--zk-color-primary); }   /* NO box-shadow on the root */
.z-thing:focus-within::after { box-shadow: inset 0 0 0 1px var(--zk-color-primary); }
.z-thing.<state>-invalid:focus-within::after { box-shadow: inset 0 0 0 1px var(--zk-color-error); }
```

The root must keep `box-shadow: none` on focus (the overlay owns the ring), and `position: relative`
+ `overflow: hidden` so the overlay is anchored and rounded-clipped. Because the overlay is a single
element above both children, the ring is uniform by construction. (Measuring the overlay's computed
`box-shadow` requires disabling the **pseudo-element's** transition — `el.style.transition='none'`
does not reach `::after`; inject a `.z-thing::after{transition:none}` rule instead.)

**Applies to (Marble, border on the root):** timepicker, datebox, timebox, bandbox, spinner,
doublespinner. Verified 2026-06-08: all rest-H == focus-H after the change.

**Also applies to `<select>` (selectbox + listbox `mold="select"`) — for a different reason.**
A native `<select>` is **intrinsically sized**: a `rows="1"` trigger sizes to its `min-width`,
a sized `rows>1` list sizes to its rows. With no fixed outer dimension, a 2px focus border has
nothing to grow inward against, so it grows the box outward (both axes). Mechanism B's padding
compensation can absorb the horizontal growth of a single fixed-width input but **not** a sized
list's vertical growth, so use mechanism A here: keep `border: 1px` and draw the ring as
`box-shadow: inset 0 0 0 1px var(--zk-color-primary)`. The `<select>` has no opaque children, so
the plain root inset ring (not the `::after` overlay) is sufficient. Apply to **both** copies —
`.z-select` in `listbox.css` and `.z-selectbox` in `selectbox.css` (caught 2026-06-11).

**Does NOT apply to combobox:** combobox puts the border on its **input/button children** (each
`min-height: 40px`) and leaves the root borderless. A child border growing to 2px (border-box) shrinks
the child's content but the child stays 40px and the borderless root stays 40px → no growth. Combobox
is the structural exception; do not "fix" it.

**Applies to inputgroup — a *group of independently-styled* inputs (caught 2026-06-25).**
`inputgroup` is a flex container whose children (`.z-textbox`, addons, buttons) each carry their own
1px border. The group's own `:focus-within` **outline** already gives a non-shifting ring, so the
boundary is fine — but the single-input focus rule from `input.css` still matches the grouped child
and leaks **mechanism B's padding compensation** (`padding: 0 calc(spacing-3 - 1px)`) onto it. Note
the subtlety: `.z-inputgroup .z-textbox { border: 1px }` and `.z-textbox:focus { border-width: 2px }`
have **equal specificity** (0,2,0), and inputgroup.css loads later, so the *border* stays 1px — but
the `:focus` *padding* (a property the inputgroup base rule never sets) still wins and shrinks the
child ~2px with **no border growth to offset it** → the whole shrink-to-fit group jumps on focus.
Fix: inside the group, neutralize mechanism B on the children — pin `border-width: 1px` and restore
the **rest** padding (`0 spacing-3` for single-line; re-assert `spacing-2 spacing-3` for `textarea`,
or the override wipes its vertical padding). The container's outline owns the affordance. General
rule: **a group of independently-styled inputs must neutralize each child's focus border-width /
padding change inside the group** — the container, not the child, owns the focus ring.

## Correct mechanism B — border-width:2px + padding compensation (single input)

For a lone `<input>` where the border lives on the same element as the text, a real 2px border is fine
**if** you absorb the 1px-per-side growth by shrinking padding by 1px on each compensated axis:

```css
.z-textbox:focus, .z-textbox:focus-visible {
    border-color: var(--zk-color-primary);
    border-width: 2px;
    padding: 0 calc(var(--zk-spacing-3) - 1px);   /* absorb the horizontal growth */
}
textarea.z-textbox:focus { padding: calc(var(--zk-spacing-2) - 1px) calc(var(--zk-spacing-3) - 1px); }
```

This is what `input.css` (textbox/intbox/decimalbox/…) does. It works because a single input has no
min-height-pinned children fighting the content-box shrink. **Do not** copy this onto a composite
input — padding compensation cannot offset child-driven vertical growth there; use mechanism A.

## How the harness should catch a regression

Add an outcome assertion to every outlined-input contract:

> `.z-<comp>` bbox dimensions when `:focus-within` (or `:focus`) **==** dimensions at rest (±0px).

Measure rest geometry, programmatically focus the inner input, force reflow, re-measure. Any non-zero
delta is the layout-shift bug. (When measuring computed `box-shadow`/`border-color`, disable the
element's `transition` first — otherwise you read mid-animation values, not the focus target.)
