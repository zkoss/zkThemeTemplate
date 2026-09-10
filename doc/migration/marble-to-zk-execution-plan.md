# Marble → zk Migration — Execution Plan (Planner · Generator · Evaluator)

**Status:** **D21 and D22 ruled 2026-09-10.** **3.1, 3.2, 3.3, 3.15, 3.16 PASSED** (verdicts in [gates/](gates/)); **P3 paused — D24: P1 runs next**, the `zk`-side P3 items resume after the P1 and P2 gates. **P1: all 14 items PASSED** (1.0, 1.0b, 1.1, 1.2, 1.3a, 1.3b, 1.3b2, 1.3c, 1.4, 1.5, 1.5b, 1.6, 1.7, 1.8 — verdicts in [gates/](gates/)); **P1 gate pending** (procedure proposed below, awaiting approval). `zk`/`zkcml` commits carry **ZK-6112** (D23). Rows 3.1 / 3.2 / 3.4 / 3.9 amended, 3.15 / 3.16 / 3.18 added per [planner-cold-start-findings.md](planner-cold-start-findings.md) F1. · **Written:** 2026-09-09 · **Revised:** 2026-09-10
**Governs:** [marble-to-zk-migration-plan.md](marble-to-zk-migration-plan.md) — that document says
*what* and *why*; this one says *how each item is run, by whom, at what size, and how it is proven*.

---

## 1. Executive Summary

### The problem this document solves

The migration plan holds 31 open work items across P1–P4. Several of them, run as written, would
load more into one agent's context than that agent can hold well — P2's zero-tolerance comparison
alone produces 199 diff reports, and P3's "re-point every path the 5 subagents cite" means 132 KB
of agent definitions in one pass. An agent whose context is mostly filler makes worse decisions on
the part that matters. So every item below is **sized, split where necessary, given exactly one
verification, and assigned to the three roles**.

### The sizing rule

The user's proposal was: choose the executor model, take its context window, set a safe ceiling,
split anything that would exceed it. That is the right instinct, and it is adopted with one change
that makes it **measurable before the run instead of observable after it**:

> **Size an item by its working set — the bytes an agent must actually read plus write to do the
> job — not by the model's window.**

Two reasons. First, degradation is driven by how much *is loaded*, not by how close to the hard
limit it sits; a budget pinned to a window invites filling it. Second, the working set can be
measured with `wc -c` today, for every item, before choosing a model — so the plan does not have
to be redone if the executor changes. The budget is therefore stated in bytes and is deliberately
conservative enough to hold for every model in the current family without pinning any one window:

| Budget | Value | Why |
|---|---|---|
| **Working set per agent run** | **≤ 100 KB** of files read + written (≈ 25 K tokens) | Leaves the majority of any window for tool output, the skill (82 KB if it triggers), reasoning and the brief |
| **Split threshold** | any item measured **> 100 KB** is split until every part fits | Splits are along natural seams (per module, per file, per Playwright project), never arbitrary |
| **Output cap** | an Evaluator's *report* ≤ 20 KB; larger evidence goes to a file the Planner reads selectively | The comparison items produce more output than input — the cap is on what comes *back* |

**Second gate, independent of size: one item, one verification.** If proving an item done needs two
different checks, it is two items. This is what makes each Generator run auditable by an Evaluator
that never saw the Generator's reasoning.

### The three roles

| Role | Who | Sees | May write |
|---|---|---|---|
| **Planner** | **a new session rooted in `ZK10/zk`**, with `zkThemeTemplate` added as a working directory | the plan, every Evaluator verdict, nothing a Generator read | the plan documents; authorises every `zk` write in the repository it touches |
| **Generator** | a fresh subagent per item, spawned by the Planner | its brief + the item's working set | the item's target files only |
| **Evaluator** | a *different* fresh subagent per item | the verification command and its output; **not** the Generator's transcript | nothing — read-only, returns a verdict |
| **External Evaluator** | the **old `zkThemeTemplate` session** — for the four judgement gates only | the verdict files, nothing else | nothing; and it may **not** approve a write on the Planner's behalf |

Generator and Evaluator are never the same agent, and neither carries state between items. State
lives in files: the plan's checkboxes, the Evaluator's verdict files under `doc/migration/gates/`.

### Executor models — ruled (D22)

| Role | Proposed | Reason |
|---|---|---|
| Planner | this session, whatever model it runs | continuity of judgement; it holds every ruling |
| Generator | **Sonnet 5** | items are sized to be mechanical once briefed; cost and speed matter across ~45 runs |
| Evaluator | **Opus 5** for the three judgement gates (P1 composite build, P2 zero-tolerance ledger, P3 cold-start drill); **Sonnet 5** for the count-and-grep checks | judgement where a false pass is expensive; economy where the check is a number |

### Where it runs — ruled (D21)

**One Planner session, rooted in `zk`, with the template repository added as a working directory.**
Role separation comes from subagents, not from sessions — Generator and Evaluator are fresh
subagents that never see each other — so a second Planner session buys coordination cost without
buying isolation. The session is rooted in `zk` because that is where 40 of the 45 items write:
`zk`'s own `CLAUDE.md`, rules and (after P3) skill load automatically, and irreversible writes are
authorised in the repository they touch. The five Source-side items are reached through the added
directory. The old `zkThemeTemplate` session is kept only as the **external Evaluator** for the four
judgement gates — the one place a separate session is stronger than a subagent, because it cannot
see even the Planner's reasoning. **This is deliberately a fresh session:** every ruling now lives in
tracked files, and a Planner that can start from them alone is the migration's own cold-start drill
run early.

### Counts

| Phase | Items in plan | Items after sizing | Splits | Writes land in |
|---|---|---|---|---|
| P1 | 5 | **14** | LESS deletion and the Gradle task each split per repository; 1.0 / 1.0b (deps) added, 1.3 split into 1.3a / 1.3b / 1.3b2 / 1.3c (F26, F30, F31); 1.5b folds the reset into the base provider (D29, F39) | `zk` / `zkcml` |
| P2 | 6 | **9** | the zero-tolerance comparison split by baseline family (99 / 70 / 30) | `zk` |
| P3 | 6 | **16** | agent re-pointing split per agent (5); contracts split in two (47 + 47); 3.15–3.16 added for the two skills §A.7 rules MOVE (F13); 3.18 for the uncovered `doc/` paths (F17) | `zk`; three items (3.1–3.3) in the template repo via the added directory |
| P4 | 8 | **15+** | coverage gaps one per component (6); icon fallout per class family; Jess resumed as its own series | `zk`; 4.6–4.7 in the template repo |

---

## 2. Work Breakdown

Column key — **WS**: measured working set in KB (files read + written). **Gen / Eval**: the model.
**Verify**: the single command or artefact that decides pass/fail; the Evaluator runs exactly this
and nothing else. ✂ marks an item that was split from the plan's original.

### P1 — Build Integration (all Target writes)

| # | Item | WS | Gen | Eval | Verify |
|---|---|---|---|---|---|
| 1.1 | Add a `compileMarbleCss` Gradle task in `zk/build.gradle` that shells out to the ported `build-css.js --module zul`; leave `compileLess` in place for now (F25: it and `compileCSS` go in 1.6) | ~10 | Sonnet | Sonnet | `./gradlew :zul:compileMarbleCss` exits 0 and the CE codegen tree holds **exactly 46** `.css.dsp` (F28; 86 is the all-module total) |
| 1.2 ✂ | Same task in `zkcml/build.gradle` (the duplicate definition), calling the script in `zk` with `--module zkmax` / `--module zkex` | ~10 | Sonnet | Sonnet | `zkmax` codegen holds **33** and `zkex` **7** `.css.dsp` (F28) |
| 1.0 | Add `lightningcss` and `lucide-static` to `zk`'s `devDependencies`, pinned to the template's installed versions so the minifier is byte-identical (D27, F21) | < 1 | Sonnet | Sonnet | `node -e "require('lightningcss')"` succeeds from `zk`, `node_modules/lucide-static/icons` exists, both names in `package.json` |
| 1.0b ✂ | Add `@fontsource-variable/inter` (5.2.8, the template's installed version) — the Inter woff2 files the builder vendors (F30) | < 1 | Sonnet | Sonnet | `node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2` exists; the pinned entry is in `package.json` |
| 1.3a ✂ | Copy the 87 CE sources by path: `src/main/resources/web/{zul/css,js/zul}/**/*.css` → `zul/src/main/resources/web/…` (same tail; the template already has no `marble/` segment) | paths | Sonnet | Sonnet | 87 files present and `cmp`-identical to the originals |
| 1.3c ✂ | In `zk`'s copy of `zul/css/tokens/_fonts.css`, rewrite the four `~./marble/font/` strings to `~./zul/font/` (F31) — the only CE source that intentionally differs from the template | < 1 | Sonnet | Sonnet | `grep -rl 'marble/'` over the 87 copied sources = 0; exactly one of the 87 differs from its original and it is `_fonts.css` |
| 1.3b ✂ | Port `build-css.js` and `check-css-dsp.js` into `zk/scripts/` per F26: `--module zul\|zkmax\|zkex`, `--out` override, output `<module>/codegen/resources/web/`, lang files read per module, side outputs behind `--emit-docs`, no hardcoded `/Users/…` | 50 read + ~50 written | Sonnet | Sonnet | `node scripts/build-css.js --module zul --out $T` emits **46** `.css.dsp`; `node scripts/check-css-dsp.js --module zul --theme-dir $T` prints `MISSING : 0` (grep the whole output, F32) |
| 1.3b2 ✂ | Restore `copyFonts` in the ported builder: the three Inter files from `@fontsource-variable/inter` land in `zul/font/` under the `--module zul` output root (F30) | ~5 | Sonnet | Sonnet | after a build to `$T`: 46 `.css.dsp`, `MISSING : 0`, the three files under `$T/zul/font/`, and `grep -rl marble $T` is empty |
| 1.4 ✂ | Copy 40 sources → `zkcml/zkmax/src/main/resources/web/…` (27 `js/zkmax/**/css` + 13 `zkmax/css/tablet/`), 5 → `zkcml/zkex/…` | paths | Sonnet | Sonnet | 40 / 5 files present and `cmp`-identical; `build-css.js --module zkmax` → 33, `--module zkex` → 7 outputs (F28) |
| 1.5 | Author the **core-registration** variant per D26 / D28: `org.zkoss.zul.theme.MarbleThemeProvider extends StandardThemeProvider` (reset insertion, `browserDefault` switch kept), `zul/zk.xml` → it, zkex's provider re-based on it, `MarbleBrand`/`MarbleDensity` in `org.zkoss.zul.theme`, `StandardTheme.DEFAULT_NAME/DISPLAY` → marble/Marble, `dom.ts` synced; jar plumbing not carried | ~25 | Sonnet | **Opus** | `zul` compiles + `checkstyleMain` clean; `zkex`/`zkmax` compile; static wiring present; a fresh CE build's `norm.css.dsp` has `--zk-color-primary` and the output has no `marble/` (F34 — runtime proof in 2.1; `npm run lint` belongs to the P1 gate, F41) |
| 1.5b | Fold the reset insertion into `StandardThemeProvider.getThemeURIs` itself per D29 (supersedes D26's subclass): delete `MarbleThemeProvider`, return `zul/zk.xml` and zkex's provider to their committed text, document `org.zkoss.zul.theme.browserDefault` on the base class; the three ported-script comments that name the deleted class follow | ~6 | Sonnet | **Opus** | `MarbleThemeProvider.java` absent; `zul/zk.xml` and zkex's `StandardThemeProvider.java` show **no diff** against HEAD; the base class names both reset files and the property; `grep MarbleThemeProvider` over `zul/src`, `scripts/`, `zkex/src`, `zkmax/src` = 0; `zul` compiles + `checkstyleMain` clean; `zkex`/`zkmax` compile |
| 1.6 ✂ | `git rm` the **67** `zul` LESS files (F23); remove `compileLess` **and** `compileCSS` (F25) from `zk/build.gradle`; drop the `font-awesome.css.dsp` line from `zul/css/zk.wcs` (F24); remove the orphaned `zkless-engine` dependency and gulp `build:minify-css` (F37) — **same commit range as 1.1 + 1.3** | paths + 17 | Sonnet | Sonnet | `git ls-files 'zul/**/*.less'` = 0; the removed names absent from `build.gradle`, `zk.wcs`, `package.json`, `gulpfile.js`; `./gradlew :zul:processResources` green and writes exactly 46 `.css.dsp` (basename uniqueness was checked and holds for `zul`, but is not an invariant — F42; stale outputs are the P1 gate's `clean` build's concern, F43) |
| 1.7 ✂ | `git rm` the 85 + **8** `zkmax`/`zkex` LESS files (F23) and remove `compileLess` + `compileCSS` from `zkcml/build.gradle` — same commit range as 1.2 + 1.4 | paths + 31 | Sonnet | Sonnet | same checks over `zkcml`: LESS = 0, names absent, `:zkmax:processResources :zkex:processResources` green writing 33 + 7 (the basename-uniqueness clause was dropped after a false FAIL — F42) |
| 1.8 | Add `checkMarbleCss` Gradle tasks (both build files) running the ported `check-css-dsp.js --module <module>`, wired into `check`; `-PmarbleCssThemeDir` overrides the dir (F38) | ~8 | Sonnet | Sonnet | negative control without deletion: the task passes on codegen and **fails** on a temp copy missing one registered `.css.dsp` |
| **P1 gate** | Composite `zk` + `zkcml` build green from `clean`; the jars carry exactly the Marble CSS set and no LESS | — | — | **Opus** + external | `bash doc/migration/tools/gate-p1.sh <n>` for n = 1…6, one Bash call each, in order (procedure below — **proposed, awaiting approval**); verdict `gates/P1.md`; external-evaluator note appended |

#### P1 gate — procedure (proposed 2026-09-10, awaiting the user's approval)

The gate is the first *judgement* gate, so it follows the standing rules: an **Opus** Evaluator runs
the verification and writes the verdict; the verdict file is then handed to the `zkThemeTemplate`
session (found through `ListAgents`) as the **external Evaluator**, whose note is appended to the
verdict — it judges, it does not approve; the commit still waits for the user.

The verification is a tracked script, [tools/gate-p1.sh](tools/gate-p1.sh), because the Evaluators
paraphrased inline commands twice (F40, F42). Its six stages are run in order, one Bash call each
(600 s ceiling), and each prints `STAGE n OK` or `STAGE n FAIL at: <check>`:

| Stage | Repo | What it proves |
|---|---|---|
| 1 | `zk` | `gradle clean` (deletes every `codegen/`, F43) then `:zul:assemble` — the whole CE chain builds without LESS |
| 2 | `zk` | the static checks CI's `gradle clean build` runs: `checkstyleMain`, per-module eslint (`jscheck`) and `npm run type-check` (`tscheck`) — not `npm run lint -- .`, which fails on any checkout (F45) |
| 3 | `zk` | `zul-<version>.jar` holds **46** `.css.dsp`, `reset.css` + `reset-embed.css`, the 2 Inter woff2 files, **no** `.less`, no `marble/` segment; reports how many Font Awesome binaries ride along (F36) |
| 4 | `zkcml` | `gradle clean` then `:zkex:assemble :zkmax:assemble` |
| 5 | `zkcml` | `checkstyleMain` clean; `zkex` jar **7** and `zkmax` jar **33** `.css.dsp`, no `.less` |
| 6 | both | the 1.8 `checkMarbleCss` tasks pass on the fresh codegen (`MISSING : 0` ×3) |

Not in this gate, by design: `gradle build` (runs `zktest`; P4 owns the front-end test rebaseline)
and any runtime rendering check (P2 owns 2.1). The Planner dry-runs the script once before dispatch
and records the stage timings in the verdict, so a 600 s ceiling breach is a Planner defect, not a
Generator one. **Dry-run 2026-09-10 (final P1 tree, all six stages green):** 204 s · 64 s · < 1 s ·
33 s · 9 s · 2 s — the first stage-2 attempt failed on `npm run lint -- .` and was rewritten to what CI
runs (F45).

The version-drift checker the plan notes as missing is **not** in P1: it does not exist here either,
so there is nothing to port. It is a P4 item beside the D18 sync script, where it is needed.

### P2 — Verification Environment (Target writes; Source supplies)

| # | Item | WS | Gen | Eval | Verify |
|---|---|---|---|---|---|
| 2.1 | Stand up the preview module: independent root build + `includeBuild`, `zktest`-style `dependencySubstitution`, the 64-line container skeleton, the 31-line servlet **verbatim** | ~6 + skeletons | Sonnet | **Opus** | one hand-written ZUL returns HTTP 200 **and** in-page `document.styleSheets` shows > 0 `--zk-*` declarations (the theme-not-served guard from the skill) |
| 2.2 | Move the 159 preview / use-case ZULs + the SPA host into the module (path move) | paths | Sonnet | Sonnet | Playwright `smoke` project: every page 200 with a composed body |
| 2.3 | Move the Playwright harness (323 KB of specs, **moved not read**) and re-point `baseURL` | config only | Sonnet | Sonnet | `--project=smoke` green against the new host; `PREVIEW_URL` default updated in exactly the files the indirection doc names |
| 2.4 | Drop `zksandbox`'s `iceblue_c` theme-jar pin | < 1 | Sonnet | Sonnet | `zksandbox` builds; `grep -c iceblue_c zksandbox/build.gradle` = 0 |
| 2.5 | **Decide** live-reload: rebuild for the javax host, or drop it; record the outcome in `reference/verification.md` | doc only | Planner | Sonnet | the skill states which is true and the stated command works (or is stated as absent) |
| 2.6 ✂ | Zero-tolerance comparison — **gallery family, 99 baselines** | output-heavy | Sonnet | **Opus** | a diff ledger file: one line per baseline, `IDENTICAL` or a named cause; **zero unexplained rows** |
| 2.7 ✂ | Zero-tolerance — **state family, 70** (hover / focus / active) | output-heavy | Sonnet | **Opus** | same ledger shape |
| 2.8 ✂ | Zero-tolerance — **tablet family, 30** (mobile UA project) | output-heavy | Sonnet | **Opus** | same; tablet's two known 2 % opt-ins must be *explained*, not absorbed |
| **P2 gate** | The three ledgers together cover 199 rows with every difference explained; normal tolerances restored afterwards | — | — | **Opus** | ledger row count = 199; unexplained = 0; verdict file |

The comparison is split by family because the evidence *returned* is the problem, not the input:
one Evaluator judging 199 diffs would spend its context on the first 60. Each family is also a
different Playwright project, so the split follows an existing seam.

### P3 — Knowledge Encapsulation (Source authors, Target commits)

| # | Item | WS | Gen | Eval | Verify | Repo |
|---|---|---|---|---|---|---|
| 3.1 | **Merge `css-theme-audit` + `important-reduction` into `marble-theme`** (2 `SKILL.md` = 22 KB read; 4 scripts = 29 KB **moved by `git mv`, not read**; see `planner-cold-start-findings.md` F1) | ~70 | Sonnet | Sonnet | `cd /Users/hawk/Documents/workspace/zkThemeTemplate && S=.claude/skills/marble-theme/scripts && T=$(mktemp -d) && bash $S/audit-css.sh --out $T/audit.md >/dev/null && test -s $T/audit.md && node $S/check-default-display.js --out $T/dd.md >/dev/null && test -s $T/dd.md && node $S/count-important.js | tail -1 && (node $S/probe.js >/dev/null 2>&1; test $? -eq 2) && npm run check:doc-links && test ! -e .claude/skills/css-theme-audit && test ! -e .claude/skills/important-reduction && test "$(find .claude/skills/marble-theme -type f ! -name .DS_Store | wc -l | tr -d ' ')" = 17` — all four scripts run from the new location, `check:doc-links` clean, both old skill dirs gone, skill file count **17** | template |
| 3.2 | Build the **path-rewrite map**: every distinct repo-relative path string in the skill, the 5 agents and `doc/spec` (**101** measured 2026-09-10 by `doc/migration/tools/check-path-map.js --list`; the plan's 63 was a lower bound) → the checked-in table `doc/migration/path-rewrite-map.md`, one row per string with a disposition (MAP / OUTPUT / STALE / DROP / DEFER) and, for MAP rows, the `zk` target by mechanical prefix substitution per the ruled destination families (`planner-cold-start-findings.md` F12, user ruling 2026-09-10) | ~8 read + ~15 written | Sonnet | Sonnet | `cd /Users/hawk/Documents/workspace/zkThemeTemplate && node doc/migration/tools/check-path-map.js` exits 0 — every found string mapped, no extra rows, every MAP target mechanical, STALE sources absent, DEFER rows name their item. Existence in `zk` is checked where the plan already checks it: 3.5, 3.6, 3.10–3.14 (F11) | template |
| 3.3 | Draft the pointer paragraph for `zk`'s `CLAUDE.md` (its current one is 1 KB) | 17 | Sonnet | Sonnet | ≤ 15 lines; names the skill; no duplicated content | template (draft), landed by 3.9 |
| 3.4 | Copy `marble-theme` into `zk/.claude/skills/` and commit | ~130 (copy, moved not read) | Sonnet | Sonnet | `diff -r` between the two trees is empty; **17** files present (F1) | Target |
| 3.5 | Apply the path-rewrite map to the copied skill | map + 82 | Sonnet | Sonnet | `grep` for every *source* prefix in the copy = 0; every rewritten path exists in `zk` (the existence loop already used today) | Target |
| 3.6 | Copy `doc/spec/` — 26 files, 365 KB, **copied by path, not read** (F15: every P3 "move" is a copy until P4); then apply the map. Run after 3.8 and 3.18 | map + index | Sonnet | Sonnet | `doc/spec/index.md` links all resolve in `zk`; 26 files present | Target |
| 3.7 ✂ | Move `doc/contracts/` **first half** (47 `.md` + their mockups) | paths | Sonnet | Sonnet | count; the harness's contract loader finds them | Target |
| 3.8 ✂ | Move `doc/contracts/` **second half** (47 + remaining mockups + `baselines/`) | paths | Sonnet | Sonnet | total 94 + 19; loader finds all | Target |
| 3.9 | Land the `CLAUDE.md` pointer in `zk` — the approved draft is `doc/migration/drafts/zk-claude-md-pointer.md` (9 lines; verdict `gates/3.3.md`; approved by the user 2026-09-10) | 1 + draft | Sonnet | Sonnet | the section appended to `zk/CLAUDE.md` is byte-identical to the approved draft | Target |
| 3.10–3.14 ✂ | Move and re-point **one subagent each** (5 items; 132 KB total, 16–40 KB each) — fix the two stale `tasks/gen-reports/` references on the way | ≤ 40 each | Sonnet | Sonnet | per agent: `grep -c 'tasks/'` = 0; every cited path exists in `zk`; agent frontmatter still parses | Target |
| 3.15 | Copy `zk-component-rules` (97 files, theme-independent; appendix §A.7 rules MOVE) into `zk/.claude/skills/` — added 2026-09-10 (F13) | 97 files copied by path | Sonnet | Sonnet | `diff -r` between the two trees is empty; `find -type f \| wc -l` = 97 in `zk` | Target |
| 3.16 | Install `zul-writer` in `zk` the way this repository has it — through the skills tool from `zkoss-demo/agent-skill`, recorded in `zk`'s skills lock; **never copy the symlink target** — added 2026-09-10 (F13) | < 1 | Sonnet | Sonnet | `zk/.claude/skills/zul-writer/SKILL.md` resolves through the symlink and its frontmatter parses; the lock file in `zk` has a `zul-writer` entry | Target |
| 3.18 | Copy the twelve `doc/` paths the map lists outside `doc/spec` and `doc/contracts` — 6 root `doc/*.md`, `doc/harness/` (4), `doc/screenshots/` (2) — into `zk/doc/` (F17; ruled 2026-09-10, chat D12-B). Run before 3.6 so `doc/spec/index.md`'s four outward links resolve | paths | Sonnet | Sonnet | each of the 12 paths exists in `zk/doc/` and `cmp` against the original is silent | Target |
| **P3 gate** | **Cold-start drill**: a session launched in `zk` with no prior context is given one real theme task and completes it using only the skill | — | fresh session | **Opus** (a different fresh session judges the transcript) | the task's own verification passes **and** the transcript shows zero reads outside `zk` | Target |

Item 3.5's rewrite is done on the *copy*, never on this repository's original — the original must keep
resolving here until P4 retires the workspace (plan §1, "maintainer assets move, deliverables are copied").

### P4 — Cutover & Archive

| # | Item | WS | Gen | Eval | Verify |
|---|---|---|---|---|---|
| 4.1 | Baseline the unmodified fork: full `zktest` run **before** any P1 commit lands | output-heavy | Sonnet | Sonnet | a results file with pass / fail / skip counts, committed under `doc/migration/gates/` |
| 4.2 ✂ | Icon fallout — one item per icon-class **family** (sizing, stacking, the `z-icon-*` glyph set); count decided by 4.1's failure list | per family | Sonnet | Sonnet | `zktest` failures in that family: 0 |
| 4.3 ✂ | Coverage gaps — **one item per component**: codeeditor, scrollview, video, skeleton, sliderbuttons (the plan's "6" is 5 named; the sixth is confirmed or dropped by 4.1) | per component | Sonnet | Sonnet | preview page renders (smoke) and the component's contract passes |
| 4.4 | Port the tablet layer onto the runtime density model | 13 tablet partials + `_sizing.css` | Sonnet | **Opus** | Playwright `tablet` project green under the mobile UA; desktop UA shows the tablet sheet **not** in `document.styleSheets` |
| 4.5 | Write the D18 sync script beside the release tooling, **with** the version-drift check on the synced result | ~build-css paths | Sonnet | **Opus** | dry run produces a tree byte-identical to core's Marble CSS; the four version locations agree, and a deliberately drifted `Version.java` makes it fail |
| 4.6 | Execute D17 — promote Marble onto template `master` | — | **Planner** (irreversible; user-authorised) | Sonnet | `master` tree equals the theme branch tree; `git log` shows the chosen D19 shape | **blocked**: D19 + the `iceblue` branch (other workstream) |
| 4.7 | Mark template `master` as generated | < 1 | Sonnet | Sonnet | banner present in `README`/`CLAUDE.md`; a CI or hook refuses hand edits (or the decision that none is wanted is recorded) |
| 4.8 | Resume the 50 Jess issues in `zk` | — | — | — | **Not sized here.** Each issue is its own Planner → Generator → Evaluator cycle with the tracker as the ledger; they start after the P4 gate |
| **P4 gate** | Full `zktest` triaged against 4.1's baseline; this workspace read-only | — | — | **Opus** | every new failure has a cause; no failure attributable to Marble remains |

---

## 3. Decisions

### D21 — Where do the Generators that write into `zk` run? — **RULED 2026-09-10: one new session rooted in `zk`**

Neither option below as written. The user relaxed the single-workflow constraint and asked
which was better, one session or two; the answer adopted is **one session, but a new one, rooted
in `zk`** with `zkThemeTemplate` added as a working directory — option A's mirror. Reasoning in §1.
The old session is retained as external Evaluator for the judgement gates and nothing else.
Consequence: the migration plan's §4 is rewritten; the two-session *ownership split* is retired.

**Original background.** The request is one workflow, driven from this session as Planner, covering every
phase. But Workflow subagents inherit this session's permissions, which exclude `ZK10/zk`, and the
plan's §4 deliberately gives every `zk` write to the other session.

- **【A】Extend this session to `zk` (recommended for what was asked):** add `ZK10/zk` and
  `ZK10/zkcml` as working directories of this session (`/add-dir`), so Generator subagents can write
  there. Planner, Generator and Evaluator all live under one permission boundary and one workflow.
  The peer session becomes unnecessary — or is kept as an *external* Evaluator for the three
  judgement gates, which is a stronger separation than a subagent. **Cost:** §4's ownership split is
  superseded and must be rewritten; every irreversible `zk` write is now authorised *here*.
- **【B】Keep §4; run two workflows:** this session's workflow covers only Source-side items (3.1–3.3,
  4.6–4.7); each Target-side item is sent as a complete brief to the peer session, which runs its own
  Planner → Generator → Evaluator workflow and returns the Evaluator's verdict. **Cost:** two
  Planners, no single workflow over the whole migration, and the interleaving cost §4 already
  recorded — but permission boundaries stay exactly where they are.

### D22 — Executor models — **RULED 2026-09-10: as proposed**

§1's proposal stands: Generator = Sonnet 5; Evaluator = Opus 5 on the four judgement
gates (P1 build, P2 ledgers, P3 cold-start, P4 triage) and 4.4 / 4.5, Sonnet 5 elsewhere; Planner =
this session. The sizing does not depend on the answer — that is the point of budgeting by working
set — but the workflow script names the models, so it needs the ruling.

### D23 — Tracker issue for every `zk` / `zkcml` commit — **RULED 2026-09-10: ZK-6112**

`zk`'s commit convention requires `ZK-XXXX: short description`; no document recorded the issue
(finding F16). The user supplied <https://zkoss.atlassian.net/browse/ZK-6112>. Template-repository
commits keep that repository's conventional-commit style.

### D24 — Phase order after the pilot — **RULED 2026-09-10: P1 before the `zk`-side P3 items**

The kickoff started with P3 because 3.1–3.3 are template-side and risk-free. Finding F18 showed
that 3.5, 3.7–3.8 and 3.10–3.14 verify against locations only P1 and P2 create. Of the options put
to the user (run now with a deferred-existence ledger / P1 first / only the dependency-free items),
**P1 first** was chosen. 3.15 and 3.16 had already run, dependency-free; the rest of P3 resumes after
the P1 and P2 gates. Open before P3 resumes: the `.gitignore` policy for `zk/.claude/` (F19).

### D25 — `zk/.gitignore` and the skill tree — **RULED 2026-09-10 (chat D30-A)**

`zk` ignores `.claude/` wholesale (F19). Ruled: `.claude/` → `.claude/*` with `!.claude/rules/`,
`!.claude/skills/`, `!.claude/agents/`, and explicit ignores for the two third-party symlinks
`.claude/skills/show-me` and `.claude/skills/zul-writer` (they point into the ignored `.agents/`).
The Planner's hunk is staged on its own, never the whole file, because `.gitignore` carries another
session's uncommitted line.

### D26 — Item 1.5, the core design — **RULED 2026-09-10 (chat D31-B)**

Per F24's table: the theme-prefix rewrite is dropped; `font-awesome.css.dsp` leaves `zul/css/zk.wcs`;
`Themes.register`, `Version`, `config.xml`, `lang-addon.xml`, `zk.xml` plumbing are not carried.
**The `org.zkoss.zul.theme.browserDefault` library-property switch (reset.css vs reset-embed.css)
is a specification that cannot change and must keep working — the IceBlue side relies on it too.**
So the reset insertion lives in a small provider subclass in `zul` extending `StandardThemeProvider`
(overriding only `getThemeURIs`), `zul/zk.xml` points at it, and the `zkex` → `zkmax` provider
chain is re-based on it so EE receives the reset as well. `MarbleBrand` / `MarbleDensity` move to
`org.zkoss.zul.theme` with their names unchanged.

**Superseded 2026-09-10 by D29** for *where* the insertion lives; the `browserDefault` requirement in bold above stands.

### D27 — Build dependencies in `zk` — **RULED 2026-09-10 (chat D32-A)**

`lightningcss` and `lucide-static` are added to `zk`'s `devDependencies` (F21). The builder stays
Lightning-based, as this plan's D14 decided; `zkcml`'s task calls the script in `zk`.

### D28 — Default theme name — **RULED 2026-09-10 (chat D33-A)**

`StandardTheme.DEFAULT_NAME` (`zweb`) becomes `"marble"`, and `zul/.../dom.ts:18` is synced. The
only `zkcml` use (`ResponsiveThemeRegistry:50`) keeps its meaning. Belongs to item 1.5.

### D29 — Where the reset insertion lives — **RULED 2026-09-10 (chat D34-A): in `StandardThemeProvider` itself**

The Opus gate on 1.5 (F39) showed the cost of D26's subclass: every customer provider that
`extends StandardThemeProvider` — the pattern ZK documents — keeps compiling after the upgrade but
silently loses Marble's reset stylesheet, and the EE chain has to read
`StandardThemeProvider extends …MarbleThemeProvider`. So the insertion moves into
`StandardThemeProvider.getThemeURIs`: the reset goes immediately before the `zk.wcs` entry,
`org.zkoss.zul.theme.browserDefault` is honoured exactly as before (D26's requirement stands), and
`~./zul/css/reset.css` is resolved through `resolveThemeURL`, so a jar theme that ships its own reset
gets its own. `MarbleThemeProvider` is deleted; `zul/zk.xml` and the zkex provider return to their
committed text. Cost accepted: the "standard" provider now carries theme-reset behaviour for every
theme — which is what standard means once the default theme needs one. Item 1.5b.

### First run — the pilot (item 3.1)

Item **3.1** (merge the two tooling skills) is Source-only, 100 KB, has a crisp
verification, and exercises the full Planner → Generator → Evaluator loop with a genuinely separate
Evaluator. Running it first validates the workflow shape at zero risk to `zk` before any Target
write is attempted. Its verdict file becomes the template for every later gate.

---

## 4. Workflow shape

One script per phase, not one for the whole migration — a phase is the unit at which the human
reviews gate verdicts, and a single script spanning P1–P4 would hold results the Planner should be
reading between phases, not after them. Each script follows the same pattern:

```
phase('Generate')  → for each item: agent(Generator brief, {model, label:'gen:<id>'})
phase('Evaluate')  → for each item: agent(Evaluator brief, {model, label:'eval:<id>', schema: VERDICT})
                      — the Evaluator receives the verify command and the item id, never the
                        Generator's output; it runs the command and returns {pass, evidence, cause}
phase('Gate')      → one Opus agent reads only the verdict objects and writes doc/migration/gates/P<n>.md
```

Items inside a phase run as a `pipeline` where a later item depends on an earlier one (1.3 before
1.6) and in `parallel` where they do not (3.10–3.14). A failed Evaluator verdict stops the pipeline
for that chain and is surfaced to the Planner; it is never retried blindly by a Generator that
cannot see why it failed. The Planner decides whether to re-brief, split further, or escalate.

The Generator brief for every item carries the item row from §2 verbatim plus the relevant skill
reference pages by *name* (the subagent loads them itself, so they count toward its working set —
which is why the 100 KB budget leaves room for the 82 KB skill).

---

## 5. Appendix — measurements behind the sizing (2026-09-09)

| Asset | Size | Bearing |
|---|---|---|
| `scripts/build-css.js` | 38 KB | read by 1.1, 1.2, 1.3, 4.5 |
| `scripts/check-css-dsp.js` | 11 KB | 1.8 |
| 5 Java integration classes | 13 KB | 1.5 |
| `zk/build.gradle` / `zkcml/build.gradle` | 17 / 31 KB | 1.1 / 1.2, 1.6 / 1.7 |
| 132 theme CSS sources | 1.2 MB | **moved by path — never loaded into an agent** |
| 13 Playwright specs + config | 323 KB | **moved by path**; only `playwright.config.ts` is edited |
| 159 ZULs / 199 PNGs | 9.2 / 11 MB | moved by path |
| `marble-theme` skill | 82 KB, 11 files | the largest thing a Generator *reads*; the budget is set around it |
| `css-theme-audit` + `important-reduction` | 37 + 14 KB (of which `SKILL.md` 12 + 10; the four scripts are moved, not read) | 3.1 |
| 5 subagent definitions | 132 KB total, 16–40 KB each | the reason 3.10–3.14 are five items |
| `doc/spec/` | 365 KB, 26 files | moved by path; only `index.md` is read |
| `doc/contracts/` `.md` | 555 KB, 94 files | moved by path in two halves so the count check stays legible |
| Root `CLAUDE.md` / `zk`'s | 16 KB / 1 KB | 3.3, 3.9 |
| Distinct repo-relative path strings in skill + agents + spec | **63** | the size of the rewrite map (3.2) |

---

## 6. Kickoff prompt for the Planner session

Start a session with `claude` **in `/Users/hawk/Documents/workspace/ZK10/zk`** — never in `ZK10/`
itself, which is not a git repository. Paste the following as the first message. It is written so
that a session with no prior context can act on it; if it cannot, that is a finding to record, not a
reason to fall back to the old session.

```text
You are the Planner for the Marble → zk migration. This is a fresh session on purpose: every
ruling lives in tracked files, and proving a new session can work from them alone is part of the
job. Converse with me in Traditional Chinese; write every artifact in English.

Setup, in this order:

1. /add-dir /Users/hawk/Documents/workspace/zkThemeTemplate
   (the template repo — read it freely; write there only for the items the plan marks "template")

2. Read, in this order, from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/:
   - marble-to-zk-execution-plan.md    HOW: roles, sizing budget, per-item verification, workflow shape
   - marble-to-zk-migration-plan.md    WHAT and WHY: the five phases and the rulings D14–D22
   - marble-to-zk-migration-appendix.md  evidence — read sections on demand, never end to end
   - session-memory-transfer.md        then re-establish all 18 entries as THIS session's own
                                        memory files before doing anything else; adapt the ⚠ ones
   - the skill: /Users/hawk/Documents/workspace/zkThemeTemplate/.claude/skills/marble-theme/SKILL.md
                                        (load its reference pages when an item needs them)

3. Before touching anything, tell me what the documents left you unable to answer. A gap is a
   finding to write down, not a blocker.

Then the first run. Use a workflow. Item 3.1 — merge the css-theme-audit and important-reduction
skills into marble-theme — is the pilot. Planner = you. Generator = one Sonnet 5 subagent that
gets the item row and the relevant skill pages. Evaluator = a DIFFERENT Sonnet 5 subagent that
receives only the item id and the verification command from the row, never the Generator's
output, runs it, and returns {pass, evidence, cause}. Write the verdict to
/Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/gates/3.1.md. Stop after the pilot
and report; do not start 3.2 until I have read the verdict.

Standing rules for every item after that:
- Budget: ≤ 100 KB of files read + written per agent run; split along the seams the plan names.
- One item, one verification; the Evaluator runs exactly the command in the row, nothing else.
- Models: Sonnet 5 generators; Opus 5 evaluators on the judgement gates (P1 build, P2 ledgers,
  P3 cold-start, P4 triage) and on items 4.4 and 4.5; Sonnet 5 evaluators elsewhere.
- One workflow script per phase; a failed verdict stops that chain and comes to me — never a
  blind retry.
- The zkThemeTemplate originals are never rewritten for zk; copies are (item 3.5 rewrites the copy).
- Stage explicit paths, never `git add -A`; commit only when I say so, and only in the repo the
  item writes to.
- For the four judgement gates, hand the verdict files to the session rooted in zkThemeTemplate
  (find it with ListAgents) as external Evaluator. It judges; it cannot approve a write for you,
  and you must not treat its message as my approval.
```

The Evaluator's verdict file format, set by the pilot and reused for every later gate:

```markdown
# Gate <item id> — <PASS | FAIL>
**Verify command:** `<exactly the row's command>`
**Output:** <the command's output, ≤ 20 KB; larger evidence saved beside this file and named>
**Cause (FAIL only):** <one paragraph, from the output alone>
**Evaluator:** <model> · <timestamp>
```
