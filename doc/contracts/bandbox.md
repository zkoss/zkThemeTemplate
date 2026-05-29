# Component: bandbox (theme design)
tier: T2
category: input
preview: http://localhost:8080/bandbox.zul
rules: see .claude/skills/zk-component-rules/components/bandbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- DESIGN.md sections: §1, §2, §5, §7, §9, §10, §11
- Closest-sibling CSS to read first: `src/main/resources/web/js/zul/inp/css/combobox.css`
- Popup container CSS: `src/main/resources/web/js/zul/wnd/css/bandpopup.css`
- No direct Mira mapping — Evaluator compares input metrics against combobox.

## Expected values (T2 — DESIGN.md tokens only)
- Input metrics match combobox (since visually a styled combobox).
- Popup uses elevation level 2 (DESIGN.md §6).

## States to evaluate
- [ ] default, hover, focus, disabled, readonly, invalid, open
- [ ] inplace (see `reference/inplace-state.md`)
- [ ] buttonVisible-false (band button hidden — see `reference/buttonVisible-attribute.md`; verify `.z-bandbox-button.z-bandbox-disabled` has `display: none`)
