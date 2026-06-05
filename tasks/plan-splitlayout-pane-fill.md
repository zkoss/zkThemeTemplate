# Fix: splitlayout pane does not fill its cave (12px hole before splitter, horizontal orient)

Per `doc/skill-feedback-loop.md`. Bug report `tasks/prompt.md` (2026-06-05).

## Symptom (user report)

- **Horizontal split**: left window does not fill its parent — a clear gap between the left window and the splitter. Right window *appears* to fill.
- **Vertical split**: both windows fill perfectly, no gaps — matches the intended design.
- Question: under MD3, should there be space between the splitter and the panes at all?

## Root cause (verified in browser + ZK source)

**Measured** (`splitlayout.zul`, 10 caves): 4 caves have a 12px fill deficit — all in
**horizontal** orientation. Affected children get inline
`width: calc(100% - 12px); height: calc(100% - 12px)` from ZK and have computed
`margin: 0 0 12px 0`. Both left AND right windows are 12px short on both axes; the
right cave's hole sits against the container edge, so only the left one is visually
obvious (it abuts the splitter). The nested `z-splitlayout` child is affected too.

**Chain**:
1. Marble's vertical-rhythm rule (`zul/css/utility/_rhythm.css`) gives section-level
   container widgets — `.z-window`, `.z-panel`, `.z-grid`, `.z-listbox`, …, and
   `.z-splitlayout` itself — `margin-block-end: var(--zk-spacing-3)` (12px).
2. **ZK fact** (`zk/flex.ts` `applyCSSFlex`, lines ~600–624): when the flex container
   child is a wrapper div around the widget node (`fcc != c` — exactly the splitlayout
   cave case), ZK sizes the widget with `calc(100% - <margin>px)`:
   - **row** orientation → subtracts `zk(c).marginHeight()` (top+bottom margins) from
     **both** width and height;
   - **column** orientation → subtracts `zk(c).marginWidth()` (left+right margins) from
     both.
3. Rhythm's `margin-block-end: 12px` is a *vertical* margin → `marginHeight() = 12`
   → in **row** (horizontal split) mode, both axes lose 12px → the hole.
   In **column** (vertical split) mode `marginWidth() = 0` → plain `100%` → no hole.
   This precisely explains "horizontal broken / vertical fine".

**Why the harness missed it**: the splitlayout contract checks splitter adjacency
between caves (M4) and containment (M5/M6), but never asserts *the pane child fills
its cave*. The hole is inside the cave, between the child and the cave's trailing
edge. MD3/Mira has no splitlayout analog to compare against.

## Answer to the MD3 question

MD3 has no splitter/split-pane component. Marble's splitter-family spec
(DESIGN.md §14) treats the **8px tonal bar itself as the entire visual separation**
— panes sit flush against the bar, exactly like the vertical split renders today.
**No additional whitespace between pane and splitter is intended.** If gutter spacing
were ever wanted it would have to be symmetric and token-based (padding on the cave,
both sides) — never an accidental, trailing-edge-only margin artifact. → The observed
gap is a defect, not a design choice. This rationale goes into the contract notes.

## Hard constraints (unchanged from previous fix)

CSS-only theme; ZK JavaScript is never modified; JS-toggled classes
(`z-flex*`) are a framework contract. Browser probes only measure.

## Fix plan

### Step 1 — Log the gap (`doc/skill-gaps.md`)
Append row: component = `splitlayout (+ any rhythm widget as css-flex child)`;
gap = rhythm `margin-block-end` is subtracted by ZK css-flex sizing
(`calc(100% - marginHeight)` in row mode, both axes) → 12px hole before splitter;
why-missed = no pane-fill assertion in contract, no MD3/Mira analog;
layer = skill (reference) + contract + global CSS (`_rhythm.css`).

### Step 2 — Encode failing assertion FIRST (`doc/contracts/splitlayout.md`)
- **M12 (pane fill)**: for every cave whose child uses `hflex`/`vflex`, the child's
  bbox equals the cave's bbox within ±1px on both axes, in both orientations,
  including nested instances. Record pre-fix measurement: 4/10 caves fail with
  12px deficits (horizontal orient only).
- Prose note under M4: the 8px bar is the entire pane separation (DESIGN.md §14);
  no whitespace between pane child and splitter is permitted.

### Step 3 — Skill layer
- **Extend `reference/css-flex-classes.md`** (new section "Margin subtraction"):
  the ZK fact from flex.ts above + rule: *a theme must not put default margins on
  widgets that can be css-flex children; if it has a global rhythm rule, it must
  zero the margin wherever ZK wraps flex children (`.z-flex-item` wrappers, layout
  caves), otherwise ZK converts the margin into a same-sized hole — on BOTH axes
  in row mode.*
- **Extend `components/splitlayout.md`** drag/layout section: caves are wrapper
  flex children (`fcc != c`), so child margins become trailing holes; theme rhythm
  must be cancelled inside caves.

### Step 4 — CSS fix (`zul/css/utility/_rhythm.css` — exception block)
Add after the rhythm rule (same unlayered scope; selectors beat the base rule by
specificity/source order):

```css
/* Rhythm OFF where a JS layout engine owns child sizing:
   1. css-flex row containers — zk/flex.ts sizes wrapped children with
      calc(100% - marginHeight) in row mode (BOTH axes), turning any
      vertical margin into a trailing hole (see skill css-flex-classes.md);
   2. splitlayout caves — wrapper flex children in all states (also keeps
      the post-drag, classless state hole-free). */
.z-flex-row > .z-flex-item > :is(<rhythm widget list>),
.z-flex-row > :is(<rhythm widget list>).z-flex-item,
.z-splitlayout-cave-top > *,
.z-splitlayout-cave-bottom > *,
.z-splitlayout-cave-left > *,
.z-splitlayout-cave-right > * {
    margin-block-end: 0;
}
```

Notes:
- The cave rules are unconditional (not gated on `z-flex-item`) so the exemption
  also holds in the post-drag state where ZK strips the `z-flex*` classes —
  margins must not reappear after a drag.
- Timing is safe: `applyCSSFlex` adds `z-flex-item`/`z-flex-row` **before**
  measuring `marginHeight()`, so with these rules ZK measures 0 and writes a clean
  `100%`.
- Column flex is left alone: `marginWidth()` is 0 for rhythm widgets, so there is
  no hole, and stacked rhythm in a column remains a deliberate feature.

### Step 5 — Verify
1. `npm run build:css`; reload `splitlayout.zul`.
2. M12 probe: all 10 caves report child bbox == cave bbox ±1px; inline sizes read
   `100%` not `calc(100% - 12px)`.
3. Re-run M10/M11 (drag persistence, both orientations) — must stay green,
   including pane fill after the drag (post-drag classless state).
4. Regression: M1–M9 sweep on splitlayout.
5. Sibling sweep for the rhythm exception: pages where rhythm visibly stacks
   blocks (`window.zul`, `panel.zul`, `grid.zul`, usecase2 `#default`,
   `#tables-advanced`) — rhythm between normal stacked widgets must be unchanged;
   also `borderlayout.zul` + `goldenlayout.zul` for flexed children inside
   JS-sized bodies (if borderlayout region bodies show the same calc-hole with a
   flexed window, log a follow-up gap row rather than silently widening this fix).
6. Update gap-log row with verification results.

## Files to touch

| File | Change |
|------|--------|
| `doc/skill-gaps.md` | append gap row (Step 1) |
| `doc/contracts/splitlayout.md` | M12 pane-fill assertion + §14 no-gutter note (Step 2) |
| `.claude/skills/zk-component-rules/reference/css-flex-classes.md` | margin-subtraction section (Step 3) |
| `.claude/skills/zk-component-rules/components/splitlayout.md` | cave margin-hole note (Step 3) |
| `src/main/resources/web/zul/css/utility/_rhythm.css` | rhythm exception block (Step 4) |

## Status

Plan written 2026-06-05. **Step 4 superseded during review**: instead of keeping the
rhythm rule and adding exceptions, the user ruled (Plan B, see
`tasks/eval-rhythm-vs-optin-spacing.md`) to **remove the default rhythm entirely** —
widgets carry zero default margins (matching stock ZK and the assumption baked into
ZK's JS sizing); spacing is opt-in via `.z-vstack` / `.z-mb-*` / `<vlayout spacing>`.

Executed 2026-06-05:
- `_rhythm.css` deleted; unwired from `scripts/build-css.js`; CLAUDE.md tree updated.
- `doc/spacing-policy.md` rewritten to the opt-in policy.
- `portallayout.css` gained a scoped `.z-portalchildren-content > .z-panel
  { margin-bottom }` rule so its verified stacking gap survives.
- Steps 1–3 and 5 executed as planned (gap row, contract M12 + §14 no-gutter note,
  skill margin-subtraction section + splitlayout pane-fill section).
- Verified: M12 PASS 10/10 caves (was 4/10 failing); M10/M11 re-run green incl.
  post-drag pane fill; portallayout gaps intact; sweep across 11 pages found one
  regression (`cardlayout.zul` — the original 2026-05-28 spacing complaint) fixed
  opt-in with `z-vstack`; `utility/stack.zul` demo section rewritten.
