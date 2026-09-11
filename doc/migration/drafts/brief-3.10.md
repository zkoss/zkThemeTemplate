# Generator brief — item 3.10, agent `md3-design-verifier` copied into zk and re-pointed

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.10–3.14, `{COMMON_RULES}` shared.
Planner measurement the same day on a scratch copy: the map + fixes make 2 substitution(s) in this file, `--check` clean, `tasks/` = 0.
Planner dry-run of `verify-3.10.sh`: `environment` passes, stops at `agent copy present in zk`; the later stages were exercised on the
scratch copy.

---

You are the GENERATOR for item 3.10 of the Marble → zk migration (P3). You copy ONE subagent definition, `md3-design-verifier`, from the theme
template's COMMITTED tree into `zk/.claude/agents/` and run the Planner's path-rewrite tool over it. A different agent verifies
with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.10.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/md3-design-verifier.md` already exists from an earlier run of this brief, do not re-copy (it would undo the rewrite); run
the self-check first and fix only what it names.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one NEW file: /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/md3-design-verifier.md. Nothing else in zk (the other agents are other items'), nothing
  in the template.
- No hand edits: this agent needs none. Do not open the file.

READ: nothing.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD .claude/agents/md3-design-verifier.md | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite, one command (expected: `1 file(s) changed, 2 substitution(s)`; report what it printed):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/md3-design-verifier.md

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.10.sh` — it must end with `3.10 ok — md3-design-verifier copied and re-pointed …`.
`REVIEW` lines are informational; a `FAIL at:` line goes into blockers verbatim; stop there. Do not edit the verify scripts, the tool, the
map or the fixes table.
