# Component: listbox (theme design)
tier: T1
category: selection
preview: http://localhost:8080/listbox.zul
rules: see .claude/skills/zk-component-rules/components/data-components.md
shared-css-file: src/main/resources/web/js/zul/sel/css/listbox.css
contract-approved: true
zk-version: 10.2.1-jakarta

## References
- MUI CSS: List.css / Table.css
- Mira HTML: doc/mira/tables-simple-table.html
- DESIGN.md sections: §1, §2, §7, §10, §11

## Expected values
Mirror grid expected values c1–c12 with selectors → `.z-listitem`, `.z-listcell`, `.z-listheader`.

### Selection (list-row family)
Listbox row is the LIST-ROW selection family per
`reference/selected-state-families.md`. MUST use `primary-container` background
and `on-primary-container` text — never a hardcoded rgba, never
`secondary-container`. (Pre-2026-05-29 the CSS shipped a hardcoded
`rgba(55,111,208,0.12)`; if the evaluator sees that literal again, FAIL.)

| id | selector | property | expected |
|----|----------|----------|----------|
| s1 | `.z-listitem.z-listitem-selected` | background-color | `rgb(214, 228, 255)` (= `--zk-color-primary-container`) |
| s2 | `.z-listitem.z-listitem-selected .z-listcell-content` | color | `rgb(0, 28, 61)` (= `--zk-color-on-primary-container`) |
| s3 | `.z-listitem.z-listitem-selected` | background-color | MUST NOT be `rgba(55, 111, 208, 0.12)` (the pre-fix hardcoded literal) |
| s4 | `.z-listitem.z-listitem-selected` | background-color | MUST NOT be `rgb(178, 223, 219)` (= `--zk-color-secondary-container`) — wrong family |

## States to evaluate
- [ ] default rows, header, hover, selected, focus, disabled, striped, frozen columns

## Frozen columns (shared CSS: mesh/css/frozen.css)

ZK `<frozen columns="N"/>` — same bleed-through mechanism as grid. Fix: opaque backgrounds
on all frozen header and body cells.

**Preview anchor:** the listbox page's "Frozen Columns" section.

| id | check | selector | property | expected | method |
|----|-------|----------|----------|----------|--------|
| f1 | frozen header cell opaque | `.z-listheader.z-frozen-col` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f2 | frozen body cell opaque (pre-scroll) | `.z-listbox:has(.z-listbox-frozen) .z-listitem .z-listcell` | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f3 | selected frozen cell opaque | `.z-listbox:has(.z-listbox-frozen) .z-listitem.z-listitem-selected .z-listcell` (skip if absent) | `backgroundColor` | ≠ `rgba(0, 0, 0, 0)` | computedStyle |
| f4 | no bleed-through after scroll | scroll `.z-listbox-body` to `scrollLeft=350`, wait 300ms | visual | no text from Col C visible inside frozen Col A/B area | scroll-trigger screenshot |

**scroll-trigger procedure for f4:**
```js
const lb = document.querySelector('.z-listbox:has(.z-listbox-frozen) .z-listbox-body');
if (lb) lb.scrollLeft = 350;
```
Wait 300 ms, then screenshot. FAIL if any text from a non-frozen column overlaps the frozen column area.
