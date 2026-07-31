# zkless-engine: Tier 1 now, removal folded into the drop-LESS plan

> **Status:** approved 2026-07-30; Tier 1 (S0 + S1) in execution. Tier 2 deliberately deferred
> into `doc/iceblue-drop-less-execution-plan.md` phases P2/P8 — see "Decisions".
>
> **Language note:** the sibling docs on this branch
> (`doc/iceblue-drop-less-execution-plan.md`, `doc/iceblue-drop-less-progress.md`) are zh-TW.
> Edits made to *those* files in step D below must be written in zh-TW to match.

## Context

The starting question was: remove `zkless-engine`, but keep LESS — on the theory that dropping
its "special syntax" would be far cheaper than converting LESS→CSS.

**Investigation found the premise doesn't hold, in a useful way.** Reading all ~290 lines of
the tool (`node_modules/zkless-engine/src/index.js`, `bin/zkless-cli.js`,
`src/liveReload/liveReload.js`): it registers **zero** custom LESS functions, **zero** plugins,
visitors, pre-/post-processors, and injects **zero** variables. It calls `require('less')`
plainly (`src/index.js:6`) and `less.render(...)` (`src/index.js:32`).

Everything ZK-specific in the sources is **stock LESS `e()` escapes written in the theme
itself**, which plain `lessc` compiles identically:

| Construct | Sites | Actually comes from |
|---|---|---|
| `<%@ taglib %>` DSP header | 6 | `zul/less/_header.less:1-3` — `e('…')` |
| `${c:encodeURL/encodeThemeURL(…)}` | 25 | `zul/less/_zkmixins.less:9-20`, `font/_path.less` |
| `.encodeThemeURL(…)` call sites | 30 | ordinary LESS guarded mixins |
| `<c:if>` / `@{browserDefaultPrefix}` in **selector position** | 91 | `_reset.less:7-8` + 3 copies |
| `each()`, guards, `~"…"`, interpolated `@import` | 6 / 17 / 6 / 3 | core LESS 3+ |
| `@plugin`, `:extend`, live inline JS | **0 / 0 / 0** | — |

The engine's **only** non-stock-LESS behaviour is one regex (`src/index.js:31`) rewriting
`@import "~./x"` → `@import "/x"`. Everything else is build orchestration: walk the tree, skip
`_`-partials, remap `/less/`→`/css/`, rename `.less`→`.css.dsp`, watch + live-reload,
`--compress` (delegated to LESS's own compressor).

### Proof: stock `lessc` handles 100% of the syntax

Run against this tree with `./node_modules/.bin/lessc` (3.13.1), **bypassing zkless-engine
entirely**:

| Test | Result |
|---|---|
| `zul/less/_header.less` — `e()` emitting the DSP taglib | ✅ all three `<%@ taglib %>` directives emitted correctly |
| `zul/less/_reset.less` — **58** `<c:if …>${".z-page "}</c:if>` in **selector position** | ✅ compiles, no help needed |
| `js/zul/grid/less/grid.less` (309 lines) | ❌ aborts at **line 1** with a **`FileError`**, not a `ParseError` |
| same file, `~./` → `/` via a `sed` filter (no file edited) | ✅ compiles, and minified output is **byte-identical to `baseline/js/zul/grid/css/grid.css.dsp`** |

The failing case is the entire answer:

```
FileError: '~./zul/less/_header.less' wasn't found. Tried -
  …/js/zul/grid/less/~./zul/less/_header.less,
  …/src/main/resources/web/~./zul/less/_header.less,
  npm://~./zul/less/_header.less, ~./zul/less/_header.less
in …/js/zul/grid/less/grid.less on line 1, column 1:
1 @import "~./zul/less/_header.less";
```

`@import` is resolved at **parse time**, so LESS aborted on line 1 and never parsed lines
2–309. The `.encodeThemeURL` calls (lines 79, 295, 298, 301, 304) were never even reached —
they are not implicated in the failure. Every candidate path LESS tried contains a literal
`~./` directory: it is looking up a filename, not rejecting syntax.

**The sharp distinction — where `~./` appears decides whether it is a problem:**

| Position | Resolved by | Stock `lessc` |
|---|---|---|
| `@import "~./zul/less/_header.less"` (line 1) | **LESS, at build time** | ❌ must be translated |
| `.encodeThemeURL(background-image, '~./zul/img/grid/menu-group.png')` (line 295) | **ZK, at runtime** via `${c:encodeThemeURL(…)}` | ✅ passes through untouched — it is just a string |

Confirmed in the successful run's output:
`background-image: url(${c:encodeThemeURL("~./zul/img/grid/menu-group.png")})`.

So stock LESS **understands every construct in this theme** — the taglib escapes, the DSP EL,
`<c:if>` in selector position, the guarded mixins, `each()`. The only thing it cannot do is
resolve one *build-time path prefix*, because `~./` is **ZK's resource-root convention** (as in
`<script src="~./js/…">`), not a LESS feature.

So zkless-engine's entire syntax-level contribution is one string replace (`src/index.js:31`):

```js
lessInput.replace(/(@import\s+['"])~\.\//g, '$1/')
```

A `sed` does it — that is literally how the byte-identical result above was produced.

### So why was zkless-engine built at all?

The natural objection: *if the import path can simply be written differently in LESS, why build
a whole tool to rewrite it?* Answered from the tool's own documentation, because it decides
whether `~./` may be touched.

**zkless-engine's README documents `/`-rooted imports as the normal form:**

```less
@import "/zul/less/_header.less"; /*absolute import based on source directory (-s)*/
```

That is the engine's own worked example (`node_modules/zkless-engine/README.md`, "Include
external folders into build"). And this template's `readme.md` — the customer-facing one —
**never mentions `~./` at all** (0 occurrences; it teaches plain relative imports at `:70-77`).

So `~./` is not a convention the engine invented, nor one the template asks anyone to write.
It is **ZK's universal resource-root token** — the same `~./` used in ZUL (`<script src="~./js/…">`)
and in `c:encodeURL("~./zul/img/x.png")` — and it is in these `.less` files because **they came
from ZK core**. Of the 66 `.less` under `ZK10/zk/zul/src/main/resources/web`, **52 are still
byte-identical** to this theme's copies. The rewrite at `src/index.js:31` is a
**compatibility shim** that lets those files compile unedited.

### Origin, from ZK's git history

Reconstructed from the ZK repo (`/Users/hawk/Documents/workspace/ZK10/zk`, full history to 2006):

| Date | Event |
|---|---|
| 2007-10-25 | Hand-written `zul/css/norm.css.dsp` (864 lines). `~./` appears only inside `c:encodeURL()` **values** — **zero `@import`** in the whole file |
| 2013-05-15 | `dist/lib/ext/zkless.jar` — a **Java** LESS compiler — first appears (`3b9a43a39f`, "compile less script") |
| 2013-05-17 | First `.less` files (`9ceb0692ed`, "reimplement lessc for ZK EL function"). Imports are `@import "./web/zul/less/_import.less"`; `<%@ taglib %>` and `${t:borderRadius(…)}` are written **raw**, unescaped |
| **2013-05-20** | **`@import "~./"` is born** (`53589bc7a8`, "fine tune less compiler") — and `zkless.jar` grows 9543→9668 bytes in the same commit to support it |
| 2014-08-19 | `zkless-engine` first published to npm (the Node rewrite) |
| **2019-08-06** | **ZK-4358 "Use newer zkless-engine"** — raw DSP directives replaced by `e('<%@ taglib …')`, i.e. stock LESS escapes |
| 2020-05-04 | `zkless.jar` deleted (`0b6f1cd872`) |

The 2013-05-20 diff shows exactly why `~./` exists — and why it is entry-file-only:

```diff
--- zul/less/_import.less        (a PARTIAL)
-@import "font/_all.less";      // Font-Awesome 3.1.1
+++ zul/less/norm.less           (an ENTRY)
+@import "~./zul/less/font/_all.less";
```

A partial is imported from many directory depths, so its relative import broke when the line
moved. Root-relative was the fix, and `~./` was the spelling because ZK had already used it in
values since 2007. **The "entry files only" invariant dates from that commit and has never been
written down** — which is precisely what S1's guard fixes.

**Why nobody "just changed the paths" back then:** it would not have helped. Between 2013 and
2019 the `.less` sources contained raw `<%@ taglib %>` and `${…}` — stock `lessc` could not even
parse them. zkless was a genuine dialect and there was no alternative. ZK-4358 normalized that
in 2019, after which the syntax became 100% standard. **`@import "~./"` is simply the tail of
that cleanup that was never finished.**

The README's one-line *Features* section does advertise that shim ("convert ZK `@import` into a
LESS valid path"), so the author framed it as the headline. But the shim is not why a tool was
needed — the rest of the README is:

- `lessc` is strictly **1-file-in/1-file-out**; a theme needs a directory walk producing 77
  `.css.dsp`, skipping 76 `_`-partials, remapping the first `/less/` segment to `/css/`
- Maven / Gradle integration (the README ships the exact `exec-maven-plugin` block this
  `pom.xml` still uses)
- a ZK-aware **live-reload server** — 3 client scripts, one of which calls `zUtl.fireSized`
  so padding/margin edits re-layout without a page reload

First published **2014-08-19** (npm `time`), predating most of the modern bundler ecosystem.

**The criterion this hands us:** `~./` must stay exactly as long as these files are kept in
sync with ZK core. Nothing about LESS, and nothing about zkless-engine, forces it. That is why
S1 below enforces the convention rather than rewriting it.

So the special handling is real, but it splits cleanly: a **one-line compatibility shim** plus
**build orchestration**. Neither is LESS syntax. That is why a keep-LESS removal is a
**~200-line in-repo script replacing a ~290-line package** — close to a 1:1 swap. The value
decomposes, and most of it needs no removal:

| Want | Cheapest way | Needs removal? |
|---|---|---|
| Modern LESS — fix the 9 silent miscompiles | npm `overrides`, 3 lines | **No** |
| Enforce the undocumented `~./`-in-entry-files-only invariant | build assertion, 3 lines | **No** |
| No external tool in the build | write ~200 lines | Yes |

## Decisions

- **Do Tier 1 now** (S0 + S1, ~1 hour, gate-verified, **zero `.less` source changes**). It
  removes the real technical hazard (a 2020 compiler that miscompiles silently) and turns the
  engine's one non-stock convention from tribal knowledge into an enforced build rule.
- **Do not run Tier 2 as a separate project.** ZK 11 is dropping the engine anyway and
  LESS→CSS (P3+) is going ahead — the merged builder gets written at P2/P3 regardless, and the
  engine dies for free at P8. A standalone swap would be work done twice.
- **Theme Pack moves to CSS custom properties + modern CSS**, not compile-time
  `palettes/*.less`. This resolves the single largest product blocker in the existing plan.

---

## A. S0 — Pin LESS 4.8.1 via npm `overrides`

```json
"overrides": { "zkless-engine": { "less": "4.8.1" } }
```

`zkless-engine@1.1.13` pins `less@^3.13.1` (2020), currently resolved. That version **silently
miscompiles at exit 0**: `min()` inside `oklch(from …)` → fixed lightness, `grid-column: 1 / -1`
→ `-1`, `minmax(min(var(),100%),1fr)` → `minmax(100%,1fr)`, nested `@starting-style` loses its
selector. Today IceBlue uses none of those — but "new CSS 3 syntax" for Theme Pack means it
will, and the failure mode is a green build shipping wrong CSS.

No engine code change needed: `require('less')` is plain, and `less.lesscHelper.stylize`
(used at `src/index.js:138` for error formatting) still exists in LESS 4.

**Verify explicitly:** `compress: true` under LESS 4 — the option survives but is deprecated in
favour of a dedicated minifier. If output shifts, the fix is *not* to route these files through
CleanCSS: `scripts/build-css.js:60-64` measured that CleanCSS rewrites
`<c:if …>${".z-page "}</c:if>` to `<c:if …>${}".z-page "</c:if>` with **0 errors and 0
warnings**. Fall back to holding 3.13.1.

Gate: `npm run check:cssdiff` → `files differing: 0`.

## B. S1 — Enforce the `~./`-in-entry-files-only invariant

> **Revised.** An earlier draft of this step proposed rewriting all 93
> `@import "~./x"` → `@import "/x"` so the sources would compile with stock `lessc`. **That was
> wrong on both sides of the ledger** and is dropped — see "Why not normalize" below.

The engine rewrites `~./` **only in the entry file's buffer** (`compileFile` reads the entry,
regexes it, then hands it to `less.render`). Partials are read by LESS's own file manager and
never see the rewrite. So an `@import "~./…"` inside a `_partial.less` would not resolve the ZK
way.

Measured: `~./` imports appear in **74 entry files and exactly 0 partials**. The build works
because nobody has ever violated that rule — but it is **undocumented and unenforced**.

Add a guard to the build (and later to `build-css.js`'s `.less` branch): fail if any
`_`-prefixed `.less` contains `@import` with a `~./` target.

```
zkless convention: `~./` imports are rewritten in entry files only.
  <file>:<line> — move this import to an entry file, or make it relative.
```

Cost: ~3 lines. No source churn, no divergence from ZK core, and it converts a silent
resolution failure into a named build error.

### Why not normalize the 93 imports

Note first what the rewrite would *not* achieve: `/`-rooted is **zkless-engine's own documented
form**, so normalizing is not "removing engine syntax" — it is adopting the engine's house
style while walking away from ZK core's.

| | |
|---|---|
| **Claimed benefit** | sources compile with bare `lessc --include-path=…` |
| **Actual worth** | ~zero — nothing ever compiles them with bare `lessc`. There is always a builder (the engine now, `build-css.js` later), and supporting `~./` costs that builder **one line** |
| **Cost** | **34 files** that are currently byte-identical to ZK core would diverge, producing a conflict on every future sync |

Measured against `ZK10/zk/zul/src/main/resources/web`: 66 `.less` files, of which **52 are
byte-identical** to this theme's, 6 already differ, 8 are core-only. **34 of the 52 identical
ones carry a `~./` import.** Sync is already imperfect, but S1-as-drafted would have broken two
thirds of what is still aligned, to buy a capability nobody uses.

Revisit only if ZK core's LESS copies are confirmed dead (plausible once Marble is the ZK 11
default — ZK core does **not** compile them today; the `compile-less` execution in
`zk-parent/pom.xml` sits in dormant `<pluginManagement>`). Until then, `~./` stays.

**Net effect of A+B:** `zkless-engine` no longer chooses your compiler, and its one piece of
non-stock syntax is now explicitly documented and enforced rather than tribal knowledge. The
engine is reduced to a file walker plus a one-line rewrite — both trivially reproducible at P8.

---

## B2. Can the theme adopt `@layer` and other modern CSS today?

**Through LESS: yes, completely.** Measured through the real `zklessc --compress` pipeline on
LESS 4.8.1 — every construct emerges byte-correct:

`@layer a, b;` (bare order) · `@layer a { … }` (block) · nested `@layer` · `@layer` containing
`@media` · `@container` · `@scope` · `oklch(from red calc(l * .5) c h)` · `:has()` · `clamp()` ·
`container-type` · `aspect-ratio: 16 / 9`

Two caveats:

1. **`@layer` itself worked on LESS 3.13.1 too**, but the wider "new CSS 3 syntax" did not —
   `oklch(from red calc(l * 0.5) c h)` is a hard `ParseError` there. So S0 is what unlocks the
   Theme Pack direction, not `@layer` specifically.
2. **The real hazard is not LESS — it is CleanCSS**, the minifier on the `.css` path
   (`build-css.js`). Re-measured on 5.3.3, level 0:

| Construct | CleanCSS 5.3.3 level 0 |
|---|---|
| `@layer a, b;` alone | 💀 **output is EMPTY** — 0 errors, 1 warning |
| `@layer a, b;` followed by a rule | 💀 **the following rule's body is emptied** (`.x{}`) — silent declaration loss |
| `@layer a { … }` block | ✅ untouched |
| `@scope (.p){…}` alone | ⚠️ **loses its closing brace** → malformed CSS |
| `@scope` with rules before and after | ✅ untouched |
| `@container` | ✅ untouched |
| DSP tag in selector position | ⚠️ `${".z-page "}` → `${}".z-page "` — **0 errors AND 0 warnings** |

**This does not affect the theme today**: CleanCSS only runs on `.css` sources, of which there
are currently zero. `build-css.js:129` already hard-fails on all three dangerous shapes
(`@scope`, bare `@layer` order statement, DSP tags), so the day one is introduced the build
stops rather than shipping broken CSS.

**Conclusion: `@layer` can be used in `.less` sources right now, with no risk.** The exposure
arrives only when P3 converts files to `.css`, and the guard for it is already in place.

## C. What Tier 1 leaves for the existing plan

`doc/iceblue-drop-less-execution-plan.md` phase **P1** ("pin LESS to 4.8.1") is **satisfied by
S0** — mark it done, and note that the `overrides` entry becomes a plain
`"less": "4.8.1"` devDependency when P8 removes the engine.

Phase **P8**'s zkless-engine bullet stays small: `scripts/build-css.js` grows a `.less` branch —
`less.render({paths:[sourceDir], compress:true})`, the `~./`→`/` rewrite **applied to the entry
buffer only** (`src/index.js:31`), plus the engine's path mapping (`_`-prefix skip ·
`.less`→`.css.dsp` · **first** `/less/`→`/css/` segment only · no-`/less/` files stay in place,
i.e. `zul/font/font-awesome.less`).

Three landmines to record now for whoever writes that branch:

1. The `.less` path must **not** prepend `HEADER` (LESS emits it from `_header.less` in-source)
   and must **not** run the `HOSTILE_CONSTRUCTS` guards (`build-css.js:129`) — `norm.css.dsp`
   and `tablet.css.dsp` legitimately carry DSP tags in selector position and would hard-fail.
2. `scripts/baseline.js:39,44` shells out to `npx zklessc` and reads
   `zkless-engine/package.json`. At P8, pin it to `npx --yes zkless-engine@1.1.13` so the
   historical baseline stays reproducible without a dependency.
3. The `~./` rewrite must stay **entry-buffer-only**, matching the engine. Applying it to
   partials too would be strictly more permissive — it would not break today's 77 outputs, but
   it would silently legalize the pattern S1's guard exists to forbid, and the two mechanisms
   would then disagree. Keep the guard as the single source of truth.

## D. Doc updates the Theme Pack decision unblocks

"Theme Pack via CSS variables + modern CSS" resolves the plan's biggest open item. Record these
in `doc/iceblue-drop-less-execution-plan.md` §「已拍板」 (~line 799), **in zh-TW**:

| Item | Was | Now |
|---|---|---|
| **L-7** — 23 paid themes ship as `palettes/*.less`, "one release cycle" | the single product/release blocker on the whole conversion | **resolved by direction** — palettes become runtime `--zk-*` custom-property sheets, so there is no compile-time palette swap to preserve |
| **P7**, palette half — `@import "colors/_@{themePalette}"` (`_header.less:7`) | blocked | **unblocked** — the plan already proposed exactly this ("改成 runtime override sheet 即可", §P7). The decision confirms it. |
| **L-4** — compact-profile replacement, blocking P7's other half | blocked | **flag, don't assume.** `@themeProfile` is a different axis (density, not colour). Marble already ships the proven answer — `data-density="compact"` attribute + control-height ladder, `doc/spec/data-dense-mode.md`. Propose it; get it confirmed separately. |

Also worth recording: `readme.md:27` ("install zkless-engine") is **stale** — the engine is an
ordinary `devDependency`, so nobody installs it by hand. Fix the line during Tier 1 rather than
carrying a wrong prerequisite until P8.

---

## Verification

The P0 gate is unchanged and is exactly the mechanism for this class of change.

- `baseline/` = the 77 `.css.dsp` from **`zklessc --compress` on unconverted source** at commit
  `a89d44e` (`baseline/.built-from`). **Do not regenerate it** — `scripts/baseline.js` refuses
  to overwrite for this reason.
- `scripts/cssdiff.js` compares an **ordered** list of `context || property:value` records plus
  a separate ordered DSP-directive list. Mutation-tested: catches deleted declarations, changed
  values, reordering, removed prefix families; ignores pure formatting.
- **S0 and S1 are each one commit with its own gate run**, so a failure localizes to one
  variable. S0 must read `files differing: 0` over **77 files / 14323 declarations**; S1 cannot
  affect output at all (it adds a check, touches no source). There are no approved deltas in
  Tier 1 — any diff is a bug.
- **Negative-control the S1 guard** — the progress ledger's entry #10 set the precedent
  ("a gate that can't fail isn't a gate"). Temporarily add `@import "~./zul/less/_reset.less";`
  to a partial, confirm the build fails with the named error, then revert.
- Additionally assert the output file **count is 77**: a per-file comparison passes vacuously if
  a file stops being emitted.
- Smoke: `withjdk.sh 17 mvn clean package -Dmaven.test.skip=true`, then
  `withjdk.sh 17 mvn test exec:java@preview-app` and load a component page.

## Files touched (Tier 1)

| File | Change |
|---|---|
| `package.json`, `package-lock.json` | S0 — `overrides` entry |
| `scripts/check-less-conventions.js` (new, ~30 lines) + npm script | S1 — the entry-file-only guard; wire into `check:cssdiff` |
| `readme.md:27` | drop the stale "install zkless-engine" prerequisite |
| `doc/iceblue-drop-less-execution-plan.md` | D — record L-7 / P7 / P1 + the `~./` finding, zh-TW |

**No `.less` sources are modified.** That is the point of the S1 revision — Tier 1 touches zero
theme source, so the gate result is unambiguous and ZK core sync is untouched.

Per repo convention (`feedback_no_git_add_all`): stage only these paths, never `git add -A`;
verify with `git diff --cached --name-only`.

## Out of scope

Writing `scripts/build-theme.js`, porting watch + socket.io live-reload, and the pom/teardown
work. Those are P2/P8 of the existing plan and should be done there, once, not twice.

Also unchanged by any of this: the 91 `browserDefault` selector-position sites, 30 encode-mixin
calls, 148 `@import`, the Font Awesome `each()` loops. Those exist because **ZK's DSP layer**
requires them, not because of `zkless-engine`, and they are P5/P6's problem.
