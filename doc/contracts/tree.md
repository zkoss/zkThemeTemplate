# Component: tree (theme design)
tier: T1
category: selection
preview: http://localhost:8080/tree.zul
rules: see .claude/skills/zk-component-rules/components/data-components.md
shared-css-file: src/main/resources/web/js/zul/sel/css/tree.css
contract-approved: true
zk-version: 10.2.1-jakarta

## References
- MUI CSS: TreeView.css
- Mira HTML: doc/mira/lists.html (closest)
- DESIGN.md sections: §1, §2, §7, §10, §11

## Expected values
Mirror listbox/grid metrics. Plus:
- `.z-tree-icon` size 16–18px, rotation transition on open.
- Indent per level: 20–24px.

### Selection (list-row family)
Tree row is the LIST-ROW selection family per
`reference/selected-state-families.md` — same as listbox / combobox dropdown /
menu / searchbox dropdown.

| id | selector | property | expected |
|----|----------|----------|----------|
| s1 | `.z-treerow-selected` (or `.z-treerow.z-treerow-selected`) | background-color | `rgb(214, 228, 255)` (= `--zk-color-primary-container`) |
| s2 | `.z-treerow-selected .z-treecell-content` | color | `rgb(0, 28, 61)` (= `--zk-color-on-primary-container`) |
| s3 | `.z-treerow-selected` | background-color | MUST NOT be `rgb(178, 223, 219)` (= `--zk-color-secondary-container`) — wrong family |

## States to evaluate
- [ ] default, hover, selected, focus, expanded, collapsed, disabled, frozen columns

## Frozen columns (shared CSS: mesh/css/frozen.css)

ZK `<frozen columns="N"/>` — same bleed-through mechanism as grid and listbox.

**Preview anchor:** the tree page's "Frozen Columns" section (if present). If the page
has no frozen demo, mark all f-checks `SKIPPED` — do not FAIL.

| id | check | selector | property | expected | method |
|----|-------|----------|----------|----------|--------|
| f1 | frozen header cell opaque | `.z-treecol.z-frozen-col` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f2 | frozen body cell opaque (pre-scroll) | `.z-tree:has(.z-tree-frozen) .z-treerow .z-treecell` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f3 | no bleed-through after scroll | scroll `.z-tree-body` to `scrollLeft=350`, wait 300ms | visual | no text from a non-frozen column visible inside frozen column area | scroll-trigger screenshot |

**scroll-trigger procedure for f3:**
```js
const tb = document.querySelector('.z-tree:has(.z-tree-frozen) .z-tree-body');
if (tb) tb.scrollLeft = 350;
```
Wait 300 ms, then screenshot. FAIL if any text from a non-frozen column overlaps the frozen column area.
