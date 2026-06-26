# CSS DSP File Structure

This document defines all required `*.css.dsp` files for the **marble** theme, based on the Ice Blue Compact theme (`iceblue_c-10.3.0.1`) as the reference product.

All files reside under:
```
src/main/resources/web/marble/
```

---

## 1. ZK Core Components (`zul`)

### Top-level CSS
- `zul/css/norm.css.dsp`
- `zul/css/footer.css.dsp`
- `zul/font/font-awesome.css.dsp`

### Box / Layout
- `js/zul/box/css/box.css.dsp`
- `js/zul/box/css/layout.css.dsp`
- `js/zul/box/css/div.css.dsp`
- `js/zul/box/css/space.css.dsp`
- `js/zul/box/css/span.css.dsp`

### Layout
- `js/zul/layout/css/absolutelayout.css.dsp`
- `js/zul/layout/css/anchorlayout.css.dsp`
- `js/zul/layout/css/borderlayout.css.dsp`
- `js/zul/layout/css/html.css.dsp`
- `js/zul/layout/css/layout.css.dsp`

### Date / Calendar
- `js/zul/db/css/calendar.css.dsp`

### Grid
- `js/zul/grid/css/grid.css.dsp`

### Input
- `js/zul/inp/css/input.css.dsp`
- `js/zul/inp/css/combo.css.dsp`
- `js/zul/inp/css/slider.css.dsp`

### Menu
- `js/zul/menu/css/menu.css.dsp`
- `js/zul/menu/css/toolbarpanel.css.dsp`

### Mesh (shared grid/listbox infrastructure)
- `js/zul/mesh/css/auxhead.css.dsp`
- `js/zul/mesh/css/frozen.css.dsp`
- `js/zul/mesh/css/paging.css.dsp`

### Selection
- `js/zul/sel/css/listbox.css.dsp`
- `js/zul/sel/css/tree.css.dsp`
- `js/zul/sel/css/select.css.dsp`

### Tab
- `js/zul/tab/css/tabbox.css.dsp`

### Widget
- `js/zul/wgt/css/a.css.dsp`
- `js/zul/wgt/css/button.css.dsp`
- `js/zul/wgt/css/caption.css.dsp`
- `js/zul/wgt/css/checkbox.css.dsp`
- `js/zul/wgt/css/combobutton.css.dsp`
- `js/zul/wgt/css/groupbox.css.dsp`
- `js/zul/wgt/css/inputgroup.css.dsp`
- `js/zul/wgt/css/popup.css.dsp`
- `js/zul/wgt/css/progressmeter.css.dsp`
- `js/zul/wgt/css/rating.css.dsp`
- `js/zul/wgt/css/selectbox.css.dsp`
- `js/zul/wgt/css/separator.css.dsp`
- `js/zul/wgt/css/toolbar.css.dsp`
- `js/zul/wgt/css/cell.css.dsp`
- `js/zul/wgt/css/image.css.dsp`
- `js/zul/wgt/css/imagemap.css.dsp`
- `js/zul/wgt/css/label.css.dsp`
- `js/zul/wgt/css/misc.css.dsp`

### Window
- `js/zul/wnd/css/window.css.dsp`
- `js/zul/wnd/css/panel.css.dsp`
- `js/zul/wnd/css/bandpopup.css.dsp`

---

## 2. ZK Enterprise Components (`zkex`)

- `js/zkex/grid/css/grid.css.dsp`
- `js/zkex/inp/css/colorbox.css.dsp`
- `js/zkex/layout/css/columnlayout.css.dsp`
- `js/zkex/menu/css/fisheye.css.dsp`
- `js/zkex/pdfviewer/css/pdfviewer.css.dsp`
- `js/zkex/slider/css/rangeslider.css.dsp`
- `js/zkex/slider/css/sliderbuttons.css.dsp`

---

## 3. ZK Max Components (`zkmax`)

### Tablet
- `zkmax/css/tablet.css.dsp` — **built bundle** (no longer a stub). Touch-optimized
  overrides injected by ZK's `TabletThemeURIHandler` at cascade position 1, **only
  on a mobile User-Agent** (EE). Concatenated by `scripts/build-css.js` (build stage 5,
  `tabletFiles`) from per-component source partials, kept split during development:
  ```
  src/main/resources/web/zkmax/css/tablet/
    _tokens.css      # tablet-scoped --zk-touch-* tokens (MUST be first)
    _inputs.css      # textbox + combo bundle
    _buttons.css     # button / toolbarbutton / combobutton
    _selection.css   # checkbox / radio / switch
    _mesh.css        # listbox / grid / tree rows + headers + paging
    _calendar.css    # calendar / datebox popup day cells
    _window.css      # window / panel headers + affordances
    _scrollbar.css   # biglistbox WScroll touch width
  ```
  Regression-guarded by the Playwright `tablet` project (`src/test/playwright/tablet.spec.ts`).

### Input
- `js/zkmax/inp/css/cascader.css.dsp`
- `js/zkmax/inp/css/chosenbox.css.dsp`
- `js/zkmax/inp/css/searchbox.css.dsp`
- `js/zkmax/inp/css/timepicker.css.dsp`

### Layout
- `js/zkmax/layout/css/cardlayout.css.dsp`
- `js/zkmax/layout/css/goldenlayout.css.dsp`
- `js/zkmax/layout/css/linelayout.css.dsp`
- `js/zkmax/layout/css/organigram.css.dsp`
- `js/zkmax/layout/css/portallayout.css.dsp`
- `js/zkmax/layout/css/rowlayout.css.dsp`
- `js/zkmax/layout/css/scrollview.css.dsp`
- `js/zkmax/layout/css/splitlayout.css.dsp`
- `js/zkmax/layout/css/tablelayout.css.dsp`

### Media
- `js/zkmax/med/css/camera.css.dsp`
- `js/zkmax/med/css/video.css.dsp`

### Navigation
- `js/zkmax/nav/css/anchornav.css.dsp`
- `js/zkmax/nav/css/coachmark.css.dsp`
- `js/zkmax/nav/css/nav.css.dsp`

### Selection
- `js/zkmax/sel/css/listbox.css.dsp`
- `js/zkmax/sel/css/tree.css.dsp`

### Widgets
- `js/zkmax/wgt/css/drawer.css.dsp`
- `js/zkmax/wgt/css/dropupload.css.dsp`
- `js/zkmax/wgt/css/stepbar.css.dsp`

### Other
- `js/zkmax/barscanner/css/barcodescanner.css.dsp`
- `js/zkmax/big/css/biglistbox.css.dsp`
- `js/zkmax/cropper/css/cropper.css.dsp`
- `js/zkmax/goldenlayout/css/goldenlayout.css.dsp`
- `js/zkmax/grid/css/grid.css.dsp`
- `js/zkmax/signature/css/signature.css.dsp`
- `js/zkmax/slider/css/multislider.css.dsp`
- `js/zkmax/tbeditor/css/tbeditor.css.dsp`
