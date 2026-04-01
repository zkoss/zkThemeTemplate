# CSS DSP File Structure

This document defines all required `*.css.dsp` files for the **zk-material** theme, based on the Ice Blue Compact theme (`iceblue_c-10.3.0.1`) as the reference product.

All files reside under:
```
src/main/resources/web/zk-material/
```

Legend: ✅ = implemented in `target/classes/web/zk-material/` | ❌ = missing

---

## 1. ZK Core Components (`zul`)

### Top-level CSS
| File | Status |
|------|--------|
| `zul/css/norm.css.dsp` | ✅ |
| `zul/css/footer.css.dsp` | ✅ |
| `zul/font/font-awesome.css.dsp` | ❌ |

### Box / Layout
| File | Status |
|------|--------|
| `js/zul/box/css/box.css.dsp` | ✅ |
| `js/zul/box/css/layout.css.dsp` | ✅ |
| `js/zul/box/css/div.css.dsp` | ✅ (extra) |
| `js/zul/box/css/space.css.dsp` | ✅ (extra) |
| `js/zul/box/css/span.css.dsp` | ✅ (extra) |
| `js/zul/box/css/splitter.css.dsp` | ✅ (extra) |

### Layout
| File | Status |
|------|--------|
| `js/zul/layout/css/absolutelayout.css.dsp` | ✅ |
| `js/zul/layout/css/anchorlayout.css.dsp` | ✅ |
| `js/zul/layout/css/borderlayout.css.dsp` | ✅ |
| `js/zul/layout/css/html.css.dsp` | ✅ (extra) |
| `js/zul/layout/css/layout.css.dsp` | ✅ (extra) |

### Date / Calendar
| File | Status |
|------|--------|
| `js/zul/db/css/calendar.css.dsp` | ✅ |

### Grid
| File | Status |
|------|--------|
| `js/zul/grid/css/grid.css.dsp` | ✅ |

### Input
| File | Status |
|------|--------|
| `js/zul/inp/css/input.css.dsp` | ✅ |
| `js/zul/inp/css/combo.css.dsp` | ✅ |
| `js/zul/inp/css/slider.css.dsp` | ✅ |

### Menu
| File | Status |
|------|--------|
| `js/zul/menu/css/menu.css.dsp` | ✅ |
| `js/zul/menu/css/toolbarpanel.css.dsp` | ✅ (extra) |

### Mesh (shared grid/listbox infrastructure)
| File | Status |
|------|--------|
| `js/zul/mesh/css/auxhead.css.dsp` | ✅ |
| `js/zul/mesh/css/frozen.css.dsp` | ✅ |
| `js/zul/mesh/css/paging.css.dsp` | ✅ |

### Selection
| File | Status |
|------|--------|
| `js/zul/sel/css/listbox.css.dsp` | ✅ |
| `js/zul/sel/css/tree.css.dsp` | ✅ |
| `js/zul/sel/css/select.css.dsp` | ✅ (extra) |

### Tab
| File | Status |
|------|--------|
| `js/zul/tab/css/tabbox.css.dsp` | ✅ |

### Widget
| File | Status |
|------|--------|
| `js/zul/wgt/css/a.css.dsp` | ✅ |
| `js/zul/wgt/css/button.css.dsp` | ✅ |
| `js/zul/wgt/css/caption.css.dsp` | ✅ |
| `js/zul/wgt/css/checkbox.css.dsp` | ✅ |
| `js/zul/wgt/css/combobutton.css.dsp` | ✅ |
| `js/zul/wgt/css/groupbox.css.dsp` | ✅ |
| `js/zul/wgt/css/inputgroup.css.dsp` | ✅ |
| `js/zul/wgt/css/popup.css.dsp` | ✅ |
| `js/zul/wgt/css/progressmeter.css.dsp` | ✅ |
| `js/zul/wgt/css/rating.css.dsp` | ✅ |
| `js/zul/wgt/css/selectbox.css.dsp` | ✅ |
| `js/zul/wgt/css/separator.css.dsp` | ✅ |
| `js/zul/wgt/css/toolbar.css.dsp` | ✅ |
| `js/zul/wgt/css/cell.css.dsp` | ✅ (extra) |
| `js/zul/wgt/css/image.css.dsp` | ✅ (extra) |
| `js/zul/wgt/css/imagemap.css.dsp` | ✅ (extra) |
| `js/zul/wgt/css/label.css.dsp` | ✅ (extra) |
| `js/zul/wgt/css/misc.css.dsp` | ✅ (extra) |

### Window
| File | Status |
|------|--------|
| `js/zul/wnd/css/window.css.dsp` | ✅ |
| `js/zul/wnd/css/panel.css.dsp` | ✅ |
| `js/zul/wnd/css/bandpopup.css.dsp` | ✅ (extra) |

---

## 2. ZK Enterprise Components (`zkex`) — All Missing

| File | Notes |
|------|-------|
| `js/zkex/grid/css/grid.css.dsp` | ZK EE Enhanced Grid |
| `js/zkex/inp/css/colorbox.css.dsp` | Color picker input |
| `js/zkex/layout/css/columnlayout.css.dsp` | Column layout |
| `js/zkex/menu/css/fisheye.css.dsp` | Fisheye menu |
| `js/zkex/pdfviewer/css/pdfviewer.css.dsp` | PDF viewer |
| `js/zkex/slider/css/rangeslider.css.dsp` | Range slider |
| `js/zkex/slider/css/sliderbuttons.css.dsp` | Slider with buttons |

---

## 3. ZK Max Components (`zkmax`) — All Missing

### Tablet
| File | Notes |
|------|-------|
| `zkmax/css/tablet.css.dsp` | Tablet-specific overrides |

### Input
| File | Notes |
|------|-------|
| `js/zkmax/inp/css/cascader.css.dsp` | Cascading select |
| `js/zkmax/inp/css/chosenbox.css.dsp` | Chosen-style multi-select |
| `js/zkmax/inp/css/searchbox.css.dsp` | Search input box |
| `js/zkmax/inp/css/tbeditor.css.dsp` | Toolbar editor (input) |
| `js/zkmax/inp/css/timepicker.css.dsp` | Time picker |

### Layout
| File | Notes |
|------|-------|
| `js/zkmax/layout/css/cardlayout.css.dsp` | Card layout |
| `js/zkmax/layout/css/goldenlayout.css.dsp` | Golden Layout |
| `js/zkmax/layout/css/linelayout.css.dsp` | Line layout |
| `js/zkmax/layout/css/organigram.css.dsp` | Org chart |
| `js/zkmax/layout/css/portallayout.css.dsp` | Portal layout |
| `js/zkmax/layout/css/rowlayout.css.dsp` | Row layout |
| `js/zkmax/layout/css/scrollview.css.dsp` | Scroll view |
| `js/zkmax/layout/css/splitlayout.css.dsp` | Split layout |
| `js/zkmax/layout/css/tablelayout.css.dsp` | Table layout |

### Media
| File | Notes |
|------|-------|
| `js/zkmax/med/css/camera.css.dsp` | Camera widget |
| `js/zkmax/med/css/cropper.css.dsp` | Image cropper |
| `js/zkmax/med/css/video.css.dsp` | Video player |

### Navigation
| File | Notes |
|------|-------|
| `js/zkmax/nav/css/anchornav.css.dsp` | Anchor navigation |
| `js/zkmax/nav/css/coachmark.css.dsp` | Coach mark / onboarding |
| `js/zkmax/nav/css/nav.css.dsp` | Navigation menu |

### Selection
| File | Notes |
|------|-------|
| `js/zkmax/sel/css/listbox.css.dsp` | Max Listbox |
| `js/zkmax/sel/css/tree.css.dsp` | Max Tree |

### Widgets
| File | Notes |
|------|-------|
| `js/zkmax/wgt/css/drawer.css.dsp` | Drawer panel |
| `js/zkmax/wgt/css/dropupload.css.dsp` | Drop upload area |
| `js/zkmax/wgt/css/signature.css.dsp` | Signature pad |
| `js/zkmax/wgt/css/stepbar.css.dsp` | Step bar / stepper |

### Other
| File | Notes |
|------|-------|
| `js/zkmax/barscanner/css/barcodescanner.css.dsp` | Barcode scanner |
| `js/zkmax/big/css/biglistbox.css.dsp` | Big (virtual) listbox |
| `js/zkmax/cropper/css/cropper.css.dsp` | Cropper widget |
| `js/zkmax/goldenlayout/css/goldenlayout.css.dsp` | Golden layout (top-level) |
| `js/zkmax/grid/css/grid.css.dsp` | Max Grid |
| `js/zkmax/signature/css/signature.css.dsp` | Signature widget |
| `js/zkmax/slider/css/multislider.css.dsp` | Multi-range slider |
| `js/zkmax/tbeditor/css/tbeditor.css.dsp` | Toolbar editor (widget) |

---

## Summary

| Module | Required (iceblue_c) | Implemented | Missing |
|--------|---------------------|-------------|---------|
| `zul` (core) | 30 | 30+ | 1 (`font-awesome.css.dsp`) |
| `zkex` (enterprise) | 7 | 0 | 7 |
| `zkmax` (max) | 39 | 0 | 39 |
| **Total** | **76** | **~48** | **~28** |

> **Note:** The "extra" files in the current project (not in iceblue_c) are valid additions — they cover components that were split into separate files in our structure.

---

## Implementation Priority

1. **Phase 1 (ZK CE / Open Source)** — `zul` only → already implemented
2. **Phase 2 (ZK EE)** — Add `zkex` files (7 files)
3. **Phase 3 (ZK Max)** — Add `zkmax` files (39 files)
4. **Font** — Add `zul/font/font-awesome.css.dsp`
