# Decision: keep `z-grid-cols-*` / `z-grid-fill*` utility names

**Date:** 2026-06-24
**Status:** Decided — keep current naming.

## Question

The CSS-Grid layout utilities are prefixed `z-grid-*` (`z-grid-cols-1..6`,
`z-grid-cols-auto`, `z-grid-cols-auto-1fr`, `z-grid-fill`, `z-grid-fill-xs/sm/lg/xl`).
This is correct CSS-Grid terminology, but it sits in the same `z-grid-*` namespace
as ZK's **Grid component** root class `.z-grid`. Does this confuse users, and should
the utilities be renamed?

## Analysis

### 1. No actual CSS collision, and the sub-patterns are distinguishable
ZK Grid's own sub-classes are all **part-nouns**:

```
z-grid  z-grid-body  z-grid-header  z-grid-foot  z-grid-footer
z-grid-inner  z-grid-emph  z-grid-emptybody  z-grid-loading
z-grid-noborder  z-grid-odd  z-grid-paging  z-grid-striped
```

The utilities use a **CSS-property infix** shape (`-cols-N`, `-fill`) that does not
match that part-noun pattern. ZK source (`ZK10/zk/zul/.../js/zul/`) contains no
`z-grid-col*`. The concern is therefore cognitive / namespace-sharing, **not** a
cascade conflict — `.z-grid` matches only the exact token `z-grid`, never
`z-grid-cols-3`.

### 2. The overlap is not unique to grid
The whole utility family deliberately shares ZK's `z-` prefix (project convention:
`z-d-flex`, `z-gap-4`, `z-justify-*`). `z-flex-*` overlaps ZK's framework `.z-flex`
classes too. And `display:grid` is `z-d-grid` — the word "grid" is unavoidable in a
CSS-layout utility set. Singling out grid for a rename would make it the **one**
subfamily that breaks the `z-<css-concept>` pattern.

### 3. Rename cost
~160 occurrences across ~18 files — use-case/preview ZUL pages, `pv.css`, two
Playwright specs (`screenshot.spec.ts`, `tablet.spec.ts`), and
`doc/responsive-design.md`. A breaking change with test + doc churn.

### Alternatives considered
- `z-cols-3` / `z-fill` (drop "grid"): cleaner separation, but less
  self-documenting, diverges from the Tailwind `grid-cols-N` mental model, and
  still leaves `z-d-grid` containing "grid". Breaks the one-pattern consistency.
- `z-gtc-*` (grid-template-columns): too cryptic.
- Distinct utility prefix for all layout utils: overkill; breaks the whole family.

## Decision

**Keep the current names.** They are the consistent choice (`z-<css-concept>`
throughout), match the widely-known Tailwind model, and the collision they would
"fix" does not exist and is unlikely (ZK internal grid classes are part-nouns).

If the cognitive overlap proves bothersome, mitigate with **documentation, not
renaming**: note in the utility reference that `z-grid` (bare) is the ZK Grid
component, while `z-grid-cols-*` / `z-grid-fill*` are CSS-Grid layout utilities.
