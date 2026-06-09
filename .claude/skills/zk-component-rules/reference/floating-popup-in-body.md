# Floating popups attach to `<body>`, not to the trigger

Many ZK components (combobox, datebox, timebox, bandbox, chosenbox, cascader, menupopup, datebox calendar, etc.) render their popup as a **direct child of `<body>`** at runtime — not nested under the trigger element. This is done so the popup can escape `overflow: hidden` / stacking contexts.

## Verified DOM shape

For chosenbox (also applies to combobox, datebox, etc.):

```html
<body>
  <span class="z-chosenbox">                          ← trigger
    <input class="z-chosenbox-input"/>
    …
  </span>
  …
  <div class="z-chosenbox-popup"                       ← popup, sibling of trigger inside <body>
       id="…-pp"
       style="width: 200px; left: 206px; top: 244px;  ← ZK sets these inline
              visibility: visible; display: block;">
    …
  </div>
</body>
```

`parentElement.tagName === 'BODY'` for the popup element after first open. The trigger and popup are **siblings**, not parent-child.

## Implication: the popup CSS MUST declare `position: absolute` (+ a z-index)

ZK sets the popup's `left`/`top` (and often `width`) **inline** at open time — but it does **not** set `position`. Positioning offsets only take effect on a positioned box, so the theme CSS is responsible for supplying `position: absolute` (or `fixed`). If the popup rule omits it, the element computes `position: static`, the inline `left`/`top` are inert, and the popup drops into normal `<body>` flow — rendering at the **bottom-left of the page**, after all body content.

```css
.z-{component}-popup {
    position: absolute;   /* REQUIRED — ZK's inline left/top are dead without it */
    z-index: 1600;        /* dropdown stacking; calendar/datebox use 1700 */
    /* … surface, shape, elevation … */
}
```

This is a ZK structural fact, not a theme choice: **any** theme that styles a detached popup and forgets `position` hits the identical bottom-left bug. Verify every `*-popup` **base** rule declares `position` — a modifier rule (`.z-x-open .z-x-popup`) inheriting from a positioned base is fine, but a base rule without `position` is the bug.

> Caught 2026-06-08 on `.z-timepicker-popup` (its sole rule lacked `position`). A prior `width: max-content !important` workaround had masked it by capping the width, so the full-body-width `static` box wasn't obvious. Fix = `position: absolute; z-index: 1600` (and the width hack became unnecessary — under `position: absolute`, ZK's inline `width: auto` shrink-fits to content). See `doc/skill-gaps.md`.

## Implication: percentage-based widths reference `<body>`

Because the popup's offset parent is `<body>`, any percentage size in CSS resolves against the body box:

| CSS on popup        | What you intended       | What it actually does                       |
|---------------------|-------------------------|---------------------------------------------|
| `width: 100%`       | "match the trigger"     | match the viewport (body width, ~1900px)    |
| `min-width: 100%`   | "at least trigger wide" | at least viewport wide → popup spans page   |
| `max-width: 100%`   | "no wider than trigger" | no wider than viewport (effectively no cap) |

This is the same trap as `position: absolute` children whose offsetParent is `<body>` — except here the relocation is done by ZK at runtime, not by CSS, so a theme author who only looked at the static markup will not predict it.

## Why this isn't a bug in ZK

ZK already sets the popup's pixel width inline at runtime to match the trigger (e.g. `style="width: 200px"`). The theme does **not** need to provide its own width rule — and if it does, the CSS rule will override the inline style (since inline `style` loses to a CSS rule of the same specificity that uses `!important`, but here even a non-`!important` CSS rule wins over inline if the inline value is *smaller* than a `min-width` constraint — `min-width` always wins over `width`).

## The rule

For any popup that ZK detaches to `<body>`:

1. **Do not write `width`, `min-width`, `max-width` in terms of percentage on the popup root.** ZK sets the absolute pixel width inline.
2. If you need a floor (e.g. "popups should be at least 160px so a short label doesn't collapse the dropdown"), use a fixed pixel value: `min-width: 160px`. Never `min-width: 100%`.
3. If you need a ceiling (e.g. "popups never wider than 480px"), use a fixed pixel value: `max-width: 480px`. Never `max-width: 100%`.
4. `width`/`height` of the popup *content* (rows, items) can use percentages — they resolve against the popup, which has a known pixel size.

## Verification (live DOM, confirmed 2026-05-14)

For chosenbox at `http://localhost:8080/chosenbox.zul`:

- `document.querySelector('.z-chosenbox').getBoundingClientRect().width` → 200
- `document.querySelector('.z-chosenbox-popup').parentElement.tagName` → `"BODY"`
- `document.querySelector('.z-chosenbox-popup').style.width` → `"200px"` (ZK inline)
- Before fix: rendered width = 1904 (because CSS `min-width: 100%` resolves to body)
- After fix (rule removed): rendered width = 200 (matches inline)

## Components known to use this pattern

- **inp**: combobox, bandbox, datebox (calendar popup), timebox (clock popup), chosenbox, cascader popup
- **menu**: menupopup, menubar dropdowns
- **wgt**: popup (the explicit `<popup>` tag), notification
- **wnd**: window (modal/embedded popup positioning)
- **layout**: borderlayout collapsed slideout

When the bundle for any of these components is written, the popup-width expected value must verify rendered width matches the trigger width (or whatever ZK's inline sets), not full-viewport.

## JS-driven drop-direction flip (downward vs upward)

ZK popups don't always extend downward. Most ZK popup widgets contain a JS `_repositionPopup` (or equivalent) that measures viewport space and flips the anchor between `after_*` (below trigger) and `before_*` (above trigger) when bottom space runs out.

Examples:

- **Searchbox** (`Searchbox.ts _repositionPopup`): explicit `vPosition = 'after'` else `'before'` based on `screenY + screenHeight - inpTop - inpHeight > ppHeight`.
- **Combobox** (`Combobox.ts:183`): can call `zk(popup).position(input, 'before_start')` to flip above the input.
- **Datebox, bandbox, chosenbox**: rely on `zk.Widget.position()` default which has similar flip logic.

**This means CSS cannot pin popups to "always drop downward".** The `top: 100%` / `left: 0` you'd normally write is unreliable because ZK inline-sets `top` and `left` on the popup at open time, and those inline styles win.

To force a fixed direction (e.g. always-downward) you must override the widget JS in a theme JS layer — there is no pure-CSS path.

