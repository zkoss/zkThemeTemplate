# Brand-Color Override

Marble ships a blue brand palette, but enterprise customers routinely need "make it
*our* brand color." Marble exposes this as a **seed override**: set one CSS custom
property — `--zk-color-primary` — and the whole theme re-derives a coherent palette
from it. No forking, no build step, no theme recompilation. The container tints,
state-layer overlays, focus ring, and every selected-row / alert / badge tint all
cascade from that single value.

## How it works

Each semantic **role** (primary, secondary, error, warning) is a *seed*. Its two
partners — the light `*-container` fill and the dark `on-*-container` foreground —
are **derived from the seed via `color-mix()`** rather than hand-picked, so a new
seed re-tints them automatically. This is defined once in
[_colors.css](../../src/main/resources/web/zul/css/tokens/_colors.css):

```css
--zk-color-primary: #376fd0;                                                    /* seed */
--zk-color-primary-container:    color-mix(in srgb, var(--zk-color-primary) 23%, #fff);
--zk-color-on-primary-container: color-mix(in srgb, var(--zk-color-primary) 31%, #000);
```

Two more things already track the seed with **no extra work**, because they were
authored against `--zk-color-primary` from the start:

- **State-layer overlays** (hover / focus / pressed) — built from `currentColor`
  or `color-mix()` of the seed plus the `--zk-state-*-opacity` tokens.
- **The keyboard focus ring** — `--zk-focus-ring: 2px solid var(--zk-color-primary)`.

So overriding the seed is genuinely a one-line change for the common case.

## How to rebrand

Add your override **after** the theme CSS loads (later in the cascade wins), scoped
to `:root` so it reaches body-appended popups (menus, modal windows, notifications)
too:

```css
:root {
    --zk-color-primary: #6a1b9a;   /* your brand color — everything else derives */
}
```

For a fuller rebrand, override the other seeds as well; each re-derives its own
container pair the same way:

```css
:root {
    --zk-color-primary:   #6a1b9a;   /* brand purple */
    --zk-color-secondary: #00897b;   /* accent */
    --zk-color-error:     #c62828;
    --zk-color-warning:   #ef6c00;
}
```

That's the whole contract: **set the seed(s); the palette follows.**

## Contrast caveat — assumes a mid-to-dark seed

The `on-<role>` foregrounds (text/icon drawn *on* a filled control — e.g.
`--zk-color-on-primary`) stay **literal white**. White reads well on the mid-to-dark
brand colors most organizations use (blues, greens, purples, deep reds). If you pick
a **light** brand color, white-on-light will fail contrast — so also override the
matching foreground to a dark value:

```css
:root {
    --zk-color-primary: #ffd54f;      /* light brand yellow */
    --zk-color-on-primary: #3e2723;   /* dark foreground so text stays legible */
}
```

This is the deliberate limit of the current recipe. A full seed→tonal-palette
generator that picks foregrounds automatically (the way MUI/Material and Ant Design
do) is future work; see GAP 2 in
[theme-competitive-gap-analysis.md](../theme-competitive-gap-analysis.md).

## What is NOT re-tinted (by design)

- **Neutral surfaces** — the `--zk-color-surface*` ramp carries a faint cool tint
  that is part of Marble's identity. It is *not* re-tinted from the brand seed:
  re-tinting the entire chrome from an arbitrary brand color is high-risk and out of
  scope for this recipe.
- **Status/badge colors** — `--zk-color-status-{success,warning,error,info,neutral}`
  are an independent semantic palette (success is always green, etc.). They do not
  track the brand seed.

Override any of these directly if you need to.

## Fine-tuning a single derived tone (escape hatch)

The derived tokens are plain custom properties, so if one auto-derived tone isn't
quite right for your brand, **pin it directly** — no special variable is required:

```css
:root {
    --zk-color-primary: #6a1b9a;
    --zk-color-primary-container: #ede7f6;   /* pin just this one; the rest still derive */
}
```

## Derivation reference

| Derived token | Seed | Mix (`in srgb`) | Legacy hand-picked value |
|---|---|---|---|
| `--zk-color-primary-container` | primary | seed 23% + `#fff` | `#d6e4ff` |
| `--zk-color-on-primary-container` | primary | seed 31% + `#000` | `#001c3d` |
| `--zk-color-secondary-container` | secondary | seed 43% + `#fff` | `#b2dfdb` |
| `--zk-color-on-secondary-container` | secondary | seed 23% + `#000` | `#00251a` |
| `--zk-color-error-container` | error | seed 26% + `#fff` | `#ffcdd2` |
| `--zk-color-on-error-container` | error | seed 70% + `#000` | `#7f0000` |
| `--zk-color-warning-container` | warning | seed 31% + `#fff` | `#ffe0b2` |
| `--zk-color-on-warning-container` | warning | seed 52% + `#000` | `#7a3900` |
| `--zk-color-inverse-primary` | primary | seed 52% + `#fff` | `#9ec3ff` |

Ratios were calibrated per role to reproduce the legacy hand-picked hex as closely as
sRGB mixing allows. sRGB `color-mix()` cannot exactly reproduce MD3's HCT-tuned tones,
so the **default** tints differ from the legacy values by a small, verified margin —
the accepted cost of single-seed cascade.
