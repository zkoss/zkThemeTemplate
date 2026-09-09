# Session memory that does not travel — re-establish these in the target session

**Why this document exists.** Claude Code memory is keyed to the launch directory and never
merges across sessions. Of the 66 memory files in the `zkThemeTemplate` session, 48 were theme
knowledge and have been folded into the `marble-theme` skill, which lives in the repository and
therefore crosses the boundary. **The 18 below are not theme knowledge** — they describe the
user, the machine, or the project's commercial context — and a repository skill is the wrong
place for them. They must be written as the **target session's own memory**, by that session.

**How to use it.** In a session rooted in `ZK10/zk`, create one memory file per entry (the
harness's `memory/` directory for that project, with the usual `name` / `description` / `type`
frontmatter). Adapt anything marked ⚠ — those entries carry a fact that is specific to this
repository and may not hold in `zk`. Do not copy the file paths verbatim; several point here.

**What this list deliberately omits:** migration-state memories (the plan is the source of truth
now), the note that `tasks/` is gitignored (moot once this workspace is retired), the IceBlue
worktree teardown (out of scope), and two methodology lessons already absorbed into
`reference/pitfalls.md` (behaviour-preserving moves keep their baselines; ZKDoc is ground truth).

---

## A. How the user wants to work — 8 entries

| # | Memory | What to carry across |
|---|---|---|
| 1 | **Response language** | Converse in **Traditional Chinese**; write every artifact — code, comments, commit messages, `doc/**`, Jira, customer email — in **English**. Keep technical terms, property names, selectors and paths in English inside Chinese prose. When editing an existing file, follow *that file's* language, not the request's. |
| 2 | **Plans live in the repo** | Never leave a plan only in `~/.claude/plans/`. Write it into the repo — a `doc/` directory for anything another session or person will read; the user has redirected plans there more than once. After writing, wait for explicit review before implementing. |
| 3 | **Long answers become files** | A response over ~5 lines of substantive content, or any plan or analysis, is persisted as a repo `.md` proactively, not on request. Short Q&A does not need a file. |
| 4 | **Two report formats, not one** | A *finished-task report in chat* uses the five-section task-report style (summary / completed / findings & corrections / ⚠ decisions with options and cost / next steps; decisions get unique running ids `D1, D2…` that never restart). A *plan or progress document in the repo* uses the three-tier plan-spec structure (summary ≤ 1 page with no line numbers or hashes / phase breakdown / technical appendix). The user asked which format applied twice because the first answer confused them. |
| 5 | **Doc edits are the deliverable** | "Update X.md per my comments" means edit the file, not present a plan for editing it. Reserve plan-mode ceremony for code. |
| 6 | **Decision ids are per document** | `D13` means different things in different files because several sessions number their own series. Always write the id with its home document — "D19 (`marble-to-zk-migration-plan.md`)". Never renumber another document's ids. |
| 7 | **Never `git add -A`** | The working tree carries other sessions' uncommitted files. Stage explicit paths; run `git diff --cached --name-only` before every commit and confirm every file belongs to the change. The user caught a 15-file sweep once. |
| 8 | **Generator / Evaluator separation** | For multi-component verification work the user prefers the two-agent harness: one agent implements (files + build), a different one measures (browser + objective checks, never edits), per-component context bundles pre-written, state in files rather than agent context. Never let the generator grade its own output. |

## B. This machine — 6 entries

| # | Memory | What to carry across |
|---|---|---|
| 9 | **`grep` exec-replaces the shell** | Bare `grep` resolves to a wrapper ending in `exec`; in a multi-command Bash call everything after it silently never runs, and the call reports "completed" with partial output. Use `/usr/bin/grep`, or bare `grep` only as the very last pipeline stage. This once made a stage → grep → commit chain die after the grep and look like a lost commit. |
| 10 | **Bash cwd resets between calls** | The working directory snaps back to the launch directory between tool calls, announced only by an easy-to-miss trailing note. Begin every file-touching call with an absolute `cd <repo> &&`, use `git -C <repo>`, and verify by absolute path — a verify step in the same call shares the bad cwd and proves nothing. A `cp` meant for one repository once overwrote another repository's `pom.xml`. |
| 11 | **`python3` is a pyenv shim** ⚠ | `python3` on PATH is a pyenv shim. In *this* repository a `.python-version` pins an uninstalled 3.12, so `python3 - <<'PY'` heredocs die with a pyenv error that is cwd-dependent. Use `/usr/bin/python3`. **Check whether `zk` carries its own `.python-version` before assuming this bites there.** |
| 12 | **No real `rg` binary** | `rg` is a shell function wrapping the Claude Code binary; it does not exist inside `bash script.sh`. Committed or standalone scripts must use `grep`. Also: macOS ships bash 3.2, where `"${arr[@]}"` on an empty array under `set -u` is an error. |
| 13 | **Concurrent sessions in one repo** ⚠ | Several sessions ran against `zkThemeTemplate` at once; files appeared as `M` mid-task that this session never opened. Never infer ownership from `git status`; check mtimes against session start; a preview app on a port may belong to someone else — verify, do not kill. **Whether `zk` sees the same concurrency is unknown; the discipline costs nothing.** |
| 14 | **JDK is 11 by default; Spring Boot 3 needs 17** | Chain it on one line — `withjdk.sh 17 mvn …`. A bare `setjdk` does not outlive the call. (The `zk` preview module is javax and will not be Spring Boot, so this may only matter for the template repo — but the machine default is still 11.) |

## C. Project context that is not in any document — 4 entries

| # | Memory | What to carry across |
|---|---|---|
| 15 | **ZK 11.0 release capacity** | Stated by the user 2026-09-04: ZK 11.0 targets **end of October 2026** with **two engineers of roughly one year's experience** — about 16 gross engineer-weeks. This is a first-class input to every scope decision, not background: the Jess design backlog alone is 8–16 engineer-weeks; rebaselining ZK's front-end tests for the default-theme change, the nine new components, and the pure-CSS IceBlue are all unestimated and drawn from the same pool. A proposal that is cheap in engineering terms can still be unaffordable. |
| 16 | **The LESS + DSP decision** | Decided 2026-09-03: ZK 11 drops LESS and DSP for pure CSS (Option 1; D1–D6 all option A, D7 = B; D8 and D9 still open). The document is `doc/zk11-less-dsp-deprecation-evaluation.md` in the template repository. The IceBlue pure-CSS conversion is an untested prototype. |
| 17 | **Jess design review is frozen** | 82 issues in the private `hawkchen/marble-issue` tracker; 6 fixed, 50 in scope, 26 deferred. **Frozen until the migration completes; resumed in `zk` as the last P4 item.** The board is `doc/jess-review/jess-review-triage.md` (tracked), the tracker is the source of truth. One issue at a time, propose before implementing, the designer closes. ZK Jira filing waits until all P1 component issues are done. |
| 18 | **Theme Pack is bundled into EE** | Direction since 2026-08-14: Theme Pack stops being a paid SKU and ships with EE. **Buying EE is buying `zkmax`** — not a separate purchase. "Gated by EE" does not mean "lives in `zkmax.jar`": the theme jar already ships EE-only styling activated by `"EE".equals(WebApps.getEdition())`, and that gate is a product-tier marker, not a licence check. Palettes should follow the same pattern (theme jar + EE activation) because they bind theme-specific token names and `zkmax` is theme-agnostic. |

---

## Absorbed elsewhere, for the record

| Memory | Where it went |
|---|---|
| Layer architecture, FA → Lucide, `browserDefault` scoping, minifier corruption | `marble-theme/reference/layers.md` and `pitfalls.md` |
| The seven ZUL-authoring memories, `pv.css` dissolved, the mobile phantom scrollbar | `marble-theme/reference/zul-authoring.md` |
| Tablet gating, Playwright-not-Selenium, flaky galleries, cross-theme A/B floor, pop-up capture lessons, probe cleanup, theme-done criterion | `marble-theme/reference/verification.md` |
| Font-weight, orphan-consumer rule, `z-` prefix scope, roles-not-duplication | `marble-theme/reference/tokens.md` |
| ZK version coordinates, MUI reference | `marble-theme/SKILL.md` |
| The preview-module recipe, `master`'s LESS being vestigial, fork-delta sizing | `marble-to-zk-migration-appendix.md` §A.5 and the decision document — migration-time knowledge, not maintenance knowledge |
| Migration state, `tasks/` gitignored, IceBlue worktree teardown | End with the migration; the plan is the source of truth while it runs |
