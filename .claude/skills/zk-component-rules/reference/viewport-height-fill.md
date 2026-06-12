# Viewport-height fill: use `min-height: 100%` on `body`, never `100vh`

**Rule:** to make the theme background fill the viewport on sparse pages, the base
reset must use `body { min-height: 100% }`, **not** `body { min-height: 100vh }`.

## Why `100vh` is a footgun

`100vh` is the *full* viewport height and is **blind to scrollbars** — it does not
subtract the strip a horizontal scrollbar occupies. So whenever any page has a
horizontal scrollbar (a wide table, a fixed-width grid, an oversized image), the
sequence is:

1. horizontal scrollbar appears → the visible viewport height shrinks by the
   scrollbar thickness (e.g. 835px → 829px);
2. `body { min-height: 100vh }` stays pinned at the full 835px;
3. body (835) now exceeds the visible area (829) → a **spurious vertical
   scrollbar** appears on a page whose content fits well within the viewport.

The page looks "unexpectedly taller" with a vertical scrollbar even though nothing
in the content is that tall. (`100dvh` has the **same** flaw — it accounts for
mobile browser UI chrome, not scrollbars.)

## Why `100%` is correct

`min-height: 100%` resolves against the containing block, which **does** shrink
when a scrollbar appears — so body never exceeds the visible area. The background
still covers the whole viewport via **CSS background propagation**: when `html`
has no background, `body`'s `background-color` is propagated to the canvas and
paints the entire viewport even when body is only as tall as its content.

The click-to-dismiss empty area below short content (so floating popups close on
an outside click) is provided by `html { min-height: 100% }`, which fills the
viewport and receives the click — body does not need to be viewport-tall for that.

## Applies to

Any theme's base reset (`base/_reset.css`). This is theme-agnostic: a Sapphire or
corporate-dark reset would hit the identical bug with `100vh`. First seen on the
colorbox preview page, where the fixed-width preview matrix (`pv/matrix.zul`,
`grid-template-columns: 120px repeat(N,160px)`) overflows narrow/mobile viewports
horizontally and the `100vh` body then added a spurious vertical scrollbar.
