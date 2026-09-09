# Component: anchorlayout (theme design)
tier: T1
category: layout
preview: ${PREVIEW_URL}/anchorlayout.zul
rules: see .claude/skills/zk-component-rules/components/anchorlayout.md
contract-approved: true
zk-version: 10.2.1-jakarta
js-source-files:
  - zul/layout/Anchorlayout.ts
  - zul/layout/Anchorchildren.ts
  - zul/layout/mold/anchorlayout.js
  - zul/layout/mold/anchorchildren.js
js-source-hash: 7eca7284bfb4dc16c1b8573f06a80c75b5c156407ced18278340aa13b9bb40f7
closest-sibling: none — novel anchor-sizing pattern
mockup-needed: N
mockup-rationale: ZKDoc canonical image exists; Marble applies only gap/flex-wrap over a transparent container — no surface paint, no significant visual divergence from the ZKDoc layout diagram

## References
- MUI CSS: Layout/Stack.css — flex-wrap row layout is the closest structural analog; no visual theming borrowed
- DESIGN.md sections: §4 (Spacing Scale)
- Iceblue baseline: doc/contracts/baselines/anchorlayout-iceblue.png
- ZKDoc canonical: /Users/hawk/Documents/workspace/DOC/zkdoc/zk_component_ref/images/ZKComRef_Anchorlayout_Example.png
- Divergence from baseline: iceblue renders anchor-children **flush** (float model, no gutter); Marble intentionally introduces a `var(--zk-spacing-4)` (16px) gap via flex-wrap. This is the only visual difference from the ZKDoc/iceblue ground truth and is by design (grid-gutter consistency).

## Design Contract

Anchorlayout is a transparent layout shell — it paints no surface, no border, and no shadow.
Its sole visual contribution to the Marble theme is the gap between child columns/rows. Children
flow left-to-right and wrap to a new row when they exceed the parent width. Marble overrides
iceblue's float-based model with `display: flex; flex-wrap: wrap` so that gap can be applied
uniformly via the `gap` property. A `gap` of `var(--zk-spacing-4)` (16px) provides comfortable
breathing room between anchor-sized children — consistent with the grid gutter used across the
theme's card layouts. The root carries `width: 100%` and `box-sizing: border-box` so that
percentage-anchored children resolve correctly against the parent container width. Children carry
`flex-shrink: 0` to prevent the flex algorithm from compressing below the JS-set inline widths,
`min-width: 0` to prevent flex blowout from wide content, and `box-sizing: border-box` for a
sizing model consistent with the root container.

## Outcome assertions

| id | predicate | rationale |
|----|-----------|-----------|
| M1 | `.z-anchorlayout` bbox.width > 0 AND `.z-anchorchildren` count ≥ 1 with bbox.width > 0 | layout is engaged — root and at least one child have non-zero widths |
| M2 | For any two horizontally adjacent `.z-anchorchildren` nodes (bbox.top overlap > 50%): gap between right edge of left child and left edge of right child ≥ 8px | children are not flush against each other |
| M3 | No two `.z-anchorchildren` nodes have overlapping bounding boxes (intersection area = 0) | children do not z-fight or overlap |
| M4 | `.z-anchorlayout` has background = transparent OR rgba(0,0,0,0) AND box-shadow = none AND border-width = 0 | layout shell is invisible — it must not paint a card frame |
| M5 | A `.z-anchorchildren` with anchor="50%" has bbox.width ≈ 0.5 × `.z-anchorlayout` bbox.width (±10px tolerance — the 16px flex gap deducts ~8px per 50% child, so a tight window would false-fail) | percentage anchor sizing is correctly resolved by the JS engine |

## Expected values

| id | selector | property | expected (token preferred) | source |
|----|----------|----------|----------------------------|--------|
| c1 | `.z-anchorlayout` | display | `flex` | Marble flex override (replaces iceblue float) |
| c2 | `.z-anchorlayout` | flex-wrap | `wrap` | Marble layout policy — wrapping anchor layout |
| c3 | `.z-anchorlayout` | gap | `var(--zk-spacing-4)` | DESIGN.md §4 — 16px grid gutter |
| c4 | `.z-anchorlayout` | width | `100%` | required for % anchors to resolve against parent |
| c5 | `.z-anchorlayout` | box-sizing | `border-box` | required so 100% width includes any padding |
| c6 | `.z-anchorlayout` | align-items | `flex-start` | children should not stretch to the tallest sibling |
| c7 | `.z-anchorchildren` | flex-shrink | `0` | prevents flex from compressing below JS-set inline widths |
| c8 | `.z-anchorchildren` | box-sizing | `border-box` | consistent sizing model for child containers |
| c9 | `.z-anchorchildren` | min-width | `0` | prevents flex blowout from wide content |

## State matrix

| state | selector | properties to check |
|-------|----------|---------------------|
| default | `.z-anchorlayout` | c1–c6 |
| child-default | `.z-anchorchildren` | c7–c9 |

## States to evaluate
- [x] default (layout container — no interactive states)
- [x] child-default (anchorchildren — sizing model)
