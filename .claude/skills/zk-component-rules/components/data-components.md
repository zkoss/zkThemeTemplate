# grid + listbox + tree (the row-based data trio)

Three different components for tabular data, sharing structural conventions.

## Shared structure pattern

| Component | Header | Rows container | Row | Cell |
|-----------|--------|----------------|-----|------|
| grid      | `.z-columns` > `.z-column` | `.z-rows` | `.z-row` | `.z-row` > `.z-cell` |
| listbox   | `.z-listhead` > `.z-listheader` | `.z-listbox-content` | `.z-listitem` | `.z-listcell` |
| tree      | `.z-treecols` > `.z-treecol` | `.z-treechildren` | `.z-treerow` | `.z-treecell` |

## Alternating row classes — use these, not `:nth-child`

ZK emits explicit `-odd` classes:

- `.z-grid-odd` (applied to alternating `.z-row`)
- `.z-listbox-odd` (applied to alternating `.z-listitem`)
- `.z-tree-odd` (applied to alternating `.z-treerow`)

**Always prefer the explicit class** over `:nth-child(odd)`. With virtual scrolling and dynamic row insertion/removal, `:nth-child` selectors break (the DOM position changes but the row's logical position doesn't). The framework-emitted class survives re-renders.

## Cell content wrapper naming

Grid's actual cell-content wrapper is on the **row**, not the cell:

- `.z-row-content` ← grid (intentional — flexbox-flat row layout)
- `.z-listcell-content` ← listbox (per-cell)
- `.z-treecell-content` ← tree (per-cell)

The grid choice is a deliberate departure from the per-cell pattern. The cell elements (`.z-cell`) exist but the content wrapper sits at the row level for grid's flat-row rendering. Don't mistake `.z-cell-content` (does not exist) for the actual class.

## Selection support

| Component | Row selection | Class emitted |
|-----------|---------------|---------------|
| grid      | **No**        | — (never emits `.z-row-selected`) |
| listbox   | Yes           | `.z-listitem-selected` |
| tree      | Yes           | `.z-treerow-selected` |

Grid is for **read-only tabular display** — Grid widget never emits selection-related classes on rows. Writing `.z-row.z-row-selected` rules in `grid.css` is dead code; do not author them. If a use-case needs row selection on a grid-like surface, switch to listbox.

`grep -r "selected" /…/web/js/zul/grid/` returns zero matches against the ZK 10 source — authoritative confirmation.

## Sort state classes

Header cells add sort modifiers when `sort="auto"` or `sort="ascending"/"descending"` is set:

| Widget  | Sort active class   | Sort icon class         |
|---------|---------------------|-------------------------|
| grid    | `.z-column-sort`    | `.z-column-sorticon`    |
| listbox | `.z-listheader-sort`| `.z-listheader-sorticon`|
| tree    | `.z-treecol-sort`   | `.z-treecol-sorticon`   |

## Focus and disabled state classes (listbox + tree)

| Component | Focus class | Disabled class |
|-----------|-------------|----------------|
| listbox | `.z-listitem-focus` | `.z-listitem-disabled` |
| tree | `.z-treerow-focus` | `.z-treerow-disabled` |

Grid rows do not have explicit focus/disabled classes (grid is read-only display — see Selection support section).

## Header action button (`menupopup` trigger)

All three data widgets render a small caret-down button at the right edge of each header cell when `menupopup` is set. **Same pattern, three class names:**

| Widget  | Header cell    | Action button class    | Hover class            |
|---------|----------------|------------------------|------------------------|
| grid    | `.z-column`    | `.z-column-button`     | `.z-column-hover`      |
| listbox | `.z-listheader`| `.z-listheader-button` | `.z-listheader-hover`  |
| tree    | `.z-treecol`   | `.z-treecol-button`    | `.z-treecol-hover`     |

DOM (grid example — the other two are structurally identical):

```
TH.z-column > DIV.z-column-content > DIV.z-column-button > I.z-icon-caret-down
```

Key facts:

- **Only rendered when `menupopup` is set.** No `menupopup` → no `*-button` element exists. Don't write rules that assume it's always there.
- ZK ships it `display: none` by default and toggles `display: block` via the **`.*-hover` class** (added/removed by the header widget's mouseenter/mouseleave). For modern themes prefer the CSS `:hover` state on the header cell — but keep the `.*-hover` class as a fallback selector for legacy JS paths.
- It's `position: absolute` at the right edge of the header cell — the header cell itself must be `position: relative`.
- Pattern: progressive disclosure on hover — invisible until the header cell is hovered, then fades in.
- **The button is nested inside `.z-{c}-content`, NOT a direct child of the header cell.** When using `:has()` to detect a button slot (e.g. reserving right-padding so wrapped header text never collides), use descendant `:has(.z-{c}-button)` — NOT `:has(> .z-{c}-button)`. The direct-child variant never matches.

## Long header text + hover-revealed button → reserve a slot

When a header has an action button slot (`menupopup` set), wrapping long labels with `white-space: normal` (instead of `nowrap + ellipsis`) is the only way to avoid the button overlapping the text on hover. Combine with a right-padding that reserves the button's width:

```css
.z-listheader { white-space: normal; overflow-wrap: anywhere; }
.z-listheader:has(.z-listheader-button) {
    /* spacing-1 (right edge gap) + 24px (button) + spacing-2 (text gap) */
    padding-right: calc(var(--zk-spacing-1) + 24px + var(--zk-spacing-2));
}
```

Same pattern applies to `.z-column` (grid) and `.z-treecol` (tree).

## Narrow checkable column → mirror header AND cell padding

When a `<listheader>` (or `<column>`) is a checkbox-only cell (typically `width="40px"`), the default 16px-each-side padding leaves only 8px of content area — not enough for the 16×16 check icon, which overflows and gets clipped by the cell's `overflow: hidden`.

**Both** the header cell padding **and** the cell-content padding must be collapsed to keep header/cell icons visually aligned and inside the column:

```css
/* Header side */
.z-listheader:has(.z-listheader-checkable) {
    padding-left: var(--zk-spacing-1);
    padding-right: var(--zk-spacing-1);
}
/* Cell side — mirror header. Padding lives on .z-listcell-content, NOT on td. */
.z-listcell:has(.z-listitem-checkable) > .z-listcell-content {
    padding-left: var(--zk-spacing-1);
    padding-right: var(--zk-spacing-1);
}
```

**Trap:** fixing only one side (typical first-pass mistake) leaves the icons offset between header and rows. Always verify with `header.icon.right === cell.icon.right`.

## Focus-trap div (`.z-focus-a`)

SelectWidget (Listbox, Grid via mesh, Tree) renders a hidden focus-trap div at the end of the body:

```html
<div ...-a class="z-focus-a" style="top:0px;left:0px" tabindex="0"></div>
```

ZK calls `focusEl.focus()` after row clicks to keep keyboard navigation working. The inline `top`/`left` are JS-driven (`SelectWidget._focusAnchor`) and ONLY work if `.z-focus-a` finds a positioned ancestor — otherwise `position: absolute` resolves against `<body>` and `focus()` scrolls the entire page to (0, 0).

**Required theme rules** (apply to all three widgets):

```css
.z-listbox-body, .z-tree-body, .z-grid-body {
    position: relative;     /* anchor .z-focus-a inside the body */
}
.z-listbox .z-focus-a,
.z-tree    .z-focus-a,
.z-grid    .z-focus-a {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
}
```

If you skip the `position: relative` on the body element, you get the classic *click-listitem-and-page-jumps-to-top* bug — and it happens silently in production whenever the listbox is scrolled below the fold.

## Auxhead / auxheader (multi-level header rows)

ZK-only multi-row header (no native HTML equivalent). DOM:

```
TR.z-auxhead > TH.z-auxheader (with colspan="N")
TR.z-auxhead > TH.z-auxhead-bar   (scrollbar spacer when sizing)
```

Key facts:

- `<auxhead>` can be placed **above or below** `<columns>` — both positions are valid.
- `colspan` is the only mechanism for grouping; cells under a multi-cell auxheader still emit independently.
- `.z-auxheader.z-frozen-col` is applied to the auxheader cell that aligns with a frozen pane.
- Themes that hide the regular column-header background need to give the auxhead row some visual marker (tonal band, stronger divider, or typographic shift) or the multi-level structure won't read. Aim for hierarchy: auxhead-row > column-header > body-row.

## Frozen columns

ZK `<frozen columns="N">` mechanism (important — it is **not** CSS `position: sticky`):

- First N column cells and the matching header cells receive class `.z-frozen-col`.
- The grid root receives `.z-grid-frozen`.
- A separate **scroll tray** DOM block is rendered (below the body):

  ```
  .z-frozen
    > .z-frozen-body
    > .z-frozen-inner   (overflow-x: scroll, this is where the scrollbar lives)
    > .z-frozen-right
    > .z-clear
  ```

- ZK JS listens to `scrollLeft` on `.z-frozen-inner` and `translateX`-shifts the non-frozen columns to simulate horizontal scrolling. The body itself stays `overflow-x: hidden`.
- **No `.z-frozen-sticky` class** — older docs may mention it; verify against actual ZK 10 output, which uses only the classes above.

Theme implications:

- Style `.z-frozen` / `.z-frozen-inner` to expose a thin scrollbar (default WebKit scrollbar otherwise dominates).
- Mark the pane boundary with `border-inline-end` and a small box-shadow on `.z-frozen-col:last-of-type` so the divider is visible during horizontal scroll. Don't try to apply `position: sticky` — it will conflict with ZK's translateX driver.

**Side-by-side layout — float, not flex.** ZK's authoritative CSS (`zul/mesh/less/frozen.less`) requires:

```css
.z-frozen-body  { float: left;  overflow: hidden }
.z-frozen-inner { overflow-x: scroll; overflow-y: hidden }
.z-frozen-right { float: right; overflow: hidden }
.z-clear        { clear: both }    /* the trailing .z-clear div ends the float row */
```

Without `float: left` on `.z-frozen-body`, `.z-frozen-inner` stacks **below** body instead of next to it — and the horizontal scrollbar can no longer be seen above the data rows. The theme must match this layout exactly; you can't substitute flex/grid because ZK's JS reads the resulting offsets to position the translateX. The `.z-clear` div terminates the float row — keep its rule (`clear: both`).

**Tray height pitfall — macOS overlay scrollbars collapse to ~6px.** ZK calls `jq.scrollbarWidth()` to size the tray; on Macs with overlay scrollbars active it reads ≈6 (vs 15 on Windows / older browsers). Inline `height: 6px` on `.z-frozen`, `.z-frozen-body`, `.z-frozen-inner` is too thin to render a visible WebKit scrollbar. Force a `min-height: 12px` on all three — CSS `min-height` always wins against inline `height`, so the value is forced regardless of what JS measured.

**Visual indicator on `.z-frozen-body`.** That spacer aligns under the frozen columns; users need a visual cue that the columns above are frozen. Apply a faint `surface-container-low` background plus the same `border-inline-end + box-shadow` boundary you used on `.z-frozen-col`. That makes the frozen pane edge continue past the data rows.

## Tree-specific

- **Indent per level**: `.z-tree-spacer` width controls indentation (typically 20px per level).
- **Expand icon**: `.z-tree-icon`. Toggles rotation (0deg → 90deg) on open/close via CSS transform.
- **Connector lines**: `.z-tree-line` between rows (optional, off by default).

## Row height consistency

Grid, listbox, and tree share a row-height baseline (around 52px for spacious tables, 32–40px for dense). Choose one row-height in the theme's DESIGN.md and apply it across all three to keep tables consistent.

## Tree expand-icon rotation

The `[open]` state is controlled by ZK; the icon rotates via CSS transition:

```css
.z-tree-icon { transition: transform <duration> <easing>; }
.z-treerow[open] .z-tree-icon { transform: rotate(90deg); }
```

(Exact transition value is a theme decision; the mechanism is ZK's.)

## Group-row `<td colspan="N">` — never set `display: flex/grid` on the cell

ZK's `<listgroup>` (and analogous group rows in grid/tree) renders one wide `<td>` with `colspan` covering every column:

```
TR.z-listgroup > TD.z-listgroup-inner[colspan="5"] > DIV.z-listcell-content > …
```

If theme CSS sets `display: flex` (or `grid`) directly on that `<td>`, the cell stops being a `display: table-cell` — HTML table layout then ignores its `colspan` and the cell collapses to a single-column width. Visible symptom: the group title is the same width as the first regular column, not the full row.

```css
/* Correct: keep the td as table-cell so colspan works; flex the inner DIV. */
td.z-listgroup-inner { display: table-cell; }
.z-listgroup-inner > .z-listcell-content {
    display: flex;
    align-items: center;
    gap: var(--zk-spacing-2);
}
```

The same trap applies to any `<td>` that uses `colspan` (e.g. `.z-grid-foot` / `.z-foot` footer cells, frozen-row spanning, multi-level header cells emitted by auxhead).

## Listgroup / Listgroupfoot — borders on the ROW, not the cell

Group header (`.z-listgroup`) and group subtotal (`.z-listgroupfoot`) rows are TR elements with TDs inside. ZK renders cell content as:

```
TR.z-listgroup > TD.z-listcell > DIV.z-listcell-cnt > DIV.z-listcell-content
```

If you write `.z-listgroup .z-listcell-content { border-top; border-bottom }`, the border lands on the innermost DIV — every cell shows its own top+bottom lines, giving you 3 stacked lines across the row (since td/cnt/content all rendered separately). The intent is **one** divider per row, so put the border on the TR itself:

```css
.z-listgroup    { border-bottom: 1px outline-variant }   /* divider after group header */
.z-listgroupfoot { border-top:    1px outline-variant }  /* divider before subtotals */
```

Cell-level rules can still set `background-color: transparent` so the row band shows through. Tree's `.z-treegroup` follows the same pattern.

## Bundles

- `grid.css.dsp` (zul/grid)
- `listbox.css.dsp` (zul/sel); zkmax has an override version
- `tree.css.dsp` (zul/sel); zkmax has an override version

The zkmax override files only apply when EE is loaded. See `reference/css-file-bundling.md`.
