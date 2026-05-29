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

## States to evaluate
- [ ] default, hover, disabled
