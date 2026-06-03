# Selected-state families (MD3)

MD3 does not have a single "selected" colour. It has **three families**, each
with its own visual treatment, depending on what kind of selection the
component represents. Components in the same family MUST share the same
selected-state tokens; components in different families MUST NOT be unified.

This rule was added 2026-05-29 after a cross-component audit found:
- `listitem` used a hardcoded `rgba(55,111,208,0.12)` (token violation)
- `searchbox` used `secondary-container` while `combobox`/`tree`/`menu` used
  `primary-container` for the same kind of "highlighted dropdown row"

See `doc/skill-gaps.md` (2026-05-29 row) for the gap log, and
`tasks/design-review-2026-05-29.md` §4 for the cross-component audit table
and rationale.

## The three families

| Family | Semantic | Background token | Text/icon token | Extra |
|--------|----------|------------------|-----------------|-------|
| **List-row** ("the row I'm on") | A row that's currently selected in a list or dropdown — typically the cursor target, often arrow-key-navigable. | `--zk-color-primary-container` | `--zk-color-on-primary-container` | hover = 8% state layer on top |
| **Chip — resting** ("a tag I've added") | An individual chip/tag in a multi-select picker, in its default unfocused state. This theme follows **MUI** (MuiChip-filled), which uses a neutral tonal surface, NOT secondary-container. (Pure MD3 would use `secondary-container` for filter-chip-selected; this theme is MUI-visually-aligned.) | `--zk-color-surface-container-high` | `--zk-color-on-surface` | — |
| **Chip — keyboard-focused** ("the chip I'm about to delete/edit") | A chip that has keyboard focus inside a multi-select picker. Treated as a list-row pick for keyboard navigation: it's "the row I'm on" within the chip strip. | `--zk-color-primary-container` | `--zk-color-on-primary-container` | only on `:focus-visible` / equivalent class |
| **Single-point picker** ("the one chosen value") | The unique chosen value in a picker (e.g. the day the user picked in a calendar). Strong visual emphasis because the answer is singular. | `--zk-color-primary` (FILLED shape — solid disc/circle/square) | `--zk-color-on-primary` | typically a fully-rounded fill, not a rectangular row tint |

> **Why three families?** A row in a 200-row listbox should not scream — a
> light container tint is enough. A filter chip needs to differentiate itself
> from "list-row currently focused" so users can see at a glance "this is a
> tag I picked, not the cursor". A single-point pick (calendar day, rating
> star) is the answer to "what did the user choose?" — it deserves full
> visual weight (filled primary).

## Component → family mapping

### List-row family — `primary-container`
| Component | Selector | CSS file |
|-----------|----------|----------|
| Listbox row | `.z-listitem-selected`, `.z-selected` | `js/zul/sel/css/listbox.css` |
| Combobox dropdown option | `.z-comboitem-selected` | `js/zul/inp/css/combobox.css` |
| Tree row | `.z-treerow-selected` | `js/zul/sel/css/tree.css` |
| Menu item (active) | `.z-menuitem-content:active`, `.z-menuitem-over` | `js/zul/menu/css/menu.css` |
| Searchbox dropdown item | `.z-searchbox-selected` | `js/zkmax/inp/css/searchbox.css` |
| Chosenbox dropdown option (focus) | `.z-chosenbox-item-focus`, `.z-chosenbox-option-focus` | `js/zkmax/inp/css/chosenbox.css` |
| **Selectbox option (native `<select>` popup)** | `.z-selectbox option:checked` | `js/zul/wgt/css/selectbox.css` |

### Chip family — `surface-container-high` (resting) / `primary-container` (focused)
This theme follows MUI's chip treatment (MuiChip-filled is neutral surface,
not secondary-container). MD3 filter-chip-selected uses `secondary-container`,
but pure-MD3 styling is intentionally not used here for chips.

| Component | Selector | Resting bg | Focused bg | CSS file |
|-----------|----------|------------|------------|----------|
| Chosenbox already-picked chip | `.z-chosenbox-item` | `surface-container-high` | `.z-chosenbox-item-focus` → `primary-container` | `js/zkmax/inp/css/chosenbox.css` |
| Any future multi-select chip | (TBD) | (TBD) | (TBD) | (TBD) |

### Single-point picker family — filled `primary`
| Component | Selector | CSS file |
|-----------|----------|----------|
| Calendar selected day | `.z-calendar-cell.z-calendar-selected` | `js/zul/db/css/calendar.css` |
| Rating selected star | `.z-rating-button-selected` (TBD) | `js/zul/wgt/css/rating.css` |
| Radio | `.z-radio:checked` | `js/zul/wgt/css/radio.css` |

## Required CSS pattern

```css
/* List-row family — example */
.z-{component}-selected {
    background-color: var(--zk-color-primary-container);
    color: var(--zk-color-on-primary-container);
}
.z-{component}-selected:hover {
    background-color: color-mix(in srgb,
        var(--zk-color-on-primary-container) 8%,
        var(--zk-color-primary-container));
}

/* Chip family — substitute secondary-container / on-secondary-container */

/* Single-point picker — fill, don't tint */
.z-{component}-selected {
    background-color: var(--zk-color-primary);
    color: var(--zk-color-on-primary);
    /* usually combined with border-radius: 50% or shape-corner-full */
}
```

## Forbidden patterns

1. **Hardcoded RGBA / hex for any selected-state background.** Every colour
   must be a token. Hardcoded values cannot survive a theme switch and bypass
   the contract evaluator. (Example violation: the old
   `rgba(55,111,208,0.12)` in `listbox.css` before 2026-05-29.)

2. **Cross-family unification.** Do not "make all selected states the same
   colour for consistency" — the families exist to express different
   semantics. A reviewer who asks "why is searchbox selected teal but
   listitem blue?" is asking the right question; the answer is family
   classification, not "we forgot to standardise".

3. **Picking a family by intuition rather than by component semantic.** When
   adding a new selectable component, look at this checklist:
   - Is the user navigating a list of options with arrow keys / clicks, one
     of which is "current"? → **list-row family**.
   - Is the selected thing rendered as a free-floating tag/chip separate from
     a list? → **chip family**.
   - Is there exactly one selected value at any time, displayed in-place
     (not as a tag)? → **single-point picker family**.

## Contract assertion template

Add this row to any new contract for a list-row component:

```
| selected | background-color | rgb(<primary-container-rgb>) |
| selected | color            | rgb(<on-primary-container-rgb>) |
```

For chip components, resting state uses `surface-container-high` /
`on-surface`; focused state uses `primary-container` / `on-primary-container`
(MUI-aligned, not pure MD3 filter-chip).
For single-point pickers, use `primary` / `on-primary`.

Evaluator should fail loudly if a list-row component's selected state
resolves to `secondary-container` — that means someone has reintroduced the
2026-05-29 searchbox bug.
