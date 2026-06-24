# Decision: keep `display` as its own utility (don't bundle into `z-grid-cols-*` / flex utilities)

**Date:** 2026-06-24
**Status:** Decided — keep `display` separate; one utility = one declaration.

## Question

`z-grid-cols-*` does nothing without `z-d-grid`, so `z-d-grid z-grid-cols-3` is always
written together. If `display:grid` is always required, why not put `display: grid`
inside `z-grid-cols-*` directly? Same question for flex: if `display:flex` is required
for `justify-*` / `align-*`, why not bundle it there too?

## Analysis

### The premise ("display is always required") is false for most of these utilities
`gap`, `justify-content`, and `align-items` are valid on **both** flex *and* grid
containers. A real composition proves it:

```
z-d-grid z-grid-cols-3 z-gap-4 z-justify-center
```

Here `z-gap-4` and `z-justify-center` decorate a **grid**, not a flex box. If
`z-justify-center` baked in `display:flex`, it would clobber the grid display — a real
bug. So `display` cannot be bundled into the justify/align/gap utilities at all.

### Invariant: one utility = one CSS declaration; `display` is its own utility
- Cost: one extra token (`z-d-grid` / `z-d-flex`).
- Benefits:
  - No utility ever fights another's `display`.
  - `display` can change independently — responsive `z-d-block` (mobile) → `z-d-grid`
    (desktop) while `z-grid-cols-3` stays put; conditional toggling; etc.
  - Self-documenting at the call site: `z-d-grid z-grid-cols-3` reads as "a 3-col grid".
- This matches the Tailwind mental model the family already follows.

### The grid-cols case is the only one where bundling would be *safe*
`grid-template-columns` is inert without `display:grid|inline-grid`, so baking
`display:grid` into `z-grid-cols-*` / `z-grid-fill*` would not break anything. But:
- It makes grid-cols the **one** 2-property exception, fragmenting the model.
- It does **not** help the flex side (`justify`/`align`/`gap` still can't bundle).
- It loses the independent-display benefits above.

Not worth a special case for a one-token saving.

## Decision

Keep `display` as a standalone utility (`z-d-grid`, `z-d-flex`, …). Property utilities
(`z-grid-cols-*`, `z-grid-fill*`, `z-flex-row/col`, `z-justify-*`, `z-align-*`, `z-gap-*`)
each set exactly one declaration and compose with the chosen display.

If verbosity ever becomes a pain point, address it with a documented convention or a
small number of explicit composite helper classes — not by baking `display` into
property utilities.
