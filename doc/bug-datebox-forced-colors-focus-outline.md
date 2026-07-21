# BUG: datebox focus outline missing in Windows High-Contrast (forced-colors)

**Status:** OPEN · pre-existing · **NOT** a Component-Theme-Variables regression
(verified: fails identically on clean commit `12ed13f` via `git stash`).
**Owner:** to be handled in a dedicated session.
**Filed:** 2026-07-21 (surfaced while verifying the CTV rollout batch).

---

## Summary

In forced-colors (Windows High-Contrast) mode, focusing a **datebox** does **not**
render the expected real `outline`. The a11y guard rule that should draw it *exists
and is compiled into `norm.css.dsp`*, yet at runtime the focused `.z-datebox` reports
`outline-style: none`. So keyboard focus on a datebox is invisible in High-Contrast —
a real accessibility defect (the box-shadow focus ring is stripped by forced-colors,
and the outline that's supposed to replace it isn't taking effect).

## Reproduce

```bash
# preview app must be up (withjdk.sh 17 mvn test exec:java@preview-app)
npx playwright test --config=src/test/playwright/playwright.config.ts \
  --project=forced-colors -g "text-input focus draws a real outline"
```

Test: [`src/test/playwright/forced-colors.spec.ts:50`](../src/test/playwright/forced-colors.spec.ts#L50)
— goes to `/datebox.zul`, focuses `.z-datebox-input`, reads `.z-datebox` computed style.

| | Value |
|---|---|
| Expected `outline-style` | `solid` |
| Expected `outline-width` | `2px` |
| **Actual `outline-style`** | **`none`** |

## Evidence gathered

1. **The guard rule exists** — [`tokens/_forced-colors.css`](../src/main/resources/web/zul/css/tokens/_forced-colors.css) block "(1b) Text-input focus …" (~L95–105), inside the `@media (forced-colors: active)` block:
   ```css
   .z-datebox:focus-within, .z-timebox:focus-within, .z-spinner:focus-within,
   .z-doublespinner:focus-within, .z-bandbox:focus-within, .z-combobox:focus-within {
       outline: 2px solid Highlight;
       outline-offset: -1px;
   }
   ```
2. **It is in the build** — `grep z-datebox:focus-within target/classes/web/marble/zul/css/norm.css.dsp` returns the rule (unlayered, so it should beat layered component rules).
3. **Selector is correct** — the datebox mold renders `<input class="z-datebox-input">` inside `.z-datebox`; the test focuses `.z-datebox-input`, so `.z-datebox:focus-within` *should* match.
4. **Normal-mode focus is Mechanism A** — [`datebox.css:34–39`](../src/main/resources/web/js/zul/inp/css/datebox.css#L34) uses an **inset `box-shadow`** ring (border stays 1px). forced-colors strips box-shadow, which is exactly why the (1b) outline guard is needed.
5. **Forced-colors emulation works** — 12 of 13 forced-colors assertions pass (including "forced-colors is actually emulated" and other outline guards), so the media emulation and most guards are fine. Only this datebox-focus outline is missing.
6. **Pre-existing** — reproduced on clean HEAD `12ed13f` (stashed the CTV batch, rebuilt, re-ran → still `none`). The CTV rollout did not touch `datebox.css`, `input.css`, or `_forced-colors.css`.

## Hypotheses (ranked, for the fix session)

1. **`:focus-within` never activates.** `.z-datebox-input.focus()` under Playwright may not
   establish focus inside `.z-datebox` (ZK client focus management, or the input not being the
   real focusable node as currently rendered) — so the guard rule simply never matches.
   *Check:* after `.focus()`, assert `.z-datebox` actually matches `:focus-within`
   (`el.matches(':focus-within')`) and that `document.activeElement` is the datebox input.
2. **Cascade override.** Another unlayered / higher-specificity rule sets `outline` on
   `.z-datebox` (or forces it to `none`) and beats the guard. *Check:* DevTools computed
   → "outline" origin, or a probe reading `outline` before/after removing candidate rules.
3. **ZK DOM drift.** A ZK version bump may have changed the datebox DOM so the focused element
   is no longer a descendant of `.z-datebox` (e.g. a portalized popup), breaking `:focus-within`.
4. **Playwright forced-colors + outline quirk.** Least likely (other outline guards pass), but
   confirm the same rule works for `.z-combobox:focus-within` (shares the guard) — if combobox
   passes and datebox fails, it's datebox-specific (points to #1/#3).

## Suggested first step

Add a temporary probe (or a `page.evaluate`) in the fix session to capture, right after focus:
`document.activeElement.className`, `.z-datebox` `:focus-within` match, and the computed
`outline`/`box-shadow` — that single measurement should discriminate #1/#3 (focus not landing)
from #2 (override).

## Relevant files

- Test: `src/test/playwright/forced-colors.spec.ts:50`
- Guard: `src/main/resources/web/zul/css/tokens/_forced-colors.css` (block 1b)
- Datebox focus: `src/main/resources/web/js/zul/inp/css/datebox.css` (~L34)
- Forced-colors design notes: `doc/spec/forced-colors.md`
- Focus mechanism: `doc/reference/focus-affordance-no-layout-shift.md` (Mechanism A)

> Note: the *review-only* `forced-colors-gallery.spec.ts` (writes PNGs directly, no assertion)
> is unrelated to this failure — the real gate is the assertion spec above.
