# `!important` decision table (Planner output)

Authoritative CSS-aware count (comments stripped): **37 real `!important` across 21 files**.
Source of truth: `scratchpad/count-important.js`. ZK dependency = **10.3.0.1-jakarta**; runtime oracle = preview app; default-theme oracle = `temp/iceblue_c-10.3.0.1/`.

Categories: **A** oracle/layer-removable · **B** overrides ZK-JS inline style (no cascade beats inline → keep) · **C** accessibility (keep) · **D** same-layer / ZK-core-unlayered conflict · **E** investigate.
Verdict is a *hypothesis* until the Evaluator proves it against the running 10.3.0.1 app.

| # | file:line | declaration | cat | hypothesis | rationale / what it fights |
|---|-----------|-------------|-----|-----------|-----------------------------|
| 1 | colorbox.css:124 | `display:none` | E→A | **REMOVE** (mobile-UA test) | 10.3 `Colorbox.closePopup()/onHide()` set inline `display:none` before `undoVParent()`; the 10.2.1 comment justifying `!important` is stale. iceblue uses plain `display:none`. |
| 2 | splitlayout.css:171 | `margin-top:0` | B | keep | JS `setBtnPos_` writes inline margin; CSS owns long axis (transform-centering). |
| 3 | splitlayout.css:185 | `margin-left:0` | B | keep | same as #2 (other axis). |
| 4 | borderlayout.css:418 | `width:auto` | B | keep | JS sets inline width while rotating E/W title 90°. |
| 5 | panel.css:151 | `height:auto` | B | keep | collapse must beat inline `height="Xpx"` from ZUL attr. |
| 6 | groupbox.css:113 | `height:auto` | B | keep | same as #5. |
| 7–10 | _motion.css:64–67 | anim/transition/scroll resets | C | **keep** | `prefers-reduced-motion` universal reset; must override every duration. a11y (WCAG 2.3.3). |
| 11–14 | tbeditor.css:156–159 | `height:1px;min-height:0;padding:0;opacity:0` | B/E | keep-verify | hides raw textarea when WYSIWYG editor visible; likely beats inline `height` attr. Verify. |
| 15–18 | tablet/_wheel.css:43–47 | `position:fixed;inset;width;transform` | B | keep (mobile) | pins wheel picker to viewport; beats ZK JS inline `top` (`_fixedVParent`). tablet CSS is unlayered by design. |
| 19–22 | tablet/_inputs.css:105–109 | same 4 | B | keep (mobile) | same as #15–18 for input popups. |
| 23 | separator.css:43 | `width:1px` | B | keep | ZK writes widget `spacing` as inline `width`; force hairline. |
| 24 | toolbar.css:128 | `width:auto` | B/E | keep-verify | separator-as-flex-spacer; fights inline spacing width. Verify. |
| 25 | input.css:255 | `padding:var(--zk-errorbox-beak)` | B | keep | ZK writes one-sided inline padding per beak direction; symmetric override. |
| 26 | errorbox.css:34 | `padding:var(--zk-errorbox-beak)` | B | keep | duplicate of #25 (note: possible dedup, out of scope). |
| 27 | cropper.css:147 | `width:1px` | B/E | keep-verify | crosshair vline; likely inline. Verify. |
| 28 | cropper.css:155 | `height:1px` | B/E | keep-verify | crosshair hline. Verify. |
| 29 | biglistbox.css:188 | `display:block` | B | keep-verify | hidden measurement span; likely inline display toggle. |
| 30 | goldenlayout.css:52 | `cursor:move` | D | **keep** | `.lm_dragging *` must override every descendant's own cursor during drag; iceblue uses `!important` here too. |
| 31 | misc.css:145 | `top:0` | B | keep | `zk/utl.ts progressbox()` writes inline `top:Ypx` on `.z-modal-mask`. |
| 32 | misc.css:146 | `left:0` | B | keep | same as #31. |
| 33 | menu.css:428 | `margin:var(--zk-spacing-1) 0` | D | keep-verify | fights ZK-core (unlayered) `ul>li{margin:0}` — if truly unlayered, `!important` required. Sibling rule L422 already uses specificity. Verify whether L422 alone suffices. |
| 34 | messagebox.css:131 | `display:flex` | D/E | **verify** | overrides hlayout display default. Check inline vs same-layer. |
| 35 | messagebox.css:144 | `margin-left:0` | D/E | **verify** | undoes hlayout `> *` margin-left stacking. Check inline vs same-layer. |
| 36 | progressmeter.css:24 | `display:block` | A/E | **verify** | `.z-progressmeter-image` is a `<span>` (default inline). Check if any real rule fights `display:block` without `!important`. |
| 37 | box.css:227 | `background:var(--zk-color-primary)` | E | **verify** | `.z-splitter-ghost` drag ghost. Check competing background. |

## Removal / verify candidates (empirical loop targets)
Ordered lowest-risk first: **#36 progressmeter**, **#34–35 messagebox**, **#33 menu**, **#24 toolbar**, **#37 box ghost**, **#1 colorbox** (mobile behavioral), then keep-verify batch (#11–14 tbeditor, #27–28 cropper, #29 biglistbox).

Everything else (B/C with explicit inline-override or a11y rationale) stays; the Evaluator confirms opportunistically via computed-style A/B but they are not removal targets.

## Verdicts (resolved — see doc/spec/important-inventory.md)
- **REMOVED (4, proven byte-identical on 10.3.0.1):** #36 progressmeter, #34 messagebox `display:flex`, #35 messagebox `margin-left`, #33 menu separator margin. Guards: `screenshot.spec.ts › important-removal-guards`.
- **#1 colorbox → KEEP (empirically load-bearing):** removing `!important` makes the reattached popup compute `display:block`/visible after dismiss on the mobile UA (ZK leaves inline `display:block`). Already guarded by `tablet.spec.ts › tablet-colorbox-dismiss`. Stale "10.2.1" comment corrected. My source-based "removable" hypothesis was wrong for the shipped 10.3 runtime — the empirical test caught it.
- **#11–14 tbeditor → KEEP:** textarea carries inline `height:0px`; `height:1px !important` overrides it (inline override).
- **#24 toolbar, #27–28 cropper, #29 biglistbox, #37 box-ghost → KEEP:** guard inline-spacing / drag / EE states not reproducible in the headless preview → kept under the conservative bar.
- All other B/C/D rows: kept as triaged (inline override, a11y, or legit same-layer).

Result: **37 → 33**.
