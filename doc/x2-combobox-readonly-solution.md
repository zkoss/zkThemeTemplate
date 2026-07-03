# X2 — Readonly Combobox Looks (and half-behaves) Disabled: Solution Decision

**Date:** 2026-07-03 · **Theme:** Marble · **ZK:** 10.3.0.1-jakarta
**Finding:** [usecase-design-review.md](usecase-design-review.md) X2 · **File:** `src/main/resources/web/js/zul/inp/css/combobox.css` (readonly block, lines 307-342)

> **Status: APPLIED 2026-07-03 to combobox, datebox, bandbox.** Option 3 implemented and verified live for all three — see the "Status" section at the bottom. **timebox / spinner intentionally excluded** (user decision): in readonly they have no dropdown/popup to open, so a de-emphasized look is acceptable for them. Screenshot re-baseline still owed (theme-wide change).

## The problem, measured

In ZK there is no dedicated "select-only" mode; the enterprise pattern is `combobox readonly="true"`, so **readonly is the *normal, active* state** for a select-style dropdown. But the theme styles readonly as de-emphasis. Live computed styles on `item-editor` (readonly combobox vs the `.z-textbox` beside it):

| | Readonly combobox (now) | Textbox (target field language) |
|---|---|---|
| Wrapper background | `rgb(247,249,252)` (grey, `surface-container-low`) | `rgb(255,255,255)` (white) |
| Input border | `1px rgba(0,0,0,.12)` (faint `outline-variant`) | `1px rgba(0,0,0,.23)` (visible) |
| Input text | `rgba(0,0,0,.6)` (muted) | `rgba(0,0,0,.87)` (near-black) |
| Dropdown button | `pointer-events: none; opacity: .6` | n/a |

All four signals are de-emphasis, so an active select reads as **disabled** next to a live textbox.

**Not just cosmetic — a functional defect.** Interaction probe on the live page:

- Click the **arrow button** → **fails** (`pointer-events: none`; timed out). The primary, universal "open the dropdown" gesture is dead.
- Click the input / wrapper → opens. So the dropdown is reachable, but only via the non-obvious target.

MUI confirms the correct language: a `Select` uses the **same `OutlinedInput` root as a `TextField`** (border `rgba(0,0,0,.23)`, radius 4px, hover→`.87`, focus→2px primary). No grey fill. Only `Mui-disabled` dims the outline. MUI's own `pointer-events:none` sits on a hidden a11y shim, never the visible control. An editable and a readonly/select field look identical; the difference is discovered on interaction.

## MD3 rationale: read-only vs disabled

MD3 does **not** define "read-only" as a distinct visual state. Its state model is enabled / disabled / hovered / focused / pressed / dragged (text fields add error). So the spec has *no explicit rule* for read-only appearance.

But it has a governing convention: **greyed / reduced-opacity is the reserved language of `disabled`** — content at `on-surface` 38%, container/outline at 12%. That treatment specifically communicates "not interactive." Applying it to a control that is *still* interactive misuses the disabled language and misleads the user (it reads as broken), which also violates the accessibility principle that appearance must honestly reflect interactivity.

So the derivable rule is: it depends on whether the read-only control is still interactive.
- **Still interactive** (e.g. a select-only dropdown you can still open) → must look **enabled**, never grey.
- **Genuinely non-interactive** (pure display, not focusable/operable) → a disabled-like grey is defensible, because functionally it *is* close to disabled.

MUI (this project's reference implementation) draws exactly this line: `readOnly` keeps the normal enabled appearance (solid outline, dark text), only removing the edit caret; only `disabled` greys out. In the Material implementation view, read-only ≠ grey.

For ZK's `readonly="true"` combobox this settles it: the control is still interactive (the dropdown opens, you pick a value), so under MD3 it must **not** look disabled — which is what Option 3 corrects.

## Options

### Option 1 (proposed) — opt-in CSS utility class to un-disable readonly
Add a class authors apply per instance to restore the active look.
**Verdict: wrong polarity.** It keeps the wrong *default* (readonly looks disabled) and makes every select opt in. Same footgun as X1 buttons: authors forget → dropdowns look disabled. The common case should be the default; the rare case should need the class. Also doesn't fix the dead arrow unless the class also restores `pointer-events`.

### Option 2 (proposed) — replace combobox with `Selectbox`
**Verdict: not a theme fix, and heavier.** `Selectbox` is a native `<select>`: needs a `ListModel` (different API), its native dropdown can't be themed to match the combobox popup (inconsistent dropdowns app-wide), different keyboard behavior, and it requires rewriting every readonly combobox in every consuming app. It also leaves existing readonly comboboxes broken. This is app-authoring guidance, outside the theme's remit. Keep it only for cases that genuinely want native-select semantics.

### Option 3 (recommended) — fix the theme default; decouple readonly from disabled
Make `.z-combobox-readonly` render **identical to the active/editable combobox** (which already matches the textbox language), and reserve the grey + dimmed treatment for the genuine `disabled` state (already handled at combobox.css:186-203).

Concretely, reduce the readonly block (307-342) to essentially nothing visual — a **subtractive** change:

- **Remove** the grey `background-color: surface-container-low` → falls through to `--zk-color-surface` (white, matches textbox).
- **Remove** the faint `outline-variant` border override → uses `--zk-color-outline` like the default.
- **Remove** the muted `on-surface-variant` text override → uses `--zk-color-on-surface`.
- **Remove** `pointer-events: none; opacity: .6` on the button → restores the arrow as a working open affordance.
- **Remove** the hover-suppression overrides → readonly is interactive, so normal hover feedback is correct.
- **Keep** `cursor: default` on the input (can't type). Minor detail to settle at implementation: `cursor: pointer` on the button/field may read better since it opens a dropdown.

Note: the input is already non-editable via ZK's `readonly` attribute on the `<input>` (probe confirmed `readonly` present), so no CSS is needed to prevent typing — the de-emphasis styling was never what enforced readonly.

**Why this wins:** one change fixes *every* readonly combobox theme-wide, no per-instance opt-in, no component swap, no author footgun, and it restores the broken arrow button. It aligns with the project principle "delete theme inventions that fight stock-ZK assumptions instead of patching exceptions."

**Trade-off:** theme-wide visual change → run `npm run build:css` and re-baseline the screenshot suite deliberately (comboboxes appear on many pages).

## Recommendation

**Option 3.** Options 1 and 2 both leave the wrong default in place; only Option 3 corrects it at the source and also fixes the functional dead-arrow bug.

## Verification recipe (when applied)

1. `npm run build:css`.
2. Re-run the computed-style probe: readonly combobox should now match the textbox (`bg #fff`, `border 1px rgba(0,0,0,.23)`, text `rgba(0,0,0,.87)`); genuinely `disabled` combobox still greyed.
3. Re-run the interaction probe: clicking the **arrow button** opens the dropdown.
4. Re-capture the 7 usecase pages + the combobox/datebox/bandbox preview pages; re-baseline affected components deliberately.
5. Sanity-check `disabled` and `error` variants are unaffected.

## Status — applied 2026-07-03 (combobox, datebox, bandbox)

Each readonly block was reduced to a single `cursor: pointer` rule; all de-emphasis (grey bg, faint border, muted text, dead button) removed so readonly falls through to the active field styling. `npm run build:css` run.

**combobox** (combobox.css:307-342) — verified live on `item-editor`:

| | Before | After | Textbox (target) |
|---|---|---|---|
| Wrapper background | `rgb(247,249,252)` | `rgb(255,255,255)` | `rgb(255,255,255)` |
| Input border | `1px rgba(0,0,0,.12)` | `1px rgba(0,0,0,.23)` | `1px rgba(0,0,0,.23)` |
| Input text | `rgba(0,0,0,.6)` | `rgba(0,0,0,.87)` | `rgba(0,0,0,.87)` |
| Arrow button | `pointer-events:none`, click times out | `pointer-events:auto`, click opens dropdown | n/a |

**datebox** (datebox.css:125-133) and **bandbox** (bandbox.css:145-155) — verified live on `/datebox.zul` and `/bandbox.zul` (readonly compared against the editable instance on the same page):

| | readonly (after) | editable (reference) | disabled (unchanged, for contrast) |
|---|---|---|---|
| Wrapper background | `rgb(255,255,255)` | `rgb(255,255,255)` | datebox `rgb(247,249,252)` / bandbox white but opacity 0.38 |
| Wrapper border | `1px rgba(0,0,0,.23)` | `1px rgba(0,0,0,.23)` | faint / dimmed |
| Wrapper opacity | `1` | `1` | `0.38` |
| Input text | `rgba(0,0,0,.87)` | `rgba(0,0,0,.87)` | dimmed via wrapper opacity |
| Button | `pointer-events:auto`, opens popup | interactive | `pointer-events:none` |

Readonly datebox/bandbox now render identical to their editable counterparts and their calendar/band buttons open the popup; `disabled` stays clearly de-emphasized (opacity 0.38). Screenshot re-baseline still pending (theme-wide change).

## Sibling components — the same anti-pattern

The identical readonly treatment (grey `surface-container-low` bg + faint `outline-variant` border + muted `on-surface-variant` text + `pointer-events:none; opacity:.5/.6` button) existed in four sibling components. Decision (user, 2026-07-03): **the rule is "a dropdown/popup control must not look disabled while readonly."**

- **datebox** — **DONE 2026-07-03.** readonly opens a calendar popup → interactive → must look active. Fixed to match the editable datebox.
- **bandbox** — **DONE 2026-07-03.** readonly opens a band popup → interactive → must look active. Fixed to match the editable bandbox.
- **timebox** (timebox.css:146-162) — **excluded (won't fix).** In readonly it has no dropdown/popup to open, so a de-emphasized look is acceptable.
- **spinner / doublespinner** (spinner.css:175-195) — **excluded (won't fix).** Same reasoning as timebox: no popup when readonly.
