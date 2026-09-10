# Marble → zk Migration — Execution Plan (Planner · Generator · Evaluator)

**Status:** **D21 and D22 ruled 2026-09-10.** **Pilot (item 3.1) PASSED** — [gates/3.1.md](gates/3.1.md); rows 3.1 / 3.4 amended per [planner-cold-start-findings.md](planner-cold-start-findings.md) F1. · **Written:** 2026-09-09 · **Revised:** 2026-09-10
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
| P1 | 5 | **8** | LESS deletion and the Gradle task each split per repository | `zk` / `zkcml` |
| P2 | 6 | **9** | the zero-tolerance comparison split by baseline family (99 / 70 / 30) | `zk` |
| P3 | 6 | **13** | agent re-pointing split per agent (5); contracts split in two (47 + 47) | `zk`; three items (3.1–3.3) in the template repo via the added directory |
| P4 | 8 | **15+** | coverage gaps one per component (6); icon fallout per class family; Jess resumed as its own series | `zk`; 4.6–4.7 in the template repo |

---

## 2. Work Breakdown

Column key — **WS**: measured working set in KB (files read + written). **Gen / Eval**: the model.
**Verify**: the single command or artefact that decides pass/fail; the Evaluator runs exactly this
and nothing else. ✂ marks an item that was split from the plan's original.

### P1 — Build Integration (all Target writes)

| # | Item | WS | Gen | Eval | Verify |
|---|---|---|---|---|---|
| 1.1 | Add a `compileMarbleCss` Gradle task in `zk/build.gradle` that shells out to the ported `build-css.js`; leave `compileLess` in place for now | 55 | Sonnet | Sonnet | `gradle :zul:compileMarbleCss` exits 0 and the codegen tree holds **exactly 86** `.css.dsp` (`find … -name '*.css.dsp' \| wc -l`) |
| 1.2 ✂ | Same task in `zkcml/build.gradle` (the duplicate definition) | 69 | Sonnet | Sonnet | zkmax + zkex codegen holds the 40 + 5 expected outputs; count by module |
| 1.3 | Relocate the 87 CE sources to `zul/src/main/resources/web/zul/**` with no `marble/` segment; update the path constants in `build-css.js` | 40 + paths | Sonnet | Sonnet | `check-css-dsp.js` against the real `lang.xml` reports `MISSING: 0`; `git ls-files` count = 87 |
| 1.4 ✂ | Relocate 40 → `zkmax`, 5 → `zkex` | paths | Sonnet | Sonnet | same checker over `lang-addon.xml` ×2: `MISSING: 0`; counts 40 / 5 |
| 1.5 | Author the **core-registration** variant of the 5 Java classes (not a copy — see plan) | 13 + zk theme-provider sources | Sonnet | **Opus** | composite build compiles; a page served from `zk` returns CSS containing `--zk-color-primary` (token layer arrived) and **no** `marble/` path segment |
| 1.6 ✂ | Delete the 66 `zul` LESS files and remove `compileLess` from `zk/build.gradle` — **same commit range as 1.1 + 1.3** | paths + 17 | Sonnet | Sonnet | `git ls-files 'zul/**/*.less'` = 0; build green; codegen holds **no duplicate** `.css.dsp` basenames |
| 1.7 ✂ | Delete the 85 + 7 `zkmax`/`zkex` LESS files and remove `compileLess` from `zkcml/build.gradle` — same commit range as 1.2 + 1.4 | paths + 31 | Sonnet | Sonnet | same three checks over `zkcml` |
| 1.8 | Port `check-css-dsp.js` as a Gradle verification task that **fails the build** | 11 + 17 | Sonnet | Sonnet | negative control: temporarily remove one registered `.css.dsp` → task fails; restore → passes |
| **P1 gate** | Composite `zk` + `zkcml` build green; jar contains the expected `.css.dsp` set | — | — | **Opus** | `gradle build` exit 0; `unzip -l` of the jars lists all 86 + the two WCS-served files; verdict file written |

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
| 3.2 | Build the **path-rewrite map**: the 63 distinct repo-relative path strings → their `zk` equivalents, as a checked-in table | grep output | Sonnet | Sonnet | every *source* path in the map exists here; every *target* path is a real `zk` layout location per P1's landing split | template |
| 3.3 | Draft the pointer paragraph for `zk`'s `CLAUDE.md` (its current one is 1 KB) | 17 | Sonnet | Sonnet | ≤ 15 lines; names the skill; no duplicated content | template (draft), landed by 3.9 |
| 3.4 | Copy `marble-theme` into `zk/.claude/skills/` and commit | ~130 (copy, moved not read) | Sonnet | Sonnet | `diff -r` between the two trees is empty; **17** files present (F1) | Target |
| 3.5 | Apply the path-rewrite map to the copied skill | map + 82 | Sonnet | Sonnet | `grep` for every *source* prefix in the copy = 0; every rewritten path exists in `zk` (the existence loop already used today) | Target |
| 3.6 | Move `doc/spec/` — 26 files, 365 KB, **moved not read**; then apply the map | map + index | Sonnet | Sonnet | `doc/spec/index.md` links all resolve in `zk`; 26 files present | Target |
| 3.7 ✂ | Move `doc/contracts/` **first half** (47 `.md` + their mockups) | paths | Sonnet | Sonnet | count; the harness's contract loader finds them | Target |
| 3.8 ✂ | Move `doc/contracts/` **second half** (47 + remaining mockups + `baselines/`) | paths | Sonnet | Sonnet | total 94 + 19; loader finds all | Target |
| 3.9 | Land the `CLAUDE.md` pointer in `zk` | 1 + draft | Sonnet | Sonnet | file diff equals the approved draft | Target |
| 3.10–3.14 ✂ | Move and re-point **one subagent each** (5 items; 132 KB total, 16–40 KB each) — fix the two stale `tasks/gen-reports/` references on the way | ≤ 40 each | Sonnet | Sonnet | per agent: `grep -c 'tasks/'` = 0; every cited path exists in `zk`; agent frontmatter still parses | Target |
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
