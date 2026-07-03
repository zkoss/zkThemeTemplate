# Click-to-open on combobox / datebox / bandbox — JavaScript design, not CSS

**Date:** 2026-07-03 · **Theme:** Marble · **ZK:** 10.3.0.1-jakarta
**Question:** `tasks/prompt.md` · **Related:** [x2-combobox-readonly-solution.md](x2-combobox-readonly-solution.md) (readonly must read as active), [skill-gaps.md](skill-gaps.md) (2026-07-03 row), skill `.claude/skills/zk-component-rules/reference/buttonVisible-attribute.md`

## The question

For `combobox` / `datebox` / `bandbox`, clicking the **input text area** (not just the dropdown/calendar icon)
opens the popup. The "No button" (`buttonVisible="false"`) case does not open on click. Is "input-click opens
the popup" **ZK JavaScript design** or a **theme CSS defect**? Fix only if it is CSS.

## Verdict

**Intentional ZK JavaScript behavior. The theme neither causes it nor can fix it** (a CSS theme cannot alter JS
event handling; changing it would require overriding ZK client JS, which is outside the theme's remit). The
"No button" case already behaves exactly as expected — also because of ZK's own JS, not the theme.

## Behavior matrix (ZK JS — confirmed by live interaction probe, 2026-07-03)

| State | click the INPUT | click the ICON/button |
|-------|-----------------|-----------------------|
| editable + button visible | does **not** open (only autodrop-on-type) | opens |
| **readonly** + button visible | **opens** (whole control is the trigger) | opens |
| `buttonVisible="false"` (editable *or* readonly) | does **not** open | n/a (no button) |
| disabled | nothing | nothing |

So "clicking the input opens the popup" happens **only** for **readonly + button visible** — and that is
deliberate: a readonly select can't be typed into, so ZK makes the whole field a click target for picking from
the list. Documented in `Combobox.ts:24-27`: "the value of a read-only combobox can be changed by dropping down
the list and selecting a combo item (though users cannot type anything in the input box)."

## Evidence

### ZK JavaScript source (`/Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/`)

- `inp/ComboWidget.doClick_` (ComboWidget.ts:779-793) — opens on any in-control click **only** when readonly and
  button visible:
  ```js
  else if (this._readonly && !this.isOpen() && this._buttonVisible)
      this.open({...});
  ```
- `inp/ComboWidget._doBtnClick` (ComboWidget.ts:742-756) — the button handler no-ops when the button is hidden:
  ```js
  if (!this._buttonVisible) return;
  ```
- `db/Datebox.doClick_` (Datebox.ts:714-719) — identical gate:
  ```js
  if (this._readonly && this._buttonVisible && this._pop && !this._pop.isOpen())
      this._pop.open();
  ```
- Disabled is short-circuited first in both (`if (this._disabled) return`).

**Key consequence:** `buttonVisible="false"` removes the only icon trigger **and** disables the readonly
whole-control click (the `&& this._buttonVisible` guard). A no-button combobox/datebox/bandbox therefore has no
click gesture that opens the popup — the exact behavior the user expected, enforced by ZK, not the theme.

### Theme CSS ruled out independently (`src/main/resources/web/js/zul/inp/css/`)

- The dropdown button (`.z-{comp}-button`) is a **fixed-width flex sibling** (combobox 32px, datebox/bandbox 36px),
  `position:relative` — **not** absolutely positioned over the input. The input is the separate `flex:1` child.
- When `buttonVisible="false"`, the button is `display:none` (combobox.css:350, datebox.css:157, bandbox.css:104) —
  clean removal, no residual hit-area, no `opacity:0`/`visibility:hidden` trick.
- Button `::before` state overlays are `pointer-events:none`; no wrapper/input `pointer-events` routing.
- CSS cannot route an input-click to the button, and cannot open a JS popup at all.

### Live interaction probe (Playwright, throwaway)

Real `click()` on the input vs the icon for every state cell on `/combobox.zul`, `/datebox.zul`, `/bandbox.zul`
(open detected via the `.z-{comp}-open` class ZK toggles). All three components produced the matrix above:
editable+btn → input=no, icon=yes; readonly+btn → input=**YES**, icon=yes; no-button (editable & readonly) →
input=**no**; disabled → click blocked (ZK JS `disabled` guard + theme `pointer-events:none`). No repo test was
kept — per `doc/skill-feedback-loop.md`, a not-a-bug needs no regression test.

## Minor deferred edge (not fixed — user decision 2026-07-03)

In the **readonly + `buttonVisible="false"`** corner case, the theme still applies `cursor:pointer` to the
readonly input (`.z-{comp}-readonly .z-{comp}-input`; combobox.css:315-320, datebox.css:131-134, bandbox.css:151-156),
but ZK does not open the popup there (no button), so the pointer cursor implies a click action that does nothing.
The honest cursor is `default`. A `:has()`-scoped rule would fix it if ever wanted:

```css
.z-combobox.z-combobox-readonly:has(.z-combobox-button:not(.z-combobox-disabled)) .z-combobox-input { cursor: pointer; }
/* datebox / bandbox equivalents */
```

Accepted as a rare edge; **no CSS change made in this task.**
