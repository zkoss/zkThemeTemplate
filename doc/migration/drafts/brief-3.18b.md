# Generator brief — item 3.18b, the screenshot oracle copied into `zk/zkpreview/doc/screenshots/`

Status: written 2026-09-11 (P3 session) after the P2 gate (D200-B). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.18b,
`{COMMON_RULES}` shared. Measured the same day: template HEAD tracks **291** files under `doc/screenshots/` (282 `.png` = 183 baselines +
99 forced-colors captures, 7 `.gif`, 2 `.json`; 15.7 MB), working tree clean there. `goldenlayout-page.gif` is therefore present twice
in zk (3.18 put it under `zk/doc/screenshots/` for a root document's link; the oracle directory must be `diff -r`-identical to the
template's, so it is not excluded here). Planner dry-run of `verify-3.18b.sh static`: stage 0 and `environment` pass, stops at `copy
present`; `live` hand-run once by the Planner (rule 2) — which required the copy to exist, so the Planner ran step 1 below verbatim as the
hand-run's pre-step (2026-09-11, 291 files); `static` and `live` then passed (`gallery › a` compared against the copied baseline: 1 passed,
nothing written). The Generator therefore finds the copy present and only self-checks; recorded as such in gates/3.18b.md.

---

You are the GENERATOR for item 3.18b of the Marble → zk migration (P3). You copy the Playwright screenshot oracle — every file the theme
template tracks under `doc/screenshots/` — from the template's COMMITTED tree into `zk/zkpreview/doc/screenshots/`. That is the directory
zkpreview's `playwright.config.ts` already points at (`snapshotDir: '../../../doc/screenshots'`, three levels up from
`zkpreview/src/test/playwright/` = the module root); no harness line changes. You never open an image. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.18b.sh static` and then `… live`; run `static` yourself as
your self-check (leave `live`, which starts the preview module, to the verifier).

If `/Users/hawk/Documents/workspace/ZK10/zk/zkpreview/doc/screenshots` already exists from an earlier run of this brief, do not re-copy;
run the self-check and report.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly the NEW directory /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/doc/screenshots/ (291 files). Nothing else in
  zk — not `zkpreview/doc/focus-ring-known-clips.json`, not the harness, not `zk/doc/screenshots/` — and nothing in the template.
- The copy is one `git archive` pipe; no `cp -R`, `rsync` or `find`. Do not delete, rename or re-encode anything.

READ: nothing.

WRITE:
1. The copy, one command (git archive emits tracked files only, so no `.DS_Store` and no half-written forced-colors PNG can come along):
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD doc/screenshots | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk/zkpreview
   (the archive's paths start with `doc/screenshots/`, so extracting into `zkpreview/` lands them at `zkpreview/doc/screenshots/`).
2. Count, one command, and report the number: cd /Users/hawk/Documents/workspace/ZK10/zk && find zkpreview/doc/screenshots -type f | wc -l   (expected 291).

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.18b.sh static` — it must
end with `3.18b static ok — 291 screenshot files …`. A `FAIL at:` line goes into blockers verbatim; stop there. Do not run `live`; do not
edit the verify script.
