# goldenlayout

A dockable multi-pane layout container powered by GoldenLayoutJS (v2.x). ZK renders a thin wrapper `<div class="z-goldenlayout">` and delegates all internal DOM — tabs, headers, splitters, pane content areas — to GoldenLayoutJS. ZK child components (`<goldenpanel>`) are registered as GoldenLayout "components" and their `$n()` nodes are injected into GoldenLayout's `.lm_content` divs at runtime.

Two ZK widget classes exist: `GoldenLayout` (the outer container, zclass `z-goldenlayout`) and `GoldenPanel` (each draggable pane, zclass `z-goldenpanel`). The GoldenPanel DOM node is injected by JS *inside* the GoldenLayoutJS-owned `.lm_content` element.

## DOM structure

```
div.z-goldenlayout                    (root, position:relative, JS writes absolute children inside)
└─ [GoldenLayoutJS-injected DOM]
   ├─ .lm_root                        (GoldenLayout root item)
   │  ├─ .lm_row  OR  .lm_column
   │  │  ├─ .lm_stack                 (one per pane group)
   │  │  │  ├─ .lm_header             (tab strip + controls bar)
   │  │  │  │  ├─ .lm_tabs            (positioned container for tab items)
   │  │  │  │  │  └─ .lm_tab          (one per tab; .lm_active on selected)
   │  │  │  │  │     ├─ .lm_title     (tab label text)
   │  │  │  │  │     └─ .lm_close_tab (×  icon when closable=true)
   │  │  │  │  └─ .lm_controls        (far-right icon buttons)
   │  │  │  │     ├─ li.lm_maximise   (↗ maximize icon)
   │  │  │  │     └─ li.lm_close      (× close-stack icon)
   │  │  │  └─ .lm_items              (content area container)
   │  │  │     └─ .lm_item.lm_component.lm_content
   │  │  │        └─ div.z-goldenpanel (ZK widget node inserted here)
   │  │  └─ .lm_splitter              (resize handle between stacks)
   │  │     ├─ .lm_horizontal         (vertical divider; cursor: ew-resize)
   │  │     └─ .lm_vertical           (horizontal divider; cursor: ns-resize)
```

GoldenLayout uses absolute/float positioning internally — the JS engine sets `top`, `left`, `width`, `height` inline on `.lm_stack`, `.lm_items`, etc. Do not set `position`, `top`, `left`, `width`, `height` via CSS on `.lm_*` elements; only color, background, border, and typographic properties are safe to override.

A hidden `<div class="z-goldenlayout"><div id="uuid-styleIndicator" class="lm_header"></div></div>` is temporarily injected by the mold to let `bind_` read the CSS `min-height` of `.lm_header`. It is removed after `bind_` runs and is never visible.

During drag, a `.z-goldenlayout-dragProxy` div is appended to the document root (detached from the `.z-goldenlayout` node). It contains a mirror of the dragged tab's `.lm_header .lm_tabs`.

## State classes

### On `.lm_tab` (per-tab states)
- `.lm_active` — added by GoldenLayoutJS when this tab is the selected/active pane. ZK fires `onActive` on the corresponding `<goldenpanel>` when this changes.
- Default (no extra class) — tab is visible but not selected.

### On `.lm_stack` (per-stack states)
- `.lm_maximised` — added when the stack is expanded to fill the full layout. ZK fires `onMaximize` on each contained panel.
- `.lm_left`, `.lm_right`, `.lm_bottom` — GoldenLayoutJS adds these when the tab strip is oriented on that side (vertical tab layout). Default (top) has no orientation class.
- `.lm_docked` — GoldenLayoutJS docked/pinned stack variant (rare).

### On the `.lm_splitter` (divider states)
- `.lm_horizontal` — the splitter is a vertical bar separating left/right panes.
- `.lm_vertical` — the splitter is a horizontal bar separating top/bottom panes.
- `.lm_dragging` — added to the splitter (and to `<body>`) while the user is dragging the resize handle.

### On `.z-goldenpanel`
- No ZK-added state classes. The panel content is a plain div. GoldenLayout adds no class to the panel node itself.

### On `.z-goldenlayout` (outer wrapper)
- No ZK-added state classes beyond the root zclass. `disabled`/`readonly` are not supported by GoldenLayout.

## Attribute support

- `hflex` / `vflex` on `<goldenlayout>` — standard ZK flex; the outer wrapper expands to fill its parent.
- `orient="vertical"` on `<goldenlayout>` — changes the root layout direction; no CSS class emitted, JS-only behaviour.
- `areas` attribute on `<goldenlayout>` — grid string defining how panels are laid out; JS-only, no CSS effect.
- `area=` on `<goldenpanel>` — places the panel in the named cell; JS-only.
- `title=` on `<goldenpanel>` — text shown in `.lm_title` inside the tab.
- `draggable="false"` on `<goldenpanel>` — prevents JS drag listener from being attached; no CSS class emitted.
- `droppable="false"` on `<goldenpanel>` — disables drop targets for this stack; no CSS class emitted.
- `closable="false"` on `<goldenpanel>` — hides the `.lm_close_tab` icon for this tab; no CSS class emitted.

## Composition invariants

- Header height is read from the computed `min-height` of `.lm_header` at `bind_` time and passed into `config.dimensions.headerHeight`. The CSS `min-height` on `.lm_header` is therefore load-bearing: change it and the entire layout recalculates.
- Splitter width (horizontal) and height (vertical) are controlled by `config.dimensions.borderWidth` (set to `8` in `bind_`). The CSS width/height of `.lm_splitter` does not need to be set — GoldenLayout sets it inline.
- The `.z-goldenpanel` node is not a direct child of `.z-goldenlayout` in the live DOM; it is nested inside `.lm_content > .lm_item`. CSS selectors that assume `.z-goldenlayout > .z-goldenpanel` will not match.
- `.z-goldenlayout-dragProxy` appears at document root during drag, not scoped inside `.z-goldenlayout`. Selectors like `.z-goldenlayout-dragProxy .lm_tab` will match it independently.
- The `.lm_tab::after` pseudo-element slot is used for the active-tab underline indicator. The pseudo-element is generated inside `.lm_active` tabs via `.lm_tab.lm_active::after` — it has `display: block` and a fixed height; themes set the background-color and margin.

## Sibling decomposition

- Tab chrome (tab strip, active indicator, header background): similar in intent to `tabbox` (see `components/tabbox.md`), but implemented via `lm_*` classes — the structural parallel informs the design pattern.
- Splitter resize bar: parallels `splitter` (see `components/splitter.md`) in function; same hover/drag visual expectations.
- Pane content area (`.z-goldenpanel`): analogous to a plain surface container — no ZK component equivalent.

## Contract

`goldenlayout.css.dsp` — shipped as `src/main/resources/web/js/zkmax/goldenlayout/css/goldenlayout.css`, which ZK loads as `goldenlayout.css.dsp`.

## Edition

EE (zkmax)

## Notes

- **theme-bridge approach**: GoldenLayoutJS ships its own base CSS bundled in `goldenlayout.js`. ZK themes do NOT import a GoldenLayout light/dark theme file — they override the `lm_*` selectors directly under `.z-goldenlayout` scope. Write all `lm_*` style rules scoped under `.z-goldenlayout .lm_*` in `goldenlayout.css`. GoldenLayout 2.x exposes no CSS custom properties, so there is no variable bridge.
- **The `forbidden-selectors: .lm_*` rule in the previous contract was wrong.** The `lm_*` namespace is library-internal DOM but it is fully CSS-reachable and must be styled. Scoping under `.z-goldenlayout` prevents bleed.
- **`box-sizing: content-box !important`**: GoldenLayoutJS's structural CSS sets `box-sizing: content-box !important` on all `[class^=lm_]` descendants of `.lm_header`. Any border or padding added to `.lm_header` child elements must account for this.
- **Icon rendering**: ZK's shipped LESS uses FontAwesome glyph codes (`\f00d` for ×, `\f065` for expand, `\f066` for restore) via `::after` pseudo-elements on `.lm_controls li` and `.lm_close_tab::before`. Any theme must supply icon content for `.lm_close::after`, `.lm_maximise::after`, and `.lm_close_tab::before` — either FontAwesome codes or alternative `content:` values.
- **Dropdown**: when more tabs exist than fit in the header, a `.lm_tabdropdown` control shows a dropdown arrow. The overflow list is rendered as a `<ul>` given the class `z-goldenlayout-dropdown` and positioned absolutely in the viewport. This is a ZK-assigned class (not an `lm_` class), so it is fully under theme control.
- **Drop-target indicator**: `.z-goldenlayout-dropTargetIndicator` (again a ZK-assigned class, not `lm_*`) wraps a `.lm_inner` div. The outer element receives a dashed border; the inner receives a translucent fill. Both are theme-owned.
