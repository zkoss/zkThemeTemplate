# Component: splitlayout (theme design)
tier: T1
category: layout
preview: http://localhost:8080/splitlayout.zul
rules: see .claude/skills/zk-component-rules/components/splitlayout.md
contract-approved: true
zk-version: 10.2.1-jakarta
js-source-files:
  - zkmax/src/main/resources/web/js/zkmax/layout/mold/splitlayout.js
  - zkmax/src/main/resources/web/js/zkmax/layout/Splitlayout.ts
js-source-hash: 91be9da33e6066ac2976cf134c507f8b4a49799a49ca3385eefe5ac15dce81da
closest-sibling: splitter (for the splitter bar sub-element only)

## References
- MUI CSS: no analog — MUI has no split-pane layout component (closest is a third-party resizable panel library; no file in static-css-output/)
- Mira HTML: no analog
- DESIGN.md sections: §1 (surfaces), §4 (spacing), §8 (state layers), §9 (motion), §11 (border rules)
- Iceblue baseline: doc/contracts/baselines/splitlayout-iceblue.png
- HTML contract: doc/contracts/splitlayout.html

## Design Contract

The splitlayout divider is a minimal, flat 1px line at rest — visually identical to the `splitter` component (borderlayout divider) to preserve a single "resize handle" affordance across the app. The splitter bar background uses `--zk-color-surface-container` (a very faint tonal grey) so it recedes into the layout at rest; on hover it reveals a state-layer tint using `--zk-color-primary` at hover opacity to signal interactivity. The collapse button (caret icon) appears centered in the splitter bar in the same primary color. When `resizable="false"` (`.z-splitlayout-splitter-nosplitter`), the bar drops its hover state and reverts to a pure `--zk-color-outline-variant` 1px divider with `cursor: default`. Transitions on `background-color` and `color` run at `--zk-motion-duration-short3` (250ms) with standard easing. Cave areas have no decoration — they are transparent containers.

A horizontal splitlayout shows two side-by-side caves separated by a thin vertical bar; a vertical splitlayout shows two top-bottom caves with a thin horizontal bar between them. With `hflex="1"` on the root, both panes split the available width equally by default; the splitter bar sits between them as an 8px-thick separator. Nested splitlayouts compose recursively — the inner splitlayout occupies the cave of its parent and lays out its own two children with its own splitter bar.

## Outcome assertions

Outcome-level predicates that gate `VERIFIED`: failing any row blocks VERIFIED even if all D-tier rows below pass. Predicates are deliberately disjunctive / tolerance-based — they assert *outcome* (e.g. size-within-N%, docked-side-by-side), not *recipe*. Row IDs use the `M` prefix (originally "macro-scale outcome"; retained as a stable identifier across all eval reports). The evaluator measures these from bounding-box geometry; see the `### 3b-outcome` step in `.claude/agents/zk-theme-evaluator.md` for the enforcement protocol.

| id | predicate | rationale |
|----|-----------|-----------|
| M1 | `.z-splitlayout` root with `hflex="1"` has bbox width ≥ 90% of its parent's content-box width | hflex respected — layout fills available width |
| M2 | for every `.z-splitlayout`, the sum of its three immediate children's bbox sizes on the main axis (orient="horizontal" → width; orient="vertical" → height) equals the root's main-axis size ± 2px | caves + splitter consume the full layout axis without gap or overflow |
| M3 | for every `.z-splitlayout`, the two caves have main-axis sizes within 5% of each other by default (no inline width/height set on the caves by the page) | default 50/50 split when user hasn't dragged |
| M4 | `.z-splitlayout-splitter` is visible (bbox > 0) AND positioned between the two caves on the layout axis (cave-1.right ≤ splitter.left ≤ cave-2.left + 1px for horizontal, analogous for vertical) | splitter visually separates panes, not floating off-position |
| M5 | nested `.z-splitlayout` inside a parent cave has its bbox contained within the cave's bbox (≤ 1px outside on any side) | nested splitlayouts honor the parent's cave boundaries — no overflow into siblings |
| M6 | no `.z-splitlayout-cave-*` element's bbox overlaps another cave's bbox by > 1px on both axes (across all nested splitlayouts in the page) | panes dock side-by-side / top-and-bottom — never stack at z-index |
| M7 | every `.z-splitlayout-splitter-vertical` has `width: auto` cross-axis behavior (its bbox.width equals the parent splitlayout's bbox.width ± 2px) AND every `.z-splitlayout-splitter-horizontal` has `height` matching its parent splitlayout's bbox.height ± 2px | splitter bar stretches across the cross-axis cleanly — no gaps next to it |

## Expected values

| id | selector | property | expected (token preferred) | source |
|----|----------|----------|----------------------------|--------|
| c1 | `.z-splitlayout-splitter` | background-color | `var(--zk-color-surface-container)` | DESIGN.md §1 — cave divider recedes into layout surface |
| c2 | `.z-splitlayout-splitter` | border-color | `var(--zk-color-outline-variant)` | DESIGN.md §11 — divider/separator border |
| c3 | `.z-splitlayout-splitter` | cursor | `default` | DESIGN.md §8 — no cursor affordance on bare bar |
| c4 | `.z-splitlayout-splitter-vertical` | height | `var(--zk-spacing-2)` (8px) | DESIGN.md §4 — 2-unit splitter height matches splitter contract |
| c5 | `.z-splitlayout-splitter-horizontal` | width | `var(--zk-spacing-2)` (8px) | DESIGN.md §4 — 2-unit splitter width matches splitter contract |
| c6 | `.z-splitlayout-splitter:hover` | background-color | `color-mix(in srgb, var(--zk-color-primary) calc(var(--zk-state-hover-opacity) * 100%), var(--zk-color-surface-container))` | DESIGN.md §8 — state-layer hover on primary |
| c7 | `.z-splitlayout-splitter-draggable.z-splitlayout-splitter-horizontal` | cursor | `col-resize` | structural — horizontal orient drag cursor |
| c8 | `.z-splitlayout-splitter-draggable.z-splitlayout-splitter-vertical` | cursor | `row-resize` | structural — vertical orient drag cursor |
| c9 | `.z-splitlayout-splitter-button` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §2 — collapse icon muted at rest |
| c10 | `.z-splitlayout-splitter:hover .z-splitlayout-splitter-button` | color | `var(--zk-color-primary)` | DESIGN.md §3 — on hover icon brightens to primary |
| c11 | `.z-splitlayout-splitter-button` | transition | `color var(--zk-motion-duration-short3)` | DESIGN.md §9 — standard motion on button color |
| c12 | `.z-splitlayout-splitter` | transition | `background-color var(--zk-motion-duration-short3)` | DESIGN.md §9 — standard motion on bar bg |
| c13 | `.z-splitlayout-splitter-nosplitter` | cursor | `default` | structural — no-drag state |
| c14 | `.z-splitlayout-splitter-button-disabled` | border-width | `0` | structural — disabled button has no border |
| c15 | `.z-splitlayout-cave-top, .z-splitlayout-cave-bottom, .z-splitlayout-cave-left, .z-splitlayout-cave-right` | background-color | transparent (no rule needed — inherits) | cave areas are transparent containers, no fill |

## State matrix

| state | selector | properties to check |
|-------|----------|---------------------|
| default (vertical, resizable, no collapse) | `.z-splitlayout-splitter.z-splitlayout-splitter-vertical.z-splitlayout-splitter-draggable` | c1, c2, c4, c8 |
| default (horizontal, resizable, no collapse) | `.z-splitlayout-splitter.z-splitlayout-splitter-horizontal.z-splitlayout-splitter-draggable` | c1, c2, c5, c7 |
| hover | `.z-splitlayout-splitter:hover` | c6, c10 |
| collapse-button visible | `.z-splitlayout-splitter-button:not(.z-splitlayout-splitter-button-disabled)` | c9, c11 |
| collapse-button disabled (no-collapse) | `.z-splitlayout-splitter-button.z-splitlayout-splitter-button-disabled` | c14 |
| not-resizable | `.z-splitlayout-splitter.z-splitlayout-splitter-nosplitter` | c3, c13 |

## States to evaluate
- [ ] default — vertical orient, resizable=true, collapse=none
- [ ] default — horizontal orient, resizable=true, collapse=none
- [ ] hover — splitter bar hover tint visible
- [ ] hover — collapse button icon turns primary on hover
- [ ] collapse=before — caret icon visible in button; click collapses first pane
- [ ] collapse=after — caret icon visible; click collapses second pane
- [ ] resizable=false — cursor reverts to default; drag handle icon hidden
- [ ] nested splitlayout — inner horizontal inside outer vertical (as in preview page)
