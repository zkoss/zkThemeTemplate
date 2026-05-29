# Component: grid (theme design)
tier: T1
category: data
preview: http://localhost:8080/grid.zul
rules: see .claude/skills/zk-component-rules/components/data-components.md
shared-css-file: src/main/resources/web/js/zul/grid/css/grid.css
contract-approved: true
zk-version: 10.2.1-jakarta

## References
- MUI CSS: DataGrid.css / Table.css
- Mira HTML: doc/mira/tables-simple-table.html, doc/mira/tables-advanced-table.html
- DESIGN.md sections: §1, §2, §7, §10, §11

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-row` | height (rendered) | ~52px |
| c2 | `.z-cell` | padding | 16px (all sides per DESIGN.md §10) |
| c3 | `.z-cell` | font-size | 13px |
| c4 | `.z-column` | padding | 16px |
| c5 | `.z-column` | background-color | transparent OR very subtle tint |
| c6 | `.z-column` | font-weight | 500 |
| c7 | `.z-column` | border-bottom | 1px solid rgba(0, 0, 0, 0.12) |
| c8 | `.z-row` | border-bottom | 1px solid rgba(0, 0, 0, 0.12) |
| c9 | `.z-row-hover` or `.z-row:hover` | background-color | rgba(0, 0, 0, ~0.04) |
| c10 | `.z-grid-odd` | background-color | tinted alternate (or not used) |
| c11 | `.z-grid` | box-shadow | level-1 card shadow (if standalone) |
| c12 | `.z-grid` | border-radius | 6px (card-like) |

## States to evaluate
- [ ] default rows, header, hover, selected, striped (odd), sortable, card variant, frozen columns

## Frozen columns (shared CSS: mesh/css/frozen.css)

ZK `<frozen columns="N"/>` — ZK JS applies `transform: translate3d(scrollLeft,0,0); z-index:1`
inline on the first N cells. Cells paint above neighbours but transparent backgrounds
reveal scrolled-away content. The fix: explicit opaque backgrounds on all frozen cells.

**Preview anchor:** the grid page's "Frozen Columns" section (has `<frozen columns="2"/>`).

| id | check | selector | property | expected | method |
|----|-------|----------|----------|----------|--------|
| f1 | frozen header cell opaque | `.z-column.z-frozen-col` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f2 | frozen body cell opaque (pre-scroll) | `.z-grid:has(.z-grid-frozen) .z-row .z-cell` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f3 | z-grid-odd frozen body cell opaque | `.z-grid-odd.z-grid:has(.z-grid-frozen) .z-row .z-cell` (skip if absent) | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f4 | no bleed-through after scroll | scroll `.z-grid-body` to `scrollLeft=350`, wait 300ms | visual | no text from Col C visible inside frozen Col A/B area | scroll-trigger screenshot |

**scroll-trigger procedure for f4:**
```js
const gb = document.querySelector('.z-grid:has(.z-grid-frozen) .z-grid-body');
if (gb) gb.scrollLeft = 350;
```
Wait 300 ms, then screenshot. FAIL if any text from a non-frozen column overlaps the frozen column area.
