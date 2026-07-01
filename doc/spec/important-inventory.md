# `!important` inventory & irreducibility record

Durable record of every `!important` in the theme CSS source: what it does, whether it was
removed or kept, and the **evidence** for that verdict. Purpose: stop re-investigation — a
survivor here has already been empirically tested against the current ZK runtime.

**Method** (Planner → Generator → Evaluator, see `~/.claude/plans/…` + `tasks/important-decisions.md`):
each candidate's `!important` was deleted, the CSS rebuilt (`npm run build:css`), and the computed
value / behavior re-measured on the running **ZK 10.3.0.1-jakarta** preview app. Removed only when
proven **byte-identical** (empirical-proof bar); otherwise kept, with the failing evidence recorded.
No cascade beats an inline style, so an `!important` that overrides a ZK-JS-set inline `style` is
structurally irreducible.

Count: **37 → 33** (comment-stripped; source of truth `scratchpad/count-important.js`). Date: 2026-07.

## Removed (4) — proven render-neutral, guarded by tests

| file:line | declaration | why it was redundant | guard test |
|-----------|-------------|----------------------|------------|
| `wgt/css/progressmeter.css` | `display: block` | ZK sets inline `width`+`overflow` on `.z-progressmeter-image`, never `display`; our layered rule wins alone. Computed `display` = `block` unchanged. | `screenshot.spec.ts › important-removal-guards › progressmeter …` |
| `wnd/css/messagebox.css` | `.z-messagebox-buttons { display: flex }` | `.z-hlayout` sets no `display`; nothing competes. Row geometry identical (1- & 3-button). | `… › messagebox button row …` |
| `wnd/css/messagebox.css` | `.z-messagebox-buttons > * { margin-left: 0 }` | `.z-hlayout-inner` has no competing margin rule; `margin-left` stays `0px`. | `… › messagebox button row …` |
| `menu/css/menu.css` | `.z-menupopup-content > li.z-menuseparator { margin: … 0 }` | The high-specificity LI-scoped selector (0,2,1) wins over framework `ul>li{margin:0}` by specificity alone on 10.3; margin stays `4px`. | `… › menupopup separator …` |

## Kept — irreducible, with evidence

**Overrides a ZK-JS-set inline `style` (no cascade can beat inline):**
- `zkex/inp/css/colorbox.css` `display:none` — **empirically confirmed load-bearing on 10.3.0.1**: after outside-tap dismiss the reattached popup keeps inline `display:block`; removing `!important` makes it compute `display:block`/visible. Guarded by `tablet.spec.ts › tablet-colorbox-dismiss`. (ZK 10.4 source resets display on close → re-check on upgrade.) Comment was stale ("10.2.1") — corrected.
- `zkmax/tbeditor/css/tbeditor.css` ×4 — the hidden raw textarea carries inline `height:0px`; `height:1px !important` overrides it, and `opacity:0` hides the overlay. Coupled force-hide over an inline style.
- `zkmax/layout/css/splitlayout.css` ×2 (`margin`) — JS `setBtnPos_` writes inline margin.
- `zul/layout/css/borderlayout.css` (`width:auto`) — JS sets inline width on the rotated E/W title.
- `zul/wnd/css/panel.css`, `zul/wgt/css/groupbox.css` (`height:auto`) — collapse beats inline `height="Xpx"` from the ZUL attr.
- `zul/wgt/css/misc.css` ×2 (`top/left:0`) — `zk/utl.ts progressbox()` writes inline `top:Ypx` on `.z-modal-mask`.
- `zul/wgt/css/separator.css` (`width:1px`), `zul/inp/css/input.css` + `zul/wgt/css/errorbox.css` (`padding`) — override ZK inline `width`/one-sided `padding`.
- `zkmax/css/tablet/_wheel.css` ×4, `_inputs.css` ×4 — pin the mobile picker over ZK JS inline `top` (`_fixedVParent`); tablet layer is unlayered by design.
- `zkmax/cropper/css/cropper.css` ×2, `zkmax/big/css/biglistbox.css` — cropper crosshair / hidden measurement span (inline-driven); not reproducible in a headless preview → kept under the conservative bar.

**Accessibility (must override everything):**
- `zul/css/tokens/_motion.css` ×4 — `prefers-reduced-motion` universal reset (WCAG 2.3.3); `1ms` (not `0`) is deliberate.

**Same-layer / cross-framework, legitimately needs `!important`:**
- `zkmax/goldenlayout/css/goldenlayout.css` (`cursor:move`) — `.lm_dragging *` must beat every descendant's own cursor during drag; iceblue uses `!important` here too.
- `zul/wgt/css/toolbar.css` (`width:auto`) — separator-as-flex-spacer must beat a `spacing`-attr inline width; the spaced case isn't in the preview → kept (can't disprove).
- `zul/box/css/box.css` (`.z-splitter-ghost` background) — drag-only element, not reproducible headless → kept.

> When re-running: the survivors above were verified on 10.3.0.1. On a ZK upgrade, re-test the
> inline-override group first (colorbox especially — 10.4 source changes the close path).
