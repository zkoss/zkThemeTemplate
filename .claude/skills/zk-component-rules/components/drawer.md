# drawer

`zkmax.wgt.Drawer` — a sliding overlay panel (EE). `<drawer position="right|left|top|bottom"/>`.

## Closing is gated on a CSS `transitionend` — the theme MUST animate `.z-drawer-real`

This is the single most important fact. ZK's `Drawer.setVisible(false)` does **not** hide the panel directly. It registers a one-shot listener and waits:

```js
jq(real).one('transitionend', () => { super.setVisible(false); zkn.undoVParent(); });
// then it removes the open class:
jq(n).toggleClass(this.$s('open'), false);
```

So the close sequence is: remove `.z-drawer-open` → **a CSS transition on `.z-drawer-real` must fire and complete** → `transitionend` → panel gets `display:none`.

If the theme defines **no transition / no transform change** between open and closed on `.z-drawer-real`, `transitionend` never fires and the drawer **never closes** (it stays `display:block`; mask-click, close button, and `close()` all appear dead). The mask *does* have an `onClick`→`close` handler wired in `bind_` — the bug is never in the handler, it's the missing animation.

Minimum required CSS:

```css
.z-drawer-real { transition: transform <ms> <easing>; }
.z-drawer-right  .z-drawer-real { transform: translateX(100%); }   /* closed */
.z-drawer-left   .z-drawer-real { transform: translateX(-100%); }
.z-drawer-top    .z-drawer-real { transform: translateY(-100%); }
.z-drawer-bottom .z-drawer-real { transform: translateY(100%); }
```

## Open state uses a COMPOUND selector, not a descendant one

When open, ZK adds `z-drawer-open` to the **same root element** that already carries `z-drawer-<position>` (e.g. `class="z-drawer z-drawer-right z-drawer-open"`). The open transform reset must out-specify the per-position closed rule:

```css
/* CORRECT — compound (both classes on root) → specificity (0,2,0)+descendant beats the closed rule */
.z-drawer-open.z-drawer-right .z-drawer-real { transform: none; }

/* WRONG — descendant ties on specificity with `.z-drawer-right .z-drawer-real`
   and loses on source order, leaving the panel stuck off-screen */
.z-drawer-open .z-drawer-real { transform: none; }
```

The stock ZK iceblue theme uses the compound form for exactly this reason.

## DOM structure

```
<aside class="z-drawer z-drawer-<pos> [z-drawer-open]">   (position:fixed, full-viewport)
  <div class="z-drawer-mask [z-drawer-mask-enabled]">     (backdrop; onClick→close)
  <div class="z-drawer-real">                             (the sliding panel — animate THIS)
    <div class="z-drawer-header"><div class="z-drawer-title">
    <div class="z-drawer-close">                          (only if closable=true; onClick→close)
    <div class="z-drawer-container"><div class="z-drawer-cave"> … children …
```

- Closed state is `display:none` on the root (ZK toggles it), so a full-viewport `position:fixed` root is safe.
- `_mask` defaults **true**; the `z-drawer-mask-enabled` modifier is toggled by `setMask`.

## Bundle

`drawer.css.dsp` (source `js/zkmax/wgt/css/drawer.css`).
