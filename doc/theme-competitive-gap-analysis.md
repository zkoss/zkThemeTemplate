# Competitive Theme-Feature Gap Analysis — Marble vs. Mainstream Enterprise UI Frameworks

**Date:** 2026-06-26
**Question:** Compared with ≥5 of the most popular enterprise UI frameworks, what theme/appearance features is Marble *obviously* still missing?
**Scope:** The **appearance / theming layer** — color schemes, brand customization, accessibility theming, i18n (RTL), density, presets. This is **complementary to** `doc/theme-feature-gap-review.md` (which audits ZK theme *infrastructure*: SPI, `.css.dsp`, fonts, tablet) and does **not** repeat it.
**Method:** Grounded in the actual Marble token/CSS source (greps + file inspection, cited below) compared against the public theming capabilities of MUI v7, Ant Design v5, Bootstrap 5.3, Microsoft Fluent UI 2, IBM Carbon, and PrimeFaces/PrimeNG (ZK's closest server-side competitor).

---

## Frameworks compared

| # | Framework | Why it's a relevant benchmark |
|---|-----------|-------------------------------|
| 1 | **MUI (Material UI) v7** | Marble's explicit visual reference; sets the bar for Material theming. |
| 2 | **Ant Design v5** | Enterprise React standard; token-algorithm theming (dark/compact). |
| 3 | **Bootstrap 5.3** | Most-deployed CSS framework; added color modes in 5.3. |
| 4 | **Microsoft Fluent UI 2** | Accessibility/high-contrast leader (Windows ecosystem). |
| 5 | **IBM Carbon Design System** | Enterprise/government; ships 4 themes, strong a11y. |
| 6 | **PrimeFaces / PrimeNG / PrimeReact** | **Closest analog to ZK** — server-side Java component suite; dozens of prebuilt themes + visual Theme Designer. |
| (7) | Vuetify 3 | Extra Material datapoint (built-in dark + custom themes). |

---

## Feature comparison matrix

Legend: ✅ first-class · ⚠️ partial / undocumented · ❌ absent

| Theme feature | MUI | Ant | Bootstrap | Fluent | Carbon | Prime* | **Marble** |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Dark mode / color-scheme switch** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **⊘ won't-do** |
| **Runtime brand/seed color customization** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **⚠️** |
| **Multiple prebuilt theme presets** | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** |
| **In-app theme switcher** (light↔dark / preset) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** |
| Design tokens / CSS custom props | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** |
| Semantic palette (success/warn/info/error) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** |
| Density / compact mode | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | **✅** |
| **RTL / bidirectional support** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **⚠️** |
| **`prefers-reduced-motion`** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | **❌** |
| **`forced-colors` / Windows High-Contrast** | ⚠️ | ❌ | ⚠️ | ✅ | ✅ | ❌ | **❌** |
| **Dedicated high-contrast theme** | ❌ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ | **❌** |
| Elevation / shadow system | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** |
| Typography scale tokens | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** |
| Responsive / touch sizing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **✅** |
| **Live theme builder / playground** | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | **❌** |

**Read of the matrix:** Marble is at parity on the *static* design-system fundamentals (tokens, semantic palette, density, elevation, typography, responsive). Every gap clusters in three areas where it trails the field: **(A) color-scheme flexibility (dark + brand + presets), (B) accessibility theming, (C) internationalization (RTL).**

---

## The obvious gaps, ranked

### GAP 1 — Dark mode / alternate color scheme  ·  ⊘ **WON'T-DO (decided 2026-06-29)**

> **Decision:** Dark Theme will **not** be implemented. Rationale documented in [dark-theme-adoption.md](dark-theme-adoption.md): in enterprise internal systems (ERP/CRM/HRM) dark mode is a *minority, high-friction* request — high information density reads worse on dark, status-color semantics degrade under desaturation, bright office ambient light turns dark screens into mirrors, and the ROI (re-deriving elevation, re-tuning every chart/status color, contrast testing) does not justify the spend versus speed/automation work. It is a "nice-to-have garnish," not the consumer-grade must-have. **This gap is intentionally accepted, not a backlog item.**

- **Context (kept for the record):** Light only. Grep confirms **0** `prefers-color-scheme`, **0** `[data-theme]` switching, CSS `color-scheme` not declared.
- **Everyone else has it:** All 6 benchmark frameworks ship dark mode (MUI `colorSchemes`, Ant `darkAlgorithm`, Bootstrap `data-bs-theme`, Fluent `webDarkTheme`, Carbon `g90/g100`, Prime* `*-dark`). Marble consciously diverges here on enterprise-fit grounds.
- **If ever revisited:** the centralized `tokens/_colors.css` layer makes authoring cheap; the real cost is re-verifying every component in dark through the dual-gate harness. Per the adoption note, the pragmatic partial path would be dashboard/monitoring modules only — not transactional grids/forms.

### GAP 2 — Runtime brand / seed-color customization  ·  *Severity: High (enterprise buying criterion)*

- **Current state:** The palette is **hardcoded** (`--zk-color-primary: #376fd0`) with **hand-picked** container/on-color shades (`primary-container`, `on-primary-container`, etc. in `_colors.css:15-62`). Tokens live at `:root` so a customer *can* override `--zk-color-primary` — but nothing regenerates the derived shades, hover/state overlays, or container tones from it. There is **no documented customization recipe and no seed→tonal-palette generation.**
- **What competitors do:** MUI/Material generate a full tonal palette from a seed; Ant derives the whole token set algorithmically from `colorPrimary`; Fluent builds themes from a brand color ramp; PrimeFaces ships a visual **Theme Designer**. Enterprise customers routinely require "make it our brand blue/green" — today that means hand-editing ~10 coupled hex values and hoping contrast holds.
- **Minimum viable fix:** a documented brand-override contract (which 2–3 tokens to set) + derive containers/overlays via `color-mix()` from the seed so one variable cascades correctly. Full fix: a small seed→palette generator (build-time or JS).

### GAP 3 — Multiple prebuilt presets + in-app theme switcher  ·  *Severity: Medium*

- **Current state:** Exactly **one** shipped theme (Marble). `iceblue` exists only as a *comparison baseline* for the verification harness, not as a selectable Marble variant. No switcher UI in the preview/use-case apps.
- **What competitors do:** PrimeFaces/PrimeNG ship **dozens** (Aura, Lara, Material, Saga, …) with a live switcher; Carbon ships 4 (White/G10/G90/G100); Bootstrap has the Bootswatch ecosystem; Fluent ships web/teams light+dark+high-contrast. A theme switcher is table-stakes in their demo sites.
- **Cheapest meaningful win:** once GAP 1 (dark) lands, expose a switcher in the use-case SPA — it both demos dark mode and signals "themeable" to evaluators.

### GAP 4 — Accessibility: `prefers-reduced-motion`  ·  ✅ **DONE 2026-06-29**

- **Implemented:** universal `@media (prefers-reduced-motion: reduce)` reset appended to `tokens/_motion.css` (→ bundled into global `norm.css.dsp`); neutralizes all CSS transitions/animations theme-wide (`1ms`, iteration-count capped, `scroll-behavior:auto`). Build-verified in the minified artifact. Documented in `doc/spec/DESIGN.md` §9 (Motion → Reduced motion), with an inline comment at the implementation site.
- **Was:** **0** occurrences — Marble had a full motion-token system but nothing disabled it for reduced-motion users (WCAG 2.1 SC 2.3.3 gap). Now closed.
- **Note (chosen mechanism):** universal reset rather than token-zeroing, because the universal rule *also* covers hardcoded durations and `@keyframes` (token-zeroing would miss those). `1ms` not `0s` so `transitionend`/`animationend` still fire (CleanCSS rounds sub-ms to `0s`).

### GAP 5 — Accessibility: `forced-colors` / Windows High-Contrast Mode  ·  *Severity: Medium (gov/finance/regulated)*

- **Current state:** **0** `forced-colors`, **0** `prefers-contrast`, **0** dedicated high-contrast theme. Components that lean on `::before` state-layer overlays and `box-shadow` borders (common in MD themes) tend to *vanish* under Windows High-Contrast unless explicitly handled.
- **What competitors do:** Fluent treats high-contrast as a **first-class theme**; Carbon documents forced-colors behavior. For public-sector / financial / EU-accessibility-directive customers this is often a hard requirement.
- **Fix:** add `@media (forced-colors: active)` guards on focus rings, borders, and overlay-driven affordances (use `forced-color-adjust` + system colors like `CanvasText`/`Highlight`).

### GAP 6 — RTL / bidirectional support  ·  *Severity: Medium (i18n)*

- **Current state:** **Partially ready, not done.** Encouraging: 61 logical-property usages (`margin-inline`, `inset-inline-*`) vs 27 remaining physical `left/right` ones — but there is **0** explicit `[dir=rtl]` handling, and those 27 physical properties + directional icons/chevrons will mirror incorrectly. Not verified or tested.
- **What competitors do:** MUI (stylis-plugin-rtl), Ant (`direction`), Bootstrap (`bootstrap.rtl.css` + logical props), Fluent, Carbon, Prime* all ship verified RTL. ZK itself supports `dir="rtl"`, so the gap is purely on the theme CSS side.
- **Fix:** finish migrating the 27 physical properties to logical, flip directional glyphs under `[dir=rtl]`, add an RTL Playwright project (mirrors the existing tablet-UA project pattern).

### Minor / lower-priority

- **No `tertiary` color role** — MD3 defines it; Marble has primary+secondary only. Cosmetic unless a component needs a third accent.
- **No live "customize & preview" theme playground** — most benchmarks have one; nice-to-have for adoption, lower than the functional gaps above.

---

## Where Marble already holds parity (so the picture is balanced)

These are **not** gaps — Marble is competitive or strong here, and the analysis should not imply otherwise:

- **Design-token architecture** — clean, centralized `--zk-*` token layer (colors, spacing, shape, elevation, motion, typography). This is the foundation that makes GAP 1/2/4 *tractable*.
- **Semantic color palette** — primary, secondary, error, warning, success, info (`status-*`), each with container/on-color pairs (`_colors.css`). Matches or beats the breadth several frameworks ship by default.
- **Density / compact mode** — `data-density="compact"` whole-app + per-region, with a control-height ladder and `MarbleDensity` Java API (`doc/spec/data-dense-mode.md`). At parity with Ant `compactAlgorithm` / Carbon density.
- **Responsive + touch** — tablet theme, 44/48dp touch ladder, wheel-picker bottom sheets (per the infrastructure review).
- **Focus visibility** — 52 `focus-visible` usages; keyboard-focus styling is well covered (it's the *other* a11y axes — motion/contrast — that are missing).
- **Elevation, typography scale, self-hosted font** — all present and tokenized.

---

## Suggested priority order

A pragmatic sequence by *impact ÷ effort* (dark mode removed per the 2026-06-29 won't-do decision):

1. ✅ **`prefers-reduced-motion`** (GAP 4) — **DONE 2026-06-29.** Smallest effort, real a11y win, one media block.
2. **Brand-color override recipe via `color-mix()`** (GAP 2) — **next.** Highest remaining enterprise value; documented contract first, generator later.
3. **`forced-colors` guards** (GAP 5) — needed for regulated-sector (gov/finance/EU) deals.
4. **Finish RTL** (GAP 6) — migrate the remaining physical properties + RTL Playwright project.
5. **Multiple presets + theme switcher** (GAP 3) — now decoupled from dark; valuable for brand variants, lower priority since the headline preset (dark) is intentionally dropped.

> **Bottom line:** Marble's *static* Material design system is solid and at parity. With dark mode consciously off the table (enterprise-fit, per `dark-theme-adoption.md`) and reduced-motion now shipped, the remaining evaluator-visible gaps are **brand re-coloring**, **accessibility theming** (`forced-colors`/high-contrast), and **finishing RTL**. None require re-architecting — the centralized token layer is the right substrate for all of them.
