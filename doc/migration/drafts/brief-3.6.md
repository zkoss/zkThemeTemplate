# Generator brief — item 3.6, doc/spec copied into zk and rewritten

Status: written 2026-09-11 (P3 session) after 3.18 (`b8472729fd`) and 3.7+3.8 (`da540d2863`) landed. Embedded verbatim in
`marble-p3-verify.js`; `{ROW}` = row 3.6, `{COMMON_RULES}` shared. Planner dry-run of `verify-3.6.sh`: `environment` passes, stops at
`zk/doc/spec present`. The rewrite and the link walk were pre-checked on a scratch copy the same day (58 substitutions in 18 pages;
72 links, 0 dead after two root docs and three fix rows were added).

---

You are the GENERATOR for item 3.6 of the Marble → zk migration (P3). You copy the 26 Marble specifications (`doc/spec/`) and two root
documents they link to from the theme template's COMMITTED tree into `zk/doc/`, then run the Planner's path-rewrite tool over the 26
pages. You never open a page yourself. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.6.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/doc/spec` already exists from an earlier run of this brief, do not re-copy (it would undo
the rewrite) and do not re-run the tool blindly: run the self-check first and report; only if it fails at "no map source string left"
run step 2 once more and re-check.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly: the NEW directory /Users/hawk/Documents/workspace/ZK10/zk/doc/spec/ (26 files) and the two NEW files
  /Users/hawk/Documents/workspace/ZK10/zk/doc/component-theme-typography-scope.md and /Users/hawk/Documents/workspace/ZK10/zk/doc/zindex-audit.md.
  Nothing else under zk/doc (contracts, harness and the other root docs are other items', already landed — leave them alone), nothing in
  the template. Do not edit any page by hand; do not edit the tool, the map or the fixes table. No `cp -R`, `rsync` or `find` for the copy.

READ: nothing.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD doc/spec doc/component-theme-typography-scope.md doc/zindex-audit.md | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite of the 26 pages only (the two root docs stay verbatim and are NOT passed to the tool), one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- $(git -C /Users/hawk/Documents/workspace/zkThemeTemplate ls-files doc/spec | sed 's#^#/Users/hawk/Documents/workspace/ZK10/zk/#')
   Expected last line: `done: … rule(s), 18 file(s) changed, 58 substitution(s)` (report what it printed).

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.6.sh` — it must end with
`3.6 ok — 26 pages from template HEAD <commit>, rewritten, every link resolves in zk`. A `DEAD …` or `FAIL at:` line goes into blockers
verbatim; stop there.
