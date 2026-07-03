# Button baseline-screenshot verification (2026-07-03)

**Question:** Yesterday (2026-07-02) the button appearance changed — were the
baseline screenshots re-saved, and do they still match? If not, redo them.

## Verdict

**Baselines match — nothing was stale.** The gallery/tablet baselines were
re-saved yesterday; the per-state baselines still passed. During verification a
real coverage gap surfaced (the hover elevation was never captured) — that has
now been **fixed** and the 6 state baselines regenerated. See below.

## What changed yesterday (button.css)

| Commit | Change | Affects which state? |
|--------|--------|----------------------|
| `4b0f53e` | reclassify variants into 3 categories; `box-shadow:none` on outlined/text | base variants |
| `3cb75aa` | **hover elevation lift** (`box-shadow: elevation-2`) + hover overlay `0.08→0.12` on filled buttons | `:hover` (filled) |
| `44428ae` | 8px graphic→label gap; combobutton | base / gallery |

## Baseline state on disk

| Baseline | mtime | Status |
|----------|-------|--------|
| `button/gallery.png` | Jul 2 21:36 | ✅ re-saved yesterday (in `44428ae`) |
| `button/tablet.png` | Jul 2 21:39 | ✅ re-saved yesterday (in `44428ae`) |
| `button/default-{hover,focus,active}.png` | Jun 15 | ✅ still match live render |
| `button/outlined-{hover,focus,active}.png` | Jun 15 | ✅ still match live render |
| `combobutton/*` | Jun 30–Jul 2 | ✅ match |

## How it was verified

1. `npm run screenshot:test -- -g "button"` → **12/12 pass** against the
   live app serving the post-change CSS.
2. `npm run screenshot:update -- -g "button"` (Playwright `changed` mode) →
   **rewrote zero button/combobutton PNGs**; `git status doc/screenshots/button`
   is clean. So the Jun-15 per-state baselines are byte-close enough to the
   current render that they need no redo.

## The gap (why the Jun-15 hover baseline still matches despite the change)

The button per-state tests capture with `toHaveScreenshot(el)` — an **edge-tight
element screenshot** (screenshot.spec.ts:72). A CSS `box-shadow` paints *outside*
the element's box, so the new hover **elevation lift is clipped away** and never
appears in `default-hover.png`. The only in-box change (overlay `0.08→0.12`) is
below Playwright's per-pixel threshold. Net: the baseline "matches", but it does
**not** visually represent yesterday's headline change, and the harness cannot
catch a future regression of the hover elevation.

Every other stateful component (14 tests, incl. combobutton) captures via
`padShot()` — element **+ 12px margin** — which *does* include the shadow/ring.
The button state tests are the lone exception.

**Fix applied (2026-07-03):** the button `default/outlined × hover/focus/active`
captures now use `padShot(page, el, [DIR, ...])` instead of `toHaveScreenshot(el)`
(screenshot.spec.ts:69). The 6 state baselines were regenerated; `default-hover.png`
now visibly includes the `elevation-2` drop shadow. Verified 6/6 pass in
comparison mode. This aligns button with the rest of the suite and gives the
hover-elevation change real baseline coverage.

## Unrelated note

`doc/screenshots/{bandbox,combobox,datebox}/{gallery,tablet}.png` show as
modified in the working tree. These are **not** from this button verification —
they pair with the uncommitted `bandbox.css`/`combobox.css`/`datebox.css` edits
(input-component work in progress) and were left untouched.
