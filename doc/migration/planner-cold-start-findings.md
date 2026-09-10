# Planner cold-start findings

**Status:** open — pilot 3.1 PASSED, see §Pilot outcome · **Written:** 2026-09-10 by the Planner session rooted in `ZK10/zk`
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
