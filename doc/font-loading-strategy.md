# Font-Loading Strategy — Is the Google Fonts / Inter web font essential for Marble?

**Status:** ✅ **IMPLEMENTED 2026-06-26 (Option B2 — self-hosted Inter, variable, Latin subset).** Addresses backlog item **P2-3** of `doc/theme-feature-gap-review.md`. The CDN `@import` is gone; the font is vendored from npm and served from the theme. Verified at runtime (HTTP 200, `font/woff2`, no `googleapis` reference). The evaluation below is retained as the decision record.
**Date:** 2026-06-26

## What shipped

- **Font:** Inter variable, weight-axis only (100–900), **Latin + Latin-ext** (EU customers) — `inter-latin-variable.woff2` (**47 KB**, Western-European / Latin-1) + `inter-latin-ext-variable.woff2` (**83 KB**, Central/Eastern-European: Polish/Czech/Turkish/…). The two are partitioned by `unicode-range`, so the browser fetches latin-ext **only** when a page actually contains those glyphs.
- **Source:** `@fontsource-variable/inter` (devDependency). `scripts/build-css.js` → `copyFonts()` copies both `.woff2` files + the SIL OFL license into `target/classes/web/marble/font/` at build time — the same vendoring pattern used for Lucide icons (not committed to VCS; pinned via `package-lock.json`).
- **CSS:** `src/main/resources/web/zul/css/tokens/_fonts.css` declares two `@font-face` blocks (family `'Inter'`, `font-weight:100 900`, `src: url(${c:encodeURL("~./marble/font/…")}) format("woff2")`, each with its `unicode-range`). The existing `--zk-typescale-font-family: 'Inter', …` stack consumes them unchanged.
- **Gotcha fixed:** `${c:encodeURL(...)}` in a `.css.dsp` requires the DSP `c` taglib **declared at the top of the file**, or the parser throws `Function 'c:encodeURL' not found` and silently drops the `@font-face`. `build-css.js` prepends `<%@ taglib uri="http://www.zkoss.org/dsp/web/core" prefix="c" %>` to `norm.css.dsp` *after* minification (so CleanCSS never sees the non-CSS directive). This mirrors ZK's own `font-awesome.css.dsp`.
- **Why `c:encodeURL`, not a relative `url()`:** `norm.css.dsp` is served inside the `zk.wcs` aggregate, so a relative `url()` would resolve against the WCS path, not the font's location. `c:encodeURL("~./marble/font/…")` yields a context- and version-aware absolute URL (e.g. `/zkau/web/<hash>/marble/font/inter-latin-variable.woff2`) that is correct regardless of context path or WCS aggregation.

Jar impact: ~+50 KB (47 KB woff2 + 4 KB license). End-user download is roughly neutral vs. the old CDN (same font, now same-origin) and cached for a year.

## The question

Marble currently loads **Inter** from the Google Fonts CDN:

```css
/* src/main/resources/web/zul/css/tokens/_fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

Is this web font **essential** to Marble being a credible Material Design theme? Short answer: **No.** It is a visual *preference*, not a requirement.

## What Material Design / MUI actually require

| Reference | Canonical typeface | Does it *download* a web font? |
|-----------|--------------------|--------------------------------|
| **Material Design (MD2/MD3)** | **Roboto** (plus Roboto Flex / Roboto Serif) | Recommended, not required. On Android the system UI font *is* Roboto, so nothing is downloaded. |
| **MUI (React Material UI)** — Marble's visual target | `"Roboto","Helvetica","Arial",sans-serif` (default `theme.typography.fontFamily`) | **No.** MUI does **not** bundle Roboto; it only *recommends* you add it (via `@fontsource` or Google Fonts) and falls back to Helvetica/Arial otherwise. |
| **ZK IceBlue / Breeze** (the stock ZK theme this template derives from) | System stack `"Helvetica Neue", Helvetica, Arial, sans-serif` | **No web font for text at all** — system fonts only. (It bundles `.woff2` *only* for icon fonts.) See `tasks/theme-review/iceblue-font-loading.md`. |

Key point: **none** of Marble's reference points hard-depend on a downloaded text font. The "Material look" comes from the type *scale*, weights, spacing, and color — all of which Marble already encodes as `--zk-typescale-*` tokens — not from one specific font file.

Also worth noting: Marble's chosen font is **Inter**, which is **not** a Material Design font. It's a modern open-source UI typeface picked as a stylistic differentiator (a "MUI-modern" look). So the CDN dependency buys a *non-canonical brand preference*, not MD compliance.

## Marble already has a strong fallback

```css
--zk-typescale-font-family: 'Inter', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

If Inter never loads, the cascade resolves to each OS's native UI font:

- **macOS / iOS** → San Francisco (`-apple-system`) — visually very close to Inter.
- **Windows** → Segoe UI — clean, MD-appropriate.
- **Android / many Linux** → Roboto — *the* Material font.
- **Worst case** → Helvetica Neue / Arial — acceptable.

So on every mainstream enterprise desktop, dropping Inter yields a high-quality, MD-appropriate result. The realistic "loss" is limited to bare Linux boxes lacking good fonts.

## Trade-off of the three options

| Option | Offline / air-gapped | GDPR (no IP leak to Google) | Performance | Jar weight / maintenance | Keeps exact Inter look | Verdict |
|--------|----------------------|------------------------------|-------------|--------------------------|------------------------|---------|
| **A. Keep CDN `@import`** (status quo) | ❌ silently degrades | ❌ leaks user IP | ❌ render-blocking external request | ✅ none | ✅ | Worst for enterprise |
| **B. Self-host Inter** (bundle `.woff2` in jar, `@font-face`) | ✅ | ✅ | ✅ (same-origin, cacheable) | ⚠️ +~80–300 KB subset + upkeep | ✅ | Best if Inter identity matters |
| **C. Drop web font, use system stack** (like IceBlue & MUI default) | ✅ | ✅ | ✅ (zero bytes) | ✅ none | ❌ (native font per OS) | Simplest & most robust |

## Why Inter, not Roboto? (design rationale)

MD3's canonical typeface is **Roboto**, yet Marble ships **Inter**. The reason is concrete, not arbitrary: Marble's real visual target is the **Mira** admin dashboard (a MUI/React template — 49 reference pages in `doc/mira/`, and `DESIGN.md` is calibrated to its MUI classes and its denser-than-MD3 13–14px body). Mira uses **Inter** (e.g. `doc/mira/tasks.html`, `tables-*.html`), and `DESIGN.md:103` records the choice explicitly. So Marble matched its concrete reference (Inter) rather than the abstract spec (Roboto).

There is also a legibility argument that *independently* favors Inter for this product:

### Inter vs Roboto

| | **Roboto** | **Inter** |
|--|-----------|-----------|
| Origin | Google, 2011 — *the* Material Design system font | Rasmus Andersson, 2016+ — open source, designed specifically for UI/screens |
| Look | "Dual nature": mechanical skeleton + slightly condensed, friendly curves; reads as "Google/Material" | Tall x-height, open apertures, neutral "modern SaaS" look (GitHub, Figma-era tools) |
| Small-size legibility (13–14px dense tables) | Good, but tighter apertures/condensed width | **Stronger** — large x-height + open apertures are built for small on-screen text → fits Marble/Mira's dense layout |
| Fallback transition | Differs from `-apple-system` | Metrics close to San Francisco → smoother degradation to the system stack |
| Variable font | Yes (Roboto Flex) | Yes (one file, 100–900) |
| Brand fit | ✅ canonical MD3 | ❌ not a Material font; ubiquity can feel generic |
| Free on a platform | ✅ Android system font (zero download there) | No platform ships it by default |

Net: Roboto is the *correct MD-brand* answer; Inter is the *better dense-dashboard legibility* answer and the one that matches Marble's actual reference. For an enterprise data UI at 13px body, Inter is defensible.

### System fonts vs a bundled web font (Roboto or Inter) — the real design trade-off

| | **System-font stack** (SF / Segoe UI / Roboto-per-OS) | **Bundled web font** (self-hosted Inter or Roboto) |
|--|--------------------------------------------------------|----------------------------------------------------|
| Consistency across OS | ❌ different typeface per OS → slight metric drift | ✅ identical everywhere |
| Native feel | ✅ matches the user's OS | neutral |
| Performance / offline / GDPR | ✅ zero bytes, no external dep | ✅ if self-hosted (same-origin) |
| Pixel parity with Mira baselines | ❌ drifts | ✅ holds |
| **Visual-regression screenshots (this repo uses Playwright!)** | ❌ baselines differ per OS/CI → flaky | ✅ stable baselines |
| Worst case | bare Linux → Arial/Helvetica | controlled |
| Brand identity | diluted (no single look) | ✅ one curated identity |

The decisive point *for this project specifically*: Marble has Playwright **visual-regression tests** and is calibrated pixel-for-pixel against Mira. A system-font stack makes the rendered text — and therefore screenshots and tight table layouts — **vary by OS**, which both weakens the brand and destabilizes the baselines. A bundled web font keeps a single, reproducible look on every client and in CI. That is the strongest design reason to prefer a self-hosted font over the system stack here — and, given the reference is Inter, to self-host **Inter** specifically.

## Recommendation

**The hard CDN dependency (Option A) should not ship in an enterprise theme.** Choose based on how much the *exact* Inter identity matters:

- If Inter is a deliberate, non-negotiable part of Marble's brand → **Option B (self-host)**. Bundle a Latin (+ Latin-ext if needed) `.woff2` subset under `src/main/resources/web/marble/font/`, replace the `@import` with `@font-face`, keep `font-display: swap`.
- If "a clean modern Material sans" is the goal and per-OS native rendering is acceptable → **Option C (system stack)**. Delete the `@import`, drop `'Inter'` from the head of the stack (or keep it so locally-installed Inter is still used), ship zero font bytes. This matches both IceBlue and MUI's own default behavior and is the lowest-risk, lowest-maintenance path.

A reasonable hybrid: **default to Option C**, and offer self-hosted Inter as an opt-in for teams that want the precise look.

## Implementation notes (if self-hosting — Option B)

"Download the Google Font to local" is *exactly* self-hosting. It has three sub-variants that differ only in how the `.woff2` gets into the jar:

| Variant | How | Notes |
|---------|-----|-------|
| **B1 — manual** | Download `.woff2` (Google Fonts / google-webfonts-helper), commit into `src/main/resources/web/marble/font/` | Works, but binaries in VCS + manual version bumps |
| **B2 — npm (recommended)** | Add `@fontsource/inter` (or `@fontsource-variable/inter`) as a devDependency; have `build-css.js` copy the needed `.woff2` into `web/marble/font/` and emit `@font-face` | **Same pattern the build already uses for `lucide-static`** (`build-css.js` reads `node_modules/lucide-static/icons` → generates CSS). Version-pinned, reproducible, reviewable. |
| **B3 — build-time fetch from CDN** | `npm run build:css` downloads from Google and vendors it | Build needs network; fragile — not recommended |

> Note: Google's `css2?family=Inter` API returns a CSS whose `@font-face` rules point to Google-hosted `.woff2` split by `unicode-range`. "Downloading to local" means vendoring those binaries and rewriting the `url()` to a same-origin path. `@fontsource` packages are essentially "Google Fonts, pre-downloaded and packaged as npm" — which is why B2 is the least effort.

**Size wins (apply to any variant):**
- **Variable font** — one `InterVariable.woff2` covers weights 300–700, smaller than 5 static files and a simpler `@font-face`.
- **Latin subset** — drops a few-hundred-KB file to ~30–50 KB.

**Recommended: B2 + variable font + Latin subset.** Best fit for this repo's existing npm/build pipeline; offline-safe, GDPR-safe, version-controlled, lowest maintenance.

**Not the same as a CDN proxy.** Proxying Google through your own server is still an external request, does **not** solve offline, and only partially mitigates GDPR — inferior to true local hosting.

### Mechanics (mirror IceBlue's icon-font approach — `tasks/theme-review/iceblue-font-loading.md`)

1. Put the file(s) in `src/main/resources/web/marble/font/` → served at `~./marble/font/`.
2. In `_fonts.css`, replace `@import` with `@font-face`. Since `_fonts.css` builds into plain CSS (`norm.css.dsp`), a relative `url()` works:
   ```css
   /* variable font — one file, all weights */
   @font-face {
     font-family: 'Inter';
     font-weight: 100 900; font-style: normal; font-display: swap;
     src: url('../../../marble/font/inter-latin-variable.woff2') format('woff2-variations');
   }
   ```
   Or, for static weights, one block per weight (drop `300` unless `.z-fw-light` is actually used). Alternatively convert `_fonts.css` → a `.dsp` and use the classpath form `url(${c:encodeURL("~./marble/font/…woff2")})` exactly like IceBlue.
