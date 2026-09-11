# Generator brief — item 3.13, agent `zk-theme-evaluator` copied into zk and re-pointed

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.10–3.14, `{COMMON_RULES}` shared.
Planner measurement the same day on a scratch copy: the map + fixes make 6 substitution(s) in this file, `--check` clean, `tasks/` = 0.
Planner dry-run of `verify-3.13.sh`: `environment` passes, stops at `agent copy present in zk`; the later stages were exercised on the
scratch copy.

---

You are the GENERATOR for item 3.13 of the Marble → zk migration (P3). You copy ONE subagent definition, `zk-theme-evaluator`, from the theme
template's COMMITTED tree into `zk/.claude/agents/` and run the Planner's path-rewrite tool over it, then make the hand edits named below (template-only build or hash instructions the map cannot fix). A different agent verifies
with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.13.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-evaluator.md` already exists from an earlier run of this brief, do not re-copy (it would undo the rewrite); run
the self-check first and fix only what it names.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one NEW file: /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-evaluator.md. Nothing else in zk (the other agents are other items'), nothing
  in the template.
- Hand edits: exactly the paragraphs named below, with the facts given there and nothing invented; keep the Markdown shape; English only.

READ: after step 2, the parts of /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-evaluator.md the HAND EDITS name. Nothing else.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD .claude/agents/zk-theme-evaluator.md | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite, one command (expected: `1 file(s) changed, 6 substitution(s)`; report what it printed):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-evaluator.md

HAND EDITS (this agent only; read the copy first — about 60 KB, read only §0b, roughly lines 44–70):
3. In "#### 0b. js-source-hash drift detection", the paragraph "**Hash the jars on the classpath — never the ZK source checkout.** …"
   becomes: **Run the script; do not hand-roll a hash.** In zk `scripts/js-source-hash.sh` hashes the widget sources of the checkout
   itself (`zul/`, `zk/`, `../zkcml`) in the contract's order — the checkout is the widget the theme styles, so a differing hash means
   the widget source changed since the contract was written, never a jar-vs-checkout mismatch. Keep the code block above it.
4. In the exit-code list, the **2** entry ("no ZK jars for the pinned version …") becomes: **2** → `../zkcml` is not checked out
   (a `zkmax/` or `zkex/` entry cannot be read) — cannot verify on this machine; proceed without the drift check and say so in the
   report. Keep the 0-matches / 0-differs / 1 entries as they are.
5. Two more template-build mentions (found by the first dispatch's self-check): in the icon-lookup paragraph, "instruct the user to run
   `npm run build:css` before proceeding" becomes "instruct the user to run `node scripts/build-css.js --module zul` before proceeding";
   the forbidden-list line "- Running `npm run build:css` (that's the Generator's responsibility)" becomes
   "- Running the CSS build (`node scripts/build-css.js --module <module>` — that's the Generator's responsibility)".

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.13.sh` — it must end with `3.13 ok — zk-theme-evaluator copied and re-pointed …`.
`REVIEW` lines are informational; a `FAIL at:` line goes into blockers verbatim; stop there. Do not edit the verify scripts, the tool, the
map or the fixes table.
