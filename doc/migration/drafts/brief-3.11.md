# Generator brief — item 3.11, agent `zk-spec-author` copied into zk and re-pointed

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.10–3.14, `{COMMON_RULES}` shared.
Planner measurement the same day on a scratch copy: the map + fixes make 5 substitution(s) in this file, `--check` clean, `tasks/` = 0.
Planner dry-run of `verify-3.11.sh`: `environment` passes, stops at `agent copy present in zk`; the later stages were exercised on the
scratch copy.

---

You are the GENERATOR for item 3.11 of the Marble → zk migration (P3). You copy ONE subagent definition, `zk-spec-author`, from the theme
template's COMMITTED tree into `zk/.claude/agents/` and run the Planner's path-rewrite tool over it, then make the hand edits named below (template-only build or hash instructions the map cannot fix). A different agent verifies
with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.11.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-spec-author.md` already exists from an earlier run of this brief, do not re-copy (it would undo the rewrite); run
the self-check first and fix only what it names.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one NEW file: /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-spec-author.md. Nothing else in zk (the other agents are other items'), nothing
  in the template.
- Hand edits: exactly the paragraphs named below, with the facts given there and nothing invented; keep the Markdown shape; English only.

READ: after step 2, the parts of /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-spec-author.md the HAND EDITS name. Nothing else.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD .claude/agents/zk-spec-author.md | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite, one command (expected: `1 file(s) changed, 5 substitution(s)`; report what it printed):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-spec-author.md

HAND EDITS (this agent only; read the copy first — about 29 KB):
3. Section "1. **ZK JS source.**": the two wrong roots `/Users/hawk/Documents/workspace/ZK10/zkex/` (PE) and
   `/Users/hawk/Documents/workspace/ZK10/zkmax/` (EE) become `/Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web/js/zkex/`
   and `/Users/hawk/Documents/workspace/ZK10/zkcml/zkmax/src/main/resources/web/js/zkmax/` (the EE/PE widget sources live in the sibling
   `zkcml` checkout). Nothing else in that item.
4. The hash paragraph that begins "**Hash the jars on the classpath, NOT the source checkout you read the code from.**" and the two
   paragraphs after the code block ("Read the source from `$ZK_SRC` by all means …" and "If the resolver exits **2** …"): rewrite the
   three for zk — in zk `scripts/js-source-hash.sh` hashes the widget sources of the checkout itself (`zul/`, `zk/` and `../zkcml`'s
   `src/main/resources/web/js/` roots): the checkout is the widget the theme styles, so there is no "jar vs. checkout" drift any more;
   still use the script (it is the same resolver the evaluator's Gate 0b runs, so both hash the same bytes in the same order); exit **2**
   now means `../zkcml` is not checked out (a `zkmax/` or `zkex/` entry cannot be read) — record no hash and say so. Keep the code block
   and the "Arguments are paths relative to `web/js/` …" paragraph as they are; drop the `pom.xml` / 2026-09-08 codeeditor story.
5. Two more template-build mentions (found by the first dispatch's self-check): the rule line "- You NEVER run `npm run build:css` or
   open Chrome to *measure* …" becomes "- You NEVER run the CSS build (`node scripts/build-css.js`) or open Chrome to *measure* …" (rest
   of the line unchanged); the forbidden-list line "- Running `npm run build:css`" becomes
   "- Running the CSS build (`node scripts/build-css.js --module <module>`)".

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.11.sh` — it must end with `3.11 ok — zk-spec-author copied and re-pointed …`.
`REVIEW` lines are informational; a `FAIL at:` line goes into blockers verbatim; stop there. Do not edit the verify scripts, the tool, the
map or the fixes table.
