# Migration Manifest — every asset, classified

**Status:** **executed 2026-09-09.** Produced during P0 of `doc/migration/marble-to-zk-migration-plan.md`.

> **What was actually done, 2026-09-09** — the plan below is no longer purely analytical:
> - The 12 active-state documents were **moved into `doc/`** under three category directories:
>   `doc/migration/` (3), `doc/jess-review/` (6), `doc/backlog/` (3). Because `doc/` **is**
>   git-tracked, this incidentally resolved the §1.1 version-control problem for them — they are
>   no longer unprotected, so "STAGED COPY" now applies only to the copy *into `zk`*.
> - The 10 knowledge documents were **converted into the `marble-theme` skill** at
>   `.claude/skills/marble-theme/` (SKILL.md + 8 reference pages, 76 KB). Source→destination
>   mapping is in §4.4.
> - The 34 archive candidates were **compressed to `ToDelete.zip`** at the repo root (126 KB, 34
>   files, verified byte-exact against the manifest list). **The originals were left in place** —
>   deleting them is the user's call, and the archive is the safety net that makes it safe.
> - The user separately deleted the `tasks/` binaries, all seven subdirectories, and 11 markdown
>   files ahead of this pass. See §4.3 for the three that mattered.

## 1. Executive Summary

The goal this manifest serves: **the `zkThemeTemplate` workspace must become unnecessary as a place
to maintain Marble.** Anything a future maintainer would need must end up in `zk`; anything they
would not need must not be carried there.

**The decision rule, from D17 + D18 of the migration plan:**

> **Maintainer assets MOVE. Customer-facing deliverables are COPIED, with `zk` as source of truth.**
> Knowledge MERGES INTO THE SKILL. Everything else stays here or goes away.

### 1.1 A MOVE is only safe where git holds the file — and for `tasks/` it does not

Ruled 2026-09-09: **a MOVE may only be used where the file is under version control**, because a
MOVE's deletion is otherwise unrecoverable. Measured, and the answer splits the manifest in two:

| Group | Tracked | Verdict |
|---|---|---|
| `tasks/` | **0 of 91** — `.gitignore:35` ignores the whole directory | **No safety net at all. MOVE forbidden → STAGED COPY.** |
| `doc/` | 486 of 488 (the 2 are themselves ignored) | MOVE is safe; git history is the fallback |
| `src/test/playwright/` | 15 of 15 | MOVE is safe |
| Memory (`~/.claude/.../memory/`) | **not inside any git repo** | Never deleted anyway — SKILL/RE-ESTABLISH rewrite the content, originals stay |

`.gitignore` ignores `tasks` wholesale (line 35) *and* names eight specific paths under it
(lines 27–34) — belt and braces, so nothing in `tasks/` has ever been committed. That includes the
migration plan, this manifest, all six Jess documents, `work-status.md`, `lessons.md` and every
open to-do. **These are the highest-value documents in the migration and they are the least
protected ones.**

**So `tasks/` MOVEs become STAGED COPY:** copy to `zk`, keep the source, and delete here only after
P2's zero-tolerance gate has passed. That resolves the tension with the migration's goal — a
permanent duplicate invites editing the wrong copy, but a duplicate held until verification does
not.

**One interaction to note: this safety argument depends on D19.** For `doc/`, "git has it" holds
only while the history remains reachable. D19 option C (squash the tree onto `master`) would weaken
that fallback; options A (merge) and B (rename) preserve it. Another reason A is recommended.

### 1.2 The same discovery breaks ARCHIVE, and that needs a ruling

ARCHIVE was defined as "stays in this repo's git history". For `doc/` that holds. **For `tasks/` it
is vacuous** — 0 of 91 files are tracked, so there is no history for them to stay in. The 46
`tasks/` files classified ARCHIVE would simply sit on disk in a workspace whose entire purpose is to
become unnecessary. That is not archiving; it is deferral.

This is raised as **D20** in [marble-to-zk-migration-plan.md](marble-to-zk-migration-plan.md). Until it is ruled, do not
delete or relocate any `tasks/` ARCHIVE file.

Seven dispositions, one of which is not a file operation at all:

| Disposition | Meaning |
|---|---|
| **MOVE** | Lives in `zk` afterwards; deleted here — **only permitted where git holds the file** (see §1.1) |
| **STAGED COPY** | Copied to `zk`, source kept until P2's gate passes, deleted only then |
| **COPY** | Exists in both; `zk` is truth, this repo receives a generated snapshot |
| **SKILL** | Content is folded into the new `marble-theme` skill; the source file does not travel as-is |
| **ARCHIVE** | Not carried forward, not deleted. **For `doc/` this means git history. For `tasks/` there is no history to stay in — see §1.2** |
| **DROP** | Deleted — binaries, logs, transient scratch |
| **RE-ESTABLISH** | *Not a file move.* Memory is keyed to the launch directory and cannot be copied; it must be rewritten in the target session |

**Totals measured (these correct earlier estimates — see §5):**

| Group | Files | Disposition |
|---|---|---|
| `tasks/` markdown | 68 | mixed — §2.1 |
| `tasks/` binaries & logs | 16 (1.9 MB) | **DROP** |
| `doc/` top-level `.md` | 20 | mixed — §2.2 |
| `doc/spec/` | 26 | **MOVE** + **SKILL** |
| `doc/contracts/` | 131 (94 md, 19 html, 18 other) | **MOVE** |
| `doc/screenshots/` compared baselines | **199** (11 MB) | **MOVE** |
| `doc/screenshots/` `*-forced-colors.png` | **100** (6 MB) | **DROP** |
| Memory files | 66 (336 KB) | **SKILL** + **RE-ESTABLISH** — §2.4 |
| Theme CSS | 132 | **COPY** (87 → `zk/zul`, 40 → `zkcml/zkmax`, 5 → `zkcml/zkex`) |
| Preview/use-case ZULs | 159 | **COPY** |
| Playwright harness | 13 specs | **MOVE** |
| Java integration classes | 5 | **TWO LIVE VARIANTS** — see plan §3 D18 |

---

## 2. Phase Breakdown

### 2.1 `tasks/` — 68 markdown + 16 binaries

**DROP — 16 files, 1.9 MB.** No judgement needed; none of it is knowledge.

- `preview-app.log`, `outcome-migration-log.jsonl`, `.DS_Store`
- `ZK Material Theme Colors.html` (564 KB colour dump — a generated artifact)
- 12 PNGs across `img/` (704 KB), `grid-livegrouping-iceblue-compare/` (432 KB), `screenshots/` (184 KB), `navitemIssue.png`
- `prompt.md`, `prompt2.md`, `prompt3.md`, `prompt-goldenlayout-pilot.md` — transient agent prompts, not records

**STAGED COPY — active working state that must continue in `zk` (12 files).** Not MOVE: none of
these is under version control (§1.1), so the source is kept until P2's gate passes.

| File | Why it travels |
|---|---|
| `marble-to-zk-migration-plan.md` | This migration is not finished when the migration moves |
| `zk11-marble-migration-risk-assessment.md` | Authoritative for the risk profile and CSS-conversion order |
| `migration-manifest.md` | This file |
| `jess-review.md`, `jess-review-triage.md`, `jess-review-deferred.md`, `jess-review-session-strategy.md`, `jess-review-issue-2-proposal.md`, `jess-review-issue-41-43-proposal.md` | 50 in-scope issues resume in `zk` at P4 (frozen, not cancelled) |
| `work-status.md` (119 KB) | The harness's live status file — **condense before moving**, most of it is settled history |
| `todo.md`, `harness-followups.md`, `css-cleanup-todo.md` | Open work items |

**SKILL — durable knowledge a maintainer will look up (10 files).** These do not travel as files;
their content is folded into `marble-theme/reference/*.md`.

`lessons.md` · `visual-regression-procedure.md` · `brand-color-override-recipe.md` ·
`zk-bug-description-writing-guide.md` · `data-dense-mode.md` · `color-mix-vs-oklch.md` ·
`component-theming-api-naming.md` · `important-decisions.md` · `zindex-scale-plan.md` ·
`token-naming-consistency-audit.md`

**ARCHIVE — 46 files.** Completed one-off investigations whose *outcome* is already in the CSS, a
spec, or a memory. Named by pattern rather than individually: the `fix-*` (3), `gap-*` (2),
`*-audit` (8), `*-decision` (2), `*-findings`/`*-check` (3), `*-plan`/`*-proposal` for shipped work
(9), `*-assessment`/`*-evaluation`/`*-spike` (4), the per-component investigations (`button-graphic-gap`,
`multislider-knob-hit-target`, `datebox-timebox-content-fit`, `daterangebox-*` ×3,
`timepicker-readonly-workaround`, `codeeditor-focus-ring-fix`, `breadcrumb-carousel-onboarding`,
`skeleton-feasibility-findings`, `semantic-heading-components-analysis`, `coachmark-*` ×2), and the
process docs whose job is done (`doc-condensation-plan`, `reorg-screenshots`,
`flatten-screenshots-exceptions`, `outcome-migration-status`, `usecase-sidebar-commit-stamp`,
`claude-launch-directory-for-migration`, `iceblue-worktree-teardown`,
`screenshot-drift-and-focus-ring-doc-audit`, `navbar-focus-ring-clip-report`).

> **Before archiving any of these, check it against §2.4.** Several were the *source* of a memory
> file; if the memory is going into the skill, the task file's job is genuinely finished. If it is
> not, the knowledge would be lost — that is the one way this classification can go wrong.

`doc/harness/design-reviews/` (1), `eval-reports/` (5), `gen-reports/` (2), `theme-review/` (6) —
**ARCHIVE**. These are per-run harness output, not specifications; the contracts in
`doc/contracts/` are the durable form.

### 2.2 `doc/` top-level — 20 files

**MOVE (8)** — architecture and process a maintainer needs in `zk`:
`zk11-less-dsp-deprecation-evaluation.md` (holds the ruled D1–D7) ·
`conditional-css-without-preprocessor.md` · `verification-harness-decisions.md` ·
`test-architecture.md` · `preview-deployment.md` · `design-review-feedback.md` ·
`zk-source-reference.md` · `zk-edition-components.md`

**SKILL (4)** — `orchestrator-playbook.md` · `icon-library-evaluation-criteria.md` ·
`zk-framework-themability-recommendations.md` · `framework-feature-gaps.md`

**MOVE, open backlog (2)** — `focus-ring-clip-backlog.md` · `skill-gaps.md`

**ARCHIVE (6)** — `component-theme-typography-scope.md` ·
`component-theme-variables-progress.md` · `state-coverage-audit.md` · `zindex-audit.md` ·
`daterangebox-focus-ux-review.md` · `skill-feedback-loop.md`

### 2.3 `doc/spec/` (26), `doc/contracts/` (131), `doc/screenshots/` (309)

- **`doc/spec/` → MOVE, then SKILL-index.** These are the normative theme specifications and the
  highest-value written asset after the memory. Move the files into `zk` and have the skill's
  reference pages point into them rather than duplicating them — a spec that exists twice will
  drift.
- **`doc/contracts/` → MOVE, all 131.** Maintainer verification assets; the durable form of the
  eval/gen reports being archived above.
- **`doc/screenshots/` → split.** The **199** compared baselines MOVE (they are the migration
  oracle per D16 — the whole point is that they were cut *before* the move). The **100**
  `*-forced-colors.png` DROP: they are always-dirty human-review artifacts that never participate
  in a comparison.

### 2.4 Memory — 66 files, and none of them can be copied

**This is the asset that does not travel by file operation.** Memory is keyed to the launch
directory; a session rooted in `zk` will not see any of it. Two different treatments:

**SKILL — ~49 files (40 `reference` + 9 `project`).** Domain knowledge, and `MEMORY.md`'s own
section headings already partition it along the skill's planned reference files:

| `MEMORY.md` section | → `marble-theme/reference/` |
|---|---|
| CSS Architecture | `layers.md`, `css-dsp.md` |
| Tokens & Naming | `tokens.md` |
| ZUL Authoring | `zul-authoring.md` |
| Visual Regression / Screenshots · Tablet / Responsive | `verification.md` |
| ZK Version / Components · Reference | `pitfalls.md` |

**RE-ESTABLISH — 17 files, as the target session's own memory, not as skill content.** These are
user preferences and machine facts, not theme knowledge, and a repo skill is the wrong home for
them: Working Style (9), Shell Quirks (6 — `grep` exec trap, pyenv `python3`, cwd reset, `rg` shim,
no `git add -A`, no `git checkout` to clean a probe), Environment/Concurrency (2).

**DROP — the paused-work entries** whose subject no longer exists, chiefly the IceBlue worktree
memory (the worktree is gone and its baselines are a tarball).

### 2.5 Skills — 7, of which most were never Marble's

Classified in the plan already; restated for completeness. `zk-component-rules` (97 files) and
`zul-writer` are **theme-independent and belong in `zk` regardless** — they are MOVEs this
migration merely occasions. `css-theme-audit` and `important-reduction` are small Marble content →
**SKILL**. `show-me` already exists in `zk`. `impeccable` and `plan-spec` are not migration content
and stay.

The target repo's `.claude/skills/` is **empty**, and it has no `agents/` or `commands/` — so P3 is
greenfield with zero naming collisions, and the 5 subagents need new directories.

---

## 3. Acceptance Gate

This manifest is done when every one of the following is true:

- [ ] Every file in `tasks/`, `doc/`, and the memory directory carries exactly one disposition
- [ ] No file is classified ARCHIVE while it is the sole record of something a maintainer needs —
      the check described in §2.1
- [ ] The DROP list has been read by a human before anything is deleted
- [ ] No `tasks/` file has been deleted before its copy in `zk` is verified — nothing there is in git
- [ ] The 8 remaining `tasks/` binaries were confirmed by a human before deletion (unrecoverable);
      the 100 `*-forced-colors.png` are tracked, so those are recoverable
- [ ] `work-status.md` has been condensed, not moved wholesale
- [ ] The 199/100 screenshot split has been re-verified at move time, not assumed from this file

---

## 4. Technical Appendix

### 4.1 Data corrections to earlier statements in this workstream

Three counts quoted earlier in the migration conversation were low. None changes any conclusion or
disposition; all three make the *volume* larger while leaving the *shape* identical.

| Asset | Earlier figure | Measured 2026-09-08 |
|---|---|---|
| `tasks/` files | 65 | **79** (68 md + 16 binaries; 73 at top level, 26 in 7 subdirectories) |
| `doc/` top-level `.md` | 22 | **20** |
| `doc/contracts/` | 114 | **131** (94 md, 19 html, 18 other) |
| Memory files | 64 | **66** (two were written during this session) |

The screenshot split was quoted correctly: **199** compared baselines and **100**
`*-forced-colors.png`, 309 files in `doc/screenshots/` in total, 17 MB.

### 4.2 The largest files, for the DROP/condense decision

```
564 KB  ZK Material Theme Colors.html      DROP (generated colour dump)
324 KB  img/d26-option-c-dark-label.png    DROP
290 KB  img/d26-badge-severity-options.png DROP
240 KB  grid-livegrouping-…/comparison.png DROP
119 KB  doc/harness/work-status.md                     MOVE, but condense first
```

### 4.3 Change log

- **2026-09-08 — created.** First full pass. Produced from measurement rather than from the earlier
  estimates, which is why §4.1 exists. The `tasks/` ARCHIVE bucket (46 files) is the one with real
  judgement in it and the one place a mistake would lose knowledge silently; the guard against that
  is the §2.1 cross-check against the memory dispositions in §2.4.

- **2026-09-09 — MOVE narrowed to where git actually protects the file.** The user's rule ("make
  MOVE a COPY unless the file is version-controlled") turned out to bite harder than framed:
  `.gitignore:35` ignores `tasks` wholesale, so **0 of its 91 files are tracked** — including the
  migration plan, this manifest, all six Jess documents and `lessons.md`. Those 12 MOVEs became
  STAGED COPY, with source deletion gated on P2. `doc/` (486/488) and the Playwright harness (15/15)
  are tracked, so MOVE stands for them. Also recorded: the safety of `doc/`'s MOVE depends on D19
  preserving reachable history, which option C would not.

### 4.4 Source → skill mapping (executed 2026-09-09)

| Source in `tasks/` | Destination in `.claude/skills/marble-theme/` |
|---|---|
| `lessons.md` | `reference/pitfalls.md` (11 lessons, each restated as its rule) |
| `brand-color-override-recipe.md` + `color-mix-vs-oklch.md` | `reference/brand-override.md` |
| `data-dense-mode.md` | `reference/density.md` |
| `component-theming-api-naming.md` + `token-naming-consistency-audit.md` + `zindex-scale-plan.md` | `reference/tokens.md` |
| `zk-bug-description-writing-guide.md` | `reference/bug-filing.md` |
| `iceblue-utility-port-and-token-naming.md` | `reference/iceblue-parity.md` |
| `preview-app-port-8081.md` | `reference/verification.md` |
| — (assembled from measurement during this session) | `reference/css-dsp.md` |

`reference/css-dsp.md` has no single source document: it combines the `.css.dsp` lessons from
`lessons.md`, the registration facts measured against ZK's real lang files, and the bundling rules
read out of `build-css.js`.

**The 10 source files are now redundant** — their content is in the skill, and `.claude/skills/`
is git-tracked, so the knowledge is protected for the first time. They were **not** deleted;
that decision is open.

**Still not folded in, and flagged in SKILL.md itself:** cascade-layer mechanics in depth, ZUL
authoring rules, the visual-regression harness gotchas beyond what `reference/verification.md`
carries, and the ZK version coordinates. Those live in session memory and are P3's remaining work.

### 4.5 Corrections this pass produced

- **The `tasks/` copy of `work-status.md` was a stale duplicate.** The harness's live file is
  `doc/harness/work-status.md` (120 KB, **git-tracked**), which is what the four subagent
  definitions reference. The earlier classification of the `tasks/` copy as "the harness's live
  status file — condense before moving" was wrong; deleting it lost nothing. The same holds for
  the deleted `tasks/eval-reports/` and `tasks/design-reviews/`, which have `doc/harness/`
  counterparts.
- **`tasks/gen-reports/` has no `doc/harness/` counterpart**, yet two agent definitions still
  point at the `tasks/` path. Harness output would land in two places. Small fix, worth doing.
- **`npm run check:version` does not exist.** `scripts/` has no version guard. The four-location
  version drift is a manual check today — recorded as a gap in `reference/css-dsp.md`.
