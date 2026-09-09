# Content-fit / size-less-input — similar-cases audit (2026-07-20)

**Trigger**: after the datebox/timebox/daterangebox content-fit fixes, check whether other
components have the same class of defect (input not hugging its content → collapse / clip / gutters).

**Method**: audited every `.z-*-input` CSS rule across `src/main/resources/web/js/**` for
`flex`/`min-width`/`field-sizing`/`text-align`/`width`; empirically measured the standout candidate
(timepicker) on the running app (`clientWidth` vs `scrollWidth` = clipping).

## Verdict: ONE real similar case — **timepicker**

| component | input CSS | ZK input attr | status |
|---|---|---|---|
| datebox | `field-sizing: content` ✓ | size-less | **fixed** (this sweep) |
| timebox | `field-sizing: content` ✓ | size-less | **fixed** (this sweep) |
| daterangebox | `field-sizing: content` ✓ | size-less | fixed (prior) |
| **timepicker** | `flex:1; min-width:0`, **no field-sizing** | **`size="5"`** (hardcoded) | **DEFECT — clips long format** |
| combobox / bandbox / chosenbox | `flex:1; min-width:0` | free-text | correctly excluded (content-hug jitters per keystroke) |
| spinner / doublespinner | `flex:1; min-width:0` | numeric, variable len | correctly excluded |
| colorbox | `width:96px/48px` + center | hex fields | fixed width by design (not formatted-value clip) |
| paging | `width:48px` + center | page number | fixed width by design |
| listbox (inline edit) | `width:32px` + center | inline cell edit | fixed width by design |

## timepicker — evidence (empirically measured, /_probe-timepicker.zul, since removed)

DOM: `<input class="z-timepicker-input" type="text" size="5" readonly>` — ZK **hardcodes `size="5"`**
(fits `HH:mm` = 5 chars). The root is inline-flex + shrink-wrapped, so `flex:1;min-width:0` can't grow
the input past its `size=5` intrinsic width.

| instance | format | value | clientW | scrollW | clipped? |
|---|---|---|---|---|---|
| bare | `HH:mm` | (empty) | 66px | 66px | no |
| bare | `HH:mm:ss` | (empty) | 66px | 66px | no (empty) |
| seeded | `HH:mm:ss` | `09:05:07` | **66px** | **79px** | **YES — 13px clipped** |

- **Same class as the datebox long-format clip** (`yyyy/MM/dd HH:mm` → scrollW 132 > clientW 108).
  Mechanism differs: datebox was size-less→collapse; timepicker is `size="5"`→too small for `HH:mm:ss`.
- **Masked in previews**: every timepicker in `pv/timepicker-content.zul` sets `width="160px"`, at which
  `09:05:07` fits — so no screenshot review ever saw the clip. A bare/narrow timepicker clips.
- **Safe to content-hug**: the input is `readonly` (value picked from the popup, not typed), so there is
  **no per-keystroke jitter** risk — even safer than datebox. It fits the DESIGN.md §10 policy
  ("content-hug fixed-format date/time fields") exactly; it was simply **omitted from the sibling sweep**.
- **Proposed fix** (mirrors timebox): `.z-timepicker-input` → `field-sizing: content` +
  `flex: 1 1 auto` + `min-width` floor (~5em) so it hugs `HH:mm` and grows to fit `HH:mm:ss` without clip.

## Separate blocker found while reviewing the datebox/timebox commit
The datebox/timebox **skill-gaps.md row over-claims its highest layers**: it lists Skill
`combo-trio.md` (family size-less policy) and Spec `DESIGN.md §10` (content-hug policy) under
`layer` / `fix-location`, but **both files are CLEAN / untouched** (verified: no `field-sizing`,
`content-hug`, or size-less content in either). So the two highest-layer backfills the retrospective
claims were never actually made — the fix landed only at CSS + contract + preview + test.
