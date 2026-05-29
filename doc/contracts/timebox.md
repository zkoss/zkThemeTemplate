# Component: timebox (theme design)
tier: T1
category: input
preview: http://localhost:8080/timebox.zul
rules: see .claude/skills/zk-component-rules/components/combo-trio.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- MUI CSS: TimePicker.css
- Mira HTML: doc/mira/forms-pickers.html
- DESIGN.md sections: §1, §2, §5, §7, §9, §10, §11

## Expected values
Same input metrics as combobox c1–c7 (selectors → `.z-timebox-*`).

## States to evaluate
- [ ] default, hover, focus, disabled, readonly, invalid
- [ ] inplace (see `reference/inplace-state.md`)
- [ ] buttonVisible-false (clock icon hidden — see `reference/buttonVisible-attribute.md`; verify `.z-timebox-button.z-timebox-disabled` has `display: none`)
