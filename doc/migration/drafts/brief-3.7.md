# Generator brief — item 3.7+3.8, doc/contracts copied into zk and its 94 pages re-pointed

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = the merged 3.7 + 3.8 row,
`{COMMON_RULES}` shared. Planner dry-run of `verify-3.7.sh` on the pre-Generator tree: `environment` passes (94 md + 19 html + 18
baselines at template HEAD), stops at `zk/doc/contracts present` as designed. The rewrite tool was proven on a scratch copy the same
day: 61 substitutions in 53 pages, 0 leftovers, html and baselines untouched.

---

You are the GENERATOR for item 3.7+3.8 of the Marble → zk migration (P3). You copy `doc/contracts/` — 94 component contracts (`.md`),
19 HTML mockups and the `baselines/` directory, 131 tracked files — from the theme template's COMMITTED tree into `zk/doc/contracts/`,
then you run the Planner's path-rewrite tool over the 94 `.md` files so that every template-relative path in them becomes the zk
path. You never open a contract yourself: the tool does the rewrite and the verify script proves it. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.7.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/doc/contracts` already exists from an earlier run of this brief, do not re-copy (a second
copy would undo the rewrite) and do not run the tool twice blindly: run the self-check first and report its result; only if it fails
at "no map source string left" run step 2 once more and re-check.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one new directory: /Users/hawk/Documents/workspace/ZK10/zk/doc/contracts/ (131 files). Nothing else under
  zk/doc (other items may be writing doc/harness or doc/spec in parallel — leave them alone), nothing in the template. Do not edit the
  tool, the map or the fixes table; do not edit any contract by hand. Do not use `cp -R`, `rsync` or `find` for the copy.

READ: nothing.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD doc/contracts | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite of the 94 `.md` files (the html and baselines are NOT passed to the tool), one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- $(git -C /Users/hawk/Documents/workspace/zkThemeTemplate ls-files 'doc/contracts/*.md' | /usr/bin/grep '^doc/contracts/[^/]*\.md$' | sed 's#^#/Users/hawk/Documents/workspace/ZK10/zk/#')
   Expected last line: `done: … rule(s), 53 file(s) changed, 61 substitution(s)` (the counts may differ slightly if the template moved;
   report what it printed).

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.7.sh` — it must end
with `3.7 ok — 131 files from template HEAD <commit>; 94 md rewritten, html + baselines identical`. `REVIEW` lines printed by the
check stage are informational (paths that were already zk-side); a `FAIL at:` line is not — paste it into blockers and stop.
