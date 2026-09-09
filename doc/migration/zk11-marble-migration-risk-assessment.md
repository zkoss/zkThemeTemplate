# Marble → ZK master Migration: Risk Assessment

**Date:** 2026-09-04
**Scope:** forking `zkoss/zk` + `zkoss/zkcml` master, replacing the built-in iceblue LESS theme with Marble's pure CSS, migrating the preview ZUL pages, and running the existing test suites.
**Execution plan:** `tasks/marble-to-zk-migration-plan.md` — this document stays authoritative for the *risk profile* and the CSS-conversion order; the plan extends the scope from "convert the CSS" to "make the `zkThemeTemplate` workspace unnecessary" (knowledge, skills, preview pages, harness) and holds D14–D17.
**Method:** measured directly against the working copies at `/Users/hawk/Documents/workspace/ZK10/zk` and `.../zkcml`. Every number below is counted, not estimated.

---

## 1. Repo topology (facts that constrain the branch plan)

| Fact | Evidence | Consequence |
|---|---|---|
| `zk` and `zkcml` are one composite Gradle build | `zk/settings.gradle`: `includeBuild new File(rootDir, "../zkcml")`; `build.gradle:49` `def zkcmlDir = "$rootDir/../zkcml"` | The two forks must stay **siblings on disk** and be **branched/merged in lockstep**. A PR in one repo alone never compiles. |
| `zktest` and `zksandbox` are directories inside `zk`, not submodules | no `.gitmodules` in `zk`; `git ls-files zksandbox` tracks them | Test + sandbox changes ride the same branch. Good. |
| LESS is compiled by Gradle `compileLess` → `zklessc` | `build.gradle:194-207` | The Maven `zklessc` execution in `zk-parent/pom.xml` points at `src/archive/web`, a path that no longer exists in `zk` — it is **dead for zk core** but **live for zkthemebuilder** (see §3.1). |
| `.css.dsp` output is **checked-in codegen** | `zul/codegen/resources/web/**/*.css.dsp`, wired via `processResources { from("$projectDir/codegen") }` | Swapping the CSS pipeline means swapping what writes into `codegen/`, not touching `processResources`. |
| Core's theme resources are **unprefixed** | `zk.wcs`: `~./zul/css/norm.css.dsp`; `StandardTheme.DEFAULT_NAME = "iceblue"` | Marble currently builds to `web/marble/**` and prefixes URLs. Into core it must build to `web/**` with **no** prefix and **no** `ThemeProvider` rewrite. |

**LESS to convert:** 67 files (`zk/zul`) + 85 (`zkcml/zkmax`) + 8 (`zkcml/zkex`) = **160 files**.
Marble already ships **131 CSS files** covering `zul` + `zkmax` + `zkex`.

---

## 2. What is already solved — don't re-litigate these

Measured, not assumed:

1. **Component coverage is essentially complete.** Diffing every component LESS basename in core/zkmax/zkex against Marble's CSS leaves only **6 gaps**: `codeeditor`, `scrollview`, `video` (zkmax), `skeleton`, `sliderbuttons` (zkex). (`combo` is a false positive — core's single `combo.less` maps to Marble's 7 files in `inp/css` that bundle into `combo.css.dsp`.)
2. **The DSP dependency is tiny.** Only **10** LESS files contain `e('…')` DSP directives, and they reduce to three features: the `browserDefault` `c:if` (Marble already solved this with the two-file `reset.css`/`reset-embed.css` swap), `c:encodeURL()` for font URLs (Marble still uses it — 2 lines in `_fonts.css`), and `e('round(…)')`, which is a pure LESS escape hatch that vanilla CSS needs not at all.
3. **`@layer` ordering already works through the DSP delivery model.** `norm.css.dsp` (loaded first via `zk.wcs`) establishes `zk-base` → `zk-components` → `zk-utilities`; per-package component dsp files carry `@layer zk-components{…}`. This is the shipping Marble arrangement, so it is proven under ZK's per-widget-package CSS loading.
4. **Core's LESS really is vestigial — for core.** `_zkvariables.less` declares 900 `@` variables, of which **894 are bare `var(--zk-*)` pass-throughs**. There is almost no LESS computation left to port in `zk/zul`.
5. **The palette layer is already pure CSS.** All 27 Theme Pack palettes are `:root { --zk-*: … }` blocks — `_material.less` literally reads "Just leave it blank." **722 lines total across all 27.** No LESS colour functions to reproduce.
6. **The test suite is far less style-coupled than its size suggests.** 2160 test classes, but geometry/style-coupled ones are a small minority: `moveToElement` 66 files, `getSize` 38, hard-coded `px"` 26, `getComputedStyle` 16 — ~130 files (~6%) plausibly affected.
7. **Dropping Font Awesome is a net win on jar size.** Core currently bundles 2.4 MB of icon fonts (`fa-*`, `ZK85Icons.*`); Marble's Inter is 132 KB. **Net −2.27 MB in zul.jar.**

---

## 3. Things to watch, ranked by "silently breaks something"

### 3.1 zkthemebuilder's submodule tracks zkThemeTemplate **master**, with `--remote` — HIGH, silent

`zkcml/.gitmodules` points `zkthemebuilder/template` at `zkoss/zkThemeTemplate`, and `zkthemebuilder/build.sh:57-62` does:

```sh
git submodule foreach --recursive git reset --hard
git submodule update --init --remote      # <- tracks the default branch
cp -R template/src/main/resources/web src/archive/
```

The submodule is currently pinned at `7e2f5b8f` (2026-01-30, still the LESS tree, 154 `.less` files). **The moment Marble lands on `zkThemeTemplate` master, the next `./build.sh -u` silently pulls a pure-CSS tree into a Maven+zklessc pipeline and all 27 Theme Pack artifacts break** — at an unrelated time, run by someone else, for a reason that looks nothing like the cause.

*Action before merging Marble to zkThemeTemplate master:* pin `zkthemebuilder/template` to a tag/commit of the last LESS master and drop `--remote` from `build.sh`, **or** move Marble to a `marble` branch and keep `master` on LESS until the pin is in place. (D10 no longer gates this — see §4.)

### 3.2 The 27 Theme Pack palettes speak a vocabulary Marble does not — HIGH, silent

The palettes reference **110 distinct `--zk-*` names**. Exactly **one** (`--zk-color-primary`) exists in Marble. The other 109 (`--zk-tabbox-tabs-background-color`, `--zk-mesh-title-background-color`, `--zk-menu-item-color`, `--zk-splitter-button-text-color`, …) are Iceblue-model tokens with no Marble counterpart.

CSS ignores unknown custom properties, so **all 27 palettes would compile, deploy, and simply do nothing** — a no-op that produces a working page in the wrong colours, not an error. Theme Pack now ships with EE, so this would reach paying customers — **which is why the palettes stay with Iceblue rather than being ported. D10 dismissed, §4.**

### 3.3 `--zk-*` is a documented public API and 98% of it disappears — HIGH, semi-silent

Across `zul` + `zkmax` + `zkex` LESS, **926** distinct `--zk-*` names are declared/consumed. Only **17** survive into Marble's 617-token vocabulary:

```
--zk-avatar-font-size --zk-avatar-size --zk-avatargroup-overlap --zk-cascader-border-color
--zk-chip-color --zk-color-primary --zk-input-border-color --zk-input-height
--zk-messagebox-icon-size --zk-popup-border-color --zk-rangeslider-button-size
--zk-rangeslider-dot-border-width --zk-rangeslider-dot-size --zk-rangeslider-inner-size
--zk-resp-cols --zk-searchbox-border-color --zk-signature-border-color
```

**909 tokens (98.2%) go dead** — but only for an app that selects Marble. Since Iceblue remains separately selectable and keeps its own vocabulary, this is a change of theme rather than a break of API. **D12 dismissed, §4.**

### 3.4 The icon API shrinks, and the misses are in real test pages — MEDIUM, visible

`font-awesome.css.dsp` builds to a **0-byte stub** under Marble; icons come from build-time Lucide masks (~1994 `z-icon-*` names + a 50-entry `FA_TO_LUCIDE` alias map).

Honest usage measurement (excluding `F100-ZK-5119-1/-2.zul`, which are FA catalogue pages enumerating 1866 + 788 names and would need retiring anyway): zktest pages use **149 distinct `z-icon-*`**, of which **50 do not resolve** under Marble. They fall into three groups:

- FA4 legacy outline suffixes: `-o` variants (`calendar-o`, `envelope-o`, `trash-o`, `square-o`, `circle-o`, `user-o`, …) — ~20
- FA aliases Lucide names differently: `close`/`times-circle-o`, `bars`/`navicon`, `gears`, `cutlery`, `money`, `sitemap`, `tasks`, `exchange`, `sort-alpha-asc/desc`, `search-plus/minus`, `floppy-o`, `pencil-square-o` — ~20
- **Not glyphs at all — FA's sizing/stacking API:** `z-icon-lg`, `-1x`, `-2x`, `-inverse`, `-stack-1x/2x/3x`, `-rotate-90`. Marble implements only `.z-icon-fw`. Dropping these removes a public class API, not just artwork.

**D11 dismissed (§4)** — Iceblue is the supported destination for FA-dependent apps; what remains is fixing the affected zktest pages.

### 3.5 zkmax/zkex LESS imports zul's LESS — MEDIUM, loud (compile error)

31 zkmax LESS files reach into core via `@import "~./zul/less/_header.less"` (which pulls `_zkvariables` + `colors/_@{themePalette}` + `_zkmixins`), and `compileLess` passes `-i zul/.../web/ -i $zkcmlDir/zkmax/.../web/`. Deleting core's LESS breaks zkmax/zkex compilation immediately.

This fails loudly, so it is low-risk — but it dictates sequencing: **convert `zul` + `zkmax` + `zkex` in one branch**, or keep the LESS tree alive as an untouched shim until all three are done. Do not try to land core-only.

### 3.6 Build-time density profiles vs Marble's runtime density — MEDIUM, design divergence

Core resolves density at **build time** via `@{themeProfile}` (`profiles/_default.less` / `_compact.less`, and 26 + 26 LESS files under `zkmax/less/tablet/{default,compact}`). Marble resolves it at **runtime** via `data-density="compact"`.

Marble's model is strictly better (one artifact, per-region override, no combinatorial builds), but it is not a drop-in: anything that currently ships a *separate compact artifact* has to become an attribute or a token override. The tablet CSS is the concrete instance — 52 LESS files behind `@{themeProfile}`, and per the earlier evaluation, **187 tablet declarations are still gated behind D5**.

### 3.7 Typography changes for every existing app — MEDIUM, visible and expected

Marble bundles Inter and sets it as the default family. Every existing ZK application's text metrics change on upgrade — line heights, label widths, column fitting, and therefore any test that asserts a width. Combined with 3.4, this is the bulk of the ~130 style-coupled tests. Expected and acceptable for a major version, but it is the reason the test-fixing pass is not zero-cost.

### 3.8 The regression gate is slow — LOW risk, HIGH schedule impact

`zktest` runs on `zk-webdriver:1.4.43.0.0` with **`forkEvery = 1`** (fresh JVM per test class) across **2160 test classes** driving a real browser, plus **5447 `.zul` pages**. A theme swap touches every component, so the full suite is the gate — and you will want to run it repeatedly, not once.

*Recommendation:* before starting the conversion, establish (a) a wall-clock baseline for the full suite on the unmodified fork, and (b) a fast subset — the ~130 style-coupled classes + the 81 `wcag` classes — as the inner loop. Also note the `wcag` suite is only weakly colour-coupled (81 classes, just 2 mention colour at all), so accessibility regressions will **not** be caught by it; Marble's own `forced-colors` and contrast checks remain the real gate there.

### 3.9 zksandbox pins an external theme jar — LOW, loud

`zksandbox/build.gradle:39` uses `org.zkoss.theme:iceblue_c:10.3.0.1-Eval` and `zk.xml` sets `<value>iceblue_c</value>`. `zktest/.../B110_ZK_6024Test` asserts the literal strings `~./iceblue_c/zul/css/norm.css.dsp` and `~./iceblue_c/zul/font/font-awesome.css.dsp`. These are cheap, obvious edits — listing them so they are not discovered late.

---

## 4. Decisions — all three closed 2026-09-08

**Ruling: D10, D11 and D12 are dismissed.** Marble and Iceblue are two *parallel* choices, not a migration path. In ZK 11.0 Marble becomes the default look-and-feel and Iceblue is split out as a separately selectable theme, whose job is to let existing systems upgrade unchanged. Marble therefore carries **no compatibility obligation** toward Iceblue's vocabulary, and the three issues below were all premised on it having one.

| Issue | Why it is no longer a decision |
|---|---|
| **D10** — 27 Theme Pack palettes | The palettes are written in Iceblue's token vocabulary, so they travel *with* Iceblue. Theme Pack rides on the split-out Iceblue theme; nothing needs rewriting against Marble tokens. |
| **D12** — 909-of-926 `--zk-*` "break" | Not a break. An app whose override sheet targets Iceblue token names keeps selecting Iceblue and keeps working. Marble simply publishes a different vocabulary. |
| **D11** — Font Awesome class API | An app that depends on `iconSclass="z-icon-*"` has a supported destination: stay on Iceblue. No FA compatibility layer is owed inside Marble. |

**What survives as plain work rather than as a decision** — both moved into §5:

- **zktest icon fallout.** `zktest`'s pages render under whatever theme the `zk` repo ships as default. Once that is Marble, the ~50 unresolved `z-icon-*` names in real test pages paint blank — including FA's `lg` / `2x` / `inverse` / `stack-*` sizing and stacking classes, which are API rather than artwork. This is a test-suite task now, not a product-compatibility question, and its scope is bounded by the test pages rather than by customer code.
- **The zkthemebuilder submodule landmine (§3.1) is independent of all three issues and still live.** `build.sh` runs `git submodule update --init --remote` against `zkThemeTemplate`'s *default branch*, then feeds that tree into a Maven + `zklessc` pipeline. It fires the next time anyone runs `./build.sh -u`, whoever owns the palettes — so pinning the submodule and dropping `--remote` stays a prerequisite to putting Marble on `zkThemeTemplate` master.

---

## 5. Suggested sequence (and why each step exists)

- [ ] **Pin `zkthemebuilder/template` and drop `--remote`** — *purpose: disarm §3.1 before anything else, because it is the one break that fires outside your branch.*
- [x] **Fork both repos, keep the `zk` / `zkcml` sibling layout, branch both with the same name** — *purpose: the composite build cannot compile otherwise (§1).* **Done:** `marble` exists in both `ZK10/zk` and `ZK10/zkcml`, each at the same commit as its own `master` (zero divergence) and each already pushed to the `hawkchen` fork.
- [ ] **Baseline the unmodified fork: full `zktest` wall-clock + green/red list** — *purpose: without a before-picture you cannot tell a Marble regression from a pre-existing flake, and §3.8 means you only get so many full runs.*
- [ ] **Carve the fast inner loop: the ~130 style-coupled classes + 81 `wcag` classes** — *purpose: make the iteration cycle minutes, not hours.*
- [ ] **Convert `zul` + `zkmax` + `zkex` in one commit range; keep the LESS tree in place until all three are green** — *purpose: §3.5 makes core-only conversion uncompilable.*
- [ ] **Reshape Marble's build to unprefixed `web/**` output and delete the `ThemeProvider` prefix rewrite** — *purpose: core theme resources have no theme-name segment (§1).*
- [ ] **Close the 6 component gaps: `codeeditor`, `scrollview`, `video`, `skeleton`, `sliderbuttons`** — *purpose: the only real coverage holes measured.*
- [ ] **Fix the zktest icon fallout: the ~50 unresolved `z-icon-*` names, the FA `lg`/`2x`/`inverse`/`stack-*` sizing-stacking classes, and `F100-ZK-5119-1/-2.zul`** — *purpose: these pages render under the repo default theme, so they break the moment that is Marble; the two catalogue pages enumerate all of FA and must become a Lucide catalogue or go. Scope is bounded by the test suite — D11 is dismissed, so no customer-facing FA layer is owed (§4).*
- [ ] **Port the tablet layer under Marble's runtime density model (D5's 187 declarations)** — *purpose: §3.6 — the last place a build-time profile variable survives.*
- [ ] **Update `zksandbox` theme dependency + `zk.xml`, and `B110_ZK_6024Test`'s literal dsp paths** — *purpose: §3.9, cheap but easy to discover late.*
- [ ] **Full-suite run + triage, then merge** — *purpose: the actual gate.*

---

## 6. Capacity note

Against the standing constraint — 2 engineers at roughly one year of experience, end-October target — this migration is not the whole of ZK 11.0's theme work; it sits on top of the 82 open Jess design-review issues, of which #76/#77/#79/#80/#81 are already the critical path. The measured good news (coverage nearly complete, DSP dependency tiny, palettes already CSS, only ~6% of tests style-coupled) makes the *conversion* smaller than feared. The three decisions that previously carried the open-ended cost — D10's 27 palettes, D11's icon API, D12's token aliases — were all **dismissed on 2026-09-08** by the parallel-themes ruling (§4), which removes the largest uncapped items from the estimate: no palette rewrite, no alias layer, no FA compatibility shim. What is left is bounded work — the 6 component gaps, the tablet density port, the zktest icon fallout, and the regression-triage cycle that §3.8 makes slow rather than uncertain.

---

## 7. Glossary

- **DSP (`.css.dsp`):** ZK serves theme CSS through a JSP-like template engine, so a stylesheet can contain server-side tags (`${c:encodeURL(…)}`, `<c:if>`). A pure-CSS file with no such tags passes through untouched — which is why Marble can be pure CSS and still ship `.css.dsp` filenames.
- **Palette / profile:** two LESS build variables in core. `@themePalette` picks a colour set (`iceblue`, `material`, …); `@themeProfile` picks a density (`default`, `compact`). One source tree × palette × profile is how 27 Theme Pack themes are generated today.
- **Composite build:** a Gradle arrangement where `zk` reaches into the sibling `../zkcml` directory and builds it as part of the same invocation, rather than consuming it as a published jar.
- **`forkEvery = 1`:** the test suite starts a brand-new Java process for every test class. It isolates failures well and is the reason a 2160-class browser suite is slow.
