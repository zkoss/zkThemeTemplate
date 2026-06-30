# CSS.DSP Parity — Marble vs IceBlue Compact (reference)

Comparison date: 2026-06-30. Reference product: `temp/iceblue_c-10.3.0.1`
(IceBlue Compact, ZK 10.3.0.1). Scope per request: **`*.css.dsp` only** — image
assets, non-dsp files, and `font-awesome.css.dsp` are out of scope.

## 1. File counts

| Set | Total `.css.dsp` | Excl. `font-awesome` |
|-----|------------------:|---------------------:|
| **IceBlue** (reference) | **77** | **76** |
| **Marble** (fresh `npm run build:css`) | **77** | **76** |
| Identical paths shared by both | 74 | — |

The two themes now have **identical totals** (77 / 76). They share **74** identical
dsp paths; the remainder is **3 Marble-extra** files vs **3 Marble-missing** files —
a clean 3-for-3, all explained below, all benign. (Marble was 78 before this review's
cleanup deleted the empty `js/zul/layout/css/layout.css` placeholder — see §5.)

## 2. The 3 files Marble emits that IceBlue does not

| Path | Why it exists | Verdict |
|------|---------------|---------|
| `js/zul/sel/css/select.css.dsp` | Real CSS. No `css-uri`, but `zk.wcs` serves its `.z-select` rule via package aggregation (probe-verified, `WCS_SERVED_ALLOWLIST`). IceBlue serves the same CSS via aggregation **without** a standalone dsp. | Functionally equivalent; structural-only diff |
| `js/zul/wgt/css/cell.css.dsp` | Same as select — `zk.wcs`-served `.z-cell`. | Functionally equivalent |
| `js/zul/wnd/css/bandpopup.css.dsp` | Same — `zk.wcs`-served `.z-bandpopup`. | Functionally equivalent |

**select / cell / bandpopup**: Marble's 1:1 auto-scan emits a standalone dsp *and*
`zk.wcs` serves the rule — belt-and-suspenders. IceBlue relies on aggregation only.
Both load the styling; only the on-disk file layout differs. Optional to align (would
require excluding the three from the auto-scan), not required for correctness.

## 3. The 3 files IceBlue ships that Marble does not — **legacy/dead paths**

IceBlue ships **two** dsp paths each for `tbeditor`, `cropper`, `signature`; Marble
ships **one** each. The path Marble ships is the one current ZK actually requests:

| Widget | ZK 10.x `<widget-package>` + `<css-uri>` | ZK requests | Marble ships | IceBlue extra (dead) |
|--------|------------------------------------------|-------------|:-----------:|----------------------|
| tbeditor | `zkmax.tbeditor` + `css/tbeditor.css.dsp` | `js/zkmax/tbeditor/css/tbeditor.css.dsp` | ✅ | `js/zkmax/inp/css/tbeditor.css.dsp` |
| cropper | `zkmax.cropper` + `css/cropper.css.dsp` | `js/zkmax/cropper/css/cropper.css.dsp` | ✅ | `js/zkmax/med/css/cropper.css.dsp` |
| signature | `zkmax.signature` + `css/signature.css.dsp` | `js/zkmax/signature/css/signature.css.dsp` | ✅ | `js/zkmax/wgt/css/signature.css.dsp` |

`css-uri` is **relative** and resolves against the widget's JS package directory
(verified in `zkcml/zkmax/.../lang-addon.xml` and the widget JS locations under
`js/zkmax/{tbeditor,cropper,signature}/`). IceBlue's `inp/med/wgt` copies are stale
paths from older ZK versions where these widgets lived in different packages. **Marble
is cleaner here — not a gap.**

## 4. Is the count / file list documented as a spec, or in the build JS?

**The count (a number) is documented nowhere, and is not asserted in `build-css.js`.**

- **`doc/spec/css-dsp-file-structure.md`** documents an intended file **list** (no
  numeric total). It is **stale** after the 2026-06-30 orphan sweep and was authored
  from the *source CSS tree*, not from IceBlue's emitted dsp set:
  - Lists 13 paths that **neither** Marble **nor** IceBlue ships as a standalone dsp:
    `div`, `space`, `span`, `html`, `layout` (zul.layout), `toolbarpanel`, `select`,
    `cell`, `image`, `imagemap`, `label`, `misc`, `bandpopup`.
    - `space`, `toolbarpanel` → **deleted** (dead CSS) by the orphan sweep.
    - `div`, `span`, `html`, `image`, `imagemap`, `label`, `misc` → **bundled into
      `norm.css.dsp`** (no standalone dsp by design).
    - `select`, `cell`, `bandpopup` → served via `zk.wcs` aggregation.
    - `layout` (zul.layout) → empty placeholder.
  - Omits the legacy zkmax duplicate paths IceBlue carries (§3).
- **`scripts/build-css.js`** has `assertNoOrphanComponentCss()` — but that guards a
  *different* invariant (no no-`css-uri` file silently orphaned). There is **no count
  check and no dsp manifest assertion**. Nothing fails the build if the emitted dsp set
  drifts from a target list.

## 5. Conclusion

Marble's `.css.dsp` output is **consistent with IceBlue** — identical totals (77 / 76),
74 shared paths. Every divergence is accounted for:

- **3 extra** = `zk.wcs`-served files (`select`/`cell`/`bandpopup`), functionally
  equivalent to IceBlue's aggregation.
- **3 missing** = legacy/dead duplicate package paths current ZK never requests; Marble
  ships the live path for each.

No correctness issue. Status of the follow-ups raised by this review:

1. ~~Delete the empty `js/zul/layout/css/layout.css` placeholder~~ — **DONE** (2026-06-30;
   it was dead residue of the 2026-05-29 columnlayout fix). Marble totals now equal IceBlue.
2. A **coverage checker now exists** — `scripts/check-css-dsp.js` (§7) verifies every css-uri
   ZK requests is shipped, which is the runtime-faithful form of the manifest assertion. The
   static `doc/spec/css-dsp-file-structure.md` list is still stale and could be regenerated
   from the build output if a checked-in manifest is wanted, but the checker supersedes it.

## 6. What decides each dsp's path (lang-addon vs Java)

The path ZK *requests* a `.css.dsp` from is **not** decided by the theme's application
Java. It is decided in three layers (verified against ZK 10.x source):

### Layer 1 — the canonical (theme-agnostic) path

- **Per-component / per-language CSS → `lang.xml` / `lang-addon.xml` `<css-uri>`.**
  The value is **relative** (e.g. `<css-uri>css/tbeditor.css.dsp</css-uri>`) and ZK
  resolves it against the widget's **JS package directory**, which is *also* declared
  in lang (`<widget-package>zkmax.tbeditor</widget-package>` → `~./js/zkmax/tbeditor/`).
  Full path = `~./js/` + package + `/` + css-uri =
  `~./js/zkmax/tbeditor/css/tbeditor.css.dsp`. **→ This is what §3 hinges on:** the live
  path follows `<widget-package>`, so IceBlue's `inp/med/wgt` copies are dead legacy paths.
- **Global bundles → ZK core convention, not lang-addon:**
  - `norm.css.dsp` + `font-awesome.css.dsp` are declared as `<stylesheet href="…">` in
    the `zk.wcs` file (`zk/zul/…/web/zul/css/zk.wcs`).
  - `footer.css.dsp` is **hard-coded in Java** — `WcsExtendlet.java:141`
    (`"~./zul/css/footer.css.dsp"`).
  - `WcsExtendlet.service()` assembles the single `zk.wcs` response as:
    norm (from `zk.wcs`) → every language-level `langdef.getCSSURIs()` → footer.
    *This package aggregation is why `select`/`cell`/`bandpopup` (language-level
    css-uris) load without a standalone dsp in IceBlue — see §2.*

### Layer 2 — theme injection (the `marble/` prefix) → theme Java `ThemeProvider`

The canonical path has no theme name (`~./js/zul/…`). `MarbleThemeProvider.beforeWidgetCSS()`
intercepts every `~./zul/`, `~./js/zul/`, `~./js/zkmax/`, `~./js/zkex/` URI and calls
`ServletFns.resolveThemeURL()`, which for a JAR-origin theme rewrites
`~./` → `~./marble/` (`ServletFns.java:110`). **This — not lang-addon — is what makes
ZK serve Marble's copy instead of stock ZK CSS.** (It also returns `null` for
`font-awesome.css.dsp` to skip it entirely.)

### Layer 3 — where the physical file is written → `build-css.js`

`build-css.js` writes each dsp to `target/classes/web/marble/<same-relative-path-as-source>`.
It **mirrors** the source tree under `src/main/resources/web/`; it does not invent paths.
The author must lay the source dir out to match the Layer-1 path ZK will request.

### One-line answer

Component dsp paths are decided by **lang-addon/lang.xml** (`<css-uri>` + `<widget-package>`);
the few global-bundle paths by **ZK core** (`zk.wcs` XML + a hard-coded literal in
`WcsExtendlet`); the theme's own Java only **rewrites the `~./` prefix to `~./marble/`**.
The build script merely places the file at the matching path.

## 7. Coverage checker — `scripts/check-css-dsp.js`

A runtime-faithful safety check built from the §6 facts. Run with `npm run check:css-dsp`
(or `node scripts/check-css-dsp.js`). It:

1. Reads the ZK lang files (`ZK_HOME`, default `/Users/hawk/Documents/workspace/ZK10`) as
   the source of truth for every `<css-uri>` ZK can request.
2. Resolves each to a full path (relative → `js/<widget-package-as-path>/<css-uri>`;
   absolute `~./…` as-is), adds the global bundles (`norm`, `footer`), excludes
   `font-awesome` (skipped by the theme provider).
3. Asserts each path exists under `target/classes/web/marble/`.

Exit codes: **0** all present · **1** missing file (component would render unstyled) ·
**2** cannot run (ZK lang files not found — set `ZK_HOME`). It is the inverse of
build-css.js's `assertNoOrphanComponentCss()`: that guards *no-css-uri files emitted as
orphans*; this guards *css-uri files ZK requests but the theme doesn't ship*.

**First run surfaced `js/zkmax/db/css/daterangebox.css.dsp`.** The zkmax `Daterangebox`
registers an absolute css-uri (stock ZK styles it via `db/less/daterangebox.less`), but it is
a **new component slated for ZK 11.0** — out of scope for Marble's current 10.2.1 target
(hence its absence from the iceblue_c-10.3.0.1 reference). Per decision, it is **not stubbed**;
`build-css.js` is unchanged. The checker carries it in a small `FORWARD_VERSION_SKIP` list so
it is **reported but not failed** — to be styled when the theme moves to ZK 11.x. Check is
green: **71 required, 64 real + 7 stub, 0 missing, 1 forward-skip.**

The 5 "extra" built files the checker lists are informational, all expected: `tablet.css.dsp`
(TabletThemeURIHandler-injected, not via css-uri), `select`/`cell`/`bandpopup` (zk.wcs-
aggregated, §2), `goldenlayout` (dual package path).
