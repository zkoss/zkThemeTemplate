# Marble → zk Migration — Technical Appendix

**Companion to** [marble-to-zk-migration-plan.md](marble-to-zk-migration-plan.md). That document
carries the plan of record: the goal, the five phases, what still needs a ruling, and who owns each
piece of work. **This document carries everything micro** — file references, line numbers, commit
hashes, raw measurements, the closed decisions and the change history.

**The division is deliberate.** The plan is what you read to do the work, and it stays short enough
to read. The appendix is what you read to *verify* a claim in it, and it grows without bound. If
the plan and this document disagree, this one holds the evidence and the plan holds the
conclusion — **fix the conclusion, do not annotate it.**

**Last revised:** 2026-09-09


Everything micro lives here: file references, line numbers, commit hashes, raw measurements and the
change history. §1 and §2 carry conclusions only.

## A.1 Measured inventory — what exists here (2026-09-09)

| Asset | Count | Size | Disposition |
|---|---|---|---|
| Theme CSS sources | **132** | 1.2 MB | **COPY** → P1 authors them in `zk`; template master receives the generated snapshot per release (D18) |
| CSS build + check scripts | 16 | — | **COPY** (subset) → the template needs a standalone build a customer can run |
| Java integration classes | 5 | — | **TWO VARIANTS** → P1 authors core-registration in `zk`; the jar-registration variant here **stays** as the template's |
| Preview / use-case pages | **159** | 9.2 MB | **COPY** → P2 builds a javax preview module in `zk`; this repo's jakarta Spring Boot app remains the template's |
| Playwright specs | 13 + config | — | MOVE → P2 (maintainer harness, not a customer deliverable) |
| Screenshot baselines (compared) | **199** PNG | ~11 MB | MOVE → P2, as the migration oracle (D16) |
| Forced-colors review artifacts | **100** PNG | ~6 MB | DROP — always dirty, never compared, regenerate on demand |
| `doc/spec/` (normative) | **26** | — | MOVE → P3 |
| `doc/contracts/` contracts | **94** `.md` | — | MOVE → P3 |
| `doc/contracts/` mockups | **19** `.html` | — | MOVE → P3 |
| `doc/` total tracked | 488 (486 tracked) | — | TRIAGE → P0, done |
| `tasks/` working notes | **2** (was 91) | — | ARCHIVE executed; D20 resolved |
| Memory files | **66** (+ index) | 308 KB | MERGE-INTO-SKILL → P3 |
| Subagents | 5 (1 821 lines) | — | MOVE → P3 |
| Skills | 7 | ~2 MB | see §A.7 |

## A.2 Unified counts, and what earlier revisions were measuring

plan-spec requires one vocabulary per quantity. Earlier revisions of this document used several
figures for the same asset because different commands were measuring different sets. Measured
2026-09-09:

| Quantity | **Canonical figure** | Earlier figures, and what they actually counted |
|---|---|---|
| **Theme CSS sources** (P1 scope) | **132** | `133` counted every tracked `.css` in the repository, which includes one preview-page stylesheet (`src/test/resources/web/usecase/usecase.css`) — a **P2** asset, not a theme source. Breakdown: `js/zul` 62 + `zul/css` 25 + `js/zkmax` 27 + `zkmax/css/tablet` 13 + `js/zkex` 5 = 132. |
| **Component contracts** | **94** `.md` | `114` and `131` both predate the split of contracts from their mockups. `doc/contracts/` holds 94 `.md`, 19 `.html` and a `baselines/` directory. |
| **Memory files** | **66** | `64` predates two files added during the migration work. The index (`MEMORY.md`) is not one of the 66. |
| **Forced-colors artifacts** | **100** | `99` was an off-by-one; compared baselines are 199 and total PNGs 299. |
| **`tasks/` files** | **2** | `65`, `79` and `91` are all historical: 65 counted only `.md` at one date, 79 was a later `.md` count, 91 was every file including non-markdown. The directory now holds 2. |

**One work item retired by measurement.** Earlier revisions flagged the codeeditor stylesheet as
untracked and requiring a `git add` before the move. It is tracked
(`src/main/resources/web/js/zul/code/css/codeeditor.css`), and there are now **zero** untracked
`.css` files in the theme source tree. The item is removed from P1 rather than left as a checkbox.

## A.3 P0 evidence

**The branch precondition** (measured 2026-09-08):

| branch | `.less` | `.css` |
|---|---|---|
| `master` | **153** | 0 |
| `new_theme` (Marble, current HEAD) | 0 | **133** repo-wide / **132** theme sources |

`new_theme` is a *divergent rewrite* that has already deleted every LESS file — it is **not** a
superset of `master`. **Consequence for the other workstream:** `iceblue` must be cut from
`master`, never from `new_theme`, or the 153 LESS files are lost permanently. See §A.3b.

**Why `tasks/` had no version-control fallback:** `.gitignore:35` is a bare `tasks`, ignoring the
directory wholesale — **0 of 91 files tracked**, including this plan, the manifest, all six Jess
documents and the lessons file. By contrast `doc/` was 486 of 488 tracked and the Playwright
harness 15 of 15, which is why MOVE stood for those and STAGED COPY was needed for the 12.

## A.3b IceBlue-side findings — measured here, owned elsewhere

**Not part of this migration.** These were measured while planning it, and the plan's work items
for them were withdrawn 2026-09-09 as out of scope. They are kept because they are live hazards
that someone will need, and re-deriving them costs real time. Nothing in the plan depends on acting
on them, with the single exception noted in §1's scope note (P4 needs the `iceblue` branch to
exist).

**The branch cut, if it happens:** cut `iceblue` from **`master`**, not from `new_theme` — see the
precondition table in §A.3. This is a correctness constraint, not a preference.

**The theme-builder landmine, still live:**

- `zkcml/zkthemebuilder/build.sh:59` runs `git submodule update --init --remote`. `--remote` tracks
  the submodule's **default branch**.
- `zkcml/.gitmodules` points `zkthemebuilder/template` at the `zkThemeTemplate` repository and
  carries only `path` and `url` — no `branch` key.
- The submodule is pinned at **`7e2f5b8f`** (tag v10.3.1), which is **not an ancestor of either
  `master` or `new_theme`** but *is* LESS-era. Submodules resolve by SHA, so dropping `--remote`
  leaves a working, deterministic, LESS-fed pipeline immediately, without waiting for any branch to
  exist.
- **What fires if nothing is done:** the moment template `master` becomes Marble, a `./build.sh -u`
  feeds a pure-CSS tree into a Maven + zklessc pipeline. The 27 Theme Pack palettes are pure
  `:root{--zk-*}` CSS (722 lines) referencing **110 IceBlue token names of which exactly 1 exists
  in Marble**. CSS ignores unknown custom properties, so they compile, deploy and **no-op
  silently** — later, and for someone else.

## A.4 P1 evidence — why no existing Gradle task can carry Marble

1. **The pure-CSS task is a no-op today.** `build.gradle:152–165` (`compileCSS`) fires only when
   `web/$project.name/css` exists. Across all of `zk` exactly one directory qualifies
   (`zul/.../web/zul/css`) and it holds a single 789-byte `zk.wcs` — zero `.css`. In `zkcml`, no
   qualifying directory exists at all.
2. **The LESS task structurally cannot.** `zkless-engine/src/index.js:12–15` filters out everything
   that is not a directory or a `.less`, so it never sees a `.css`.
3. **Today's `css/` directories are build *output*, not source.** zkless rewrites
   `js/zul/wgt/less/button.less` → `js/zul/wgt/css/button.css.dsp` (`index.js:22–27`, default
   extension from `zkless-cli.js:14`).

**The two hard constraints, with references:**

- `compileLess` (`build.gradle:198` → `node_modules/.bin/zklessc`) emits `.css.dsp` into
  `$codegen/**/css/` and so does Marble's builder; `processResources` uses
  `DuplicatesStrategy.INCLUDE` and there is **no ordering constraint** between `compileLess` and
  `compileCSS` — both are bare `dependsOn`.
- `zkcml/build.gradle:265` and `:280` carry a *duplicate* definition of both tasks with the same
  blind spot, differing only in include paths and an explicit `-f $zkDir/gulpfile.js`.
- `_`-prefixed files are skipped as LESS partials at `index.js:19–21`.

**The registration surface:**

| Lang file | refs | unique |
|---|---|---|
| `zk/zul/src/main/resources/metainfo/zk/lang.xml` | 86 | 40 |
| `zkcml/zkmax/src/main/resources/metainfo/zk/lang-addon.xml` | 35 | 31 |
| `zkcml/zkex/src/main/resources/metainfo/zk/lang-addon.xml` | 8 | 7 |

**78 unique**, plus two hard-wired in `zul/css/zk.wcs` (`font-awesome.css.dsp`, `norm.css.dsp`).
The entry point is fixed at `StandardThemeProvider.DEFAULT_WCS = "~./zul/css/zk.wcs"`.

Marble emits **86** `.css.dsp`. `scripts/build-css.js` (781 lines) holds the expected basename list
at `:238–260`, and `assertNoOrphanComponentCss()` at `:596–620` **fails the build** on an
unregistered, unbundled, unserved component stylesheet. `scripts/check-css-dsp.js` reads the real
ZK lang files — `ZK_HOME` defaults to `/Users/hawk/Documents/workspace/ZK10` — so its verdict is
verified against ZK's actual registrations, not an internal copy:

```
required by ZK : 80    present (real) : 74    present (stub) : 6    MISSING : 0
✓ All css-uri ZK requests are present in the build.
```

**Why a source count above the registration count is normal:** 62 sources under `js/zul/**/css`
map to 40 registrations because of deliberate bundling — `combo.css.dsp` merges the 7 `inp/css`
files, `footer.css.dsp` takes toolbarbutton, `norm.css.dsp` absorbs the components with no
`css-uri`. The tablet count (52 LESS → 13 sources → **1** `tablet.css.dsp`) is the runtime density
model replacing the prebuilt compact/default variants (`tokens/_sizing.css:88`,
`[data-density="compact"]`).

**No version checker exists to port.** `scripts/` holds `check-css-dsp.js`, `check-doc-links.js`
and `check-forced-colors.js` — there is no `check:version`. The theme version is declared in
`pom.xml`, `src/main/resources/metainfo/zk/config.xml`, `package.json` and `Version.java`, and a
mismatch between `config.xml` and `Version.java` does not error: the application simply loads no
theme. Earlier revisions of this document listed "port the version guard" as a P1 work item; the
guard does not exist, so the item is now "write one".

**Related history:** `zk` already registers `codeeditor.css.dsp` at `lang.xml:449`. Commit
`f6429e7` (ZK-6086, a codeeditor theme conflict) is worth reading for interactions.

## A.5 P2 evidence — the preview-module recipe

| Element | Source | Reference |
|---|---|---|
| Independent root build | both `zksandbox` and `zktest` are | A plain `include(':zkpreview')` would inherit the root `subprojects` block and drag `compileLess`/`compileCSS` onto the preview module |
| Dependency substitution | `zktest/settings.gradle` | The only mechanism binding published coordinates to live source without `publishToMavenLocal` |
| Container skeleton | `zksandbox/build.gradle`, 64 lines | `war` + `gretty 3.1.1` + `javax.servlet:servlet-api:2.4`; strip jasperreports, ckez, timelinez |
| Page shell | `ZKTestServlet`, 31 lines, `extends DHtmlLayoutServlet` | `?zktheme=marble` sets a `zktheme` cookie (max-age 0 for `default`, i.e. clear), then redirects to the query-free URL |

**`zksandbox`'s second disqualification:** its `includeBuild` in `zk/settings.gradle:16` carries no
`dependencySubstitution`, and it declares `org.zkoss.zk:zk` by published coordinate, so it builds
against `mavenLocal`. Its theme comes from the `org.zkoss.theme:iceblue_c` **jar**
(`zksandbox/build.gradle:39` → `10.3.0.1-Eval`), not the source tree.

**The mutual `includeBuild` cycle is fine** — `zk` includes `zktest` and `zktest` includes `zk`;
Gradle accepts it and it is in production today.

**The javax ceiling:** `gretty 3.1.1` + `jetty 9.4` is the only combination still working here.
`zktest/build.gradle:16` carries the explicit TODO that gretty does not support jetty 10.0.5 and
gretty 4.0.0 requires jetty 11+, and **jetty 11+ is the jakarta namespace**. `zksandbox` uses the
older `javax.servlet:servlet-api:2.4` coordinate, unrelated to the root's `servletVersion=3.1.0`
(which is `compileOnly` for library modules only); `jetty94Version` is a gretty override knob no
build script references.

**The servlet's one measured defect:** `ZKTestServlet` redirects to the query-free URL, so a query
string is lost. Impact today is **zero** — the use-case SPA deep-links by hash, which never reaches
the server, and nothing in the harness uses a query string. It would bite URL-driven density.

**Tolerances that cannot certify a migration:** `gallery-scan.spec.ts:65` allows
`maxDiffPixelRatio: 0.01` — on a full-page gallery, thousands of pixels. `tablet.spec.ts:438,448`
carry explicit 2% opt-ins for tabbox and window. Run as-is, the migration comparison would go green
while hiding real drift.

## A.6 D16 evidence — why the baselines are the oracle

| Fact | Value / location | Bearing |
|---|---|---|
| Theme's target ZK version | `pom.xml` → `11.0.0-jakarta.FL.20260904` | Same line as the target repo, so the core version is **not** a confound |
| Target repo version | `ZK10/zk/gradle.properties` → `11.0.0-SNAPSHOT` | as above |
| Target repo servlet flavour | `zk/build.gradle:20`, `zul/build.gradle:9` → `javax.servlet` | Preview *host* must change; does not affect pixels |
| Baseline composition | 99 `*-gallery` + 70 state + 30 `*-tablet` = **199** compared; **100** `*-forced-colors` = review artifacts | The cost of carrying them is 199 images, not 299 |

**What could legitimately differ, and why each is a finding rather than noise:**

| Possible difference | Assessment |
|---|---|
| **Font URL** — the self-hosted Inter `@font-face` is served through a DSP expression whose path loses its theme-name segment in P1 | The most likely migration break. Get it wrong and Inter silently fails to load, producing *uniform vertical drift on every page* — an unmistakable signature. This alone justifies carrying the baselines. |
| **ZK core version** | Not a confound — same version line both sides. |
| **Servlet flavour / container** | Changes the preview *host*, not the rendered CSS. |
| **Page shell and context path** | The real risk, and what D15-B controls: the shell moves verbatim. |

## A.7 Skill classification

| Skill | Files | Nature | Disposition |
|---|---|---|---|
| `zk-component-rules` | 97 (68 component files) | Explicitly **theme-independent**; its own description says theme-builders consult it | MOVE to `zk` — belongs there regardless of this migration |
| `zul-writer` | 24 | ZK-portable authoring rules | MOVE to `zk` |
| `css-theme-audit` | 3 | Marble-specific tooling | MERGE into `marble-theme` |
| `important-reduction` | 3 | Marble-specific tooling | MERGE into `marble-theme` |
| `show-me` | 1 | Third-party | Already in `zk` — do not copy |
| `impeccable` | 52 | Generic frontend-design skill | INSTALL if wanted; not Marble content |
| `plan-spec` | 1 | Personal working-style skill | Not migration content |

Only **two** of the seven are Marble knowledge, and both are small. The Marble knowledge was never
in the skills — it was in memory and in `doc/spec/`. That is precisely the gap P3 closes.

## A.8 Memory → skill mapping

The memory index's section headings already partition the 66 files along the lines the skill needs,
which is what made P3 step 1 a re-homing exercise rather than an authoring one:

| Memory index section | Destination |
|---|---|
| CSS Architecture | `reference/css-dsp.md`, `reference/pitfalls.md` |
| Tokens & Naming | `reference/tokens.md`, `reference/iceblue-parity.md` |
| ZUL Authoring | still to be folded in (P3 remainder) |
| Visual Regression / Screenshots | `reference/verification.md` |
| Tablet / Responsive | `reference/density.md` + `doc/spec/` equivalents |
| ZK Version / Components | `zk-component-rules` (theme-independent) or `zk`'s `CLAUDE.md` |
| **Shell Quirks, Environment** | **Machine-local — do not migrate.** Re-establish as the Target session's own memory |
| **Working Style** | **Personal — do not migrate.** Same treatment |
| Active Workstream | Migration state; ends with P4 |

**17 of the 66 cannot travel at all** — 9 working style, 6 shell quirks, 2 environment. They
describe the user and the machine, not the theme.

## A.9 Ruled decisions D14–D18

<details>
<summary><strong>D14 — How does Marble's CSS get built inside <code>zk</code>? — RULED: A</strong></summary>

**Port `build-css.js` and add a dedicated Gradle task.** The existing gulp + postcss `compileCSS`
stays for whatever already uses it; Marble gets its own task. This keeps the verified minifier and
both silent-corruption workarounds intact, and — importantly for D16 — means the CSS *output*
should be byte-comparable before and after the move.

**Consequences:** one npm dependency added at the `zk` root; `compileLess` retired in the same
phase; the layer guard and the stylesheet-path checker travel with the script.
</details>

<details>
<summary><strong>D15 — Where do the preview and use-case pages live? — RULED: B</strong></summary>

**A new dedicated preview module in `zk`.** 159 pages plus the SPA host justify their own module,
and — as D16 turned out to depend on — owning the page shell is what makes the screenshot baselines
comparable across the move. Adopting `zksandbox`'s layout would have diffed every baseline for
reasons having nothing to do with the theme.

**Consequences:** a new module in the composite build plus release-packaging exclusions, and the
servlet-flavour constraint in §A.5.
</details>

<details>
<summary><strong>D16 — Do the screenshot baselines move? — RULED: they move, and become the oracle</strong></summary>

The original recommendation (re-cut from scratch) was **wrong**. It rested on "P1 invalidates them
anyway". P1 changes *where* the CSS lives and is served from — not what is in it, and with D14-A
the minifier is unchanged too. **Paths do not move pixels.**

The correct framing is the inverse: **if the pixels change, that is the migration telling you it
broke something.** These 199 images are the only asset that can answer "did moving Marble change
how Marble looks?", and that question has no other oracle.

**The operational catch:** current tolerance cannot certify a migration (§A.5). The comparison must
be a one-off run at zero tolerance, separate from the normal regression gate, with every difference
explained rather than absorbed.
</details>

<details>
<summary><strong>D17 — What is <code>zkoss/zkThemeTemplate</code> afterwards? — RULED</strong></summary>

It remains the theme-template repository. `master` becomes **Marble**, and a new **`iceblue`**
branch carries the IceBlue content. Customers fork the repository to customise Marble.

**Two consequences:**

1. **The theme-builder landmine is a direct consequence of this ruling** — the submodule must be
   retargeted at `iceblue` *and* have `--remote` dropped. **Withdrawn from this plan's scope
   2026-09-09**; the finding is preserved in §A.3b for the workstream that owns it.
2. **The goal statement needed restating, not weakening.** This workspace stops being where Marble
   is maintained, but survives as a published product artifact — which raised D18.
</details>

<details>
<summary><strong>D18 — Which repository is source of truth? — RULED: A</strong></summary>

**`zk` is the single source of truth. Template `master` receives a one-way generated snapshot of
Marble's CSS at release time, and is never hand-edited upstream.** Customers edit their *forks* —
that is the product. What must never happen is us editing the template copy.

**Consequences, which reshape the inventory more than the build:**

1. Several assets stop being moves and become **copies** — the template must remain a working,
   standalone, forkable theme project, so it keeps its own build, theme-jar registration and
   preview app.
2. **The Java integration classes end up in two variants, not one.** P1 authors the
   core-registration variant in `zk`; the jar-registration variant *stays here*.
3. **The preview app stays too, and the servlet split helps.** `zk`'s module is javax; this
   repository's Spring Boot 3 / jakarta app remains the template's. Nothing has to be reconciled.
4. **The sync script belongs in `zk`,** alongside the release tooling.
5. **The version stamp is part of the sync** — a drift silently un-themes an application.
6. **It does not block the migration.** First sync is at the ZK 11.0 release.
</details>

## A.10 Known documentation drift

Found while migrating; none blocks the plan, all would mislead a reader.

| Document | Claim | Reality |
|---|---|---|
| Root `CLAUDE.md` | Theme targets ZK 10.4.0 | `pom.xml` says `11.0.0-jakarta.FL.20260904`; `pom.xml` is authoritative |
| Root `CLAUDE.md` | CSS structure diagram shows `zul/css/marble.css` as the global entry | No such file exists; `zul/css/` has **zero** top-level stylesheets |
| `doc/spec/data-dense-mode.md` | Ships a `marble-compact.css` tuning preset | The file does not exist |
| Two subagent definitions | Write reports to `tasks/gen-reports/` | That directory was deleted in P0 and has no tracked counterpart |
| Earlier revisions of this plan | `npm run check:version` guards version drift | No such script exists (§A.4) |

## A.11 Change log

- **2026-09-09 — the IceBlue side left the plan.** Ruled out of scope by the user: cutting the
  `iceblue` branch, the `zkthemebuilder` submodule and its `--remote` flag, and the Theme Pack
  palettes. All three were P0 work items and all three are gone from it. **P0 shed every one of its
  blocked items in the process** — those three were exactly the ones awaiting authorisation, so P0
  is now unblocked and down to a single open task, the memory split. Ownership simplified with it:
  P0 had been the one phase split across both sessions for a non-obvious reason (two writes into
  `zkcml`), and it is now Source-only, so §4 records two phases owned outright rather than one. The
  measurements were **not** deleted — they moved to §A.3b, because the theme-builder break is still
  live for whoever owns it and re-deriving it costs real time. One honest dependency survives and
  is stated in §1's scope note: **P4's promotion onto template `master` still needs the `iceblue`
  branch to exist**, or the LESS content it is meant to preserve is lost. That is now a dependency
  on another workstream rather than a task in this one.

- **2026-09-09 — the appendix split out of the plan, and the last of the move's fallout cleared.**
  Restructuring into three tiers had made the single file *longer* (754 → 854 lines), which defeats
  the purpose of a summary tier. Everything micro moved here, leaving the plan at 470 lines and
  readable end to end; §5.n references in the plan became *appendix §A.n*. Three follow-ups landed
  with it: the **9 dangling references** left by the earlier move are gone (5 were mechanical
  repoints, 3 were historical records of deliberately-dropped files where rewriting the path would
  have falsified the record, and 1 pointed at an archived report whose substance is now stated
  inline); **two documents that still asserted they were gitignored** were corrected, since the
  move made that claim false; and the **Jess freeze** was written onto the triage board, closing
  the one P0 item that measurement had found genuinely undone.

<details>
<summary><strong>2026-09-08 — creation through the sixth revision</strong></summary>

- **Document created.** Supersedes nothing; the risk assessment stays authoritative for the risk
  profile and the CSS-conversion order, and this plan extends its scope from "convert the CSS" to
  "make this workspace unnecessary". D10–D12 remain dismissed. D13 (which directory to launch in)
  is resolved by §4: two sessions, one per side.
- **D14=A, D15=B, D17 ruled; D16 reversed; D18 opened.** D16's original recommendation (discard the
  baselines) was withdrawn: it rested on "P1 invalidates them anyway", which is false. D17's ruling
  reshaped the theme-builder fix from "pin the submodule" to "retarget it at `iceblue`" and
  surfaced D18.
- **D18=A ruled.** The interesting consequence was not in the build but in the inventory: because
  the template must stay a working forkable project, the CSS, the CSS build and the preview app
  became **copies** rather than moves, and the Java classes became **two live variants**. The
  organising principle in §1 falls out of this ruling.
- **Fourth revision — target-side session stood up; three measurements changed the plan.** (a) P0
  reordered — dropping `--remote` is order-independent and immediately protective, so it goes
  first; (b) a **correctness precondition** — `new_theme` already deleted all 153 LESS files, so
  `iceblue` **must** be cut from `master`, which also makes P4's promotion a divergent merge,
  raised as **D19**; (c) the landing split is mechanical, retiring the CE-vs-EE question; (d) a
  suspected scope gap in `compileCSS`. Also confirmed: the target repo's `.claude/skills/` was
  empty with no agents or commands, so P3 is greenfield with zero naming collisions.
- **Fifth revision — P1's shape settled.** `compileCSS` turned out to be a no-op, `compileLess`
  structurally cannot see `.css`, and today's `css/` directories are LESS *output* — so P1 became
  "wrap `build-css.js` in its own Gradle task" and gained two hard constraints. The target session
  raised the extension question and two count discrepancies as possible dead files; **all three
  dissolved on measurement.** Net effect: P1's registration risk went to zero while its
  build-integration work grew slightly.
- **Sixth revision — P2's preview module resolved from precedent instead of design.** A
  four-source recipe, plus a **second, independent disqualification of `zksandbox`**. Also
  measured: a plain subproject would inherit the root build's CSS tasks and reintroduce the output
  collision, so the independent-root-build shape is load-bearing, not stylistic; and the javax
  ceiling is gretty 3.1.1 + jetty 9.4. D19's scope was narrowed to `zkThemeTemplate` only.
</details>

- **2026-09-09 — MOVE narrowed, and ARCHIVE turned out to be undefined for `tasks/`.** The user's
  rule (MOVE → COPY unless version-controlled) was accepted and then measured: `.gitignore:35`
  ignores `tasks` wholesale, so **0 of 91 files were tracked** — including this plan, the manifest,
  all six Jess documents and the lessons file. Those 12 became STAGED COPY. `doc/` (486/488) and
  the Playwright harness (15/15) are tracked, so MOVE stood there. The same discovery made ARCHIVE
  vacuous for `tasks/`, raised as **D20**.

- **2026-09-09 — P0's disposal executed; D20 resolved; P3 step 1 landed.** The 12 live documents
  moved into `doc/` by category; 10 knowledge documents became the 9-file `marble-theme` skill; 44
  archive-classified documents were verified byte-for-byte into one archive and their originals
  deleted, taking `tasks/` from 91 files to 2. Committed as `377e6827` (21 files). The
  load-bearing side effect: because `doc/` and `.claude/skills/` are tracked while `tasks/` is not,
  this put the theme's working knowledge under version control **for the first time**.

- **2026-09-09 — §4 gained per-phase ownership, and P3's two-step shape was written down.** The
  session table stated only which phases each side *leads*, leaving three phases undivided on paper
  but split in practice. §4 now carries a per-phase table and the rule underneath it — *ownership
  follows the repository being written to, not the phase* — plus the consequence that neither
  session can perform P3 alone.

- **2026-09-09 — restructured into the three-tier form, and four figures corrected.** Every line
  number, commit hash and raw measurement moved out of §1/§2 into this appendix. Four stale
  conclusions were **corrected at the conclusion, not annotated in place**, which is the point of
  the restructure:
  1. **§1 claimed Marble was "replacing one node-based CSS task with another".** The fifth
     revision had already refuted this in §2 while leaving the summary standing. §1 now states the
     measured position: no existing task can carry Marble, and the cheapness lies elsewhere — in
     the self-contained builder and the zero-change registration surface.
  2. **The theme CSS count was 132 in one place and 133 in another.** Reconciled (§A.2): 132 theme
     sources; the 133rd was a preview-page stylesheet belonging to P2.
  3. **Contracts were variously 114, 131 and 133.** Measured: 94 contracts plus 19 mockups.
  4. **Memory was 64 in the inventory and 66 in P0.** It is 66.
  Two work items were also retired as already satisfied or never real: the codeeditor stylesheet is
  tracked, and there is no version-checker script to port — one has to be written. And one item
  was found genuinely undone: the Jess freeze is recorded only in session memory, not in the
  tracker document.
