# Generator brief — item 3.18, twelve `doc/` paths copied verbatim into zk/doc

Status: written 2026-09-11 (P3 session). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.18, `{COMMON_RULES}` shared.
Planner dry-run of `verify-3.18.sh` on the pre-Generator tree: `environment` passes (16 tracked files across the 12 paths), stops at
`zk/doc present` as designed. D200-B: the screenshot baselines are NOT part of this item (3.18b, after the P2 gate).

---

You are the GENERATOR for item 3.18 of the Marble → zk migration (P3). You copy twelve `doc/` paths from the theme template's
COMMITTED tree into `zk/doc/`, byte for byte, and you create one small README that the five subagents' report directory needs.
Nothing is rewritten; nothing is read into your context. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.18.sh`; run it yourself as your self-check.

If `/Users/hawk/Documents/workspace/ZK10/zk/doc/harness` already exists from an earlier run of this brief, do not delete or overwrite
anything: run the self-check and report its result.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly these paths under /Users/hawk/Documents/workspace/ZK10/zk: doc/component-theme-variables-progress.md,
  doc/gap-5-tail-pge.md, doc/important-decisions.md, doc/orchestrator-playbook.md, doc/skill-gaps.md,
  doc/verification-harness-decisions.md, doc/harness-followups.md, doc/harness/design-reviews/, doc/harness/eval-reports/,
  doc/harness/outcome-migration-status.md, doc/harness/work-status.md, doc/screenshots/goldenlayout-page.gif — and the NEW
  doc/harness/gen-reports/README.md. Nothing else: no other file under doc/screenshots/, nothing under doc/spec or doc/contracts (other
  items own those and may be running in parallel — leave whatever you find there alone).
- Do not edit any copied file, even `doc/skill-gaps.md` (one sentence in it is known to be wrong; that is recorded elsewhere and the
  copy stays verbatim). Do not use `cp -R`, `rsync` or `find` for the copy.

READ: nothing.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD doc/component-theme-variables-progress.md doc/gap-5-tail-pge.md doc/important-decisions.md doc/orchestrator-playbook.md doc/skill-gaps.md doc/verification-harness-decisions.md doc/harness-followups.md doc/harness/design-reviews doc/harness/eval-reports doc/harness/outcome-migration-status.md doc/harness/work-status.md doc/screenshots/goldenlayout-page.gif | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. `mkdir -p /Users/hawk/Documents/workspace/ZK10/zk/doc/harness/gen-reports` and write
   /Users/hawk/Documents/workspace/ZK10/zk/doc/harness/gen-reports/README.md with exactly this content (then a final newline):

   # Generator reports

   Per-component reports written by the `zk-theme-generator` subagent (one file per run, `<component>.md`), read by
   `zk-theme-evaluator` and the orchestrator. This directory replaces the theme template's untracked `tasks/gen-reports/`;
   the eval reports live beside it in `../eval-reports/`. Keep it tracked: an empty directory would not survive a clone.

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.18.sh` — it must
end with `3.18 ok — 12 paths (16 files) verbatim from template HEAD <commit>, README present`. If it fails, paste the `FAIL at:` line
into blockers and stop.
