# paging

Pagination bar rendered below data components (listbox, grid, tree).

## DOM structure

```
.z-paging                          (root <nav> container)
└─ ul                              (button list — needs display: flex; list-style: none)
   ├─ .z-paging-button             (navigation button)
   │   ├─ .z-paging-previous       (← previous page — NOT .z-paging-prev)
   │   ├─ .z-paging-next           (→ next page)
   │   ├─ .z-paging-first          (« first page)
   │   └─ .z-paging-last           (» last page)
   └─ .z-paging-icon               (icon inside each button)
.z-paging-input                    (page-number input field)
.z-paging-text                     (label text: "Total:", "Page:", etc.)
```

## Critical naming trap

The previous-page button is `.z-paging-previous`, **NOT** `.z-paging-prev`. Writing `.z-paging-prev` rules in CSS will have no effect — the class never appears in the DOM.

## State classes

- `.z-paging-selected` — active page-number button
- `.z-paging-os` — OS-style layout variant (no bottom border)

## CSS file

`paging.css.dsp`

## Note

Stub entry — full documentation pending spec-author run (Phase 3/4).
See `doc/spec-author-pipeline-plan.md`.
