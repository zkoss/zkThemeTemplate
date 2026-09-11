# Generator brief — item 3.4, copy `marble-theme` into zk

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js` as the Generator prompt; `{ROW}` is row 3.4 of
the execution plan, `{COMMON_RULES}` the script's shared block. Planner dry-run of `verify-3.4.sh` on the pre-Generator tree:
`environment` passes, stops at `skill copy present` as designed.

---

You are the GENERATOR for item 3.4 of the Marble → zk migration (P3). You copy the `marble-theme` skill — 17 tracked files — from the
theme template's COMMITTED tree into `zk/.claude/skills/marble-theme/`. Nothing is rewritten here (item 3.5 rewrites the copy later);
nothing is read into your context — the copy is `git archive | tar`. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.4.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/marble-theme` already exists from an earlier run of this brief, do not delete
or overwrite anything: run the self-check and report its result.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one new directory: /Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/marble-theme/ (17 files). Nothing
  else in zk, nothing in the template. Do not edit any copied file. Do not use `cp -R`, `rsync` or `find` for the copy (the working
  tree carries `.DS_Store` files that must never reach zk); the command below emits tracked content only.

READ: nothing. You do not open the skill's files.

WRITE — one command:
  cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD .claude/skills/marble-theme | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.4.sh` — it must end
with `3.4 ok — 17 files, byte-identical to template HEAD <commit>`. If it fails, paste the `FAIL at:` line into blockers and stop; do
not change anything to make it pass.
