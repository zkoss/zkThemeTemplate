# Clipped focus rings — backlog

Produced by `npm run test:focus-scan` (`src/test/playwright/focus-ring-scan.spec.ts`)
on 2026-09-06, the first run of the scan built for decision **D13**. The machine-
readable list the scan checks itself against is `doc/focus-ring-known-clips.json`.

## What the scan does

For every preview page it reads the loaded stylesheets, collects every selector
that has a `:focus-visible` rule drawing an `outline`, forces `:focus-visible` on
each matching element through CDP (`CSS.forcePseudoState`) so the ring is really
applied, then inflates the element's rect by `outline-offset + outline-width` and
walks its ancestors. Any ancestor that clips overflow and is smaller than the
inflated ring on any side is a finding.

Forcing the pseudo-class rather than driving real keyboard input is what makes
this generalise: reaching a given widget's focus by scripted Tab or click is the
part that does not (navbar, for one, has a roving tabindex — Tab enters the whole
widget once and arrow keys move inside).

A second pass repeats the measurement under forced-colors for items that are
**selected as well as focused**, and compares the ring's colour against whatever
is actually painted where the ring lands (hit-tested, because an inset ring
covers the element's own fill while an outset one covers what is outside it).

## Why these matter

A ring drawn outside a box that has no room is not "slightly cropped" — on a
flush edge it is **entirely** invisible. Measured on `hlayout.zul`: the button's
box is 187→223 and the hlayout's box is *also* 187→223, so all 4px of ring above
and below the button falls outside the clip. A keyboard user cannot see which
button they are on.

## Findings — 13 distinct (element ⊂ clipper) pairs, 77 occurrences, 11 pages

Grouped by root cause. All of them are an **outward** ring (`outline-offset: 2px`)
against a container that clips.

### 1. `.z-button` inside a layout container that hides overflow — 8 pairs

| Clipper | Pages | Overshoot | Why the container clips |
|---|---|---|---|
| `.z-hlayout` (+ `-valign-*` variants) | hlayout, organigram, space, biglistbox | 4px | `white-space: nowrap` + `overflow: hidden` in `box/css/layout.css`, so a too-wide row is cut instead of spilling |
| `.z-lineitem` | linelayout | 4px | `linelayout.css` |
| `.z-caption-content` | caption | 4px | Paired with `text-overflow: ellipsis` — **cannot** simply be dropped |
| `.z-carousel` | carousel | 679.91px | The rounded media frame; **cannot** be dropped |

This is the widest-reaching group: a button inside an hlayout is completely
ordinary usage, and `.z-button` is the theme's most-used component.

### 2. `.z-toolbarbutton` inside a toolbar — 2 pairs

| Clipper | Pages | Overshoot |
|---|---|---|
| `.z-toolbar.z-toolbar-tabs` | tabbox | 2px |
| `.z-toolbar-popup.z-toolbar-popup-close` | toolbar | 3px |

`.z-toolbar`'s `overflow: hidden` is load-bearing for the overflow-popup
mechanism.

### 3. `.z-button` / `.z-a` inside a preview page's own scrolling row — 2 pairs

| Clipper | Pages | Overshoot |
|---|---|---|
| `DIV.z-mb-6.z-d-grid.z-grid-cols-auto.z-overflow-x-auto…` | button, a | 4px / 1px |

Not theme chrome: this is the state-matrix wrapper the preview pages build from
utility classes. Worth keeping in the list anyway, because it is exactly what an
application does when it puts controls in a horizontally scrolling row —
`overflow-x: auto` makes the **vertical** axis compute to `auto` too, so the row
clips top and bottom as well.

## The fix is not obvious — it needs a decision

The mechanical fix used for navbar (`outline-offset: -2px`, draw the ring inside
the element) does not transfer to `.z-button`:

- A navbar item is full-bleed and tonal, so an inset ring reads fine on it.
- A **filled** button is `--zk-color-primary`, and `--zk-focus-ring` is *also*
  `--zk-color-primary`. An inset ring on a filled button is primary-on-primary —
  invisible. It would trade a clipped ring for an absent one.

The plausible directions, none free:

1. **Drop `overflow: hidden` where it is not load-bearing.** Only `.z-hlayout`
   and `.z-lineitem` are candidates (caption needs it for the ellipsis, carousel
   for the frame, toolbar for the overflow popup). Clears 6 of the 13 pairs but
   changes core layout behaviour, and ZK measures these boxes in JS.
2. **Two-tone focus indicator on buttons** — an inset ring in the on-primary
   colour plus the existing outer ring, which is what WCAG 2.2 Focus Appearance
   expects for exactly this situation. Correct, and the most work.
3. **Per-context override** (`.z-hlayout .z-button:focus-visible { … }`) — a
   growing list of container/component pairs; fixes the symptom per site and
   never converges.

Recorded as an open decision; nothing in this group has been changed.

## Status

| Group | Pairs | State |
|---|---|---|
| navbar submenu item | — | **Fixed** (commit e23576eb) |
| navbar selected + focused under forced-colors | — | **Fixed** (commit e23576eb) |
| 1. `.z-button` in a clipping layout container | 8 | Open — needs the decision above |
| 2. `.z-toolbarbutton` in a toolbar | 2 | Open — same decision |
| 3. preview-page scrolling rows | 2 | Open — may be a preview-page fix rather than a theme one |
| `.z-a` in a preview scrolling row | 1 | Open |

## Checked and NOT defects

- **tree row, organigram node, paging button** — selected + focused under
  forced-colors. All three draw a ring that contrasts with what it is actually
  painted on. Paging in particular *looks* like a collision if you compare the
  ring against the selected button's own Highlight fill, but its ring is
  **outset**, so it is painted on the paging bar behind the button, not on the
  fill. The scan hit-tests the ring band for this reason.
- **accordion tab (`.z-tab`) and listbox row (`.z-listitem`)** — not this defect,
  but worth noting: their focus affordance is a `::before` state-layer opacity
  and an inset `box-shadow` respectively, and forced-colors drops both. Their
  focus is invisible in high-contrast whether or not they are selected. Separate
  gap, not tracked here.
- **anchornav** — its link is intrinsically sized and no ancestor clips it.

## Keeping the list honest

The scan fails on a finding that is **not** in `focus-ring-known-clips.json` (a
new regression) *and* on a baseline entry that no longer reproduces ("fixed —
delete this line"), so the file cannot rot into a waiver list. After a fix:

```bash
FOCUS_SCAN_UPDATE=1 npm run test:focus-scan
```
