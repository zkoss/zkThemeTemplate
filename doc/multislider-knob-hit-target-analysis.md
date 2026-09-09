# multislider knob hit-target — verified mechanism, and the fix

Companion to [multislider-knob-hit-target.md](multislider-knob-hit-target.md). That doc reported the
symptom correctly; this one replaces its root-cause section with a measured mechanism, because the
reported one ("the hit lands on the rail container") points at the wrong element and therefore hides
how bad the defect actually is.

Measured on 2026-09-08 against the running preview app (`/multislider.zul`), Chromium, 1400×1200.

## What is actually intercepting the pointer

`<sliderbuttons>` is a child *widget*, not a decoration. Its mold
([zkex/slider/mold/sliderbuttons.js](/Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web/js/zkex/slider/mold/sliderbuttons.js))
emits one `div.z-sliderbuttons` per range, each holding its own `-area` and two `-btn`. So a
three-range multislider renders **three sibling `.z-sliderbuttons`**, and
[multislider.css:79-85](../src/main/resources/web/js/zkmax/slider/css/multislider.css#L79-L85)
stretches every one of them across the whole rail:

```css
.z-sliderbuttons { position: absolute; top: 0; left: 0; width: 100%; height: 100% }
```

Three transparent 500×4 overlays, stacked. None of them — and none of the knobs inside them — carries
a `z-index`, so paint order is DOM order: **the last range's container paints over every earlier
range's knobs.**

Probe result on the page's first (3-range) multislider, `elementFromPoint` at each knob's own centre:

| range | knob | knob `z-index` | element hit at centre | reachable |
|---|---|---|---|---|
| 1 | start | `auto` | `div#z6CLd.z-sliderbuttons` | **no** |
| 1 | end | `auto` | `div#z6CLd.z-sliderbuttons` | **no** |
| 2 | start | `auto` | `div#z6CLd.z-sliderbuttons` | **no** |
| 2 | end | `auto` | `div#z6CLd.z-sliderbuttons` | **no** |
| 3 | start | `auto` | `div#z6CLd-start-btn.z-sliderbuttons-button` | yes |
| 3 | end | `auto` | `div#z6CLd-end-btn.z-sliderbuttons-button` | yes |

`z6CLd` is the **third** `.z-sliderbuttons` — a sibling, not the knob's own parent. Two corrections
follow from that:

1. **Scale.** It is not "the first knob". With N ranges, `2(N-1)` of `2N` knobs are unreachable at
   their centre; only the topmost range is grabbable. The test caught it with `.first()` purely
   because `.first()` is the worst case.
2. **A knob is never blocked by its own parent.** Within one container the knob is a positioned child
   and paints above it — which is why range 3 passes, and why every *single*-range multislider on the
   same page (the marks / disabled / tooltip examples) is fine today. The bug needs two or more
   ranges to appear at all, so "multislider works" was never tested where it breaks.

The doc's "still catchable above and below the rail" observation holds and explains why nobody
reported it: the overlays are only 4px tall while the knob is 20px, so the top and bottom ~8px bands
still respond. Only the aiming point is dead.

## Why rangeslider is immune — two independent reasons

- It has exactly **one** `.z-sliderbuttons` (the widget owns it; there is no child list), so there is
  no later sibling to paint over anything.
- Its CSS already lifts the knob:
  [rangeslider.css:120](../src/main/resources/web/js/zkex/slider/css/rangeslider.css#L120)
  `z-index: 2`.

Either alone would be sufficient. So multislider is not "missing a rule rangeslider has for the same
reason" — rangeslider's `z-index: 2` is doing a different job there (sitting above `-area`'s
`z-index: 1` and the active mark dot's `z-index: 1`).

## The fix — SHIPPED 2026-09-09 (D1 = option A)

One rule, scoped, in [multislider.css](../src/main/resources/web/js/zkmax/slider/css/multislider.css)
next to the existing `.z-sliderbuttons-button` block:

```css
/* Each <sliderbuttons> child renders its own `.z-sliderbuttons`, and every one is
   stretched over the full rail — so a later range's container paints over an
   earlier range's knobs and steals the pointer at the knob's centre. Lift the
   knob out of the auto/DOM-order group so it is grabbable regardless of range
   count. Scoped under .z-multislider for the same collision reason documented in
   rangeslider.css: the `.z-sliderbuttons-*` vocabulary is shared. */
.z-multislider .z-sliderbuttons-button { z-index: 2; }
```

Landed verbatim in
[multislider.css](../src/main/resources/web/js/zkmax/slider/css/multislider.css), immediately after
the `.z-sliderbuttons-button` block. Verification, in order:

| step | result |
|---|---|
| guard written first, before the CSS | RED — 6 knobs listed (4 horizontal + 2 vertical), all naming the same blocker |
| guard after the CSS | GREEN — multislider, rangeslider and slider all pass |
| originally-failing `screenshot.spec.ts › multislider › hover` | passes |
| `multislider`/`rangeslider` hover + focus baselines | unchanged (no visual diff — the restacked elements share the accent colour) |
| gallery baselines for all three slider pages | unchanged |
| the 6 Component-Theme-Variable knob-contract tests for slider/rangeslider/multislider | pass |
| real drag from a previously dead centre (70% knob, crossing nothing) | moves 70% → 90%, no other knob touched |

Why one declaration is enough: neither `.z-multislider` (`position: relative`, no `z-index`) nor
`.z-sliderbuttons` (`position: absolute`, no `z-index`) creates a stacking context, so all three
containers and all six knobs compete in the *same* stacking context. A single `z-index: 2` therefore
lifts every knob above every container in one step — no per-range work, no JS.

Knobs of different ranges remain at equal `z-index`, so overlapping knobs still resolve by DOM order
(later range on top), which is the behaviour you want and what happens today.

## Answers to the handoff doc's open questions

1. **Does `-area` need `z-index: 1` too? — No.** Only the knob's stacking decides hit-testing, and
   with knobs at `2` and every area at `auto`, a knob always paints above every area, including one
   dragged past it. rangeslider needs `z-index: 1` there for an unrelated reason (its active mark dot
   is also at `1`); multislider's marks carry no dot
   ([multislider.css:213-221](../src/main/resources/web/js/zkmax/slider/css/multislider.css#L213-L221))
   and `.z-multislider-marks` is `pointer-events: none`. Adding it would be a rule with no observable
   effect. Leave it out.
2. **Scoped, or a shared base rule? — RULED: scoped** (`.z-multislider …`), per the fix above. A shared
   `_slider.css` for the `.z-sliderbuttons-*` vocabulary is a defensible cleanup but a separate
   change with its own bundling question — the two files land in different `.css.dsp` outputs
   (zkex vs zkmax), so a shared layer needs a home that both bundles pull in. Do not couple it to a
   one-line interaction fix. This was the only genuine decision here, and it is closed.
3. **Does `rangeslider › hover` pass for the right reason? Yes**, for the two reasons above — but
   nothing asserted it, so it would have regressed silently the day rangeslider gains a child-widget
   list. **Done:** [hit-target.spec.ts](../src/test/playwright/hit-target.spec.ts) now covers all
   three slider variants (multislider, rangeslider, plain slider) with the same assertion.
4. **Sweep for other unstacked absolutely-positioned interactive children?** Still open, unmeasured.
   Note the actual signature to grep for is narrower and more useful than "absolute child with no
   z-index": *a widget that renders one full-size positioned overlay per child widget*. That is what
   turns a missing `z-index` into a dead hit target.

## The guard — [hit-target.spec.ts](../src/test/playwright/hit-target.spec.ts), `npm run test:hit-target`

Written RED before the CSS, per `doc/skill-feedback-loop.md`. The assertion that encodes the
requirement is hit-testability, not hover-ability — and it covers **every** knob, not `.first()`,
because the topmost range is always reachable and a spot check that lands on it reports a false
green:

```ts
for (const knob of await page.locator('.z-multislider .z-sliderbuttons-button').all()) {
  expect(await knob.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
  })).toBe(true);
}
```

Two details the first draft got wrong, both worth keeping in mind for the question-4 sweep:

- **`elementFromPoint` takes viewport coordinates and returns `null` outside them.** Every slider
  below the fold reported a phantom "blocked by nothing" until each knob was `scrollIntoView`'d and
  its rect re-read. A hit-test guard that does not scroll is measuring the fold, not the CSS.
- **Disabled widgets must be skipped, not asserted.** `pointer-events: none` is inherited, so
  `getComputedStyle(knob).pointerEvents === 'none'` is the precise skip predicate — without it the
  page's Disabled example fails for a completely unrelated reason.

## Reproduce

Preview app running, then:

```bash
node -e '
const { chromium } = require("./node_modules/@playwright/test");
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto("${PREVIEW_URL}/multislider.zul", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".z-sliderbuttons-button");
  const probe = () => p.evaluate(() => [...document.querySelector(".z-multislider")
    .querySelectorAll(".z-sliderbuttons-button")].map((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { knob: el.id, hit: hit.id + "." + hit.className, ok: hit === el };
    }));
  console.log("before", await probe());
  await p.addStyleTag({ content: ".z-multislider .z-sliderbuttons-button{z-index:2}" });
  console.log("after ", await probe());
  await b.close();
})();'
```

---

# Manual reproduction — by hand, in a browser, on `/multislider.zul`

No tooling. Every symptom below was measured on 2026-09-09 (Marble, ZK 11.0.0.FL.20260904,
Chromium 1400×1200) so you know exactly what to expect before you look.

## Setup

```bash
withjdk.sh 17 mvn test exec:java@preview-app
```

Open **${PREVIEW_URL}/multislider.zul**

> Port note: the preview app binds **8081**, set in
> [ThemePreviewApp.java:36](../src/test/java/zk/example/ThemePreviewApp.java#L36), not 8080.
> (Resolved 2026-09-09: `CLAUDE.md`'s table no longer restates the address — it refers to
> `${PREVIEW_URL}`. Iceblue moved to 8082 in the same change.)
> Use `127.0.0.1`, not `localhost`.

## The target: the top "Horizontal / 3 ranges" slider

Six knobs on one 500px rail. Left to right their values are **10, 20, 30, 40, 50, 70**, and they
belong to three overlapping ranges:

```
   10        20   [30    40]   50              70
   └── range 1 (10-70) ──────────────────────────┘
             └── range 2 (20-50) ──┘
                  └ range 3 ┘   ← only THESE two are grabbable today
```

**The two innermost knobs (30 and 40) work. The other four are broken.** Range 3 is the last one in
the markup, so its full-width overlay sits on top of everything before it.

The knob is 20px tall; the overlay stealing the pointer is only **4px** tall and sits on the rail
line. So on each broken knob the dead zone is a thin horizontal band through its **middle**, and the
top and bottom thirds still work. That is what makes all three tests below a *same knob, two
positions* comparison — no need to trust an absolute pixel coordinate.

## Test 1 — cursor shape (fastest, 5 seconds)

Hover slowly **up and down** over the leftmost knob (value 10), crossing its middle.

| where on the knob | cursor you get | correct? |
|---|---|---|
| dead centre (on the rail line) | **`pointer`** — pointing hand 👆 | no |
| ~6px above or below centre | **`grab`** — open hand ✋ | yes |

The cursor flickers hand → open-hand → hand as you cross the middle. Now do the same on the knob at
**30**: open-hand everywhere, no flicker. That contrast *is* the bug.

## Test 2 — value tooltip (unambiguous, no cursor-squinting)

The tooltip only appears when the pointer is genuinely on the knob
([multislider.css:195-201](../src/main/resources/web/js/zkmax/slider/css/multislider.css#L195-L201)).

1. Rest the pointer on the exact middle of the leftmost knob (value 10) → **no tooltip appears at
   all**, however long you wait.
2. Move 6px up, without leaving the knob → the black **`10`** tooltip pops up.
3. Repeat on the knob at 30 → tooltip shows from the middle too.

## Test 3 — drag (the symptom a user would actually report)

Use the **rightmost** knob (value 70) and drag it **right**. Direction matters — see the trap below.

1. Press on its exact middle, drag right ~100px, release → **nothing moves at all.** No knob follows
   the mouse, no value changes, the slider ignores you completely.
2. Press ~6px above its middle, drag right ~100px, release → the knob follows and the value goes to
   roughly 90.

Both presses are inside the same 20×20 circle, ~6px apart.

## Traps — three things that will make you doubt a correct observation

1. **Don't drag a knob across another knob.** Ranges are ordered, so pushing one start knob past
   another drags the others along with it — dragging the value-10 knob rightwards past 20 and 30
   parks all three at the same value. That is the component's own constraint, verified separately
   (a non-crossing drag moves exactly one knob), and it is **not** this defect. Dragging the
   rightmost knob rightwards crosses nothing.
2. **Ignore the "Disabled" slider** further down the page. A pointer test "fails" there too, but
   only because the whole widget is `pointer-events: none`. Different cause, not a second instance.
3. **The single-range sliders further down are genuinely fine.** "markScale", "Custom text marks"
   and "Always-visible tooltips" each have one `<sliderbuttons>`, so there is no second overlay and
   both their knobs work from the middle. If you test only those you will conclude multislider is
   healthy — which is exactly how this shipped.

## Second location — the vertical slider ("Vertical / 2 ranges")

Two ranges → **the first range's two knobs are dead, the second range's two work.** Same tests, but
the rail is 4px *wide* instead of tall, so the dead band is a vertical stripe down the knob's middle:
escape **left or right**, not up or down.

## What you should end up with

| slider on the page | ranges | knobs | dead at centre |
|---|---|---|---|
| Horizontal, 3 ranges | 3 | 6 | **4** |
| Vertical, 2 ranges | 2 | 4 | **2** |
| markScale (single) | 1 | 2 | 0 |
| Custom text marks (single) | 1 | 2 | 0 |
| Disabled (single) | 1 | 2 | (n/a — `pointer-events: none`) |
| Always-visible tooltips (single) | 1 | 2 | 0 |

Which matches `2(N-1)` of `2N` for N ranges.

## Optional — confirm it in DevTools instead of by feel

Paste into the console on that page; it prints one row per knob of the first slider:

```js
[...document.querySelector('.z-multislider').querySelectorAll('.z-sliderbuttons-button')]
  .forEach((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    console.log(el.style.left, hit === el ? 'OK' : 'BLOCKED BY ' + hit.id + '.' + hit.className);
  });
```

Expect four `BLOCKED BY …z-sliderbuttons` and two `OK`. Every blocker prints the **same** id — the
last range's container — which is the whole diagnosis in one line.
