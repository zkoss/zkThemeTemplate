# Analysis: Checkbox `mold="switch"` — is it proportionally too large?

Date: 2026-06-04 · Trigger: tasks/prompt2.md · Framework: doc/skill-feedback-loop.md

## Verdict

**Your suspicion is correct — and the cause is identifiable.** The switch was implemented with
**MD3 spec-sheet values verbatim**, while the project's stated design decision is *"tokens follow
MD3 naming, **visual values follow MUI v7**"* (CLAUDE.md, Key Decisions). MUI's switch is visually
much smaller than MD3's, so the current switch is out of family with every neighboring control.

## The numbers

| Metric | Current (marble) | MD3 spec | MUI v7 medium (project's visual benchmark) |
|---|---|---|---|
| Track (visible) | **52 × 32 px** | 52 × 32 | **34 × 14 px** (58×38 root − 12px padding) |
| Track radius | 16px | full | 7px |
| Track border | 2px solid outline | 2px outline | none (opacity-tinted fill) |
| Thumb off / on | 16px / 24px (inside track) | 16 / 24 | **20px both states, overhangs the track** |
| Travel | left 4px → right 4px | — | translateX(20px) |

Source: `src/main/resources/web/js/zul/wgt/css/checkbox.css:386-443` vs
`THEME/material-ui-7.3.1/static-css-output/Inputs/Switch.css:1-7, 323-339`.
Mira's reference page (`doc/mira/forms-selection-controls.html`) uses stock
`MuiSwitch-root MuiSwitch-sizeMedium` — i.e. the 34×14 visual.

**Proportion check** against siblings on the same page: the theme's checkbox mold is 18–20px
(contract c1) and labels are 13–14px (c9). A 32px-tall, 2px-bordered track is ~2.3× the visual
height of the MUI switch and visually dominates the row. Even the CSS comment admits the source:
`/* MD3 Switch using ZK checkbox mold infrastructure */` — the generator copied the MD3 spec sheet.

## How was the size "decided"? — It wasn't verified at all

This is a textbook skill-feedback-loop gap (same class as the `inplace` and
`portallayout horizontal-orient` rows in `doc/skill-gaps.md`):

- `doc/contracts/checkbox.md` has **zero Expected-values rows** for the switch variant.
  It only appears as an unchecked TODO: `- [ ] switch variant, toggle variant` under
  "States to evaluate".
- With no assertion, the **evaluator never measured it**, and the **generator free-styled**
  from the MD3 spec instead of reading the MUI reference (`Inputs/Switch.css`), which the
  project rule mandates ("read the matching MUI CSS file first").

## Answer to "應該對標 md3 的 Switch 對吧?"

**Role: yes. Values: no.** It maps to the Material *Switch* component, but per the project's
own decision the visual benchmark is **MUI v7 Switch** (34×14 track, 20px overhanging thumb),
not the MD3 spec sheet (52×32). The MD3 spec values are precisely what makes it look oversized.

## Proposed fix path (per skill-feedback-loop workflow)

1. **Log first** — append a row to `doc/skill-gaps.md` (gap: switch sized from MD3 spec, not MUI;
   why missed: contract had no switch expected-value rows).
2. **Encode failing assertions before CSS** — add switch rows to `doc/contracts/checkbox.md`
   Expected values (track ~34×14, radius 7px, no border, thumb 20px w/ elevation-1 shadow,
   translateX 20px, off-track `on-surface` @ 38% opacity, on-track `primary` @ 50%… adapted to
   `--zk-*` tokens), check off the switch state, and mirror for the toggle mold if it has the
   same blindness.
3. **Then fix CSS** in `checkbox.css` §Switch variant.
4. **Layer triage** (decision rule): **contract layer** — missing what-to-check rows.
   - ⚠️ Cluster watch: this is now the **2nd–3rd occurrence** of root cause
     *"States-to-evaluate item with zero matching Expected-values rows ⇒ evaluator blind"*
     (also: portallayout horizontal-orient, inplace). Per the Periodic-review rule (3+ ⇒ promote),
     consider an **agent-layer gate**: evaluator §1.5 should flag any states-checklist entry that
     has no corresponding expected-value row, instead of silently skipping it.
5. **Sibling sweep** — `mold="toggle"` (same file, also free-styled?) and radio/checkbox states
   on the same contract.

## Resolution (2026-06-04)

User chose **MUI v7 medium**. Executed per the feedback-loop workflow:

1. **Logged** — new row in `doc/skill-gaps.md` (layer: contract + agent).
2. **Assertions first** — `doc/contracts/checkbox.md` gained sw1–sw9 Expected-values rows
   (MUI-derived, `--zk-*` token-adapted) + a split switch-state checklist item; the toggle
   mold entry is now explicitly marked `⚠ NO-ASSERTION`.
3. **CSS fix** — `js/zul/wgt/css/checkbox.css` §Switch variant rewritten: track 34×14 r7
   no border, off-track `color-mix(on-surface 44%)` ≈ rgba(0,0,0,.38), on-track primary @ 50%,
   thumb 20px surface-white + `--zk-elevation-1` → primary, travel −3px → `calc(100% − 17px)`
   (= 20px), 38px hover halo via `::before` following the thumb, focus opacity inherited from
   the base `.z-checkbox` `:has(:focus-visible)` rule.
4. **Agent-layer promotion** — 3rd occurrence of root cause *"states-checklist entry with zero
   expected-value rows ⇒ evaluator blind"* (inplace, portallayout horizontal-orient, switch) ⇒
   added a mandatory **NO-ASSERTION gate** to evaluator §Dynamic-states: any checklist entry
   without a matching expected row is reported as a contract defect, never skipped.
5. **Verified live** — all sw1–sw9 measured in-browser on `checkbox.zul` (computed styles match
   exactly; hover halo = 38px @ 0.08); visual screenshot confirms Mira-like proportions next to
   the 18px checkboxes. Sibling sweep: `usecase/account-settings` (2 switches) renders correctly.

## Deferred follow-up

**Toggle mold** has the same provenance problem: current selected state = solid primary fill +
inset shadow; MUI ToggleButton selected = primary text on primary-tinted 8% background, border
stays outline-variant, radius 4px, padding 11px. Flagged `NO-ASSERTION` in the contract; needs
its own target decision before restyling.
