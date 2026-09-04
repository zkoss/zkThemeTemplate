# DateRangeBox focus behavior — UX review

**Date:** 2026-08-11
**Scope:** ZK `Daterangebox` (zkmax) click/focus interaction model, compared against `Datebox`
**Verdict:** Issue 1 is a defect, not a design trade-off. Issue 2's *intent* is sound but is currently
expressed through the wrong mechanism. Recommendation: align the focus policy with Datebox, and do
**not** ship a config switch for it.

---

## 1. Evidence (measured on the live preview app)

Instrumented `focusin`/`focusout`/`mousedown` on `http://127.0.0.1:8080/daterangebox.zul` and
`/datebox.zul`, then drove real mouse/keyboard input.

### DateRangeBox — one click on the begin input

| t | event | target |
|---|---|---|
| 0 ms | `mousedown` | `input.z-daterangebox-begin` |
| 0 ms | `focusin` | `input.z-daterangebox-begin` ← caret appears |
| 64 ms | `focusout` | `input.z-daterangebox-begin` ← caret taken away |
| 65 ms | `focusin` | `div.z-daterangebox-popup` |

Second click on the same input: focus moves to the input and **stays** (popup already open, so the
steal does not re-fire). This is exactly the reported "two clicks needed".

**Worse than reported — typing after the first click is silently destroyed:**

```
click begin input → type "Feb 3, 2025"
  → input value:    "Jan 10, 2025"   (unchanged — all 11 characters discarded)
  → activeElement:  <body>            (focus lost entirely)
```

No error, no feedback, no recovery hint. The user watched a caret appear in a text field, typed into
it, and the input rejected everything.

### Datebox — same probes

| Action | Panel | Focus after | Caret |
|---|---|---|---|
| Click input | stays closed | input | preserved |
| Click calendar icon | opens | **returned to the input** (13 ms round-trip via the button) | preserved (`selectionStart = 6`) |
| `↓` while focus is in input, panel open | — | calendar takes over | selected day moved 15 → 22 |

Datebox deliberately keeps the caret in the input while the calendar is open
(`DateboxCtrl.isPreservedFocus()` returns `true` unconditionally) and **forwards** arrow keys into
the calendar (`Datebox.ts#doKeyDown_` → `this._pop.doKeyDown_(evt)`).

### Root cause

`DaterangePopup.ts#open()`, lines 178–186:

```ts
// Move focus into the dialog so keyboard users land inside immediately.
setTimeout(() => {
    if (this._isOpen) node.focus({ preventScroll: true });
}, 0);
```

combined with `Daterangebox.ts#bind_`:

```ts
jq(beginIn).on('focus.daterangebox', () => this._doFocusInput(RANGE_BEGIN));
// _doFocusInput → _openPopup() → popup.open() → node.focus()
```

So *focusing the input* is what triggers the focus steal. The code comment states the intent
plainly: it was written for keyboard users. The defect is that it fires for **every** entry path,
including the pointer path where it is pure cost.

This lives in ZK core (`zkcml/zkmax/.../db/`), not in Marble. The fix belongs upstream in ZK, not in
the theme.

---

## 2. Why issue 1 is a defect, not a preference

**a) It breaks the most basic affordance in UI.** An element that looks like a text field and shows
a caret is making a promise: "type here". Withdrawing that 64 ms later is a mode error — the widget
looks like a textbox and behaves like a button. Any design that needs a *second* click to do what
the first click visually promised has failed, by definition.

**b) The focus steal does not serve the stated goal.** The goal behind issue 2 is "range is
picking-dominant". That goal is *already fully served* by the panel auto-opening on focus — the
calendar is completely mouse-operable without holding focus. Moving focus into the popup adds
**nothing** to the picking path. It is cost with no matching benefit for the intent it was
supposedly serving.

**c) The a11y argument reverses.** The focus move was written for accessibility, but as implemented
it is an accessibility regression:

- **WCAG 2.2 SC 3.2.1 On Focus (Level A)** — "when any component receives focus, it does not
  initiate a change of context". WCAG's own definition of *change of context* lists changes of
  **focus**. Focusing the begin input moves focus to a different element. That is a textbook
  Level A failure.
- A screen-reader or keyboard user **Tab**-ing through a form is yanked into a dialog merely by
  passing through the field.
- After the failed typing attempt, focus ends on `<body>` — focus is lost, so the next `Tab`
  restarts from the top of the document (SC 2.4.3 Focus Order).
- The WAI-ARIA APG *Date Picker Dialog* pattern — the pattern this was reaching for — moves focus
  into the dialog **only when the trigger button is activated**, never when the text input is
  focused. The text input stays typable throughout.

**d) There is no trade-off to preserve.** Datebox proves keyboard users can reach the calendar
*without* moving focus at all (key forwarding, measured above: `↓` moved the selection 15 → 22 with
the caret still in the input). So the choice is not "typing vs. keyboard access" — you can have
both. When one option is strictly dominated, it isn't a design decision, it's a bug.

---

## 3. Assessing issue 2's premise: "ranges are picked, not typed"

The premise is **mostly true, and worth designing around** — but it describes the *dominant* path,
not the *only* path.

**Supports picking-first:**
- Two dates plus a `start ≤ end` constraint — the calendar enforces and visualizes it; free text
  does not.
- The most common ranges are relative ("last 30 days", "this quarter"), which presets serve far
  better than typing.
- Range text is format-ambiguous (`Jan 10, 2025 ~ Jan 15, 2025`), so parsing is fragile.

**But typing is the critical path, not a nice-to-have:**
- A calendar is only efficient within roughly ±2 months of its anchor. For "2023-04-01" it costs
  ~28 month-navigation clicks; typing is O(1).
- Enterprise reporting: analysts re-run the same period repeatedly and type/paste far faster than
  they navigate.
- **Copy-paste from a ticket, email, or spreadsheet is extremely common** in enterprise workflows,
  and paste requires a focused input.
- Keyboard-only and screen-reader users depend on it.

So: optimize for picking, but never *destroy* typing. The current design destroys it — and does so
silently, which is the worst failure mode.

---

## 4. Recommendation

### Align with Datebox's focus policy — because it is better, not because it is Datebox

Datebox's model earns alignment on the merits: it preserves typing **and** keyboard calendar access
simultaneously, which the DateRangeBox model does not.

But do **not** copy Datebox wholesale. Two range-specific facts justify divergence:

1. Range entry really is picking-dominant, so **opening the panel on input click is a genuine
   improvement** over Datebox (which requires a separate icon click). Keep it. This preserves the
   original design intent from issue 2.
2. The DateRangeBox popup is a **true dialog** (Apply / Cancel / Clear / Today / optional Timeboxes),
   not a bare calendar. So the icon path should follow the APG *dialog* pattern (move focus in),
   whereas Datebox's simpler calendar follows the *combobox* pattern (focus stays out). This
   difference is principled, not an inconsistency.

### Proposed behavior

| Entry point | Panel | Focus lands | Rationale |
|---|---|---|---|
| **Click** begin/end input | opens | stays in the clicked input, caret at click position | Pointer intent to engage *this field*. Panel is a coordinated aid, not an owner. |
| **Tab** into begin/end input | stays closed | the input | Traversal ≠ engagement. Don't drop a 2-month overlay over the rest of the form just because someone tabbed past. |
| `Alt+↓` / `↓` in the input | opens | stays in the input; arrows drive the calendar | Standard combobox key. Keyboard user opts in explicitly. Reuse Datebox's `doKeyDown_` forwarding. |
| **Click / Enter / Space** on the calendar icon | opens | **into the dialog**, on the currently-selected day cell | APG Date Picker Dialog. The user explicitly asked for the picker. |
| `Esc`, Apply, Cancel, outside-click | closes | returns to the trigger or input | Already implemented via `_returnFocusTo`. |

Two supporting changes:

- **Forward arrow / PageUp / PageDown keys from the inputs to the calendar while the panel is open**
  (Datebox's proven mechanism). This is what makes "never steal focus on the input path" free rather
  than a keyboard-accessibility sacrifice.
- **When the icon path does move focus into the dialog, target the selected day cell, not the popup
  root.** Focusing the `tabindex="-1"` container gives a screen reader no position in the grid.
  APG's example focuses the current date.

### Priority

Issue 1 is a **ship blocker**, not a backlog item: it is a WCAG Level A failure that silently
discards user input. Issue 2's intent survives the fix intact.

---

## 5. On the "make it configurable" idea

**Recommendation: no config for focus behavior.**

- The two behaviors are not both reasonable. One is dominated on every axis and violates WCAG A. You
  don't offer a switch between "correct" and "broken".
- Interaction-model flags are the worst kind of config: invisible until you interact, so the same
  widget behaves differently on two screens of the same product and the user's mental model breaks.
- It doubles every keyboard and a11y test path, permanently.
- Sound rule of thumb: make **content and policy** configurable (format, locale, `buttonVisible`,
  `readonly`, presets); keep **focus mechanics** fixed.

**However — there IS a legitimate config axis here, and it's a different one:**
*is typing allowed at all?* That genuinely varies by application, and the industry has already
converged on exposing it:

- Ant Design ships `inputReadOnly` on `RangePicker`.
- MUI X splits Desktop (typable field + icon opens picker) from Mobile (read-only field, tap opens a
  modal picker).

The driver is **touch**, not preference: on a touch device, focusing an input raises the software
keyboard, which covers the very calendar the user is trying to use. A pick-only mode is the right
answer there — and it is *honest*, because the field then looks and behaves as non-typable, instead
of showing a caret it intends to ignore.

Note a gap if you go this route: ZK's existing `readonly` **cannot** express this today.
`Daterangebox.ts#_openPopup()` early-returns on `this._readonly`, and `setReadonly(true)` closes an
open popup — so `readonly` makes the whole widget inert, picker included. A pick-only mode would
need its own attribute (e.g. `inputReadonly`), not a reuse of `readonly`.

---

## 6. Summary of answers to the two framing questions

1. **Should DateRangeBox align with Datebox?**
   Yes on focus policy — and the premise checks out: Datebox's behavior is measurably better, not
   merely different, because it preserves typing *and* keyboard calendar access at once. But keep
   DateRangeBox's "panel opens on input click" (better than Datebox for ranges) and keep dialog
   focus on the *icon* path (justified by the richer popup). Alignment on the principle, not
   blanket parity.

2. **Should the two behaviors be a setting?**
   No — current-vs-fixed is not a real choice, it's correct-vs-defective. The real configurable axis
   is *typing allowed vs. pick-only* (a touch/kiosk concern with clear industry precedent), which is
   orthogonal to this fix and can be decided later.

---

## Follow-ups (not done — flagging only)

- The fix is in ZK core (`zkmax` `Daterangebox.ts` / `DaterangePopup.ts`), so it should be filed
  against the ZK Jira project rather than fixed in Marble. The `zk-bug-filing` skill covers the
  required template and the mandatory *Affects Version/s* field.
- Worth re-checking whether Datebox's `readonly` has the same "picker also disabled" behavior as
  DateRangeBox's; only DateRangeBox was read here.
