# Data-table outer frame: grid / listbox / tree

How to evaluate the **outer frame** (component root border vs shadow) of the three mesh data
components, balancing MD3, Mira (MUI) alignment, and ZK's specifics. Companion to DESIGN.md
§Elevation and `doc/window-design-rules.md` (the same elevated-vs-outlined logic).

## The current inconsistency (2026-06-10)

| Component | root CSS today | container style | verdict |
|-----------|----------------|-----------------|---------|
| `.z-grid` | `border-radius` + `box-shadow(--zk-elevation-card)`, **no border** | Elevated | aligned |
| `.z-tree` | **`border:1px outline-variant`** + `box-shadow(--zk-elevation-card)` | border **+** shadow | drift |
| `.z-listbox` | **`border:1px outline-variant`** + `box-shadow(--zk-elevation-card)` | border **+** shadow | drift |

`.z-grid-standalone` (grid.css:18) *adds* a border to grid — but it is **not a ZK class**.
ZK emits no `*-standalone` zclass for grid/listbox/tree anywhere in source (verified
2026-06-11). Nothing in Marble applies it either (no ZUL `sclass`, no Java) → it is a **dead
rule**, like the dead `.z-grid-header-inner` reset. There is no parallel for listbox/tree.

**Consequence:** ZK gives **no built-in signal** for "embedded vs standalone." So the opt-in
cannot ride a ZK-generated class. The only two real mechanisms are:

1. **Manual sclass** — the theme *defines* `z-grid-standalone` and the app author *types*
   `sclass="z-grid-standalone"` in ZUL. Valid, but manual, undiscoverable, and currently
   unused/dead.
2. **Context selectors (preferred)** — the theme keys the frame off the *ancestor* with
   descendant selectors. ZK supports this and Marble already does it for form grids
   (`.z-panel-body .z-grid`, `.z-groupbox .z-grid` — grid.css:25-26). No manual class; the
   table adapts to where it is dropped.

Because there is no auto signal, **the default carries almost all the weight** — the
embedded-exception is the only override, and it can be detected by ancestor context.

## The three constraints

### 1. MD3 — the hard rule
A container is **either** *elevated* (shadow, no border) **or** *outlined* (border, no/low
shadow). **Never both.** Border + shadow is redundant double-emphasis and reads as heavier
than any single MD3 container level. → tree/listbox's current "border + shadow" is invalid
*regardless* of the other constraints; one of the two must go.

### 2. Mira (MUI) — what the reference actually does
Mira's **Simple Table** (`tables-simple-table.html`) wraps the table in
`MuiPaper-root MuiPaper-elevation1 MuiPaper-rounded` — **a subtle shadow, rounded corners, NO
border**, with `border-bottom` dividers on the cells. So "Simple Table has no outer frame" is
true only in the sense of **no border line**; the frame is a soft *shadow*. MUI's bare
`<Table>` (no Paper) is fully frameless and relies on cell dividers alone. → The Mira-faithful
default is **elevated (shadow), not bordered** — which is exactly what `.z-grid` already does.

### 3. ZK / practical reality — the near-white page
The app surface is `#f7f9fc` and `--zk-elevation-card` is deliberately faint
(`rgba(50,50,93,.024) 0 2px 5px-1, rgba(0,0,0,.05) 0 1px 3px-1`). On that near-white page the
card shadow is **nearly invisible** — an "elevated" table reads as having *no container at
all*. DESIGN.md:83 already anticipates this: *"use the outlined variant when resting on a
white surface where shadow is invisible."* This is the one pull **toward** a border — but as a
*replacement* for the shadow (outlined), never *in addition* to it.

## Where auxheader fits

`<auxhead>` is a **ZK-only internal structure** (multi-level header) with no Mira analog. It
does **not** by itself change the container decision (elevated/outlined/plain) — its hierarchy
is carried *internally* by the tonal band + the TH dividers (see
`skills/.../data-components.md`). But it is a legitimate *tie-breaker*: a multi-level header is
more complex content that reads better **bounded by a crisp edge**, and on the near-white page
the shadow cannot supply that edge. So an **auxhead-bearing, standalone** table is the
canonical case for the *outlined* variant — not because auxhead needs a border, but because a
complex header on an invisible-shadow surface does.

## The synthesis: one default + an ancestor-context exception

Because ZK gives no standalone signal, we cannot model three context tiers off a class. The
realistic model is **one default container style for all three, plus an embedded exception
detected by ancestor context**:

| Case | How detected | MD3 style | border | shadow |
|------|--------------|-----------|--------|--------|
| Default (standalone — the common case) | no ancestor selector matches | choose ONE below | — | — |
| Embedded in a bounded parent | `.z-panel-body`/`.z-groupbox`/form descendant selector (already used) | Plain | none | none |

Hard invariant across all three: **never border + shadow at once.**

The default's "choose ONE" is the real decision:
- **Elevated** (`box-shadow`, no border) — Mira-faithful, but the shadow is ~invisible on the
  `#f7f9fc` page, so it reads as no container.
- **Outlined** (`1px outline-variant`, no shadow) — what DESIGN.md:83 prescribes for a
  near-white surface, and what gives an auxhead-heavy header a crisp edge.

## Recommendation (for ratification — not yet implemented)

1. **Fix the invalid state first, regardless of default choice:** drop the border-OR-the-shadow
   from `.z-tree` / `.z-listbox` so they stop doing both. Also decide the fate of the dead
   `.z-grid-standalone` rule (wire it up as a documented manual sclass, or delete it).
2. **Pick the default — two coherent directions:**
   - **(A) Outlined default for all three (recommended for THIS theme).** All three default to
     `1px outline-variant`, no shadow; suppress the border when embedded
     (`.z-panel-body .z-grid`, etc.). Rationale: on the near-white page the shadow is invisible
     (DESIGN.md:83), and auxhead/complex headers need a visible edge. This is "outlined card",
     a fully MD3-valid presentation, and it is what tree/listbox already look like (minus their
     redundant shadow) — so it is the smallest visual change. The cost: it departs from Mira's
     *elevated* Simple Table — but Mira's shadow wouldn't be visible here anyway, so the
     intent (a bounded table object) is better served by a border on this surface.
   - **(B) Elevated/plain default (Mira-literal).** All three default to shadow-only, no border
     (grid's current look); accept that on the near-white page they read as nearly frameless,
     matching MUI's bare/Paper-elevation table. Most faithful to "Simple Table has no border",
     but auxhead-heavy tables get no crisp edge and the elevation is decorative-only here.

   (A) is recommended **for this theme specifically** because the near-white surface defeats
   elevation; if the app surface were darker (shadow visible), (B) would win.

## Decision (RATIFIED 2026-06-11)

- [x] **Default = (A) outlined** for all three: `1px solid outline-variant`, **no shadow**.
- [x] **Embedded handling = both:** auto-suppress border inside panel/groupbox
      (`.z-panel-body .z-{comp}` / `.z-groupbox .z-{comp}` → `border: none`) **+** explicit opt-in
      variant sclass `z-{grid,listbox,tree}-noborder` for arbitrary containers.
- [x] **Variant named `noborder`** (not `flat`): mirrors ZK's own `z-window-noborder` /
      `z-panel-noborder` / `z-{north,…}-noborder` convention, so it is self-documenting and
      discoverable. (`flat` was ambiguous — read as "no elevation".) Renamed 2026-06-11.
- [x] **Dead `.z-grid-standalone` deleted**, replaced by the opposite-direction `z-grid-noborder`.
- [x] Implemented: `.z-grid` (grid.css), `.z-tree` (tree.css), `.z-listbox` (listbox.css) now
      outlined-no-shadow + `-noborder` variant + ancestor auto-suppression; DESIGN.md §11 updated;
      `frame` rows fr1–fr4 added to all three contracts; a "No-border variant" use-case section
      added to each preview page (grid.zul / listbox.zul / tree.zul).

**Verified live 2026-06-11:** all three roots compute `border: 1px solid rgba(0,0,0,.12)` +
`box-shadow: none`; `.z-{comp}-noborder` → `border: none`; synthetic `.z-panel-body`/`.z-groupbox`
ancestry → `border: none` for all three. Tree-header screenshot: clean outlined card, no shadow,
auxhead bands + dividers read correctly.

**Why (A) over (B):** the near-white `#f7f9fc` surface defeats the elevation shadow, so an
"elevated" table reads as frameless; the border is the only readable boundary, and an
auxhead-heavy header needs a crisp edge. If the app surface were darker (shadow visible),
(B) elevated would win — revisit this decision if the surface palette changes.
