# Proposal — #41 (listbox left bar) + #43 (tree click outline)

Written 2026-09-08. These two arrived on the board as separate "P1 quick wins,
located to an exact line". They are one issue with one root cause, the board's
line number for #41 was wrong, and the fix Jess proposes for #43 cannot work as
written. All of that is measured below, not inferred.

## What Jess filed

| # | Component | What she saw | What she asked for |
|---|---|---|---|
| 41 | listbox | "A 3px primary-blue left bar is added on the selected row" | Selected row = secondary-container fill, remove bar |
| 43 | tree | "Clicking a tree node draws a 2px blue outline around the entire row" | Show it only on keyboard focus via `:focus-visible` |

## Correction to the board

The board said #41 was `border-left: 3px solid primary` at `listbox.css:323`.
That line is `.z-listgroup > td:first-child` — the **group header** band, which
is not what her screenshot shows. There is no left border on a listbox row and
there never has been (`git log -S'border-left'` on that file returns one commit,
2026-04-25, for the group header).

The real source is `listbox.css:266-270`:

```css
/* Focus — outline on <tr> clips at cell boundaries; use box-shadow on the first cell instead */
.z-listitem:focus-visible .z-listcell:first-child,
.z-listitem.z-listitem-focus .z-listcell:first-child {
    box-shadow: inset 3px 0 0 var(--zk-color-primary);
}
```

Reproduced by clicking the row labelled "Default Row" on `listbox.zul`: it gains
`z-listitem-selected z-listitem-focus`, fills `primary-container`, the row below
("Selected Row") goes white, and the first cell gets
`rgb(55,111,208) 3px 0 0 0 inset`. That is pixel-for-pixel her screenshot —
including the confusing part, that the highlighted row is the one labelled
"Default Row". The repro image was dropped with the other working-note binaries and not retained.

**So the bar is the focus indicator, not selection decoration.** The tree's
equivalent at `tree.css:167-171` is the same affordance drawn differently:

```css
.z-treerow:focus-visible,
.z-treerow.z-treerow-focus {
    outline: var(--zk-focus-ring);
    outline-offset: -2px;
}
```

One semantic state, two shapes (a left bar vs a 4-sided inward ring). #41 and
#43 are the same defect seen in two components.

## Why her #43 fix cannot work as written

Measured on both pages (`probe41d.js`, `probe41e.js`):

| Fact | listbox | tree |
|---|---|---|
| row `tabindex` | `null` | `null` |
| `document.activeElement` after click **or** arrow key | `DIV.z-focus-a` | `DIV.z-focus-a` |
| any row matching `:focus-visible`, in any state | **none** | **none** |
| class that actually marks the focused row | `.z-listitem-focus` | `.z-treerow-focus` |
| is that class added on mouse click? | **yes** | **yes** |
| …and on arrow-key navigation? | **yes, identically** | **yes, identically** |

Rows are not focusable. DOM focus lives on a hidden 0×0 `.z-focus-a` trap
(`listbox.css:196-205` documents it), and ZK marks the current row with a class
that is **indistinguishable** between mouse and keyboard.

Two consequences:

1. The `:focus-visible` halves of both rules are **dead code** today. Deleting
   the class selector as Jess suggests would not "restrict the ring to keyboard
   focus" — it would delete row focus entirely, for keyboard users too.
2. Her diagnosis is nevertheless right: the indicator *should not* appear on
   mouse click, and today it does.

## The part that makes this fixable in CSS anyway

The hidden trap is programmatically focused, and Chromium's `:focus-visible`
heuristic honours the **last input modality** even for programmatic focus.
Measured (`probe41e.js`, identical results for tree via `probe41f.js`):

| After | `.z-focus-a:focus-visible` | `:has(.z-focus-a:focus-visible)` |
|---|---|---|
| mouse click | **false** | false |
| ArrowDown | **true** | **true** |
| mouse click again | **false** | false |
| Tab out of the widget | false (trap no longer active) | false |

So the modality information Jess wants **is** reachable from CSS, via the trap
rather than the row. No ZK change, no JS.

## Recommendation

Gate the existing `-focus` class styling on the trap being keyboard-focused, and
unify the two shapes on the tree's inward ring.

```css
/* listbox.css — replaces lines 266-270 */
.z-listbox:has(.z-focus-a:focus-visible) .z-listitem.z-listitem-focus {
    outline: var(--zk-focus-ring);
    outline-offset: -2px;
}

/* tree.css — replaces lines 167-171 */
.z-tree:has(.z-focus-a:focus-visible) .z-treerow.z-treerow-focus {
    outline: var(--zk-focus-ring);
    outline-offset: -2px;
}
```

Why the inward ring rather than keeping the bar:

- It is what MD3 prescribes for this shape. `dee95732` (the focus-ring research
  committed by the other session) establishes that `md-focus-ring`'s `inward`
  mode is a first-class MD3 mode set by exactly `tabs/tab`, `menu/menuitem`,
  `list/listitem`, `list/selectoption` — and that in a CSS-only theme a negative
  `outline-offset` **is** that mode. It names listitem explicitly as next.
- It removes the bar Jess objects to, which she read as a navigation accent —
  precisely the confusion `selected-state-families.md` already warns about.
- `outline` survives Windows High-Contrast; `box-shadow` does not. The
  focus-ring backlog records listbox row focus as invisible under forced-colors
  today. This closes that gap as a side effect.

## What I recommend rejecting, with a citation

Jess's other half of #41 — "Selected row = secondary-container fill" — should
not be done:

- `.claude/skills/zk-component-rules/reference/selected-state-families.md:21`
  makes **List-row = `primary-container` / `on-primary-container`** normative,
  and deliberately separates it from the chip family. The same doc's line 80-85
  already anticipates this exact report: *"the `.z-listitem` blue left line is
  not its selected state … Do not 'unify' them; they express different things."*
- MUI agrees with the current choice, not with the request:
  `ListItemButton.css:25` and `MenuItem.css:28` both use
  `rgba(25,118,210,0.08)` — a **primary** tint. Neither uses a secondary tone.
- It would also desynchronise listbox from combobox, tree, menu, searchbox,
  chosenbox and selectbox, which all share the list-row family.

## Open question for the user

The ring width is **D15 of the navbar focus-ring investigation** (archived with the pre-migration working notes) (2px → 3px,
owned by session `zkthemetemplate-79`, still awaiting their user). This proposal
deliberately uses `var(--zk-focus-ring)` and changes no width, so it composes
with either outcome of D15. But applying an inward ring to listitem is named in
their D14/D15 material, so it is worth telling them before landing rather than
after.

## Verification plan

1. `npm run build:css`
2. Re-run `probe41d`/`probe41e`-style checks: after a mouse click no row shows
   an outline; after ArrowDown exactly one does; after tabbing out, none.
3. Confirm tabbing **into** the widget arms the trap (not covered by the probes
   above — the Tab test only moved focus out).
4. `npm run test:focus-scan` — the ring becomes an `outline`, so the clip
   scanner will now see these rows; check whether it reports new pairs and
   regenerate `focus-ring-known-clips.json` if it does.
5. The 8 computed-style projects (256 tests).
6. Re-cut the affected baselines (listbox, tree and their tablet twins), noting
   that D15 may re-cut them again.
