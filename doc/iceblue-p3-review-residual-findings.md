# P3 收工複審 —— 尚未套用的發現(來源清單)

> **這份檔案的存在理由。** P3 收工複審一共產出 120 條發現,其中 **65 條 `comment-placement`
> 加 1 條 `token-clarity`(`@{zprefix}`)** 已經隨 L2.4 清理待辦第 1–4、6 項套用完畢
> (見〈L3-A 閘門紀錄〉#32)。剩下的 **54 條**還沒動 —— 而它們原本只存在於一次性的
> 工作目錄裡,那個目錄一消失清單就找不回來。所以在消耗掉前半部的同一顆 commit 裡,
> 把後半部的原文搬進 repo。

**發現內容一律保留英文原文**(複審 agent 寫的),不翻譯 —— 翻譯會讓引用的選擇器與敘述失真。

**行號是複審當時的行號**(P3 收工、L2.4 套用之前)。第 1–4、6 項已經讓這些檔案的行號位移,
所以**定位請用選擇器,不要用行號**。需要當時的來源樹用 `git show d6a48ef:<path>`。

| kind | 條數 | 歸屬 |
|---|---|---|
| `duplicate-declaration` | 14 | **L2.4 第 7 項** —— G-delta,會改宣告數,等 P4 |
| `token-clarity` | 5 | 尚未立項 —— 全部是「加一行註解說明刻意的 token 復用」,G-zero |
| `readability` | 35 | 尚未立項 —— 建議併進 P4/P5 的逐檔複審,不另開階段 |

> **`token-clarity` 這 5 條為什麼沒有跟著這次一起做。** 它們是**新增**註解,不是把放錯位置的
> 註解搬回去 —— 跟 L2.4 第 1–4、6 項不是同一件事。要做隨時可以做(G-zero),
> 但要先確認「幫刻意的 token 復用寫說明」是不是這個分支想承擔的範圍。

---

## `duplicate-declaration`(14 條)

### `js/zkex/menu/css/fisheye.css`:22

- **問題**:Same mixin-expansion noise, twice in one block: `.borderRadius()` emitted `-webkit-/-moz-/-o-/-ms-border-radius` (L22-25) before `border-radius` (L26), and `.boxShadow()` emitted `-webkit-/-moz-/-o-/-ms-box-shadow: 0 2px 4px 0 rgba(0,0,0,0.16)` (L30-33) before `box-shadow` (L34). 8 of the 20 declarations in `.z-fisheye-text` are inert; `-o-`/`-ms-` variants of both properties never existed.
- **建議**:Keep only `border-radius: var(--zk-base-border-radius);` and `box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16);`, dropping L22-25 and L30-33. (Changes the output declaration count, so non-blocking.)

### `js/zkmax/inp/css/searchbox.css`:203

- **問題**:`.z-searchbox-item.z-searchbox-selected > .z-searchbox-item-check` declares `font-size` twice: line 198 `font-size: inherit;` (from the icon-font mixin expansion) then line 203 `font-size: var(--zk-searchbox-popup-item-check-size);`. Later wins, so line 198 is pure noise.
- **建議**:Delete line 198 `font-size: inherit;`. Also consider a `/* icon font setup */` marker above line 195 so the nine boilerplate icon declarations read as one unit. Changes the declaration count — non-blocking follow-up.

### `js/zkmax/layout/css/goldenlayout.css`:485

- **問題**:`.z-goldenlayout .lm_header .lm_tab .lm_close_tab` (block at 478) declares `line-height` twice: line 485 `line-height: 1;` (from the expanded `.baseIconFont()` mixin) and line 492 `line-height: normal;` (the author's override). Later wins, so harmless, but the block now looks self-contradictory.
- **建議**:Delete line 485 (`line-height: 1;`), keeping `line-height: normal;`.

### `js/zkmax/layout/css/goldenlayout.css`:502

- **問題**:`.z-goldenlayout .lm_header .lm_controls > li` (block at 500) declares two properties twice, both from `.baseIconFont()` followed by explicit overrides: `display: inline-block;` (502) vs `display: block;` (511), and `line-height: 1;` (507) vs `line-height: var(--zk-golden-layout-font-size);` (512).
- **建議**:Delete lines 502 and 507.

### `js/zkmax/layout/css/goldenlayout.css`:545

- **問題**:`.z-goldenlayout .lm_splitter.lm_horizontal:after` (block at 540) declares `font-size` twice: line 545 `font-size: inherit;` (from `.baseIconFont()`) and line 552 `font-size: 10px;`.
- **建議**:Delete line 545.

### `js/zkmax/layout/css/goldenlayout.css`:562

- **問題**:`.z-goldenlayout .lm_splitter.lm_vertical:after` (block at 557) declares `font-size` twice: line 562 `font-size: inherit;` (from `.baseIconFont()`) and line 569 `font-size: 10px;`. Same pattern as the horizontal splitter.
- **建議**:Delete line 562.

### `js/zkmax/med/css/camera.css`:24

- **問題**:`.z-camera-recording, .z-camera-stop, .z-camera-pause` declares `font-size` twice: line 19 `font-size: inherit;` then line 24 `font-size: 36px;`. The first came from the expanded `.baseIconFont()` mixin, the second was the LESS author's override on the next line. Only the 36px wins.
- **建議**:Delete line 19 (`font-size: inherit;`). NOTE: this reduces the block's declaration count, so the gate will flag it — land it as a post-gate cleanup.

### `js/zkmax/nav/css/nav.css`:323

- **問題**:`.z-nav-popup` declares `padding` twice — line 320 `padding: 0;` (from the expanded `.restUl()` mixin) and line 323 `padding: var(--zk-nav-popup-padding);`. Harmless (later wins) but a maintainer editing line 320 will see no effect.
- **建議**:Delete line 320 `padding: 0;`. Note this drops the output declaration count by 1, so the cssdiff baseline needs regenerating.

### `js/zkmax/wgt/css/signature.css`:64

- **問題**:`.z-signature-tool-button-icon` declares `font-size` twice: line 59 `font-size: inherit;` (icon-font mixin expansion) then line 64 `font-size: var(--zk-signature-toolbar-button-icon-font-size);`. Identical defect at the same line numbers in the byte-identical copy `src/main/resources/web/js/zkmax/signature/css/signature.css`.
- **建議**:Delete line 59 in both files. Changes the declaration count — non-blocking follow-up.

### `js/zul/inp/css/combo.css`:20

- **問題**:The `.borderRadius()` / `.boxShadow()` / `.transform()` mixins expanded into 5 copies of the same value per use, e.g. lines 20-24 `-webkit-border-radius: var(--zk-base-border-radius); -moz-border-radius: ...; -o-border-radius: ...; -ms-border-radius: ...; border-radius: ...`. combo.css has 68 vendor-prefixed declaration lines, 32 of them `-o-border-radius` / `-ms-border-radius` / `-o-box-shadow` / `-ms-box-shadow`, which never existed in any browser and are dead bytes; `-webkit-`/`-moz-border-radius` have been unnecessary since ~2012 and the project targets modern browsers only. Slice-wide: 104 prefixed lines, 50 never-existed.
- **建議**:Drop the `-o-`/`-ms-` border-radius and box-shadow lines (pure dead code) and ideally the `-webkit-`/`-moz-` ones too, keeping the unprefixed declaration. Changes the declaration count, so non-blocking follow-up -- but this is the single largest source of compiler-output noise in the slice.

### `js/zul/inp/css/combo.css`:986

- **問題**:`.z-comboitem` receives `font-size: var(--zk-combo-popup-item-size);` twice: once from the group rule at 962-967 (`.z-comboitem, .z-comboitem-button { font-size: var(--zk-combo-popup-item-size); ... }`) and again at 986-993 (`.z-comboitem, .z-comboitem a, .z-comboitem a:visited { font-size: var(--zk-combo-popup-item-size); ... }`). Same value, so harmless, but a maintainer changing one will miss the other. Pre-existing in the LESS.
- **建議**:Drop the `font-size` from the 986 rule and let the 962 group rule own it (the anchors inherit it), or drop `.z-comboitem` from the 986 selector list.

### `js/zul/tab/css/tabbox.css`:162

- **問題**:`.z-tabbox-right > .z-tabs` is emitted twice with contradictory values: line 161 `.z-tabbox-right > .z-tabs { float: left; }` then line 194 `.z-tabbox-right > .z-tabs { float: right; }`. Same for `.z-tabbox-right > .z-tabs .z-tabs-space` — `float: left` on line 170, `float: right` on line 198. This is residue of the deleted `.verticalStyle()` mixin (which hardcoded `float: left`) followed by the right-specific override; in the LESS the mixin-then-override reading was obvious, in flat CSS it is a bare contradiction 33 lines apart that a maintainer will read as a bug.
- **建議**:Delete the dead `float: left;` on lines 162 and 170, and fold the surviving `float: right` rules (lines 194-196, 197-199) into the earlier blocks at 161 and 167 so each selector appears once. (Changes the output declaration count, so non-blocking.)

### `js/zul/wgt/css/caption.css`:46

- **問題**:Expansion of the LESS `.boxShadow('none')` mixin left four dead siblings ahead of the real declaration: `-webkit-box-shadow: none; -moz-box-shadow: none; -o-box-shadow: none; -ms-box-shadow: none; box-shadow: none;` (L46-50). `-o-box-shadow` and `-ms-box-shadow` never existed as properties in any shipped browser, and `-webkit-`/`-moz-` are unnecessary for the supported matrix. 4 of the block's 7 declarations are inert.
- **建議**:Keep only `box-shadow: none;`. (Changes the output declaration count, so non-blocking.)

### `js/zul/wgt/css/popup.css`:345

- **問題**:`.z-toast-position-middle-center` declares `transform` three times and `-ms-transform` three times: `transform: translateY(-50%)` (347), `transform: translateX(-50%)` (350), `transform: translate(-50%, -50%)` (352), and the same triple for `-ms-transform` (348/351/353). Only the last pair survives; the first four declarations are dead. Origin is the LESS `.middle(); .center();` mixin pair followed by an explicit override — nothing an author would write by hand in plain CSS.
- **建議**:Delete lines 347, 348, 350, 351. Keep `top: 50%; left: 50%; transform: translate(-50%, -50%); -ms-transform: translate(-50%, -50%);`. (Changes the declaration count, so land it after the gate.)

---

## `token-clarity`(5 條)

### `js/zkex/slider/css/rangeslider.css`:98

- **問題**:The vertical rules consume `*-horizontal-*` tokens on the swapped axis and now read like a copy-paste bug with no LESS layer left to explain it: `.z-rangeslider-vertical .z-sliderbuttons-button { margin-top: var(--zk-rangeslider-horizontal-button-margin-left); margin-left: var(--zk-rangeslider-horizontal-button-margin-top); }` (98-99), and `.z-rangeslider-vertical .z-rangeslider-mark-dot { left: var(--zk-rangeslider-horizontal-mark-dot-position-top); }` (117), same at 121. The reuse is deliberate and pre-existing (identical in rangeslider.less, and repeated in zkmax/slider/css/multislider.css:109-110), so this is not a conversion regression — but nothing in the file says so.
- **建議**:Add one comment above line 97, e.g. `/* vertical deliberately reuses the horizontal margin/offset tokens with the axes swapped — no separate vertical tokens exist */`. No rename (prohibition 3).

### `js/zkmax/layout/css/goldenlayout.css`:444

- **問題**:`--zk-golden-layout-selected-border-color` is never used for a border: it drives text colour on the active tab (line 444 `color: var(--zk-golden-layout-selected-border-color);`) and the background of the 2px active-tab underline (line 462 and 637 `background: var(--zk-golden-layout-selected-border-color);`). A reader cannot tell whether that is deliberate or a copy-paste. NOTE this is pre-existing, not conversion-introduced: the .less variable was the identically-named `@goldenLayoutSelectedBorderColor`.
- **建議**:Add a comment at the first use, e.g. `/* selected-border-color also serves as the active-tab text colour and underline fill */`. No rename (prohibited).

### `js/zkmax/slider/css/multislider.css`:109

- **問題**:`.z-multislider-vertical .z-sliderbuttons-button` reads `margin-top: var(--zk-rangeslider-horizontal-button-margin-left); margin-left: var(--zk-rangeslider-horizontal-button-margin-top);` -- a *horizontal* token pair, deliberately crossed, inside the *vertical* rule; line 128 likewise uses `left: var(--zk-rangeslider-horizontal-mark-label-position-top);`. The whole file also borrows `--zk-rangeslider-*` for `.z-multislider-*` (lines 26, 81-89, 99, 114-117). I confirmed this is verbatim from multislider.less (`@rangesliderHorizontalButtonMarginLeft`), so it is not a conversion regression -- but with the name-forwarding layer gone, the raw name is all a reader gets and it looks like a copy-paste bug.
- **建議**:Add a comment above line 108, e.g. `/* multislider reuses the rangeslider metrics; the vertical orientation swaps the two axes on purpose */`. No rename (out of scope).

### `js/zul/sel/css/listbox.css`:259

- **問題**:`.z-listitem-checkable { … left: var(--zk-listheader-checked-position-left); }` — and the same token again at line 392 inside `.z-listgroup-checkable`. In the LESS these three sites were one `.checkable()` call, so a *listheader*-named variable inside a listitem rule was self-explanatory; with the mixin gone it reads as a copy-paste mistake in two of the three places.
- **建議**:Add a one-line comment at lines 259 and 392, e.g. `/* shared checkable offset — token is named for listheader but is intentionally shared by all three */`. (No rename — token names are out of scope for this branch.)

### `js/zul/sel/css/tree.css`:86

- **問題**:`background-image: url(${c:encodeThemeURL("~./zul/img/misc/progress-72.gif")});` — the LESS was `.encodeThemeURL(background-image, @loadingAnimationLoad)`, where `@loadingAnimationLoad` was a single shared definition in `_zkvariables.less:410` used by three call sites. The conversion inlined it, so the path is now literal in three separate files (this line, `js/zul/sel/css/listbox.css:95`, `js/zul/grid/css/grid.css:98`) with nothing tying them together; swapping the loading GIF now means finding three files instead of one.
- **建議**:Add above line 85: `/* shared ROD loading animation - the same asset is inlined in js/zul/sel/css/listbox.css and js/zul/grid/css/grid.css; keep the three in sync */`. Re-introducing a token is excluded by plan §0, so a comment is the fix on this branch.

---

## `readability`(35 條)

### `js/zkmax/big/css/biglistbox.css`:14

- **問題**:The file (and every file in this slice) has zero blank lines: 531 lines of back-to-back rule blocks. Combined with the flattened selectors this reads as compiler output — e.g. the six near-identical disabled-state blocks at 484-531 differ only in selector and are visually indistinguishable from each other.
- **建議**:Insert one blank line between top-level rule groups, at minimum before lines 14, 32, 79, 110, 131, 147, 199, 203, 350, 480, 484. Blank lines and comments are not declarations, so this is gate-neutral.

### `js/zkmax/big/css/biglistbox.css`:328

- **問題**:`background: contrast(var(--zk-base-background-color));` (also line 458). `contrast()` is a LESS colour function, not CSS — the LESS compiler could not evaluate it because its argument is a `var()` reference, so it passed the text through and browsers drop the declaration. VERIFIED PRE-EXISTING, NOT a conversion defect: `baseline/js/zkmax/big/css/biglistbox.css.dsp` contains the identical `background:contrast(var(--zk-base-background-color))`. Flagging only because in plain CSS it now looks like a real (dead) CSS function with no hint of its LESS origin.
- **建議**:Add `/* dead: contrast() is a LESS fn, unevaluated because the arg is a var() — declaration is dropped by browsers. Pre-existing; see also line 458 */`. Changing the value is a rendering change and out of scope for this branch.

### `js/zkmax/inp/css/cascader.css`:1

- **問題**:142 lines, zero comments and zero blank lines, covering three distinct concerns with no signposting: the closed control (1-79), the popup surface (80-97) and the popup panes/items (98-142).
- **建議**:Add three section headers, e.g. `/* --- closed control --- */` above line 1, `/* --- popup surface --- */` above line 80, `/* --- popup panes and items --- */` above line 98.

### `js/zkmax/inp/css/cascader.css`:41

- **問題**:`.z-cascader-label` (41-55) and `.z-cascader-placeholder` (56-71) are two 15/16-line blocks that share 12 byte-identical declarations (user-select, width, height, padding, padding-right, vertical-align, line-height, font-family, font-size, overflow, white-space, text-overflow); they differ only in `display: inline-block` vs `display: none` plus the extra `color` on placeholder. Authored that way in the .less, but as maintained source it is a classic drift trap — change the label padding and the placeholder silently disagrees.
- **建議**:Emit the shared 12 declarations once under `.z-cascader-label, .z-cascader-placeholder { ... }`, then two small blocks for the differences. Changes the declaration count, so batch with other non-blocking cleanup.

### `js/zkmax/inp/css/searchbox.css`:36

- **問題**:Dead rule with an invalid selector: `.z-searchbox[disabled]-icon { color: var(--zk-searchbox-disable-icon-color); }`. `-icon` after an attribute selector is not a valid compound-selector component, so every browser drops the rule. It came from a LESS authoring bug (`&[disabled] { … &-icon { … } }`) and is present in `baseline/js/zkmax/inp/css/searchbox.css.dsp`, so the gate passes — but the plain-CSS form is what finally makes it visible, and the working equivalent is right below it at line 39 (`.z-searchbox[disabled] .z-searchbox-icon`).
- **建議**:Delete lines 36-38. This changes the output declaration count by one, so land it as a follow-up commit after the gate is green (or record it as accepted drift).

### `js/zkmax/inp/css/tbeditor.css`:1

- **問題**:693 lines with zero blank lines (`grep -c '^[[:space:]]*$'` = 0; same for the sibling's 714 lines). It reads as compiler output: 60+ consecutive top-level rules with no visual grouping, and only four section comments (L11, L256 `Modal box`, L421 `Fullscreen`, L556 `Dark theme`) for the whole file. Large unlabelled regions: button pane L123-222, dropdown L223-255, fullscreen/reset-css L453-555.
- **建議**:Insert a blank line before each existing section comment (L256, L421, L556) and add headers + a preceding blank line at L123 `/* Button pane */`, L223 `/* Dropdown */`, L411 `/* Overlay */`, L471 `/* resetCss option */`. Mirror at L275/L440/L577 and L140/L242/L430/L492 in the sibling file.

### `js/zkmax/inp/css/timepicker.css`:6

- **問題**:180 lines, 0 blank lines, and the only section header in the file is `/* Shadow */` at 173 -- the four natural groups run together with nothing between them.
- **建議**:Insert a blank line plus a header before line 6 (`/* input */`), line 57 (`/* trigger button */`), line 125 (`/* popup option */`) and line 148 (`/* popup */`).

### `js/zkmax/layout/css/goldenlayout.css`:17

- **問題**:There is not a single blank line in any of the six files in this slice (verified: goldenlayout 686 lines / 0 blank, cascader 142/0, combobutton 113/0, rowlayout 25/0, sliderbuttons 16/0). The deleted .less files used blank lines between rules. This is the single biggest reason these read as compiler output rather than source: 686 consecutive lines with no visual grouping.
- **建議**:Insert one blank line between top-level rules (and between logical groups of descendant rules) in all six files. This is a whitespace-only change and cannot alter the gate result.

### `js/zkmax/layout/css/goldenlayout.css`:175

- **問題**:`.lm_stack.lm_docked > .lm_items { *z-index: 3; ... }` — an IE7 star hack, i.e. an intentionally invalid declaration that every supported browser discards. Faithful to the .less, but in a hand-maintained .css file a reader will stop and wonder whether it is a typo.
- **建議**:Delete line 175 (changes the declaration count, so batch it with the vendor-prefix cleanup).

### `js/zkmax/layout/css/goldenlayout.css`:370

- **問題**:The file is two very different things concatenated: lines 17-369 are the unbranded upstream goldenlayout.js library CSS (`.lm_*` only, no tokens, includes a literal `background: orange` at line 51), and lines 370-686 are the IceBlue skin (`.z-goldenlayout*`, all tokenized). The only marker at the seam is a one-line `/* z-goldenlayout */`, visually identical to the 20 other one-line comments in the file, while a real banner style already exists at 307 (`/*********** Drag Proxy ***********/`).
- **建議**:Replace line 370 with a banner in the existing style, e.g. `/***********************************
* IceBlue skin (.z-goldenlayout)
***********************************/`, and add a matching banner above line 17 marking the upstream base layer.

### `js/zkmax/layout/css/goldenlayout.css`:374

- **問題**:Mixin expansion left large runs of vendor prefixes that never existed in any browser, e.g. lines 374-378 `-webkit-border-radius / -moz-border-radius / -o-border-radius / -ms-border-radius / border-radius`, and the same 5-line shape for box-sizing and box-shadow. Counted 56 such prefixed lines in goldenlayout.css, 12 in combobutton.css (lines 6-15, 60-64), 4 in rowlayout.css (15-18). `-o-` and `-ms-` for border-radius/box-shadow/box-sizing are pure dead weight, and they inflate a 1-line intent to 5 lines about 20 times in this file alone.
- **建議**:One repo-wide decision, not per file: drop `-o-*` and `-ms-*` for border-radius/box-shadow/box-sizing everywhere (and probably `-webkit-`/`-moz-` too, per the modern-browser support policy). Changes the declaration count, so it needs its own commit and a re-baseline.

### `js/zkmax/layout/css/goldenlayout.css`:481

- **問題**:The 9-declaration `.baseIconFont()` expansion (`display: inline-block; font-family: ZK85Icons, FontAwesome; font-style/weight/size; line-height: 1; -webkit-font-smoothing; -moz-osx-font-smoothing; text-rendering`) is now copied verbatim four times, at 481-488, 503-510, 542-549 and 559-566, with nothing marking it as one shared idiom. A maintainer changing the icon font must find and edit all four, and three of the four are the source of the duplicate-declaration findings above.
- **建議**:Add `/* icon font base */` above each of the four expansions so the shared idiom is greppable (declaration-neutral), or fold the four selectors into one shared rule list if a follow-up commit is allowed to change the declaration count.

### `js/zkmax/layout/css/organigram.css`:4

- **問題**:91 lines, 0 blank lines, 0 comments. The connector-line rules in particular (`.z-orgchildren:not(:only-child) > .z-orgitem:after` at 7, `.z-orgitem:not(:only-child)::before` at 21, `.z-orgnode:not(:only-child)::after` at 84) are non-obvious tree-line drawing spread across the file with nothing tying them together.
- **建議**:Insert a blank line plus a header before line 4 (`/* children row + connector lines */`), line 15 (`/* item */`) and line 58 (`/* node */`).

### `js/zkmax/layout/css/rowlayout.css`:3

- **問題**:`.z-rowlayout { width: 100%; *zoom: 1; }` — IE7 star hack (hasLayout trigger), an invalid declaration in every supported browser. Same class of dead code as goldenlayout.css:175.
- **建議**:Delete line 3 (changes the declaration count; batch with the vendor-prefix cleanup).

### `js/zkmax/med/css/cropper.css`:1

- **問題**:This file and `src/main/resources/web/js/zkmax/cropper/css/cropper.css` are byte-identical (both md5 a8f3e221d74cea79a35465199e282204, 229 lines). Confirmed PRE-EXISTING, not conversion damage: the two source `.less` files were already byte-identical (verified by diff of `<commit>^:.../med/less/cropper.less` vs `.../cropper/less/cropper.less`). They were converted by two separate commits (0b1bff2, 32b0c6d). Now that these are hand-maintained sources, an edit to one will silently diverge from the other.
- **建議**:Add a one-line header comment to each file cross-referencing the other, e.g. `/* Keep in sync with js/zkmax/cropper/css/cropper.css (byte-identical copy) */`. Applies to BOTH files.

### `js/zkmax/nav/css/nav.css`:225

- **問題**:The file carries only three section headers (`/* Navbar */`, `/* Nav and Navitem */`, `/* Collapsed */`); lines 225-366 are ~140 unlabelled lines covering the collapsed-item text popup, the shared vertical/popup item chrome, and `.z-nav-popup` itself.
- **建議**:Insert `/* Nav popup */` above line 225 and `/* Shared: vertical navbar + popup items */` above line 269.

### `js/zkmax/slider/css/multislider.css`:28

- **問題**:154 lines, 0 blank lines, 0 comments. The LESS made the structure obvious through nesting (`&-horizontal`, `&-vertical`, `&-disabled`); flat CSS with no separators loses it entirely.
- **建議**:Insert a blank line plus a header before line 28 (`/* slider buttons */`), line 74 (`/* horizontal */`), line 102 (`/* vertical */`) and line 131 (`/* disabled */`).

### `js/zkmax/tbeditor/css/tbeditor.css`:11

- **問題**:CRLF residue: seven single-line `//` comments were rewritten into two-line block comments whose closing `*/` lands at column 0, breaking indentation inside rule bodies — e.g. L33-36 `.z-tbeditor-box {` / `\t/* Potix: style modified` / ` */` / `\tdisplay: flex;`. Sites: L11-12, L34-35, L43-44, L53-54, L59-60, L180-181, L194-195. Root cause: this .less was CRLF while the identical inp/.less was LF (verified with od), so the CR forced the line break; the .css itself is now LF-only, so nothing prevents collapsing them.
- **建議**:Collapse each of the seven to one line at the surrounding indentation, e.g. `\t/* Potix: style modified */`.

### `js/zkmax/tbeditor/css/tbeditor.css`:114

- **問題**:`.trumbowyg-editor-box { padding: 0; }` is the one selector in the file using the upstream `trumbowyg-` prefix instead of `z-tbeditor-`; ZK renders `z-tbeditor-*`, so this rule matches nothing. It is a missing `@{zprefix}` interpolation in the original .less (93f4d13^ tbeditor.less:101), i.e. PRE-EXISTING and not caused by the conversion — but it is now plainly visible dead code sitting in the middle of the z-prefixed rules. Flagging only: renaming it to `.z-tbeditor-editor-box` would change rendering (that element currently keeps the 20px padding from L66-77) and is out of scope for this branch.
- **建議**:

### `js/zkmax/wgt/css/stepbar.css`:95

- **問題**:183 lines, 35 rules, zero comments and zero blank lines — the worst-reading file in the slice. The LESS's four top-level groups (`.z-stepbar`, `.z-step`, `.z-stepbar-wrapped-label`, `.z-stepbar.z-stepbar-vertical`) are now indistinguishable: the wrapped-label group silently begins at line 95 and the vertical group at line 165. A reader scanning for the vertical variant has no landmark.
- **建議**:Insert a blank line plus a header above each group boundary: `/* step */` above line 11 `.z-step {`, `/* wrapped label */` above line 95 `.z-stepbar-wrapped-label .z-step {`, `/* vertical */` above line 165 `.z-stepbar.z-stepbar-vertical {`.

### `js/zul/box/css/box.css`:62

- **問題**:After un-nesting, everything from L31 to L126 lives under one `/* Splitter */` header with no blank lines, and the orientation blocks are interleaved with state blocks (`.z-splitter-button-disabled` L53-61, then horizontal L62-87, vertical L88-114, then `:hover` L115-120 and modifiers L121-126 far from `.z-splitter` at L41). Hard to see where one group ends.
- **建議**:Insert a blank line plus `/* Splitter - horizontal */` before L62, `/* Splitter - vertical */` before L88, and `/* Splitter - states */` before L115.

### `js/zul/grid/css/grid.css`:18

- **問題**:The `.resetTable()` mixin expanded verbatim three times — lines 18-28, 36-46 and 64-74 are three byte-identical 11-line groups differing only in the `.z-grid-header` / `.z-grid-body` / `.z-grid-footer` prefix. Reads as compiler output and forces a three-way edit.
- **建議**:Collapse to three grouped rules, e.g. `.z-grid-header table, .z-grid-body table, .z-grid-footer table { border-spacing: 0 }` plus the `th, td` and `th` variants. Reduces declarations 15 -> 5, so the baseline needs regenerating.

### `js/zul/grid/css/grid.css`:226

- **問題**:Adjacent rules with byte-identical bodies: `.z-grid-autopaging .z-row-content, .z-grid-autopaging .z-groupfoot-content` (226-232) and `.z-grid-autopaging .z-group-content` (233-238) both declare the same four `--zk-mesh-auto-paging-row-*` values. Duplicated in grid.less too, so pre-existing.
- **建議**:Merge into one selector list of three. Reduces declarations 8 -> 4, so the baseline needs regenerating.

### `js/zul/inp/css/combo.css`:1

- **問題**:Lines 1-822 are six byte-identical 137-line clones (combobox@1, bandbox@138, datebox@275, timebox@412, spinner@549, doublespinner@686) with no blank line, no section header, and no hint that they are the same block six times. I diffed the six clones after stripping comments and substituting the component token: 0 differing lines, 129 vs 129 -- the expansion is perfectly mechanical, so a collapse to native selector lists is a pure text transform. Measured: the region is 144 rules / 474 declarations; collapsed it is 24 rules / 79 declarations (file total 586 -> 191 declarations, -67%; 1064 -> ~530 lines, -50%).
- **建議**:Collapse the region to 24 rules whose selectors are 6-item comma lists (e.g. `.z-combobox, .z-bandbox, .z-datebox, .z-timebox, .z-spinner, .z-doublespinner { ... }`). Cascade is safe: no element can ever match two different clones' selectors, so grouping cannot reorder anything, and the tail rules at 823+ still come last. If the collapse is deferred, at minimum insert a blank line plus `/* ===== combobox ===== */` etc. before lines 1, 138, 275, 412, 549, 686, `/* ===== cross-component overrides ===== */` before 823, and `/* ===== spinner-family buttons ===== */` before 859.

### `js/zul/inp/css/combo.css`:890

- **問題**:A 9-selector cross product spanning lines 890-898 (`.z-timebox-disabled .z-timebox-button > a, .z-timebox-disabled .z-spinner-button > a, .z-timebox-disabled .z-doublespinner-button > a, .z-spinner-disabled ...` x3, `.z-doublespinner-disabled ...` x3). Only the 3 self-consistent pairs are reachable; the other 6 pair one component's disabled wrapper with another component's button, which cannot co-occur in ZK's DOM. In the LESS this was a 3-selector nested `&` reference, so the reader never saw the cross product.
- **建議**:Reduce to the 3 reachable selectors. That drops 6 selectors from the output, so it is follow-up work rather than a gate-neutral edit -- if it must stay, add a one-line comment saying the cross product is a mixin artifact and only the matching pairs occur.

### `js/zul/layout/css/borderlayout.css`:138

- **問題**:LESS cross-product expansion produced three 25-selector rules (lines 138-164, 165-189, 192-216) and one 16-selector rule (316-331) full of impossible combinations, e.g. `.z-north-slide > .z-south-collapsed` and `.z-east-splitter:hover .z-west-splitter-button`. Verified identical in borderlayout.less (`&-slide > &-collapsed` under a five-selector parent group), so this is pre-existing bloat — but it is now source a human reads, and 100 of the ~106 selectors are dead.
- **建議**:Narrow each list to the self-matching pairs: `.z-north-slide > .z-north-collapsed, .z-south-slide > .z-south-collapsed, …` (5 selectors instead of 25) and `.z-east-splitter:hover .z-east-splitter-button, …` (4 instead of 16). Behaviour-neutral but must be verified against the live app before regenerating the baseline.

### `js/zul/menu/css/menu.css`:133

- **問題**:372 lines, zero blank lines, and the vanished mixins left large unmarked clones: the `.disabledStyle()` body appears verbatim at 133-147 and 254-268, the `.contentStyle()` pair at 118-122 / 123-127 / 128-132 / 185-188 / 189-192 / 249-253 / 304-310, and the `restUl()` reset at 10-23 / 60-70 / 228-240. Nothing tells the reader these are the same intent, so they invite being edited one at a time.
- **建議**:Blank line before each top-level section comment (193, 311, 327, 366) and before each top-level rule group; add a marker above the two disabled-state clones, e.g. `/* disabled menu item (same shape as menupopup's, line 254) */`.

### `js/zul/mesh/css/paging.css`:136

- **問題**:`.z-paging-os` on line 136 starts the whole `os` (outer-mold) variant section — 21 lines that re-tune list spacing and button padding — but follows `.z-paging-info` with no blank line and no marker, so the mold switch is invisible. It was a separate top-level block in the LESS.
- **建議**:Insert a blank line and `/* 'os' mold */` above line 136.

### `js/zul/sel/css/listbox.css`:97

- **問題**:495 lines with zero blank lines, so the seven top-level section headers that do exist (`/* listhead */` 97, `/* Group */` 352, `/* content */` 418, `/* paging */` 456, `/* column menu */` 473, `/* select mold */` 486, `/* hidden header */` 491) are visually indistinguishable from the rule stream. It reads as compiler output rather than source.
- **建議**:Insert one blank line before each of lines 97, 352, 418, 456, 473, 486, 491 (and before line 4 `.z-listbox`). Ideally fix in `scripts/less2css.js` so it applies corpus-wide — see notes.

### `js/zul/sel/css/tree.css`:245

- **問題**:Lines 245/248/251 are three ~250-character `box-shadow` declarations expanded from the parameterised LESS mixin `.treeitemFocusBorder(@left, @right)`. Two of the four inset layers in the base rule are inert no-ops: `inset 0 0 0 0 var(--zk-mesh-cell-focus-box-shadow-color), inset 0 0 0 0 var(--zk-mesh-cell-focus-box-shadow-color)`. Nothing left in the source explains that they are placeholders which `:first-child` (2px left) and `:last-child` (2px right) fill in.
- **建議**:Add above line 244: `/* focus ring: 2px top+bottom always; the two zero-width inset layers are placeholders that :first-child fills on the left edge and :last-child on the right */`. Do not delete the zero layers — that changes declaration values and would fail the gate.

### `js/zul/tab/css/tabbox.css`:103

- **問題**:Lines 103-135 (`.z-tabbox-left …`) and lines 161-193 (`.z-tabbox-right …`) are a verbatim, rule-for-rule duplication of the former `.verticalStyle()` mixin — nine rules each, identical apart from the `-left`/`-right` prefix. Nothing in the file records that they are one shared style and must be edited in lockstep. Compounding it, each orientation's rules for the same selector are split across the file (e.g. `.z-tabbox-left > .z-tabs .z-tab` at line 114 and again at line 136; `.z-tabbox-right > .z-tabs .z-tab` at 172 and 200).
- **建議**:Either merge the two selector lists where the declarations are identical (e.g. `.z-tabbox-left > .z-tabs .z-tabs-content, .z-tabbox-right > .z-tabs .z-tabs-content { display: block; }`), or, if the flat 1:1 layout is preferred, add a comment at line 103 and line 161: `/* shared vertical (left/right) style — was .verticalStyle(); keep both orientations in sync */`.

### `js/zul/wgt/css/popup.css`:1

- **問題**:374 lines covering three unrelated widgets (popup, notification, toast) with zero blank lines anywhere in the file. The existing `/* notification */` (28) and `/* Toast */` (209) headers are visually indistinguishable from body text because nothing separates them from the preceding rule's `}`. This is the worst instance of a repo-wide pattern (see notes).
- **建議**:Insert a blank line before each existing section header — lines 28, 107, 114, 140, 166, 209 — and before `.z-toast-position {` (308). Purely additive whitespace, gate-neutral.

### `js/zul/wgt/css/progressmeter.css`:10

- **問題**:Line 10 `background-image: url(${c:encodeThemeURL("~./zul/img/misc/prgmeter-anim.gif")});` was `.setBackgroundImage(@progressmeterBackgroundImage)` in the LESS — a guarded mixin (`.setBackgroundImage('') {}` / `when (default())`) whose whole point was that setting the variable to the empty string suppressed the declaration entirely. The emitted CSS is identical for the shipped value (so the gate is correct), but the themeable hook and the fact that this URL used to be a variable are now invisible. This is the only guard-mixin site in the slice.
- **建議**:Add `/* was @progressmeterBackgroundImage (guarded mixin: empty value suppressed this declaration) */` above line 10, so a maintainer knows to override the rule rather than look for a variable.

### `js/zul/wnd/css/panel.css`:23

- **問題**:133 lines, 0 blank lines, 0 comments -- every rule is flush against the next, so the head/body/icons/drag-ghost groups are indistinguishable.
- **建議**:Insert a blank line plus a header before line 23 (`/* header */`), line 41 (`/* body */`), line 55 (`/* header icons */`), line 80 (`/* resize + move ghost */`) and line 128 (`/* panelchildren */`).

### `js/zul/wnd/css/window.css`:130

- **問題**:Two unrelated components share this file with no marker between them: `.z-window*` runs lines 1-129 and `.z-messagebox*` starts abruptly at line 130 with no blank line or header. In the LESS they were two separate top-level blocks, so the boundary was obvious.
- **建議**:Insert a blank line plus `/* messagebox */` above line 130.
