# Analysis: Checkbox `mold="toggle"` — MD3 mapping and sizing

Date: 2026-06-04 · Follow-up to tasks/analysis-checkbox-switch-size.md

## Does the toggle mold have an MD3 counterpart?

**Only approximately — nothing maps cleanly.** The candidates:

| Candidate | What it is | Why it doesn't map cleanly |
|---|---|---|
| MD3 **Toggle button** (Buttons spec, selected/unselected variants) | A regular button (outlined/tonal/filled) that toggles; **label inside** the button | ZK renders the mold element **empty** — the label is always a sibling `<label class="z-checkbox-content">` outside the button (see `ZK10 …/zul/wgt/mold/checkbox.js`: one shared mold renderer for all three molds) |
| MD3 **Toggle icon button** | 40px container (small 32px), 24px icon inside; unselected outlined → selected filled/tonal | Same problem — needs content inside; but CSS *can* inject an icon via `::after` (the default mold already does this for its checkmark) |
| MD3 **Segmented button** | Grouped single/multi-select bar | ZK's toggle is standalone, not grouped |
| **MUI ToggleButton** (project's actual visual benchmark) | radius 4, border `rgba(0,0,0,0.12)`, text `rgba(0,0,0,0.54)`; **selected = primary text on primary-8% tint** (not solid fill); icon medium = 48px, small = 40px, with a 24px icon inside | Content-inside again; and **no Mira page uses it** (`grep MuiToggleButton doc/mira/*.html` → zero hits) ⇒ blind-spot component, MUI static CSS is the only reference |

**Conclusion**: structurally, ZK's toggle is "an empty box that fills when on". The closest
honest interpretation is a **toggle icon button whose icon the theme must supply via CSS**
(`::after`), since ZK gives us an empty element to work with.

## Is it oversized? — Yes, but emptiness is the bigger problem

Measured live (checkbox.zul):

| Property | Current value |
|---|---|
| Mold box | **34 × 36 px** (padding 6px 16px + 1px border, **zero content**) |
| Radius / border | 4px / 1px `--zk-color-outline` rgba(0,0,0,.23) |
| ON state | **solid primary fill** + `inset 0 2px 4px rgba(0,0,0,.18)` shadow |

Problems, benchmarked:

1. **All chrome, no signal**: a blank 34×36 frame next to an 18px checkbox and a 14px-track
   switch reads heavy precisely because nothing is inside it. (MUI/MD3 toggle buttons are
   the same physical size or bigger — 40–48px — but they always contain an icon/label.)
2. **ON treatment off-benchmark**: solid primary + inset shadow is a skeuomorphic "pressed"
   look; MUI ToggleButton selected = primary-tinted **8% background** with primary content;
   MD3 toggle icon button selected = filled/tonal container. The inset shadow exists in
   neither reference.
3. **Border color off-benchmark**: MUI uses `rgba(0,0,0,0.12)` (outline-variant), current
   uses 0.23 (outline).
4. Same provenance as the switch: free-styled, no contract rows (`⚠ NO-ASSERTION` since
   yesterday's contract update).

## Options

### A — MUI ToggleButton treatment at compact size (recommended)
Keep a ~32×32 square (MD3 icon-button *small* container; close to current footprint but
square), restyle to benchmark: border `outline-variant`, radius 4px; **ON = primary-8% tint
+ primary check icon** injected via `::after` (reuse the default mold's SVG-mask technique);
hover = on-surface/primary state layer; drop the inset shadow.
→ Fixes the emptiness (icon gives the box content when on) and the off-benchmark fill.

### B — Same treatment, family-proportioned 28×28
Tighter fit beside 18px checkboxes; deviates further from MUI's 40px but suits dense
enterprise forms.

### C — Keep solid-fill ON, only shrink the box
Minimal change; stays off-benchmark (solid fill + inset shadow remain).

## Decision

User chose **Option A** (2026-06-04). Executed per the feedback-loop workflow:

1. **Skill** — `components/checkbox.md` gained "The mold element is always EMPTY" (shared mold
   renderer; glyphs must be pseudo-element-injected; closest analog = toggle icon button).
2. **Contract first** — tg1–tg7 Expected-values rows added; NO-ASSERTION flag replaced by a
   proper states-checklist item.
3. **CSS** — `checkbox.css` §Toggle mold: 32×32, r4, `outline-variant` border; OFF hover =
   on-surface 8%; ON = primary 8% tint, border unchanged, **no inset shadow**, 20px primary
   check via CSS mask; ON hover = primary 12%.
4. **Verified live** — all tg1–tg7 computed values match; screenshot confirms family proportion.

## Is the check icon MD3-conformant?

**Partially — it is an MD3 selection idiom, but not the toggle-icon-button one.**

- MD3 **toggle icon button** signals selection by container fill + swapping the *same
  functional icon* from outlined to filled. It never materializes a checkmark. ZK cannot do
  this: the mold is empty and the theme has no functional icon to swap.
- MD3 **segmented button** and **filter chip** DO signal selection with a checkmark that
  appears on select — that is the idiom borrowed here, and it matches the widget's actual
  semantics (it *is* a checkbox).
- MUI ToggleButton adds no check (content is app-provided and constant; only tint changes).
  A strictly-MUI rendering would be a tint-only empty square — the very "all chrome, no
  signal" problem that prompted this redesign.

If strict toggle-icon-button reading is preferred, the fallback is tint-only (drop tg5).

## Revision (2026-06-04, same session)

User judged the check icon **semantically wrong for a toggle** — a check reads as *selection
confirmation* (checkbox/segmented-button/filter-chip idiom), while a toggle's idiom is
*pressed/filled*. Decision: remove the check, ON = **solid primary fill** (MD3 toggle button
"selected = filled container" reading — strongest on/off signal for a box that has no content).

Final implemented + verified state:

| id | value (measured live) |
|---|---|
| tg1 | 32 × 32 px |
| tg2 | 1px solid rgba(0,0,0,0.12), radius 4px (off) |
| tg3 | off bg transparent; off hover = on-surface 8% |
| tg4 | ON bg solid rgb(55,111,208), border primary, box-shadow none, `::after` display:none |
| tg6 | ON hover rgb(71,123,212) = on-primary 8% over primary (filled-button convention) |
| tg7 | disabled mold opacity 0.38 |

tg5 (check icon) retired; id not reused. Contract prose updated to record the rationale.

### Harness lesson (promoted to evaluator agent)

While verifying tg6, hover measurements kept returning a frozen `oklab(…)` value equal to the
resting color: **Chrome freezes CSS transitions at t≈0 on occluded tabs**, so the computed style
never reaches the hover end value. Fix: set `el.style.transition='none'` inline, re-read, restore;
decode non-rgb serializations via a 1×1 canvas. Added to `zk-theme-evaluator.md` §Dynamic states
as the "Transition-freeze trap".
