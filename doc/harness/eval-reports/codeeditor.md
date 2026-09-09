# Eval Report: codeeditor   status: GATE2_PENDING
iteration: 2
date: 2026-09-08T16:15:00Z
tier: T3
failing-set: []
newly-passing-since-last: [x-ctv-suite]
row-coverage: 47/47

## Methodology note

**No `mcp__claude-in-chrome__*` tool was available in this session** (confirmed again via
`ToolSearch` — absent from both the base tool list and the deferred-tool index). As in the
prior pass, this eval substitutes the project's own Playwright installation for all of
§3b/§3c/§3d measurement:
- Computed-style measurement used ad-hoc `node` scripts against
  `http://127.0.0.1:8080/codeeditor.zul` with real `locator.hover()`/`.focus()` calls (not
  synthetic `dispatchEvent`), so `:hover`/`:focus-within` genuinely engage. Transitions were
  killed via an injected stylesheet (`transition: none !important` on the relevant
  selectors), not `el.style.transition`, per the skill's warning that the root's transition
  does not reach `::after`.
- The two painted-pixel ring guards (c32) were re-run directly via
  `npx playwright test -g codeeditor` against `screenshot.spec.ts`, not reimplemented.
- `oklch(...)` computed-style serializations (c31/c31b/c33) were decoded through a 1×1
  canvas per the harness's transition-freeze/color-decode guidance, then cross-checked with
  the WCAG relative-luminance formula independently of the contract's stated numbers.
- `x-ctv-suite` and `x-fc-capture` used the project's named Playwright projects
  (`component-theming`, `forced-colors-gallery`) exactly as §3e specifies.
- One self-correction worth recording: on first visual inspection the hover screenshot
  *looked* like it had a blue border (same as the focus screenshot). Rather than trust the
  thumbnail read, I pixel-sampled the actual screenshot through an in-page canvas
  (`getImageData` at the top-edge midpoint) and got `rgb(33, 33, 33)` — which is exactly
  `rgba(0, 0, 0, 0.87)` composited over white (`0.87×0 + 0.13×255 ≈ 33`). The perceived "blue"
  was a thumbnail-rendering artefact, not a real defect; c7 is confirmed correct. This is the
  same gotcha the prior report's methodology note flagged for the same screenshot.

## Pre-flight gates

- **Gate 0a (contract-approval)**: `doc/contracts/codeeditor.md` line 8 →
  `contract-approved: true`. PASS. (Third approval — this run measures against the contract
  amended to retire c19/c27 and add the CTV-suite fix note.)
- **Gate 0b (js-source-hash drift detection)**: PASS.
  ```
  $ bash scripts/js-source-hash.sh zul/code/Codeeditor.ts zul/code/mold/codeeditor.js
    zul/code/Codeeditor.ts       <-  zul-11.0.0-jakarta.FL.20260904.jar
    zul/code/mold/codeeditor.js  <-  zul-11.0.0-jakarta.FL.20260904.jar
  7041c98df9ada3a34d15341994baf153faccd316620782a12b2d51ff5545fb80
  ```
  Matches the contract's declared hash exactly. No drift.
- **Preview reachability**: `curl -sI http://127.0.0.1:8080/codeeditor.zul` → HTTP 200. Not
  rebuilt or restarted, per instructions.
- **Icon-coverage pre-render check (§2.6)**: N/A, unchanged from last pass — codeeditor draws
  zero icons; confirmed no `z-icon-*` literal in the preview ZUL.

## What changed since iteration 1 (verified, not re-derived)

1. **c19/c27 retired, not fixed** — confirmed independently:
   - The contract's Expected-values table jumps `c18 → c20` and `c26 → c28`; a
     "Retired: c19, c27 (2026-09-08)" note explains the gap.
   - `codeeditor.css` no longer contains any `.cm-cursor`/`.cm-dropCursor` rule; the file
     header's "NOT STYLED ON PURPOSE" section documents why, matching the contract's
     rationale word-for-word (CE build's `_baseExtensions()` omits `drawSelection()`).
   - The skill file (`components/codeeditor.md`) now states plainly that
     `.cm-cursor`/`.cm-dropCursor` are not rendered and the native caret is an accepted
     deviation — the "styled-internal-selectors" list mismatch flagged in the prior report
     is resolved (the skill's own Composition-invariants and Sibling-decomposition sections
     both call the caret out as excluded).
   - Live-measured: `page.locator('.cm-cursor, .cm-dropCursor').count()` → `0` on the fully
     mounted, focused editor (both light and dark instances). No selector to test against.
   - **caret-color deviation confirmed, not re-raised as a finding**: this pass did not
     re-measure `caret-color` (nothing changed there since iteration 1 and the user's brief
     explicitly says not to re-raise it); it remains a documented, accepted UA-default
     fallback per the contract, CSS header, and skill file all agreeing.

2. **x-ctv-suite fixed — confirmed by direct test run, not just by reading the spec file.**
   ```
   $ npx playwright test --project=component-theming -g "codeeditor"
   ✓ codeeditor — regional bg/border/gutter override, sibling untouched (1.8s)
   ✓ codeeditor — whole-app :root override wins (loaded after norm.css.dsp) (1.4s)
   2 passed (4.0s)
   ```
   Both tests exist in `component-theming.spec.ts` (lines 1695, 1711) and both instances
   exist in `component-theming.zul` ("Codeeditor (default)" / "Codeeditor (regional
   override)" section, lines ~1256-1276). I did not re-run the user's mutation proof
   (removing the gutter `!important`) since it would require a working-tree CSS edit, which
   is outside the Evaluator's role — the test's own assertions (`bgOf`, `borderColorOf`
   equality/inequality checks against `SCOPED_PURPLE`) are structurally sound for what they
   claim to prove, and the two PASS results are consistent with the user's mutation report.

## Visual artefacts

- gallery: `doc/screenshots/codeeditor-gallery.png` (full-page, Branch B — no `.z-d-grid`
  state-matrix block on this preview page; recaptured fresh this pass via
  `npx playwright screenshot`)
- hover: `doc/screenshots/codeeditor-hover.png` (Default instance, real `locator.hover()`,
  transitions killed, recaptured fresh)
- focus: `doc/screenshots/codeeditor-focus.png` (Default instance, `.cm-content` focused,
  recaptured fresh)
- forced-colors: `doc/screenshots/codeeditor-forced-colors.png` (written by
  `--project=forced-colors-gallery`, this run)

All four capture: `playwright-fallback` (no Chrome MCP tools available this session). All
four files confirmed non-zero size.

## AI visual findings

Reviewed all four screenshots against the contract's Design Contract prose and Outcome
assertions. Single-image review mode (`mockup-needed: Y` — no ZKDoc baseline exists for this
`@since 11.0.0` component).

No violations observed: borders visible on every instance, gutter line-numbers present where
expected (States/Surface/Languages sections) and absent where `lineNumbers="false"`
("Gutter and indent" section), dark surface fully repaints (root + editor + gutter, no pale
wedges around the dark box, rounded corners hold), disabled instance visibly dimmed, CTV
knobs demonstrably reach both families (light chrome instance shows a rounded blue border +
tinted gutter; dark surface instance shows a repainted near-navy background + distinct
syntax palette), focus ring reads as a clean uniform blue outline with no visible gap on any
edge, hover border (pixel-sampled `rgb(33,33,33)`, confirmed against computed style) is
correctly near-black and distinct from the blue focus ring despite an initial thumbnail
mis-read, forced-colors capture keeps every border/text legible with no vanished
affordances.

ai_findings_total = 0 (HIGH:0, MEDIUM:0, LOW:0)

| # | location | violation | severity | suspected-row | screenshot |
|---|----------|-----------|----------|---------------|------------|
| — | — | none observed | — | — | — |

## Macro assertions

| id | predicate | observed | result |
|----|-----------|----------|--------|
| M1 | visible framing: border ≥1px solid OR shadow≠none OR bg≠transparent | `border-width:1px; border-style:solid; box-shadow:none; bg:rgb(255,255,255)` | PASS |
| M2 | cave fills root content box (±1px) | content box 318×128 (320×130 minus 1px border×2); cave rect 318×128 | PASS (exact) |
| M3 | `.cm-scroller` covers ≥95% of cave content-box area | scroller 40704px² vs cave 40704px² (100%) | PASS |
| M4 | explicit height set → cave height within ±2px of root content-box height | cave 128px vs content-box 128px | PASS (exact) |
| M-gutter-visible | gutter non-zero, `bbox.right` ≤ `.cm-content.bbox.left`, height within ±2px | gutter 21×128 @ right=54; content left=54 (touching, no overlap); height 128 vs 128 | PASS |
| M5 | dark repaint: root bg, `.cm-editor` bg, `.cm-gutters` bg all differ light→dark | root `rgb(255,255,255)`→`rgb(30,30,30)`; cm-editor `rgba(0,0,0,0)`→`rgb(30,30,30)`; gutters `rgb(247,249,252)`→`rgb(30,30,30)` | PASS (all three) |
| M6 | focus: 0px bbox delta AND ≥1 of border-color/box-shadow/outline differs | rect 320×130 before and after focus (exact); border-color `rgba(0,0,0,0.23)`→`rgb(55,111,208)` | PASS |
| M7 | disabled: opacity<1 AND `.cm-editor` pointer-events:none | opacity `0.38`; cm-editor pointer-events `none` | PASS |

## Cross-cutting checks

| id | observed | result |
|----|----------|--------|
| x-ctv-root | `--zk-codeeditor-radius` set to `2px` on `documentElement` → default instance `4px`→`2px`; removed → restored `4px` | PASS |
| x-ctv-suite | `npx playwright test --project=component-theming -g "codeeditor"` → 2 passed (both new tests present in `component-theming.spec.ts`/`.zul`) | **PASS** (was FAIL in iteration 1) |
| x-density | contract declares `density: N/A` (no intrinsic control-height) | SKIPPED (contract N/A) |
| x-fc-capture | `npx playwright test --project=forced-colors-gallery -g codeeditor` → 1 passed; `doc/screenshots/codeeditor-forced-colors.png` written, 122585 bytes, no vanished affordances on visual review | PASS |
| x-brand-decl | `grep -nE "#[0-9a-fA-F]{3,8}\|rgba?\(\|hsla?\(\|oklch\("` on `codeeditor.css` → hits confined to comments narrating CodeMirror's own default colors; zero in live declarations; every declaration uses `var(--zk-codeeditor-*)` | PASS |

(`x-ctv-region` was measured in iteration 1 with a PASS and nothing in the region-scoping
mechanism changed this pass — not re-run to avoid an unnecessary duplicate DOM mutation;
carried forward as PASS. `tablet: N/A` per contract — no probe defined, noted only.)

## Per-component results

### codeeditor

| state | id | selector | property | expected | actual | result |
|-------|----|----------|----------|----------|--------|--------|
| default | c1 | `.z-codeeditor` | border | `1px solid rgba(0,0,0,0.23)` | `1px solid rgba(0, 0, 0, 0.23)` | PASS |
| default | c2 | `.z-codeeditor` | border-radius | `4px` | `4px` | PASS |
| default | c3 | `.z-codeeditor` | background-color | `rgb(255,255,255)` | `rgb(255, 255, 255)` | PASS |
| default | c4 | `.z-codeeditor` | color | `rgba(0,0,0,0.87)` | `rgba(0, 0, 0, 0.87)` | PASS |
| default | c5 | `.z-codeeditor` | overflow | `hidden` | `hidden` | PASS |
| default | c6 | `.z-codeeditor` / `.z-codeeditor::after` | transition | `border-color`/`box-shadow` @ 250ms cubic-bezier(0.4,0,0.2,1) | root `border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)`; `::after` `box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)` (measured with transitions live, before killing them for state reads) | PASS |
| hover | c7 | `.z-codeeditor:hover` | border-color | `rgba(0,0,0,0.87)` | `rgba(0, 0, 0, 0.87)`; pixel-sampled `rgb(33,33,33)` off the actual screenshot, consistent | PASS |
| focus-within | c8 | `.z-codeeditor:focus-within` | border-color | `rgb(55,111,208)` | `rgb(55, 111, 208)` | PASS |
| focus-within | c9 | `.z-codeeditor:focus-within::after` | box-shadow | `inset 0 0 0 1px primary`; root `none` | `::after` `rgb(55, 111, 208) 0px 0px 0px 1px inset`; root `none` | PASS |
| focus-within | c9b | `.z-codeeditor::after` | position/inset/pointer-events | `absolute`/`0px`×4/`none` | `absolute`/`0px`/`none` | PASS |
| focus-within | c10 | `.z-codeeditor:focus-within` | border-width | `1px` | `1px` | PASS |
| focus-within | c11 | `.z-codeeditor .cm-editor.cm-focused` | outline | `none` | outline-style `none` (shorthand reports `rgba(0,0,0,0.87) none 3px` — color/width are inert defaults when style is `none`, nothing paints) | PASS |
| default | c12 | `.z-codeeditor-cave`, `.cm-editor` | height | `100%` resolved | cave 128px = cm-editor 128px = root content-box height | PASS |
| default | c13 | `.cm-scroller` | font-family | mono stack | `SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace` | PASS |
| default | c14 | `.cm-scroller` | font-size | `13px` | `13px` | PASS |
| default | c15 | `.cm-scroller` | line-height | `20px` | `20px` | PASS |
| gutter | c16 | `.cm-gutters` | background-color | `rgb(247,249,252)` | `rgb(247, 249, 252)` | PASS |
| gutter | c17 | `.cm-gutters` | color | `rgba(0,0,0,0.6)` | `rgba(0, 0, 0, 0.6)` | PASS |
| gutter | c18 | `.cm-gutters` | border-right-color | `rgba(0,0,0,0.12)` | `rgba(0, 0, 0, 0.12)` | PASS |
| disabled | c20 | `.z-codeeditor-disabled` | opacity | `0.38` | `0.38` | PASS |
| disabled | c21 | `.z-codeeditor-disabled` | pointer-events | `none` (root) | root `none`; `.cm-editor` `none` (inherited) | PASS |
| dark rest | c22 | `.z-codeeditor-dark`, `.cm-editor` | background-color | `rgb(30,30,30)` | root `rgb(30, 30, 30)`; cm-editor `rgb(30, 30, 30)` | PASS |
| dark rest | c23 | `.cm-editor` (dark) | color | `rgb(212,212,212)` | `rgb(212, 212, 212)` | PASS |
| dark rest | c24 | `.cm-gutters` (dark) | background-color | `rgb(30,30,30)` | `rgb(30, 30, 30)` | PASS |
| dark rest | c25 | `.cm-gutters` (dark) | color | `rgb(133,133,133)` | `rgb(133, 133, 133)` | PASS |
| dark rest | c26 | `.cm-gutters` (dark) | border-right-color | `transparent` | `rgba(0, 0, 0, 0)` | PASS |
| dark rest | c28 | `.z-codeeditor-dark` | border-color | `rgba(255,255,255,0.23)` | `rgba(255, 255, 255, 0.23)` | PASS |
| dark hover | c29 | `.z-codeeditor-dark:hover` | border-color | `rgba(255,255,255,0.6)` | `rgba(255, 255, 255, 0.6)` | PASS |
| dark hover | c30 | contrast, hover vs rest | ≥3:1 | independently recomputed: composited `rgb(82,82,82)`→`rgb(165,165,165)` = `3.17:1` | PASS |
| dark focus | c31 | `.z-codeeditor-dark:focus-within` | border-color | tone-80 primary | `oklch(0.8 0.161311 260.564)` → canvas-decoded `rgb(128,189,255)` = `#80bdff` exactly | PASS |
| dark focus+hover | c31 (re-assert) | `.z-codeeditor-dark:focus-within:hover` | border-color | focus wins | settles on same oklch value whether hover is applied before or after focus | PASS |
| dark focus | c31b | `.z-codeeditor-dark:focus-within::after` | box-shadow | dark focus knob | `oklch(0.8 0.161311 260.564) 0px 0px 0px 1px inset` | PASS |
| focus-within, dark focus | c32 | painted ring thickness (4 edges) | `2px` uniform | `screenshot.spec.ts › codeeditor`: both guards PASS (light + dark, all 4 sides = 2px) | PASS |
| dark focus | c33 | painted ring vs dark fill | ≥4.5:1 | independently recomputed via WCAG relative-luminance: `8.4474:1` | PASS |

**Retired (not measured, not failing):** c19, c27 — `.cm-cursor`/`.cm-dropCursor` selectors
confirmed to match 0 elements (both light and dark, focused). Consistent with the contract's
retirement note and the skill file's Composition-invariants section.

### Additional structural confirmations (no c-id, not counted toward row-coverage)

| state | selector | check | result |
|-------|----------|-------|--------|
| gutter absent | `.z-codeeditor:not(:has(.cm-gutters))` | subtree fully absent (not hidden) when `lineNumbers="false"` | PASS |
| readonly | `.z-codeeditor` w/ readonly | renders identically to default: `classList=["z-codeeditor"]`, border `rgba(0,0,0,0.23)`, `opacity:1`, `pointer-events:auto` | PASS |
| disabled, hover | `.z-codeeditor-disabled:hover` | border-color must not move off c1's resting value | PASS — unchanged at `rgba(0, 0, 0, 0.23)`; `root.matches(':hover')` is `false` (pointer-events:none removes hit-testing) |

## Carried-over notes (non-blocking, no action required)

Two prose-only staleness items from iteration 1 remain untouched (consistent with "everything
else is as you left it") — noted again for completeness, not re-flagged as failures:
- c6's row names only `.z-codeeditor` as the selector, but `box-shadow`'s transition actually
  lives on `.z-codeeditor::after` (confirmed again this pass — see the per-row measurement
  above, which now names both selectors directly).
- The Forced-colors section's `fc-guards: needed` line still reads as an open item; the guard
  is in fact already shipped in `tokens/_forced-colors.css` (confirmed again via
  `x-fc-capture` PASS and the passing forced-colors visual review).

Neither affects PASS/FAIL of any row. No CSS or contract action taken by this Evaluator pass
(out of scope — read-only role).
