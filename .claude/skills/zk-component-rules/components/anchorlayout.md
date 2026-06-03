# anchorlayout

A container where children fill a percentage of the parent's width, flowing left-to-right with float layout.

## DOM structure

```
.z-anchorlayout                    (root container)
└─ .z-anchorlayout-body            (content wrapper)
   └─ .z-anchorchildren * N        (each child — float: left; width set by anchor= attribute)
```

## Float-based layout

Children use `float: left`. This means:
- The container needs `overflow: hidden` (or a clearfix) to contain floated children.
- Do not substitute flex/grid for the float — ZK's layout calculation depends on the float model.

## CSS file

`anchorlayout.css.dsp` (may be bundled with borderlayout in some versions — see `reference/css-file-bundling.md`)

## Note

Stub entry — full documentation pending spec-author run (Phase 3/4).
See `doc/spec-author-pipeline-plan.md`.
