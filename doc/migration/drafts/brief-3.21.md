# Generator brief — item 3.21, the three cited template scripts (+ `capture-iceblue.js`) ported to `zk/scripts/`

Status: written 2026-09-11 (P3 session) after chat D204-A. Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.21,
`{COMMON_RULES}` shared. Planner pre-measurements the same day: `check-icon-coverage.sh` pointed at `zkpreview/src/main/webapp/web`
counts 205 icon references, the template's own run 205; the template's `js-source-hash.sh` exits 1 with no args and 1 for a missing
file, `render-iceblue-baseline.sh` against a closed port exits 1 after Playwright's "navigating to" line; `apply-path-map.js --dry-run` on
the four files changes one string (`src/test/resources/web` in `check-icon-coverage.sh`). Planner dry-run of `verify-3.21.sh`:
`environment` passes, stops at `four files present in zk/scripts`.
**Second dispatch 2026-09-11:** the first Generator did everything and stopped, correctly, on `check-icon-coverage.sh:39`
`ZUL_DIR="$PROJECT_ROOT/src/test/resources/web"` — the source string sits after a `/`, where the tool by design does not rewrite;
a fixes row for the exact `$PROJECT_ROOT/…` form was added (the same shape the skill scripts needed in 3.5). Step 2 is re-run on
that one file; nothing else changes.

---

You are the GENERATOR for item 3.21 of the Marble → zk migration (P3). Three template scripts that the copied agents and two `doc/spec`
pages call by name were never ported to zk (P1 ported only `build-css.js` and `check-css-dsp.js`). You copy them — and `capture-iceblue.js`,
which the third one runs — from the template's COMMITTED tree into `zk/scripts/`, run the Planner's path-rewrite tool, then make two of
them true for zk by hand as specified below. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.21.sh`; run it yourself as your self-check.

If the four files already exist in `zk/scripts/` from an earlier run of this brief, do not re-copy (it would undo your edits); run the
self-check first and fix only what it names. On the second dispatch: run step 2 again but only for
`/Users/hawk/Documents/workspace/ZK10/zk/scripts/check-icon-coverage.sh` (the tool is idempotent on already-rewritten text; expected
`1 file(s) changed, 1 substitution(s)` — the `ZUL_DIR` line), then the self-check.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly four NEW files: /Users/hawk/Documents/workspace/ZK10/zk/scripts/check-icon-coverage.sh, …/js-source-hash.sh,
  …/render-iceblue-baseline.sh, …/capture-iceblue.js. Nothing else under zk/scripts (build-css.js and check-css-dsp.js are P1's — do not
  touch them), nothing in the template.
- Keep each script's structure, option handling, exit codes and message style; change only the lines named below. English only.

READ: after step 1, the four copied files in zk (≈ 12 KB together). Nothing else.

FACTS about zk you may rely on:
- `zk/scripts/` sits at the zk root, so `PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"` already resolves to the zk root — keep it.
- Preview pages live at `zkpreview/src/main/webapp/web/**/*.zul` (the tool rewrites the old `src/test/resources/web` for you).
- `lucide-static` is a dependency in zk's `package.json` (`node_modules/lucide-static/icons` exists); `scripts/build-css.js` in zk carries
  the same `FA_TO_LUCIDE` / `CUSTOM_ICONS` tables the template's has.
- Widget sources in zk are the checkout itself, under four roots: `zul/src/main/resources/web/js/`, `zk/src/main/resources/web/js/`,
  `../zkcml/zkmax/src/main/resources/web/js/`, `../zkcml/zkex/src/main/resources/web/js/`. A contract's `js-source-files:` entry such as
  `zul/code/Codeeditor.ts` is a path under one of those roots. There is no `pom.xml`, no `<zk.version>`, and the jars in `~/.m2` are not the
  reference — the checkout is what the theme styles.
- `@playwright/test` is installed only under `zkpreview/node_modules/` (pinned 1.59.1); nothing Playwright-related is at the zk root.
- The IceBlue baseline app (port 8082) exists only in the template until P4; in zk nothing listens there yet.

WRITE:
1. The copy, one command:
   cd /Users/hawk/Documents/workspace/ZK10/zk && git -C /Users/hawk/Documents/workspace/zkThemeTemplate archive HEAD scripts/check-icon-coverage.sh scripts/js-source-hash.sh scripts/render-iceblue-baseline.sh scripts/capture-iceblue.js | tar -x -C /Users/hawk/Documents/workspace/ZK10/zk
2. The path rewrite, one command (expected: 1 file changed, 1 substitution — `check-icon-coverage.sh`):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- /Users/hawk/Documents/workspace/ZK10/zk/scripts/check-icon-coverage.sh /Users/hawk/Documents/workspace/ZK10/zk/scripts/js-source-hash.sh /Users/hawk/Documents/workspace/ZK10/zk/scripts/render-iceblue-baseline.sh /Users/hawk/Documents/workspace/ZK10/zk/scripts/capture-iceblue.js
3. `scripts/js-source-hash.sh` — re-point it from the pinned jars to the checkout:
   - Header comment: keep the first line; replace the "Why this exists (2026-09-08)" paragraph with three or four lines saying that in zk
     the checkout is the widget being styled (the jars are built from it), so the hash is taken over the source files under the four
     widget-source roots listed above; keep the Usage, Arguments, stdout/stderr and Exit-codes paragraphs, rewording exit 2 to
     "cannot verify on this machine (a `zkmax/` or `zkex/` entry while `../zkcml` is absent)".
   - Body: keep `set -euo pipefail`, the no-args usage check (exit 1) and `repo_root`. Delete the `zk_version` / `pom.xml` block and the
     `jars` discovery loop. Define the four roots in the order given in the FACTS (the zkcml ones as `$repo_root/../zkcml/...`). For each
     argument, take the first root under which `<root>/<rel>` is a regular file, append that file to the concat file and print
     `  <rel>  <-  <root path relative to the zk root, e.g. zul/src/main/resources/web/js or ../zkcml/zkmax/src/main/resources/web/js>` on
     stderr. If no root has it: when the entry starts with `zkmax/` or `zkex/` and `$repo_root/../zkcml` is not a directory, print
     `js-source-hash: '<rel>' needs ../zkcml, which is not checked out — cannot verify` and exit 2; otherwise print
     `js-source-hash: '<rel>' is under none of the 4 widget-source roots` and exit 1. Keep the concat-then-`shasum -a 256` ending and
     the `mktemp` + `trap` cleanup; drop `unzip`.
4. `scripts/render-iceblue-baseline.sh` — two edits: (a) in the header, the "Prerequisites" lines become: the IceBlue preview host
   (port 8082) exists only in the theme template until P4 — in zk nothing serves it yet; the script is ported so the agents' instruction
   resolves and is ready for the P4 host; keep the Usage and Output lines. (b) right after the `PROJECT_ROOT=` line add
   `export NODE_PATH="$PROJECT_ROOT/zkpreview/node_modules${NODE_PATH:+:$NODE_PATH}"` with a one-line comment that `@playwright/test`
   lives under `zkpreview/`. Nothing else changes; `capture-iceblue.js` is not edited at all.
5. `scripts/check-icon-coverage.sh` — nothing beyond step 2; do not edit it by hand.

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.21.sh` — it must end with
`3.21 ok — four scripts ported: …`. A `FAIL at:` line goes into blockers verbatim; stop there. Do not edit the verify script, the tool, the
map or the fixes table.
