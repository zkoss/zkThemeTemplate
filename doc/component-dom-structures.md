# ZK Component DOM Structures

CSS classes verified against iceblue_c 10.3.0.1 theme files (`temp/iceblue_c-10.3.0.1/web/iceblue_c/js/zul/`).

---

## Known DOM Quirks

Non-obvious class names that differ from intuitive guesses:

| Component | Wrong Guess | Correct Class |
|-----------|------------|---------------|
| Panel content area | `.z-panel-content` | `.z-panelchildren` |
| Rating star | `.z-rating-star` | `.z-rating-icon` |
| Progressmeter fill | `.z-progressmeter-bar` | `.z-progressmeter-image` |
| Paging previous button | `.z-paging-prev` | `.z-paging-previous` |
| Listcell content | `.z-listcell-cnt` | `.z-listcell-content` |
| Treecell content | `.z-treecell-cnt` | `.z-treecell-content` |
| Grid cell content | `.z-cell-cnt` | `.z-row-content` |
| Groupbox content | `.z-groupbox-body` | `.z-groupbox-content` |
| BorderLayout positioning | `display: flex` | `position: absolute` on regions (JS layout engine) |
| Menubar child structure | `.z-menubar > .z-menu` | `.z-menubar > ul > li > .z-menu` |

---

## Buttons

### Button (`.z-button`)

**CSS File**: `js/zul/wgt/css/button.css.dsp`

**Key CSS Classes**:
- `.z-button` — root `<button>` element
- `.z-button-image` — image/icon child element

**State Classes**:
- `:hover` — hover state
- `:focus` — focus state
- `:active` — active/pressed state
- `[disabled]` — disabled state

---

### Combobutton (`.z-combobutton`)

**CSS File**: `js/zul/wgt/css/combobutton.css.dsp`

**Key CSS Classes**:
- `.z-combobutton` — root `<span>` container
- `.z-combobutton-content` — main button content area
- `.z-combobutton-button` — dropdown arrow segment (right half)
- `.z-combobutton-icon` — icon inside dropdown segment
- `.z-combobutton-image` — image element

**State Classes**:
- `:hover`, `:focus`, `:active` — standard states
- `[disabled]` — disabled state
- `.z-combobutton-open` — when popup is open
- `.z-combobutton-toolbar` — lighter styling for toolbar context

---

### Toolbarbutton (`.z-toolbarbutton`)

**CSS File**: `js/zul/wgt/css/toolbar.css.dsp`

**Key CSS Classes**:
- `.z-toolbarbutton` — root element
- `.z-toolbarbutton-content` — text/icon content wrapper

**State Classes**:
- `:hover`, `:focus`, `:active`, `[disabled]` — standard states
- `.z-toolbarbutton-checked` — toggled/checked state

---

## Inputs

### Textbox / Intbox / Decimalbox (`.z-textbox`)

**CSS File**: `js/zul/inp/css/input.css.dsp`

**Notes**: `.z-decimalbox`, `.z-intbox`, `.z-longbox`, `.z-doublebox` share identical styling with `.z-textbox`.

**State Classes**:
- `:hover`, `:focus`, `[disabled]`, `[readonly]` — standard states
- `.z-textbox-invalid` — validation error state

---

### Combobox / Bandbox / Datebox / Timebox / Spinner (`.z-combobox`)

**CSS File**: `js/zul/inp/css/combo.css.dsp`

**Key CSS Classes**:
- `.z-combobox` — root `<span>` container (inline-block)
- `.z-combobox-input` — text input field
- `.z-combobox-button` — dropdown toggle button
- `.z-combobox-popup` — popup container (rendered separately, position: absolute)
- `.z-combobox-content` — popup list `<ul>`
- `.z-comboitem` — individual `<li>` item
- `.z-comboitem-content` — item text wrapper
- `.z-comboitem-selected` — selected item

**State Classes**:
- `.z-combobox-hover`, `.z-combobox-disabled`, `.z-combobox-invalid`, `.z-combobox-readonly`
- `.z-combobox-open` — popup visible
- `.z-combobox-inplace` — inplace editing mode

**Notes**: Datebox, Bandbox, Timebox, Spinner follow the same `.z-{component}-input / .z-{component}-button` pattern.

---

### Slider (`.z-slider`)

**CSS File**: `js/zul/inp/css/slider.css.dsp`

**Key CSS Classes**:
- `.z-slider` — root container
- `.z-slider-center` — track area
- `.z-slider-button` — thumb/handle
- `.z-slider-area` — filled portion
- `.z-slider-input` — optional value input
- `.z-slider-horizontal` / `.z-slider-vertical` — orientation

**State Classes**:
- `.z-slider-sphere` — round knob variant
- `.z-slider-scale` — with tick marks
- `.z-slider-indeterminate` — indeterminate state

---

## Selection

### Checkbox (`.z-checkbox`)

**CSS File**: `js/zul/wgt/css/checkbox.css.dsp`

**Variants**: default, switch (`.z-checkbox-switch`), toggle (`.z-checkbox-toggle`)

**Key CSS Classes (default)**:
- `.z-checkbox` — root `<label>` element
- `.z-checkbox-input` — hidden native `<input type="checkbox">`
- `.z-checkbox-mold` — custom visual element
- `.z-checkbox-content` — label text

**Switch/Toggle Variants**:
- `.z-checkbox-switch-on` / `.z-checkbox-switch-off` — switch states
- `.z-checkbox-toggle-on` / `.z-checkbox-toggle-off` — toggle states

**State Classes**:
- `[checked]` — checked state on `<input>`
- `[disabled]` — disabled state
- `:focus-visible` — focus ring

---

### Selectbox (`.z-selectbox`)

**CSS File**: `js/zul/wgt/css/selectbox.css.dsp`

**Notes**: Native `<select>` element with `-webkit-appearance: none` and custom SVG dropdown icon as background-image. All states handled via standard CSS pseudo-classes.

---

## Data Components

### Listbox (`.z-listbox`)

**CSS File**: `js/zul/sel/css/listbox.css.dsp`

**Key CSS Classes**:
- `.z-listbox` — root `<div>` container
- `.z-listbox-header` / `.z-listbox-body` / `.z-listbox-footer` — sections
- `.z-listhead` — `<thead>` group
- `.z-listheader` — `<th>` header cell
- `.z-listheader-content` — header text wrapper
- `.z-listitem` — `<tr>` row
- `.z-listcell` — `<td>` cell
- `.z-listcell-content` — cell text wrapper (NOT `.z-listcell-cnt`)
- `.z-listgroup` — group header row
- `.z-listgroup-inner` — group content wrapper
- `.z-listfooter` — footer row
- `.z-listfooter-content` — footer cell content

**State Classes**:
- `.z-listitem-selected` — selected row
- `.z-listitem-focus` — focused row
- `.z-listitem-disabled` — disabled row
- `.z-listitem-checkable` — row has checkbox
- `.z-listitem-radio` — radio variant (border-radius: 50%)
- `.z-listheader-sort` / `.z-listheader-sorticon` — sorting
- `.z-listbox-odd` — alternate row stripe

---

### Grid (`.z-grid`)

**CSS File**: `js/zul/grid/css/grid.css.dsp`

**Key CSS Classes**:
- `.z-grid` — root `<div>` container
- `.z-grid-header` / `.z-grid-body` / `.z-grid-footer` — sections
- `.z-columns` — `<thead>` group
- `.z-column` — `<th>` header cell
- `.z-column-content` — header content wrapper
- `.z-row` — `<tr>` data row
- `.z-cell` — `<td>` cell
- `.z-row-content` — cell content wrapper (NOT `.z-cell-content`)
- `.z-group` — group header row
- `.z-group-inner` / `.z-group-content` — group wrappers
- `.z-groupfoot` / `.z-groupfoot-content` — group footer

**State Classes**:
- `.z-row-hover` — hover state (applied by JS)
- `.z-column-sort` / `.z-column-sorticon` — sorting
- `.z-group-open` — expanded group
- `.z-grid-odd` — alternate row stripe
- `.z-column-sizing` — column being resized

---

### Tree (`.z-tree`)

**CSS File**: `js/zul/sel/css/tree.css.dsp`

**Key CSS Classes**:
- `.z-tree` — root `<div>` container
- `.z-tree-header` / `.z-tree-body` / `.z-tree-footer` — sections
- `.z-treecols` — `<thead>` group
- `.z-treecol` — `<th>` header cell
- `.z-treecol-content` — header content wrapper
- `.z-treerow` — `<tr>` data row
- `.z-treecell` — `<td>` cell
- `.z-treecell-content` — content wrapper including icon + text (NOT `.z-treecell-cnt`)
- `.z-treecell-text` — text-only portion
- `.z-tree-icon` — expand/collapse icon
- `.z-tree-line` — branch connector line

**State Classes**:
- `.z-treerow-selected` — selected row
- `.z-treerow-focus` — focused row
- `.z-treerow-disabled` — disabled row
- `.z-treerow-checkable` — has checkbox
- `.z-treerow-partial` — partially checked (group node)
- `.z-treecol-sort` / `.z-treecol-sorticon` — sorting

---

## Navigation

### Tabbox (`.z-tabbox`)

**CSS File**: `js/zul/tab/css/tabbox.css.dsp`

**Key CSS Classes**:
- `.z-tabbox` — root container
- `.z-tabs` — tab strip container
- `.z-tabs-content` — tab `<ul>` list
- `.z-tab` — individual tab `<li>`
- `.z-tab-content` — tab clickable area
- `.z-tab-text` — tab label
- `.z-tab-icon` — tab icon
- `.z-tab-button` — close/action button (position: absolute, right)
- `.z-tabpanels` — panels container
- `.z-tabpanel` — individual panel

**Orientation Classes**:
- `.z-tabbox-top` (default) / `.z-tabbox-bottom` / `.z-tabbox-left` / `.z-tabbox-right` / `.z-tabbox-accordion`

**State Classes**:
- `.z-tab-selected` — active tab
- `.z-tab-disabled` — disabled tab
- `.z-tabbox-scroll` — scrolling mode active
- `.z-tabbox-left-scroll` / `.z-tabbox-right-scroll` — scroll buttons

---

### Menu / Menubar

**CSS File**: `js/zul/menu/css/menu.css.dsp`

**Key CSS Classes**:
- `.z-menubar` — root menu bar
- `.z-menubar-horizontal` / `.z-menubar-vertical` — orientation
- **IMPORTANT**: menubar DOM is `ul > li` — actual menu items are at `.z-menubar > ul > li > .z-menu`
- `.z-menu` — top-level menu item (may have submenu)
- `.z-menu-content` — clickable area
- `.z-menu-text` — label text
- `.z-menu-image` — icon element
- `.z-menu-icon` — submenu indicator (right arrow)
- `.z-menupopup` — submenu popup (position: absolute)
- `.z-menupopup-content` — submenu `<ul>`
- `.z-menuitem` — submenu item
- `.z-menuitem-content` — item clickable area
- `.z-menuitem-text` — item text
- `.z-menuitem-image` — item icon
- `.z-menuitem-icon` — checkmark icon
- `.z-menuitem-checkable` — has checkbox
- `.z-menuseparator` — separator line

**State Classes**:
- `.z-menu-selected` — open/active top menu
- `.z-menuitem-selected` — selected submenu item
- `.z-menuitem-checked` — checkbox checked
- `[disabled]` — disabled item

---

## Containers

### Window (`.z-window`)

**CSS File**: `js/zul/wnd/css/window.css.dsp`

**Key CSS Classes**:
- `.z-window` — root container
- `.z-window-header` — title bar (plain text node inside — no `.z-window-title` child)
- `.z-window-header-move` — movable title bar (cursor: move)
- `.z-window-content` — main content area
- `.z-window-icons` — button group (float: right)
- `.z-window-icon` — individual icon button
- `.z-window-minimize` / `.z-window-maximize` / `.z-window-close` — action buttons

**State Classes**:
- `.z-window-shadow` / `.z-window-noborder` / `.z-window-noheader` / `.z-window-embedded`
- `.z-window-move-ghost` — drag ghost (opacity: 0.65)
- `.z-window-resize-faker` — resize indicator (dashed border)

---

### Panel (`.z-panel`)

**CSS File**: `js/zul/wnd/css/panel.css.dsp`

**Key CSS Classes**:
- `.z-panel` — root container
- `.z-panel-head` — header wrapper
- `.z-panel-header` — title bar (plain text node — no `.z-panel-title` child)
- `.z-panel-header-move` — movable header
- `.z-panel-body` — outer body wrapper
- `.z-panelchildren` — inner content area (NOT `.z-panel-content`)
- `.z-panel-icons` — button group
- `.z-panel-icon` — individual icon button (`.z-panel-close`, etc.)

**State Classes**:
- `.z-panel-collapsed` — collapsed state
- `.z-panel-shadow` / `.z-panel-noborder` / `.z-panel-3d`
- `.z-panel-move-ghost` / `.z-panel-resize-faker`

---

### Groupbox (`.z-groupbox`)

**CSS File**: `js/zul/wgt/css/groupbox.css.dsp`

**Key CSS Classes**:
- `.z-groupbox` — root container
- `.z-groupbox-header` — title bar
- `.z-groupbox-title` / `.z-groupbox-title-content` — title text
- `.z-groupbox-content` — content area (NOT `.z-groupbox-body`)

**State Classes**:
- `.z-groupbox-collapsed` — collapsed
- `.z-groupbox-readonly` — title not clickable
- `.z-groupbox-notitle` — no visible title
- `.z-groupbox-3d` — 3D style variant

---

### Popup (`.z-popup`)

**CSS File**: `js/zul/wgt/css/popup.css.dsp`

**Key CSS Classes**:
- `.z-popup` — root container (position: absolute)
- `.z-popup-content` — content wrapper (has shadow)

---

### Notification (`.z-notification`)

**CSS File**: `js/zul/wgt/css/popup.css.dsp`

**Key CSS Classes**:
- `.z-notification` — root
- `.z-notification-content` — content wrapper
- `.z-notification-icon` — icon element
- `.z-notification-close` — close button

**Severity**: `.z-notification-info`, `.z-notification-warning`, `.z-notification-error`

---

### Toast (`.z-toast`)

**CSS File**: `js/zul/wgt/css/popup.css.dsp`

**Key CSS Classes**:
- `.z-toast` — root (will-change: opacity)
- `.z-toast-content` — content wrapper
- `.z-toast-position` — flexbox container for stacking toasts
- `.z-toast-position-{top|middle|bottom}-{left|center|right}` — 9 position variants

**Severity**: `.z-toast-info`, `.z-toast-warning`, `.z-toast-error`

---

### Caption (`.z-caption`)

**CSS File**: `js/zul/wgt/css/caption.css.dsp`

**Key CSS Classes**:
- `.z-caption` — root element
- `.z-caption-content` — content wrapper (plain text node — no `.z-caption-text` child)
- `.z-caption-label` — label element
- `.z-caption-image` — image element

---

### InputGroup (`.z-inputgroup`)

**CSS File**: `js/zul/wgt/css/inputgroup.css.dsp`

**Key CSS Classes**:
- `.z-inputgroup` — root container (display: inline-flex)
- `.z-inputgroup-text` — label/addon text (display: flex, align-items: center)
- `.z-inputgroup-vertical` — vertical stacking mode

---

## Common Widgets

### Separator (`.z-separator`)

**CSS File**: `js/zul/wgt/css/separator.css.dsp`

**Key CSS Classes**:
- `.z-separator` — root element (base: transparent — no color on its own)
- `.z-separator-horizontal` — horizontal `<hr>`-like line
- `.z-separator-horizontal-bar` — the colored version of horizontal separator
- `.z-separator-vertical` — vertical spacing element (no visible bar)

**Warning**: `.z-separator-vertical` (rendered by `<space/>`) must NOT receive a background-color — it's a spacer, not a divider.

---

### Progressmeter (`.z-progressmeter`)

**CSS File**: `js/zul/wgt/css/progressmeter.css.dsp`

**Key CSS Classes**:
- `.z-progressmeter` — root container
- `.z-progressmeter-image` — filled portion (NOT `.z-progressmeter-bar`)
- `.z-progressmeter-indeterminate` — animated indeterminate state

**Related**:
- `.z-loadingbar` / `.z-loadingbar-colorbar` / `.z-loadingbar-indeterminate` — loading bar variant

---

### Rating (`.z-rating`)

**CSS File**: `js/zul/wgt/css/rating.css.dsp`

**Key CSS Classes**:
- `.z-rating` — root container (display: inline-block)
- `.z-rating-icon` — individual star element (NOT `.z-rating-star`)
- `.z-rating-vertical` — vertical layout

**State Classes**:
- `.z-rating-selected` — filled star
- `.z-rating-hover` — hovered star (text-shadow highlight)
- `.z-rating-disabled` — disabled (opacity: 0.5)
- `.z-rating-readonly` — readonly (cursor: default)

---

### Toolbar (`.z-toolbar`)

**CSS File**: `js/zul/wgt/css/toolbar.css.dsp`

**Key CSS Classes**:
- `.z-toolbar` — root element (display: block)
- `.z-toolbar-horizontal` / `.z-toolbar-vertical` — orientation
- `.z-toolbar-start` — left/top content (float: left)
- `.z-toolbar-end` — right/bottom content (float: right)
- `.z-toolbar-center` — center content
- `.z-toolbar-content` — children wrapper
- `.z-toolbar-overflowpopup` — overflow container
- `.z-toolbar-overflowpopup-button` — overflow "more" button
- `.z-toolbar-overflowpopup-on` — overflow popup visible
- `.z-toolbar-tabs` — when inside tabbox (position: absolute, right: 0, top: 0)

---

### Link (`.z-a`)

**CSS File**: `js/zul/wgt/css/a.css.dsp`

**Key CSS Classes**:
- `.z-a` — anchor element

**State Classes**: `:hover`, `:visited`, `[disabled]`

---

## Mesh / Shared Data Components

### Paging (`.z-paging`)

**CSS File**: `js/zul/mesh/css/paging.css.dsp`

**Key CSS Classes**:
- `.z-paging` — root `<nav>` container
- `.z-paging ul` — button list (needs `display: flex; list-style: none`)
- `.z-paging-button` — navigation button
- `.z-paging-previous` — previous page button (NOT `.z-paging-prev`)
- `.z-paging-next` — next page button
- `.z-paging-first` — first page button
- `.z-paging-last` — last page button
- `.z-paging-icon` — icon inside button
- `.z-paging-input` — page number input
- `.z-paging-text` — label text (e.g. "Total:", "Page:")
- `.z-paging-selected` — active page number button
- `.z-paging-os` — OS-style layout (no bottom border)

---

### AuxHead (`.z-auxhead`)

**CSS File**: `js/zul/mesh/css/auxhead.css.dsp`

**Key CSS Classes**:
- `.z-auxhead` — auxiliary header row group
- `.z-auxhead-bar` — bar styling
- `.z-auxheader` — individual auxiliary header cell
- `.z-auxheader-content` — cell content wrapper

---

### Frozen Columns (`.z-frozen`)

**CSS File**: `js/zul/mesh/css/frozen.css.dsp`

**Key CSS Classes**:
- `.z-frozen` — root container
- `.z-frozen-body` — left fixed area
- `.z-frozen-inner` — scrollable inner area
- `.z-frozen-right` — right scrollable area
- `.z-frozen-col` — frozen column cell
- `.z-frozen-right-col` — sticky-right column
- `.z-frozen-sticky` — sticky positioned element (z-index: 1)

---

## Layout

### Box / HLayout / VLayout

**CSS Files**: `js/zul/box/css/box.css.dsp`, `js/zul/box/css/layout.css.dsp`

**Key CSS Classes**:
- `.z-hbox` / `.z-vbox` — hbox/vbox root
- `.z-hlayout` / `.z-vlayout` — hlayout/vlayout root
- `.z-hlayout-inner` / `.z-vlayout-inner` — child wrapper elements
- `.z-hbox-separator` / `.z-vbox-separator` — separator between children
- `.z-splitter` — splitter bar between panes
- `.z-splitter-horizontal` / `.z-splitter-vertical` — orientation
- `.z-splitter-button` — splitter handle
- `.z-splitter-ghost` — drag indicator
- `.z-splitter-nosplitter` — disabled splitter

**Alignment**:
- `.z-valign-top` / `.z-valign-middle` / `.z-valign-bottom`
- `.z-flex` — enables flex layout

---

### BorderLayout (`.z-borderlayout`)

**CSS File**: `js/zul/layout/css/borderlayout.css.dsp`

**CRITICAL**: BorderLayout regions are positioned by ZK's JavaScript layout engine using `position: absolute`. **Never use `display: flex` on `.z-borderlayout`** — it breaks the JS engine.

**Key CSS Classes**:
- `.z-borderlayout` — root container (`position: relative`)
- `.z-north` / `.z-south` / `.z-east` / `.z-west` / `.z-center` — region divs (all `position: absolute`)
- `.z-{region}-body` — region content area (e.g. `.z-west-body`)
- `.z-{region}-header` — optional region title
- `.z-{region}-collapsed` — collapsed state toggle button
- `.z-{region}-splitter` — draggable splitter bar
- `.z-{region}-splitter-button` — splitter handle
- `.z-{region}-icon` — collapse/expand icon on splitter
- `.z-{region}-title` — region title text
- `.z-{region}-noborder` — border: 0 on region

**Z-index layers** (JS-managed): north: 16, south: 14, east: 10, west: 12, center: 8

---

### AbsoluteLayout (`.z-absolutelayout`)

**CSS File**: `js/zul/layout/css/absolutelayout.css.dsp`

**Key CSS Classes**:
- `.z-absolutelayout` — root container (`position: relative; height: 100%`)
- `.z-absolutechildren` — child wrapper (`position: absolute`)

---

### AnchorLayout (`.z-anchorlayout`)

**CSS File**: `js/zul/layout/css/anchorlayout.css.dsp`

**Key CSS Classes**:
- `.z-anchorlayout` — root container
- `.z-anchorlayout-body` — content wrapper
- `.z-anchorchildren` — child element (`float: left`)

---

### Calendar (`.z-calendar`)

**CSS File**: `js/zul/db/css/calendar.css.dsp`

**Notes**: ZK Calendar renders as an HTML `<table>`, not a flex/grid container.

**Key CSS Classes**:
- `.z-calendar` — root container (`<table>`)
- `.z-calendar-title` — month/year header `<th>`
- `.z-calendar-header` — navigation row
- `.z-calendar-left` / `.z-calendar-right` — prev/next nav buttons
- `.z-calendar-icon` — button icons
- `.z-calendar-body` — dates `<tbody>`
- `.z-calendar-cell` — individual date `<td>`
- `.z-calendar-decade` / `.z-calendar-month` / `.z-calendar-year` — view mode classes
- `.z-calendar-wk` — week-of-year `<td>`
- `.z-calendar-selected` — selected date cell
- `.z-calendar-today` — today indicator
- `.z-calendar-weekend` / `.z-calendar-weekday` — day-type styling
- `.z-calendar-outrange` / `.z-calendar-outside` — out-of-month / disabled dates
- `.z-datebox-popup` — popup container for datebox (position: absolute)
- `.z-datebox-timezone` — timezone selector row
