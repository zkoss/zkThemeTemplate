# Component: searchbox (theme design)
tier: T3
category: input
preview: http://localhost:8080/searchbox.zul
rules: see .claude/skills/zk-component-rules/components/searchbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## Notes
searchbox has no dedicated CSS.dsp in ZK source — may share cascader.css or need its own file.
Evaluator should check if a dedicated `.z-searchbox` CSS file is served; if not, flag as T2 (needs own file).

## Expected values

| id | selector | property | expected |
|----|----------|----------|----------|
| c1 | `.z-searchbox` | border | 1px solid rgba(0, 0, 0, 0.23) |
| c2 | `.z-searchbox` | border-radius | 4px |
| c3 | `.z-searchbox-input` | font-size | 14px |
| c4 | `.z-searchbox[disabled]` | opacity | 0.38 |

### Selection (list-row family)
The searchbox dropdown is a keyboard-navigable list of options — semantically
a LIST-ROW selection, NOT a chip. Per `reference/selected-state-families.md`
it MUST use `primary-container`. Pre-2026-05-29 it used `secondary-container`
(the chip-family colour) — if the evaluator sees that again, FAIL.

| id | selector | property | expected |
|----|----------|----------|----------|
| s1 | `.z-searchbox-selected` | background-color | `rgb(214, 228, 255)` (= `--zk-color-primary-container`) |
| s2 | `.z-searchbox-selected` | color | `rgb(0, 28, 61)` (= `--zk-color-on-primary-container`) |
| s3 | `.z-searchbox-selected` | background-color | MUST NOT be `rgb(178, 223, 219)` (= `--zk-color-secondary-container`) — wrong family (the pre-fix bug) |

## States to evaluate
- [ ] default, hover, disabled, item-selected (keyboard-active row)
