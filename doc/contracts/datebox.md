# Component: datebox (theme design)
tier: T1
category: input
preview: http://localhost:8080/datebox.zul
rules: see .claude/skills/zk-component-rules/components/combo-trio.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: /Users/hawk/.../static-css-output/DatePicker.css
- Mira HTML: doc/mira/forms-pickers.html
- DESIGN.md sections: §1, §2, §5, §7, §9, §10, §11

## Expected values
Same input metrics as combobox c1–c8 (just selectors → `.z-datebox-*`). Calendar popup styled separately; cross-reference `calendar` contract.

## States to evaluate
- [ ] default, hover, focus, disabled, readonly, invalid, open
- [ ] inplace (see `reference/inplace-state.md`)
- [ ] buttonVisible-false (calendar icon hidden — see `reference/buttonVisible-attribute.md`; verify `.z-datebox-button.z-datebox-disabled` has `display: none`)
