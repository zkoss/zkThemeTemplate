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
are **derived from the seed via `oklch(from …)` relative color** rather than
hand-picked, so a new seed re-tints them automatically. This is defined once in
[_colors.css](../../src/main/resources/web/zul/css/tokens/_colors.css):

```css
--zk-color-primary: #376fd0;                                                       /* seed */
--zk-color-primary-container:    oklch(from var(--zk-color-primary) 0.92 calc(c * 0.25) h);
--zk-color-on-primary-container: oklch(from var(--zk-color-primary) 0.23 calc(c * 0.45) h);
```

`oklch(from <seed> L c h)` keeps the seed's **hue** (`h`) and a scaled **chroma**
(`calc(c * k)`), but pins an **absolute lightness** (`L`). That absolute tone is the
whole point: a fixed-ratio blend (`color-mix`) inherits the seed's own lightness, so a
container tuned for the default blue turns out too dark for a teal or too pale for a
yellow. Pinning `L` makes **every hue land at the same tone** — the container stays
light and the on-container stays dark for *any* brand color. It's MD3's tonal-palette
model in miniature (light containers ≈ tone 90, dark on-containers ≈ tone 20–40).

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

## Contrast caveat — only the *solid-fill* foreground, and only for light seeds

Because the container and on-container are **both** tone-pinned, the pair stays legible
for *any* seed lightness — a light-yellow seed still yields a light container with dark
text (measured ≥ 6.6:1 across blue/green/yellow/violet seeds). Containers are safe.

The one thing that stays **literal white** is `on-<role>` — the text/icon drawn on the
**solid role fill** (filled buttons, filled chips), e.g. `--zk-color-on-primary`. White
reads well on the mid-to-dark brand colors most organizations use (blues, greens,
purples, deep reds). If you pick a **light** brand color, white-on-light fails contrast
on those filled controls — so also override the matching solid-fill foreground:

```css
:root {
    --zk-color-primary: #ffd54f;      /* light brand yellow */
    --zk-color-on-primary: #3e2723;   /* dark foreground on the SOLID fill (filled buttons/chips) */
}
```

Auto-deriving this too needs CSS `contrast-color()`, which isn't baseline yet. A full
seed→tonal-palette generator that picks all foregrounds automatically (the way
MUI/Material and Ant Design do) is future work; see GAP 2 in
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

| Derived token | Seed | `oklch(from seed L c h)` | Legacy hand-picked value |
|---|---|---|---|
| `--zk-color-primary-container` | primary | `L 0.92`, `c × 0.25` | `#d6e4ff` |
| `--zk-color-on-primary-container` | primary | `L 0.23`, `c × 0.45` | `#001c3d` |
| `--zk-color-secondary-container` | secondary | `L 0.87`, `c × 0.48` | `#b2dfdb` |
| `--zk-color-on-secondary-container` | secondary | `L 0.235`, `c × 0.48` | `#00251a` |
| `--zk-color-error-container` | error | `L 0.89`, `c × 0.28` | `#ffcdd2` |
| `--zk-color-on-error-container` | error | `L 0.375`, `c × 0.77` | `#7f0000` |
| `--zk-color-warning-container` | warning | `L 0.92`, `c × 0.38` | `#ffe0b2` |
| `--zk-color-on-warning-container` | warning | `L 0.42`, `c × 0.59` | `#7a3900` |
| `--zk-color-inverse-primary` | primary | `L 0.81`, `c × 0.58` | `#9ec3ff` |

`L` was set to each legacy hex's measured OKLab lightness and the chroma scale `k` to
its measured chroma level, so the **default** palette reproduces the previous look
within a small, verified ΔE. The `warning-container` shifts most visibly — it renders a
touch more orange than the legacy `#ffe0b2` because the recipe keeps the *seed's* hue
(brand-coherent) rather than the legacy container's yellower hand-picked hue.

**Browser support:** relative-color `oklch(from …)` is available in Chrome 119+,
Safari 16.4+, and Firefox 128+ — within Marble's modern-browser support window.
