# Component: groupbox (theme design)
tier: T2
category: container
preview: http://localhost:8080/groupbox.zul
rules: see .claude/skills/zk-component-rules/components/groupbox.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- DESIGN.md sections: §1, §5, §7, §11
- Closest-sibling CSS to read first: `src/main/resources/web/js/zul/wnd/css/panel.css` (reuse padding, radius, shadow, header treatment)
- Closest MUI: Card with CardHeader + Collapse.
- Visual goal: panel-lite (smaller emphasis than panel; subtle outline instead of full card shadow when nested).

## Expected values (T2)
- Border: 1px solid outline-variant (rgba(0,0,0,0.12)).
- Border-radius: 6px (card-like).
- Title font-size 14–16px, weight 500.
- Content padding: 16px.
- Collapsed state: only header visible, with chevron indicator rotated.

## States to evaluate
- [ ] default, collapsed, readonly, notitle, 3d
