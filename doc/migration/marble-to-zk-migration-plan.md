# Marble → zk Repository Migration Plan

**Status:** D14–D18 ruled 2026-09-08. **D19 and D20 open** — both raised by measurement; D19 blocks P4 only, **D20 blocks the `tasks/` archiving step in P0**. · **Written:** 2026-09-08 · **Series:** D13– (this document)
**Companion documents:** `tasks/zk11-marble-migration-risk-assessment.md` (the risk profile and the
CSS-conversion sequence) · `tasks/claude-launch-directory-for-migration.md` (session topology) ·
`doc/zk11-less-dsp-deprecation-evaluation.md` (the architecture decision this implements).

---

## 1. Executive Summary

### Goal

Move Marble into the `zk` repository so completely that **this workspace is never needed again**.
Not just the CSS — the preview pages, the verification harness, the specifications, the build
scripts, and the accumulated maintenance knowledge.

### Definition of done

A developer who has never seen `zkThemeTemplate` can, from a fresh `zk` checkout:

1. build the framework and get Marble as the default look-and-feel;
2. open a preview page and see every themed component;
3. edit a component's CSS and watch the change;
4. run the verification harness and get a pass/fail;
5. answer "how does this theme work, and what must I not break?" from **one skill**, without
   searching other repositories.

If any of those five still requires this workspace, the migration is not finished.

**Scope note after the D17 ruling.** This workspace stops being where Marble is *maintained* — that
is the goal and it stands. It does **not** disappear: `zkThemeTemplate` remains the public
theme-template product, with `master` becoming Marble and a new `iceblue` branch carrying the old
content. Marble therefore exists in two repositories on purpose, and D18 settles the rule that keeps that
honest: **`zk` is the single source of truth, and the template receives a one-way generated snapshot
at release time.** The organising principle for the whole migration follows from it —

> **Maintainer assets move. Customer-facing deliverables are copied, with `zk` as source of truth.**

Getting this the wrong way round is what would reopen the two-repository problem.

### Phases

| # | Phase | Milestone | Gate |
|---|-------|-----------|------|
| **P0** | Consolidate & Freeze | This workspace holds only what is worth moving | A keep/drop manifest, reviewed |
| **P1** | Build Integration | Marble CSS builds from inside `zk`; LESS retired | `zk` + `zkcml` jars build; Marble CSS in the jar |
| **P2** | Verification Environment | Preview pages and harness run inside `zk` | A preview page renders; harness green |
| **P3** | Knowledge Encapsulation | One skill answers every maintenance question | Cold-start drill passes (see P3) |
| **P4** | Cutover & Archive | This workspace goes read-only; Jess work resumes in `zk` | Full `zktest` gate; branch merged |

### Overall progress

**≈5%.** One prerequisite is complete: the `marble` branch exists in both `zk` and `zkcml` at zero
divergence from `master` and is pushed to the `hawkchen` fork. **All decisions D14–D18 are ruled**
(§3) — nothing blocks execution, and P0 can start immediately.

### The one thing that makes this cheaper than it looks

The `zk` repository **already has a pure-CSS build path**. Root-level npm infrastructure is in
place, and `build.gradle` already carries a `compileCSS` task that feeds
`src/main/resources/web/<project>/css` through a node minifier. Marble is not introducing a new kind
of build step into a LESS-only repository — it is replacing one node-based CSS task with another.

### The safety net, which nearly got thrown away

The 199 screenshot baselines are the only asset that can answer "did moving Marble change how Marble
looks?". With D14-A keeping the minifier and D15-B keeping the page shell, the rendered output should
be *identical* across the move — so any diff is the migration reporting a defect, with the font-URL
break carrying an unmistakable signature. The plan's first draft recommended discarding them; that
was wrong, and D16 records why.

### The one thing that is bigger than it looks

The knowledge. The CSS is 132 files that copy in an afternoon. The knowledge is **64 memory files,
26 specification documents, 114 component contracts, 5 subagents and a large root `CLAUDE.md`** —
none of which travels by `cp`, and all of which is what actually lets someone maintain this theme.
P3 is the phase that decides whether this migration succeeds.

---

## 2. Phase Breakdown

### P0 — Consolidate & Freeze

**Goal:** stop accumulating state here, and decide what is worth carrying.

| | |
|---|---|
| **Input** | 65 `tasks/*.md` (2.8 MB), 22 `doc/*` files, 64 memory files, 7 skills, 5 agents |
| **Output** | `tasks/migration-manifest.md` — every asset marked `MOVE` / `MERGE-INTO-SKILL` / `ARCHIVE` / `DROP` |
| **Gate** | The manifest is reviewed and nothing is left unclassified |

Work items:

- [ ] **Freeze Jess design-review work.** Per the ruling, the 50 in-scope issues are solved *after*
      the migration, in `zk`. Mark the tracker and `tasks/jess-review-triage.md` accordingly so no
      one starts an issue that would have to be re-applied on the other side.
- [ ] **Drop `--remote` from `zkcml/zkthemebuilder/build.sh` (line 59). Do this first — it is
      order-independent and immediately protective.** `--remote` tracks the submodule's *default*
      branch, so the moment `master` becomes Marble a `./build.sh -u` would generate Theme Pack's 27
      Iceblue-vocabulary palettes from Marble CSS — silently, because the palettes reference 110
      Iceblue token names of which 1 exists in Marble, and CSS ignores unknown custom properties.
      Measured: the submodule is pinned at `7e2f5b8f` (tag v10.3.1), which is **not an ancestor of
      either `master` or `new_theme`** but *is* LESS-era, and submodules resolve by SHA — so
      removing `--remote` leaves a working, deterministic, LESS-fed pipeline **today**, without
      waiting for the `iceblue` branch to exist. This is the one break that fires *outside* the
      branch, whoever runs it. Write scope: the target-side session.
- [ ] **Then add `branch = iceblue` to `zkcml/.gitmodules`** (it currently carries only `path` and
      `url`), once the branch exists, so a future re-pin has a documented source. Order:
      drop `--remote` → cut `iceblue` → add the `branch` key.
- [x] **Triage `tasks/`, `doc/` and the memory files.** Done 2026-09-08 →
      **`tasks/migration-manifest.md`**, which classifies every asset under six dispositions
      (MOVE / COPY / SKILL / ARCHIVE / DROP / RE-ESTABLISH). Measured totals corrected three
      earlier estimates upward without changing any disposition: `tasks/` is **79** files not 65,
      `doc/contracts/` **131** not 114, memory **66** not 64. The one bucket carrying real
      judgement is the 46 `tasks/` ARCHIVE entries, and the guard against silently losing knowledge
      there is a cross-check against the memory dispositions before anything is archived.
- [ ] **Execute the manifest's memory split.** 66 files: ~49 fold into the skill's reference
      pages (the `MEMORY.md` section headings already partition them that way), and **17 cannot be
      moved at all** — Working Style (9), Shell Quirks (6) and Environment (2) are user
      preferences and machine facts, so they must be **re-established as the target session's own
      memory**, not written into a repo skill.
- [ ] **Cut the `iceblue` branch on `zkThemeTemplate` from `master`** — and from `master`
      *specifically*. **This is a correctness precondition, not a preference.** Measured 2026-09-08:

      | branch | `.less` | `.css` |
      |---|---|---|
      | `master` | **153** | 0 |
      | `new_theme` (Marble, current HEAD) | 0 | **133** |

      `new_theme` is a *divergent rewrite* that has already deleted every LESS file — it is **not**
      a superset of `master`. Cutting `iceblue` from `new_theme` would produce an empty branch and
      lose the LESS content permanently. Cut it from `master`, before anything replaces `master`.
- [ ] **Classify the 7 skills** — only three are Marble content; two are ZK-portable and belong in
      `zk` regardless of this migration; two are third-party and should be *installed*, not copied.

### P1 — Build Integration

**Goal:** Marble CSS is built by `zk`'s own build, and the LESS tree is gone.

**The landing split is mechanical, not a CE/EE judgement call** (measured 2026-09-08 — this
answers the target side's "which repo does the first file go to"):

| Destination | Files | Content |
|---|---|---|
| `zk` → `zul` module (CE) | **87** | `js/zul/**/css` 62 + `zul/css/` 25 (tokens 12, utility 9, base 4) |
| `zkcml` → `zkmax` (EE) | **40** | `js/zkmax/**/css` 27 + `zkmax/css/tablet/` 13 |
| `zkcml` → `zkex` (PE) | **5** | colorbox, columnlayout, fisheye, pdfviewer, rangeslider |

132/132, no remainder. Marble is ZK 11.0's *default* LAF, so the CE base must live in `zk/zul`;
EE/PE component styling follows its own module. Consistent with the 31 zkmax/zkex LESS files that
`@import "~./zul/less/_header.less"` — all three modules convert on one branch, which the
composite build (`settings.gradle:15` + `build.gradle:49`'s hard-wired sibling `zkcmlDir`) already
forces anyway. **Note:** `web/js/zul/code/` (codeeditor CSS) is still *untracked* here, so
`git ls-files` does not see it — do not let it fall through the move.

**RESOLVED (target session, 2026-09-08) — neither existing Gradle task can carry Marble, and the
conclusion is favourable.** Three measurements settle P1's shape:

1. **`compileCSS` is a no-op today.** It fires only when `web/$project.name/css` exists; across all
   of `zk` exactly one directory qualifies (`zul/.../web/zul/css`) and it holds a single 789-byte
   `zk.wcs` — zero `.css`. In `zkcml`, no qualifying directory exists at all.
2. **`compileLess` structurally cannot.** `zkless-engine/src/index.js:12–15` filters everything
   that is not a directory or a `.less`, so it never sees a `.css`.
3. **Today's `css/` directories are build *output*, not source.** zkless rewrites
   `js/zul/wgt/less/button.less` → `js/zul/wgt/css/button.css.dsp` (`index.js:22–27`,
   default extension from `zkless-cli.js:14`).

So P1 is **"wrap `build-css.js` in its own Gradle task"**, not "widen `compileCSS`". That is the
cheaper branch: `build-css.js` is a self-contained builder carrying the bundling rules, the orphan
guard, `assertLayer`, and both minifier-corruption workarounds — all of which D14-A already elected
to keep, and which the D16 zero-tolerance comparison depends on.

**Two hard constraints that follow:**
- **The LESS tree must be deleted in the same commit that lands Marble** — not run alongside it.
  `compileLess` emits `.css.dsp` into `$codegen/**/css/` and so does Marble's builder;
  `processResources` uses `DuplicatesStrategy.INCLUDE` and there is **no ordering constraint**
  between `compileLess` and `compileCSS` (both are bare `dependsOn`). Run both and the output
  depends on task execution order.
- **P1 edits two build files, not one.** `zkcml/build.gradle:265`/`:280` carry a *duplicate*
  definition of both tasks with the same blind spot, differing only in include paths and an
  explicit `-f $zkDir/gulpfile.js`.

**Also: never point zklessc or gulp at Marble's source tree.** Files beginning `_` are treated as
LESS partials and skipped (`index.js:19–21`), and Marble's tokens, utilities and tablet files are
all `_`-prefixed — they are concatenated by `build-css.js` and never shipped individually.

**The good news, measured: the `<css-uri>` registration surface needs zero changes.** ZK does not
discover widget CSS by convention — 78 `<css-uri>` entries name each file individually, 100%
hard-wired to `.css.dsp` (`zul/lang.xml` 40 unique, `zkmax` 31, `zkex` 7, plus two in `zk.wcs`).
Marble already builds *to* that surface: source is `.css`, **output is `.css.dsp`** (86 emitted),
and `build-css.js:238–260` holds the basename list explicitly against those registrations. The
project's own checker confirms it:

```
required by ZK : 80    present (real) : 74    present (stub) : 6    MISSING : 0
✓ All css-uri ZK requests are present in the build.
```

This also retires the target session's two apparent count discrepancies: 62 source files under
`js/zul/**/css` map to 40 registrations because of deliberate bundling (`combo.css.dsp` merges the
7 `inp/css` files, `footer.css.dsp` takes toolbarbutton, `norm.css.dsp` absorbs the components with
no `css-uri`), and a build-time orphan guard (`build-css.js:596–620`) **fails the build** on any
component CSS that is neither registered, bundled, nor WCS-served — so silently dead files are
impossible by construction. The tablet count (52 LESS → 13 source → **1** `tablet.css.dsp`) is the
runtime density model replacing the prebuilt compact/default variants
(`tokens/_sizing.css:88`, `[data-density="compact"]`).

**One housekeeping item this surfaced:** `web/js/zul/code/` (codeeditor CSS) must be `git add`-ed
before the move — it is untracked here, while `zk` already registers `codeeditor.css.dsp` at
`lang.xml:449`. Commit `f6429e7` (ZK-6086, a codeeditor theme conflict) is worth reading for
interactions.

| | |
|---|---|
| **Input** | 132 Marble CSS files, `scripts/build-css.js` (781 lines), 5 Java files, 67 `zul` LESS files + 85 `zkmax` + 8 `zkex` |
| **Output** | Marble CSS under `zul/src/main/resources/web/zul/css/**`, a Gradle task that builds it, `compileLess` retired |
| **Gate** | `zk` + `zkcml` composite build succeeds and the jar contains the expected `*.css.dsp` set |

Work items:

- [ ] **Resolve D14** (build pipeline) before touching anything.
- [ ] Relocate CSS sources to the unprefixed core layout — no `marble/` path segment — and delete
      the `MarbleThemeProvider` prefix rewrite.
- [ ] Port `build-css.js`'s bundling and its two empirically-found minifier workarounds. **Do not
      treat these as optional**: both were silent-corruption bugs, and both are minifier-specific,
      so a pipeline change re-opens them.
- [ ] Convert `zul` + `zkmax` + `zkex` in one commit range; keep LESS in place until all three are
      green (a core-only conversion does not compile).
- [ ] **Author a second variant of the 5 Java classes**, rather than re-homing them. Theme
      registration in core is not the same as registration from a theme jar — and under D18 the
      jar-registration variant must keep existing here for the forkable template. Both variants are
      live; neither is a copy of the other.
- [ ] Port the `check:css-dsp` and `check:version` guards, or their equivalent, into the `zk` build.
      Without them a mis-pathed stylesheet silently 404s.

### P2 — Verification Environment

**Goal:** you can *see* and *measure* Marble from inside `zk`.

| | |
|---|---|
| **Input** | 159 preview/use-case ZULs (9.2 MB), the UseCase SPA, 13 Playwright specs, **199** compared screenshot baselines, 16 build/check scripts |
| **Output** | Preview pages served from a `zk` module; the harness runnable there |
| **Gate** | The 199 baselines re-run **at zero tolerance** against the migrated build, with every diff explained (D16) |

Work items:

**The module recipe is settled (target-session survey, 2026-09-08). Take one piece from each of
three existing precedents rather than copying any one of them:**

| Element | Copy from | Why that one |
|---|---|---|
| Module structure | **Independent root build** + `includeBuild` (both `zksandbox` and `zktest` are) | A plain `include(':zkpreview')` subproject **inherits the root `subprojects` block**, which would drag `compileLess`/`compileCSS` onto the preview module — the exact source of the output collision. An independent root build makes that structurally impossible. |
| Dependency wiring | **`zktest/settings.gradle`'s `dependencySubstitution`** | The only mechanism that declares deps by *published coordinate* while binding them to *live source*, so a one-line CSS edit is visible without `publishToMavenLocal`. |
| `build.gradle` skeleton | `zksandbox`'s 64 lines (`war` + `gretty 3.1.1` + `javax.servlet:servlet-api:2.4`) | The smallest configuration proven to serve ZULs here; strip the heavy extras (jasperreports, ckez, timelinez). |
| Page shell | **`zktest`'s `ZKTestServlet`, 31 lines** | It already *is* a theme-switching harness — see below. |

**`zksandbox` is disqualified as the base, for a second reason independent of D15-B's.** Its
`includeBuild` in `zk/settings.gradle:16` carries **no `dependencySubstitution`**, and it declares
`org.zkoss.zk:zk` by published coordinate — so it builds against whatever is in `mavenLocal`, and
its theme comes from the `org.zkoss.theme:iceblue_c` **jar**, not the source tree. A preview module
whose CSS edits require a publish step is unusable for this work. D15-B was ruled on the page-shell
argument; this is a stronger, independent confirmation of the same ruling.

**`ZKTestServlet` (31 lines, `extends DHtmlLayoutServlet`) is a ready-made, URL-driven theme
switch** — `?zktheme=marble` sets a `zktheme` cookie (max-age 0 for `default`, i.e. clear), then
redirects to the query-free URL. That is precisely the control surface the D16 comparison and the
cross-theme baseline work need, and it means the "run Marble's pages under another theme" harness
has an upstream mechanism rather than needing invention.

**The mutual `includeBuild` cycle is fine** — `zk` includes `zktest` and `zktest` includes `zk`;
Gradle accepts it and it is in production today, so the preview module may use the same shape.

- [ ] Stand up the new preview module (D15-B) per the recipe above, carrying the page shell
      **verbatim** — the shell is what makes the baselines comparable, so this is a copy, not a
      redesign.
- [ ] Move the preview and use-case ZULs, including the SPA host and its bookmark navigation.
- [ ] Move the Playwright harness and re-point its base URL and config at the new host.
- [ ] Drop `zksandbox`'s external theme-jar pin — it depends on `org.zkoss.theme:iceblue_c` today,
      which is exactly the dependency this migration removes.
- [ ] **Solve the servlet-flavour mismatch — bounded, and the boundary is now measured.** `zk`
      compiles against `javax.servlet`; the current preview app is Spring Boot 3.x/jakarta. The
      preview module cannot be a straight copy of the Spring Boot host. The javax side is narrower
      than it looks: **`gretty 3.1.1` + `jetty 9.4` is the only combination still working here** —
      `zktest/build.gradle:16` carries the explicit TODO that gretty does not support jetty 10.0.5
      and gretty 4.0.0 requires jetty 11+, and jetty 11+ *is* the jakarta namespace. `zksandbox`
      uses the older `javax.servlet:servlet-api:2.4` coordinate, unrelated to the root's
      `servletVersion=3.1.0` (which is `compileOnly` for library modules only), and
      `jetty94Version` is a gretty override knob that no build script references. This affects the
      *host*, not the rendered pixels, so it does not threaten the D16 comparison — but the
      live-reload workflow must be rebuilt or consciously dropped, and the skill must document
      whichever is true.
- [ ] **Run the migration comparison at zero tolerance** and explain every diff. Expect the font-URL
      signature first (uniform vertical drift on every page = Inter failed to load). Only after the
      comparison is explained should the normal tolerances be restored.

### P3 — Knowledge Encapsulation

**Goal:** one skill carries everything a maintainer needs. This is the phase that discharges the
user's actual requirement.

| | |
|---|---|
| **Input** | 64 memory files, 26 `doc/spec/*`, 114 `doc/contracts/*`, 5 subagents, the root `CLAUDE.md` |
| **Output** | `.claude/skills/marble-theme/` in `zk`, plus the two ZK-portable skills re-homed |
| **Gate** | **Cold-start drill** — a session launched in `zk` with no prior context is given a real theme task and completes it using only the skill |

Proposed skill shape:

```
zk/.claude/skills/
├── marble-theme/                 # NEW — the maintenance skill
│   ├── SKILL.md                  # when to use; build & verify commands; the file-layout map
│   └── reference/
│       ├── tokens.md             # the --zk-* vocabulary, cascade and override rules
│       ├── layers.md             # layer architecture + the build-time layer guard
│       ├── css-dsp.md            # what decides each .css.dsp output path
│       ├── verification.md       # the harness, baseline tolerance, the font-load race
│       ├── zul-authoring.md      # utility-class rule, vflex/label traps
│       └── pitfalls.md           # silent-corruption traps, ordered by cost
├── zk-component-rules/           # MOVED — theme-independent, belongs in zk permanently
├── zul-writer/                   # MOVED — ZK-portable
└── show-me/                      # already present in zk
```

Work items:

- [ ] Author `marble-theme` from the memory triage, not from scratch. `MEMORY.md`'s own section
      headings already partition the knowledge along almost exactly these reference files — that
      correspondence is the migration path, and the appendix records it.
- [ ] Move `doc/spec/` (normative) and `doc/contracts/` (114 per-component contracts). Contracts are
      the harness's expected values; without them the harness has nothing to compare against.
- [ ] Move the 5 subagents, and re-point every path they cite.
- [ ] Fold the Marble-relevant parts of this repo's root `CLAUDE.md` into `zk`'s 33-line one — as a
      pointer to the skill, not as a second copy of it.
- [ ] **Rewrite every repo-relative path.** Memories and specs cite paths like
      `src/main/resources/web/zul/css/…`, which resolve against the *wrong repository* without
      erroring once the session is rooted in `zk`. This is a silent-failure class of its own.

### P4 — Cutover & Archive

**Goal:** close the door.

| | |
|---|---|
| **Input** | A green P1–P3 |
| **Output** | Merged `marble` branch; this workspace read-only; Jess work resumed in `zk` |
| **Gate** | Full `zktest` run triaged against the pre-migration baseline |

Work items:

- [ ] Baseline the unmodified fork with a full `zktest` run **before** the Marble commits land —
      without a before-picture a Marble regression is indistinguishable from a pre-existing flake.
- [ ] Fix the zktest icon fallout (~50 unresolved `z-icon-*`, plus the Font Awesome sizing and
      stacking classes, which are API rather than artwork). Bounded by the test suite.
- [ ] Close the 6 measured component coverage gaps: `codeeditor`, `scrollview`, `video`, `skeleton`,
      `sliderbuttons`.
- [ ] Port the tablet layer onto Marble's runtime density model.
- [ ] **Execute D17:** promote Marble onto `zkThemeTemplate` `master`, the `iceblue` branch having
      been cut in P0. **Not a fast-forward** — `new_theme` and `master` have divergent histories
      (153 LESS deleted, 133 CSS added), so the promotion mechanism is **D19**, still open.
- [ ] **Write the D18 sync script**, hosted in `zk` beside the release tooling: it reads core's
      Marble CSS and writes template `master`. Run the existing version check on the *synced result*,
      not only on core — a version drift between the coordinated locations silently un-themes an
      application.
- [ ] **Mark template `master` as generated** so no one hand-edits the upstream copy. First sync
      happens at the ZK 11.0 release, so this is the tail of the work, not a blocker.
- [ ] Resume the 50 in-scope Jess issues, in `zk`.

---

## 3. Decisions

### D14 — How does Marble's CSS get built inside `zk`? — **RULED: A**

**Port `build-css.js` and add a dedicated Gradle task.** The existing gulp + postcss `compileCSS`
stays for whatever already uses it; Marble gets its own task. This keeps the verified minifier and
both silent-corruption workarounds intact, and — importantly for D16 — it means the CSS *output*
should be byte-comparable before and after the move.

**Consequences:** one npm dependency added at the `zk` root; `compileLess` retired in the same
phase; the layer guard and the `.css.dsp` path checker travel with the script.

### D15 — Where do the preview and use-case pages live? — **RULED: B**

**A new dedicated preview module in `zk`.** 159 pages plus the SPA host justify their own module,
and — as D16 turned out to depend on — owning the page shell is what makes the screenshot baselines
comparable across the move. Adopting `zksandbox`'s layout would have diffed every baseline for
reasons that have nothing to do with the theme.

**Consequences:** a new module in the composite build plus release-packaging exclusions; and one
constraint that has to be designed around, not worked around — see the servlet-flavour note in P2.

### D16 — Do the screenshot baselines move? — **RULED: they move, and they become the migration oracle**

The original recommendation (re-cut from scratch) was **wrong**, and the reasoning behind it does not
survive scrutiny. It rested on "P1 invalidates them anyway". P1 changes *where* the CSS lives and
*where it is served from* — it does not change what is in it, and with D14-A the minifier is
unchanged too. Paths do not move pixels.

The correct framing is the inverse: **if the pixels change, that is the migration telling you it
broke something.** These 199 images are the only asset that can answer "did moving Marble change how
Marble looks?", and that question has no other oracle.

**What could legitimately differ, and why each is a finding rather than noise:**

| Possible difference | Assessment |
|---|---|
| **Font URL** — the self-hosted Inter `@font-face` is served through a DSP expression whose path loses its theme-name segment in P1 | The most likely migration break. Get it wrong and Inter silently fails to load, producing *uniform vertical drift on every page* — an unmistakable, instantly-diagnosable signature. This alone justifies carrying the baselines. |
| **ZK core version** | **Not a confound.** The theme already targets ZK `11.0.0-jakarta.FL.20260904` and `ZK10/zk` is `11.0.0-SNAPSHOT` — the same line. (The root `CLAUDE.md` still says 10.4.0; it is stale.) |
| **Servlet flavour / container** | Changes the preview *host*, not the rendered CSS. Container choice does not move pixels. |
| **Page shell and context path** | The real risk, and it is what D15-B controls: the shell moves verbatim. |

**The operational catch — current tolerance cannot certify a migration.** `gallery-scan.spec.ts:65`
allows `maxDiffPixelRatio: 0.01`, i.e. up to 1% of pixels, which on a full-page gallery is thousands
of pixels; `tablet.spec.ts` carries explicit 2% opt-ins for tabbox and window. Run as-is, the
migration comparison would go green while hiding real drift. **The migration comparison must be a
one-off run at zero tolerance**, separate from the normal regression gate, with every diff explained
rather than absorbed.

**What travels:** the **199 compared baselines** (99 `*-gallery`, 70 state-specific hover/focus/active,
30 `*-tablet`). The **99 `*-forced-colors.png` do not** — they are review artifacts that are always
dirty and never compared, and they regenerate on demand. So the cost is 199 images, not 298.

### D17 — What is `zkoss/zkThemeTemplate` afterwards? — **RULED**

It remains the theme-template repository. `master` becomes **Marble**, and a new **`iceblue`** branch
carries the Iceblue content. Customers fork the repo to customise Marble.

**Two consequences, one of them load-bearing:**

1. **The zkthemebuilder landmine changes shape — and stops being optional cleanup.** `build.sh` runs
   `git submodule update --init --remote`, which tracks the submodule's **default branch**. The
   moment `master` is Marble, Theme Pack's 27 palettes — written in Iceblue's token vocabulary —
   would be generated from Marble CSS. The fix is no longer "pin it": the submodule must be
   **retargeted at the `iceblue` branch** *and* have `--remote` dropped. This is now a direct
   consequence of the D17 ruling rather than a stray build defect.
2. **The goal statement needs restating, not weakening.** This workspace stops being where Marble is
   *maintained* — that is the whole point of the migration and it still holds. But it survives as a
   *published product artifact*. Which raises D18.

### D18 — Which repository is source of truth, and how do the two Marble copies stay in sync? — **RULED: A**

**`zk` is the single source of truth. `zkThemeTemplate` master receives a one-way generated snapshot
of Marble's CSS at release time, and is never hand-edited upstream.** (Customers edit their *forks* —
that is the product. What must never happen is us editing the template copy.)

**Consequences, which reshape the inventory more than the build:**

1. **Several assets stop being "moves" and become "copies".** The template still has to be a
   *working, standalone, forkable theme project* for a customer, which means it keeps its own build,
   its own theme-jar registration and its own preview app. The disposition column in §5.1 is
   corrected accordingly.
2. **The Java integration classes end up in two variants, not one.** P1 authors the
   core-registration variant inside `zk`; the existing **jar-registration** variant *stays here*,
   because that is what a forked template needs. This is the one place where "re-home" was the wrong
   verb — it is "author a second variant".
3. **The preview app stays too, and the servlet-flavour split actually helps.** `zk`'s preview module
   is javax (P2); this repo's Spring Boot 3.x / jakarta preview app remains as the template's, so a
   customer who forks can still see their changes. Nothing has to be reconciled.
4. **The sync script belongs in `zk`,** alongside the release tooling — it runs from the
   source-of-truth side at release time, reading core and writing the template.
5. **The version stamp is part of the sync.** The theme version lives in several coordinated places,
   and a drift between them silently un-themes an application. The existing version check has to run
   on the synced result, not just on core.
6. **It does not block the migration.** The first sync happens at the ZK 11.0 release, so this is
   P4-tail work.

---

### D19 — How does Marble get onto `zkThemeTemplate` `master`? — **OPEN**

**Background.** D17 says template `master` becomes Marble. Marble actually lives on `new_theme`,
and the two branches have **divergent histories**: `master` holds 153 `.less` and 0 `.css`;
`new_theme` holds 0 `.less` and 133 `.css`. So "promote onto master" is not a fast-forward — it is
a history-level decision about a repository customers fork.

**Impact.** This is the branch customers will clone and whose history they will read. It only
matters at P4, and `iceblue` (cut in P0) preserves the LESS content under every option — so this
blocks nothing now.

**Scope: `zkThemeTemplate` only.** In `zk` and `zkcml` the `marble` branch sits on the *same
commit* as its own `master` (`rev-list --count master..marble` = 0 in both, re-verified
2026-09-08), so there is no divergence there and the eventual merge is a plain fast-forward. The
divergent-history problem exists in exactly one of the three repositories.

**Options.**
- **【A】Merge `new_theme` into `master`** (recommended): one merge commit recording 153 deletions
  and 133 additions. Cost: honest but noisy history; customers see a LESS→CSS transition in their
  fork's log, which is arguably the correct story to tell.
- **【B】Fast-forward by renaming**: make `new_theme` the new `master` (rename branches, repoint
  the default branch). Cost: cleanest resulting history, but `master`'s existing history stops
  being reachable from `master`; anyone with an old clone gets a non-fast-forward surprise.
- **【C】Squash the tree onto `master`**: a single "ZK 11.0 Marble" commit replacing the tree.
  Cost: loses Marble's own development history from the customer-facing branch — and that history
  is where the design rationale lives.

### D20 — How do the 46 `tasks/` ARCHIVE files actually get archived? — **OPEN**

**Background.** Measured 2026-09-09: `.gitignore:35` ignores `tasks` wholesale, so **0 of its 91
files are tracked** — and ARCHIVE was defined as "stays in this repo's git history". For `tasks/`
there is no history to stay in. The 46 files classified ARCHIVE in
`tasks/migration-manifest.md` would just sit on disk in a workspace whose whole purpose is to become
unnecessary. That is deferral, not archiving.

**Impact.** These are completed investigations, so the *outcomes* already live in the CSS, a spec or
a memory — the loss would be the reasoning, not the result. But it also affects the 12 STAGED COPY
documents and `lessons.md`, whose only copy is an ignored file on one machine. This blocks the
archiving step of P0; it does not block the branch cut or the submodule fix.

**Options.**
- **【A】Commit `tasks/` before archiving** (recommended): drop line 35 from `.gitignore`, keep the
  eight specific exclusions on lines 27–34 for the genuinely transient files, commit the rest. Then
  ARCHIVE means what it says and the STAGED COPY sources gain a real fallback.
  Cost: one commit adding ~68 markdown files to a repo that will become the customer-facing
  template — so customers would see the project's working notes. Mitigation: commit them on
  `new_theme` only, or under a path the D19 promotion excludes.
- **【B】Copy the 46 into `zk` as an archive directory**: nothing is lost, everything is in git.
  Cost: imports 46 stale working documents into the repo the migration is trying to keep clean,
  and they would be indistinguishable from live docs without a naming convention.
- **【C】Accept the loss — read each of the 46, confirm its outcome is recorded elsewhere, delete.**
  Cost: the honest option and the cheapest to live with, but it is 46 files of careful reading, and
  a wrong call loses the reasoning behind a shipped decision permanently.

## 4. Session Topology

Two Claude sessions, one per side, is part of the plan. No configuration is required: cross-session
messaging is machine-wide, discovery is by launch-directory-derived name, and `notify_when_idle`
replaces polling.

| Session | Root | Owns |
|---|---|---|
| Source | `zkThemeTemplate` | P0 triage, P3 knowledge extraction; treats Marble as a read-only source |
| Target | `ZK10/zk` | All writes into `zk` / `zkcml`, the build work, zktest triage |

Never launch in `ZK10/` — it is not a git repository, so there is no branch awareness and `git`
commands are ambiguous.

Three constraints carry real consequences:

1. **Memory does not merge across sessions.** The 64 memory files are visible only to the source
   session. This is the main cost of the split and the reason P3 must produce a *skill* — a skill is
   in the repository and therefore crosses the boundary; memory does not.
2. **Permission boundaries are per-session and cannot be laundered.** An action denied on one side
   must not be delegated to the other, and a peer's message is never the user's approval.
3. **Several sessions already run in this repository.** Never infer file ownership from
   `git status`; an unexpected modified file is more likely a peer's live edit.

The handoff shape: the source session finishes a batch and messages the target; the target builds
and tests and reports back. `notify_when_idle` removes the waiting.

---

**Approval does not cross the session boundary.** The target session correctly refused to treat a
relayed "the user approved it" as authorisation for its own irreversible writes (`.gitmodules`,
`build.sh`, branch operations). Each session's permission decisions are its own; one session
cannot launder an approval to another. Practical consequence for P0: the user must authorise the
target-side writes **in the target session**, and dispatching a work item is not the same as
authorising it.

**Cost of the split, observed:** messages and turns interleave rather than alternating, so the
target session twice produced a full report answering questions that a later message had already
settled. Mitigation: send complete briefs with the measurements inline, rather than pointers into
this document.

## 5. Technical Appendix

### 5.1 Measured inventory — what exists here (2026-09-08)

| Asset | Count | Size | Disposition |
|---|---|---|---|
| Theme CSS sources | 132 files | 1.2 MB | **COPY** → P1 authors them in `zk`; template master receives the generated snapshot per release (D18) |
| CSS build + check scripts | 16 | — | **COPY** (subset) → the template needs a standalone build a customer can run |
| Java integration classes | 5 | — | **TWO VARIANTS** → P1 authors core-registration in `zk`; the jar-registration variant here **stays** as the template's |
| Preview / use-case ZULs | 159 (9 use-case) | 9.2 MB | **COPY** → P2 builds a javax preview module in `zk`; this repo's jakarta Spring Boot app remains the template's |
| Playwright specs | 13 + config | — | MOVE → P2 (maintainer harness, not a customer deliverable) |
| Screenshot baselines (compared) | **199** PNG | ~11 MB | MOVE → P2, as the migration oracle (D16) |
| Forced-colors review artifacts | 99 PNG | ~6 MB | DROP — always dirty, never compared, regenerate on demand |
| `doc/spec/` (normative) | 26 | — | MOVE → P3 |
| `doc/contracts/` | 114 | — | MOVE → P3 |
| `doc/` process documents | 22 | — | TRIAGE → P0 |
| `tasks/` working notes | 65 `.md` | 2.8 MB | mostly ARCHIVE → P0 |
| Memory files | 64 | 308 KB | MERGE-INTO-SKILL → P3 |
| Subagents | 5 (1 821 lines) | — | MOVE → P3 |
| Skills | 7 | ~2 MB | see 5.3 |

### 5.2 Target-repository facts (verified in `ZK10/zk`, branch `marble`)

| Fact | Where | Why it matters |
|---|---|---|
| Pure-CSS minify task already exists | `build.gradle:152–165` (`compileCSS`) | D14 option B's starting point; reads `web/<project>/css` |
| LESS compile task to retire | `build.gradle:198` (`compileLess` → `node_modules/.bin/zklessc`) | The task P1 deletes |
| Root npm infrastructure present | `package.json`, `node_modules`, gulp, postcss, `zkless-engine` | Marble's node build has a host |
| `zul` LESS to convert | 67 files (26 in `zul/less/`) | Plus 85 `zkmax` + 8 `zkex` |
| Existing `zul/.../zul/css/` | 1 file (`zk.wcs`) | The destination is effectively empty |
| `zksandbox` pins an external theme | `zksandbox/build.gradle:39` → `org.zkoss.theme:iceblue_c:10.3.0.1-Eval` | Must be dropped; relevant to D15-A |
| `zktest` is a separate Gradle build | `zktest/settings.gradle`, pages under `src/main/webapp/web` | Alternative preview host; also the P4 gate |
| Skill mechanism already live | `.claude/skills/show-me`, `.claude/rules/` ×3, `skills-lock.json` | P3 has somewhere to land |
| Existing root `CLAUDE.md` | 33 lines | Small enough to extend rather than replace |

### 5.2b Evidence behind the D16 reversal (measured 2026-09-08)

| Fact | Value / location | Bearing on D16 |
|---|---|---|
| Theme's target ZK version | `pom.xml` → `11.0.0-jakarta.FL.20260904` | Same line as the target repo, so the core version is **not** a confound |
| Target repo version | `ZK10/zk/gradle.properties` → `11.0.0-SNAPSHOT` | as above |
| Target repo servlet flavour | `zk/build.gradle:20`, `zul/build.gradle:9` → `javax.servlet` | Preview *host* must change (Spring Boot 3.x needs jakarta); does not affect pixels |
| Gallery tolerance | `gallery-scan.spec.ts:65` → `maxDiffPixelRatio: 0.01` | 1% of a full page is thousands of pixels — far too loose to certify a migration |
| Tablet tolerance opt-ins | `tablet.spec.ts:438,448` → `0.02` for tabbox, window | Known sub-2% render noise; must be handled explicitly in the zero-tolerance run |
| Baseline composition | 99 `*-gallery` + 70 state + 30 `*-tablet` = **199** compared; 99 `*-forced-colors` = review artifacts | The cost of carrying them is 199 images, not 298 |

Note: the root `CLAUDE.md` still states ZK 10.4.0 as the theme's target version. `pom.xml` says
`11.0.0-jakarta.FL.20260904`. The doc is stale; `pom.xml` is authoritative.

### 5.3 Skill classification

| Skill | Files | Nature | Disposition |
|---|---|---|---|
| `zk-component-rules` | 97 (68 component files) | Explicitly **theme-independent**; its own description says theme-builders consult it | MOVE to `zk` — belongs there regardless of this migration |
| `zul-writer` | 24 | ZK-portable authoring rules | MOVE to `zk` |
| `css-theme-audit` | 3 | Marble-specific tooling | MERGE into `marble-theme` |
| `important-reduction` | 3 | Marble-specific tooling | MERGE into `marble-theme` |
| `show-me` | 1 | Third-party (`humanlayer/skills`) | Already in `zk` — do not copy |
| `impeccable` | 52 | Generic frontend-design skill | INSTALL if wanted; not Marble content |
| `plan-spec` | 1 | Personal working-style skill | Not migration content |

Only **two** of the seven skills are Marble knowledge, and both are small. The Marble knowledge is
not in the skills today — it is in memory and in `doc/spec/`. That is precisely the gap P3 closes.

### 5.4 Memory → skill mapping

`MEMORY.md`'s section headings already partition the 64 files along the lines the skill needs, which
makes P3 a re-homing exercise rather than an authoring one:

| `MEMORY.md` section | Destination |
|---|---|
| CSS Architecture | `reference/layers.md`, `reference/css-dsp.md`, `reference/pitfalls.md` |
| Tokens & Naming | `reference/tokens.md` |
| ZUL Authoring | `reference/zul-authoring.md` |
| Visual Regression / Screenshots | `reference/verification.md` |
| Tablet / Responsive | `reference/verification.md` + `doc/spec/` equivalents |
| ZK Version / Components | `zk-component-rules` (theme-independent) or `zk`'s `CLAUDE.md` |
| Shell Quirks, Environment | Machine-local; **do not** migrate — they describe this machine, not the theme |
| Active Workstream | Migration state; ends with P4 |
| Working Style | Personal; not migration content |

Roughly a quarter of the memory files are machine-local or workstream state and should *not* travel.
The migration is smaller than 64 files, but the classification has to be done file by file.

### 5.5 Change log

- **2026-09-08** — document created. Supersedes nothing; the risk assessment stays authoritative for
  the *risk profile* and the CSS-conversion order, and this plan extends its scope from "convert the
  CSS" to "make this workspace unnecessary". D10–D12 remain dismissed and are not re-raised here.
  D13 (which directory to launch Claude in) is resolved by §4: two sessions, one per side.
- **2026-09-08** — **D14=A, D15=B, D17 ruled; D16 reversed; D18 opened.** D16's original
  recommendation (discard the baselines and re-cut) was withdrawn: it rested on "P1 invalidates them
  anyway", which is false — P1 moves paths, not pixels, and D14-A keeps the minifier. The baselines
  are now the migration's verification oracle, to be run once at zero tolerance because the standing
  1% ratio would go green over real drift. D17's ruling (template `master` becomes Marble, new
  `iceblue` branch) reshaped the zkthemebuilder fix from "pin the submodule" to "retarget it at
  `iceblue`", promoted that from stray cleanup to a consequence of the ruling, and surfaced D18 —
  two intentional copies of Marble need a source-of-truth rule.
- **2026-09-08** — **D18=A ruled: `zk` is the single source of truth; the template gets a one-way
  generated snapshot at release time.** The interesting consequence was not in the build but in the
  inventory: because the template must stay a working forkable project, the CSS, the CSS build and
  the preview app become **copies** rather than moves, and the Java integration classes become **two
  live variants** (core-registration in `zk`, jar-registration here). §5.1's disposition column was
  corrected, and the organising principle now stated in §1 — *maintainer assets move, customer-facing
  deliverables are copied with `zk` as truth* — falls out of this ruling. **No decisions remain
  open.**

- **2026-09-08 (fourth revision) — target-side session stood up; three measurements changed the plan.**
  The two-session topology is live and verified (cross-session messaging needs zero configuration).
  The target session's read-only report plus local measurement produced: (a) **P0 reordering** —
  dropping `--remote` is order-independent and immediately protective, so it goes first, ahead of
  the branch cut, and `.gitmodules` gains `branch = iceblue` afterwards; (b) **a correctness
  precondition** — `new_theme` already deleted all 153 LESS files, so `iceblue` **must** be cut
  from `master`, and this also means P4's promotion is a divergent merge, raised as **D19**;
  (c) **the landing split is mechanical** — 87 files to `zk/zul`, 40 to `zkcml/zkmax`, 5 to
  `zkcml/zkex`, which retires the target side's CE-vs-EE question; and (d) **a suspected scope gap
  in `compileCSS`** — it only sees `web/<project>/css`, which is 38 of Marble's 132 files, so the
  "one node CSS task for another" estimate may be optimistic. Also confirmed: the target repo's
  `.claude/skills/` is empty and it has no `agents/` or `commands/`, so P3 is greenfield with zero
  naming collisions.

- **2026-09-08 (fifth revision) — P1's shape settled by the target session's read-only analysis.**
  `compileCSS` turned out to be a no-op, `compileLess` structurally cannot see `.css`, and today's
  `css/` directories are LESS *output* — so P1 became "wrap `build-css.js` in its own Gradle task",
  and gained two hard constraints (delete LESS in the same commit, because both pipelines write
  `.css.dsp` into one directory under `DuplicatesStrategy.INCLUDE` with no ordering; and edit
  *two* build files, since `zkcml/build.gradle:265`/`:280` duplicate the definitions). The target
  session raised the extension question (plain `.css` vs `.css.dsp`) as a decision and two count
  discrepancies as possible dead files; **all three dissolved on measurement** — Marble already
  emits `.css.dsp`, `npm run check:css-dsp` reports `MISSING: 0`, the count gap is deliberate
  bundling, and a build-time orphan guard makes dead component CSS impossible. Net effect: P1's
  registration risk went to zero while its build-integration work grew slightly. Doc drift noted:
  `doc/spec/data-dense-mode.md` claims a shipped `marble-compact.css` that does not exist.

- **2026-09-08 (sixth revision) — P2's preview module resolved from precedent instead of design.**
  The target session surveyed `zksandbox`, `zktest` and the composite-build module shapes. Result:
  a three-source recipe (independent root build for structure, `zktest`'s `dependencySubstitution`
  for wiring, `zksandbox`'s 64-line skeleton for the container, `ZKTestServlet`'s 31 lines for the
  shell), plus a **second, independent disqualification of `zksandbox`** — it has no
  `dependencySubstitution`, so CSS edits would need `publishToMavenLocal` to appear. Also measured:
  a plain subproject would inherit `compileLess`/`compileCSS` from the root `subprojects` block and
  reintroduce the output collision, so the independent-root-build shape is load-bearing, not
  stylistic; and the javax ceiling is `gretty 3.1.1` + `jetty 9.4`, because jetty 11+ is jakarta.
  `ZKTestServlet`'s `?zktheme=` cookie switch is a ready-made control surface for the D16
  comparison. D19's scope was narrowed to `zkThemeTemplate` explicitly — `zk` and `zkcml` have zero
  divergence between `master` and `marble`, so their eventual merge is a fast-forward.

- **2026-09-09 — MOVE narrowed, and ARCHIVE turned out to be undefined for `tasks/`.** The user's
  rule (MOVE → COPY unless version-controlled) was accepted and then measured: `.gitignore:35`
  ignores `tasks` wholesale, so **0 of 91 files are tracked** — including this plan, the manifest,
  all six Jess documents and `lessons.md`. Those 12 became STAGED COPY with deletion gated on P2.
  `doc/` (486/488) and the Playwright harness (15/15) are tracked, so MOVE stands there. The same
  discovery made ARCHIVE vacuous for `tasks/` — there is no history to stay in — raised as **D20**.
