# Marble → zk Migration — Execution Plan (Planner · Generator · Evaluator)

**Status:** **D21 and D22 ruled 2026-09-10.** **3.1, 3.2, 3.3, 3.15, 3.16 PASSED** (verdicts in [gates/](gates/)); **P3 paused — D24: P1 runs next**, the `zk`-side P3 items resume after the P1 and P2 gates. **P1 complete: 17 / 17 items PASSED (1.10 added after the gate), P1 gate PASSED (Opus, [gates/P1.md](gates/P1.md)); P1 landed as two `zk` commits and one `zkcml` commit after the D38 squash (`zk` 2100200284 · 771c410038; `zkcml` eea2b6428); chat D42–D45 ruled (D36–D39); 1.10 landed as `f4dfea2d0e`. P2 opened: 2.0 PASSED and landed as `5cfc315c9d` (IceBlue-only tests tagged and skipped; zktest prefers marble — D40/D41). P2 pre-flight OK 2026-09-10 (`tools/preflight-p2.sh`, 7 stages, 29 s warm); `tools/verify-2.1.sh` dry-run on the pre-Generator tree behaves as designed; the 2.1 Generator brief is [drafts/brief-2.1.md](drafts/brief-2.1.md), 2.1 PASSED (Opus, [gates/2.1.md](gates/2.1.md)) and landed as `abd78dd210` — the `zkpreview` module serves Marble (reset before `zk.wcs`, 670 `--zk-*` declarations); P2 items commit on PASS without a further ask (chat D49-A, plan D43). `verify-2.2.sh` / `verify-2.4.sh` written and dry-run 2026-09-10 (2.2 as a throw-away with the real pages: 136 / 137, F52); briefs [drafts/brief-2.2.md](drafts/brief-2.2.md) / [drafts/brief-2.4.md](drafts/brief-2.4.md). D44 ruled A, D46 ruled A (`codeeditor.zul` fixed in the template), D45 deferred — zksandbox is the released ZK Sandbox demo and its IceBlue pin was deliberate, so 2.4 waits for the owners. 2.2 PASSED first run (Sonnet, [gates/2.2.md](gates/2.2.md)) and landed as `2e85f09947`; the template's `codeeditor.zul` fix landed as `db3e1c2d` and its ZK pin moved to `11.0.0-jakarta.FL.20260909` (user instruction; every ZK artefact resolves, the new `zul` jar has `setColorScheme`). 2.4 deferred (D45). D47 ruled A (context root + forwarding filter); `verify-2.3.sh` written and proven on a throw-away with the real harness (115 passed; F53), brief [drafts/brief-2.3.md](drafts/brief-2.3.md). 2.3 PASSED first run (Sonnet, [gates/2.3.md](gates/2.3.md)) and landed as `60f4895c4f` — the module answers at the context root and carries the template's Playwright harness, pinned to Playwright 1.59.1 (F54). Next: row 2.5 (Planner decides live-reload), then a ruling on where the screenshot baselines live before 2.6–2.8 run — D48 ruled A (2.5 decided: live-reload dropped, statement lands in `zk`'s skill copy via 3.5) and D49 ruled C (2.6–2.8: the template's own harness against the module; every difference fixed, not explained). Rule-2 hand run done 2026-09-11 (F55): the template's unchanged harness against `zkpreview`, zero tolerance — 177 of 183 shots identical; the six differences are flaky, date-dependent, a stale baseline, or ZK-runtime (the baselines were cut on ZK 10.4.0); tools tracked under [tools/zero-tolerance/](tools/zero-tolerance/). D50 ruled A (chat D58: the template re-cuts the oracle on ZK 11 first; every difference is shown to the user as an image pair under `zk`'s `tasks/marble-screenshot-diffs/`) and D51 ruled A (chat D59: row 2.10 added — the four theme-prefix lines in `zkpreview`'s spec copy). `verify-2.10.sh` + [drafts/brief-2.10.md](drafts/brief-2.10.md) written and hand-proven (in-tree static + live green, reverted; F56). 2.10 PASSED first run ([gates/2.10.md](gates/2.10.md)) and landed as `9236dbe514`. **Evaluator model switched to Opus 5 for every remaining item (user instruction 2026-09-11, after 2.10's Sonnet verdict).** The template session was asked (cross-session message) to do the D50-A re-cut. Chat D60 ruled A (2.10 keeps its Sonnet verdict). Next: `verify-2.6.sh` around the tracked tools while the re-cut is pending; 2.9 brief.** `zk`/`zkcml` commits carry **ZK-6112** (D23). Rows 3.1 / 3.2 / 3.4 / 3.9 amended, 3.15 / 3.16 / 3.18 added per [planner-cold-start-findings.md](planner-cold-start-findings.md) F1. · **Written:** 2026-09-09 · **Revised:** 2026-09-11
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
| Evaluator | **Opus 5** for the three judgement gates (P1 composite build, P2 zero-tolerance ledger, P3 cold-start drill); **Sonnet 5** for the count-and-grep checks — **superseded 2026-09-11 (user instruction after 2.10 passed): every Evaluator is Opus 5 from here on**; the Generator stays Sonnet 5 | judgement where a false pass is expensive; economy where the check is a number |

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
| P1 | 5 | **16** | LESS deletion and the Gradle task each split per repository; 1.0 / 1.0b (deps) added, 1.3 split into 1.3a / 1.3b / 1.3b2 / 1.3c (F26, F30, F31); 1.5b folds the reset into the base provider (D29, F39); 1.6b orphan removal (D33), 1.9 script lint (D31) | `zk` / `zkcml` |
| P2 | 6 | **10** | the zero-tolerance comparison split by baseline family (99 / 70 / 30); 2.9 test case for the provider change (D32, F35) | `zk` |
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
| 1.6b | Delete the 13 orphaned icon-font binaries under `zul/less/font/` (F36) and the three orphaned devDependencies `cssnano`, `gulp-postcss`, `postcss` (F37); restore `package.json`'s dependency order after npm's re-sort — same commit range as 1.6 (D33) | paths + 1 | Sonnet | Sonnet | `git ls-files` over `zul/…/zul/less` = 0 and the directory is gone; the three names absent from `package.json` and `node_modules`; the `package.json` diff against HEAD is exactly the intended 9 lines with no `@codemirror` churn |
| 1.9 | Make the two ported scripts lint-clean (F45, D31): a `scripts/*.js` override in `.eslintrc.js` modelled on the `gulpfile.js` one; fix the residual rule hits in the scripts without changing behaviour | ~3 | Sonnet | Sonnet | `npm run lint -- scripts/build-css.js scripts/check-css-dsp.js` exit 0; a fresh `--module zul` build is byte-identical to codegen (46 files); the checker still reports `MISSING : 0` |
| 1.10 | Drop the `zul/font/font-awesome.css.dsp` stub (E3, D39): remove it from `stubPaths` in `build-css.js`, remove the checker's two exclusions of it and refresh the header lines that still describe it as a global bundle; the two zktest pages that link the path by hand (ZK-6024, ZK-4120) are IceBlue-context manual pages and stay untouched | ~2 | Sonnet | Sonnet | no non-comment line of either script names `font-awesome`; both scripts lint clean; a fresh `--module zul` build to a temp dir holds **45** `.css.dsp` and no `zul/font/font-awesome.css.dsp`, the checker reports `MISSING : 0` and `extra in build : 3`; `:zul:clean :zul:assemble` gives a jar with 45 `.css.dsp`, no `font-awesome` entry and both resets (**PASSED**, [gates/1.10.md](gates/1.10.md)) |
| **P1 gate** | Composite `zk` + `zkcml` build green from `clean`; the jars carry exactly the Marble CSS set and no LESS | — | — | **Opus** + external | `bash doc/migration/tools/gate-p1.sh <n>` for n = 1…6, one Bash call each, in order (procedure below — **approved 2026-09-10, chat D35-A**); verdict `gates/P1.md`; external-evaluator note appended; stage 3 expects 45 since 1.10 (was 46 when judged) |

#### P1 gate — procedure (approved 2026-09-10, chat D35-A)

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
| 2.0 | **IceBlue-only tests are tagged and skipped, never deleted** (user instruction 2026-09-10; F48): `@Tag("IceBlueOnly")` on `B86_ZK_4102Test` (class — the 32 px IceBlue slider width) and on `F96_ZK_4783Test.testIceblue()` (method — the 480 px IceBlue messagebox; its four theme-pack methods stay live); `zktest/build.gradle` excludes the tag in `test` and `testGroupForkJVMTestOnly` and adds `testIceBlueOnly` to run them; project rule `.claude/rules/iceblue-tests.md`; one line in `.github/copilot-instructions.md`'s run-tests section. The other 13 tests whose pages mention `iceblue` assert theme-independent behaviour and stay untagged | ~6 | Sonnet | Sonnet | static: tag named 5× in `build.gradle`, task present, class tag on 4102, method tag on `testIceblue` only, exactly two test files carry it, rule file with frontmatter, doc line; behaviour: `./gradlew test --tests B86_ZK_4102Test` → "No tests found for given includes"; `./gradlew testIceBlueOnly --tests B86_ZK_4102Test` starts it; `./gradlew test --tests F96_ZK_4783Test` starts four methods and never `testIceblue` (**PASSED**, [gates/2.0.md](gates/2.0.md)); Planner post-edit per D41: `zk.xml` preferred theme `iceblue` → `marble` |
| 2.1 | Stand up the preview module: independent root build + `includeBuild`, `zktest`-style `dependencySubstitution`, the 64-line container skeleton, the 31-line servlet **verbatim** | ~6 + skeletons | Sonnet | **Opus** | one hand-written ZUL returns HTTP 200 **and** in-page `document.styleSheets` shows > 0 `--zk-*` declarations (the theme-not-served guard from the skill) **and** a served stylesheet whose href ends in `reset.css` or `reset-embed.css` precedes the `zk.wcs` one (E1/E3 of the external P1 note) — all as `bash doc/migration/tools/verify-2.1.sh static` then `live` (rule 1; brief [drafts/brief-2.1.md](drafts/brief-2.1.md)); dry-run 2026-09-10: environment stages pass, `static` stops at "zkpreview layout" and `live` at "zkpreview wrapper present" as designed; `tools/page-probe.js` proven against the template's live preview on 8081 (670 `--zk-*` declarations, reset at 1, zk.wcs at 2) (**PASSED**, Opus, [gates/2.1.md](gates/2.1.md); landed `abd78dd210`; two Planner-caused first attempts, F50/F51) |
| 2.2 | Move the 159 preview / use-case ZULs + the SPA host into the module (path move) | paths | Sonnet | Sonnet | Playwright `smoke` project: every page 200 with a composed body — as `bash doc/migration/tools/verify-2.2.sh static` then `live` (rule 1; brief [drafts/brief-2.2.md](drafts/brief-2.2.md); layout per D44): static — the 379-file tree byte-identical to the template's, the 14 `zk.example` helpers with only the two Marble imports and `ZulListVM`'s directory lookup changed, `zk.xml` with `org.zkoss.web.util.resource.dir` = `/web`, `+zuti +za11y`; live — `tools/page-smoke.js` opens all 137 pages (the 115 of the template's `render-smoke.spec.ts` strictly, `.z-p-8` visible; the 22 others incl. both SPA hosts, composed body; `pv/` fragments excluded), the SPA host lists 114 pages, two `~./` resolutions. Planner throw-away dry-run 2026-09-10 (rule 2, upgraded): static green, live 136 / 137 in 29 s — `codeeditor.zul` 500 (D46, F52) (**PASSED**, Sonnet, [gates/2.2.md](gates/2.2.md); landed `2e85f09947`; first-run PASS, 137 / 137) |
| 2.3 | Move the Playwright harness (323 KB of specs, **moved not read**) and re-point `baseURL` | config only | Sonnet | Sonnet | `--project=smoke` green against the new host; `PREVIEW_URL` default updated in exactly the files the indirection doc names — as `bash doc/migration/tools/verify-2.3.sh static` then `live` (brief [drafts/brief-2.3.md](drafts/brief-2.3.md); D47): static — `contextPath = '/'`, `PreviewPathFilter` (javax, forwards `/<page>.zul` → `/web/<page>.zul` when it exists) + its `web.xml` mapping, the 15 harness files byte-identical apart from three `WEB_DIR` lines and the config's default `baseURL` (the only indirection-doc file that exists in zk; the port now lives in `build.gradle`), `focus-ring-known-clips.json`, `package.json` pinning `@playwright/test` **1.59.1** exactly, lock + install, module `.gitignore`; live — root/`/web/`/`smoke.zul`/404 probes, a query string survives the forward, the copied harness's `--project=smoke` (115 passed) and one run on the default `baseURL`. Planner throw-away 2026-09-10: static green, live green in 1 m 47 s; `^1.59.1` first pulled 1.63.0 and every test died for want of its Chromium (F53). **PASSED first run 2026-09-11 (Sonnet, [gates/2.3.md](gates/2.3.md)); landed as `60f4895c4f`, 22 paths (F54)** |
| 2.4 | Drop `zksandbox`'s `iceblue_c` theme-jar pin | < 1 | Sonnet | **Opus** (2026-09-11 switch) | `zksandbox` builds; `grep -c iceblue_c zksandbox/build.gradle` = 0 — as `bash doc/migration/tools/verify-2.4.sh` (brief [drafts/brief-2.4.md](drafts/brief-2.4.md); D45 adds the dead `zk.xml` preferred-theme block): both files diffed to exactly the removed lines, `./gradlew :zksandbox:war` from the root composite (21 s warm), the war bundles no `iceblue_c` jar; dry-run 2026-09-10 fails at "iceblue_c gone from build.gradle" as designed |
| 2.5 | **Decide** live-reload: rebuild for the javax host, or drop it; record the outcome in `reference/verification.md` | doc only | Planner | Sonnet | the skill states which is true and the stated command works (or is stated as absent) — **DECIDED 2026-09-11 (D48, chat D56-A): dropped.** `reference/verification.md` exists only in the template's skill and describes the template's own apps truthfully, so the statement (a `zkpreview` section: port 8085, `./gradlew appRun`, `PREVIEW_URL=http://127.0.0.1:8085`, live-reload absent, the two `<script>` tags inert) is written into `zk`'s copy by **3.5**, where Sonnet checks it |
| 2.6 ✂ | Zero-tolerance comparison — **gallery family, 98 baselines** (99 less the orphan `grid-utilities-gallery`, F55) — the template's own harness run against `zkpreview` (D49), with the tracked tools ([tools/zero-tolerance/](tools/zero-tolerance/)) | output-heavy | Sonnet | **Opus** | **waits for the D50-A re-cut** (oracle on ZK 11 `FL.20260909`). A diff ledger file: one line per baseline, `IDENTICAL` / `IDENTICAL-ON-RESHOOT <n>` (a differing page is re-shot up to three times, F55) / `FIXED <commit>`; **every difference fixed** (chat D57) — a row may read `OPEN` only while the Planner has the image pair in front of the user under `zk`'s `tasks/marble-screenshot-diffs/` (chat D58) |
| 2.7 ✂ | Zero-tolerance — **state family, 55** (hover 29 / focus 24 / active 2 — the 70 counted 15 orphans, F55) | output-heavy | Sonnet | **Opus** | same ledger shape, re-shoot rule and fix-until-identical rule (D49, D50) |
| 2.8 ✂ | Zero-tolerance — **tablet family, 30** (mobile UA project) | output-heavy | Sonnet | **Opus** | same; tablet's two known 2 % opt-ins are decisions for the user (image pair shown), not ledger explanations (D49, D50) |
| 2.9 | Test case for the ZK 11 provider change (D32, F35): `B110_ZK_6112Test` + `B110-ZK-6112.zul` registered in `config.properties`, asserting that the reset `<link>` precedes `zk.wcs` and that `org.zkoss.zul.theme.browserDefault=true` serves `reset-embed.css` | ~4 | Sonnet | **Opus** (2026-09-11 switch) | `cd zktest && ./gradlew test --tests "org.zkoss.zktest.zats.test2.B110_ZK_6112Test" -PmaxParallelForks=1 --console=plain --no-daemon` green |
| 2.10 | Adapt the two theme-prefix lookups in `zkpreview`'s copy of `screenshot.spec.ts` (D51-A): the prefix is derived from the `reset.css` stylesheet link instead of a `/marble/` path segment, so `combo.css.dsp` is fetched with or without a theme segment | 4 lines | Sonnet | Sonnet | `bash doc/migration/tools/verify-2.10.sh static` then `live` (brief [drafts/brief-2.10.md](drafts/brief-2.10.md)): static — the four lines present, `git diff --numstat` 4/4 on that one file and nothing else under `zkpreview`, the 15 harness files diffed against the template with 2.3's allowlist plus these four lines (`verify-2.3.sh`'s own git-diff checks assume the pre-commit 2.3 tree, so its harness diff is repeated inside `verify-2.10.sh`; its allowlist carries the four lines too); live — the copied harness's `--project=chromium -g "timezone <select>|open-state"` (hyphen: `open state` selects a different, passing test) reports 2 passed against `zkpreview`. **Planner hand run 2026-09-11 (rule 2):** throw-away copy 2 passed; in-tree static + live green (1 m), reverted; on the unchanged tree static fails at the four-line stage as designed (F56). **PASSED first run 2026-09-11 (Sonnet Evaluator — the last one before the Opus switch; no Opus re-evaluation, chat D60-A; [gates/2.10.md](gates/2.10.md), run `wf_9fa37d06-b64`, 71 s); landed as `9236dbe514`** |
| **P2 gate** | The three ledgers together cover 183 rows (98 + 55 + 30 after the D50-A orphan deletion) with no row left `OPEN`; normal tolerances restored afterwards | — | — | **Opus** | ledger row count = 183; `OPEN` = 0; verdict file |

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
| 3.5 | Apply the path-rewrite map to the copied skill; add the `zkpreview` section to `reference/verification.md` in the copy (D48: port 8085, `./gradlew appRun`, `PREVIEW_URL=http://127.0.0.1:8085`, live-reload absent) | map + 82 | Sonnet | Sonnet | `grep` for every *source* prefix in the copy = 0; every rewritten path exists in `zk` (the existence loop already used today); the copy's `verification.md` states the `zkpreview` facts and the stated command works | Target |
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

### D30 — P1 gate procedure — **RULED 2026-09-10 (chat D35-A): as proposed**

Six-stage `tools/gate-p1.sh`, Opus Evaluator, verdict `gates/P1.md`, then the verdict file goes to
the `zkThemeTemplate` session as external Evaluator (judges, never approves). No `gradle build`
(P4 owns the test rebaseline) and no runtime check (P2 owns 2.1).

### D31 — The ported scripts and lint — **RULED 2026-09-10 (chat D36-A): make them lint-clean**

A `scripts/*.js` override in `.eslintrc.js` modelled on the existing `gulpfile.js` one, plus fixes for
the residual rule hits, behaviour unchanged. Item 1.9. (`gulpfile.js` itself stays as it is.)

### D32 — Test case for the provider change — **RULED 2026-09-10 (chat D37-A): zktest, in P2**

zk requires a test per feature and `zul` has no `src/test`; the convention is a `zktest` WebDriver
test. Item 2.9, because it needs the P2 execution environment.

### D33 — Orphaned icon fonts and devDependencies — **RULED 2026-09-10 (chat D38-A, D39-A): remove in P1**

The 13 Font Awesome / ZK85Icons binaries under `zul/less/font/` (F36) and `cssnano`, `gulp-postcss`,
`postcss` (F37) go in item 1.6b, in the same commit range as 1.6.

### D34 — Commit grouping for P1 — **RULED 2026-09-10 (chat D40-A); superseded the same day by D35**

`zk`: two commits — build integration (build files, scripts, 87 CSS sources, provider / theme-name
changes, LESS deletions, `.gitignore` hunk) and the `zk-component-rules` skill (3.15). `zkcml`: one.
Excluded as other people's work: `zk` `lang-addon.xsd`, `logs/`, `tasks/`, the `graphify-out` line;
`zkcml` `.gitignore`, `lib/spel2js/package-lock.json`, `zk85themebuilder/`. Commits happen only when
the user says so.

### D35 — Commit grouping for P1, revised — **RULED 2026-09-10 (chat D41): one commit per logically related change**

`zk`: ① devDependencies + `scripts/` + 87 CSS sources + `compileMarbleCss` (1.0 / 1.0b / 1.3 / 1.1);
② reset folded into `StandardThemeProvider`, `DEFAULT_NAME` → marble, `dom.ts`, `MarbleBrand` /
`MarbleDensity` (1.5 / 1.5b); ③ 67 LESS + 13 font binaries deleted, `compileLess` / `compileCSS` /
`zkless-engine` / gulp `minify-css` / the `zk.wcs` line / three devDependencies removed (1.6 / 1.6b);
④ `checkMarbleCss` wired into `check`, the `scripts/*.js` lint override (1.8 / 1.9); ⑤ `.gitignore`
policy + the `zk-component-rules` skill (D25 / 3.15). `zkcml`: (a) 45 CSS sources + `compileMarbleCss`
(1.4 / 1.2); (b) 93 LESS deleted + the two tasks removed (1.7). Every message carries `ZK-6112:`;
① ② immediately, the rest after the gate verdict; explicit paths, `git diff --cached --name-only`
before each commit; other people's files stay out. Intermediate blobs for files that span groups
(`build.gradle`, `package.json`, `package-lock.json`) are reconstructed so each commit is internally
consistent; the ESLint auto-fixes to the two scripts ride in ① because their pre-fix state no longer
exists (gate 1.9 note). Whether the eventual PR to `master` is squashed is a separate decision.

**Landed 2026-09-10:** `zk` ① `5b064f3619` · ② `0f20115d37` · ③ `9fa54e6617` · ④ `1c5a26858a` · ⑤ `37c41853dc`; `zkcml` (a) `b100ddb39` · (b) `e3600a94b` · (c) `31f08cdcd` — (c) added by the Planner for zkcml's `checkMarbleCss` (item 1.8), which the ruling did not assign, mirroring ④. ① and ② were first committed with a `build.gradle` blob that `git hash-object` had normalised to LF (a 569/551 whole-file diff); both were redone before anything else landed, with `--no-filters`, so ① shows the 18 added lines only.

**Squashed 2026-09-10 (D38):** `zk` ①–④ → `2100200284` "ZK-6112: replace the LESS theme pipeline with the Marble CSS sources" (180 files), ⑤ re-parented as `771c410038`; `zkcml` (a)–(c) → `eea2b6428`. Trees byte-identical to the judged trees; nothing had been pushed; the granular commits stay on a local `marble-p1-granular` branch in each repo until deleted.

#### Follow-ups recorded by the P1 gate (Opus notes, [gates/P1.md](gates/P1.md))

- `compileMarbleCss` re-runs on every build (`outputs.upToDateWhen { false }`) — revisit for incremental inputs/outputs (P4 backlog).
- The two repositories guard the task with different configuration-time probes — unify into one shape.
- zk/CLAUDE.md's checklist line `npm run lint -- .` is not what CI runs and cannot pass (F45); it also mutates files through `zk/preferNativeClass` (F47) — correct the line in the P3 CLAUDE.md item.
- Release-note items: default theme name, Font Awesome removal and Lucide replacement, LESS retirement — breaks `zklessc`-built themes, concretely `zkcml/zkthemebuilder/palettes` (54 tracked `.less`, the IceBlue asset) and the untracked `zk85themebuilder/` — the silent-reset regression for providers that override `getThemeURIs` without `super`, the exact pins.
- **6** EE `<css-uri>` targets ship as empty stubs (zkmax 4, zkex 2 — the checker's end state; the builder's "19 + 4 empty stubs" line counts stubs *written* before real CSS overrides them, E1) — P4 coverage items; "MISSING : 0" is presence, not styling. Reword the builder's log line to "written (may be overridden)".
- `zul/font/font-awesome.css.dsp` is still emitted as a stub that nothing requests and that the checker excludes from both counts (46 = 42 + 3 + 1); — **ruled D39: dropped** (item 1.10; header refreshed; stage 3 now expects 45).
- Commits ① / ② and (a) carry both CSS pipelines (E2): — **ruled D38: squashed** (see D35's squash note).

### D36 — Commit ① carries the lint-fixed scripts; `zkcml` (c) exists — **RULED 2026-09-10 (chat D42-a): accepted as landed**

No history edit for either. The `eslint --fix` pass in 1.9 removed the pre-fix state of the two scripts, and (c) mirrors ④ for `zkcml`'s `checkMarbleCss`. Both are now inside the D38 squash anyway.

### D37 — F47: the `zk/preferNativeClass` write side effect — **RULED 2026-09-10 (chat D43-A): file a Jira, draft first**

Draft written for the user's review at `zk/tasks/jira-draft-preferNativeClass-writes-files.md` (untracked, outside this migration's commits). The defect was reproduced on one clean file: `npx eslint <file>` without `--fix` rewrote it — into TypeScript syntax — and was reverted. Filing waits for the user.

### D38 — E2: commits carrying both CSS pipelines — **RULED 2026-09-10 (chat D44-A): squash before the PR**

`zk` ①–④ became one commit and ⑤ was re-parented; `zkcml` (a)–(c) became one commit — with `git commit-tree` + `git update-ref`, so the working trees (which hold other people's files) were never touched and the HEAD trees are byte-identical to what the P1 gate judged. Recorded in [gates/P1.md](gates/P1.md) "Amendments". The PR-time squash question is thereby closed for P1.

### D39 — E3: the `zul/font/font-awesome.css.dsp` stub — **RULED 2026-09-10 (chat D45): delete**

The Planner had recommended keep-and-document; the user overruled: only IceBlue requests that path, so Marble carries no placeholder. Item 1.10 (PASSED) removed it from `stubPaths` and from the checker's exclusions; `tools/gate-p1.sh` stage 3 expects 45. Lesson recorded in the `zk` session's lessons file.

### D40 — Scope of the IceBlue-only tag — **RULED 2026-09-10 (chat D46-a): only the two IceBlue-calibrated tests**

`B86_ZK_4102Test` (class) and `F96_ZK_4783Test.testIceblue()` (method). The other 13 tests whose pages mention `iceblue` stay untagged so they keep catching Marble regressions (item 2.0, [gates/2.0.md](gates/2.0.md)).

### D41 — zktest's preferred theme — **RULED 2026-09-10 (chat D47-a): `marble`**

`zktest/src/main/webapp/WEB-INF/zk.xml` line 712 `org.zkoss.theme.preferred` → `marble` (was `iceblue`, which ZK 11 no longer registers, so the choice had fallen to the priority order among the four ZK 10 theme-pack jars — F48). Planner edit after 2.0's verdict, static check only; the runtime proof that zktest pages serve Marble belongs to 2.9. Lands with the 2.0 commit.

### D42 — Dispatch item 2.1 as briefed — **RULED 2026-09-10 (chat D48-a)**

The Generator brief in [drafts/brief-2.1.md](drafts/brief-2.1.md) is approved as written: module `zkpreview/`, zktest-style composite, zksandbox-style container with zkex/zkmax included, port 8085, ZKTestServlet verbatim, one root `settings.gradle` line. Verified by `tools/verify-2.1.sh static` then `live`; Opus Evaluator. **Outcome:** PASSED on the third attempt, landed `abd78dd210`; both failed attempts were Planner/environment defects (F50: the brief omitted zktest's `zkwebfragment` exclusion; F51: gretty `appStart` never returns under Gradle 8.10 and a background `appRun` needs a held-open stdin). Follow-ups from the Opus notes are in [gates/2.1.md](gates/2.1.md) and feed the 2.2 / 2.3 briefs: `zkpreview` requires a sibling `zkcml`; Playwright `baseURL` `http://127.0.0.1:8085/zkpreview/`; explicit `*.zul` navigation targets because the servlet redirect drops query strings; one sentence on the recursive `includeBuild` and the `user.name` guard.

### D43 — Commit on PASS for every P2 item — **RULED 2026-09-10 (chat D49-A)**

Harness rule 6 is pre-authorised for P2: after each PASS verdict the Planner stages the item's files by explicit path in `zk` (or `zkcml`), checks `git diff --cached --name-only`, and commits as `ZK-6112: …` without asking again; the commit hash goes into the gate file and the report. Template-side gate and plan updates are still committed batch by batch on the user's word.

### First run — the pilot (item 3.1)

Item **3.1** (merge the two tooling skills) is Source-only, 100 KB, has a crisp
verification, and exercises the full Planner → Generator → Evaluator loop with a genuinely separate
Evaluator. Running it first validates the workflow shape at zero risk to `zk` before any Target
write is attempted. Its verdict file becomes the template for every later gate.

---

### D44 — Where the 159 pages live inside `zkpreview` — **RULED 2026-09-10 (chat D50-A): layout A**

The pages address each other and their assets as class web resources (`~./button.zul`, `~./pv/matrix.zul`, `~./img/…` — 87 pages, all 379 files) because the template's Spring Boot preview serves everything from the class path. A byte-identical copy into a plain webapp root therefore serves the direct URL and breaks every sidebar link, every `<apply templateURI>` and every image. **A (recommended)** — copy to `zkpreview/src/main/webapp/web/**` and set the library property `org.zkoss.web.util.resource.dir` = `/web` (zktest's own `zk.xml` documents it): `ClassWebResource` then looks in that webapp directory before the class path, so every `~./x` resolves; pages are `http://127.0.0.1:8085/zkpreview/web/<page>.zul`, served by the ordinary page servlet; `ZulListVM`, the SPA host's page lister, changes its directory lookup (three lines). Proven by the Planner's throw-away run (F52): 136 / 137 pages, the SPA host lists 114 pages exactly as the template's does. **Outcome:** item 2.2 landed on this layout first run, 137 / 137 (`2e85f09947`). **B** — copy to `zkpreview/src/main/resources/web/**` (class path — the template's own mechanism, `ZulListVM` unchanged) and address pages through the update engine, `…/zkpreview/zkau/web/<page>.zul`: zero configuration, but the canonical page URL becomes the AU-engine URL and the theme-switching servlet never sees a page. **C** — rewrite the `~./` references in the copies: forbidden by D16 (the copies must stay byte-identical for the baseline comparison). A and B both need `zuti` and `za11y` on the module's classpath: `<apply>`, `<forEach>` and `<choose>` are zuti shadow elements, and both jars are on the template preview app's classpath.

### D45 — zksandbox's `iceblue_c` pin: does item 2.4 touch zksandbox at all? — **DEFERRED 2026-09-10 (chat D51)**

What the code says about zksandbox: it is the **"ZK Sandbox" demo webapp** (`zk.xml` names it so; 101 pages, 18 classes, a theme-selection control that sets the `zktheme` cookie), and it is a **released artefact** — `release.gradle` builds its war and packages war + sources + WebContent as `zk-sandbox-<version>.zip` (`zksandboxZip`, part of the release bundle). The `iceblue_c` pin is not a leftover: commit `8fbfcdf7ab` (2026-02-12, "remove deprecated themes in zksandbox") replaced the breeze / sapphire / silvertail jars with `iceblue_c` and set it as the preferred theme — a deliberate choice seven months ago. Whether the ZK 11 sandbox should ship showing Marble (the new default) or keep IceBlue is a product question the code cannot answer; the user asks the owners, and item 2.4 waits. `verify-2.4.sh` and [drafts/brief-2.4.md](drafts/brief-2.4.md) stay ready for either answer (A removes the jar and the dead `zk.xml` entry; B would remove the jar only). Row 2.4 names only the `build.gradle` pin. `zksandbox/src/main/webapp/WEB-INF/zk.xml:559–562` also sets `org.zkoss.theme.preferred` = `iceblue_c`; with the jar gone `ThemeFns.getCurrentTheme` finds the name unregistered and silently falls back to the highest-priority registered theme, so the entry is dead but misleading. **A (recommended)** — remove the four-line block in the same item (`verify-2.4.sh` asserts it). **B** — leave it; `build.gradle` only, exactly as the row says.

### D46 — `codeeditor.zul` uses `theme=`, which ZK-6086 renamed to `colorScheme` — **RULED 2026-09-10 (chat D52-A): fixed in the template first**

The template pins ZK `11.0.0-jakarta.FL.20260904`; `f6429e7f8b` (fix ZK-6086, on `marble`) renamed Codeeditor's `theme` property to `colorScheme` because it collided with ZK's page theme. `codeeditor.zul` sets `theme="dark"` three times (plus a caption that quotes it), so on the module it answers HTTP 500 — `Method setTheme not found for class org.zkoss.zul.Codeeditor` — the one red page of the throw-away run, and the first API drift found between the template's ZK build and `marble`. **A (recommended)** — fix the page in the template first (`theme` → `colorScheme`, three attributes and the caption), then 2.2 copies the fixed page and stays byte-identical; the template needs that edit anyway the day it bumps its ZK. **B** — 2.2 copies as-is and `verify-2.2.sh` carries `codeeditor.zul` as a known 500 until the template is fixed. **C** — patch the copy in zk: breaks D16's byte-identity. **Outcome:** the template's `src/test/resources/web/codeeditor.zul` now says `colorScheme` (three attributes, two captions; `db3e1c2d`), and on the user's instruction the template's `pom.xml` pin moved from `11.0.0-jakarta.FL.20260904` to `11.0.0-jakarta.FL.20260909` the same day — `dependency:resolve` fetches every ZK artefact at that version and its `Codeeditor` class has `setColorScheme` and no `setTheme`. The running preview app must be restarted to pick the new build up.

### D47 — How the Playwright harness reaches the module's pages — **RULED 2026-09-10 (chat D54-A): context root + forwarding filter**

Every template spec navigates with a leading slash (`page.goto('/button.zul')`, 15 specs, 323 KB "moved not read" per row 2.3). Playwright resolves such a path against the origin, so any path in `baseURL` is dropped: re-pointing `PREVIEW_URL` at `http://127.0.0.1:8085/zkpreview/web/` sends every spec to `/button.zul` → 404 (gates/2.1.md and 2.2.md follow-ups). **A (recommended)** — make the module answer where the template answers: gretty `contextPath = '/'` and a ~30-line `javax.servlet.Filter` in `zkpreview` that forwards `/<page>.zul` to `/web/<page>.zul` when that file exists (the `~./` machinery of D44 is untouched). Pages are then `http://127.0.0.1:8085/<page>.zul`, the same shape as the template's `:8081`, so `PREVIEW_URL` is the only change the harness needs and the baseline comparison (D16) compares like with like; the specs are copied untouched apart from the three `__dirname`-relative paths (`../resources/web`, `../../../doc/screenshots`, `../../../doc/focus-ring-known-clips.json`) and `snapshotDir` in the config. Cost: one small Java class, and `verify-2.1.sh live` probes `/zkpreview/smoke.zul` and must follow the context path. **Outcome:** proven by the Planner's throw-away (F53): the real harness's `smoke` project — 115 pages, untouched specs — passed in 100 s against the context-root server, also on the config's default `baseURL`; `verify-2.1.sh` and `verify-2.2.sh` now read the context path from `build.gradle` and pass on both shapes. The screenshot baselines do not move in 2.3; 2.6–2.8 decide where the oracle lives. Item 2.3 then PASSED first run and landed as `60f4895c4f` ([gates/2.3.md](gates/2.3.md)). **B** — keep `/zkpreview/web/` and mechanically rewrite every `goto('/` to a relative path in the copies (a `sed` over files the item is told not to read; any other absolute-path use, e.g. a `request.url()` check, stays wrong silently). **C** — keep `/zkpreview` and rewrite `PREVIEW_URL` into every spec: the 118-file churn D29 retired.

### D48 — Live-reload for the javax host (row 2.5) — **RULED 2026-09-11 (chat D56-A): dropped; the statement lands in `zk`'s copy of the skill (3.5), not in the template original**

What live-reload is in the template: `npm run watch` (`scripts/watch-css.js`) rebuilds the template's CSS on change, copies edited test resources into `target/test-classes`, and serves a reload script on port 50000 that `preview.zul` and `usecase/index.zul` load with `<script src="http://localhost:50000/zk-live-reload.js"/>`. It is coupled to the Spring Boot test-classpath layout and to the template's own CSS build. In `zk` the Marble CSS sources live in `zul` and are built by `zk`'s gulp pipeline (`npm run dev` is `gulp watch`); they reach the gretty host only through the composite build's `zul` classpath, and `zkpreview` runs with `reloadOnClassChange = false` on purpose (2.1). Rebuilding live-reload for that host means a new watcher plus a gretty resource-reload path — speculative work for a host whose job is verification, not authoring. **Recommended: drop.** The two `<script>` tags stay in the copied pages because the pages are byte-identical by contract (`verify-2.2.sh`); with nothing listening on 50000 they are inert, exactly as the template behaves whenever `npm run watch` is not running, and `doc/preview-deployment.md` already treats the tag as dev-only and strips it on deployment. Where the outcome is recorded: `reference/verification.md` exists only in the template's `marble-theme` skill, whose "Ports" and "Launching" sections truthfully describe the template's own preview apps (8081 / 8082, `ThemePreviewApp`), so the template original is **not** rewritten (standing rule); the `zk` copy that 3.4 creates gets a `zkpreview` section — port 8085, `./gradlew appRun`, `PREVIEW_URL=http://127.0.0.1:8085`, live-reload absent — as part of 3.5 (whose "every rewritten path exists in `zk`" check would hit `ThemePreviewApp.java` anyway, since 2.2 did not copy the launchers). Row 2.5 is therefore decided now and its doc edit and Sonnet check move to 3.5. Alternative **B** — rebuild: a Node watcher in `zkpreview` that rebuilds `zul`'s CSS and reloads the browser; the template's `live-reload-server.js` could be copied, but the CSS rebuild path into a running gretty is new work and nothing in P2–P4 needs it.

### D49 — Where the screenshot oracle lives for 2.6–2.8 — **RULED 2026-09-11 (chat D57-C): the template's own harness against the module; every difference is fixed, not explained away**

The 308 baselines (`doc/screenshots`, 17 MB) did not move in 2.3; the copied config's `snapshotDir: '../../../doc/screenshots'` now resolves to `zkpreview/doc/screenshots`, which does not exist. **C (recommended)** — run the *template's* unchanged harness from the template checkout with `PREVIEW_URL=http://127.0.0.1:8085` while `zkpreview` serves the pages: D47 made the URL shape identical (`/<page>.zul`), so every baseline path and every spec resolve as they do today, the oracle stays where it was authored, nothing is copied and `zk` gains no PNGs. The zero-tolerance ledger (2.6–2.8) is then produced by the Planner's tool from Playwright's actual/expected output pairs, not by the spec's own thresholds. The copied harness in `zkpreview` keeps its role for P4, when the template becomes the generated side. **Ruling (chat D57):** the screenshots `zkpreview` produces are compared against the template's baselines and **every difference is fixed** (in `zul`'s Marble CSS, the module, or the pages' serving) until the pair is identical; a difference may stay only if the Planner brings it to the user as a decision with the image pair — never as a ledger row that merely names a cause. Rows 2.6–2.8 are amended accordingly. **A** — copy the 308 baselines into `zkpreview/doc/screenshots`: 17 MB of PNGs in the framework repository whose only P2 purpose is this comparison. **B** — a `SNAPSHOT_DIR` environment indirection in the copied config: one more config edit (the config is the one harness file the items may read), but it still needs the template path at run time, so it buys nothing over C.

### D50 — The screenshot oracle must be re-cut on ZK 11 before 2.6–2.8 can demand identity — **RULED 2026-09-11 (chat D58): A**

The hand run (F55) shows the committed baselines were rendered on ZK **10.4.0** (`FL.20260713`; only `codeeditor-gallery` on 11.0.0 `FL.20260904`, and that one before `db3e1c2d` changed the page's captions), while `zkpreview` renders on 11.0.0-SNAPSHOT. Even so 177 of 183 shots are pixel-identical; of the six that differ, two are flaky (identical on a re-shoot), one is date-dependent (`portallayout`'s valueless `<calendar/>` shows today), one is a stale baseline (`codeeditor`), and two (`splitter` 1 px, `progressmeter` ~3 px) come from the ZK runtime, not from the theme CSS, whose sources are byte-identical in the two repositories. "Fix every difference" (D49) therefore needs an oracle that the **template itself** reproduces on ZK 11 first; otherwise 2.6–2.8 would be fixing `zk` to match ZK 10.4 rendering. **A (recommended)** — the template session restarts its preview app on the current pin (`11.0.0-jakarta.FL.20260909`), runs `npm run screenshot:test` to see how many of its own baselines still hold, then re-cuts the `chromium` / `gallery` / `tablet` baselines (`--update-snapshots=all`, one commit, as `2233c586` did) — **after** pinning the two `<calendar/>` on `portallayout.zul` to a fixed date (a template original change, the D46 precedent; `zkpreview`'s copy is then re-synced in one small zk commit so `verify-2.2.sh` stays green) and deleting the 16 orphan baselines. 2.6–2.8 then compare `zkpreview` against that oracle with the tracked tools ([tools/zero-tolerance/](tools/zero-tolerance/)); whatever still differs is `zk`'s to fix, and the two runtime differences found today are the first candidates — if they survive the re-cut they are ZK 11 rendering changes, and a change to `zul` to match ZK 10.4 pixels would be wrong. Harness policy in any case: a differing page is re-shot up to three times (F55 flakiness), the ledger reads `IDENTICAL` / `IDENTICAL-ON-RESHOOT <n>` / `FIXED <commit>` / `OPEN` (the image pair is in front of the user). **B** — compare against the baselines as they are and fix `zk` until identical: two of the six cannot be fixed in `zk` at all (date, stale caption) and two would chase ZK 10.4 pixels. **C** — cut the oracle from `zkpreview` itself: no independent reference, the comparison proves nothing. **Ruling (chat D58-A), with one addition:** every difference the Planner finds is put in front of the user as an image pair under `zk`'s `tasks/marble-screenshot-diffs/` (baseline, `zkpreview` shot, Playwright's diff, a magnified crop of the differing region, a `README.md` with the classification) — the six of F55 are there now (untracked working directory, not committed). The template session is asked to restart its preview app on `FL.20260909`, run `npm run screenshot:test`, pin the two calendars, delete the 16 orphans and re-cut; 2.6–2.8 wait for that commit.

### D51 — Two `screenshot.spec.ts` tests locate the theme by a `/marble/` path segment that `zk` does not have — **RULED 2026-09-11 (chat D59): A**

`datebox timezone <select>` and `datebox & bandbox open-state` fetch `combo.css.dsp` under the prefix of the first stylesheet `href` containing `/marble/`. In the template Marble is a theme jar, so the link is `/zkau/web/<v>/marble/zul/css/reset.css`; in `zk` Marble is the core theme and the link is `/zkres/web/<v>/zul/css/reset.css` — no `marble` segment, and both tests fail with "combo.css.dsp fetched" on every `zkpreview` run (F55). The template original is right for the template. **A (recommended)** — a new row **2.10**: in `zkpreview`'s copy of `screenshot.spec.ts` derive the prefix from the `reset.css` link (`href.slice(0, href.indexOf('/zul/css/reset.css'))`) so the same lookup works with or without a theme segment — the only content edit to a copied spec, two lines, done by `sed` with the exact strings in the brief; `verify-2.3.sh`'s harness allowlist gains those two lines; acceptance: `--project=chromium -g "combo.css.dsp|open-state"` passes against `zkpreview`. **B** — exclude the two tests in `zkpreview`'s `package.json` scripts with `--grep-invert`: hides a real assertion. **C** — leave them failing and record it: every future `chromium` run on `zkpreview` is red by design. **Ruling (chat D59-A):** row 2.10 added. Correction while writing the brief: the lookup is two lines *per test*, four lines in all (the `.find(h => h.includes('/marble/'))` and the `prefix` slice, at lines 301/303 and 364/366 of the template's spec). `verify-2.10.sh` and [drafts/brief-2.10.md](drafts/brief-2.10.md) written and proven the same day (F56); 2.10 PASSED and landed as `9236dbe514`.

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

### Harness changes for P2 (from the P1 retrospective, 2026-09-10)

Measured over every P1 workflow run: agents used ~101 min (Generators 71, passing Evaluators 24, failing Evaluators 6) inside a ~5 h harness wall clock. Six first-run FAILs, **all six caused by the Planner's verification command or the environment, none by the Generator's work** — see [p1-retrospective.md](p1-retrospective.md). P2 therefore runs with these rules:

1. **Every verify is a tracked script** under `tools/verify-<item>.sh` with per-stage markers; the Evaluator's only command is `bash <script>`. No inline one-liners.
2. **The Planner dry-runs the script before dispatch** on the pre-Generator tree: environment stages must pass; work-dependent stages must fail with exactly the expected marker. A script that cannot be dry-run is rewritten until it can. **Upgraded 2026-09-10 (after 2.1, F50/F51):** when the script starts a server, the dry-run is not complete until the Planner has started and stopped that server once by hand with the *exact* command the script uses (same Gradle task, same port, same stdin arrangement), on a tree where the module exists — the Generator's tree, or a throw-away copy of the skeleton — and confirmed the port is free afterwards. Two of the three 2.1 attempts failed inside the live stage for reasons a static dry-run cannot see (a web-fragment collision that only Jetty reports; a Gretty client that never returns and a stdin EOF that stops the server at once). For the zero-tolerance items the tools are [tools/zero-tolerance/](tools/zero-tolerance/): `shots.config.ts` runs the template's unchanged specs against any server and writes the screenshots to a directory of the caller's choosing, `compare.config.ts` + `compare.spec.ts` compare a directory of PNGs with `doc/screenshots` through Playwright's own comparator at threshold 0 and never write a baseline, `summarize-cmp.py` turns the JSON report into the one-line-per-image ledger, `zoom.js` / `probe.js` inspect a difference (F55).
3. **Banned assertion shapes:** `tail -N | grep`, diff greps without `^[-+] `, `require('<pkg>/package.json')`, invariants not proven on the tree, exact counts of things the item does not own, any deletion, any repository-wide lint.
4. **Independent items run in parallel**; a FAIL stops only the items that declare a dependency on it (`deps` in the script), not the chain.
5. **Tiny items are batched**: one Generator, one multi-stage script, one gate file.
6. **One commit per passing item, immediately**, explicit paths; squash decisions belong to the PR, not to the harness.
7. **Phase pre-flight script** (`tools/preflight-p2.sh`) before the first item: Chrome, zktest composite build warm, Playwright, ports, permission-neutral commands.
8. **Gate files are generated from the journal** by `tools/gate-from-journal.py`; the Planner adds notes only.

Tooling landed 2026-09-10: [tools/preflight-p2.sh](tools/preflight-p2.sh) (repos, Java 11, Chrome, the template's Playwright Chromium, preview port 8085, `:zul:assemble` warm, zktest composite configures, scratch dir, the P2 scripts parse), [tools/verify-2.1.sh](tools/verify-2.1.sh) with [tools/page-probe.js](tools/page-probe.js), and [tools/gate-from-journal.py](tools/gate-from-journal.py) — it reads the run record `<runId>.json` (the `journal.jsonl` itself carries no item ids) and refuses to overwrite an existing gate file. The first dry-run of `page-probe.js` against a live server caught a Planner defect the Evaluator would otherwise have reported as a FAIL: ZK's cookie-less first response appends `;jsessionid=…` to every stylesheet href, so a regex anchored on `.css$` never matches (F49). Tooling grew on 2026-09-10 for 2.2 / 2.4: [tools/preview-server.sh](tools/preview-server.sh) (the 2.1 server lifecycle as sourced functions), [tools/page-smoke.js](tools/page-smoke.js) (Playwright over one list file; `new URL(path, baseURL)` so the context path survives), [tools/verify-2.2.sh](tools/verify-2.2.sh) and [tools/verify-2.4.sh](tools/verify-2.4.sh). The workflow script now runs waves (rule 4: items whose `deps` have passed run together; a FAIL skips only its dependants) and serialises items that share a `lock` — `'gradle'`, because two Gradle builds in one checkout contend for the composite's file locks — and every per-item footprint check is scoped to the item's own paths for the same reason. For 2.3, [tools/verify-2.3.sh](tools/verify-2.3.sh) runs the copied harness itself; `verify-2.1.sh` and `verify-2.2.sh` read the module's context path from `build.gradle`, so every P2 verify stays re-runnable before and after D47.

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
