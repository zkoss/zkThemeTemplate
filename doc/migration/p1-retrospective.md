# P1 retrospective — where the time went, and what P2 does differently

**Written:** 2026-09-10 · **Scope:** the Generator / Evaluator harness runs for P1 (items 1.0–1.10, the P1 gate) and the Planner work around them · **Sources:** the workflow journals and subagent transcripts (timestamps), [gates/](gates/), [planner-cold-start-findings.md](planner-cold-start-findings.md) F30–F47.

## 1. Measurements

| What | Value |
|---|---|
| Workflow launches for P1 | 7 (one pilot run, one 4-item run, one 20-item run resumed 5 times, one 1-item run) |
| Agents run | 22 Generators, 26 Evaluators (20 PASS, 6 FAIL) |
| Agent wall clock | **~101 min** — Generators 71, passing Evaluators 24, failing Evaluators 6 |
| Harness wall clock (first Generator → P1 gate verdict) | **~4 h 10 min** (04:38 → 08:50 UTC); 1.10 added ~40 min later |
| Share of wall clock spent inside agents | **~40 %** |
| First-run Evaluator FAILs | **6 of 20 items (30 %)** — 1.0, 1.1, 1.3b, 1.5, 1.6b, 1.7 |
| FAILs caused by the Generator's work | **0** |
| FAILs caused by the Planner's verification command | **5** (1.0, 1.3b, 1.6b, 1.7 fragile assertions; 1.1 a `rm -rf` the permission layer refused) |
| FAILs caused by the environment | **1** (1.5: `npm run lint` broken on the machine, F41) — plus 3 gate dry-run failures (F43, F45, F47) |
| Items verified first-time PASS after the dry-run rule was applied (1.9, 1.10, 2.0) | **3 of 3** |

The Evaluator, as an agent, was rarely the problem: it ran what it was given. Its one recurring fault was paraphrasing multi-command briefs (dropping the leading `cd`, F40) — never outcome-changing, but enough to move the P1 gate into a tracked script. The defects were in the **commands the Planner wrote for it**, and the cost of each defect was paid three times: the failing Evaluator run, the Planner's triage and rewrite, and a relaunch during which every later item waited.

## 2. The six first-run FAILs

| Item | What the command asserted | Why it failed correct work | Finding |
|---|---|---|---|
| 1.0 | version print via `require('lightningcss/package.json')` | the package's `exports` map forbids that subpath | F32 |
| 1.1 | `rm -rf` old LESS output, then count | permission layer asked; a subagent cannot answer → denied, no verdict | F33 |
| 1.3b | `… \| tail -3 \| grep 'MISSING : 0'` | the checker prints that line eight lines above the end | F32 |
| 1.5 | `npm run lint` inside command 3 | lint is broken on this machine regardless of the migration | F41 |
| 1.7 | "no duplicate `.css.dsp` basenames" | not an invariant — `goldenlayout.css.dsp` legitimately exists twice | F42 |
| 1.6b | `git diff \| grep -c codemirror` = 0 | counted three unchanged *context* lines | F46 |

Common shape: the command asserted **more than the row's claim** (decoration), or asserted it through a **fragile text pattern** (`tail`, unfiltered diff), or **assumed the environment** (lint works, deletion is allowed). None of these could survive a dry run against the actual tree — and none was dry-run before dispatch.

## 3. Where the other 60 % went

Timeline gaps between one agent finishing and the next starting, from the transcripts:

```text
06:42 → 06:54   12 min   triage 1.3b FAIL, rewrite tail-3 clause, resume
07:23 → 07:39   16 min   triage 1.5 FAIL (lint), drop the stage, gate file, resume
07:55 → 08:33   38 min   P1 gate dry run (204 s build + F43/F45/F47), revert 5 files, rewrite stage 2,
                         wait for user rulings D34–D41
08:50 → 09:28   38 min   commit construction: intermediate blobs, CRLF redo, lock-file merge —
                         later squashed away by D44
```

Four structural costs, none of them "the Evaluator was slow":

1. **Stop-on-FAIL serialised everything.** The P1 script `break`s at the first FAIL, so 1.6/1.7/1.8 waited on a 1.5 lint clause that had nothing to do with them.
2. **Tiny items paid full price.** 1.0, 1.0b, 1.3c, 1.3b2 were each < 1 KB of change and each cost a Generator, an Evaluator, a gate file and a plan row.
3. **Commit shape was decided three times** (D40 → D41 → D44). Reconstructing intermediate blobs so that five commits were each internally consistent took ~40 min and was squashed the same day.
4. **Environment surprises surfaced inside the gate**, not before it: stale `codegen/` (F43), the repository-wide lint (F45), a lint rule that rewrites files (F47).

## 4. Changes for P2

| # | Change | Removes |
|---|---|---|
| 1 | Every verify is a tracked `tools/verify-<item>.sh` with per-stage markers; the Evaluator runs `bash <script>` and nothing else | F40 paraphrasing; "a silent stage failed" causes |
| 2 | The Planner **dry-runs the script on the pre-Generator tree** before dispatch: environment stages pass, work stages fail with exactly the expected marker | the five verification-command FAILs |
| 3 | Banned shapes: `tail -N \| grep`, diff greps without `^[-+] `, `require('<pkg>/package.json')`, unproven invariants, counts of things the item does not own, deletions, repo-wide lint | F32, F33, F42, F46 recurrences |
| 4 | Independent items run in parallel; a FAIL stops only declared dependants | the 12–16 min serialisation gaps |
| 5 | Tiny items batched into one Generator + one multi-stage script + one gate file | per-item overhead on sub-KB work |
| 6 | One commit per passing item, immediately, explicit paths; squash is a PR-time decision | the 40 min of blob reconstruction |
| 7 | `tools/preflight-p2.sh` runs once before the first item: Chrome, zktest composite build warm (5 min cold / 1.5 min warm, measured), Playwright, ports, no command needing a permission prompt | F41/F43/F45/F47-type surprises mid-gate |
| 8 | Gate files generated from the workflow journal (`tools/gate-from-journal.py`); Planner adds notes only | ~5 min of transcription per item |

Expected effect on P2 (10 items, 3 Opus ledgers): agent time stays roughly the same (~1.5–2 h); the Planner overhead around it drops from ~3 h to under 1 h if the first-run PASS rate holds at the 3/3 seen since the dry-run rule.

## 5. What P1 got right and P2 keeps

- The Generator / Evaluator separation: every FAIL was a real signal about the *verification*, never a Generator quietly grading itself.
- Fail-closed Generator preconditions (F44): the positional resume cache re-ran a Generator once and it did no harm.
- Per-stage markers in scripts (from `gate-p1.sh` on): the P1 gate, 1.9, 1.10 and 2.0 all passed first time, and their FAIL causes — had there been any — would have been one line.
- Verdicts as files, rulings as D-numbers: the external evaluator could audit P1 without asking anyone.
