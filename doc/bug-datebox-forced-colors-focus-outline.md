# BUG: datebox focus outline missing in Windows High-Contrast (forced-colors)

**Status:** ✅ RESOLVED (2026-07-21) — **not** an a11y defect; it was a **test-harness
measurement race**. The forced-colors guard and its cascade were correct all along.
**Filed:** 2026-07-21 (surfaced while verifying the CTV rollout batch).
**Fix:** `src/test/playwright/forced-colors.spec.ts` — the *"text-input focus draws a
real outline"* test now uses auto-retrying web-first assertions
(`expect(box).toHaveCSS('outline-style','solid')`) instead of a single-shot
`getComputedStyle` read taken immediately after `.focus()`.

---

## Root cause (confirmed by runtime probe)

A temporary probe was added right after `.focus()` and run under the `forced-colors`
project. It captured, on the focused datebox:

```
mediaActive : true                       // forced-colors emulation IS active
activeEl    : z-datebox-input            // focus DID land on the input
focusWithin : true                       // .z-datebox DOES match :focus-within
outline     : rgba(5, 0, 73, 0.8) solid 2px   // the guard's outline IS applied
boxShadow   : none                       // normal-mode ring correctly stripped by WHCM
```

So the guard `.z-datebox:focus-within { outline: 2px solid Highlight; outline-offset: -1px }`
(unlayered in `norm.css.dsp`, the sole rule setting `outline` on the wrapper) applies
exactly as designed. The reported `outline-style: none` was **not** a real missing
outline — it was the original test reading computed style in a single shot **immediately**
after `.focus()`, with no auto-retry and no focus/settle wait. On a slow/cold ZK render
that eager read could land before the client-side widget finished wiring and the style
resolved, so it observed `none`. Every *other* forced-colors assertion checks a static
state (selected row, glyph, border) that needs no interactive focus — which is why this
was the only failing one.

Why the original doc "verified" it on `12ed13f`: the CTV batch never touched
`datebox.css` / `_forced-colors.css`, so the guard was identical on both commits; the
race is timing/environment-dependent (cold app, load), not commit-dependent — it does
**not** reproduce on a warm app (8/8 in isolation, 13/13 in the full project).

## Fix

`src/test/playwright/forced-colors.spec.ts` (the `text-input focus…` test):

- Wait for `.z-datebox-input` to be **visible**, then `.focus()`.
- Assert the outline with **web-first `toHaveCSS`** assertions on `.z-datebox`, which
  auto-retry until the guard's outline lands (or time out and fail — so a *genuinely*
  missing outline would still be caught).

This eliminates the race class without touching any theme CSS (the guard is correct;
per `doc/spec/forced-colors.md` forced-colors remedies stay in the central unlayered
`tokens/_forced-colors.css`, never per-component).

## Verification

```bash
# preview app up: withjdk.sh 17 mvn test exec:java@preview-app
npx playwright test --config=src/test/playwright/playwright.config.ts \
  --project=forced-colors -g "text-input focus draws a real outline" --repeat-each=10
# → 10 passed
npx playwright test --config=src/test/playwright/playwright.config.ts --project=forced-colors
# → 13 passed (no regression)
```

## Relevant files

- Test (fixed): `src/test/playwright/forced-colors.spec.ts` (the `text-input focus…` test)
- Guard (correct, unchanged): `src/main/resources/web/zul/css/tokens/_forced-colors.css` (block 1b)
- Datebox focus mechanism (box-shadow inset, stripped by WHCM): `src/main/resources/web/js/zul/inp/css/datebox.css` (~L37)
- Forced-colors design notes: `doc/spec/forced-colors.md`
