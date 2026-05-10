# Plan — Extending Mira's Design Language to Uncovered ZK Component States

## Current Status (2026-05-10)

| Step | Status | Notes |
|------|--------|-------|
| Step 1 — Author `DESIGN.md` | ✅ Done | `doc/DESIGN.md` exists; 12 sections covering surface palette, text, brand, spacing, radii, elevation, typography, state-layers, motion, density, borders, iconography |
| CSS coverage audit (parallel) | ✅ Done | ~40+ component state gaps filled (readonly, invalid, open states for combobox/datebox/bandbox/spinner/timebox/input; panel/window/groupbox/toolbar/menu/grid/listbox/tree/calendar states; toast, notification, scrollbar, loadingbar, errorbox new files) |
| Step 2 — Style by analogy + verify | 🔄 Active | Workflow for any new gap encountered during visual parity spiral or use-case review |
| Step 3 — Feed back into spec | 🔄 Ongoing | Add decisions to `doc/DESIGN.md` when an uncovered analog is resolved |

The generative commands restriction (no `$craft`, `$shape`, etc.) remains in effect. The impeccable/frontend-design skill is used only for analysis (`$audit`, `$polish`, `$layout`, `$critique`).

---

## Context

`src/test/resources/web/usecase2/` mimics ~40 Mira pages and the `visual-parity-spiral.md` workflow drives pixel-matching on those pages. But every ZK component has states, variants, and edge cases that Mira never shows — even components Mira covers have gaps (validation, keyboard focus, disabled popup, drag-handle hover, etc.). The line between "component Mira covers" and "component Mira doesn't cover" is not meaningful: all components need to be reviewed against the same spec.

**The missing piece was a written rulebook** — now resolved by `doc/DESIGN.md`.

---

## Active Workflow: Step 2 — Style by Analogy, Then Verify

For each uncovered component state encountered during development or spiral review:

1. **Pick the analog** from `doc/DESIGN.md` — which Mira-covered component is closest in role.
2. **Measure exact values before writing CSS** — do not derive property values from prose alone.
   - Method A: `getComputedStyle(document.querySelector('<selector>')).<property>` on the analog component at `http://localhost:8080/<analog>.zul`
   - Method B: grep the MUI static CSS at `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` (see `INDEX.md` for ZK→MUI mapping)
   - If both agree → use that value. If they disagree → trust Method A (runtime reflects theme overrides).
3. **Apply spec rules using existing tokens** (`--zk-color-*`, `--zk-spacing-*`, `--zk-shape-*`). Never hardcode hex or px.
4. **Check all interactive states** after each component:
   - Hover: state-layer overlay (`rgba(currentColor, 0.08)`) or surface tint (`#f5f5f5`)
   - Focus-visible: `2px solid --zk-color-primary`, `outline-offset: 2px`
   - Disabled: content `opacity: 0.38`, container `opacity: 0.12`, `pointer-events: none`
   - Selected/active: indicator only (not full fill) unless DESIGN.md says fill
   - Readonly: `background-color: surface-container-low`, `border-color: outline-variant`, button disabled
   - Invalid: `border-color: error` (1px default, 2px on focus)
   - Border transitions: confirm focus adds border and blur removes it in both directions
5. **Verify with impeccable analysis** (analysis commands only):
   - `$polish src/main/resources/web/js/zul/inp/css/<file>.css` — flag hardcoded values, missing focus, missing transition
   - `$audit http://localhost:8080/<component>.zul` — flag a11y/spacing/contrast issues
   - `$layout` — flag rhythm/alignment misses
6. **Skip generative commands** — `$craft`, `$shape`, `$colorize`, `$bolder`, `$typeset` override Mira's choices.
7. **Smoke-test side-by-side** with a completed Mira-covered page (e.g. `dialogs.zul`, `menus.zul`). If the new component visually clashes, the spec rule was applied wrong.
8. **Stop condition**: if 2 fix attempts fail, the analog is wrong — update `DESIGN.md`'s analog note and mark `WONTFIX / BLOCKED`.

---

## Step 3 — Feed Back into the Spec

When a real ambiguity surfaces ("Mira never shows a slider, and our analog isn't obvious"), make a decision once, write it into `doc/DESIGN.md` under the relevant section, and move on. Future components reuse the decision.

---

## Known Remaining Gaps (as of 2026-05-10)

### ZKEX_BACKLOG (out of current scope)
Enterprise-tier ZK components with no CSS yet — defer until PE/EE tier is scoped:
organigram, stepbar, pdfviewer, searchbox, scrollview, signature, video, timepicker (zkmax), multislider, rangeslider, portallayout, goldenlayout, splitlayout, drawer, coachmark, barcodescanner, camera, chosenbox, biglistbox, tbeditor, colorbox/colorpicker/colorpalette, cascader, cardlayout.

### Minor structural sub-elements (low priority)
`z-combobutton-button/content/icon`, `z-menu-clickable`, `z-sticky-header`, `z-treerow-radio`, `z-listbox-paging-top`, `z-tree-paging-bottom/top`, `z-splitter-button`, `z-splitter-button-disabled`.

---

## Critical Files

| File | Status | Role |
|------|--------|------|
| `doc/DESIGN.md` | ✅ exists | Distilled Mira spec — rulebook for all uncovered states |
| `src/main/resources/web/js/zul/*/css/*.css` | ✅ ~66 files | Component CSS; edit per gap |
| `src/test/resources/web/*.zul` | ✅ ~111 files | Preview pages; add state columns per gap |
| `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` | ✅ external | MUI 9.0.0 static CSS reference |
| `doc/mira/index-BnB_Ifri.css` + `doc/mira/*.html` | ✅ external | 49 Mira HTML reference pages |
| `usecase2.css` | ✅ existing | Page-level styles for Mira SPA |

---

## Per-Component Gate (before marking a component done)

- [ ] All property values measured via `getComputedStyle` or MUI static CSS — no values from screenshots or prose
- [ ] No hardcoded hex or px — `$polish` clean run on the component CSS file
- [ ] State-layer checklist:
  - [ ] Hover renders state-layer or surface tint
  - [ ] Focus-visible ring appears (`2px solid primary`, `outline-offset: 2px`)
  - [ ] Disabled content fades to `0.38` opacity; container to `0.12`
  - [ ] Readonly uses `surface-container-low` bg + `outline-variant` border + button disabled
  - [ ] Invalid uses `error` border (1px default, 2px focused)
  - [ ] Selected/active uses indicator only unless spec says fill
  - [ ] Border shows/hides correctly between default ↔ focus ↔ hover
- [ ] Smoke-tested side-by-side with a Mira-covered page — no visual clash
- [ ] If 2 fix attempts failed: analog updated in `DESIGN.md`, row marked `WONTFIX / BLOCKED`

## End-to-End Gate

- [ ] `doc/DESIGN.md` reviewed — matches established styling patterns
- [ ] No regression in completed `usecase2/*.zul` pages (smoke screenshot)
- [ ] Any analog decision requiring deliberation written back into `DESIGN.md`

---

## Out of Scope

- New tokens or palettes. Use what `_colors.css` etc. already define.
- Dark theme. Out of project scope per CLAUDE.md.
- Replacing the visual-parity-spiral workflow. That continues for Mira-covered pages.
- ZKEX enterprise components (tracked separately in ZKEX_BACKLOG above).
