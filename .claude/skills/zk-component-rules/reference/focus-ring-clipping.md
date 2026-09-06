# A focus ring drawn outward gets clipped

`outline` is painted **outside** the element's border box. It is not clipped by the element's own
`overflow`, but it **is** clipped by any ancestor that clips its overflow. Several ZK components put
a focusable element flush against such an ancestor, so an outward ring is cut — sometimes on all
four sides, sometimes only on the first/last child.

This is a **structural** property of the widget's DOM, not a design preference: it holds for every
theme, so every theme has to solve it.

## When it bites

An outward ring is unsafe whenever **both** hold:

1. The focusable element is **full-bleed** — its box is exactly as wide (or as tall) as the
   container that holds it, leaving no gutter for the ring to occupy.
2. Some ancestor clips overflow, or is a `<table>`/`<tr>` whose cells bound the paint area.

ZK ships several DOM shapes that satisfy both. This is a list of shapes **at risk** — whether a given
theme has actually tripped over one depends on whether it styles focus there at all:

| Widget | Focusable element | The shape |
|--------|-------------------|-----------|
| navbar / nav | `a.z-nav-content`, `a.z-navitem-content` | The link is exactly the width of the list that holds it. In a nav group it sits inside the submenu cave `<ul>` — a container a theme normally has to clip, because collapsing the group animates the cave's height. At top level the ring instead spills past the navbar's own surface; inside the horizontal-mode overflow popup, past the popup's clip. |
| listbox | `tr.z-listitem` | A `<tr>` has no paint area of its own — a ring on it is cut at the cell boundaries. Applies to any row-as-`<tr>` widget. |
| tree | `tr.z-treerow` | Same `<tr>` problem, and the row is full-bleed inside the scrolling body. |
| grid | `tr.z-row` | Same `<tr>` problem. |
| menu / menupopup | `a.z-menu-content`, `a.z-menuitem-content` | A popup surface is normally clipped so its rounded corners stay rounded, and the item is full-bleed inside it. |

## The two mechanisms that work

**A. Inset outline — `outline-offset: <negative>`.** Keeps the whole ring inside the element's own
border box, so no ancestor can reach it. The border-radius shrinks with it, so a rounded item still
gets a rounded ring. This is the default choice for a full-bleed row or nav link.

```css
.z-thing:focus-visible {
    outline: <theme focus ring>;
    outline-offset: -2px;      /* negative — never a positive offset here */
}
```

**B. Inset `box-shadow` on a child that does have a paint area.** For `<tr>`-based rows an outline
has nowhere to live at all; put an inset shadow on the first cell instead, which paints inside that
cell's own box.

```css
.z-thing:focus-visible .z-thing-cell:first-child { box-shadow: inset <edge marker>; }
```

Both mechanisms also avoid the layout-shift trap — see `focus-affordance-no-layout-shift.md`, which
covers the related case of a focus affordance that changes the element's size.

## How to catch it

Measuring `outline-color` alone passes on a ring nobody can see. Assert **geometry**: inflate the
element's rect by `outline-offset + outline-width`, then walk the ancestors and fail if any ancestor
that clips overflow has a rect smaller than the inflated ring on any side. That is a single
`page.evaluate` and it catches the defect regardless of which ancestor is responsible.

Also assert `outline-style` explicitly. A component with **no** `:focus-visible` rule at all does not
look unstyled in a screenshot — the browser draws its own ring (Chrome: `outline-style: auto`, 1px,
its own blue, offset `+1px`). It is off-palette *and* outward, so a missing rule and a wrong rule
present as the same bug. `outline-style: solid` distinguishes a theme ring from the UA fallback.

Keyboard focus also has to be *reachable* to be observed. A mouse click gives `:focus` but not
`:focus-visible`; press a key afterwards (or arrive by keyboard) before measuring.
