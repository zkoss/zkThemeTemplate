# Design Review: codeeditor   GATE2: PASS
mode: loop-gate
date: 2026-09-08 (re-verify — focus-ring overlay + dark-mode tone-80 focus colour)

**Files Reviewed**:
- Contract: `doc/contracts/codeeditor.md` (`contract-approved: true`)
- CSS: `src/main/resources/web/js/zul/code/css/codeeditor.css`
- Tokens: `src/main/resources/web/zul/css/tokens/_component-theme.css` (Codeeditor block, 15 knobs)
- Cross-reference: `src/main/resources/web/zul/css/tokens/_colors.css`, `doc/spec/brand-override.md`
- Screenshots: `doc/screenshots/codeeditor-gallery.png`, `doc/screenshots/codeeditor-forced-colors.png`
- Prior evidence relied on (not re-derived): `doc/harness/eval-reports/codeeditor.md` (iteration 2, row-coverage 47/47, includes the painted-pixel ring-thickness guard for c32 and the decoded-oklch contrast checks for c31/c33 — this is the Gate-1 evidence this Gate-2 pass builds design judgment on top of, per the harness split)

**M3 Reference Component**: Text Field (outlined) — focus/error/hover states; Color roles — dynamic
color tonal mapping (light vs. dark scheme)
**MUI Reference File**: `Inputs/OutlinedInput.css` — confirms MUI's own focus mechanism is a literal
`border-width: 2px` bump on `.MuiOutlinedInput-notchedOutline` (`.Mui-focused`), which is exactly the
mechanism codeeditor's zero-padding geometry cannot use without shifting the viewport — the contract's
departure to an overlay-ring (Mechanism A) is a previously-accepted, well-precedented substitution
(same shape as timepicker), not something newly introduced by this pass.

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Color Tokens | ✅ | All declarations are `var(--zk-*)`; the 3 literal dark-surface hex values are the pre-existing, documented `brand-allowed-literals` carve-out (unaffected by this pass). New dark-focus token is seed-derived via `oklch(from …)`, not a hardcoded hex — see Finding 1 (Suggested) on token reuse |
| Typography | ✅ | Unaffected by this change; mono family/body-medium size-line-height confirmed unchanged |
| Shape | ✅ | `::after` overlay carries `border-radius: inherit`, so the ring follows the root's rounding exactly — no square-corner leak |
| Elevation | N/A | Flat bordered field, no elevation role in play (Marble policy: MUI-style, no tonal-elevation demand) |
| Spacing & Layout | ✅ | Overlay is `position:absolute; inset:0`, outside the box-layout flow — the M6 zero-tolerance "no layout shift" guarantee holds by construction, confirmed by Gate 1's exact-match geometry assertion |
| State Layers | ✅ | Hover/focus both present on light and dark surfaces; dark surface's rest/hover/focus are now three genuinely distinct, independently-legible colors (not the case before this fix — see Detailed Findings) |
| Disabled State | ✅ | 0.38 opacity + `pointer-events:none` now on the root itself (not just `.cm-editor`), correctly suppressing the disabled+hover false-affordance this component had earlier in the day |
| Motion | ✅ | Root (`border-color`) and overlay (`box-shadow`) both transition on `--zk-motion-duration-standard`/`-easing-standard` — same clock, so the two-layer ring animates as one visual unit, not two staggered ones |
| Sizing & Touch Targets | N/A | `tablet: N/A` correctly declared — no discrete tap targets in this widget |
| Contract Consistency | ✅ | Prose↔table cross-check (Step 0) found no contradictions: knob count (15) matches the `ctv-knobs` list exactly; `!important` count (9) matches every `!important` actually present in the CSS; c19/c27 retirement is consistent across contract, CSS header, and skill file; state-matrix rows correctly reference c9b/c31b where the overlay ring needs a dark-specific reassertion |

## Findings

| # | location | violation | severity | suspected-row | evidence |
|---|----------|-----------|----------|---------------|----------|
| 1 | `tokens/_component-theme.css` line 1259, `--zk-codeeditor-dark-border-color-focus` | Introduces a second "light-primary-for-dark-surfaces" OKLCH derivation (`oklch(from var(--zk-color-primary) 0.8 c h)`) rather than consuming the existing `--zk-color-inverse-primary` token, which is defined for exactly this purpose ("light primary for dark surfaces", `oklch(from var(--zk-color-primary) 0.81 calc(c*0.58) h)` ≈ `#9ec3ff`) — same intent, two different chroma-scaling constants now coexist in the codebase for the same conceptual role | Suggested | c31 | `_colors.css` line 138 (`--zk-color-inverse-primary` definition + comment); `_component-theme.css` line 1259 |
| 2 | harness evidence, not the design | No dedicated hover/focus-within screenshot is persisted under `doc/screenshots/codeeditor-*` for this pass — only `-gallery` (static, no pseudo-class states triggered) and `-forced-colors` exist. Gate 1's own painted-pixel test is the authoritative evidence for c32/c33 (stronger than a screenshot for this exact defect class, since computed style couldn't see the original bug either), so this does not block PASS, but a persisted focus-state screenshot would strengthen future Gate-2 passes on a component with two prior focus-ring regressions in one day | Suggested | — | `doc/screenshots/` directory listing; `doc/harness/eval-reports/codeeditor.md`'s "Visual artefacts" section names `codeeditor-hover.png`/`codeeditor-focus.png` as captured-but-not-persisted this run |

## Detailed Findings

### 1. Focus-ring mechanism: `::after` overlay (Mechanism A, overlay variant)

**Requirement**: MD3 gives no fixed mechanism for a focus indicator, only the outcome — a clearly
visible state change with no loss of legibility. MUI's own outlined-field implementation (cited above)
achieves this via a literal `border-width: 2px` bump. Marble's own DESIGN.md §11 also prescribes that
literal mechanism as the default for inputs.

**Why the departure is sound here, not just tolerated**: codeeditor's root has zero padding between
its border and CodeMirror's viewport (a deliberate choice — CodeMirror supplies its own
gutter/scroller chrome, so a second layer of padding would be redundant). A 1px→2px border bump would
therefore shift the entire editor viewport sideways by a pixel on every focus/blur — the exact
layout-shift bug `reference/focus-affordance-no-layout-shift.md` catalogs. The fix keeps the border a
constant 1px in every state and draws the second ring pixel on an always-present `::after` overlay
(`position:absolute; inset:0; border-radius:inherit; pointer-events:none`), anchored by
`position:relative` on the root. This is the same overlay variant timepicker already uses, so it is a
horizontal application of an existing, previously-Gate-2-approved pattern, not a new invention.

**Why the overlay (not a root-level inset shadow) is mandatory for this specific component, and this is
the interesting design fact this pass turns up**: an inset `box-shadow` paints on the element's own
background layer, *below every child*. Because the root has zero padding, CodeMirror's DOM sits flush
against the border and paints opaque (`.cm-gutters` always; the whole `.cm-editor` on the dark
surface). A ring on the root is therefore occluded by its own children — measured pre-fix at 1/2/2/2 px
(light, the gutter ate the left edge) and 1/1/1/1 px (dark, `.cm-editor` ate all four edges), while
`getComputedStyle` reported the ring as present and correct in both broken states. This is a legitimate,
non-obvious CSS-stacking fact (border-box paint order: background → box-shadow(inset) → border →
children — a child's own opaque background always wins over an ancestor's inset shadow at the same
pixel), and the overlay is the structurally correct fix, not a workaround. Verified against the shipped
CSS: the `::after` rule sits after the `.cm-editor`/`.cm-scroller`/`.cm-gutters` rules in cascade order
but that's irrelevant here — what matters is that the overlay is a sibling `::after` pseudo-element of
`.z-codeeditor` itself, painted in its own stacking context above the `.z-codeeditor-cave` child (an
`::after` pseudo-element always paints after — i.e. on top of — the element's normal-flow children,
per CSS2.1 §12.1 combined with painting order rules), which is exactly the ordering the fix needs.

**MD3 alignment of the outcome**: the resulting visible ring (1px border + 1px ring = 2px total) matches
MD3's/MUI's literal 2px focus-border spec in visual weight while preserving Marble's own "no layout
shift" invariant — a faithful re-implementation of the same design intent through a different
mechanism, which is exactly what Marble policy #1 permits (MD3 naming/intent, engineering freedom on
mechanism where MUI's literal mechanism doesn't fit the component's geometry).

**Verdict**: sound design, correctly implemented. Confirmed against live CSS (root box-shadow stays
unset in every state; `::after` carries the sole ring); Gate 1's dedicated pixel-probe test (not
computed-style) already confirmed the visible outcome is 2px uniform on all four edges, both surfaces.

### 2. Dark-surface focus colour: MD3 tone-80 claim — checked against spec, confirmed accurate

**The claim**: "MD3 does not put the light-scheme primary on a dark surface at all — the dark scheme
carries primary at tone 80" — and the fix derives `--zk-codeeditor-dark-border-color-focus` as
`oklch(from var(--zk-color-primary) 0.8 c h)`.

**Checked against the M3 spec** (m3.material.io — Color roles / dynamic color tonal mapping): this is
correct, standard M3 baseline scheme behaviour, not an invented rule. In M3's tonal-palette-to-role
mapping, `primary` is assigned **tone 40** in the light scheme and **tone 80** in the dark scheme (the
same light↔dark tone-swap pattern holds for `secondary`, `tertiary`, and `error` — all map to tone 40
light / tone 80 dark). This is exactly why MD3 dark-themed surfaces show primary as a pale, light blue
rather than the light scheme's medium-saturation blue — a dark scheme's "primary" role is deliberately
a *light* tone so it reads clearly against a dark container, mirroring the light scheme's
`on-primary-container`-style relationship in reverse. The contract's design reasoning is textbook M3,
correctly applied to justify why reusing the *light-scheme* primary value verbatim on a dark surface
was the wrong move even though it arithmetically cleared the 3:1 floor.

**One nuance worth naming, not a defect**: M3's "tone" is defined on Google's HCT color space (Hue,
Chroma, **Tone**, where Tone is calibrated to track CIELAB L*), whereas this codebase derives its
tones via `oklch(from … L c h)` — OKLab/OKLCH lightness, a *different* perceptually-uniform metric
(notably, one of OKLab's specific design goals was correcting CIELAB's poorer uniformity for blue
hues — the exact hue in play here). `oklch L=0.8` is therefore an approximation of "HCT tone 80", not
a bit-exact reproduction of Google's own tonal palette values. This is not a new liberty taken by this
fix, though: it is the same approximation the entire token file already uses system-wide for every
container/on-container/inverse role (`_colors.css` lines 60-138), previously reviewed and accepted as
the project's standing method for tone derivation. Applying the same, already-vetted method to a new
knob is consistent engineering, not a fresh risk — noted here only because the prompt asked for a
second opinion on the tone-80 reasoning specifically, and this is the most precise version of "yes,
and here is the one asterisk."

**Measured outcome**: `#80bdff` on `#1e1e1e` → 8.45:1, comfortably clearing both the WCAG 1.4.11 floor
(3:1) and the stricter 4.5:1 bar the contract deliberately set for itself after the previous
"technically-3.45:1-but-still-unreadable" experience. Hue is preserved from the seed (`h` untouched),
so the dark and light focus rings read as the same brand blue at two different lightness steps, not two
unrelated colors — correct brand-consistency outcome for a brand-override-safe token per
`brand-override.md`.

**Verdict**: the tone-80 reasoning is accurate MD3 spec knowledge, correctly motivates the fix, and the
resulting color clears contrast requirements with margin. See Finding 1 above for the one Suggested
refinement (reuse `--zk-color-inverse-primary` instead of a bespoke second formula) — a token-hygiene
observation, not a correctness problem.

### 3. Everything else in scope for this pass — reconfirmed, no regressions

- Nine `!important` declarations counted directly in the shipped CSS match the contract's claim exactly
  (2 on `.cm-scroller` font rules, 1 on `.cm-focused` outline, 3 on light `.cm-gutters`, 3 on dark
  `.cm-gutters`) — no drift from the A/B-proven inventory.
- Fifteen CTV knobs counted directly in `_component-theme.css` match the contract's `ctv-knobs` list
  exactly, both directions (no orphan token, no undeclared knob).
- Disabled state's `pointer-events:none` is confirmed on the **root** selector
  (`.z-codeeditor-disabled`), not scoped to `.cm-editor` — the disabled+hover false-affordance
  documented as fixed earlier today is still fixed; no regression.
- c19/c27 retirement (dead `.cm-cursor`/`.cm-dropCursor` rules) is consistent across the contract, the
  CSS file's own header comment, and matches the accepted caret deviation this pass was told not to
  re-litigate — not re-raised.
- Gallery screenshot visually confirms: gutter present/absent correctly per `lineNumbers`, dark surface
  fully repaints (root + editor + gutter, no pale wedges around the rounded corners), disabled instance
  visibly dimmed, CTV knobs demonstrably reach both the light-chrome family and the dark-surface family
  in the "Component Theme Variables" section. Forced-colors screenshot shows every border/text
  surviving `forced-colors: active` with no vanished affordance.

## Accepted-deviation skips

- **Native caret color** (`.cm-content`'s `caret-color`, UA default black/white rather than theme
  foregrounds) — per this task's explicit instruction, not re-raised. `.cm-cursor`/`.cm-dropCursor`
  rules are correctly absent (dead code removed, CodeMirror's `drawSelection` extension is not loaded
  by the CE build).
- **Dark surface as a literal `#1e1e1e`** (not `--zk-color-inverse-surface`) — pre-existing, previously
  reviewed carve-out (ten VS Code Dark+ syntax literals fixed in ZK core JS; measured WCAG evidence
  already on file). Unaffected by this pass; not re-audited beyond confirming the values are unchanged.
- **Nine `!important` declarations** — pre-existing, A/B-proven against CodeMirror's unlayered runtime
  stylesheet. Not re-litigated beyond the count-match check above.

## References
- m3.material.io — Color roles / dynamic color (light-scheme primary = tone 40, dark-scheme primary =
  tone 80; same swap pattern for secondary/tertiary/error) — backs the tone-80 claim in the contract.
- m3.material.io — Text fields (focus state) — outcome-level requirement (clear, legible state change),
  no mandated mechanism; MUI's literal border-width mechanism is the visual target where geometry
  permits it, per Marble policy #1.
- `/Users/hawk/Documents/workspace/THEME/material-ui-7.3.1/static-css-output/Inputs/OutlinedInput.css`
  — confirms MUI's own `.Mui-focused .MuiOutlinedInput-notchedOutline { border-width: 2px }` mechanism,
  cited to establish why codeeditor's departure is a substitution for a specific geometric constraint,
  not a stylistic drift.
- `src/main/resources/web/zul/css/tokens/_colors.css` lines 60-138 — the codebase's standing
  `oklch(from seed L c h)` tone-derivation convention, including the pre-existing
  `--zk-color-inverse-primary` (line 138) that Finding 1 recommends reusing.
- `doc/spec/brand-override.md` — the hue-consistency rationale for deriving brand-adjacent tokens by
  absolute OKLCH lightness rather than hardcoding a literal.
- `reference/focus-affordance-no-layout-shift.md` — Mechanism A / overlay-variant precedent (timepicker).
- `doc/harness/eval-reports/codeeditor.md` — Gate 1 CLEAN, 47/47, including the painted-pixel c32 guard and
  decoded-oklch c31/c33 contrast checks this Gate-2 pass builds its judgment on top of rather than
  re-deriving.
