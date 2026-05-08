# Plan — Extending Mira's Design Language to ZK Components Mira Doesn't Cover

## Context

`src/test/resources/web/usecase2/` mimics ~40 Mira pages so each ZK component on those pages can be styled to match Mira/MUI pixel-by-pixel. The `visual-parity-spiral.md` workflow already covers that.

The remaining problem: **ZK has a long tail of components and component states that Mira simply does not show.** Examples:

- **Components Mira lacks**: `bandbox`, `slider`, `rating`, `captcha`, `biglistbox`, `splitter`, `anchorlayout`, `absolutelayout`, `borderlayout`, `hlayout/vlayout`, `groupbox` (with caption), `popup`, `fisheye`, `organigram`, `image`, `flash`, plus zkmax-only widgets (e.g. `coachmark`, `cropper`, `signature`).
- **States Mira doesn't show**: validation/error on most inputs, loading/skeleton, drag-handle hover, frozen-column shadow, multi-select hover, tree expand/collapse animation, listbox keyboard-focus ring, popup-while-trigger-open border swap, paging ellipsis, etc.

For these we have **no Mira screenshot to copy**. We need a written **rulebook** so a new component "looks Mira" without ever having existed in Mira.

The user's question: *"How do we do this — and is `claude design` (the impeccable/frontend-design skills) a better tool for it?"*

## Recommendation (TL;DR)

**Don't use impeccable's generative commands** (`$craft`, `$shape`, `$colorize`, `$bolder`, `$typeset`) for this — they impose their own design laws (OKLCH palette, bold/distinctive aesthetics) which fight Mira's MUI-based system. `visual-parity-spiral.md` already calls this out.

**Do** use this two-step approach:

1. **Codify Mira's design language as a written spec** (`DESIGN.md` at repo root), distilled from the 49 Mira HTML reference pages, the MUI 9.0 CSS files, the existing `usecase2.css`, and the completed component CSS work. This becomes the rulebook.
2. **For each Mira-uncovered component or state, derive its style from the spec by analogy** — not by invention. Then use impeccable's *analysis* commands (`$audit`, `$critique`, `$polish`, `$layout`) to verify the result follows the spec. These commands check existing code against design laws; they don't generate new aesthetics.

Net answer: yes, use the impeccable skill, but only its analysis half, and only after the Mira spec exists. Generative design (frontend-design / `$craft`) would push the theme away from Mira, not toward it.

## Why a written spec is the missing piece

Right now Mira's design language lives implicitly in:
- `usecase2.css` (page-level mimics)
- 30+ component CSS files in `src/main/resources/web/js/zul/*/css/`
- `doc/mira/*.html` (49 reference pages) and `doc/mira/index-BnB_Ifri.css` (MUI bundle)
- `doc/mira-reports/*-diffs.md` (per-page diffs)

There is no single document that says *"Mira's surface palette is X, its radii are 6/8/12px, its state-layer overlay is rgba(0,0,0,0.04) hover / 0.08 selected, its motion is 200ms cubic-bezier(0.4,0,0.2,1)…"* So when a developer styles a component Mira lacks, they have to re-discover those rules from scratch every time — and the result drifts.

Writing the spec once kills that drift and enables the analogy-based extension below.

## Proposed Workflow

### Step 1 — Author `DESIGN.md` (the Mira spec)

One file, ~1–2 pages, derived from existing artifacts. Sections:

- **Surface palette** — page bg, card bg, sidebar bg, input bg (light + the MUI surface levels)
- **Text colors** — primary `#1c1b1f`, secondary `#49454f`, disabled, link, on-brand, on-error
- **Brand & state colors** — Mira blue `#376fd0`, success/warning/error/info shades used in badges and chips
- **Spacing scale** — derived from observed values in `usecase2.css` (4/8/12/16/20/24/32/48/64)
- **Radii** — surface 6px / chip 16px / button 4–6px / dialog 8px (extract from MUI files)
- **Elevation/shadow** — Mira's flat shadows (`0 1px 3px rgba(0,0,0,0.08)` etc.)
- **Type scale** — sizes 10.5/11/12/12.5/13/14/16/17/20/28 + weight rules
- **State-layer overlay rules** — hover/focus/selected/disabled opacities
- **Motion** — duration + easing tokens
- **Density** — Mira is denser than MD3; rows 36–40px, inputs 32–36px
- **Border rules** — `1px solid #e0e0e0` baseline; when borders show vs hide on state change
- **Iconography** — Lucide SVG sizes + colors per context (16/18/20/24)

This already exists piecemeal in `_colors.css`, `_spacing.css`, etc. The job is just to **read it back out as design intent** so a human can apply it to a new component.

Keep it short. Keep it scannable. It's a rulebook, not a treatise.

### Step 2 — Inventory uncovered components & states

Produce `doc/mira-uncovered-inventory.md` — a table:

| Component / State | Mira reference? | Closest Mira analog | Spec rule to apply |
|---|---|---|---|
| `bandbox` popup | ❌ none | combobox dropdown + dialog | popup radius 8, shadow E2, border none |
| `slider` | ❌ none | progress bar track + button thumb | track 4px h, thumb 16px circle, brand fill |
| `rating` | ❌ none | chip/icon-button hover | star 18px, hover state-layer 0.04 |
| `splitter` | ❌ none | divider + handle | 4px wide, hover bg `#e0e0e0`, drag bg brand |
| `popup` (generic) | ❌ none | menu / dialog | radius 8, shadow E3, border none |
| `groupbox` legend | ❌ none | card title | font-weight 600, size 14, color primary |
| input error state | partial | sign-in error | red border `#d32f2f`, red helper text 12px |
| listbox keyboard focus | ❌ | button focus-visible | 2px outline brand, offset 2px |
| frozen column shadow | ❌ | card shadow | inset E1 on right edge |
| paging ellipsis | ❌ | typography muted | color secondary, no hover, no border |
| etc. | | | |

This becomes the to-do list. Each row = one short CSS task.

### Step 3 — Style by analogy, then verify

For each row in the inventory:

1. **Pick the analog** from the spec — what Mira-covered component is closest in role.
2. **Measure exact values before writing CSS** — do not derive property values from the spec's prose alone.
   - Method A: `getComputedStyle(document.querySelector('<selector>')).<property>` on the analog component at `http://localhost:8080/<analog>.zul` (preview app must be running)
   - Method B: grep the MUI static CSS for the analog: `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/` (see `INDEX.md` for ZK→MUI mapping)
   - If both agree → use that value. If they disagree → trust Method A (runtime value reflects theme overrides).
3. **Apply the spec's rules**, not invent new ones. Use the existing CSS variables (`--zk-color-*`, `--zk-spacing-*`, `--zk-shape-*`).
4. **Check all interactive states** after each component — mandatory:
   - Hover: state-layer overlay `rgba(currentColor, 0.08)` or surface tint `#f5f5f5`
   - Focus-visible: `2px solid --zk-color-primary`, `outline-offset: 2px`
   - Disabled: content opacity `0.38`, container opacity `0.12`, no pointer events
   - Selected/active: differs from hover in the RIGHT WAY (indicator only, not full fill — unless spec says fill)
   - Border appear/disappear: does focus add a border? does blur remove it? check both directions.
5. **Verify with impeccable analysis commands**:
   - `$polish src/main/resources/web/js/zul/inp/css/slider.css` — flag hardcoded values, missing focus state, missing transition
   - `$audit http://localhost:8080/slider.zul` — flag a11y/spacing/contrast issues
   - `$layout` — flag rhythm/alignment misses
6. **Skip the generative commands** — `$craft`, `$shape`, `$colorize`, `$bolder`, `$typeset` would override Mira's choices.
7. **Smoke-test against an existing Mira-covered page** (e.g. `dialogs.zul`, `menus.zul`) — if the new component visually clashes when placed next to a known-good one, the spec rule was applied wrong.
8. **Stop condition**: if 2 fix attempts don't produce coherent results, the analog mapping is wrong — update DESIGN.md's analog for this component and move on. Do not keep iterating on a bad analog.

### Step 4 — Feed back into the spec

When a real ambiguity surfaces ("Mira never shows a slider, and our analog isn't obvious"), make a decision once, write it into `DESIGN.md`, and move on. Future components reuse the decision.

## Why not just lean on `claude design` (impeccable/frontend-design) end-to-end?

The frontend-design and impeccable skills require `PRODUCT.md` and `DESIGN.md` to avoid generic output. Without them they produce something opinionated and *un-Mira*.

If we author `DESIGN.md` ourselves from Mira (Step 1 above), then:
- impeccable's *analysis* layer becomes useful — it checks code against the spec.
- impeccable's *generative* layer is still wrong for this project — Mira/MUI is a finished design language; we don't want bold reinvention.

So: use the skill as a code-review tool, not a designer. That's a narrower and more honest use than "claude design will figure it out".

## Critical files

- **NEW** `DESIGN.md` (repo root) — distilled Mira spec.
- **NEW** `doc/mira-uncovered-inventory.md` — table of uncovered components/states with chosen analog.
- **EDIT, per row** — relevant component CSS under `src/main/resources/web/js/zul/*/css/*.css`.
- **READ** — `doc/mira/index-BnB_Ifri.css`, `doc/mira/*.html`, `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/`, `usecase2.css`, existing `_colors.css` / `_spacing.css` / `_shape.css` / `_elevation.css` / `_motion.css`.
- **OPTIONAL** `PRODUCT.md` (repo root) — short, so impeccable analysis runs cleanly: audience = enterprise developers; tone = professional; anti-references = playful/maximalist/brand-heavy aesthetics.

## Verification

### Per-component gate (before marking a row done)

- [ ] All property values measured via getComputedStyle or MUI static CSS — no values derived from screenshots or prose alone
- [ ] No hardcoded hex or px: `$polish` clean run on the component CSS file
- [ ] State-layer checklist passed:
  - [ ] Hover renders state-layer or surface tint (not invisible)
  - [ ] Focus-visible ring appears (`2px solid primary`, `outline-offset: 2px`)
  - [ ] Disabled content fades to `0.38` opacity; container to `0.12`
  - [ ] Selected/active uses indicator only (not full fill) unless spec says fill
  - [ ] Border shows/hides correctly between default ↔ focus ↔ hover
- [ ] Smoke-tested side-by-side with a completed Mira-covered page — no visual clash
- [ ] If 2 fix attempts failed: analog updated in DESIGN.md and row marked `WONTFIX` / `BLOCKED`

### End-to-end gate (after pilot + first few components)

- [ ] `DESIGN.md` reviewed — matches established styling patterns
- [ ] Pilot component (`slider`) compared side-by-side with `dialogs.zul` and `forms-pickers.zul` — visually coherent
- [ ] No regression in completed `usecase2/*.zul` pages (smoke screenshot)
- [ ] New entries in `doc/mira-uncovered-inventory.md` written only when a real decision was made — no pre-filling edge cases

## Out of scope

- New tokens or palettes. We use what `_colors.css` etc. already define.
- Dark theme. Out of project scope per CLAUDE.md.
- Replacing the visual-parity-spiral workflow. That continues for Mira-covered pages.
