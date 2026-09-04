# ZK 11 Theme Architecture: Evaluating the Retirement of LESS and DSP

**Status:** **Decided 2026-09-03 — Option 1 approved; D1–D6 all resolved as option A.**
**2026-09-04 — D7 resolved B** (`marble` is the 11.0 default). **D8 and D9 open.**
**Material correction (2026-09-04):** the converted IceBlue is an experimental artifact that has
**never been run against ZK's test suite**; the customer migration is a fork re-base that gates the
upgrade, not a 16-line patch; capacity is two engineers with one year of experience. **This reverses
§2.7's verdict** — see [§2.8](#28-the-corrected-picture-2026-09-04--unbounded-work-blocked-customers-two-junior-engineers).
Option 1 remains the right destination; **11.0 is no longer the right release to reach it in.**
**Date:** 2026-09-03
**Scope:** ZK 11 (major version, unreleased). Breaking change to how themes are authored.
**Author:** hawkchen

---

# L1 — Executive Summary

## The question

ZK themes are authored as LESS plus DSP. That combination is compiled by a bespoke tool,
`zkless-engine`, which was always meant to be temporary. Two directions were proposed for ZK 11:

- **Option 1 — Drop both.** Author themes in plain CSS.
- **Option 2 — Drop DSP only.** Keep LESS, compiled by a standard LESS processor, so
  `zkless-engine` no longer needs maintaining.

## Decision (2026-09-03)

**Option 1 approved.** All five decisions taken as option **A**: keep every documented token name
resolving (D1), port the template and palettes while confirming the three legacy themes retired
(D2), retain the DSP pipeline as a compatibility hatch (D3), deprecate `zkless-engine` while keeping
it working on LESS 4 (D4), and standardise on the runtime density attribute (D5).

**D6 — added and resolved in the same session:** `iceblue11` is committed as ZK 11's long-term
compatibility theme, not a transitional artifact. This is what makes D1's guarantee durable rather
than merely true on release day: the 862 documented token names live in `iceblue11`, so committing
to it commits to them.

D1 came with a clarification that proved correct and materially reduced its cost — see
[§ D1 as resolved](#issue-d1-resolved-a--keep-every-documented-token-name-resolving).

## Recommendation: Option 1 (as evaluated)

Three reasons, in order of weight.

**1. Option 2's stated rationale does not hold.** `zkless-engine` contains no DSP handling
whatsoever — the word appears once in the package, as a default output filename. All DSP tags in
LESS sources are wrapped in LESS's own `e('…')` escape, so a standard LESS processor passes them
through identically. Dropping DSP therefore does **not** free us from `zkless-engine`, and keeping
DSP does **not** require it. Its real jobs are resolving ZK's `~./` import prefix, naming output
files, and running a watch/live-reload server — about ten lines of logic plus a dev server. So
"use a standard LESS processor" is available today, independently of DSP, and Option 2 buys nothing
that is not already on the table.

**2. The two theming APIs currently cancel each other out, and only Option 1 fixes it.** ZK 10.3
introduced CSS custom properties as the documented customisation path, explicitly "without LESS
compilation". But when a customer overrides the corresponding LESS variable — exactly what the
theme-template readme tells them to do — the compiler substitutes their literal value and the
`var(--zk-…)` reference disappears from the output. Any later override, theirs or the
application's, then has nothing to bind to and **silently does nothing**. Both the public docs and
the migration notes record this. Option 1 collapses two mechanisms into one. Option 2 preserves the
trap indefinitely.

**3. Option 1 is not a proposal — it has already been executed and verified.** The `iceblue` theme
has been ported in full: 153 LESS files to zero, same 85 output stylesheets, checked declaration by
declaration against a reference build of the unconverted sources. It ships generated migration
tables (variable→token, mixin→CSS), a hand-written upgrade guide, and a documented escape hatch for
customers who want to keep using LESS in their own fork. Marble is a second, independent pure-CSS
theme at the same scale. Feasibility is settled; what remains is a policy decision.

## What the break actually costs existing enterprise users

Measured on real customer forks, by **git diff against the upstream template** — not by file count,
because a fork inherits every upstream file whether it touches it or not.

| Profile | What they do | Measured example | Option 1 cost | Option 2 cost |
|---|---|---|---|---|
| **A** | Override styles in their own application CSS or via `sclass` | — | **Zero** — *if `--zk-*` names are preserved* | Zero |
| **B** | Fork the template, override variables only | A Mitsubishi theme: **13 files, 60 added lines**, of which LESS is **4 files, 16 lines** | **Hours** — re-express those lines as custom properties; the target palette already ships in CSS form | Zero, but gains nothing |
| **C** | Fork and edit component-level LESS | A partner theme: **27 files, ~2,600 added lines** across 19 LESS files, including the shared reset | **Days–weeks**, or use the escape hatch and keep LESS in their own fork | Zero |

Two honest caveats on this table. First, only two forks on disk have a usable upstream reference, and
they land one in each of B and C — **the population split is genuinely unknown**, and it is the one
number that could still change the recommendation. Second, "LESS is vestigial" is true **only of ZK's
own default theme**, where 858 of 864 variables are pass-throughs to custom properties. Every
alternate theme and every customer fork measured has **zero** pass-throughs and uses LESS natively,
including colour functions and arithmetic. Profile C's LESS is real code.

## What makes the break far smaller than it looks

**Option 1 does not require removing DSP from ZK 11.** Both pure-CSS themes still emit `.css.dsp`
files through ZK's existing serving pipeline. Untouched: the file extension, the per-component
stylesheet registrations, the extendlets, the `ThemeProvider` contract. A customer's hand-written
`ext.css.dsp` keeps working. Option 1 means *"the official themes stop being written in LESS and
DSP"*, not *"the DSP engine is deleted"*. The escape hatch is free.

## The risk that outranks this whole question — and where it actually lives

Not LESS, and not DSP: **which theme an application ends up on.**

The syntax change is safe, and this is measured, not argued: `iceblue` built from LESS defines 862
`--zk-*` tokens; `iceblue11` built from the CSS port defines 868, having **kept all 862 and dropped
none**. Customers who override tokens are untouched by Option 1.

The exposure comes from the *other* change ZK 11 makes at the same time. `marble` is a new theme
with a new vocabulary, not a renamed `iceblue`: it defines 593 tokens, of which only **11** are
names `iceblue` also uses. Normalising the naming conventions between them recovers just 35 — 4% —
and 45 of `iceblue`'s 88 component prefixes have no counterpart at all. Since ZK 11 ships both
artifacts, that is fine by design: token-overriding customers stay on `iceblue11`, and adopting
`marble` is opting into a redesign.

What must not happen is an application landing on `marble` when it meant `iceblue`. That failure is
silent from both ends — theme election can fall through when `org.zkoss.theme.preferred` is not
pinned (already observed in this workspace), and a `version-uid` mismatch discards a theme's
configuration at *info* level while the application still returns HTTP 200, simply unthemed. So the
work here is a guard and a release note, not an alias layer. See D1 as resolved.

## Milestones

| Phase | Goal | Status |
|---|---|---|
| **P0** | Establish the evidence base (this document) | ✅ Complete |
| **P1** | Keep the documented token contract resolving | ✅ **Satisfied by `iceblue11`** — measured 862/862 preserved, 0 dropped; made durable by D6-A |
| **P5** | Keep `iceblue11` and `marble` at component parity for the life of ZK 11 | ⬜ New, created by D6-A |
| **P2** | Publish the variable→token migration tooling and guide | 🟡 Done for iceblue; needs generalising to any fork |
| **P3** | Port the template and palettes; confirm the three legacy themes retired | ⬜ Ready to start (D2-A) |
| **P4** | One density mechanism; deprecate `zkless-engine`; retain the DSP pipeline | ⬜ Ready to start (D3-A, D4-A, D5-A) |

**Overall: evaluation complete, decisions taken, one theme already fully ported. P3/P4 ready to start; P1 needs only a guard test, not an alias layer.**

---

# L2 — Analysis and Phase Breakdown

## 2.1 Why Option 2 collapses

The proposal was: *drop DSP, keep LESS, and `zkless-engine` is no longer needed because standard
`lessc` will do.*

`zkless-engine` is a published npm package — CLI `zklessc`, MIT licence, about 290 lines of
JavaScript wrapping `less.render()`. Its complete behaviour beyond stock `lessc`:

| Behaviour | DSP-related? |
|---|---|
| Rewrite ZK's `~./` prefix in `@import` so LESS can resolve it — the only feature its readme lists | No |
| Map the output path (`/less/` → `/css/`) and default the extension to `.css.dsp` | Filename only |
| Skip `_`-prefixed partials as entry points | No |
| Directory-tree batch compile, import-graph-aware watch, socket.io live-reload server | No |

Grepping the entire package for DSP awareness returns exactly one hit: the default extension string.
**No DSP parser, no tag masking, no placeholder round-trip.** DSP survives compilation only because
every occurrence in every LESS source is wrapped in LESS's `e('…')` or `~'…'` escape, which makes it
an opaque string literal to the parser. Standard `lessc` treats it identically.

Two consequences:

- Option 2 does not deliver its benefit. After dropping DSP you still need the `~./` rewrite, the
  output naming, and a watch loop.
- The benefit is already available. Replace those few lines with an npm script over stock `lessc`
  and `zkless-engine` can go, with DSP untouched.

So the real choice is **"pure CSS, or keep LESS"**. `zkless-engine`'s fate is a separate and smaller
decision (**D4**) — complicated only by the fact that it sits on ZK core's own build path, invoked
from both the Gradle and the Maven build, and is depended on by the Theme Pack builder, the customer
theme template, and the `zkthemes` repository.

## 2.2 What LESS still contributes

### In ZK's own default theme: almost nothing

| | Count |
|---|---|
| LESS variable declarations in the core variables file | **864** |
| …whose value is literally `var(--zk-…)` | **858** |
| …anything else | **6** — two configuration strings, four image paths |

Zero colour functions. Twenty-two arithmetic sites in the whole theme. The density profiles are
already `:root { --zk-…: … }` blocks written inside LESS files. Of thirty mixins in the shared mixin
file, twelve have no call sites at all — the CSS3/gradient shim era they were built for is over.
The declared theme taglib, present in every generated stylesheet, is **invoked zero times**.

### In every other theme: LESS is real code

This is where my earlier reading was too optimistic, and it matters for profile C.

| Corpus | LESS variables | `var(--zk-…)` pass-throughs | Colour-function calls |
|---|---|---|---|
| ZK core default theme | 864 | **858** | **0** |
| breeze / sapphire / silvertail | ~422 each | **0** | ~91 across the three |
| Customer and partner forks measured | 800–1,260 each | **0** | present in all |

Across all LESS sources there are ~6,600 mixin call sites, ~650 arithmetic sites, nesting up to ten
levels deep in one partner theme, and 45 inline-JavaScript expressions (a base64 encoder and SVG
gradient builders). The inline JavaScript is a LESS 2/3-only feature **removed in LESS 4** — so even
Option 2's "just move to a standard modern LESS" is not a drop-in for those sites, though they sit in
mixins that have no call sites and are probably deletable.

### The cost of keeping LESS is rising, and is already being paid

CSS is standardising functions whose names collide with LESS built-ins. ZK 10 already hits this and
already pays the escape tax — the theme cannot write CSS `round()` plainly, because LESS has its own
`round()` and would consume it. The workaround turns the value into an opaque string, so LESS can no
longer see inside it and the type-checking that was LESS's remaining argument disappears with it.
The escape hatch is used 44 times in the core theme; five of those exist purely to hide CSS `round()`.

There is also a live correctness exposure: `zkless-engine` depends on LESS 3, which silently
miscompiles some modern CSS values — relative colours containing `min()`, and `grid-column: 1 / -1`
— **while exiting 0**. The iceblue migration guide already prescribes pinning LESS 4 for anyone
staying on the LESS path. "It compiled" is not "the output is equivalent".

## 2.3 What DSP still contributes

Measured on the 85 stylesheets a theme actually ships:

| Construct | Count | Verdict |
|---|---|---|
| Taglib declarations | 249 | Inert prologue. Three per file, in 71 files that contain nothing else. |
| `browserDefault` library-property tests | ~107–117 | The **only** library property the shipped ZK 10 theme reads. |
| Theme/plain asset-URL helpers | 44 | Resolve `~./` to a real URL. |
| The theme taglib's 13 functions | **0 calls** | Declared in every file, used in none. |
| Everything else — locale, user agent, edition, session, scriptlets, deferred EL | **0** | Reachable from DSP; used by nothing. |

Only two DSP tags are used anywhere in the corpus: a conditional and a variable assignment.
Conditionals appear in just two files, and every one is the `browserDefault` switch.

So DSP's genuine request-time surface is: **one boolean, plus asset-URL resolution.** Browser
detection and edition gating happen in Java, not DSP. Locale is available and unused.

### The one construct pure CSS cannot express, and its replacement

`browserDefault` is hard because it appears in **selector position** — a conditional that emits a
`.z-page ` ancestor prefix, across roughly 350 selectors in the corpus, and elsewhere wraps whole
rule blocks so they can be omitted entirely. A custom property can change a value; it cannot change
a selector's match set, and it cannot delete a rule.

Both pure-CSS themes replace it in the right architectural layer: two static reset stylesheets — one
global, one scoped to the page root — with the `ThemeProvider` reading the same library property in
**Java** and choosing between them. A Java-layer setting resolved by Java-layer logic, instead of
compiling a Java setting into CSS text.

### But pure CSS did not eliminate DSP — it added one switch back

Reported faithfully, because it cuts against the recommendation: the iceblue port **introduced a new
DSP conditional** on a new `density` library property, taking the theme from 107 conditionals to 120.
The reason is structural: in the touch stylesheet, 187 of 895 declarations have no compact
counterpart, so a CSS override cannot reach the intended result — only server-side omission of whole
rules can. Marble instead does density with a runtime attribute selector and needs no DSP.

Two shipped pure-CSS themes have therefore answered the same question two different ways. That is
**decision D5**, and it is the one place where DSP's rule-deletion capability has no clean CSS
equivalent.

### The pipeline stays, which is what makes Option 1 cheap

Both pure-CSS themes emit `.css.dsp` files into ZK's existing pipeline. Unchanged by Option 1: the
extension, the per-component stylesheet registrations in the language definition files, the
extendlets, and the `ThemeProvider` contract. Rendering is recomputed per request (only the parsed
template is cached, keyed on path), so a retained DSP tag keeps working exactly as before, and a
customer's hand-written `ext.css.dsp` — one real customer app registers eight, four of which contain
no DSP syntax at all — needs no change.

Two residual dependencies on the asset-URL helpers, if they are ever baked into static paths:
folder-based themes resolve their root from a library property at request time, and the helper
supplies ZK's build-stamp cache-buster. Relative URLs cover the common case; these two do not.

## 2.4 Customer impact, measured by diff

A fork inherits every upstream file. Counting files in a fork measures inheritance, not work. The
number that matters is the diff against upstream.

**Profile B — a Mitsubishi theme.** Whole customisation: **13 files, 60 insertions, 30 deletions.**
LESS and DSP portion: **4 files, 16 insertions** — set two configuration values, add a nine-line
colour palette, add three lines of their own, wire one import. The other 249 LESS files in the
repository are untouched upstream copies. Their palette already ships in pure-CSS form in the Theme
Pack. Migration is re-expressing sixteen lines.

**Profile C — a partner theme.** Whole customisation: **27 files, ~2,594 insertions**, of which 19
LESS files and ~2,537 insertions, including substantial edits to the shared reset. This is a genuine
rewrite under Option 1 — or a candidate for the escape hatch.

**The escape hatch, and its honest cost.** The iceblue migration guide documents keeping LESS in
your own fork: restore the deleted partials from git history, re-add the toolchain with LESS pinned
to 4.x, re-add the build execution. Both compilers coexist because they claim disjoint sources. The
stated costs: upstream changes now arrive as CSS so they can no longer be merged into your LESS by
hand; the compile-time profile and palette selectors no longer select anything; and the
silent-override trap keeps applying to every variable you override.

**One customer pain that only Option 1 fixes.** Compact density is currently a *compile-time* choice
— a second jar, and one application cannot mix densities. Each of the 23 sold Theme Pack jars is the
same source recompiled with one palette file swapped; for one measured pair, 79 of 81 comparable
files are byte-identical and 97.5% of the jar is duplicate. Runtime custom properties remove that
duplication entirely.

## 2.5 Steelmanning Option 2, and why it still loses

The strongest honest case is ZK's own porting cost: three alternate themes at about 100 LESS files
and 13,300 lines each, plus a Theme Pack template at 154 files and 24,800 lines.

Four counters:

1. **The three themes are already end-of-life.** ZK's own release notes state there would be no
   further releases for Breeze, Sapphire, Silvertail and Atlantic from ZK 10.1.0 onward. They are
   not a ZK 11 obligation.
2. **They are near-identical clones** — 13,315 / 13,316 / 13,308 lines — differing by variables.
   Porting them is porting one, plus palettes; and 26 of the 27 palettes already exist as pure-CSS
   `:root` blocks, with one exception that injects a focus ring via a mixin.
3. **The Theme Pack template is a git submodule of the customer theme template.** Porting the
   template once ports the Theme Pack's whole build.
4. **Option 2 would leave ZK 11 shipping two toolchains** — pure-CSS Marble as the new default
   alongside LESS legacy themes. It does not reduce toolchain count; it entrenches a second one and
   guarantees this migration must be done again later.

There is also precedent for asking this of customers at a major version: ZK 7.0's upgrade notes
state plainly that upgrading a custom theme from an older version means redoing the style
customisation against the new theme.

## 2.6 Phase breakdown

### P1 — Freeze the `--zk-*` token contract  *(blocked on D1)*
- **Input:** the ~842 properties documented since ZK 10.3; the two pure-CSS themes' token sets.
- **Output:** a versioned token API document; a compatibility alias layer if D1 chooses it.
- **Acceptance gate:** every token documented in ZK 10.3+ either still resolves in ZK 11, or appears
  in a published rename table with a migration entry — and a check fails the build if one is dropped
  silently.

### P2 — Migration tooling and guide  *(largely done, needs generalising)*
- **Input:** the generated variable→token and mixin→CSS tables from the iceblue port.
- **Output:** the same tooling applied to any fork, not just iceblue; the three known behavioural
  differences carried into the public upgrade guide; the escape hatch documented publicly.
- **Acceptance gate:** the measured Mitsubishi fork converts and renders identically to its current
  build, within the established per-channel screenshot tolerance.

### P3 — Legacy themes and Theme Pack  *(blocked on D2)*
- **Input:** three end-of-life themes; 27 palettes (26 already CSS); the shared template submodule.
- **Output:** per D2 — ported, formally retired, or kept on a compatibility LESS build.
- **Acceptance gate:** each shipped theme has either a ZK 11 artifact or a published end-of-support
  statement; no ZK 11 artifact requires a LESS compiler to build.

### P4 — Density and toolchain retirement  *(blocked on D3, D4, D5)*
- **Output:** one density mechanism across both themes; official themes building with no
  `zkless-engine` dependency; the DSP pipeline retained and documented as a customer extension point.
- **Acceptance gate:** a clean build of the official theme set with `zkless-engine` uninstalled, and
  a customer-authored `ext.css.dsp` still served correctly.

---

## 2.7 The sequencing question — should the removal wait for 11.5?

A later proposal (2026-09-04) argued the opposite of everything above on *timing* rather than
substance: ZK 11.0 already carries two large changes — a new default theme (`marble`) and nine new
components — so hold IceBlue's LESS+DSP architecture still for 11.0, let existing customers take the
new components cheaply, and do the structural change in 11.5. Three reasons were given: minimise the
upgrade cost for existing customers, avoid the test-suite churn a default-theme change causes, and
protect the end-of-October release date.

The concerns are the right ones. The proposal attaches them to the wrong change.

### The premise does not hold: new components do not depend on this decision

The proposal assumes a customer needs architectural stability in IceBlue to pick up the new
components cheaply. Measured, they do not:

| Corpus | Component stylesheet outputs |
|---|---|
| `baseline/` — IceBlue built from LESS (pinned) | 85 |
| `iceblue11` — IceBlue built from pure CSS | 85 |
| Set difference, both directions | **empty** |

`avatar`, `avatargroup`, `badge`, `chip`, `breadcrumb` and the rest are already styled in the **LESS**
build. Coverage by component is identical across the LESS build, the CSS build and `marble` alike.

**But this answered the wrong question — corrected 2026-09-04.** Establishing that the new components
are *styled* under either sequencing says nothing about whether the customer can *reach* them. The
binding constraint is upgrade access, not stylesheet coverage: if converting their theme is what
blocks the upgrade, the customer never gets to ZK 11 at all, and the new components are unreachable
regardless of how well they are styled. §2.8 treats that mechanism.

### ~~Deferring does not save the work, because the work is finished~~ — RETRACTED 2026-09-04

**This subsection was wrong, and it was the load-bearing argument of §2.7.** It read the IceBlue
conversion's closure record as evidence that the work was *shippable*. It is not. Hawk's correction
(2026-09-04): the converted IceBlue **is an experimental product inside his own project and has not
been run against ZK's own test suite.**

What the closure record actually proves, restated honestly:

| Claim | Status |
|---|---|
| The LESS→CSS conversion changes no CSS declaration (85 outputs, gate #63) | **Holds** — it is a real, measured property of the conversion |
| The conversion is not an artefact of a shared compiler | **Holds** — the released jar is an independent witness, 78/81 byte-identical |
| Therefore the artifact is ready to ship in ZK 11.0 | **Does not follow** — never tested |

The zero-diff property is about **CSS output**. ZK's test suite covers considerably more than
rendered CSS: build and packaging integration, theme registration and `version-uid` wiring, the
`ThemeProvider` contract, DSP serving, Theme Pack's palette/profile mechanism. None of that is
exercised by a declaration-level diff, and none of it has been run.

There is corroborating evidence of divergence in the measurement itself: the repo builds **85**
outputs against the released jar's **81**, and 3 of the shared files differ. Those deltas are
upstream drift rather than conversion error — but they establish that this tree is a diverged fork,
not a drop-in replacement for ZK's theme sources.

**Consequence for the recommendation.** The remaining work is *unbounded* — an unknown quantity of
integration and test-passing effort, against a fixed date. That is a materially different risk
profile from "already finished", and it reverses this section's verdict. See §2.8.

### Both stated concerns trace to the other change

Neither concern is caused by the LESS removal:

| Concern | Caused by | Does deferring LESS removal help? |
|---|---|---|
| Front-end tests asserting IceBlue DOM/CSS break | flipping the **default theme** to `marble` | **No** — the proposal keeps `marble` as the default, so the churn is unchanged |
| October release date at risk | `marble`'s readiness as a *default* | **No** — the LESS work is already done and output-identical |

The test churn point is the clearest: a test that asserts on IceBlue's rendered DOM breaks when the
default theme changes, regardless of which language IceBlue was authored in. Since the CSS port
changed **zero declarations**, IceBlue-targeted tests pass across it unchanged.

### Where the release risk actually sits

`marble`'s designer review (`hawkchen/marble-issue`, 82 issues filed 2026-08-12) stands at
**82 open, 0 closed** as of 2026-09-04 — five fixed in the first week and awaiting the designer to
close, none in the two and a half weeks since. Against an end-of-October target that is roughly eight
weeks for a backlog that has not yet been triaged (77 of 82 untriaged).

The backlog is also not uniformly cosmetic. Functional-class reports include: borderlayout's collapsed
region cannot be restored (#58); anchornav does not scroll to its target (#44); fisheyebar renders
empty in vertical orient (#47); biglistbox frozen and scrollable panes stack vertically (#32) and its
`fixFrozenCols` toggle does nothing (#33); cascader commits a parent-only selection and leaves the
field blank (#9); daterangebox cannot save a time setting (#21); errorboxes block each other (#69);
window content goes transparent while dragged (#55). Some may triage to ZK-CORE rather than theme —
that is exactly the point, none of them have been triaged yet.

This is the item on the critical path. It is not addressed by anything in the LESS/DSP decision.

### The split that serves the stated goals

Defer the **default-theme flip**, not the LESS removal:

- **11.0** — `iceblue11` (pure CSS) remains the default. Existing apps render identically (zero-diff
  proven), so IceBlue-targeted front-end tests keep passing and the churn disappears rather than
  moving. A customer's only task is re-basing their fork's LESS variable overrides onto custom
  properties — Mitsubishi-scale, 4 files and 16 lines. `zkless-engine` dies at the major boundary as
  intended. `marble` ships opt-in via `org.zkoss.theme.preferred=marble`, fully documented.
- **11.5** — flip the default to `marble`, informed by a release cycle of real feedback and with the
  82 issues worked down.

This protects the date by removing the actual risk item, keeps the market test in 11.0, and leaves
existing customers with a genuinely small, well-scoped upgrade.

**The honest cost:** an opt-in theme is a weaker market signal than a default one — fewer people meet
it without being told to. That is the real trade. Set against it: shipping an unfinished flagship *as
the default* is not a neutral signal but a negative one, and it is the first impression that cannot be
retaken. If the market signal is judged to outrank this, the minimum precondition is triaging the 82
issues and burning down the functional-class ones, which is itself schedule work that has not been
costed.

---

## 2.8 The corrected picture (2026-09-04) — unbounded work, blocked customers, two junior engineers

Three facts arrived after §2.7 was written. Each weakens the case for removing LESS in 11.0; together
they reverse it.

### Fact 1 — the converted IceBlue is a prototype, not a release candidate

It has never been run against ZK's own test suite. Its verified property is declaration-level CSS
equivalence inside one experimental repository. Everything between that and a shipped artifact — build
and packaging integration, theme registration and `version-uid`, the `ThemeProvider` contract, DSP
serving, Theme Pack's palette and profile mechanism — is **unscoped**. Unscoped work against a fixed
date is the definition of schedule risk, and it is the risk §2.7 wrongly reported as retired.

A partial mitigation is real and worth stating: because the CSS output is unchanged, tests that assert
on *rendered* output should pass, so the exposure is concentrated in the build and integration layer
rather than spread across visual regression. That bounds the *shape* of the unknown. It does not bound
its *size*, and only running the suite would.

### Fact 2 — the customer migration is a fork re-base, and it gates the upgrade

§2.4 measured the Mitsubishi fork at 13 files / 60 lines against upstream and treated that as the
customer's cost. That figure is correct and the inference from it was wrong. It measures the
customer's **authored delta**, not their **migration**:

- their fork carries 249 inherited `.less` files; ZK 11 deletes all of them and substitutes `.css`;
- so upstream merging stops working — the fork must be re-established on a new tree, not merged;
- their variable overrides need hand conversion, through the three documented traps in
  `migration/less-to-css.md` (a substituted literal silently killing later overrides; a custom
  property dead inside a `data:` URI; `contrast()` with no CSS equivalent);
- and they must re-run their own visual QA across their whole application, because the substrate
  under every rule changed.

For an enterprise with change control, that is a project with a release cycle attached — not a patch.
And the consequence is the one that matters commercially: **it blocks their ZK 11 upgrade**, so they
do not get the nine new components either. A release whose headline is new components should not put
its own upgrade gate in front of the customers most likely to want them.

### Fact 3 — capacity is two engineers with one year of experience

Roughly 16 gross engineer-weeks remain to end of October, and materially fewer net. Set against the
work 11.0 currently carries under D7-B:

| Work item | Rough size |
|---|---|
| `marble` design backlog — 82 open, 77 untriaged, several functional-class | 8–16 engineer-weeks at 0.5–1 day per issue |
| Rebaseline ZK's front-end tests for the default-theme change | not estimated |
| Nine new components at default-theme quality | partly done |
| D5 — 187 declarations with no compact counterpart | not estimated |
| IceBlue pure-CSS test passing and customer migration support | **unbounded** |

The arithmetic decides this before any judgement is applied. **The `marble` backlog alone consumes
between half and all of the team's entire remaining capacity**, at an optimistic half-day per issue
and assuming none triage to ZK-CORE. Every other row is then drawn from capacity that does not exist.

This also disposes of the obvious counter-move — "spike ZK's test suite against the converted IceBlue
and find out". The spike is the right instrument in the abstract, but its result cannot change the
outcome here: even a green run would license work there is no capacity to absorb.

### Revised verdict

§2.7 concluded that deferring the LESS removal reverts finished work and resolves nothing. With Facts
1–3, that conclusion does not stand. Deferring now removes the only unbounded item on the critical
path, unblocks the upgrade for exactly the customers ZK 11 wants to reach, and returns the team's
whole capacity to the one thing D7-B made non-negotiable: `marble` being good enough to be the
default. Hawk's original proposal was right, and §2.7 rejected it on a premise that was not true.

Two things are worth preserving from the earlier analysis, because they survive the correction: the
break still belongs at a major boundary rather than in a minor release, and `zkless-engine` still
should not outlive ZK 11. Both are satisfied by deprecating in 11.0 and removing in 12.0, with the
migration guide published at 11.0 so customers get a full cycle of lead time and can convert on their
own schedule instead of ZK's.

---

# L3 — Decisions Taken, and Technical Appendix

## Decisions Taken (2026-09-03)

All five resolved as option **A**. D1's resolution changed shape during the discussion; the rest were
taken as evaluated.

### Issue D1 (resolved: A) — keep every documented token name resolving

**Decision:** A — every `--zk-*` name documented since ZK 10.3 keeps resolving in ZK 11.

**Clarification that came with it, and it was right:** the concern does not arise from the syntax
change. Converting the theme's sources from LESS to CSS preserves the names exactly, because they
were already CSS custom properties declared inside LESS files.

**Measured, and it confirms this outright:**

| | Tokens defined | vs the LESS build |
|---|---|---|
| `iceblue` built from LESS (shipped ZK 10) | 862 | — |
| `iceblue11` built from the CSS port | 868 | **862 kept, 0 dropped, 6 added** |

So D1 costs nothing for the LESS→CSS conversion. **No alias layer is needed for it.**

**Where the risk actually lives — and why this still needed deciding.** ZK 11 bundles two
independent changes, and only the first is free:

1. *LESS/DSP → pure CSS* — token names 100% preserved (measured above). No risk.
2. *A new default theme* — `marble` is not a renamed `iceblue`; it is a different vocabulary.

| | Count |
|---|---|
| Tokens `marble` defines | 593 |
| Names shared with `iceblue`'s 862 | **11** |
| `iceblue` names absent from `marble` | **851** |
| After normalising naming conventions (`-background-color`→`-bg`, `-text-color`→`-fg`, `-border-radius`→`-radius`) | 35 — so mechanical renaming recovers only **4%** |
| `iceblue` component prefixes with no `marble` counterpart at all | **45 of 88**, including the foundational state and base sets (`base`, `font`, `border`, `container`, `disabled`, `hover`, `active`, `error`, `invalid`, `loading`, `checked`, `drag`, `drop`) |

**How A is satisfied without building an 851-entry alias layer:** by the theme that already has
those names. `iceblue11` ships as its own ZK 11 artifact (`iceblue11:11.0.0-Eval`, theme name
`iceblue11`) alongside `marble`. A customer whose application overrides ZK 10 tokens stays on
`iceblue11` and gets all 862 preserved. A customer adopting `marble` is opting into a redesign with
a new vocabulary — which is what a new theme is, and is not a silent break provided it is never
presented as an in-place upgrade of `iceblue`.

**The residual risk is therefore operational, not lexical, and it has already been observed here:**
theme election can fall through to `marble` when an application meant to use `iceblue` does not pin
`org.zkoss.theme.preferred` — this workspace has already hit exactly that, with a preview app
silently served by `marble`. Combined with the `version-uid` behaviour (a mismatch discards the
theme's configuration at *info* level and the application returns HTTP 200 unthemed), an application
can end up on the wrong theme with no error anywhere.

**So P1's remaining work is a guard, not an alias layer:**
- a check that fails the build if `iceblue11` ever drops a name that ZK 10.3 documented;
- an explicit, documented theme-election outcome so an `iceblue`-themed application cannot silently
  land on `marble`;
- release notes stating plainly that `marble` is a new theme with a new token vocabulary, not a
  drop-in replacement.

### Issue D2 (resolved: A) — port the template and palettes; the three legacy themes stay retired
Breeze, Sapphire and Silvertail are confirmed unsupported — consistent with ZK's own statement that
there would be no further releases for them from ZK 10.1.0. **Scope:** port the shared template and
the 27 palettes to pure CSS (26 already are pure-CSS `:root{}` blocks; one WCAG palette injects a
focus ring via a mixin and needs a genuine port). No ZK 11 artifact for the three themes; restate
end-of-support. Since the Theme Pack template is a git submodule of the customer theme template,
porting the template once covers the Theme Pack build.

### Issue D3 (resolved: A) — retain the DSP pipeline and engine as a compatibility hatch
Official themes emit `.css.dsp` files containing no DSP tags beyond what D5 requires. The extension,
the per-component stylesheet registrations, the extendlets and the `ThemeProvider` contract stay
unchanged, so customer-authored `ext.css.dsp` keeps working. To document: the engine is supported
for customer extension and not used by official themes.

### Issue D4 (resolved: A) — deprecate `zkless-engine`, keep it working, move to LESS 4
Official builds stop using it — including **ZK core's own Gradle build**, where `compileLess` is
active and wired into `processResources` (only the Maven execution is dormant). Publish a final
release on LESS 4 plus a deprecation notice pointing at the pure-CSS path and the escape hatch.
**Watch item for the LESS 4 bump:** LESS 4 removes inline JavaScript, and there are 45 such
expressions in the mixin sources — all in mixins with no call sites, so most likely deletable, but
this must be verified rather than assumed.

### Issue D5 (resolved: A) — one density mechanism, the runtime attribute
Standardise on the runtime attribute selector; no DSP conditional in the official theme, and density
stays out of the HTTP cache key. **This decision has a prerequisite that is not yet costed:** the
touch stylesheet currently has 187 of 895 declarations with no compact counterpart, which is why the
other implementation reached for a server-side conditional — an override cannot reach a declaration
that has no counterpart. Quantifying and reworking those 187 declarations is the gating task for P4;
if it turns out intractable, D5 must be revisited rather than quietly shipped as option C.

### Issue D6 (resolved: A) — `iceblue11` is a committed long-term compatibility theme

**Decision:** A — `iceblue11` ships and is supported for the life of ZK 11, not deprecated as a
transitional artifact.

**Why it was needed:** D1-A's compatibility guarantee is not provided by an alias layer; it is
provided by the artifact that actually contains the 862 documented token names. Without a support
commitment, D1's break would only have been deferred, not avoided — and customers could not plan.

**What it buys.** Upgrading ZK and changing theme become two independent decisions. A customer can
move to ZK 11 while keeping `iceblue11` and every token override they already have, then adopt
`marble` later as a deliberate redesign. That is the difference between a managed migration and a
forced one, and it is the same separation the iceblue migration guide already applies to LESS.

**What it costs, stated plainly.** ZK 11 maintains two theme CSS sets. The conversion work itself is
done and verified, so the ongoing cost is not the port — it is **parity**: every new or changed ZK
component needs CSS in both themes, or `iceblue11` silently degrades as ZK 11 adds widgets. This is
the same failure mode as a dropped token — no error, just wrong rendering — so it needs the same
treatment: an automated coverage check, not a convention. Recorded as phase **P5**.

### Issue D7 (resolved: B, 2026-09-04) — `marble` is the ZK 11.0 default theme

Taken as evaluated: `marble` ships as the default, not as an opt-in. The strongest market signal, and
one disruption for customers instead of two. The cost the option carried remains real and now falls
due — triaging 82 issues, burning down the functional-class ones, and rebaselining ZK's front-end
tests — and it is what makes the capacity arithmetic in §2.8 binding. D8 and D9 both follow from it.

### Issue D8 (open, raised 2026-09-04) — does IceBlue ship pure-CSS in 11.0, or stay on LESS?

**Background.** With D7-B settled, this is the remaining architectural question for 11.0. §2.7 argued
the conversion was finished and deferring it would revert verified work; §2.8 retracts that on three
corrections — the converted IceBlue has never been run against ZK's test suite, the customer migration
is a fork re-base that gates the upgrade rather than a 16-line patch, and the team is two engineers
with one year of experience against a fixed end-of-October date.

**Impact and risk.** Shipping the conversion in 11.0 puts an unbounded work item on the critical path
and places an upgrade gate in front of the existing IceBlue customers who are the natural audience for
the nine new components. Deferring keeps `zkless-engine` alive for another cycle — the outcome the
whole evaluation set out to avoid — and postpones a break that properly belongs at a major boundary.

**Options.**

- **【Option A】Keep IceBlue on LESS+DSP in 11.0; deprecate now, remove in 12.0 (recommended).**
  Existing customers upgrade with no theme work and reach the new components immediately. The team's
  whole capacity goes to `marble`. Publish `migration/less-to-css.md` at 11.0 with a formal
  deprecation notice, so customers convert on their own schedule and arrive at 12.0 already migrated.
  **Cost:** `zkless-engine` survives one more cycle; new components need a `.less` file for IceBlue
  (cheap — 858 of 864 LESS variables are `var(--zk-*)` pass-throughs, so the file is CSS in all but
  extension); the break lands at 12.0 rather than 11.0.

- **【Option B】Ship the pure-CSS IceBlue in 11.0 as originally planned.**
  `zkless-engine` dies at the major boundary; one migration for customers instead of a deprecation
  window.
  **Cost:** an unbounded test-passing effort on the critical path, and an upgrade gate for existing
  customers. Not advisable at current capacity without first converting the unknown into a number.

- **【Option C】Timebox a spike against ZK's test suite, then decide.**
  Converts the unknown into an estimate before committing.
  **Cost:** the spike itself is drawn from capacity that §2.8 shows is already oversubscribed, and a
  green result would license work there is no room to absorb. Worth doing *after* D9 settles the date,
  not before.

### Issue D9 (open, raised 2026-09-04) — does the 11.0 scope fit the end-of-October date?

**Background.** This is not a theme-architecture question, but it is the one D7-B created and the one
§2.8 cannot resolve on ZK's behalf. At an optimistic half-day per issue, `marble`'s 82-issue backlog
consumes 8 engineer-weeks; at a day per issue it consumes all ~16 remaining gross engineer-weeks. The
front-end test rebaseline, the nine new components at default quality, and D5's 187 declarations are
all unestimated and all drawn from the same pool.

**Impact and risk.** Deferring IceBlue (D8-A) removes the unbounded item but does not by itself make
the remainder fit. Shipping `marble` as the default with the functional-class issues still open would
spend the flagship's first impression — the one thing a default theme cannot retake — on an unfinished
product.

**Options.**

- **【Option A】Triage the 82 issues first, then re-decide the date (recommended).**
  Triage is cheap relative to fixing, separates functional-class from cosmetic, and reclassifies the
  ZK-CORE ones out of the theme team's queue entirely. It is the only action that converts this
  decision from a guess into an estimate, and it is a prerequisite for every other option here.
  **Cost:** a few engineer-days before any fixing starts.

- **【Option B】Hold the date; cut scope to the functional-class issues only.**
  Ships on time with cosmetic issues openly deferred to 11.0.1.
  **Cost:** requires the triage in Option A to even identify the cut line; the flagship ships visibly
  unpolished.

- **【Option C】Hold the scope; move the date.**
  `marble` ships as the default only when the backlog justifies it.
  **Cost:** a slipped major release, with whatever commercial commitments attach to it.

## Outstanding Tasks & Next Steps

Ordered by what gates what. D5's prerequisite is the only item that could send a decision back.

- [ ] **Triage the 82 `marble` issues — functional-class vs cosmetic vs ZK-CORE** ──
      *Purpose: the one action that converts D9 from a guess into an estimate, and a prerequisite
      for every option under it.*
- [ ] **Resolve D8 — IceBlue on LESS in 11.0, or the pure-CSS conversion** ──
      *Purpose: the last architectural question for 11.0; it decides whether an unbounded item sits
      on the critical path.*
- [ ] **Resolve D9 — scope versus the end-of-October date** ──
      *Purpose: D8-A removes the unbounded item but does not by itself make the remainder fit.*
- [ ] **Triage the 82 open `marble` design issues and separate functional-class from cosmetic** ──
      *Purpose: Option B in D7 is uncosted until this exists; it is also the precondition for any
      default flip, in 11.0 or 11.5.*
- [ ] **Quantify and rework the 187 no-compact-counterpart declarations in the touch stylesheet** ──
      *Purpose: D5-A is only deliverable if this is tractable; it is the one accepted decision with
      an uncosted prerequisite.*
- [ ] **Add a token-drop guard for `iceblue11`** ── *Purpose: makes D1-A enforceable instead of
      merely true today — the build should fail if a name documented in ZK 10.3 disappears. D6-A
      makes this a standing obligation rather than a release-day check.*
- [ ] **Add a component-coverage parity check between `iceblue11` and `marble`** ── *Purpose: the
      standing cost D6-A creates; without it `iceblue11` degrades silently as ZK 11 adds widgets,
      which fails the same way a dropped token does — no error, wrong rendering.*
- [ ] **Make theme election explicit and documented** ── *Purpose: closes D1's real residual risk;
      an `iceblue`-themed application must not be able to land on `marble` silently, which has
      already happened in this workspace.*
- [ ] **Generalise the variable→token converter beyond iceblue and run it on the measured Mitsubishi
      fork** ── *Purpose: turns the "hours" estimate for variable-override customers into a measured
      fact before it is promised.*
- [ ] **Port the shared template and the 27 palettes; port the one WCAG palette by hand** ──
      *Purpose: P3, and it covers the Theme Pack build via the submodule.*
- [ ] **Publish the `zkless-engine` LESS 4 release and deprecation notice; verify the 45 inline-JS
      sites are removable** ── *Purpose: P4, and it removes a silent-miscompilation hazard from
      customers who stay on LESS.*
- [ ] **Write the public upgrade guide: escape hatch, the three behavioural differences, and a plain
      statement that `marble` is a new theme rather than an `iceblue` upgrade** ── *Purpose: the
      difference between a managed migration and a support incident.*
- [ ] **Establish the variable-override vs component-LESS split across the real customer base** ──
      *Purpose: no longer gates the decision, but sizes the migration support effort; on-disk
      evidence is two forks, one in each profile.*

## Glossary

- **DSP** — ZK's server-side template language for static resources. A `.css.dsp` file is a
  stylesheet that the server renders on each request, so it can read server settings and emit
  different CSS. Used here almost exclusively for one on/off setting.
- **LESS** — a CSS preprocessor: variables, mixins (reusable declaration blocks), nesting and
  arithmetic, compiled to CSS ahead of time.
- **CSS custom property** — a variable that lives in the CSS itself (`--zk-color-primary`) and is
  resolved by the browser, so it can be overridden after the fact without recompiling anything.
  This is what replaces most of what LESS variables were doing.
- **Pass-through variable** — a LESS variable whose entire value is a custom-property reference. It
  adds a name and nothing else, which is why 858 of them count as vestigial.
- **Profile / palette** — the theme's compile-time density setting and colour set. Both are selected
  by editing a LESS variable and rebuilding, which is why they disappear under Option 1.
- **`version-uid`** — a string duplicated in the theme jar's configuration files and its Java
  version class. On mismatch ZK discards the theme's whole configuration at info level: the
  application still returns HTTP 200 and is simply unthemed, with no error.

## Technical Appendix

<details>
<summary>A. Measurement basis and the corrections made during this evaluation</summary>

Measured 2026-09-03 against `ZK10/zk` at commit `3a8ea09cd4` (master, 2026-06-23), the shipped
artifacts in `zkThemeTemplate-iceblue/baseline/`, that repo's current build output, and four
customer/partner forks. Duplicate compiled trees (`bin/main/`, `build/resources/`, `target/`,
`node_modules/`) excluded throughout — 217 duplicate `.less` under `ZK10` alone.

**Corrections made mid-evaluation, and whether they changed the conclusion:**

| # | Initial reading | Corrected reading | Changed conclusion? |
|---|---|---|---|
| 1 | The Mitsubishi fork is ~3,600 lines of LESS with no component-level LESS | It contains **249 LESS files / 24,727 lines**, including 106 component-level files. The first figure came from a truncated `find` listing. | **No** — see #2 |
| 2 | (implied) fork size ≈ customisation size | Its **diff against upstream is 13 files / 60 insertions**, LESS portion 4 files / 16 lines. File count measures inheritance, not work. | **No** — reinforces the profile-B cost estimate, and supersedes #1 |
| 3 | LESS is vestigial across ZK themes | Vestigial **only** in ZK's default theme (858/864 pass-throughs). Alternate themes and every fork measured have **0** pass-throughs and use colour functions and arithmetic. | **Qualified** — profile C's cost is real; recommendation unchanged |
| 4 | Pure CSS eliminates DSP from the theme | The iceblue port **added** one DSP conditional (`density`), 107 → 120. | **Qualified** — raised as D5; recommendation unchanged |
| 5 | Option 1 is a proposal | It is **already executed and verified** on iceblue, with migration tables, an upgrade guide and an escape hatch shipped. | **Strengthened** |

**LESS pass-through ratio** — ZK core `zul/less/_zkvariables.less`:
```
total @var decls:        864
var(--zk-* pass-through: 858
other:                     6   (@themeProfile, @themePalette, 4 image paths)
```
Independent count over the same corpus reports 3,385 declarations including the 2,487-entry Font
Awesome codepoint table (a data table, not styling); excluding it gives 854/898 = 95.1%.

**Pass-throughs by corpus** (0% means LESS is used as a real preprocessor):
```
ZK core default theme    864 vars,  858 pass-through
breeze                   422 vars,    0
sapphire                 422 vars,    0
silvertail               421 vars,    0
Theme Pack palettes       39 vars,    0
Mitsubishi fork        1,260 vars,    0   (darken 5, lighten 9, contrast 4)
old public template    1,225 vars,    0
partner theme (mzk)      810 vars,    0
partner theme (lifas)    808 vars,    0
```

**LESS feature usage, all corpora:** 603 mixin definitions / 6,615 call sites (93 definitions with
zero call sites); ~6,832 string interpolations; 12,347 parent-selector references; 653 arithmetic
sites; 91 colour-function calls; 45 inline-JavaScript expressions; 988 `@import` (733 using `~./`),
graph depth 2, no import options; max nesting 5 in ZK core, 10 in a partner theme. `:extend` and
detached rulesets: **0 occurrences anywhere**.

**Modern CSS already in LESS sources:** `var(--…)` 3,787; `calc(` 200; `@supports` 16 (all a legacy
Edge hack); `:has(` 4. Zero `@layer`, `@container`, `@scope`, `@property`, `oklch(`, `color-mix(`,
`min(`/`max(`/`clamp(`, `:is(`/`:where(`, `light-dark(`, native nesting.

*Measurement trap:* naive substring greps report 186 `@container` and 72 `@property` — all false
positives from the LESS identifiers `@containerButtonColors` and a mixin parameter named `@property`.
Word-boundary counts are 0. Similarly, `grep -o 't:[a-zA-Z]*('` reports 359 theme-taglib calls, all
false positives from declarations ending in `t` (`height:var(…)`, `weight:var(…)`, `content:attr(…)`);
the true count is 0.

**DSP surface, shipped `baseline/` (85 files):**
```
107  c:property('org.zkoss.zul.theme.browserDefault')
 25  c:encodeThemeURL(
 19  c:encodeURL(
249  <%@ taglib
107  <c:if     — norm.css.dsp 93, zkmax/css/tablet.css.dsp 14; ALL browserDefault
  0  z:*(  and  t:*(  actual calls
```
Current build of the same theme: 120 `<c:if>` — the extra 13 are the new `density` switch.
Only 12 of 85 files contain any real DSP; 71 contain exactly three taglib directives and nothing
else; 2 are already pure CSS.

**Also reachable from DSP and used by nothing:** locale lookup and formatting (`c:l`, `c:l2`,
`c:getCurrentLocale`, `c:testCurrentLocale`), edition (`z:getEdition`, `z:isEditionValid` — used only
in an archived 8.5 builder), version/build, `c:choose`/`forEach`/`include`/`out`, all string
functions, and the entire 13-function theme taglib. Scriptlets (`<% %>`), expressions (`<%= %>`) and
deferred EL (`#{}`): 0 occurrences.

**Source surface:**
```
ZK core default theme          66 .less,  16,283 lines
breeze / sapphire / silvertail 100 .less each, 13,315 / 13,316 / 13,308 lines
Theme Pack template           154 .less,  24,799 lines
Theme Pack palettes            54 files = 27 legacy + 27 already-pure-CSS
iceblue, pre-migration        153 .less  → 85 .css.dsp
iceblue, post-migration       103 .css, 0 .less → same 85 .css.dsp
Marble                        131 .css, 0 .less, 0 image files
```
Stylesheets ZK actually requests from a theme: **79** from the three language definition files, plus
the icon-font bundle and the EE-only touch sheet = the 85 a full theme builds.
</details>

<details>
<summary>B. zkless-engine — full behaviour audit</summary>

`/Users/hawk/Documents/workspace/zkless-engine`, v1.1.13, MIT, `github.com/zkoss/zkless-engine`,
published to npm. 290 lines total (`src/index.js` 166, live-reload 39 + 36 in templates).

Complete custom logic over `less.render()`:
```js
// skip partials
if (path.basename(sourcePath)[0] === '_') { return Promise.resolve(); }

// output naming: /less/ -> /css/, .less -> .css.dsp
relativeSourcePath.replace('.less', extension)
                  .replace(/([\/\\\\])less([\/\\\\])/, '$1css$2')

// the ONLY source transform: ZK's ~./ import prefix
.then(lessInput => lessInput.replace(/(@import\s+['"])~\.\//g, '$1/'))
```
plus `chokidar` watch, an import-graph map for incremental rebuild, and a socket.io live-reload
server (default port 50000).

DSP awareness across `src/` and `bin/`:
```
$ grep -rn "dsp\|DSP\|<%\|taglib\|jsp" src bin
bin/zkless-cli.js:14:        'extension': '.css.dsp',
```
One hit — a default filename string. Dependency pin: `"less": "^3.13.1"`.

**Consumers:** ZK core (`zk/package.json` `^1.1.13`, invoked from `zk/build.gradle` `compileLess`
and from `zk-parent/pom.xml` via `frontend-maven-plugin` → `npx zklessc`); `zkcml/zkthemebuilder`
(`^1.1.13`, `exec-maven-plugin`); the customer theme template (`^1.1.9`); `ZK10/zkthemes` (`^1.1.8`).
A separate legacy artifact `org.zkoss.maven:zkless-engine-maven-plugin:1.0.0` is used by `mzk-theme`
and the archived 8.5 builder. `zkThemeTemplate-iceblue` has **removed** the dependency.

No Java LESS compiler exists anywhere in ZK — grepping all ZK Java main sources for
`lessc|LessCompil|zkless|\.less` yields two hits, both comments. All shipped `.css.dsp` in ZK core
are generated into a gitignored `codegen/` tree; none is hand-written.
</details>

<details>
<summary>C. The browserDefault selector-prefix case, and its replacement</summary>

Authored in LESS as a variable holding an escaped DSP fragment
(`zk/zul/src/main/resources/web/zul/less/_reset.less:7-8`):
```less
@browserDefault: "'org.zkoss.zul.theme.browserDefault'";
@browserDefaultPrefix: e('<c:if test="${not empty c:property(@{browserDefault})}">${".z-page "}</c:if>');
```
then interpolated ahead of each selector — `@{browserDefaultPrefix}h1 { … }` — 353 interpolation
sites across the corpus (91 in ZK core's own theme: `_reset.less` 56, `norm.less` 11, touch sheets
24). Compiled output places the tag literally where an ancestor selector would go:
```
<c:if test="${not empty c:property('org.zkoss.zul.theme.browserDefault')}">${".z-page "}</c:if>h1{font-size:2em;margin:.67em 0}
```
In the touch sheet it prefixes each member of a selector list independently.

Second form — a conditional wrapping whole rule blocks so they can be omitted entirely
(`_reset.less:16` opening, `:37` closing, around `html`/`body`/`main`); 15 occurrences across 10
files. Neither form is expressible with a custom property: the first changes a selector's match set
and specificity, the second controls a rule's existence.

Marble's replacement (`MarbleThemeProvider.getThemeURIs`), reading the same property in Java:
```java
private static final String BROWSER_DEFAULT = "org.zkoss.zul.theme.browserDefault";
private static final String RESET_GLOBAL = "~./zul/css/reset.css";
private static final String RESET_EMBED  = "~./zul/css/reset-embed.css";
…
final boolean embedSafe = Boolean.parseBoolean(Library.getProperty(BROWSER_DEFAULT, "false"));
```
`reset-embed.css` uses `@scope(.z-page)` instead of a textual prefix. See `doc/spec/reset-scoping.md`.
Pre-existing limitation carried over, not introduced: open floating widgets are relocated to
`document.body`, outside the page root, so `@scope` and the legacy textual prefix share that gap.
</details>

<details>
<summary>D. Serving path and caching granularity</summary>

`~./zul/css/zk.wcs` reaches `WcsExtendlet`, which synthesizes an execution — this is what gives DSP
expressions a live request and therefore access to library properties — then consults the
`ThemeProvider` (`beforeWCS` returning null aborts the sheet; `getWCSCacheControl` supplies the
lifetime, default 8760 hours). It concatenates, by server-side include and each URI first passed
through `beforeWidgetCSS` (which is what rewrites `~./` to `~./<theme>/`): the icon-font and global
bundles declared in `zk.wcs`, every per-component stylesheet from the language definition, then the
footer bundle. **All ~85 stylesheets are delivered inside one response**; they are never fetched
separately. The touch sheet is the exception — a `ThemeURIHandler` adds it as its own link.

Per-component stylesheets land on `DspExtendlet`, which caches the parsed template and re-executes it.

Three cache layers:

| Layer | Cached | Key |
|---|---|---|
| Template parse | the parsed template, **not** rendered bytes | **path only** (size 1024, lifetime 1h) |
| Render | **nothing** — re-executed every request | — |
| Browser | `Cache-Control`/`Expires`/`ETag`, default 8760h | URL |

**No per-browser, per-locale or per-session cache dimension exists anywhere in this path.** This is
why the density DSP switch needed density injected into the URL: two applications at different
densities were served different stylesheets under one cache stamp.
</details>

<details>
<summary>E. The three behavioural differences the variable→token rename does not cover</summary>

From the iceblue migration guide — all three pre-date the conversion and are properties of LESS
itself, but a customer following the old readme could hit any of them.

**The silent-override trap (the strongest argument for one API).** Overriding a LESS variable made
the compiler substitute the literal value, so `var(--zk-color-primary)` disappeared from the output.
Any later override — the customer's own, or the application's — then had nothing to bind to and
silently did nothing. The public docs state the same from the other side: "CSS variables will not
take effect if you override the corresponding LESS variables."

**A custom property inside a `data:` URI never resolves.** One component embeds an SVG data URI
containing `fill='var(--zk-icon-color)'`. A data-URI document does not inherit the host page's
custom properties, so overriding that token cannot recolour the glyph, whereas overriding the old
LESS variable could — the compiler substituted before encoding. Fix: override the whole
`background-image`.

**One declaration is dead today, and overriding a variable used to revive it.** A component contains
`background: contrast(var(--zk-base-background-color))`. CSS has no colour-producing `contrast()`,
so browsers discard the declaration. Under LESS, `contrast()` was a compile-time function: with a
literal value — exactly what the old readme suggested — it evaluated to a real colour and the rule
became live. A customer who set that one variable was getting a rule nobody else got.
</details>

<details>
<summary>F. Documented customisation paths, and what the docs already say</summary>

Doc corpus `/Users/hawk/Documents/workspace/DOC/zkdoc`: theming lives in
`zk_dev_ref/theming_and_styling/` (16 pages) and `zk_style_customization_guide/` (27 + 6 migration
guides). 79 pages mention "theme"; **only 4 mention `zkless`**; **1** mentions `browserDefault`.

`zk_style_customization_guide/css_variables.md` (since 10.3.0) already makes custom properties the
recommended path: *"hundreds of CSS custom properties … for easy theming and customization **without
LESS compilation**. Benefits over LESS: no compilation step required; can be changed at runtime via
JavaScript; easier to override in your CSS files."*

The theme-template readme already steers customers away from forking: *"with the introduction of CSS
Variables, you may not need to create a custom theme for simple customizations. If still adopting
this approach … you need to be aware that CSS variables will not take effect if you override the
corresponding LESS variables."*

Other documented paths, all LESS- and DSP-free: `<theme-uri>` in `<desktop-config>`; `<?link?>`
(generated after ZK's own CSS, so it overrides); `sclass`/`zclass`; the `ThemeProvider`,
`ThemeURIHandler`, `ThemeResolver` and `ThemeRegistry` Java extension points; theme switching by
cookie or `org.zkoss.theme.preferred`.

Precedent for breaking theme changes at a major version — `zk_dev_ref/upgrade_tips/version_upgrade.md`,
ZK 7.0 row: *"To upgrade a custom theme for an older version, you will need to redo the style
customization based on the new theme."* And on the legacy themes,
`_posts/2024-02-27-new-features-of-zk-1000.md`: Breeze/Sapphire/Silvertail/Atlantic were provided to
ease the 10.0 upgrade, and *"there will be no further releases for these unsupported themes starting
from ZK 10.1.0."*

The ZK Theme Builder itself is **undocumented** — the only hits are a version-bump line in the
build-from-source guide and two content-free redirect stubs.

**Library properties reaching CSS at request time, full sweep:** `org.zkoss.zul.theme.browserDefault`
(the one true CSS-shaping switch); `…theme.fontSizeM/MS/S/XS` and `…theme.fontFamilyT/C` (present
only in the three legacy themes' `ext.css.dsp`, **deprecated since 7.0.0** "because of using LESS",
and that sheet is referenced by no language definition — apps link it explicitly);
`org.zkoss.theme.preferred` and `org.zkoss.theme.folder.root` (select or relocate the sheet set);
`org.zkoss.theme.atlantic.useGoogleFont.disabled` (theme-local, Atlantic deprecated since 10.0.0);
`org.zkoss.zkmax.tablet.ui.disabled`. Plus one response-header side effect, `z:setCSSCacheControl()`,
which is structurally impossible in a static file and appears only in those legacy `ext.css.dsp`
sheets.

Browser detection is entirely Java (`ResponsiveThemeRegistry.isMobile()` →
`TabletThemeURIHandler.modifyThemeURIs`); edition gating is by jar presence plus registration. **No
DSP tag reads the user agent or the edition in ZK 10.**
</details>

<details>
<summary>G. Theme Pack economics, and the version contract</summary>

Palettes: 54 files = 27 palettes × two flavours. The CSS flavour is **already plain CSS in a `.less`
file** — 623 declarations across 26 `:root{}` blocks, 108 distinct property names, no other selector,
no `@media`, no colour functions except in comments. One palette is empty (the default). The LESS
flavour carries only 0–3 image-path variables, except one WCAG palette which uses a real mixin
override to inject a global focus ring — the single palette needing a genuine port.

The Theme Pack builder copies one palette in and rewrites two literals in the variables file; its
`template/` is a **git submodule of the public customer theme template**. So each of the 23 sold
theme jars is the same source recompiled with one palette swapped: for one measured pair, 79 of 81
comparable files are byte-identical and 97.5% of the 282.8 KB jar is duplicate.

**Version contract.** `ConfigParser` requires the `version-uid` in the theme's configuration to equal
the `UID` field of its version class. On mismatch it logs at **info** and discards the whole
configuration file — the application still returns HTTP 200 and is simply unthemed. The value lives
in at least three places (two configuration files plus the Java class), five counting the POM and the
version class itself; the iceblue repo ships `check:version` / `set:version` scripts to guard it.
The `zk-version` element is the only ZK-version gate and **neither theme repo declares it**. The docs
contain no hard "theme jar must match ZK version" statement — only pinned dependency snippets and
per-release migration guides that prescribe the bump.
</details>

<details>
<summary>H. Token-set measurement behind D1</summary>

Measured 2026-09-03. Definitions counted as `--zk-name:` declarations (i.e. tokens the theme
*defines*, not merely references), deduplicated.

```
iceblue, LESS build   (baseline/zul/css/norm.css.dsp)          862 defined
iceblue11, CSS port   (src/main/resources/web/**/*.css)        868 defined
  kept 862   dropped 0   added 6
marble                (src/main/resources/web/**/*.css)        593 defined
  shared with iceblue's 862:                                    11
  iceblue names absent from marble:                            851
  marble-only names:                                           582
```

Suffix-normalisation test — whether the gap is merely a naming-convention difference. Mapping
`-background-color`→`-bg`, `-text-color`→`-fg`, `-font-color`→`-fg`, `-border-radius`→`-radius`,
`-background`→`-bg`, `-foreground`→`-fg` raises the overlap from 11 to **35** (+24). Sample of the
newly matched pairs:
```
--zk-button-background-color                -> --zk-button-bg
--zk-input-background-color                 -> --zk-input-bg
--zk-input-border-radius                    -> --zk-input-radius
--zk-chosenbox-item-focus-background-color  -> --zk-chosenbox-item-focus-bg
--zk-pdfviewer-toolbar-border-radius        -> --zk-pdfviewer-toolbar-radius
```
So convention differences explain only 4% of the gap. The rest is a genuinely different vocabulary.

Component-prefix coverage (first path segment after `--zk-`): iceblue uses 88 prefixes; marble has
some token under 43 of them; **45 have none**. The missing set includes iceblue's foundational base
and state groups, not just unimplemented widgets:
```
active apply auxhead base border borderlayout caption checked colorpalette colorpicker combo
comboitem container disabled drag drop error font golden hover invalid linelayout listheader
loading loadingbar …
```
This is why an alias layer between the two themes would be a design mapping exercise rather than a
rename, and why D1-A is instead satisfied by shipping `iceblue11` as its own artifact.

Artifact identities confirming both ship: `iceblue11:11.0.0-Eval` (theme name `iceblue11`,
`Iceblue11ThemeWebAppInit`) and `marble:1.0.0`.
</details>

<details>
<summary>I. Change Log</summary>

| Date | Change |
|---|---|
| 2026-09-03 | **D6 raised and resolved (A):** `iceblue11` committed as ZK 11's long-term compatibility theme, which makes D1-A's guarantee durable and lets customers decouple the ZK upgrade from the theme change. Creates a standing parity obligation between the two themes (new phase P5). |
| 2026-09-03 | **Decisions taken: Option 1 approved, D1–D5 all option A.** D1 was accepted with the observation that a LESS→CSS conversion preserves token names — verified as exactly right (862 kept, 0 dropped), which removes the need for an alias layer and relocates D1's residual risk from token naming to theme election. D5 accepted with an uncosted prerequisite (187 declarations) recorded as the gating task. |
| 2026-09-03 | Initial evaluation. Premise correction: `zkless-engine` has no DSP handling, so Option 2's stated rationale does not hold. Recommendation: Option 1, with the DSP pipeline retained as a compatibility hatch. D1 identified as outranking the LESS/DSP question. Corrections 1–5 in Appendix A applied before publication; none reversed the recommendation, two qualified it (profile-C cost is real; the density switch is unresolved → D5), one strengthened it (the port is already done and verified). |

**Open verification gaps after the decisions:**
- **The 187 no-compact-counterpart declarations** — now the single gating unknown, because D5-A
  depends on it and no other accepted decision has an uncosted prerequisite.
- The variable-override vs component-LESS split across the real customer base — no longer gates
  anything, but sizes the migration support effort.
- Token coverage is **closed**: measured at 862/862 preserved for `iceblue11`, and 11/862 shared
  with `marble`, which is what relocated D1's risk to theme election.
</details>
