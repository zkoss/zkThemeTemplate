# Generator brief — item 2.10, the theme-prefix lookups in `zkpreview`'s copy of `screenshot.spec.ts`

Status: draft 2026-09-11 for plan D51 (ruled A the same day, chat D59). The text below the rule is embedded verbatim
in `marble-p2-verify.js` as the Generator prompt; `{ROW}` is replaced by row 2.10 of the execution plan and the HARD
RULES block is the script's shared `COMMON_RULES`. Absolute paths are deliberate — the Generator's shell cwd resets
between calls. The Planner ran this exact change on 2026-09-11 (rule 2, upgraded): from a throw-away copy of the spec
both tests passed against `zkpreview` (2 passed, 2.3 s), and in-tree `verify-2.10.sh static` then `live` both passed
before the copy was reverted; on the unchanged tree `static` fails at "the four theme-prefix lines" and the two tests
fail with "combo.css.dsp fetched" (F55). Trap found while writing this: the second test is named `open-state` with a
hyphen; `-g "open state"` selects a different, passing test.

---

You are the GENERATOR for item 2.10 of the Marble → zk migration (P2). Two tests in `zkpreview`'s copy of the template's `screenshot.spec.ts` locate the theme's stylesheet prefix by looking for a `/marble/` path segment in a stylesheet `href`, then fetch `combo.css.dsp` under that prefix. In the template Marble is a theme jar and the reset stylesheet is `/zkau/web/<v>/marble/zul/css/reset.css`; in `zk` Marble is the core theme and the same stylesheet is `/zkres/web/<v>/zul/css/reset.css` — there is no `marble` segment, so both tests fail on every `zkpreview` run. You change exactly four lines so the prefix is derived from the `reset.css` link instead (which gives the template the same prefix as before and `zk` the right one). A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.10.sh static` and then `… live`; run both yourself as your self-check.

If the change is already present from an earlier run of this brief, do not redo it: run the self-check and report.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly ONE file: /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/src/test/playwright/screenshot.spec.ts, and in it exactly four lines. Nothing else under `zkpreview`, nothing under /Users/hawk/Documents/workspace/zkThemeTemplate (the template original is right for the template and stays as it is).
- Do not read the spec file — it is 323 KB of harness you must not study. Make the four edits with `sed` exactly as below; the verifier diffs the copy against the template and allows exactly those lines.
- Do not start the server by hand and do not run `npx playwright install`; the verify script starts and stops `zkpreview` itself.

READ (and nothing else): the output of `/usr/bin/grep -n "/marble/" /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/src/test/playwright/screenshot.spec.ts` — four lines (two per test, at 301/303 and 364/366): a `.find(h => h.includes('/marble/'))` and a `const prefix = link.slice(0, link.indexOf('/marble/') + '/marble'.length);` each.

WRITE — one command:

```
cd /Users/hawk/Documents/workspace/ZK10/zk && sed -i '' \
  -e "s|\.find(h => h\.includes('/marble/'));|.find(h => h.includes('/zul/css/reset.css'));|" \
  -e "s|const prefix = link\.slice(0, link\.indexOf('/marble/') + '/marble'\.length);|const prefix = link.slice(0, link.indexOf('/zul/css/reset.css'));|" \
  zkpreview/src/test/playwright/screenshot.spec.ts
```

After it, `git diff --numstat -- zkpreview/src/test/playwright/screenshot.spec.ts` must print `4	4`, and `/usr/bin/grep -c "/marble/"` on the file must print 0. The `fetch(prefix + '/js/zul/inp/css/combo.css.dsp')` lines are untouched: with the new prefix the template fetches `/zkau/web/<v>/marble/js/zul/inp/css/combo.css.dsp` as before and `zk` fetches `/zkres/web/<v>/js/zul/inp/css/combo.css.dsp`, which the module serves (HTTP 200, 27 KB, contains `.z-datebox-timezone`).

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short -- zkpreview && git diff --numstat -- zkpreview`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.10.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.10.sh live` (600000 ms timeout; it starts the server, runs the two tests — `--project=chromium -g "timezone <select>|open-state"`, note the hyphen — and stops the server itself; about a minute warm). If `live` fails, paste its last 20 lines into blockers and stop — do not edit any other line, do not touch the template, do not retry the server by hand.
