# Consistency audit — combobox / datebox / bandbox: mouse vs keyboard × `buttonVisible` × readonly

**Date:** 2026-07-03 · **Theme:** Marble · **ZK:** 10.3.0.1-jakarta · **Status: analysis only — no code/theme/skill change made.**
**Related:** [combo-click-to-open.md](combo-click-to-open.md) · [x2-combobox-readonly-solution.md](x2-combobox-readonly-solution.md) · skill `.claude/skills/zk-component-rules/reference/buttonVisible-attribute.md`

## Questions

1. Compare the similar components (combobox / **datebox / bandbox**): in each state, can the popup be opened by
   mouse and by keyboard? Do they differ?
2. Was `buttonVisible=false` **originally designed to prevent operation**? (checked against ZK source, javadoc,
   official docs, and CaseFoundry history)

## TL;DR

- **The three components behave identically** on the open-affordance axis (table below). Datebox vs bandbox differ
  only in *popup content* (calendar vs custom band) and *typeahead* (bandbox has autodrop, datebox doesn't) — not in
  whether/how the popup opens.
- **`buttonVisible=false` was never designed to prevent operation.** Java javadoc (`@since 2.4.1`) and the official
  ZK Component Reference both describe it as a **cosmetic "hide the button / plain text-input style"** flag, and the
  docs **explicitly keep the control operable** without the button (Combobox: *"open via keyboard shortcut
  (`Alt+DOWN`) or programmatically"*; Datebox/Timebox: *"type directly / plain text-input style"*).
- **Therefore the earlier "self-contradiction / ZK bug" framing is withdrawn.** The mouse-can't-open /
  keyboard-can-open result for readonly+no-button is the *documented intended* behavior, not a defect. The residual
  issue is a **usability edge** (a readonly+no-button field gives *mouse-only* users no operation path), which is an
  authoring smell, not a framework bug.
- **Theme conclusion (unchanged): do not grey it.** It is intentionally still operable (keyboard), so a
  disabled/grey style would misrepresent it — contrary to both the x2 principle and ZK's documented intent.

## 1. Per-component comparison (verified live, Playwright, 2026-07-03)

Popup-open by gesture. `Alt+↓` = `Alt+ArrowDown`. **All three components produced byte-identical results**, so one
table covers combobox, datebox, and bandbox:

| State | input focusable | mouse: click input | mouse: click icon | keyboard: `Alt+↓` |
|-------|:---:|:---:|:---:|:---:|
| editable + button | yes | ✗ (focus/type) | ✓ opens | ✓ opens |
| editable + no-button | yes | ✗ | — (no icon) | ✓ opens |
| **readonly + button** | yes | ✓ opens | ✓ opens | ✓ opens |
| **readonly + no-button** | yes | ✗ (cannot) | — (no icon) | ✓ opens |
| disabled + button | **no** | blocked¹ | blocked¹ | ✗ (can't focus) |
| disabled + no-button | **no** | blocked¹ | — | ✗ (can't focus) |

¹ *blocked* = the widget carries `pointer-events:none` (theme) and the input is not focusable, so no gesture reaches it.

### Where the three components actually differ (not on the open axis)

| Aspect | combobox | bandbox | datebox |
|--------|----------|---------|---------|
| Shared client JS base | `ComboWidget` | `ComboWidget` | `Datebox` (own) |
| Popup content | option list | custom `bandpopup` | calendar |
| Typeahead / `autodrop` (type → open/filter) | yes | yes | no (type a date string) |
| Set value by typing (editable only) | yes | yes (free text) | yes (parsed date) |
| `Alt+↓` opens, **ungated** by `buttonVisible` | yes | yes | yes |
| Mouse click-open **gated** on `buttonVisible` (readonly path) | yes | yes | yes |

**Answer to Q1:** datebox and bandbox (and combobox) are *identical* in whether the popup can be opened in each
state. The only differences are the kind of popup and whether typeahead exists — neither affects the readonly /
buttonVisible operability question.

## 2. Was `buttonVisible=false` designed to prevent operation? — No.

### Java API (ZK source)
- `Datebox.setButtonVisible` is **`@since 2.4.1`** — one of ZK's oldest input attributes.
- Every component's javadoc is identical and purely presentational: *"Sets whether the button (on the right of the
  textbox) is visible."* (`Combobox.java:793`, `Datebox.java:295-299`, `Timebox.java`, `Spinner.java`,
  `Bandbox.java`, `Doublespinner.java`). No mention of disabling, sealing, or preventing interaction.

### Official ZK Component Reference (docs.zkoss.org — via CaseFoundry `search_docs`)
- **Combobox → ButtonVisible:** *"Controls whether the drop-down button … is rendered. Set to `false` to hide the
  button **while still allowing the drop-down list to open via keyboard shortcut (`Alt+DOWN`) or programmatically**."*
  → keyboard-open is **explicitly intended**, and mouse **click** is deliberately *not* listed as an open path when
  the button is hidden.
- **Datebox → ButtonVisible** (`@since 2.4.1`): *"When set to `false`, users can still type a date directly but
  cannot open the popup calendar via the button."* → framed around "type instead," control stays functional.
- **Timebox → ButtonVisible:** *"Set to `false` to hide the button and present a **plain text-input style**."*

The consistent documented intent: **`buttonVisible=false` = hide the button and present a plain text input; the
control remains functional** (type directly, `Alt+↓`, or programmatic). It is the opposite of "prevent operation."

### CaseFoundry historical cases
No case treats `buttonVisible` as an interactivity gate. The nearby cases govern interactivity through **`readonly`
/ `disabled`**, not `buttonVisible`:
- `ZK-2849` / `GH-6be217ab` / `GH-20dc9e98` — readonly combobox dropdown *toggle/close* bugs.
- `GH-e73357c5` — suppress readonly combobox *auto-open* on window highlight.
- `ZK-8fdda353` — suppress popup when **disabled && readonly** (IE).

This corroborates: **`buttonVisible` is cosmetic; interactivity is owned by `disabled`/`readonly`.**

## 3. So — is the behavior inconsistent, and should it be operable?

**It should be operable, and it is — by design.** Reading the docs, the open paths for a no-button control are
*keyboard + programmatic* (combobox) or *typing* (datebox/timebox); mouse **click-to-open is a button-bound
affordance**. So "no button → mouse can't click-open, but `Alt+↓` still opens" is internally consistent with the
documented model, **not** a self-contradiction.

The genuine issue is narrower and is a **usability** one, not a framework bug:

> `readonly + buttonVisible=false` is the one combination where the documented alternative inputs both vanish for a
> **mouse-only** user — you can't type (readonly) and there's no button to click — leaving only the non-discoverable
> `Alt+↓`. So the control is "operable" per the spec but effectively dead for a mouse user.

This is an **authoring smell**: `readonly` means *"change the value by opening the list,"* while `buttonVisible=false`
removes the visible way to open it. For a genuinely non-changeable display, authors should use **`disabled`** (or a
plain label / `textbox`), **not** `readonly + buttonVisible=false`.

## 4. Theme decision (unchanged)

- **No theme change. Keep the active look; do not grey `readonly + buttonVisible=false`.** It is intentionally still
  operable (keyboard), so greying it would misrepresent it — against both the x2 principle *and* ZK's documented
  design.
- The theme cannot (and should not) alter the mouse/keyboard open logic — that is ZK client JS working as documented.
- **Withdrawn:** the earlier suggestion to file a ZK bug for the mouse-vs-keyboard difference. The docs show it is
  intended. (If anything is ever raised upstream, it would be a *UX enhancement* request — "warn or no-op on the
  readonly + buttonVisible=false combination" — not a bug.)

## Follow-ups (deferred — no change made per "先不要做任何更動")

- The skill note `reference/buttonVisible-attribute.md` currently describes only the *mouse* open paths ("no click
  gesture opens"). It should gain a line: *"`Alt+↓` and programmatic open remain available when `buttonVisible=false`
  — this is documented intended behavior; `buttonVisible` is cosmetic, interactivity is governed by
  `disabled`/`readonly`."* Apply once the review is accepted.
