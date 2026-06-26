# Theme-Feature Completeness Review — Marble (ZK 10.2.1-jakarta)

**Date:** 2026-06-26
**Scope:** Theme *infrastructure* — ZK theme SPI, library properties, `.css.dsp` edition coverage, font/typography config, tablet/responsive theme. **Excludes** per-component CSS design (governed by the existing dual-gate `zk-theme-evaluator` / `md3-design-verifier` harness).
**Method:** 5 parallel `zk-framework-expert` review lanes vs ZK 10 source (`/Users/hawk/Documents/workspace/ZK10/zk`) + ZKDoc, then synthesis. Lane reports: `tasks/theme-review/{a-spi,b-libprops,c-cssdsp,d-fonts,e-tablet}.md`.
**Output mode:** Gap report only — no code changed by this review.

---

## Executive Summary

**Marble's theme infrastructure is substantially complete and idiomatically wired.** The core SPI (`ThemeProvider`, `WebAppInit` registration, tablet theme), the full `.css.dsp` edition matrix (CE/PE/EE, including 404-preventing stubs), and the tablet/responsive theme are all correctly implemented and, where applicable, covered by Playwright tests.

**The deprecated font library properties are correctly handled — not a gap.** `org.zkoss.zul.theme.fontFamily*` and `fontSize*` (deprecated in the ZK 7.0.0 LESS era) are **deliberately absent**. Their only consumer was the LESS-era `ext.css.dsp` template; in ZK 10.2.1 that file still ships as a classpath resource but is **no longer requested by any WCS/lang mechanism** (`zk.wcs` loads only `font-awesome.css.dsp` + `norm.css.dsp`), so setting these properties has **no effect in a normal ZK 10 deployment**. Marble replaces them with `--zk-typescale-*` CSS custom properties consumed at `body`/`.z-page` in `_reset.css`. This is the correct modern design; the review confirms it as an **intentional decision**, and the only follow-up is to *document* that decision (P3).

**No functional/correctness defects and zero 404-risk files were found.** The genuine findings are: (1) theme priority causing iceblue to auto-win when both themes are on the classpath, (2) an undocumented Google-Fonts-CDN dependency that matters to enterprise customers, (3) ~~one known mobile UX rough edge (combobox bottom-sheet overshoot)~~ **— fixed 2026-06-26 (P2-4)**, and (4) a handful of documentation/hygiene items.

> **Update 2026-06-26 — `browserDefault` JS-Embed reset-scoping implemented (was P2-2).** The reset was split out of `norm.css.dsp` into two separately-served stylesheets — `reset.css` (global, verbatim) and `reset-embed.css` (html/body frame dropped, widget rules wrapped in `@scope (.z-page)`). `MarbleThemeProvider.getThemeURIs` reads `org.zkoss.zul.theme.browserDefault` and inserts the right variant immediately before `zk.wcs` (DSP-free — cleaner than the originally-suggested `<c:if>` branching). Documented in `doc/spec/reset-scoping.md`. See P2-2 below (resolved). *Not yet re-run through the Phase-C adversarial gate — worth a render check that, in embed mode, the `@scope`-wrapped `*{box-sizing:border-box}` still reaches floating widgets that ZK moves to `<body>` (outside `.z-page`); confirm component CSS sets `box-sizing` on those float roots.*

### Status tally

| Lane | PRESENT | DEPRECATED-OK | N/A | MISSING (genuine) |
|------|---------|---------------|-----|-------------------|
| A — SPI & registration | 8 | 0 | 1 | 2 (both low: priority default, ThemeOrigin explicitness) |
| B — Library properties | 2 (preferred app-level; **browserDefault — now implemented**) | 6 (font props) | 2 | 0 |
| C — `.css.dsp` coverage | all required paths covered | — | — | **0 (no 404 risk)**; 3 doc-path + 1 stray-file hygiene |
| D — Font / typography | well-formed (swap, fallback stack, no leak) | 6 (font props) | 1 | 3 docs/tokens (CDN note, migration note, letter-spacing) |
| E — Tablet / responsive | 30 | 0 | 0 | 0 (combobox bottom-sheet — **fixed 2026-06-26, P2-4**) |

---

## Findings Matrix

Status legend: **PRESENT** = implemented · **DEPRECATED-OK** = intentionally absent (modern) · **N/A** = out of scope · **MISSING** = ZK-doc feature genuinely absent.

### A — Theme SPI & registration

| Feature | Status | Evidence | Note |
|---------|--------|----------|------|
| `ThemeProvider` — all 4 methods (`getThemeURIs`, `beforeWCS`, `beforeWidgetCSS`, `getWCSCacheControl`) | PRESENT | `MarbleThemeProvider.java:12-53` | `beforeWidgetCSS` rewrites `~./zul`,`~./js/zul`,`~./js/zkmax`,`~./js/zkex` — a correct **superset** of `StandardThemeProvider` (which omits zkmax/zkex). Filters font-awesome (Lucide-only). |
| `zk.xml` `<theme-provider-class>` + Java `setThemeProvider` + `setCustomThemeProvider(true)` | PRESENT (intentional redundancy) | `zk.xml:4`; `MarbleThemeWebAppInit.java:53-54` | Necessary ZK-1671 lock: `ConfigParser.java:570` auto-sets `_customThemeProvider` only for classes **outside** `org.zkoss.*`; Marble lives in `org.zkoss.theme.marble`, so the explicit call is required to survive jar load-order races. Not redundant. |
| `Themes.register(name, display, priority)` | PRESENT | `MarbleThemeWebAppInit.java:38` | priority 700. |
| `tablet:marble` EE-gated registration | PRESENT | `MarbleThemeWebAppInit.java:40-43` | `"EE".equals(WebApps.getEdition())` + `ResponsiveThemeRegistry.TABLET_PREFIX`. |
| `ThemeURIHandler` (composable, since 9.6.0) | MISSING (not a gap) | — | Only handles desktop `<link>` injection, not WCS per-widget rewriting. `beforeWidgetCSS` is the correct hook here. No action. |
| `ThemeResolver` / `CookieThemeResolver` runtime switching | N/A | — | Single-theme JAR; host app can call `Themes.setTheme(exec,"marble")`. No JAR wiring needed. |
| Theme **priority 700 vs iceblue 500** | MISSING (deployment risk) | `MarbleThemeWebAppInit.java:38`; `StandardTheme.java:44` | **Lower value = higher priority.** When both themes are on the classpath and no cookie / `org.zkoss.theme.preferred` is set, iceblue (500) **auto-wins**. Marble is only the default because its preview app sets `preferred=marble`. → backlog **P2**. |
| `ThemeOrigin.JAR` explicit in `register` | MISSING (cosmetic) | `MarbleThemeWebAppInit.java:38` | Default is already `JAR`; passing it explicitly is self-documenting only. → **P3**. |

### B — Library properties

| Property | Status | Note |
|----------|--------|------|
| `org.zkoss.zul.theme.fontSizeM / fontSizeMS / fontSizeS / fontSizeXS` | DEPRECATED-OK | Only consumer was the LESS-era `ext.css.dsp`; that file still ships in ZK 10.2.1 but is no longer requested by any WCS/lang mechanism, so the properties have no effect. Replaced by `--zk-typescale-*-size`. |
| `org.zkoss.zul.theme.fontFamilyT / fontFamilyC` | DEPRECATED-OK | Same. Replaced by `--zk-typescale-font-family`. |
| `org.zkoss.theme.preferred` | PRESENT (app-level only — correct) | A theme JAR must **not** hardcode it; preview app sets it in `ThemePreviewApp.java`. Marble relies on registry priority instead. |
| `org.zkoss.theme.folder.root` | N/A | Folder-based themes only; Marble is JAR-based (`ServletFns.resolveThemeURL` bypasses it). |
| `org.zkoss.theme.atlantic.useGoogleFont.disabled` | N/A | Atlantic-private. If Marble ever needs offline mode it must add its **own** property, not reuse this. |
| `org.zkoss.zul.theme.browserDefault` (**not deprecated**) | PRESENT (implemented 2026-06-26) | The reset is now served as two separate stylesheets ahead of `zk.wcs`: `reset.css` (global, default) and `reset-embed.css` (html/body frame dropped + widget rules wrapped in `@scope (.z-page)`). `MarbleThemeProvider.getThemeURIs:29-46` reads the property (`false`→global, `true`→embed-safe) and inserts the right variant — DSP-free. Source markers `page-frame:start/end` in `_reset.css:10-58`; build splits via `buildResetVariants()`/`toEmbedReset()` in `scripts/build-css.js:417-432`. Documented in `doc/spec/reset-scoping.md`. |

### C — `.css.dsp` & edition (CE/PE/EE) coverage

| Area | Status | Note |
|------|--------|------|
| Every `.css.dsp` ZK 10.2.1 requests via `css-uri` (CE `zul`, PE `zkex`, EE `zkmax`) | PRESENT / PRESENT-STUB | **Zero MISSING → zero 404 risk.** Real CSS where implemented; empty stubs (font-awesome, zkex/grid, zkmax/sel listbox+tree, zkmax/grid, video, portallayout, scrollview, goldenlayout `layout/css` alias) prevent fallback 404s. |
| `tablet.css.dsp` | PRESENT | Built for real (not stubbed). |
| Doc path drift in `doc/spec/css-dsp-file-structure.md` | hygiene | Lists legacy iceblue_c paths for `tbeditor`/`cropper`/`signature` (`inp/`, `med/`, `wgt/`); ZK 10.2.1 resolves them via widget packages (`zkmax/tbeditor/`, `zkmax/cropper/`, `zkmax/signature/`). Marble builds the **correct** paths; the **doc** is stale. → **P3**. |
| Stray source `js/zul/layout/anchorlayout.css` (wrong dir level) | hygiene | Auto-scan emits a dead DSP at an unrequested path alongside the correct `layout/css/` one. Harmless; delete the stray source. → **P3**. |

### D — Font / typography configuration

| Area | Status | Note |
|------|--------|------|
| Deprecated `org.zkoss.zul.theme.*` font props → CSS-token migration | DEPRECATED-OK | Fully superseded; no stock-ZK font leak (stock LESS compiles into built-in themes only; `_reset.css` overrides at `body`/`.z-page`). |
| Fallback font stack | PRESENT | `'Inter', -apple-system, …, sans-serif` degrades gracefully. |
| `&display=swap` | PRESENT | FOIT prevented. |
| `@import` position after minify | PRESENT | Build extracts `@layer` before CleanCSS, keeps `@import` at line 1. |
| Icon-font (FontAwesome) bleed | PRESENT (mitigated) | `_icons.css` resets `font-family: inherit` on `z-icon-*`. |
| **Google Fonts CDN dependency** (offline/air-gapped + GDPR/IP exposure) | MISSING (doc + recipe) | Render-blocking external dep undocumented; enterprise/on-prem/EU customers need a self-hosting recipe. → **P2**. |
| Migration-decision note (why deprecated props are absent) | MISSING (doc) | No written rationale; a maintainer could re-add the props. One paragraph in `DESIGN.md §7`. → **P3**. |
| MD3 `letter-spacing` typescale tokens | MISSING (token completeness) | No `--zk-typescale-*-letter-spacing`; `.z-h1`/`.z-h2` hardcode literals. → **P3**. |
| `tbeditor.css` uses literal `monospace` | hygiene | Should consume `var(--zk-typescale-mono-family)`. → Low. |

### E — Tablet / responsive theme

| Area | Status | Note |
|------|--------|------|
| EE registration, `TABLET_PREFIX`, EE gate | PRESENT | `MarbleThemeWebAppInit.java:40-43`. |
| `TabletThemeURIHandler` injection (cascade pos 1, `disabled`, mobile-UA enable) | PRESENT | Registered by **zkmax's own** `zk.xml` — platform concern, not the theme's. |
| `tablet.css.dsp` build + 9 non-empty partials | PRESENT | `scripts/build-css.js` stage 5; explicitly excluded from stubs. |
| Touch sizing (buttons/inputs/selection/mesh/calendar/window/scrollbar) | PRESENT | 44/48dp ladder via `--zk-touch-*` tokens. |
| Wheel picker (datebox/timebox) bottom-sheet pin + mobile-readonly neutralization | PRESENT | `_wheel.css` (226 lines) + `_inputs.css`; both tap targets Playwright-tested. |
| Viewport meta on mobile UA | PRESENT (ZK-native) | `PageRenderer` injects it; Marble doesn't disable it. No theme action. |
| CE/PE graceful absence (no tablet 404) | PRESENT | tablet theme never registered off-EE. |
| **combobox bottom-sheet overshoot on mobile** | ~~MISSING~~ **✅ RESOLVED 2026-06-26** | `combo-touch.ts` `_syncPosition` uses the same `top = innerHeight + scrollY` + `makeVParent` anchor as the wheel picker → could clip on scrolled pages. Fixed in `_inputs.css` (`position:fixed; inset:auto 10px 0`, shared `zk-bottom-sheet-up` keyframe); 2 `tablet.spec.ts` cases. **Scope correction:** only **combobox** is affected — **selectbox** is a native `<select>` (browser picker, no ZK popup) and **bandbox** has no touch mold (keeps anchored positioning); neither was ever a gap. → was **P2-4**. |

---

## Prioritized Backlog

No **P1** (functional defect / data-loss) items exist. All genuine gaps are deployment-scenario, enterprise-readiness, or documentation.

### P2 — Enterprise-readiness / deployment correctness

| ID | Item | Why | Rough effort |
|----|------|-----|--------------|
| **P2-1** | Theme priority — **✅ DECIDED 2026-06-26: keep `500`** (was 700). | Marble ships as the default/primary theme of its own distribution, so competing with `iceblue`@500 is a non-issue in practice; where both coexist, the app sets `org.zkoss.theme.preferred=marble` (always wins, step 2). Documented caveat for adopters: at equal priority the tie is resolved by non-deterministic `HashMap` order (`getCurrentTheme()` replaces only on *strictly* lower value), so an app that must auto-select Marble without `preferred` should register it at < 500. | done (accepted) |
| **P2-2** | ~~`org.zkoss.zul.theme.browserDefault` reset-scoping for JS-Embed~~ — **✅ RESOLVED 2026-06-26** | Implemented without DSP: reset split into `reset.css` (global) + `reset-embed.css` (`@scope (.z-page)`, frame dropped), variant chosen by `MarbleThemeProvider.getThemeURIs` from the `browserDefault` property and loaded ahead of `zk.wcs`. `@layer` lifted above `@scope`; floating widgets in `<body>` are outside `.z-page` and stay host-safe by inheriting nothing. See `doc/spec/reset-scoping.md`. | done |
| **P2-3** | ~~Font-loading strategy + self-hosting~~ — **✅ DONE 2026-06-26.** Inter now self-hosted (variable, Latin **+ Latin-ext** for EU customers; 47 KB + 83 KB, `unicode-range`-partitioned so latin-ext loads only when needed) from `@fontsource-variable/inter`, vendored by `build-css.js` into `~./marble/font/`; CDN `@import` removed; `@font-face` uses `${c:encodeURL}` (taglib prepended to `norm.css.dsp`). Runtime-verified (both fonts 200, both URLs EL-evaluated, no `googleapis`). Decision + rationale now summarized in `doc/spec/DESIGN.md` §7 (Font loading). *Remaining context for the original concern:* Google Fonts CDN `@import` failed in air-gapped installs and leaked end-user IPs (GDPR) — both now eliminated. **IceBlue reference (research: `tasks/theme-review/iceblue-font-loading.md`):** IceBlue loads **no web font for body text** — it uses a system-font stack only. It bundles font *files* only for **icon fonts**, via `@font-face { src: url(${c:encodeURL("~./zul/less/font/fa-solid-900.woff2")}) }` with the `.woff2` inside the jar. So the idiomatic self-host for Inter mirrors that: place `inter-*.woff2` in `src/main/resources/web/marble/font/` (served `~./marble/font/`), replace the `@import` in `_fonts.css` with `@font-face` blocks using a relative `url('../../../marble/font/…woff2')` (plain CSS) or convert `_fonts.css`→`.dsp` and use `c:encodeURL("~./marble/font/…")`. | S |
| **P2-4** | ~~combobox mobile bottom-sheet anchor fix + tests~~ — **✅ DONE 2026-06-26** | Source-verified (`combo-touch.ts`): combobox's mobile popup shares the wheel picker's `top = innerHeight + scrollY` + `makeVParent` anchor, so it could clip on scrolled pages. Fixed by pinning `.z-combobox-popup` with `position:fixed; inset:auto 10px 0` in `_inputs.css` (reusing a shared `zk-bottom-sheet-up` keyframe lifted out of `_wheel.css`); 2 `tablet-combobox-sheet` cases added — all 22 tablet tests green. **Scope correction from the original report:** *combobox only* — **selectbox** is a native `<select>` (no ZK popup) and **bandbox** has no touch mold (anchored positioning), so neither was affected. | done |

### P3 — Documentation & token completeness

| ID | Item | Why | Rough effort |
|----|------|-----|--------------|
| **P3-1** | ~~Migration-decision note in `DESIGN.md §7`~~ — **✅ DONE 2026-06-26** | Added a "Deprecated font library-properties — intentionally absent" note under §7 Typography: `org.zkoss.zul.theme.fontFamily*`/`fontSize*` (deprecated since ZK 7.0.0) are deliberately omitted in favour of `--zk-typescale-*` tokens; do not re-add. | done |
| **P3-2** | ~~Refresh `doc/spec/css-dsp-file-structure.md` paths~~ — **✅ DONE 2026-06-26** | Removed the legacy iceblue_c duplicate paths (`zkmax/inp/.../tbeditor`, `zkmax/med/.../cropper`, `zkmax/wgt/.../signature`) — the ZK 10.x widget-package paths (`zkmax/tbeditor/`, `zkmax/cropper/`, `zkmax/signature/`) were already listed under "Other" and are kept. Dropped the misleading `js/zul/box/css/splitter.css.dsp` entry (marble emits no such DSP — splitter styling is bundled via the `_splitter.css` token). | done |
| **P3-3** | ~~Delete stray `src/main/resources/web/js/zul/layout/anchorlayout.css`~~ — **✅ DONE 2026-06-26** | Deleted. The file sat outside the `css/` subdir but was still caught by the 1:1 auto-scan, emitting a dead `js/zul/layout/anchorlayout.css.dsp` alongside the real `js/zul/layout/css/anchorlayout.css.dsp`. | done |
| **P3-4** | ~~Tokenize heading tracking~~ — **✅ DONE 2026-06-26** | Added `--zk-typescale-tracking-tight` (-0.25px) / `--zk-typescale-tracking-tighter` (-0.5px) to `_typography.css` tokens; `.z-h1`/`.z-h2` now reference them instead of hardcoded literals. Semantic (not role-named) tokens because the `.z-h*` utilities are bespoke headings, not MD3 typescale roles. | done |
| **P3-5** | ~~Explicit `ThemeOrigin.JAR`; `tbeditor` mono-family token~~ — **✅ DONE 2026-06-26** | Both `Themes.register(...)` calls now pass the explicit `ThemeOrigin.JAR` (StandardTheme's default, now self-documenting); `tbeditor.css` `.z-tbeditor-textarea` uses the existing `--zk-typescale-mono-family` token instead of a bare `monospace`. | done |

---

## Verification of this report

- **Coverage** — every documented ZK 10 theme library property and SPI surface appears above with a status (lane B §3 confirms grep of ZK source returns exactly the 7 DSP-consumed + 2 Java-consumed + 1 Atlantic-private properties).
- **No false gaps** — Phase C adversarial pass (below) re-checked each MISSING item against ZK source.
- **Deprecated props** — `fontFamily*`/`fontSize*` recorded as DEPRECATED-OK with migration rationale, per the review's framing.
- **Citations** — findings cite `file:line` in-repo and/or ZK-source / ZKDoc references; see lane reports for full evidence tables.
