# Planner cold-start findings

**Status:** open — 3.1, 3.2, 3.3, 3.15, 3.16 PASSED; P3 paused for P1 (D24) · **Written:** 2026-09-10 by the Planner session rooted in `ZK10/zk`
**Purpose:** the execution plan (§1, "Where it runs") makes the new Planner session the migration's
own cold-start drill run early. This file records what the four migration documents and the skill
left the Planner unable to answer, or answered wrongly, before any item ran. A gap here is a
documentation finding to close, not a blocker — each entry says what the Planner ruled to keep
moving. Decision ids in this file are its own series, **F1–**, to avoid colliding with the plan's D-series.

Documents read in the prescribed order: `marble-to-zk-execution-plan.md`,
`marble-to-zk-migration-plan.md`, `marble-to-zk-migration-appendix.md` (§A.7 only),
`session-memory-transfer.md`, `.claude/skills/marble-theme/SKILL.md`.

---

## Gaps found before the pilot (item 3.1)

### F1 — Item 3.1's inventory undercounts the two skills by their scripts

| Measured | Plan says | Actual (2026-09-10) |
|---|---|---|
| `css-theme-audit` | 12 KB, "3 files" (§A.7) | 3 files, **37 KB**: `SKILL.md` 12.4 KB + `scripts/audit-css.sh` 10.8 KB + `scripts/check-default-display.js` 13.7 KB |
| `important-reduction` | 9 KB, "3 files" | 3 files, **14 KB**: `SKILL.md` 9.9 KB + `scripts/count-important.js` 1.8 KB + `scripts/probe.js` 2.3 KB |
| Scripts to relocate | "both scripts" (2) | **4** |
| Skill file count after merge | 13 | 11 today; **17** if the four scripts move into the skill, 13 only if they leave it |

The §5 measurement counted the two `SKILL.md` files (12 + 9 = 21 KB) and missed the `scripts/`
directories (29 KB). §A.7's "3 files" was right; the row's verify text was derived from the wrong
number.

**Ruling F1.** The four scripts move **into** `.claude/skills/marble-theme/scripts/` and travel with
the skill. Reason: item 3.4 copies the skill tree into `zk` and item 3.5 rewrites paths in that copy;
nothing else in P3 moves a repo-root `scripts/` file, so scripts left outside the skill would never
reach `zk`. Consequence: the expected file count becomes **17** (1 `SKILL.md` + 12 reference pages
+ 4 scripts). Rows 3.1 and 3.4 in the execution plan are amended accordingly; the working set stays
inside budget because the scripts are moved by `git mv`, not read — only two comment lines in them
change, by `sed`.

### F2 — "Both scripts run from the new location" has no runnable form

The row names no command. Of the four scripts, three run cold; `probe.js` needs a live preview app
on 8081 and a browser, so its cold-run proof is the usage exit (`exit 2` before any browser launch).
`audit-css.sh` and `check-default-display.js` compute the project root as four directories above
their own location — the new location has the same depth, so no code change is needed. The Evaluator
command is now written out in full in the amended row.

### F3 — Who writes the verdict file

Execution plan §1 says the Evaluator "may write: nothing — read-only"; `gates/README.md` says each
verdict file is "written by the Evaluator". **Ruling F3:** the Evaluator returns `{pass, evidence,
cause}`; the Planner transcribes those fields verbatim into `doc/migration/gates/<item>.md` in the
§6 format and adds model and timestamp. The Evaluator stays read-only.

### F4 — The merged skill must keep its trigger surface

Neither the plan nor the skill says what happens to the two skills' `description` frontmatter.
Merging their bodies as reference pages without carrying their trigger phrases ("audit", "hygiene",
"orphan tokens", "remove `!important`") into `marble-theme`'s description would silently stop the
skill from firing on those requests. Added to the Generator brief as a required edit.

### F5 — `check:doc-links` scans `.claude/` and `.json`

`scripts/check-doc-links.js` treats `.claude` as a repository directory and scans `.json` files, so
`package.json`'s `audit:css` script and `.stylelintrc.json`'s comment both become `MISSING`
references the moment the old directories go. Baseline before the pilot: clean, exit 0. The
Generator brief lists every tracked reference to the two skill paths (nine files) and which must
change.

### F6 — `/add-dir` cannot be run by the model

Step 1 of the kickoff prompt is a CLI built-in. Reads into `zkThemeTemplate` worked without it;
whether subagent *writes* there are permitted is discovered by the pilot itself.

### F7 — Two ⚠ transfer entries adapted from measurement

- Entry 11 (`python3` pyenv shim): `zk` and `ZK10/` carry no `.python-version`;
  `zkThemeTemplate` pins 3.12, but on 2026-09-10 `python3 --version` returned 3.10.13 from that
  cwd — the failure did not reproduce. Recorded as "shim is cwd-dependent; use `/usr/bin/python3`".
- Entry 13 (concurrent sessions): confirmed in `zk` and `zkcml` as well — both show a modified
  `.gitignore` and untracked files this session never created.

### F8 — Peer session identity drifted

The kickoff prompt says to find the `zkThemeTemplate` session with `ListAgents`. It is present as
`zkthemetemplate-87`; earlier in this session's lineage the same repository's session was named
`zkthemetemplate-cd`. The name is not stable across restarts — record the id at the time of each
judgement gate, not once.

### F9 — Kickoff order vs. Planner writes

The kickoff says "before touching anything, tell me what the documents left you unable to answer",
and the plan says the Planner may write the plan documents. This file and the F1 row amendment are
the first writes; both are documentation, neither touches source or the skill.

---

## Not gaps — confirmed answerable from the documents

- P1 landing split (87 / 40 / 5), the two hard constraints, the preview-module recipe, the models and
  budget, the verdict format — all present and unambiguous.
- `check:doc-links` baseline: clean. `node_modules` present (`stylelint`, `@playwright/test`).
- Peer sessions visible: `zkthemetemplate-87`, `idempiere-conf-18`.

---

## Pilot outcome (item 3.1, 2026-09-10 12:44)

**PASS** — `gates/3.1.md`. Generator and Evaluator were different Sonnet 5 subagents; the Evaluator saw
only the item id and the command. Generator working set ≈ 27 KB read + 23 KB written, inside budget.

### F6 resolved — subagent writes into `zkThemeTemplate` worked without `/add-dir`
No permission prompt blocked the Generator. The added-directory step is therefore not load-bearing
for reads or subagent writes in this permission mode; keep it in the kickoff for sessions that run
under a stricter mode.

### F10 — Three nits the row's check does not catch (Planner review of the verified tree)
1. `node count-important.js | tail -1` prints the *last declaration row*, not the total — the
   evidence line reads `_motion.css:67: scroll-behavior: auto !important;`. Harmless here (the point
   was "the script runs"), but a later row that wants the number must select the `total` line instead.
2. The command never parses `SKILL.md`'s frontmatter. The Planner eyeballed it: the folded `>-`
   scalar is intact and the added trigger sentence is indented consistently. A future
   skill-touching row should include a YAML parse (or the skill-creator's validator).
3. The merge note the Planner dictated for the two new pages reads "…is Step 4 of maintaining
   Marble hygiene" — a phrase that points at nothing. Planner's wording error, copied faithfully by
   the Generator. Left as verified; a one-word fix can ride the commit if the user wants it.

### What the pilot establishes for every later item
- The verdict file format in `gates/3.1.md` is the template.
- The Generator brief must carry: repo root + `cd` rule, the row verbatim, the 100 KB budget with
  "move, don't read" named per file, the explicit list of every tracked reference that must change
  (found by `git ls-files -z | xargs -0 grep`), the exact staging allowed, and "do not touch
  `doc/migration/**`".
- Baseline the verification's environment-dependent parts (here `check:doc-links` clean,
  `node_modules` present) *before* dispatch, or a FAIL cannot be attributed.

---

## Gaps found before item 3.2 (measured 2026-09-10 after the pilot)

### F11 — 3.2's size and its verification both need restating
- **Count.** The plan says 63 distinct repo-relative path strings across skill + agents + spec.
  Measured with the same token rule `check-doc-links.js` uses: **80** file paths, **119** including
  directory references (`doc/spec/`, `tasks/gen-reports/`, …), which the map must also carry.
- **Twelve sources are already dangling here** and would fail "every source path in the map exists
  here" as written: `doc/forced-colors-review.html`, `doc/mira-reports/` (+ `framework-gaps.md`),
  `doc/spec-author-pipeline-plan.md`, `src/main/resources/web/css/` (+ `tokens/`),
  `src/main/resources/web/marble/`, `tasks/gen-reports/` (cited by **three** agents, not the plan's
  two: `zk-spec-author`, `zk-theme-evaluator`, `zk-theme-generator`), and four skill-relative
  `scripts/<name>` mentions in the pages the pilot created, which resolve against the repo root
  instead of the skill — the Planner's own wording in the 3.1 brief; a one-line fix per page.
- **`check:doc-links` is weaker than the plan assumes.** Its resolver reports MISSING only for
  `tasks/` paths (`existsSync(...) || top === 'tasks'`), and its token needs a file extension, so
  dangling references outside `tasks/` and every directory reference pass silently. "doc-links
  clean" therefore proves *no untracked targets*, not *no dead links*.
- **Most zk destinations do not exist yet.** Absent today in `zk`: `zul/src/main/resources/web/zul/css/tokens`,
  every `js/zul/<pkg>/css/` (0 dirs; 12 `less/` dirs), `zul/codegen/web`, `doc/`, `.claude/agents`,
  `scripts`; in `zkcml`: `zkmax/src/main/resources/web/zkmax/css`. They are created by P1, P2 and
  the later P3 items. So "every target path is a real zk layout location" cannot be a filesystem
  check before P1.

**Ruling F11.** The map gains a `disposition` column — `MAP` (source exists, target ruled), `STALE`
(source missing here; the referencing file is the fix), `OUTPUT` (a build-output path, mapped to
the generated tree), `DROP` (replaced by a P2 decision, e.g. the Spring Boot host). 3.2's single
verification becomes: every `MAP` row's source exists here **and** every `MAP`/`OUTPUT` target
begins with a prefix from the ruled destination table (F12). Existence in `zk` stays where the plan
already checks it — items 3.5, 3.6 and 3.10–3.14.

### F12 — Destination families no document names (needs the user's ruling)

| Source family here | Rows | Proposed `zk` destination | Basis |
|---|---|---|---|
| `src/main/resources/web/zul/css/**` | 9 | `zul/src/main/resources/web/zul/css/**` | P1 landing split, 1.3 |
| `src/main/resources/web/js/zul/<pkg>/css/**` | 1 | `zul/src/main/resources/web/js/zul/<pkg>/css/**` | 1.3 |
| `src/main/resources/web/js/zkmax/**`, `web/zkmax/css/tablet/` | 3 | `../zkcml/zkmax/src/main/resources/web/…` (same tail) | 1.4 |
| `src/main/resources/web/js/zkex/**` | 0 seen | `../zkcml/zkex/src/main/resources/web/…` | 1.4 |
| `scripts/*.js`, `scripts/*.sh` | 9 | **`scripts/…` at the `zk` root (identity)** — proposed; `zk` has no `scripts/`, its `bin/` holds legacy release shell tools, and its node tooling (`gulpfile.js`, `package.json`) already sits at the root | not in any document |
| `doc/spec/**`, `doc/contracts/**`, `doc/harness/**`, `doc/*.md` | 40 | **`doc/…` at the `zk` root (identity)** — proposed; keeps every intra-doc relative link valid and makes 3.6's check true without rewrites; `zk` has no `doc/` (`zkdoc/` is release notes) | 3.6 implies it, never states it |
| `src/test/resources/web/**/*.zul`, SPA host | 11 | **`zkpreview/src/main/webapp/…`** — proposed module name `zkpreview`, an independent root build beside `zksandbox` / `zktest` per the P2 recipe | P2 names no module |
| `src/test/playwright/**` | 8 | `zkpreview/src/test/playwright/…` | same |
| `src/test/java/zk/example/**` (Spring Boot host) | 4 | `DROP` — replaced by the 31-line servlet | P2 recipe |
| `target/classes/web/marble/**` | 3 | `OUTPUT` → `zul/codegen/web/**` (no `marble/` segment); EE → `../zkcml/zkmax/codegen/web/**` | 1.3 |
| `target/test-classes/web/` | 1 | `OUTPUT` → `zkpreview` build output | — |
| `src/main/resources/metainfo/zk/config.xml` (theme-jar registration) | 2 | `STALE` after 1.5 — the core variant registers differently | 1.5 |
| `.claude/agents/**`, `.claude/skills/**` | 19 | identity under `zk/.claude/` | P3 |
| `tasks/gen-reports/` | 1 | fix target for 3.10–3.14 — proposed `doc/harness/gen-reports/` | plan says "two-line fix", names no target |

### F13 — Two skills the plan says move to `zk` have no item
Appendix §A.7 rules `zk-component-rules` (97 files, real directory) and `zul-writer` MOVE to `zk`,
and the P3 target shape draws them there, but no numbered item does it. `zul-writer` is a
`skills-lock.json`-managed symlink into `.agents/skills/` installed from `zkoss-demo/agent-skill`;
in `zk` it should be **installed** the same way, not copied. Proposed: **3.15** copy
`zk-component-rules` (verify `diff -r` empty, 97 files) and **3.16** install `zul-writer` in `zk`
(verify the symlink resolves and `SKILL.md` parses). `show-me` is already a symlink in `zk`.

### F14 — 3.3's draft location was unspecified
Ruled: `doc/migration/drafts/zk-claude-md-pointer.md`, untracked until the user approves it; item
3.9's check "file diff equals the approved draft" compares against that file.

---

## Rulings received 2026-09-10 (chat D8 / D9 / D10)

- **F12 ruled as proposed (D8-A):** `scripts/` → `scripts/` (identity), `doc/…` → `doc/…` (identity),
  preview module = `zkpreview/` (`src/main/webapp/` for pages, `src/test/playwright/` for the harness,
  Spring Boot host dropped). The families are encoded once, in
  [tools/check-path-map.js](tools/check-path-map.js) `RULES`, which is Planner-authored so the 3.2
  Generator cannot grade its own map. Measured row set: **101** literal path strings (the earlier 119
  counted the parent directory of every file path as well; the checker's directory rule now requires
  the string to end at the slash).
- **F13 ruled (D9-A):** items 3.15 (copy `zk-component-rules`) and 3.16 (install `zul-writer`) added
  to the execution plan; P3 is 15 sized items.
- **F14 / 3.3 draft approved as written (D10-A):** `drafts/zk-claude-md-pointer.md`, 9 lines, is the
  reference for item 3.9's byte-identical check. Any later edit to it re-opens gate 3.3.
- **Open follow-up, not yet an item:** the STALE rows the map will list inside the *skill* and
  *spec* originals (skill-relative `scripts/<name>` mentions; `src/main/resources/web/css/`,
  `web/marble/`, `doc/mira-reports/`, `doc/spec-author-pipeline-plan.md`, `doc/forced-colors-review.html`)
  are dead links in this repository today. Fixing them is not "rewriting the originals for zk"; it
  is repairing the originals. Proposed as item 3.17 once the map shows the exact list.

---

## Gaps found before the P3 `zk`-side items (measured 2026-09-10 after 3.2)

### F15 — "Move" in P3 is a copy until P4 (ruling)
Items 3.6–3.8 and 3.10–3.14 say "move". Deleting the originals here now would break the skill and
the specifications this repository still serves until P4 marks it read-only. **Ruling:** every P3
"move" is a copy into `zk`; the template originals stay untouched; deletion (or freezing) of the
originals is a P4 step beside "this workspace goes read-only".

### F16 — `zk` commits need a Jira id
`zk`'s `CLAUDE.md` requires `ZK-XXXX: short description`. No document records the tracker issue for
the Marble migration. The first `zk` commit cannot be written without it — the user supplies the id.

### F17 — Root-level `doc/*.md`, `doc/harness/`, `doc/screenshots/` have no item
The map's `doc/` identity family holds 15 `doc/spec` rows, 9 `doc/contracts` rows — and **6 live
root docs** (`component-theme-variables-progress.md`, `gap-5-tail-pge.md`, `important-decisions.md`,
`orchestrator-playbook.md`, `skill-gaps.md`, `verification-harness-decisions.md`), **4 `doc/harness/`**
and **2 `doc/screenshots/`** rows that no item copies. `doc/spec/index.md` itself links to
`../component-theme-variables-progress.md` and `../contracts/`, so 3.6's "index.md links all resolve
in zk" cannot pass with `doc/spec` alone. Proposed: widen 3.6 to "copy `doc/spec` plus every other
`doc/` path the map lists outside `doc/contracts`" and run it after 3.8, or add 3.18 for the
twelve extra paths.

### F18 — P3's `zk`-existence checks presuppose P1 and P2
3.5 ("every rewritten path exists in zk"), 3.10–3.14 ("every cited path exists in zk") and 3.7–3.8
("the harness's contract loader finds them") check locations that only P1 (`zul/src/main/resources/web/zul/css/tokens/`,
`js/zul/<pkg>/css/`, `scripts/build-css.js`), P2 (`zkpreview/`, the Playwright loader) or a build
(`zul/codegen/web/`) create. The plan wrote P3 assuming phase order P1 → P2 → P3; the kickoff started
with P3 because its first items were template-side and risk-free. Which items can run now without
weakening their verification:

| Runs now, verification intact | Depends on P1 / P2 for its existence check |
|---|---|
| 3.4 copy skill · 3.15 copy `zk-component-rules` · 3.16 install `zul-writer` · 3.9 land the pointer (after 3.4) · 3.6 + F17 docs (links resolve within `doc/`) · 3.7 / 3.8 **counts only** | 3.5 (CSS + `scripts/` families) · 3.10–3.14 (agents cite CSS, output and preview paths) · 3.7 / 3.8 "loader finds them" |

Options are put to the user as chat decision D11.

### F19 — `zk` gitignores `.claude/`, `.agents/` and `skills-lock.json` wholesale
`zk/.gitignore` lines 37, 38 and 42. Only `.claude/rules/*.md` (3 files) are tracked, force-added at
some point. Consequences, measured after 3.15 / 3.16 landed:
- `zk/.claude/skills/zk-component-rules/` (97 files) and, once 3.4 runs, `marble-theme/` are
  **not committable** as the tree stands; `git status` does not even show them. The P3 goal — the
  skill *in* `zk`, visible to a fresh clone — is unreachable without a `.gitignore` change or
  `git add -f` on every commit.
- `zul-writer` and `show-me` are per-machine installs by design (`.agents/` + ignored lock); a fresh
  clone will not have them unless the install command is documented. 3.16's deliverable is therefore
  "installed here + the command recorded", not tracked files.
- `zk/.gitignore` already carries someone else's uncommitted hunk (`+graphify-out`); any Planner
  edit to it must be committed as its own hunk (`git apply --cached` of a crafted patch), never by
  staging the whole file.
Put to the user as chat decision D30 (the chat series jumps from D12 to D30 so it never collides with the plan's own D13–D24).

### F20 — `zk-component-rules` is not path-independent
Appendix §A.7 calls it theme-independent, which is true of its *content*; but 23 of its 97 files cite
template-relative paths (`src/main/resources/web/…`, `src/test/…`). In `zk` those resolve to nothing.
The copy landed byte-identical (3.15 as ruled); the rewrite belongs to a 3.5-shaped item over this
skill using the same map families — proposed **3.19**, gated like 3.5 (grep for source prefixes = 0).
The map itself (3.2) did not scan this skill; its row set would need extending or a second map file.

---

## Rulings received 2026-09-10 (chat D11 / D12, Jira)

- **D11-B:** P1 runs before the remaining `zk`-side P3 items (execution plan D24). F18's table says
  which items were affected.
- **D12-B:** item 3.18 added for the twelve uncovered `doc/` paths (F17); 3.6 now runs after 3.8 and 3.18.
- **Jira:** ZK-6112 for every `zk` / `zkcml` commit (execution plan D23; closes F16).
- **Still open before P3 resumes:** F19 (`zk` ignores `.claude/`), F20 / proposed 3.19
  (`zk-component-rules` path rewrite), proposed 3.17 (repair the 11 dead links in the template originals).

---

## Gaps found while sizing P1 (measured 2026-09-10, after D24 chose P1 next)

### F21 — The builder needs two npm packages `zk` does not have
`scripts/build-css.js` requires **`lightningcss`** (its minifier — the two silent-corruption
workarounds the plan's D14 elected to keep are Lightning-specific) and reads icons from
**`node_modules/lucide-static/icons`** for the icon stubs. `zk`'s `package.json` has neither
(`cssnano`, `postcss`, `csso` are present). Keeping the builder therefore means adding both as
`devDependencies` in `zk` — `lightningcss` ships a native binary per platform, which the CI runners
must be able to install. `zkcml`'s task can call the script in `zk` (`$zkDir/scripts/build-css.js`);
Node resolves `require` from the script's own location, so only `zk` needs the packages.
Put to the user as chat D32.

### F22 — `zk`'s generated tree is `codegen/resources/web/`, not `codegen/web/`
`zk/build.gradle:51` `def codegen = 'codegen/resources'`. The map's three OUTPUT rows and the
checker's OUTPUT rule said `zul/codegen/web/`; both corrected, checker re-run PASS (uncommitted).

### F23 — Data corrections against the plan's counts
`zul` LESS files: **67** (plan 66); `zkex` LESS: **8** (plan 7); `zkmax` 85 confirmed. Among the 67
are `zul/font/font-awesome.less` and the `ZK85Icons` font files' stylesheet — deleting them removes
`~./zul/font/font-awesome.css.dsp`, which `zul/css/zk.wcs` still lists (F24). Lang-file `<css-uri>`
counts 86 / 35 / 8 confirmed. None of this changes P1's shape.

### F24 — Item 1.5 ("core-registration variant") has no design
The plan says "author a second variant of the 5 Java classes, not a copy" and stops there. What the
theme-jar variant does, and what each part becomes when Marble is core's default:

| Jar variant does | In core | Needs a ruling? |
|---|---|---|
| `MarbleThemeProvider.beforeWidgetCSS` rewrites `~./zul/`, `~./js/zul|zkmax|zkex/` through `resolveThemeURL` (the theme-prefix rewrite) | **Drop** — `StandardThemeProvider` already calls `resolveThemeURL`, which is the identity for the default theme | no (plan already says delete it) |
| Returns `null` for `~./zul/font/font-awesome.css.dsp` | **Remove the line from `zul/css/zk.wcs`** — its LESS source is deleted by 1.6 anyway; P4's icon-fallout item owns the consequences | no |
| Inserts `reset.css` / `reset-embed.css` before `zk.wcs`, switched by library property `org.zkoss.zul.theme.browserDefault` | either **(a)** a `<stylesheet href="~./zul/css/reset.css.dsp"/>` line in `zk.wcs` (no Java, loses the switch) or **(b)** the switch kept in a small core provider | **D31** |
| `MarbleThemeWebAppInit`: `Themes.register("marble", …, JAR)`, EE → `tablet:marble`; `setThemeProvider`, `setCustomThemeProvider(true)` | **Drop** — the default theme is registered by `StandardTheme()`; `zul/zk.xml` already names the default provider; zkmax's provider chain (`zkex` → `zkmax`) handles `tablet:` for the default theme; `tablet.css.dsp` is P4 item 4.4 | no |
| `StandardTheme.DEFAULT_NAME = "iceblue"` (`zweb`, public constant; used by `ServletFns`, `ThemeFns`, zkmax `ResponsiveThemeRegistry`) and `dom.ts:18 tname = 'iceblue'` | the default theme's *name* — `"marble"`, or keep `"iceblue"` as an opaque id for the default? Once IceBlue ships as a jar, `Themes.setTheme(exec, "iceblue")` must mean the jar | **D33** |
| `MarbleBrand`, `MarbleDensity` — public runtime APIs (`apply(Brand)`, `apply(Component, Density)`) | must live somewhere in `zul` with a ZK-11 public name and package | **D31** |
| `Version.java`, `config.xml`, `lang-addon.xml`, `zk.xml` (theme-jar plumbing) | **Drop** — `zul` has its own; the version is `zk`'s | no |

The verification for 1.5 stays as the plan wrote it (page served from `zk` returns CSS with
`--zk-color-primary`, no `marble/` segment), and the Opus Evaluator judges it.

### F25 — `compileCSS` stops being a no-op the moment 1.3 lands
`compileCSS` fires when `web/$project.name/css` exists and runs gulp `build:minify-css` over it;
today that directory holds only `zk.wcs`. After 1.3 it holds 25 `_`-prefixed token/base/utility
partials, which gulp would **copy verbatim into `codegen/…/zul/css/`** (they are not `.css.dsp`, so
"copy" not minify) and ship in the jar. Harmless but wrong. **Ruling:** 1.6 / 1.7 remove
`compileCSS` alongside `compileLess` (Marble's task is the only CSS task), and 1.1's Gradle task
declares `outputs.dir` on the codegen `web/` tree so Gradle's up-to-date check works.

### F26 — What the `build-css.js` port must change (spec for 1.3b)
Today: one `webDir` (`src/main/resources/web`), one `themeDir` (`target/classes/web/marble`), all
three modules scanned from one tree, and two side outputs written into the template repo
(`doc/spec/icon-index.md`, `src/test/resources/web/icons-lucide.zul`). In `zk`:
- roots per module — CE `zul/src/main/resources/web`, EE `../zkcml/zkmax/src/main/resources/web`,
  PE `../zkcml/zkex/src/main/resources/web`; outputs `<module>/codegen/resources/web/`; selected by
  `--module zul|zkmax|zkex` (the Gradle task in each repo passes its own);
- the orphan guard and the `CSS_URI_BACKED` list read the **real** lang files by module;
- the side outputs go behind `--emit-docs` (off by default) and target `doc/spec/` and `zkpreview/`
  once those exist (P3 / P2);
- `lucide-static` resolved from `zk/node_modules`;
- `check-css-dsp.js`: `ZK_HOME` derived from its own location (`zk/scripts/../..`), theme dir per
  module, no hardcoded `/Users/…` path.
Working set: 39 KB read + ≈40 KB written ≈ 80 KB — inside budget only because the CSS sources are
copied by path in a separate item. So **1.3 is split**: 1.3a relocate the 87 CE sources (paths only);
1.3b port the two scripts. 1.1 then only touches `zk/build.gradle` (+ `package.json` for F21).

### F27 — `zul/css/zk.wcs` is the one file both pipelines and both themes touch
It lists `font-awesome.css.dsp` (goes away, F23/F24) and `norm.css.dsp` (Marble builds it — the
tokens + base + utility + no-`css-uri` components bundle). If D31 chooses (a) it also gains the
reset line. Edit it once, in 1.6, in the same commit range as the LESS deletion.

---

## Rulings received 2026-09-10 (chat D30–D33)

- **D30-A** → execution plan D25 (`.gitignore` policy). **D31-B** → D26: keep the
  `org.zkoss.zul.theme.browserDefault` switch — the user states it is a specification the IceBlue
  side also depends on and cannot change. **D32-A** → D27. **D33-A** → D28.
- Template batch 3 approved: F22 fixes to the map and checker, the `gates/` exclusion in
  `check-doc-links`, findings F21–F27.

### F28 — The per-module output counts the plan gives for 1.1 / 1.2 are wrong
Running the template's own build (`npm run build:css`, 2026-09-10) and grouping the 86 `.css.dsp`
by destination module:

| Module | Outputs | Of which |
|---|---|---|
| `zul` (CE) | **46** | 43 under `js/zul/**/css/` + `zul/css/norm.css.dsp`, `zul/css/footer.css.dsp`, `zul/font/font-awesome.css.dsp` (empty stub) |
| `zkmax` (EE) | **33** | 32 under `js/zkmax/**/css/` + `zkmax/css/tablet.css.dsp` |
| `zkex` (PE) | **7** | `js/zkex/**/css/` |

The plan's row 1.1 expects "exactly 86" from `:zul:compileMarbleCss` — 86 is the all-module total;
row 1.2 expects "40 + 5" — it is 33 + 7. Rows amended. The FA stub stays in P1 (it keeps
`zk.wcs`'s request from 404-ing until 1.6 removes that line); P4's icon item may drop it.

Cross-module note: `norm.css.dsp` (CE) bundles `toast.css` and `captcha.css`, whose *components* are
`zkmax` — but Marble keeps those two files under `js/zul/wgt/css/`, so the CE build never reads the
`zkcml` tree. The `--module` split is clean.

### F29 — `zk`'s node is the system node
`zk/build.gradle` applies `com.github.node-gradle.node` 7.0.1 without a `node {}` block, so
`download` defaults to false and Gradle uses the system Node (v22.16.0). `lightningcss`'s native
binary for this platform installs normally. (`zkcml/gradle.properties` still says
`nodeVersion=15.12.0`; unused unless `download` is turned on.)

---

## Gaps found by the first P1 batch (2026-09-10)

### F30 — The builder vendors the Inter web font; the port spec (F26) omitted it
`build-css.js` copies `inter-latin-wght-normal.woff2`, `inter-latin-ext-wght-normal.woff2` and the
OFL licence from `@fontsource-variable/inter` (installed 5.2.8 in the template) into `font/` of the
output. F26 listed lightningcss and lucide-static only, so the 1.3b Generator — correctly reading
the spec — dropped `copyFonts`. Without the fonts every page falls back to the system font: exactly
the "uniform vertical drift on every page" the plan warns the P2 comparison will show first.
**Ruling:** 1.0b adds `@fontsource-variable/inter@5.2.8`; 1.3b2 restores `copyFonts` in the port,
writing to `zul/font/` under the module output root (`--module zul` only), beside the FA stub.

### F31 — `_fonts.css` hardcodes `~./marble/font/…`
Four occurrences (two `url()` and two comments) in `zul/css/tokens/_fonts.css`. In core the theme
has no `marble/` segment (plan P1, item 1.5's check), so `zk`'s copy must read `~./zul/font/…`.
This is the one CE source whose copy is *not* byte-identical to the template — by design, and the
only such file. **Item 1.3c**, run before 1.3b2 so the built `norm.css.dsp` carries no `marble`.
Grep over the 87 sources found no other `marble/` string.

### F32 — Second verification-decoration defect in one day
Gate 1.0 (`require('x/package.json')`) and gate 1.3b (`tail -3 | grep`) both failed correct work
because the Planner's command asserted more than the row's claim, or asserted it fragilely. Rule in
`zk/tasks/lessons.md`: the Evaluator command is the row's primitive claim, dry-run on the actual
tree before dispatch whenever the tree exists. Both were corrected and re-verified with fresh
Evaluators; the Generator results were reused from cache, never re-attempted.

### F33 — Evaluator commands must be permission-neutral
Gate 1.1's first Evaluator call returned exit −1: the harness asked for permission because the
command began with `rm -rf` (clearing old LESS output so a count would be clean), and a subagent
cannot answer a prompt, so the call was denied before any shell ran. A denial is not a verdict —
the gate file records it as such — but it costs a round trip and can masquerade as FAIL.
**Rule:** verification commands never delete, never `sudo`, never touch anything outside temp dirs
and the build's own output; when old output would pollute a count, use a timestamp marker and
`find -newer`, or build into `--out $(mktemp -d)`. Added to `zk/tasks/lessons.md`.

### F34 — Item 1.5's "page served from zk" check needs a live server; restated
The plan's 1.5 verify ("a page served from `zk` returns CSS containing `--zk-color-primary` and no
`marble/` segment") is a runtime claim; the only servers in `zk` are `zksandbox`/`zktest` under
gretty, which the P2 preview module (2.1) is built to replace and whose 2.1 check is exactly this
claim. **Ruling:** 1.5 verifies what can be proven without a server — `zul`/`zweb` compile and
`checkstyleMain` pass, `zkex`/`zkmax` compile against the new base class, the static wiring
(`zk.xml`, `StandardTheme`, `dom.ts`, the zkex `extends`) is in place, and a fresh CE build's
`norm.css.dsp` contains `--zk-color-primary` with no `marble/` string anywhere in the output. The
Opus Evaluator also reads the new provider class and records a non-binding design note. The runtime
proof lands in 2.1 and in the P1 gate's jar inspection.

### F35 — `zk` requires a test case per feature; `zul` has no `src/test`
`zk/CLAUDE.md`: "Every bug fix and new feature MUST include a test case", in `zktest` (`B<ver>_ZK-6112…`).
`zul` has no unit-test tree, and the theme's behavioural proof is P2's Playwright harness. Proposed:
one `zktest` page + `WebDriverTestCase` under ZK-6112 asserting the reset stylesheet precedes
`zk.wcs` and a `--zk-*` token is computed on `body` — authored in P4 beside the icon fallout, or now
as item 1.9 if the user prefers the convention honoured before the first `zk` commit.

### F36 — Icon-font binaries become orphans when the LESS goes
`zul/src/main/resources/web/zul/less/font/` holds 15 Font Awesome LESS partials **and** 14 non-LESS
files: `ZK85Icons.{eot,svg,ttf,woff}` and the FA `fa-*.{ttf,woff2}` / `brands.svg` binaries. Nothing
outside the LESS references them (`git grep ZK85Icons` hits only the files themselves). Item 1.6
deletes LESS only, as the plan says; the 14 binaries stay as dead weight in the jar until the user
rules (P4's icon item is the natural home). Also affected downstream: `zktest` pages
`B110-ZK-6024`, `B86-ZK-4120`, `F100-ZK-5119-1` reference `font-awesome.css.dsp` / `z-icon-font-awesome`
— P4's baseline will show them.

### F37 — Tooling orphaned by 1.6 / 1.7
Removing `compileLess` orphans the `zkless-engine` devDependency (only `zklessc` used it; both repos
call `zk/node_modules/.bin/zklessc`); removing `compileCSS` orphans gulp's `build:minify-css` task and
its `gulp-postcss` require. 1.6 removes the dependency, the task and the require. Whether `cssnano`,
`postcss` and `gulp-postcss` devDependencies (now unused) are dropped from `package.json` is left as
a follow-up — a package-level change worth its own line in the commit.

### F38 — 1.8's negative control without deleting anything
The plan's check ("temporarily remove one registered `.css.dsp` → task fails; restore → passes")
would need `rm` inside the Evaluator (F33). Ruling: the Gradle task accepts
`-PmarbleCssThemeDir=<dir>` and passes it as `--theme-dir`; the Evaluator builds into a temp dir,
`rsync`s it minus one file into a second temp dir, and proves the task fails on that dir and passes
on the real codegen. No deletion, same claim.

### F39 — The Opus gate on 1.5 surfaced a consequence of D26-B worth a ruling
With the reset insertion in a *subclass* (`MarbleThemeProvider`), any existing custom provider that
`extends StandardThemeProvider` — the pattern ZK documents for customers — keeps compiling but no
longer receives Marble's reset stylesheet, silently. The zkex/zkmax chain had to be re-based for the
same reason, producing the odd `StandardThemeProvider extends …MarbleThemeProvider`. The alternative
is to put the insertion **into `StandardThemeProvider.getThemeURIs` itself**: no new class, no
re-basing, custom providers inherit the reset, and the `browserDefault` switch is honoured exactly the
same way; `~./zul/css/reset.css` goes through `resolveThemeURL`, so a jar theme (IceBlue) that ships
its own `reset.css` gets its own. Cost: `StandardThemeProvider` gains theme-reset behaviour for every
theme, which is arguably what "standard" should mean once the default theme needs a reset. Chat D34.
**Ruled 2026-09-10:** chat D34-A → plan D29; implemented as item 1.5b (Opus-evaluated, like 1.5).

### F40 — Evaluators paraphrase commands unless told not to
The 1.5 Evaluator dropped the leading `cd` from two of three commands ("the shell already starts
there"). Harmless here, but a paraphrased command is no longer *the row's* command. The
multi-command brief now says "type each one verbatim, including its leading cd".

**Addendum (1.5 re-verification, same day):** with "type each one verbatim, including its leading
`cd`" in the brief, the Opus Evaluator still dropped the `cd` on two of three commands ("the shell
was already there") and ran command 1 three times — disclosed, harmless here, but a rule that is
followed only when convenient is not a control. **Structural fix from the P1 gate on:** the
verification lives in a tracked script (`tools/gate-p1.sh`), the Evaluator's command is
`bash <file> <stage>`, and each check prints its own marker (F42), so there is nothing to retype and
nothing to misattribute.

### F41 — `npm run lint` is broken on this machine, independent of the migration
`npm run lint -- <dir>` exits 2 for `zul/` and `zk/` alike with an ESLint configuration error on the
`zk/noMixedHtml` rule options. `eslint-plugin-zk/dist` (gitignored) was last built 2024-09-26; its
`src/` changed 2026-07-15. ESLint 9.39.4 and every plugin version are identical before and after item
1.0's `npm install`, so the install did not cause it. `zk/CLAUDE.md` makes `npm run lint -- .` a
pre-commit requirement, so the P1 gate could not pass until the plugin was rebuilt. **Resolved:**
`./gradlew buildESLintPlugin` (8 s, regenerates only the ignored `dist/`) — afterwards `npm run lint`
exits 0 for `dom.ts` and for the whole `zul/` tree. Root cause: a normal Gradle build refreshes the
plugin (`classes.dependsOn buildESLintPlugin`), but a standalone `npm run lint` on a machine whose
`dist/` predates the plugin's source changes fails at configuration time. Worth a line in `zk`'s
CLAUDE.md pre-commit recipe ("run `./gradlew buildESLintPlugin` first if lint reports a config
error"). Lint removed from 1.5's row; it belongs to the gate.

### F42 — "No duplicate `.css.dsp` basenames" is not an invariant; it failed 1.7 for a legitimate file pair
The Planner added a `uniq -d` basename check to 1.6 / 1.7 as a proxy for "no LESS-built output survived
beside a Marble output". It passed on `zul` by luck and failed 1.7 on `zkmax`: `goldenlayout.css.dsp`
legitimately exists twice — the real widget CSS under `js/zkmax/goldenlayout/css/` (widget-package
`zkmax.goldenlayout`, `<css-uri>css/goldenlayout.css.dsp</css-uri>` in `lang-addon.xml`) and a
deliberate 0-byte stub under `js/zkmax/layout/css/` from `build-css.js`'s `stubPaths`. Basenames are
not unique across ZK widget packages, so the clause proves nothing. The Generator's work was correct:
LESS = 0, tasks removed, `:zkmax:processResources` exit 0, exactly 33 outputs newer than the marker
(re-run by the Planner read-only). Clause dropped from 1.7's command; 1.6's verdict stands (the clause
happened to be true there). The Evaluator also mis-attributed the failing `&&` stage — two silent
`test`s in a row are indistinguishable from the output alone; future chains should echo a marker
between stages that produce no output.

### F43 — Stale pre-Marble artefacts linger in `codegen/`; only `clean` removes them
`processResources` never deletes what an earlier pipeline wrote. Today `zul/codegen/…/zul/css/ext.css.dsp`
(2023-12-22) and `zkex/codegen/…/js/zkex/wgt/css/skeleton.css.dsp` (built 14:59 by the LESS task before
1.7) sit beside the Marble outputs; neither is in the builder's output set. `codegen/` is gitignored, so
commits are unaffected, and `zk/build.gradle`'s `clean.doFirst { delete "$projectDir/codegen/" }` removes
them on a clean build — which is why the P1 gate must build from `clean`, and why a "codegen set equals
the builder's set" check belongs to the gate, not to 1.6 / 1.7 (where it would false-fail on these).

### F44 — Workflow resume replays a *positional* prefix, not matching prompts; Generators must be idempotent
Resuming `wf_abfefc3a-44e` with `args.items = ["1.7", "1.8", "1.5b"]` re-ran 1.7's Generator even though its
brief was byte-identical to the cached run — the cache replays the longest unchanged prefix of agent
calls in order, and the first call now differed (the earlier run began with 1.5). No harm came of it
because the brief's first step was a precondition (`test … = 93` before `git rm`) and the Generator,
finding the work already done, verified instead of redoing it. **Rule:** every Generator brief starts
with a precondition that fails closed when the work is already there, and a resume that changes the
item order is treated as a full re-run for planning purposes (Gradle contention, budget). Where a
Generator must not run twice (destructive steps), run it in its own workflow launch.

### F45 — `npm run lint -- .` is not what CI runs, and cannot pass on any checkout
The P1 gate dry-run failed its first stage 2 on `npm run lint -- .` with 9 422 errors. Buckets: 244
files under the IDE output directories `*/bin/` (gitignored, machine-local), 22 in `zktest/src`, 50 in
`eslint-plugin-zk/{src,dist,tests}`, 2 in `zksandbox/src` — none of them touched by the migration —
plus 60-odd hits in the two ported `scripts/*.js` (Node globals `require`/`process`/`__dirname`/
`Buffer` undefined under the browser-oriented config, `one-var`, `no-console`, `zk/noNull`). CI
(`zk-build.yml`) runs `./gradlew clean build`, whose lint is the per-module `jscheck` task
(`npm run lint -- <module>/src/main/resources/web/js`) plus `tscheck` (`npm run type-check`); it
never lints `scripts/`, `zktest`, the plugin or `bin/`. The repository's own `gulpfile.js` has 99 errors
under the very Node override written for it. So the zk/CLAUDE.md checklist line `npm run lint -- .` is
aspirational, and the gate now runs what CI runs (stage 2 rewritten). **Open (chat D36):** whether the
ported scripts should be made lint-clean — add `scripts/*.js` to the `gulpfile.js` Node override and
fix the residual rule hits in a small item — or stay outside lint like `gulpfile.js` does today.

### F46 — Third verification defect of the day: a diff grep that counted context lines
1.6b's clause `git diff -- package.json | grep -c codemirror` was meant to prove npm's re-sort had
been undone; it counted the three `@codemirror/*` *context* lines that follow the devDependencies
edits and failed a correct tree (the Generator's own diff showed the intended 9 changed lines and no
dependency churn). Fixed by filtering to `^[-+] ` first. The pattern behind F32, F42 and F46 is the
same: a clause dispatched without a dry run against the nearest existing state. Rule recorded in the
`zk` session's lessons file (untracked there); the gate script's per-check markers exist for the same reason.

### F47 — `npm run lint -- .` mutates files: `zk/preferNativeClass` writes its rewrite without `--fix`
The Planner's first gate dry-run (F45) left five files modified that no item touched —
`zksandbox/src/main/webapp/macros/category.js` and `zktest/src/main/webapp/web/js/wgt4714/test0{1..4}/Test0*.js`
— each rewritten from `zk.$extends(...)` to `@zk.WrapClass … export class`, with mtimes matching the
lint run to the second. ESLint only applies fixes under `--fix`; `eslint-plugin-zk/src/rules/preferNativeClass.ts`
imports `spawnSync` from `child_process` and hands the file to a codemod, which is what wrote it.
Reverted with `git checkout --`. Two consequences: never run the repository-wide lint on a
tree you intend to commit from (the gate no longer does), and the rule's side effect is a defect to
report to the plugin's owner outside this migration.

### F48 — zktest is IceBlue-configured in three places, only one of which is a test
While scoping the user's 2026-09-10 instruction to skip IceBlue-related tests: (1) 30 `test2/*.zul`
pages mention `iceblue`, but only 15 have a Java test, and of those only **two** assert IceBlue-specific
values (`B86_ZK_4102Test`, slider 32 px; `F96_ZK_4783Test.testIceblue()`, messagebox 480 px) — the
other 13 mention it in an unused theme switcher, a label or a comment and assert theme-independent
relations. Tagging is therefore per test and, for 4783, per method. (2) `zktest/src/main/webapp/WEB-INF/zk.xml:712`
sets `org.zkoss.theme.preferred` to `iceblue`; `ThemeFns.getCurrentTheme` honours it only if a theme of
that name is registered, and otherwise falls through to the highest-priority registered theme.
(3) `zktest/build.gradle:69-72` puts four ZK 10 theme-pack jars (Breeze, Silvertail, Sapphire,
Atlantic, `10.0.1.1-Eval`) on the classpath, each registering a theme. Under Marble, `iceblue` is not
registered, so which theme zktest actually serves is decided by the priority fallback — a P2 concern
for item 2.9 and any Marble-verifying run of zktest, and a chat decision (D47) on pinning the preferred
theme — **ruled D47-a: `marble`** (plan D41).

### F49 — ZK appends `;jsessionid=…` to stylesheet hrefs on a cookie-less first response
Found by dry-running [tools/page-probe.js](tools/page-probe.js) against the template's live preview on
port 8081 (harness rule 2): every `document.styleSheets` href read
`…/zul/css/reset.css;jsessionid=<id>`, so a regex ending in `\.css(\?|$)` matched nothing and the probe
reported `resetIndex −1, wcsIndex −1` on a healthy Marble page (670 `--zk-*` declarations). A headless
browser's first request carries no cookie, so the servlet container URL-rewrites the session id into
every URL ZK emits; the second request in the same context does not. Fixed: the probe's two patterns
accept `;`, `?` or end-of-string after the file name. Rule for every P2 URL assertion: match the path
segment, never the end of the href. Had this shipped, the 2.1 Evaluator would have returned a FAIL that
was the Planner's, exactly the P1 pattern the retrospective counted six times.

### F50 — `zk` drags `zkwebfragment` in; a hand-written `web.xml` must exclude it (2.1 run 1 FAIL)
Run 1 of item 2.1 (`wf_14ee2332-eed`) produced every file the brief asked for and passed `static`, but
gretty's `appStart` refused to start: `Multiple servlets map to path /zkau/*` — the module's explicit
`auEngine` against `DHtmlUpdateServlet` from `zkwebfragment-11.0.0-SNAPSHOT.jar!/META-INF/web-fragment.xml`.
`zk/build.gradle:16` declares `api project(':zkwebfragment')`, so every consumer of `zk` inherits the
Servlet 3.0 fragment, which also maps `*.zul` to `DHtmlLayoutServlet`. zktest lives with it through
`zktest/build.gradle:56-59`: `configurations.all { exclude group: 'org.zkoss.zk', module: 'zkwebfragment' }`.
The brief copied zktest's `settings.gradle` and `web.xml` but not that exclusion — a Planner omission,
the seventh first-run FAIL of the migration caused by the brief or the verifier rather than the Generator.
Two consequences: (1) the brief and `verify-2.1.sh static` now carry the exclusion; (2) the failed
`appStart` left its Jetty JVM listening on 8085 (gretty's `appStop` could not reach it), so the
Evaluator's `live` failed at the pre-start port check — a second FAIL that said nothing about the
artefacts. `verify-2.1.sh live` now recognises the module's own leftover runner (a
`org.akhikhl.gretty.Runner` JVM whose working directory is `zkpreview/` — its command line never names
the module) and stops it before starting; a foreign listener still fails the gate.

### F51 — gretty 3.1.1 under Gradle 8.10: `appStart` never returns; background `appRun` needs a live stdin
Run 2 of item 2.1 (`wf_89e58cc5-2bb`): the Generator fixed the two run-1 gaps and `static` passed, but
`./gradlew appStart -PhttpPort=8085 --console=plain -q` printed Jetty's ready banner, served
`smoke.zul` with HTTP 200 — and the Gradle client process never returned (0 % CPU, twice: once after a
16-minute cold composite build, once warm in under a minute). `verify-2.1.sh live` therefore hung until
the Evaluator's 600 s Bash timeout; the Evaluator then improvised a background run with a `sleep` poll,
which this environment blocks, and stalled on the resulting permission prompt until the run was stopped.
Two fixes, both proven by a Planner dry-run on the Generator's tree (8 s warm, `2.1 live ok`):
(1) the script starts `appRun` in the background and detects readiness itself by polling the page URL,
every wait bounded (`START_TIMEOUT`, default 300 s); (2) `appRun` reads "any key" from stdin and treats
EOF as that key, so a background `appRun` with no stdin stops the instant it starts — the script feeds
it a FIFO whose write end it holds on fd 3, and closing fd 3 is the graceful shutdown (fallback: bounded
`appStop`, then kill only a `gretty.Runner` whose cwd is `zkpreview/`). The Evaluator brief now says:
never background, never poll, never sleep; a command still running at the timeout is a FAIL with cause
"timeout". Environment facts for 2.2/2.3: the served page lists `reset.css`, `zk.wcs`,
`zkmax/css/tablet.css.dsp` and `zkex/wgt/css/skeleton.css.dsp` in that order; the in-page count is 670
`--zk-*` declarations — the same number the template's ZK 10 preview serves, so the Marble variable set
crossed the migration intact.

### F52 — Item 2.2 throw-away run: class web resources, shadow elements, one API drift
Rule 2, upgraded after 2.1, asks for the server to be started by hand on a populated tree before dispatch.
The Planner copied the 379 files into a throw-away `zkpreview/src/main/webapp/web/` and learned four things
no static dry-run could show. (1) The pages reference each other and their assets as class web resources
(`~./…`, 87 pages) because the template's Spring Boot preview serves everything from the class path; a copy
into a webapp root serves the direct URL and nothing the page links to. `org.zkoss.web.util.resource.dir`
(documented in zktest's own `zk.xml`) makes `ClassWebResource` look in a webapp directory first — and the
directory is always prefixed (`/web`), which fixes the URL shape `…/zkpreview/web/<page>.zul` (plan D44).
(2) `<apply>`, `<forEach>` and `<choose>` are zuti shadow elements: without `zuti` on the classpath four
pages answer 500 with "Component definition not found: apply". The template preview app has `zuti` and
`za11y` (test scope) on its classpath, so both join `build.gradle`. (3) `ZulListVM` lists the pages by
`getClassLoader().getResource("web")`, which in the module is a ZK jar's directory; it now reads
`WebApps.getCurrent().getRealPath("/web")`. (4) `codeeditor.zul` answers 500 because `f6429e7f8b` (fix
ZK-6086) renamed Codeeditor's `theme` property to `colorScheme` after the build the template pins (plan D46).
Result: 136 / 137 pages green in 29 s with four browser workers; `preview.zul` lists 114 pages, exactly as the
template's does; `pv/cascader-content.zul` answers 500 when loaded directly on both hosts (a fragment, not
a page — `pv/` is excluded from navigation and exercised through the 20 pages that apply it). Two more
environment facts: `./gradlew :zksandbox:war --dry-run` from the root composite fails with "Unable to make
progress running work" while the real task runs in 21 s (the verify uses the real task); and two Gradle
builds in one checkout must not overlap, so the workflow serialises items that share the `'gradle'` lock and
every footprint check is scoped to its own item's paths.

### F53 — Item 2.3 throw-away: the harness runs untouched at the context root; a caret pulled the wrong Playwright
The template's 14 specs all navigate with a leading slash (`page.goto('/button.zul')`); Playwright resolves that
against the origin, so a `baseURL` carrying the module's `/zkpreview/web/` prefix sends every spec to a 404. The
Planner's throw-away (rule 2) put the module at the context root (gretty `contextPath = '/'`) with a 30-line
javax `Filter` that forwards `/<page>.zul` to `/web/<page>.zul` when the page exists — `~./` resolution (D44) is
untouched, `/smoke.zul` and unknown pages are left alone, and a query string survives the forward. The copied
harness then reported **115 passed in 100 s** with the specs byte-identical apart from three `WEB_DIR` lines and
the config's default `baseURL`, also on the default `http://localhost:8085`. Two traps: (1) `"@playwright/test":
"^1.59.1"` resolved to 1.63.0, whose Chromium (headless shell 1243) is not installed here — every test died with
"Executable doesn't exist"; the module pins `1.59.1` exactly, the template's installed version, and the brief
forbids `playwright install`. (2) The Servlet 2.4 API the module compiles against has no
`ServletRequest.getServletContext()`; the filter takes the context from `FilterConfig`. Environment: `npm install`
6 s; `verify-2.3.sh live` 1 m 47 s warm. `verify-2.1.sh` and `verify-2.2.sh` now read the context path from
`build.gradle` and were re-run green on the context-root tree before it was cleaned away.

### F54 — Item 2.3 landed first run; no CI check looks at the new footprint
Run `wf_87ac621a-dc8`: Generator + Evaluator 5 m 13 s, the Evaluator's `--project=smoke` 115 passed in 1.6 m (the
Planner's throw-away had taken 100 s). Landed as `60f4895c4f` — 22 paths, 6 497 insertions, almost all of them the
copied specs and `package-lock.json`. Before committing, the Planner ran what CI runs: `./gradlew checkstyleMain`
passes, but checkstyle is applied to `zk` and `zul` only, so `PreviewPathFilter` is compiled (by `./gradlew build`
and by gretty) and never style-checked; CI's `jscheck` lints each module's `src/main/resources/web/js` only, so
`zkpreview/src/test/playwright` sits outside every ESLint and tsconfig project — `npx eslint` on it reports 15
"file was not found in any of the provided project(s)" parse errors, the same class of error that already keeps the
root `npm run lint -- .` from passing (the CLAUDE.md lint line, P3 follow-up). `zkpreview` is not in the root
`package.json` `workspaces`, so its `package.json` is a self-contained package that root `npm ci` ignores. The
module `.gitignore` hides Playwright's own `test-results/` and `playwright-report/`; `git status --porcelain --
zkpreview` is empty after the commit.

### F55 — Rule-2 hand run for 2.6–2.8: zkpreview reproduces 177 of 183 template baselines pixel-exactly; the six differences are not theme CSS
Method (D49 C): the template's unchanged spec files were run from the template checkout with `PREVIEW_URL=http://127.0.0.1:8085`
while `zkpreview` (zk `60f4895c4f`) served the pages, through [tools/zero-tolerance/shots.config.ts](tools/zero-tolerance/shots.config.ts)
(same specs, `snapshotDir` redirected, `updateSnapshots: 'all'`), then every PNG produced was compared with the committed baseline
through Playwright's own comparator at `threshold: 0, maxDiffPixels: 0` ([compare.config.ts](tools/zero-tolerance/compare.config.ts),
[compare.spec.ts](tools/zero-tolerance/compare.spec.ts), summary by [summarize-cmp.py](tools/zero-tolerance/summarize-cmp.py)); no
image library is installed here and none is needed. Projects `chromium` + `gallery` + `tablet`: 260 tests, **258 passed** in 1.8 m, 183
PNGs. **Zero tolerance: 177 identical, 6 differ.** Two of the six are flaky (`selectbox-focus` 2 px, `timepicker-gallery` 6 px — a second
shot of the same pages was byte-different from the first and identical to the baseline), so the P2 harness re-shoots a differing page up to
three times before it counts as a difference. The four deterministic ones (byte-identical across two runs): `portallayout-gallery`
(1 397 px — the two `<calendar/>` on the page have no value, so the today marker moved from the 7th, the day the baseline was cut, to the
11th: date-dependent content, not a rendering difference), `codeeditor-gallery` (1 314 px — the baseline predates `db3e1c2d`, which
changed the captions `theme=` → `colorScheme=`; a stale baseline of the template's own page, plus 1-px edges around the dark surfaces),
`splitter-gallery` (4 470 px — everything right of the vertical splitter sits 1 px to the left: the `.z-hbox` is 155 px wide in `zkpreview`,
156 px in the baseline), `progressmeter-gallery` (202 px — the fill's leading pill is ~3 px shorter). The Marble CSS **sources** in `zul`
are byte-identical to the template's except `_fonts.css` (font paths `~./marble/font/` → `~./zul/font/`, intended by P1), and the served
splitter and progressmeter rules match the sources, so the splitter and progressmeter differences come from the ZK runtime, not the theme:
**the baselines were rendered on ZK `10.4.0-jakarta.FL.20260713`** (the template's `pom.xml` at `2233c586`, the 2026-09-07 re-cut) — only
`codeeditor-gallery` (2026-09-08) was cut on 11.0.0 — while `zkpreview` renders on 11.0.0-SNAPSHOT (branch base `f6429e7f8b`, 2026-09-08).
Two tests fail on `zkpreview` for a structural reason: `screenshot.spec.ts` finds the theme prefix by looking for a stylesheet `href`
containing `/marble/` (`/zkau/web/<v>/marble/zul/css/reset.css` in the template, where Marble is a theme jar); in `zk` Marble is the core
theme and the link is `/zkres/web/<v>/zul/css/reset.css`, so `combo.css.dsp` is never fetched and both datebox assertions fail — they cannot
pass on `zk` without a spec change. Bookkeeping: 16 baselines under `doc/screenshots` are produced by no spec any more (`breadcrumb-*`,
`carousel-*`, `linelayout-*`, `stepbar-fixed-*`, `grid-utilities-gallery`; July files) — orphans; the 100 `*-forced-colors.png` are written
directly by the `forced-colors-gallery` project, not `toHaveScreenshot` baselines, and are outside 2.6–2.8. Control run: the template's own
preview app on 8081 (started 2026-09-09 09:19, before the template's last two days of commits, on the old ZK pin) fails 70 of its own
tests and differs from **every** baseline by size (1 264 px wide against 1 280 — a visible scrollbar), so it is stale and not a reference;
it must be restarted before the template can measure itself. Timings: shots 1.8 m (zkpreview) / 6.5 m (stale 8081, many timeouts),
compare 11 s, re-shoot of six pages 8 s. Helpers for inspection: [zoom.js](tools/zero-tolerance/zoom.js) (magnified crop through Chromium)
and [probe.js](tools/zero-tolerance/probe.js) (stylesheet list + computed boxes).

### F56 — Item 2.10 hand run: the test-name grep trap and a verify script that only works on its own pre-commit tree (2026-09-11)

- `zkpreview` serves `combo.css.dsp` at `/zkres/web/<v>/js/zul/inp/css/combo.css.dsp` (200, 27 KB); the `reset.css` link's `href` carries `;jsessionid=…`, which the `indexOf('/zul/css/reset.css')` slice ignores. With the four-line change both theme-prefix tests pass against `zkpreview` (2 passed, 2.3 s from a throw-away copy; in-tree `verify-2.10.sh static` + `live` green in about a minute, then reverted). On the unchanged copy the result is **1 failed, 1 passed** — not two failures — because the first `-g` pattern I wrote, `open state`, matched `datebox open state (icon click)` (a different test that passes) and not the second lookup's test, `datebox & bandbox open-state` (hyphen). Rule for `-g` filters in verify scripts: list the selected tests by `--list` first and count them; the brief and the script now carry the hyphenated name.
- `verify-2.3.sh static` cannot be re-run green once 2.3 is committed: its `build.gradle` / `web.xml` checks read `git diff` against the working tree. Later items that must prove "2.3 still holds" repeat the relevant file check themselves (2.10 repeats the 15-file harness diff) rather than call the earlier script. Its allowlist was still extended with the four 2.10 lines so it states truthfully what the copy may contain.
