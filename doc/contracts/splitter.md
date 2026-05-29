# Component: splitter (theme design)
tier: T2
category: layout
preview: http://localhost:8080/splitter.zul   (or any borderlayout-with-splitter page)
rules: see .claude/skills/zk-component-rules/components/splitter.md
contract-approved: false
zk-version: 10.2.1-jakarta

## References
- DESIGN.md sections: §1, §9, §11
- No closest sibling; construct entirely from tokens:
  - Default: `var(--zk-color-outline-variant)` (1–2px wide line)
  - Hover: `var(--zk-color-primary)` opacity ≤ 0.5 OR state-layer overlay
  - Active drag: `var(--zk-color-primary)` solid
  - Transition: `var(--zk-motion-duration-short3)` background-color
- Visual goal: unobtrusive at rest, clear affordance on hover, decisive on drag.

## Expected values (T2)
- Default: 4–8px wide (horizontal) / tall (vertical), background = outline-variant tint.
- Hover: brighter highlight or primary tint.
- Active (dragging): primary colour.
- Cursor: col-resize / row-resize on hover.

## States to evaluate
- [ ] default, hover, active (drag), collapsed button if applicable
