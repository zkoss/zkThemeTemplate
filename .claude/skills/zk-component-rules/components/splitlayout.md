# splitlayout

A resizable two-pane container that divides its content area into two caves separated by a draggable splitter bar. Orientation is either `vertical` (top/bottom stacked caves) or `horizontal` (left/right side-by-side caves). Supports collapse ("before" or "after" pane), resizability toggle, and nested splitlayout trees. Available in ZK EE only.

## DOM structure

```
.z-splitlayout                                (root <div>; white-space: nowrap; overflow: hidden)
├─ .z-splitlayout-cave-top      [vertical]   (first pane <div>; position: relative; display: block; width: 100%; overflow: hidden)
  OR .z-splitlayout-cave-left   [horizontal] (first pane <div>; display: inline-block; position: relative; height: 100%; white-space: normal; vertical-align: top; overflow: hidden)
├─ .z-splitlayout-splitter                   (splitter bar <div>)
│  .z-splitlayout-splitter-vertical          (modifier class when orient=vertical — splitter is horizontal bar)
│  .z-splitlayout-splitter-horizontal        (modifier class when orient=horizontal — splitter is vertical bar)
│  .z-splitlayout-splitter-draggable         (added when resizable=true)
│  .z-splitlayout-splitter-nosplitter        (added when resizable=false — cursor: default)
│  └─ .z-splitlayout-splitter-button         (collapse toggle <span>; cursor: pointer)
│     .z-splitlayout-splitter-button-disabled (added when collapse="none" — no collapse button)
│     ├─ <i class="z-splitlayout-splitter-icon z-icon-ellipsis-{h|v}">  (drag handle icon, aria-hidden)
│     ├─ <i id="…-splitter-icon" class="z-splitlayout-splitter-icon">   (collapse arrow icon, aria-hidden)
│     └─ <i class="z-splitlayout-splitter-icon z-icon-ellipsis-{h|v}">  (duplicate drag icon, aria-hidden)
└─ .z-splitlayout-cave-bottom   [vertical]   (second pane <div>; same rules as cave-top)
  OR .z-splitlayout-cave-right  [horizontal] (second pane <div>; same rules as cave-left)
```

The mold always emits all four cave elements and the splitter unconditionally. Cave visibility is controlled by JS `.show()` / `.hide()` after children are added. Sizes (width/height) on cave elements are set inline by JS at runtime; no CSS rule should assume any fixed dimension on caves.

The splitter bar always contains exactly three `<i>` elements: the first and third are the drag-handle icon (`.z-icon-ellipsis-h` for vertical orientation, `.z-icon-ellipsis-v` for horizontal), the middle is the collapse arrow icon whose class is toggled by JS between `z-icon-caret-up`, `z-icon-caret-down`, `z-icon-caret-left`, `z-icon-caret-right` depending on orientation and open/closed state.

## State classes

- `.z-splitlayout-splitter-draggable` — added to splitter when `resizable="true"` (default); enables `cursor: col-resize` (horizontal orient) or `cursor: row-resize` (vertical orient)
- `.z-splitlayout-splitter-nosplitter` — added to splitter when `resizable="false"`; must produce `cursor: default`
- `.z-splitlayout-splitter-button-disabled` — added to the collapse button when `collapse="none"` (default); collapse icon is hidden; button has no active click behavior
- Open/collapsed state: no class on the root. JS calls `.show()` / `.hide()` on the affected cave element directly. The collapsed cave becomes `display: none` via inline style; the other cave expands to fill.

States rely on structural modifiers above. There is no `.z-splitlayout-open` or `.z-splitlayout-collapsed` class emitted at the root level.

## Attribute support

- `orient="vertical"` (default) / `orient="horizontal"` — determines which cave pair and splitter modifier class is active; written into the DOM via modifier classes at render time, not as an HTML attribute
- `collapse="none"` (default) / `collapse="before"` / `collapse="after"` — drives splitter-button-disabled state and the collapse arrow direction
- `resizable="true"` (default) / `resizable="false"` — toggles splitter-draggable vs splitter-nosplitter; also toggles drag-handle icon visibility via `$zicon.show()` / `$zicon.hide()`
- `widths` / `heights` — initial cave sizes; applied inline by JS, not via CSS
- `minWidths` / `minHeights` — drag constraints; enforced by JS snap logic

## Composition invariants

- The splitter bar must be a positioning context for the three `<i>` icons inside it; the icon elements use `position: absolute` and rely on the button or splitter being `position: relative`.
- Horizontal splitter (`orient="horizontal"`) — splitter bar is `display: inline-block`, same height as the splitlayout; must not break the `white-space: nowrap` flow of the root.
- Vertical splitter (`orient="vertical"`) — splitter bar is full-width, fixed height (the "splitter size"); JS subtracts `splitter.offsetHeight` from total available height before distributing to caves.
- Cave elements for horizontal orient must be `display: inline-block` (not block) and `vertical-align: top` to sit side-by-side within the `white-space: nowrap` root.
- Cave elements must be `position: relative` and `overflow: hidden` — children use `hflex`/`vflex` which requires a proper sizing context.
- The drag ghost (`#zk_ddghost`, class `.z-splitter-ghost`) is appended to `<body>` during drag and removed on drop; it is not a child of splitlayout and must be styled independently (shared with the borderlayout splitter ghost).

## Sibling decomposition

- Splitter bar visual (background, border, hover highlight, drag cursor): aligns with `splitter` — see `components/splitter.md`. The `--zk-splitter-*` legacy vars used in the default CSS must be mapped to the same marble token choices used for `.z-splitter`.
- Cave containment (position, overflow): no sibling — standard block/inline-block layout geometry.
- Drag ghost: same `.z-splitter-ghost` class used by `borderlayout` splitter.

## Contract

`splitlayout.css.dsp` — served from `js/zkmax/layout/css/splitlayout.css`. Marble theme file must live at `src/main/resources/web/js/zkmax/layout/css/splitlayout.css`.

## Edition

EE (zkmax.jar — package `org.zkoss.zkmax.zul.Splitlayout`)

## Notes

- The default ZK-shipped CSS for splitlayout uses legacy CSS variable names of the form `--zk-splitter-*` (e.g. a variable for splitter size, one for background color, one for hover background color, one for button text color and size). These variables are populated by ZK's own bundled theme. A custom theme that overrides this component must either define those legacy variables OR rewrite the rules entirely without referencing them. The variable names (not their values) are: `--zk-splitter-size`, `--zk-splitter-border-color`, `--zk-splitter-background-color`, `--zk-splitter-hover-background-color`, `--zk-splitter-button-text-color`, `--zk-splitter-button-text-size`, `--zk-splitter-button-text-hover-color`.
- JS inlines `width` / `height` on cave elements at runtime; CSS must never assume a fixed size on `.z-splitlayout-cave-*` elements.
- The three `<i>` icons inside the splitter button are all given the class `z-splitlayout-splitter-icon`. The middle `<i>` has an `id` (`uuid + "-splitter-icon"`) so JS can target it for the collapse arrow toggle. The outer two are decorative drag-handle dots; their visibility is toggled by JS (`.show()` / `.hide()`) when `resizable` changes.
- Drag-and-drop uses `zk.Draggable` with `constraint` matching the orient string; the drag is constrained to one axis. The ghost is positioned absolutely over the page body and must not inherit any splitlayout styles.
- When `collapse` is active and the pane is closed, the hidden cave receives `display: none` via inline style. The expanded cave gets its size set inline. CSS transitions on cave size are not ZK-supported — the transition, if any, should target the splitter bar's background/border, not cave dimensions.
- Nested splitlayouts are fully supported; each instance is independently initialized.
