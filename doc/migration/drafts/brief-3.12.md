# Generator brief — item 3.12, agent `zk-theme-creator` copied into zk and re-pointed

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.10–3.14, `{COMMON_RULES}` shared.
Planner measurement the same day on a scratch copy: the map + fixes make 2 substitution(s) in this file, `--check` clean, `tasks/` = 0.
Planner dry-run of `verify-3.12.sh`: `environment` passes, stops at `agent copy present in zk`; the later stages were exercised on the
scratch copy.

---

You are the GENERATOR for item 3.12 of the Marble → zk migration (P3). You copy ONE subagent definition, `zk-theme-creator`, from the theme
template's COMMITTED tree into `zk/.claude/agents/` and run the Planner's path-rewrite tool over it, then make the hand edits named below (template-only build or hash instructions the map cannot fix). A different agent verifies
with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.12.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-creator.md` already exists from an earlier run of this brief, do not re-copy (it would undo the rewrite); run
the self-check first and fix only what it names.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly one NEW file: /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-creator.md. Nothing else in zk (the other agents are other items'), nothing
  in the template.
- Hand edits: exactly the paragraphs named below, with the facts given there and nothing invented; keep the Markdown shape; English only.

READ: after step 2, the parts of /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-creator.md the HAND EDITS name. Nothing else.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD .claude/agents/zk-theme-creator.md | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The rewrite, one command (expected: `1 file(s) changed, 2 substitution(s)`; report what it printed):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- /Users/hawk/Documents/workspace/ZK10/zk/.claude/agents/zk-theme-creator.md

HAND EDITS (this agent only; read the copy first — about 14 KB):
3. Item "5. **Build and verify**": replace the sentence after the bold label with: after a CSS change run
   `node scripts/build-css.js --module zul` (or `--module zkmax` / `zkex` from `../zkcml`) — or the Gradle task it is wired into,
   `./gradlew :zul:compileMarbleCss` — and restart `zkpreview`; there is no watcher or live-reload in zk.
4. Item "7. **JDK requirement**": rename the label to "7. **Preview app**" and make the sentence: when suggesting to run the preview
   module, always use `cd zkpreview && ./gradlew appRun -PhttpPort=8085 --console=plain` (keep stdin open; never `appStart`), then
   `PREVIEW_URL=http://127.0.0.1:8085`.
   Nothing else in the numbered list changes (item 4's `zk-material.css` is a template-era sentence, left as is on purpose).

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.12.sh` — it must end with `3.12 ok — zk-theme-creator copied and re-pointed …`.
`REVIEW` lines are informational; a `FAIL at:` line goes into blockers verbatim; stop there. Do not edit the verify scripts, the tool, the
map or the fixes table.
