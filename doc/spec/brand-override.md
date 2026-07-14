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

## Filled surfaces stay legible on any seed — the `-fill` cap

Containers and on-containers are both tone-pinned, so that pair is legible for *any*
seed lightness (measured ≥ 6.6:1 across blue/green/yellow/violet). **Solid role fills**
are handled too, via a small set of capped `-fill` tokens:

```css
--zk-color-secondary-fill: oklch(from var(--zk-color-secondary) min(l, 0.54) c h);
```

`min(l, 0.54)` **caps the fill's lightness** — it darkens a color only when it is
lighter than the cap, and leaves already-dark colors (primary, error) untouched. `0.54`
is the highest cap where white text clears WCAG AA (≥ 4.5:1) on *every* hue, including
worst-case cyan/lime. So a filled role/status surface keeps **white text** and stays
legible whatever brand hue the customer seeds — no per-role foreground override.

These `-fill` tokens back the filled **utility classes** `.z-bg-primary`,
`.z-bg-secondary`, `.z-bg-error`, `.z-bg-success`, `.z-bg-warning`, `.z-bg-info` — the
supported way to paint a button or surface with a role/status color. Use those (rather
than the raw seed) whenever you put white text on a colored fill:

```xml
<button label="Save" sclass="z-bg-secondary" />   <!-- fill auto-capped; white text legible -->
```

Residual limit: `-fill` produces pure white-legible fills only down to a mid-luminance
floor — a genuinely *mid*-toned vivid seed where neither black nor white can reach 4.5:1
is unreachable by any fill-only rule. And the base `.z-button` default fill uses the raw
`--zk-color-primary` (fine at Marble's blue); for a **light** primary rebrand, either
paint buttons with `.z-bg-primary` or override `--zk-color-on-primary` to a dark value.
Full automatic foreground selection (MUI/Ant style) needs `contrast-color()`, not yet
baseline — see GAP 2 in
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

## Built-in presets + the `MarbleBrand` runtime switcher

The seed-override contract above is the customer's *own-brand* path (a static `:root`
rule). On top of it, Marble ships a small set of **built-in brand presets** exposed as a
runtime switch — useful for letting an end user pick a brand, or for demos. Each preset
is nothing more than the single-seed override, keyed off a `data-brand` attribute on the
document root, defined in
[_colors.css](../../src/main/resources/web/zul/css/tokens/_colors.css):

```css
:root[data-brand="indigo"]  { --zk-color-primary: #5e35b1; }
:root[data-brand="teal"]    { --zk-color-primary: #00796b; }
:root[data-brand="green"]   { --zk-color-primary: #2e7d32; }
:root[data-brand="crimson"] { --zk-color-primary: #c2185b; }
```

`:root[data-brand="…"]` (specificity 0,2,0) beats the base `:root` block (0,1,0), so it
wins regardless of bundle order. There is **no `default` block** — the default (Marble
blue) is just the base `:root`, reached by removing the attribute. All five presets are
mid-to-dark, so the literal white `--zk-color-on-primary` stays AA on their solid fills;
a light preset would also need `--zk-color-on-primary` (the caveat above).

Flip a preset from Java with the `MarbleBrand` helper
([MarbleBrand.java](../../src/main/java/org/zkoss/theme/marble/MarbleBrand.java)):

```java
MarbleBrand.apply(MarbleBrand.Brand.TEAL);      // whole app
MarbleBrand.apply(MarbleBrand.Brand.DEFAULT);   // removes data-brand → back to blue
// Presets: DEFAULT, INDIGO, TEAL, GREEN, CRIMSON
```

**Whole-app only — by design.** Unlike density (`MarbleDensity`), which re-points size
tokens as *literals* so its `data-density` attribute works at any scope, the brand
presets override only the seed and rely on the `oklch(from …)` derivations declared at
`:root`. A `data-brand` on a descendant would *not* re-derive the containers there (they
resolved at `:root` and inherit frozen), and a brand is an app-wide identity anyway — so
`MarbleBrand` exposes a single whole-app method. Prefer the static `:root` rule (above)
for a fixed default; the runtime helper runs after first paint and can flash (FOUC).

**Try it:** the `usecase/brand-switcher.zul` showcase page (nav: *Use Cases → Brand
Presets*, deep link `usecase/index.zul#usecase/brand-switcher`) has clickable swatches, a
live component preview, and the adoption snippets.
