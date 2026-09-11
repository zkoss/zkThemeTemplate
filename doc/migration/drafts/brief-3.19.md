# Generator brief — item 3.19, the path rewrite inside zk's copy of `zk-component-rules`

Status: written 2026-09-11 (P3 session) after chat D202-A. Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.19,
`{COMMON_RULES}` shared. Planner measurement the same day on a scratch copy taken from template HEAD: the 3.2 map + `stale-fixes.tsv`
(with five rows added for this skill) rewrite 42 strings in 31 of the 97 files and `--check` is clean afterwards — no second map file.
Planner dry-run of `verify-3.19.sh` on the byte-identical 3.15 copy: `environment` passes, stops at `copy rewritten`.

---

You are the GENERATOR for item 3.19 of the Marble → zk migration (P3). The `zk-component-rules` skill was copied into
`/Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/zk-component-rules/` byte-for-byte (item 3.15). Its content is theme-independent
but 31 of its 97 files cite the theme template's paths (`src/main/resources/web/…`, `src/test/…`, `target/…`, retired documents). You run the
Planner's path-rewrite tool over all 97 files, once. You do not edit any file by hand and you never open one. A different agent verifies
with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.19.sh`; run it yourself as your self-check.

If the copy already differs from the template (an earlier run of this brief), do not run the tool blindly: run the self-check first and
report; only if it fails at "no map source string left" run step 1 once more and re-check.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly the 97 tracked files under /Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/zk-component-rules/ — content
  changes only through the tool. Nothing else in zk, nothing in the template's own `.claude/skills/zk-component-rules/`.
- No `cp`, `rsync`, `find`, `sed` or editor on these files. Do not edit the tool, the map or the fixes table.

READ: nothing.

WRITE:
1. The rewrite, one command (the file list is the template's tracked set, so nothing untracked is touched):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- $(git -C /Users/hawk/Documents/workspace/zkThemeTemplate ls-files .claude/skills/zk-component-rules | sed 's#^#/Users/hawk/Documents/workspace/ZK10/zk/#')
   Expected last line: `done: … rule(s), 31 file(s) changed, 42 substitution(s)` (report what it printed; a different count is not a
   failure by itself — the verify decides).

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.19.sh` — it must end with
`3.19 ok — zk-component-rules rewritten …`. `REVIEW` lines are informational; a `FAIL at:` line goes into blockers verbatim; stop there.
