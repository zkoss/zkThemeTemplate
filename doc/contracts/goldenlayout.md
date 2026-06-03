# Component: goldenlayout (theme design)
tier: T3
category: layout
preview: http://localhost:8080/goldenlayout.zul
rules: see .claude/skills/zk-component-rules/components/goldenlayout.md
contract-approved: true
zk-version: 10.2.1-jakarta
js-source-files:
  - zkmax/goldenlayout/GoldenLayout.ts
  - zkmax/goldenlayout/GoldenPanel.ts
js-source-hash: eb19cb70ef8ce069ca77fec0e7fc4310476b3f6848acd2fcb85418ae9081bd58
closest-sibling: tbeditor (T3 strategy — rewrite lib-internal DOM under wrapper scope); tabbox (tab-strip visual pattern)

## References
- MUI CSS: no analog — GoldenLayout is a dockable IDE-style multi-pane layout. No MUI equivalent. Reference MUI `Tabs.css` for the tab-strip active-indicator convention (underline on active tab) and `Divider.css` for the splitter handle. See DESIGN.md §8 for novel-component policy.
- Mira HTML: no analog
- DESIGN.md sections: §3 (color roles — surface, outline, primary), §5 (spacing — header padding, pane padding), §6 (shape — corner-large for wrapper, corner-small for panel), §7 (motion — splitter hover, tab transitions)
- Iceblue baseline: doc/contracts/baselines/goldenlayout-iceblue.png
- HTML contract: doc/contracts/goldenlayout.html

## Theme-bridge decision

GoldenLayoutJS (v2.x) does NOT expose CSS custom properties. It ships structural CSS bundled in its JS (`goldenlayout.js`). ZK's iceblue theme does NOT import a GoldenLayout light/dark theme file — it overrides `lm_*` selectors directly, scoped under `.z-goldenlayout`. Marble follows the same approach:

```yaml
theme-bridge:
  strategy: direct-override    # write all lm_* rules under .z-goldenlayout scope
  available: false             # GoldenLayout 2.x has no CSS variable API
  variables: {}
wrapper-selectors:
  - .z-goldenlayout            # ZK widget root
  - .z-goldenpanel             # ZK panel content node (inside lm_content)
  - .z-goldenlayout-dragProxy  # drag ghost (at document root during drag)
  - .z-goldenlayout-dropdown   # overflow tab dropdown list
  - .z-goldenlayout-dropTargetIndicator  # drag target highlight
styled-selectors:
  # All scoped under .z-goldenlayout or .z-goldenlayout-* prefix
  - .z-goldenlayout .lm_header
  - .z-goldenlayout .lm_tab
  - .z-goldenlayout .lm_tab.lm_active
  - .z-goldenlayout .lm_tab:hover
  - .z-goldenlayout .lm_controls > li
  - .z-goldenlayout .lm_splitter
  - .z-goldenlayout .lm_splitter:hover
  - .z-goldenpanel
```

## Design Contract

> Revised 2026-06-03 to match the ZKDoc canonical image (`/Users/hawk/Documents/workspace/DOC/zkdoc/zk_component_ref/images/ZKCompRef_GoldenLayout.png`). Previous version asked for an "outer wrapper card", which contradicts ZK's default look (per-panel cards). See "Naming history" below.

GoldenLayout renders as a **grid of bordered panels** — each `.z-goldenpanel` is its own visual card; the outer `.z-goldenlayout` is a **transparent layout container with no outer framing of its own**. Every panel = `.lm_header` tab strip on top + content area below, sharing a 1px `outline-variant` border on all four sides and `corner-small` (8px) radius applied uniformly to all four corners. Panel content background is `surface` (white); the `.lm_header` strip background is also `surface` (matches content — there is no tonal step), with a single 1px `outline-variant` bottom edge separating the strip from content. Header strip is `~36px` tall and uses `body-medium` font size for tab labels.

Tabs (`.lm_tab`) are **underline-only**: no background fill, no side borders, no rounded corners. Inactive tab label color is `on-surface-variant` at `body-medium`; hover shifts to `on-surface`. Active tab (`.lm_active`) flips its label to `primary` color and renders a **2px `primary` underline** via `::after` pseudo-element, exactly mirroring the MUI Tabs active-indicator convention. The close icon `×` (`.lm_close_tab::before`) sits immediately after the label, using `on-surface-variant` at rest and `primary` on hover.

Header right-controls are a **fixed cluster of two icons** anchored to the header's right edge (within `--zk-spacing-2` of `.lm_header`'s right edge): a maximize icon `↗` (`.lm_maximise::after`) and a close icon `×` (`.lm_controls .lm_close::after`). Both use `on-surface-variant` at rest and `primary` on hover; they are visually separated from the tab strip on the left by flexible whitespace, not by a divider. They must be visible on every panel header in the default state.

Splitter handles (`.lm_splitter`) are a thin grey bar (1px-equivalent visual weight) between adjacent panels — vertical bar for column splits, horizontal bar for row splits. They are `transparent` at rest with a `⁞`-style dot-handle marker drawn via a `::before` pseudo-element to signal draggability; on hover the bar background switches to `primary-container` and the dot handle to `primary`. The drag-active state (`lm_dragging`) uses `outline-variant` bar background.

When `areas` is set (e.g. `"AAB / AAB / CCD"`), the resulting grid honors the implied flex ratios: a 2-cell-wide area is `~2×` the width of a 1-cell-wide neighbor; a 2-cell-tall area is `~2×` the height of a 1-cell-tall neighbor.

The drag-proxy tab (`.z-goldenlayout-dragProxy`) lifts the dragged tab out with `elevation-2` shadow and the `primary` underline to confirm identity during drag. The drop-target indicator (`.z-goldenlayout-dropTargetIndicator`) uses a 1px dashed `primary` border with a 10% `primary` fill (light blue tint) to mark the landing zone — matches the north / east / south / west / stack drop affordance shown in the ZKDoc reference images. The overflow dropdown (`.z-goldenlayout-dropdown`) uses `surface` background, `elevation-2` shadow, `corner-small` radius, and `surface-container-high` hover on list items.

Transitions on tab label color, splitter background, and icon color use `short2` duration with `standard` easing.

## Outcome assertions

Outcome-level predicates that gate `VERIFIED`: failing any row blocks VERIFIED even if all D-tier rows below pass. Predicates are deliberately disjunctive / tolerance-based — they assert *outcome*, not *recipe*. Row IDs use the `M` prefix (originally "macro-scale outcome"; retained as a stable identifier across all eval reports). The evaluator measures these from bounding-box geometry; see the `### 3b-outcome` step in `.claude/agents/zk-theme-evaluator.md` for the enforcement protocol.

| id | predicate | rationale |
|----|-----------|-----------|
| M1 | every visible `.z-goldenpanel` has visible framing: (`border-width ≥ 1px` AND `border-color ≠ transparent`) OR `box-shadow ≠ none` — AND the outer `.z-goldenlayout` has **no** redundant outer card (its border-width = 0 OR border-color = transparent) | per-panel cards, not outer wrapper card — corrects the earlier "outer card" mistake by matching the ZKDoc reference image |
| M2 | `.z-goldenlayout` bbox height ≥ 300px AND ≥ 80% of its parent's available height when parent has explicit height | layout engaged — wrapper is not collapsed to header-only |
| M3 | `.z-goldenlayout > .lm_goldenlayout` bbox covers ≥ 95% of `.z-goldenlayout` content-box on both axes | GoldenLayout's root fills the wrapper, no dead space |
| M4 | within each `.lm_header`, all visible `.lm_tab` siblings have `bbox.top` range ≤ 2px AND no two tab bboxes overlap horizontally by > 1px | tab strip is a single horizontal row, no text collisions |
| M5 | for any two `.lm_item.lm_stack` siblings anywhere under `.z-goldenlayout`, their bboxes do not overlap each other by > 1px on **both** axes | panels dock (split/tile) rather than stacking at z-index — covers cross-stack overlap that within-container check missed during the pilot |
| M6 | no two visible text-bearing nodes anywhere under `.z-goldenlayout` have bboxes that overlap by > 1px on both axes | catch-all: no overlapping labels, no z-fighting text |
| M7 | for every visible `.lm_tab`, label text node has WCAG contrast ratio ≥ 4.5:1 against its computed background-color | tab labels are legible |
| M8 | every visible `<li>` element anywhere under `.z-goldenlayout` has `list-style-type: none` OR `display !== list-item` | covers `.lm_tabs > li.lm_tab`, `.lm_controls > li`, and dropdown items — the pilot found bullet markers on tab `<li>` elements that the original dropdown-only check missed |
| M9 | every visible `.lm_header` contains a `.lm_controls` cluster with ≥ 2 visible icon children (maximize + close), AND the cluster's bbox.right is within `var(--zk-spacing-2)` (8px) of `.lm_header`'s content-box right edge | maximize ↗ + close × icons are present and right-anchored — matches ZKDoc reference image |
| M10 | every visible `.lm_tab.lm_active` has a generated `::after` pseudo-element whose computed `background-color` equals (or color-mix-derives from) `var(--zk-color-primary)`, AND whose `height` is `2px` ± 0.5px | active-tab underline indicator (MUI Tabs convention) is actually rendered, not just declared |
| M11 | when `areas` is set on the preview goldenlayout (`AAB / AAB / CCD`), the bbox width of panel-A's stack is `≥ 1.6× AND ≤ 2.4×` panel-B's stack width AND the AB-row height is `≥ 1.6× AND ≤ 2.4×` the CD-row height | the areas-grid attribute is honored — flex ratios from area counts produce the documented layout |
| M12 | every visible `.lm_splitter` has bbox.width > 0 AND bbox.height > 0 (it is not collapsed to 0) AND its `::before` (or first child) renders a non-zero-bbox handle marker | splitter is visible AND has the dot-handle (`⁞`) marker shown in the ZKDoc reference image |
| M13 | within every `.lm_header`, the `.lm_controls` cluster sits on the **same horizontal row as the tabs**: `lm_controls.bbox.top` is within `±4px` of the first visible `.lm_tab`'s bbox.top AND `lm_controls.bbox.bottom` is within `±4px` of that tab's bbox.bottom AND `.lm_header.bbox.height ≤ 48px` (single-row header). | Promoted from §3d AI visual finding 2026-06-03 iter-11: M9 geometry passed but icons rendered on a SECOND row below the tab strip because `.lm_header` lacked `display:flex; align-items:center`. M9 only checks X-axis right-anchoring; M13 adds the Y-axis "same row" assertion that M9 was missing. |

### Evaluation notes
- M1 inverts the previous "outer wrapper card" assumption. Existing `wrap-1`..`wrap-3` rows (border / corner-large / elevation on `.z-goldenlayout`) now contradict M1 — they should be REMOVED from the Expected values table in the next CSS iteration. The card visual moves to `.z-goldenpanel` (already covered by `panel-1`..`panel-4`; needs an additional `box-shadow: var(--zk-elevation-1)` row on `.z-goldenpanel` to match the ZKDoc image's per-panel framing).
- M2/M3 require the preview page to provide explicit height (`hflex`/`vflex` or pixel height on the parent). If the preview lacks this, M2 may report a configuration warning rather than a hard fail.
- M5 may report SKIP when the preview only renders one panel per stack.
- M8 may report SKIP when no overflow condition is reached. The current preview at `goldenlayout.zul` shows the dropdown on the second area — the test must reach it.
- M11 only applies when the preview ZUL actually sets `areas` (currently it does — see `goldenlayout.zul` with `areas="A A B / A A B / C C D"`).
- M12's dot-handle marker is new; if the CSS does not yet draw a `::before` on `.lm_splitter`, this row is expected to FAIL on first eval after the contract revision.

## Expected values

> wrap-1, wrap-2, wrap-3 removed 2026-06-03: the outer-card pattern (border / corner-large / elevation on `.z-goldenlayout`) was wrong — the wrapper is a transparent layout container. Per-panel framing moved to `.z-goldenpanel` (see panel-shadow-1, panel-top-radius-1, panel-top-radius-2 rows below). hdr-3, hdr-4 updated: corner-large → corner-small to match the panel card's top corners.

| id | selector | property | expected (token preferred) | source |
|----|----------|----------|----------------------------|--------|
| wrap-4 | `.z-goldenlayout` | background-color | `transparent` | revised 2026-06-03 — wrapper is a layout container, no fill |
| wrap-5 | `.z-goldenlayout` | overflow | `visible` | revised 2026-06-03 — per-panel cards handle their own clipping |
| hdr-1 | `.z-goldenlayout .lm_header` | background-color | `var(--zk-color-surface-container)` | DESIGN.md §3 (iceblue: colorBackground3 = #fff; Marble uses surface-container for visible strip) |
| hdr-2 | `.z-goldenlayout .lm_header` | border-bottom | `1px solid var(--zk-color-outline-variant)` | DESIGN.md §3 |
| hdr-3 | `.z-goldenlayout .lm_header` | border-top-left-radius | `var(--zk-shape-corner-small)` | revised 2026-06-03 — matches panel card top-corner radius (corner-small = 8px) |
| hdr-4 | `.z-goldenlayout .lm_header` | border-top-right-radius | `var(--zk-shape-corner-small)` | revised 2026-06-03 — matches panel card top-corner radius (corner-small = 8px) |
| hdr-5 | `.z-goldenlayout .lm_header` | min-height | `44px` | structural — JS reads this at bind_ to set config.dimensions.headerHeight; must not change after theme is set |
| hdr-6 | `.z-goldenlayout .lm_header` | overflow | `hidden` | structural |
| hdr-7 | `.z-goldenlayout .lm_header` | font-size | `var(--zk-typescale-body-medium-size)` | DESIGN.md §4 |
| hdr-flex-1 | `.z-goldenlayout .lm_header` | display | `flex` | structural — enables tab strip + controls to co-exist on one row (added 2026-06-03 iter-11 fix) |
| hdr-flex-2 | `.z-goldenlayout .lm_header` | flex-direction | `row` | structural — horizontal layout for tabs + controls (added 2026-06-03 iter-11 fix) |
| hdr-flex-3 | `.z-goldenlayout .lm_header` | align-items | `center` | structural — vertically centers tabs and icons in header strip (added 2026-06-03 iter-11 fix) |
| hdr-tabs-flex | `.z-goldenlayout .lm_tabs` | flex | `1 1 auto` | structural — tabs expand to fill remaining row width, pushing controls to right edge (added 2026-06-03 iter-11 fix) |
| hdr-controls-flex | `.z-goldenlayout .lm_controls` | flex | `0 0 auto` | structural — controls cluster fixed-size, right-anchored (added 2026-06-03 iter-11 fix) |
| tab-1 | `.z-goldenlayout .lm_tab` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §3 (iceblue: textColorLight = rgba(0,0,0,0.57)) |
| tab-2 | `.z-goldenlayout .lm_tab` | padding | `var(--zk-spacing-3) var(--zk-spacing-4)` | DESIGN.md §5 (iceblue: 11px 15px — approximate to spacing-3/spacing-4) |
| tab-3 | `.z-goldenlayout .lm_tab` | cursor | `pointer` | usability |
| tab-4 | `.z-goldenlayout .lm_tab` | border | `1px solid transparent` | structural (reserve space; border shows on hover/active) |
| tab-5 | `.z-goldenlayout .lm_tab` | transition | `color var(--zk-motion-duration-short2) var(--zk-motion-easing-standard)` | DESIGN.md §7 |
| tab-h1 | `.z-goldenlayout .lm_tab:hover` | color | `var(--zk-color-on-surface)` | DESIGN.md §3 (iceblue: textColorDefault = rgba(0,0,0,0.9)) |
| tab-h2 | `.z-goldenlayout .lm_tab:hover` | border-color | `var(--zk-color-outline-variant)` | DESIGN.md §3 |
| tab-h3 | `.z-goldenlayout .lm_tab:hover` | border-top-left-radius | `var(--zk-shape-corner-small)` | DESIGN.md §6 |
| tab-h4 | `.z-goldenlayout .lm_tab:hover` | border-top-right-radius | `var(--zk-shape-corner-small)` | DESIGN.md §6 |
| tab-a1 | `.z-goldenlayout .lm_tab.lm_active` | color | `var(--zk-color-primary)` | DESIGN.md §3 (iceblue: colorPrimary = #0093F9 → primary) |
| tab-a2 | `.z-goldenlayout .lm_tab.lm_active` | background-color | `var(--zk-color-surface)` | DESIGN.md §3 (iceblue: colorBackground3 = white — active tab reads as "selected page") |
| tab-a3 | `.z-goldenlayout .lm_tab.lm_active::after` | display | `block` | structural |
| tab-a4 | `.z-goldenlayout .lm_tab.lm_active::after` | height | `2px` | DESIGN.md §3 (iceblue: 2px underline — keep exact; MUI Tabs uses 2px indicator) |
| tab-a5 | `.z-goldenlayout .lm_tab.lm_active::after` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 |
| tab-a6 | `.z-goldenlayout .lm_tab.lm_active::after` | content | `''` | structural |
| tab-a7 | `.z-goldenlayout .lm_tab.lm_active` | border-top-left-radius | `var(--zk-shape-corner-small)` | DESIGN.md §6 |
| tab-a8 | `.z-goldenlayout .lm_tab.lm_active` | border-top-right-radius | `var(--zk-shape-corner-small)` | DESIGN.md §6 |
| close-1 | `.z-goldenlayout .lm_close_tab` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §3 |
| close-2 | `.z-goldenlayout .lm_close_tab:hover` | color | `var(--zk-color-primary)` | DESIGN.md §3 |
| ctrl-1 | `.z-goldenlayout .lm_controls > li` | color | `var(--zk-color-on-surface-variant)` | DESIGN.md §3 |
| ctrl-2 | `.z-goldenlayout .lm_controls > li:hover` | color | `var(--zk-color-primary)` | DESIGN.md §3 |
| ctrl-3 | `.z-goldenlayout .lm_controls > li` | cursor | `pointer` | usability |
| spl-1 | `.z-goldenlayout .lm_splitter` | background-color | `transparent` | DESIGN.md §3 (invisible at rest) |
| spl-2 | `.z-goldenlayout .lm_splitter:hover` | background-color | `var(--zk-color-primary-container)` | DESIGN.md §3 (iceblue: colorPrimaryLighter = lighten(primary,45%) → primary-container approx) |
| spl-3 | `.z-goldenlayout .lm_splitter.lm_dragging` | background-color | `var(--zk-color-outline-variant)` | DESIGN.md §3 (iceblue: colorGreyLight) |
| panel-1 | `.z-goldenpanel` | background-color | `var(--zk-color-surface)` | DESIGN.md §3 (iceblue: colorBackground3 = white) |
| panel-2 | `.z-goldenpanel` | border | `1px solid var(--zk-color-outline-variant)` | DESIGN.md §3 (iceblue: goldenLayoutBorderColor = #d2d2d2 → outline-variant) |
| panel-top-radius-1 | `.z-goldenpanel` | border-top-left-radius | `var(--zk-shape-corner-small)` | added 2026-06-03 — full 4-corner card; top corners match .lm_header top radius |
| panel-top-radius-2 | `.z-goldenpanel` | border-top-right-radius | `var(--zk-shape-corner-small)` | added 2026-06-03 — full 4-corner card; top corners match .lm_header top radius |
| panel-3 | `.z-goldenpanel` | border-bottom-left-radius | `var(--zk-shape-corner-large)` | DESIGN.md §6 (bottom corners — larger radius for visual weight) |
| panel-4 | `.z-goldenpanel` | border-bottom-right-radius | `var(--zk-shape-corner-large)` | DESIGN.md §6 |
| panel-shadow-1 | `.z-goldenpanel` | box-shadow | `var(--zk-elevation-1)` | added 2026-06-03 — per-panel card elevation (moved from outer wrapper) |
| panel-5 | `.z-goldenpanel` | padding | `var(--zk-spacing-5) var(--zk-spacing-4)` | DESIGN.md §5 (iceblue: 20px 16px) |
| panel-6 | `.z-goldenpanel` | overflow | `auto` | structural (content scroll) |
| panel-7 | `.z-goldenpanel` | box-sizing | `border-box` | structural |
| max-1 | `.z-goldenlayout .lm_maximised` | position | `absolute` | structural (JS-driven; do not change) |
| proxy-1 | `.z-goldenlayout-dragProxy .lm_tab` | box-shadow | `var(--zk-elevation-2)` | DESIGN.md §6 (iceblue: 0 0 5px rgba(0,0,0,0.19)) |
| proxy-2 | `.z-goldenlayout-dragProxy .lm_tab` | background-color | `var(--zk-color-surface-container)` | DESIGN.md §3 |
| proxy-3 | `.z-goldenlayout-dragProxy .lm_tab::after` | background-color | `var(--zk-color-primary)` | DESIGN.md §3 (active indicator on dragged tab) |
| proxy-4 | `.z-goldenlayout-dragProxy > .lm_content` | box-shadow | `var(--zk-elevation-2)` | DESIGN.md §6 |
| proxy-5 | `.z-goldenlayout-dragProxy > .lm_content` | background-color | `var(--zk-color-surface)` | DESIGN.md §3 |
| drop-1 | `.z-goldenlayout-dropTargetIndicator` | border | `1px dashed var(--zk-color-primary)` | DESIGN.md §3 (iceblue: colorPrimary) |
| drop-2 | `.z-goldenlayout-dropTargetIndicator .lm_inner` | background-color | `color-mix(in srgb, var(--zk-color-primary) 10%, transparent)` | DESIGN.md §3 (iceblue: rgba(0,147,249,0.15)) |
| dd-1 | `.z-goldenlayout-dropdown` | background-color | `var(--zk-color-surface)` | DESIGN.md §3 |
| dd-2 | `.z-goldenlayout-dropdown` | box-shadow | `var(--zk-elevation-2)` | DESIGN.md §6 (iceblue: 0 2px 4px rgba(0,0,0,0.5)) |
| dd-3 | `.z-goldenlayout-dropdown` | border-radius | `var(--zk-shape-corner-small)` | DESIGN.md §6 |
| dd-4 | `.z-goldenlayout-dropdown` | padding | `var(--zk-spacing-1)` | DESIGN.md §5 (iceblue: 4px) |
| dd-5 | `.z-goldenlayout-dropdown > li:hover` | background-color | `var(--zk-color-surface-container-high)` | DESIGN.md §3 (iceblue: colorPrimaryLighter — Marble maps to surface-container-high for hover) |
| dd-6 | `.z-goldenlayout-dropdown > li` | padding | `var(--zk-spacing-2) var(--zk-spacing-2)` | DESIGN.md §5 (iceblue: 8px) |

## State matrix

| state | selector | property ids |
|-------|----------|--------------|
| wrapper default | `.z-goldenlayout` | wrap-4, wrap-5 |
| header strip | `.z-goldenlayout .lm_header` | hdr-1, hdr-2, hdr-3, hdr-4, hdr-5, hdr-6, hdr-7, hdr-flex-1, hdr-flex-2, hdr-flex-3 |
| tab strip flex | `.z-goldenlayout .lm_tabs` | hdr-tabs-flex |
| header controls flex | `.z-goldenlayout .lm_controls` | hdr-controls-flex |
| tab default | `.z-goldenlayout .lm_tab` | tab-1, tab-2, tab-3, tab-4, tab-5 |
| tab hover | `.z-goldenlayout .lm_tab:hover` | tab-h1, tab-h2, tab-h3, tab-h4 |
| tab active | `.z-goldenlayout .lm_tab.lm_active` | tab-a1, tab-a2, tab-a3, tab-a4, tab-a5, tab-a6, tab-a7, tab-a8 |
| close icon default | `.z-goldenlayout .lm_close_tab` | close-1 |
| close icon hover | `.z-goldenlayout .lm_close_tab:hover` | close-2 |
| header controls default | `.z-goldenlayout .lm_controls > li` | ctrl-1, ctrl-2, ctrl-3 |
| header controls hover | `.z-goldenlayout .lm_controls > li:hover` | ctrl-2 |
| splitter default | `.z-goldenlayout .lm_splitter` | spl-1 |
| splitter hover | `.z-goldenlayout .lm_splitter:hover` | spl-2 |
| splitter dragging | `.z-goldenlayout .lm_splitter.lm_dragging` | spl-3 |
| panel content | `.z-goldenpanel` | panel-1, panel-2, panel-top-radius-1, panel-top-radius-2, panel-3, panel-4, panel-shadow-1, panel-5, panel-6, panel-7 |
| maximised stack | `.z-goldenlayout .lm_maximised` | max-1 |
| drag proxy tab | `.z-goldenlayout-dragProxy .lm_tab` | proxy-1, proxy-2, proxy-3 |
| drag proxy content | `.z-goldenlayout-dragProxy > .lm_content` | proxy-4, proxy-5 |
| drop target | `.z-goldenlayout-dropTargetIndicator` | drop-1, drop-2 |
| overflow dropdown | `.z-goldenlayout-dropdown` | dd-1, dd-2, dd-3, dd-4 |
| dropdown item hover | `.z-goldenlayout-dropdown > li:hover` | dd-5 |

## States to evaluate
- [ ] default — outer border, wrapper corner-radius, header strip visible
- [ ] tab default — inactive tab label color (on-surface-variant)
- [ ] tab hover — label shifts to on-surface, border appears, top corners rounded
- [ ] tab active — primary label color, 2px primary underline indicator
- [ ] close icon (×) on tab — visible, on-surface-variant, hover primary
- [ ] header controls — maximize and close icons, on-surface-variant, hover primary
- [ ] splitter default — invisible (transparent)
- [ ] splitter hover — primary-container background highlight
- [ ] panel content — surface background, outline-variant border, correct padding
- [ ] maximised stack — stack fills full layout area
- [ ] drag proxy — elevation-2 shadow on tab and content ghost
- [ ] drop target indicator — dashed primary border, 10% primary fill
- [ ] overflow dropdown — surface background, elevation-2, corner-small

## T3 wrapper boundary

goldenlayout is T3: GoldenLayoutJS owns and writes the `lm_*` DOM tree. ZK only renders `.z-goldenlayout` (the root `<div>`) and `.z-goldenpanel` (panel content nodes). All other visible elements are GoldenLayout-injected.

Because GoldenLayout 2.x exposes no CSS custom properties, Marble must restyle all internal `lm_*` elements directly via scoped selectors. The previous `forbidden-selectors: .lm_*` rule was incorrect — those selectors MUST be styled to achieve visual parity with the iceblue baseline.

```yaml
wrapper-selectors:
  - .z-goldenlayout
  - .z-goldenpanel
  - .z-goldenlayout-dragProxy
  - .z-goldenlayout-dropdown
  - .z-goldenlayout-dropTargetIndicator
styled-internal-selectors:
  # These are GoldenLayout-injected but must be restyled under .z-goldenlayout scope:
  - .z-goldenlayout .lm_header
  - .z-goldenlayout .lm_tab
  - .z-goldenlayout .lm_tab.lm_active
  - .z-goldenlayout .lm_tab:hover
  - .z-goldenlayout .lm_controls
  - .z-goldenlayout .lm_splitter
forbidden-selectors:
  # Do NOT set geometry (position/top/left/width/height) on these — GoldenLayout sets them inline:
  - ".z-goldenlayout .lm_stack[style]"   # inline geometry — never override
  - ".z-goldenlayout .lm_items[style]"   # inline geometry — never override
  - ".z-goldenlayout .lm_content[style]" # inline geometry — never override
theme-bridge:
  strategy: direct-override
  available: false
  notes: >
    GoldenLayout 2.x has no CSS variable API. All styling is via direct selector
    overrides scoped under .z-goldenlayout. No GoldenLayout theme file is imported.
```
