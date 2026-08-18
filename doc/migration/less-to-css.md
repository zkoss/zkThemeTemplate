# Less → plain CSS (migration guide)

**Hand-written.** Its two generated neighbours ([`less-var-to-token.md`](less-var-to-token.md),
[`mixin-to-css.md`](mixin-to-css.md)) hold the mechanical tables; this file is the part that needs
judgement — what changed, what it costs you, and what to do about each piece.

In ZK 11 the `iceblue11` theme has **no Less**. The sources are plain `.css`, the build is one
Node script, and every value the theme exposes is a CSS custom property. There were 153 `.less`
files; there are now 0.

> **Upgrading to ZK 11 and dropping Less are two separate decisions.** If you customized this
> theme with Less and want to keep doing that, you can — see [Escape hatch](#escape-hatch). The
> theme's own sources being CSS does not force your fork's sources to be CSS.

## Contents

- [What actually changed for you](#what-actually-changed-for-you)
- [Renaming your variable overrides](#renaming-your-variable-overrides) — the table, plus the 20 rows added after it was generated
- [Three behavioural differences the rename does not cover](#three-behavioural-differences-the-rename-does-not-cover)
- [Mixins](#mixins)
- [Compact density: `@themeProfile` is gone](#compact-density-themeprofile-is-gone)
- [Palette: `@themePalette` is gone](#palette-themepalette-is-gone)
- [Vendor prefixes: what was removed](#vendor-prefixes-what-was-removed)
- [Known residuals — measured, deliberately not fixed](#known-residuals--measured-deliberately-not-fixed)
- [Escape hatch](#escape-hatch)
- [Fork toolkit](#fork-toolkit)

## What actually changed for you

| | before | now |
|---|---|---|
| theme sources | 153 `.less` | 85 `.css` entry files (+ 6 partials) |
| build runner | `zkless-engine` (`zklessc`), LESS compiler | `scripts/build-css.js` (Node + CleanCSS level 0) |
| how you customize | override a `@variable`, rebuild the jar | override a `--zk-*` custom property, no rebuild |
| how many ways to theme | two (Less variables **and** custom properties) | **one** |
| compact density | `@themeProfile` + a second jar (`iceblue_c`) | one library property, one jar |
| palette | `@themePalette` + `palettes/*.less` in the jar | a stylesheet you load after the theme |
| watch / live reload | `npm run zklessc-dev` | none — `npm run build:css` (see readme) |

**What did not change: the CSS the browser receives.** The conversion was verified declaration by
declaration against a reference build of the unconverted sources. The only intended differences are
the vendor-prefix removals below and the two density additions; everything else is byte-for-byte or
differs only in how the two minifiers serialize the same declarations.

## Renaming your variable overrides

If you customized this theme the way the old readme recommended — a file of `@name: value;`
overrides — your migration is mostly a rename:

```diff
- @colorPrimary: red;                  // in your _mytheme.less, imported from _header.less
+ :root { --zk-color-primary: red; }   // in a plain .css file, no build step needed
```

The full table is **[`less-var-to-token.md`](less-var-to-token.md)** (846 rows, 834 of them a clean
1:1 rename) with the same data as JSON in
[`less-var-to-token.json`](less-var-to-token.json) if you want to script the rename.

### The table is frozen, and why that is the right state

It was generated from the tree that still **had** Less — which is the tree you are migrating *from*,
not the one you are migrating *to*. Regenerating it against the converted tree would describe the
destination, and would lose the caveats below, because the evidence for them lived in `.less`
consumption sites that are now compiled away. So the file stays as generated; the generator stays
too, for forks that still have Less ([Fork toolkit](#fork-toolkit)).

Two consequences worth knowing:

- **Two rows describe files this theme no longer has**: `@iphone` and `@android`, from
  `zkmax/less/_zkvariables.less`. They were media-query strings, never referenced anywhere, and the
  table already marks them dead. Harmless.
- **Twenty rows were missing** until 2026-08-18; they are in the table now, and repeated
  below with their default values because the table does not carry values.

### The 20 severity rows, with their default values

ZK 10.4 added a severity palette to this theme on 2026-08-05, five days after the table was
generated, and nothing regenerated it — `check:var-table` was never a gate step. **The rows are
now in the table itself** (section *severity*), so this is no longer a gap; the list is kept here
because it carries the default value of each token, which the table does not.

All 20 are clean 1:1 renames. Values are the `iceblue11` defaults from
`zul/css/tokens/_default.css`, re-verified against it on 2026-08-18 — 20 of 20 still match.

| Less variable | custom property | default |
|---|---|---|
| `@severityInfoColor` | `--zk-severity-info-color` | `#1677ff` |
| `@severitySuccessColor` | `--zk-severity-success-color` | `#52c41a` |
| `@severityWarningColor` | `--zk-severity-warning-color` | `#faad14` |
| `@severityDangerColor` | `--zk-severity-danger-color` | `#ff4d4f` |
| `@severitySecondaryColor` | `--zk-severity-secondary-color` | `#8c8c8c` |
| `@severityInfoBg` | `--zk-severity-info-bg` | `#e6f4ff` |
| `@severitySuccessBg` | `--zk-severity-success-bg` | `#f6ffed` |
| `@severityWarningBg` | `--zk-severity-warning-bg` | `#fffbe6` |
| `@severityDangerBg` | `--zk-severity-danger-bg` | `#fff1f0` |
| `@severitySecondaryBg` | `--zk-severity-secondary-bg` | `#fafafa` |
| `@severityInfoBorder` | `--zk-severity-info-border` | `#91caff` |
| `@severitySuccessBorder` | `--zk-severity-success-border` | `#b7eb8f` |
| `@severityWarningBorder` | `--zk-severity-warning-border` | `#ffe58f` |
| `@severityDangerBorder` | `--zk-severity-danger-border` | `#ffa39e` |
| `@severitySecondaryBorder` | `--zk-severity-secondary-border` | `#d9d9d9` |
| `@severityInfoText` | `--zk-severity-info-text` | `#0958d9` |
| `@severitySuccessText` | `--zk-severity-success-text` | `#389e0d` |
| `@severityWarningText` | `--zk-severity-warning-text` | `#d48806` |
| `@severityDangerText` | `--zk-severity-danger-text` | `#cf1322` |
| `@severitySecondaryText` | `--zk-severity-secondary-text` | `#595959` |

Derived mechanically, not typed by hand. The table now holds **866** rows = 864 from the last
`zul/less/_zkvariables.less` + 2 from `zkmax`, and the 20 rows carry the reference counts the real
generator measured at the one commit where these declarations and their LESS consumers
(`badge.less`, `chip.less`, `confirmpopup.less`) both existed — counts that match the
`var(--zk-severity-*)` consumers in the shipped CSS exactly, per token.

## Three behavioural differences the rename does not cover

These are the rows where the rename *looks* clean and is not. All three existed before the
conversion — they are properties of Less itself, not of this change — but a customer following the
old readme could hit any of them, so they are worth reading once.

**CAVEAT-1 — overriding a Less variable was stronger, and not composable.**
Overriding `@colorPrimary` made the compiler substitute your literal value, so
`var(--zk-color-primary)` disappeared from the compiled output. Any later attempt to override the
property — yours or an application's — then had nothing to bind to and silently did nothing.
Overriding the property instead keeps the chain intact. This is the single biggest reason there is
now one theming API instead of two.

**CAVEAT-2 — a custom property inside a `data:` URI never resolves.**
`js/zul/wgt/css/selectbox.css` embeds an SVG as a data URI containing
`fill='var(--zk-icon-color)'` (URL-encoded). A data-URI document does not inherit the host page's
custom properties, so **overriding `--zk-icon-color` cannot change that arrow**, while overriding
the old `@iconColor` could (the compiler substituted before encoding). If you need to recolour it,
override the whole `background-image` declaration.

**CAVEAT-3 — one declaration is dead today, and overriding a variable used to revive it.**
`js/zkmax/big/css/biglistbox.css` (2 sites) contains
`background: contrast(var(--zk-base-background-color))`. CSS has no colour-producing `contrast()`
function, so the browser discards the declaration. Under Less, `contrast()` was a *compile-time*
function: with a literal `@baseBackgroundColor` (exactly what the old readme suggested) it evaluated
to `background: #000000` and the declaration became live. **So a customer who set that one variable
was getting a rule nobody else got.** Overriding the custom property can never reach it. If you
depended on that black background, set `background` explicitly.

## Mixins

The 30 Less mixins (across 38 definition lines) and what each expanded to:
**[`mixin-to-css.md`](mixin-to-css.md)**. Same freeze and same reason as the variable table.

Most of them do not need replacing — 11 were already dead, and the prefix fan-out mixins
(`.borderRadius()`, `.boxShadow()`, …) produced declarations that are no longer wanted at all; see
[Vendor prefixes](#vendor-prefixes-what-was-removed).

## Compact density: `@themeProfile` is gone

Set one library property; there is no second jar and no rebuild. Full guide:
**[`density.md`](density.md)**.

```xml
<library-property>
    <name>org.zkoss.zul.theme.density</name>
    <value>compact</value>
</library-property>
```

If you shipped `org.zkoss.theme.preferred=iceblue_c`, use `iceblue11` plus the property above.
`iceblue_c` is not published for ZK 11.

## Palette: `@themePalette` is gone

A palette was 23 shipped Less files, selected by a variable and compiled into the jar. Every one of
them is nothing but `:root { --zk-*: … }` overrides — measured: 623 declarations across 108 property
names, over ZK's 26 non-empty palettes. This theme already ships **862** overridable custom
properties, so a palette needs no build-time hook any more:

```html
<!-- load after the theme's stylesheet -->
<link rel="stylesheet" href="my-palette.css">
```
```css
/* my-palette.css — was palettes/montana.less */
:root {
    --zk-color-primary: …;
    --zk-base-background-color: …;
}
```

If you have a Theme Pack palette `.less`, its variable declarations map through the
[variable table](less-var-to-token.md) exactly like your own overrides do.

> **One residual you should know about if you are on a pre-ZK-11 build.** In the Less-era tree,
> `_zkcssvariables.less` was missing `@import "colors/_@{themePalette}_css";`, so a palette's
> *custom-property* half never got imported — silently, with no error. For `iceblue` that file was
> empty so nothing was lost, but any other palette lost its property overrides. It was not fixed,
> because the file it lives in no longer exists: setting `@themePalette` is not how you select a
> palette any more.

## Vendor prefixes: what was removed

The theme carried 945 prefixed declarations produced by Less mixins, plus 143 hand-written ones.
Policy chosen (deliberately conservative — this is an existing default theme, so raising the browser
floor would be a breaking change for existing applications):

| group | decision | count |
|---|---|---|
| `-moz-` / `-ms-` / `-o-` / `-khtml-` that had an unprefixed sibling in the same rule | **removed** | 731 declarations across 45 output files |
| orphans with no unprefixed sibling, where a modern browser still honours the prefix (`-moz-appearance`, `-moz-user-select`) | **renamed to the standard property** | 7 |
| orphans no modern browser honours (`-ms-zoom`, `-ms-touch-action`, `-ms-flex-align`, `-khtml-user-select`) | **removed** | 14 removed / 3 whole rules |
| **all `-webkit-`** | **kept, every one** | 341 |
| `-webkit-font-smoothing`, `-moz-osx-font-smoothing`, `-webkit-touch-callout`, `-webkit-tap-highlight-color`, `-webkit-user-drag`, `-webkit-user-modify` | **kept** — never standardized, removing them would delete behaviour | 44 |

Nothing in this changes rendering in any browser released in the last several years. **If you need
the old prefixes**, they are all in the reference build in git history, and re-adding a declaration
to a `.css` file is a one-line edit — which is the point of the sources being CSS.

## Known residuals — measured, deliberately not fixed

Everything here was found, counted, and consciously left alone so that this release changes only
what it must. None of it affects rendering.

| # | residual | count | why it was left |
|---|---|---|---|
| A1 | prefixed declarations in `zkmax/css/tablet.css.dsp` that the policy above would remove | 60 | While the tablet sheet was still Less, they were mixin output rather than source text; by the time it was CSS, the scope for this release was closed |
| A2 | one orphan `-moz-appearance` in the same file | 1 | same |
| A3 | a specificity tie between `.z-focus-a` (`norm`) and `.z-page *` (`tablet`) | 1 | Decided by stylesheet load order, not by source order, and it predates this work. **This is the only item here with no automated check watching it** |
| B1 | unprefixed `zoom: 1` (dead IE hasLayout hack) | 22 | The prefix census was property-shaped, so it never saw these |
| B2 | prefixes in the *value*: `display: -ms-flexbox` / `-webkit-box` / … | 13 | same |
| B3 | prefixed pseudo-selectors (`::-moz-placeholder`, `:-ms-input-placeholder`, `::-ms-check`, …) | ~79 | same |
| C1 | `js/zul/inp/css/combo.css` repeats declarations 6× where a native selector list would do (586 → 191) | 1 file | Source readability, not correctness — and it changes declaration counts |
| C2 | duplicate or contradictory declarations from mixin expansion, e.g. `tabbox.css` setting `float` twice on one selector | 14 sites | Pre-existing in the Less sources; deleting them changes declaration counts |
| S18 | four component stylesheets exist at two paths; only the newer path is ever requested (`js/zkmax/{layout/goldenlayout, med/cropper, wgt/signature, inp/tbeditor}`) | 4 dead outputs | Removing an output is a compatibility decision (an old `widget-package` or a hand-written `<?link?>` could still point at it) |
| — | `#footer() { .append-style() {} }`, a Less namespace hook | removed | It was empty and used nowhere in this theme. Plain CSS cannot express it. If your fork filled it, put those rules in your own `.css` file instead |

Counts for A/B/C were taken on the output side at the time each was found; re-grepping the sources
today gives slightly different numbers for B1–B3 because the census matched properties, not values.

## Escape hatch

**You do not have to drop Less.** To keep using it in your fork:

1. Restore the deleted partials from git history:
   ```bash
   # find the commit that deleted them
   git log --diff-filter=D --format='%H %s' -- 'src/main/resources/web/zul/less/*'
   # then restore the whole directory from its parent
   git checkout <that-commit>^ -- src/main/resources/web/zul/less
   ```
   The same works for the files earlier phases deleted: `zul/less/profiles/*.less`,
   `zul/less/colors/*.less`, `zul/less/_zkcssvariables.less` and the whole `zkmax/less/` tree.
2. Re-add the toolchain to `package.json`:
   ```json
   "devDependencies": { "zkless-engine": "^1.1.13" },
   "overrides": { "zkless-engine": { "less": "4.8.1" } }
   ```
   **Pin LESS to 4.x.** LESS 3.13.1, which `zkless-engine` depends on by default, silently
   miscompiles modern CSS values (relative colours containing `min()`, `grid-column: 1 / -1`) and
   still exits 0.
3. Re-add the Maven execution that runs it, in `process-resources`, before `compile-css`:
   ```xml
   <execution>
       <id>compile-less</id>
       <phase>process-resources</phase>
       <goals><goal>exec</goal></goals>
       <configuration>
           <executable>npx</executable>
           <arguments>
               <argument>zklessc</argument>
               <argument>--source</argument><argument>${zktheme.web.resources}</argument>
               <argument>--output</argument><argument>${zktheme.theme.outputDirectory}</argument>
               <argument>--compress</argument>
           </arguments>
       </configuration>
   </execution>
   ```
   Both compilers can coexist: they claim disjoint sources (`*.less` vs `*.css`) and write to the
   same output tree.

**Costs, so the decision is informed:** upstream changes now arrive as `.css`, so you can no longer
merge them into your `.less` files — you will be resolving those by hand. CAVEAT-1 keeps applying to
every variable you override. And `@themeProfile` / `@themePalette` no longer select anything, because
what they selected is not in the tree any more.

## Fork toolkit

The scripts that did this conversion are in the repository and are meant to be re-runnable on
**your** tree, so you can convert your own `.less` and prove the result equivalent instead of
trusting it:

| command | what it does |
|---|---|
| `node scripts/less2css.js <file.less>` | converts one entry file by adopting the compiler's own expanded output as the new source, then gates it |
| `node scripts/cssdiff.js <before-tree> <after-tree>` | compares two built trees declaration by declaration — this is the tool that made "no rendering change" a measurement rather than a claim |
| `node scripts/check-bytes.js` | byte-level comparison, with the closed list of serializer-only differences |
| `node scripts/check-less-conventions.js --source <tree>` | enforces the one non-standard rule in ZK's Less: `@import "~./…"` works in entry files only |
| `node scripts/gen-var-table.js --src <tree> --fork` | regenerates the variable table for *your* variable set (`--fork` reports drift from upstream instead of failing) |
| `node scripts/gen-mixin-table.js` | same for mixins (expects the stock path `src/main/resources/web/zul/less/_zkmixins.less`) |

`gen-var-table.js` and `gen-mixin-table.js` exit 2 in this repository, on purpose: their input is
gone. The message tells you so rather than reporting a green tick.
