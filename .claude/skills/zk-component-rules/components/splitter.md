# splitter

A draggable divider between layout regions (typically inside `hbox`/`vbox` or `borderlayout`).

## Delivery: merged into `box.css.dsp`

Despite the source file `js/zul/box/css/splitter.css` existing, the build merges its content into `box.css.dsp`. There is no standalone `splitter.css.dsp` served to the browser. Edits to splitter styles end up in `box.css`.

See `reference/css-file-bundling.md` for the full list of delivery quirks.

## DOM structure

```
.z-splitter[.z-splitter-{horizontal|vertical}][.z-splitter-nosplitter]
├─ .z-splitter-button            (the draggable handle visible to the user)
└─ .z-splitter-ghost             (drag preview, shown during drag operation)
```

## Cursor mode

- `.z-splitter-horizontal` → cursor `col-resize` (drag left/right)
- `.z-splitter-vertical` → cursor `row-resize` (drag up/down)

(The naming is from the perspective of the parent container's orientation, so "horizontal splitter inside a horizontal layout" lets you drag left/right.)

## Disabled

`.z-splitter-nosplitter` — the splitter renders but is not draggable. Useful as a static visual divider.

## Ghost during drag

`.z-splitter-ghost` is shown only during the drag operation. Style it with a low-opacity highlight to indicate the drag target.
