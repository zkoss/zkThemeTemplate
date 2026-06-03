# inputgroup

Groups an input with a text label/addon (like Bootstrap's input-group pattern).

## DOM structure

```
.z-inputgroup                       (root — display: inline-flex)
├─ .z-inputgroup-text               (label/addon — display: flex; align-items: center)
└─ (input component children — textbox, combobox, etc.)
```

## Vertical mode

`orient="vertical"` adds `.z-inputgroup-vertical` to the root — children stack instead of laying out inline.

## CSS file

`inputgroup.css.dsp`

## Note

Stub entry — full documentation pending spec-author run (Phase 3/4).
See `doc/spec-author-pipeline-plan.md`.
