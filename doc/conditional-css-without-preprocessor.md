# Conditional CSS without a preprocessor — how the rest of the ecosystem does it

**Question:** ZK gets conditional CSS from `.css.dsp` (JSP/EL templating of a stylesheet at request time).
If we drop LESS/SASS and refuse to add another preprocessor, what do modern UI frameworks use instead?

**Short answer:** nobody replaces DSP with one thing. The ecosystem split the problem into five
techniques, each matched to *when the condition becomes known*. Only the last one is a build step,
and it is written in a real language (JS/TS), not in a CSS dialect.

Companion docs: [doc/drop-less-pure-css-evaluation.md](../doc/drop-less-pure-css-evaluation.md)
(the LESS-removal feasibility study), [doc/spec/reset-scoping.md](spec/reset-scoping.md)
(the one ZK conditional that genuinely needed a design decision).

---

## 1. First, split the question

"Conditional CSS" is four unrelated problems wearing one coat. DSP handles all four the same way —
per-request string templating — which is why it feels irreplaceable.

| Condition type | Example in ZK | When is it known? | Modern answer |
|---|---|---|---|
| **Deployment config** | edition CE/PE/EE, `browserDefault`, theme name | server boot | Serve a *different file*; decide in Java, not in CSS |
| **Per-user / per-page state** | density, brand color, dark mode, locale | request or runtime | Root attribute + custom properties |
| **Device / environment** | tablet, coarse pointer, high contrast, print | in the browser | Native `@media` / `@supports` / `@container` |
| **Generation** | icon class loops, spacing scales, palette ramps | build | A generator script (JS), or a token pipeline |
| **URL rewriting** | `${c:encodeURL('/img/x.gif')}` | request | Relative `url()`, or one injected `--asset-base` |

Once split, the DSP-shaped residue is tiny — for Marble it is essentially *zero*, because the theme
already resolved every row above by other means.

---

## 2. The five techniques

### 2.1 Root attribute / class switch — the workhorse

One stylesheet contains all variants; a data-attribute on `<html>` (or any ancestor) selects one.
Marble already does this for density (`data-density="compact"`).

```css
:root                          { --zk-control-height: 40px; }
:root[data-density="compact"]  { --zk-control-height: 32px; }
```

* **Who ships this:** Bootstrap 5.3 (`data-bs-theme`), GitHub Primer (`data-color-mode`,
  `data-light-theme`), Adobe Spectrum (`.spectrum--dark`, `.spectrum--medium` / `--large` for
  desktop-vs-touch scale), Shoelace / Web Awesome (`.sl-theme-dark`), MUI v6+ CSS-variables mode
  (`data-mui-color-scheme`).
* **Why it won:** the stylesheet stays static, content-hashed and cacheable forever; switching is a
  one-attribute DOM write with no reload and no FOUC; SSR-safe (the server can stamp the attribute
  into the initial HTML).
* **Cost:** every variant's bytes ship to everyone. In practice a token block is a rounding error;
  duplicating whole rule bodies per variant is not — keep variants at the *token* level.
* **ZK relevance:** this is the direct replacement for anything DSP branched on that a user might
  want to change at runtime. Spectrum's `medium`/`large` scale is exactly ZK's `tablet.css.dsp` case,
  solved with a class and a token file.

### 2.2 Custom properties as the injection point (+ a tiny server-emitted `:root` block)

The "DSP done right" pattern: keep the 300 KB of rules static and immutable; let the server emit only
the handful of *values* it actually knows, as an inline `<style>` in `<head>`.

```html
<style>:root{--zk-color-primary:#0093F9;--zk-asset-base:'/myapp/img/'}</style>
<link rel="stylesheet" href="/zkau/web/_zv12/marble.css">   <!-- cache-forever -->
```

* Per-request variability collapses from "the whole stylesheet" to "≈200 bytes of variables".
* Keeps CDN / `Cache-Control: immutable` / HTTP-cache behaviour, which per-request DSP templating
  actively destroys — this is the main reason the ecosystem abandoned request-time CSS generation.
* Also the answer to `${c:encodeURL(...)}`: either use `url()` relative to the stylesheet (already
  resolved against the stylesheet's own URL, which is context-path correct), or reference
  `var(--zk-asset-base)` inside `url()` via a build-time concat — note plain `url(var(--x)…)` does
  **not** work; use `image-set()`/`--x: url(...)` whole-URL tokens instead.

### 2.3 Native at-rules — everything device/environment shaped

This is where CSS grew past what a preprocessor could ever do, because these conditions are only
knowable *in the browser*:

| Need | Native mechanism |
|---|---|
| Viewport / device | `@media (width >= 48rem)`, `(pointer: coarse)`, `(hover: none)` |
| Feature detection | `@supports (…)`, `@supports selector(:has(a))` |
| Component-local size | `@container (inline-size > 40ch)` |
| **Component-local *state*** | `@container style(--variant: danger)` — style queries |
| User preferences | `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, `scripting` |
| Print | `@media print` |
| Cascade control | `@layer` (Marble uses `zk-base < zk-components < zk-utilities`) |
| Scoping / donut scope | `@scope (.z-page)` (Marble uses it for `reset-embed.css`) |
| Direction / RTL | `:dir(rtl)` + logical properties (`margin-inline`, `inset-inline`) |
| Dark/light value pairs | `light-dark(#fff, #111)` |
| Derived colors | relative color syntax — `oklch(from var(--zk-color-primary) …)` |
| Conditional *download* | `<link media="(prefers-color-scheme: dark)">`, `@import url(x.css) supports(…) screen` |

**Style queries** (`@container style(--flag: on)`) are the closest native thing to "conditional CSS":
a plain custom property becomes a real branch, evaluated per element, at runtime, no JS.
Cross-engine as of Chrome 111 / Safari 18 / Firefox 128.

**Logical properties + `:dir()` deserve a call-out for ZK**: they delete the entire "ship a separate
RTL stylesheet" problem that Bootstrap still solves with an RTLCSS post-process pass
(`bootstrap.rtl.css`). One file, both directions, zero conditionals.

**Historical footnote — the "space toggle" hack.** Before style queries, the no-preprocessor trick was
to toggle a custom property between `initial` (guaranteed-invalid) and empty:

```css
:root                         { --dense: initial; }
:root[data-density="compact"] { --dense: ; }
.z-button { --pad: var(--dense) 6px 10px; padding: var(--pad, 12px 16px); }
```

It works (the `initial` case poisons `--pad`, so `var(--pad, …)` takes the fallback) but it is
write-only code, and it is the reason people believed pure CSS could not branch. Don't ship it now —
use a style query or an attribute selector.

**On the horizon:** CSS `if()` (inline conditional values with `style()` / `media()` / `supports()`
conditions) shipped in Chrome 137 but is not yet cross-browser. Worth tracking, not worth shipping.

### 2.4 Build-time variant emission + conditional *serving*

When the branch is a deployment fact rather than a runtime one, the ecosystem emits N static files
and lets the server/loader pick — the branch moves into the server, out of the stylesheet.

* Bootstrap ships `bootstrap.css` / `bootstrap.rtl.css` / `bootstrap-grid.css` / `-reboot.css`.
* Spectrum ships per-scale and per-theme token files.
* **Marble already does exactly this** for its one real deployment branch: `reset.css` vs
  `reset-embed.css`, chosen in `MarbleThemeProvider.getThemeURIs()` by reading the
  `org.zkoss.zul.theme.browserDefault` library property. That is a DSP conditional replaced by ~10
  lines of Java, with no templating and no cache penalty — see [spec/reset-scoping.md](spec/reset-scoping.md).

This is the honest replacement for edition (CE/PE/EE) gating too: ZK already decides which CSS URIs
to serve in Java (`WebApps.getEdition()`), so the conditional never has to enter the CSS at all.

### 2.5 Build-time generation in a real language

Loops, arithmetic, palette ramps, per-icon classes — the things people actually kept SASS for.
Nobody solves these with a CSS dialect any more; they solve them with the language they already use:

| Approach | Examples | Notes |
|---|---|---|
| Plain generator script | **Marble's `scripts/build-css.js`** (`getLucideIcons()` emits icon CSS into `norm.css.dsp`) | Simplest; you own it |
| Design-token pipeline | Style Dictionary / DTCG JSON → CSS+JS+iOS+Android | Salesforce SLDS, Spectrum, Carbon |
| Standards-syntax transformer | **Lightning CSS**, PostCSS + `postcss-preset-env` | Input *is* CSS; adds `@custom-media`, nesting/`oklch` downlevel, `--targets` |
| TS as the authoring language | vanilla-extract, Panda CSS, StyleX, Griffel (Fluent UI v9) | Zero-runtime, static CSS out, typed tokens |
| CSS-first utility engine | **Tailwind v4** (`@theme` in CSS, Lightning CSS inside) | Explicitly dropped its SASS/PostCSS-plugin chain |
| Runtime CSS-in-JS | Emotion (MUI ≤ v5), styled-components | Being abandoned for the zero-runtime column above |

The pattern: **the preprocessor was replaced by a programming language, not by a better preprocessor.**

---

## 3. Survey — what these libraries actually ship

| Library | Authoring | Runtime conditional mechanism | Preprocessor still involved? |
|---|---|---|---|
| **Tailwind v4** | CSS + `@theme` | variants → native `@media`/`:is()` | No (Lightning CSS) |
| **Open Props** | Plain CSS custom properties | `@media` + prop overrides | No |
| **Bootstrap 5.3** | SASS (legacy) | `data-bs-theme` + `--bs-*` vars | Yes for authors; consumers get vars |
| **MUI v6/v7** | TS (Emotion / Pigment CSS) | CSS vars + `data-mui-color-scheme` | No SASS ever |
| **Adobe Spectrum** | CSS + token packages | `.spectrum--dark`, `--medium`/`--large` | Token build, not a CSS dialect |
| **GitHub Primer** | CSS + PostCSS | `data-color-mode` / `data-*-theme` | PostCSS only |
| **Shoelace / Web Awesome** | Plain CSS in web components | per-component `--custom-props`, `::part`, theme class | No |
| **IBM Carbon** | SASS | `@carbon/themes` CSS custom properties | Yes (legacy) |
| **Fluent UI v9** | TS (Griffel) | CSS vars on a provider element | No |
| **Salesforce SLDS** | Tokens → CSS | "styling hooks" custom properties | Token build |

Two things are consistent across all of them:

1. **The public theming API is CSS custom properties**, not preprocessor variables. (Marble is an
   outlier here with only 12 `--zk-*` tokens vs master's 842 — see the IceBlue token-API note.)
2. **Nothing generates CSS per HTTP request.** The conditional is either resolved in the browser or
   frozen into a static artifact at build/boot time.

---

## 4. What native CSS still cannot do

Be honest about the ceiling, so nobody discovers it mid-migration:

* **No iteration or arithmetic over a list** — icon sets, spacing ladders, color ramps still need a
  generator (§2.5). `calc()` covers scalar math only.
* **Custom properties cannot be used in `@media` conditions** — `@media (width > var(--bp))` is
  invalid. Style queries test properties *on elements*, not media features. `@custom-media` (PostCSS /
  Lightning CSS) fills this at build time only.
* **Custom properties cannot appear in selectors.** Branching on "which component variant" still needs
  a class/attribute (or a style query on an ancestor).
* **A `var()` that resolves to guaranteed-invalid resets the property to `unset`** — it does *not* fall
  back to an earlier declaration in the same rule. This is the trap in the space-toggle hack.
* **You cannot avoid downloading bytes conditionally** except via `<link media>` or
  `@import … supports() …`; everything else ships to everyone.
* **`url()` cannot take a bare `var()` fragment** — tokenise the whole URL, or resolve at build time.

---

## 5. Mapping ZK's DSP inventory to a replacement

| ZK conditional | Replacement | Status in Marble |
|---|---|---|
| `browserDefault` (reset scoping) | Two static files + Java `getThemeURIs()` selection | **Done** ([spec/reset-scoping.md](spec/reset-scoping.md)) |
| Edition gating (CE/PE/EE, `zkmax/css/tablet`) | Java `WebApps.getEdition()` decides which URI is served | Already how ZK works |
| Tablet / touch | `@media (pointer: coarse)` / `(hover: none)`, container queries | Mechanism exists; CSS content pending |
| Density / compact | `data-density` attribute + token ladder | **Done** ([spec/data-dense-mode.md](spec/data-dense-mode.md)) |
| Brand override | One seed token + relative color syntax | **Done** ([spec/brand-override.md](spec/brand-override.md)) |
| High contrast | `@media (forced-colors: active)` | **Done** ([spec/forced-colors.md](spec/forced-colors.md)) |
| Print | `@media print` | **Done** |
| `${c:encodeURL(...)}` | Relative `url()`, or a tokenised whole-URL custom property | No image deps left (Lucide masks) |
| Icon-class loops | `scripts/build-css.js` generator | **Done** |
| Vendor-prefix / feature downlevel | `@supports`, or Lightning CSS `--targets` if ever needed | Modern-browsers-only policy makes it moot |

**Conclusion for ZK:** `.css.dsp` can stay as a *delivery container* (ZK's `WcsExtendlet` expects that
extension) while carrying zero EL. The interesting DSP capability — per-request templating — has no
modern peer because the ecosystem decided it was a caching bug, not a feature.

---

## 6. Recommendation

1. **Default to §2.1 + §2.2** (root attribute + custom properties). It covers density, brand, dark
   mode, and anything a customer might want to flip at runtime, and it is what every peer library
   exposes as its public theming API.
2. **Push deployment-time branches into Java** (§2.4), as `MarbleThemeProvider` already does. A
   ThemeProvider returning a different URI is strictly better than an EL branch inside a stylesheet:
   it is testable, typed, and cache-friendly.
3. **Use native at-rules for everything environmental** (§2.3), and adopt logical properties so RTL
   never becomes a second build artifact.
4. **Keep generation in `build-css.js`** (§2.5). If the generator ever grows past hand-rolled string
   work, Lightning CSS is the standards-syntax option — the input stays valid CSS, which LESS never was.
5. **Do not adopt a new CSS dialect** to replace LESS. The three things LESS was doing here (variables,
   nesting, generation) are now: custom properties (native), nesting (native), and a JS script.
