# Generator brief — item 2.8, the tablet family ledger (zero-tolerance comparison)

Status: written 2026-09-11, the same shape as brief-2.6 (which PASSED first run); family `tablet`, 30 baselines
(`*-tablet.png`), projects `tablet` only (mobile UA emulation). The Planner hand-ran `verify-2.8.sh live` on 2026-09-11 (F67): 30 / 30 identical at the first shot, no re-shoot, tablet shots 53 s, about 1.3 m in all. Rulings in force: D49 C, D57, D58, D61 A′, D64, D66 (hybrid). Row 2.8: the tablet spec's two known 2 % `maxDiffPixelRatio` opt-ins are NOT tolerances for this ledger — a shot that still differs after three re-shoots is `OPEN` with its pair, a decision for the user, never a ledger explanation.

---

You are the GENERATOR for item 2.8 of the Marble → zk migration (P2). You write the **tablet-family ledger**: one line per committed tablet baseline of the theme template (30 PNGs named `*-tablet.png` under /Users/hawk/Documents/workspace/zkThemeTemplate/doc/screenshots) stating whether the screenshot `zkpreview` produces for it is byte-identical. You do not judge images yourself and you do not run Playwright by hand: the tracked script does the whole measurement and prints the rows; you copy its result into the ledger file. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.8.sh static` and then `… live`; run `live` once to obtain the result and `static` as your self-check.

If the ledger already exists from an earlier run of this brief, do not rewrite it blindly: run `live`, compare its `result.tsv` with the ledger, and change only rows that differ (see the rule on flaky rows below).

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly ONE new file: /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/ledgers/2.8-tablet.tsv. Nothing else in the template, nothing under /Users/hawk/Documents/workspace/ZK10/zk — unless a difference remains after the script's three re-shoots, in which case you also copy that difference's image pair into `zk`'s `tasks/marble-screenshot-diffs/` (point 4) and nothing more. Never edit a page, a spec, a baseline PNG, the exception list or any tool.
- Never start or stop the server yourself and never run `npx playwright` yourself; `verify-2.8.sh live` starts `zkpreview` on port 8085, runs the template's unchanged specs, compares, re-shoots and stops the server. It takes about three minutes; give it a 600000 ms timeout and do not run anything else meanwhile.

READ (and nothing else): the header comment of /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/zero-tolerance/verify-family.sh (lines 1–45: the ledger format); /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/ledgers/noisy-exceptions.tsv (expect no active row — every line is a comment); after the run, the files `result.tsv` and `summary1.txt` in the run's output directory.

WRITE:

1. Run the measurement: `mkdir -p /tmp/zero-2.8 && cd /Users/hawk/Documents/workspace/zkThemeTemplate && ZERO_ROOT=/tmp/zero-2.8 bash doc/migration/tools/verify-2.8.sh live` (600000 ms). It is EXPECTED to end with `2.8 live FAIL at: ledger file … (written by the Generator)` — that is the designed stop before the ledger exists, not an error. Every earlier stage must have printed `stage: …`; if it stopped anywhere else (`FAIL at: environment`, `port 8085`, `gretty`, `every tablet PNG … has a baseline`, `compare.config.ts produced compare.json`), paste the last 20 lines into blockers and stop.

2. Read `/tmp/zero-2.8/result.tsv`: 30 lines, `<name>.png<TAB><STATUS>`, STATUS one of `IDENTICAL`, `IDENTICAL-ON-RESHOOT <1..3>`, `WITHIN-TOLERANCE` (only for a name in the exception list — none today), or `DIFF <n> px` / `SIZE …` for a remaining difference. Count them; `summary1.txt`'s last line gives the round-1 totals.

3. Write `doc/migration/ledgers/2.8-tablet.tsv` — exactly:
   - line 1: `# oracle zkThemeTemplate <commit>` where `<commit>` is the output of `git -C /Users/hawk/Documents/workspace/zkThemeTemplate log -1 --format=%h -- doc/screenshots` (the last commit that touched the baselines — `40c4ddda` today);
   - line 2: `# zkpreview zk <commit>` where `<commit>` is `git -C /Users/hawk/Documents/workspace/ZK10/zk rev-parse --short HEAD`;
   - then the 30 rows of `result.tsv` in its order (it is sorted), TAB-separated, one per line, with these translations and no others: `IDENTICAL` and `IDENTICAL-ON-RESHOOT <n>` copied as they are; `WITHIN-TOLERANCE` (or `WITHIN-TOLERANCE-ON-RESHOOT <n>`) → `NOISY <sub-pixel %>` copied from that name's row in `noisy-exceptions.tsv`; any `DIFF …` / `SIZE …` row → `OPEN`.
   No trailing spaces, a newline after the last row, nothing else in the file.

4. Only if a row is `OPEN`: `mkdir -p /Users/hawk/Documents/workspace/ZK10/zk/tasks/marble-screenshot-diffs/2.8-<name-without-.png>` and copy the three files from `/tmp/zero-2.8/pairs/<name-without-.png>/` (`template-baseline.png`, `zkpreview.png`, `diff.png`) into it. Then list every `OPEN` row in blockers with its `DIFF` count — the Planner shows the pair to the user; you do not investigate or fix anything.

Rule on flaky rows: `IDENTICAL` versus `IDENTICAL-ON-RESHOOT <n>` describes one run's luck, and the verifier's own `live` run may see the other; it reports that as informational, never as a failure. Write what YOUR run printed.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/zkThemeTemplate && git status --short -- doc/migration && wc -l doc/migration/ledgers/2.8-tablet.tsv && head -n 3 doc/migration/ledgers/2.8-tablet.tsv && cut -f2 doc/migration/ledgers/2.8-tablet.tsv | sort | uniq -c`; then `bash doc/migration/tools/verify-2.8.sh static` — it must end with `2.8 static ok`. If it fails, paste the `FAIL at:` line into blockers and stop; do not edit anything outside the ledger file to make it pass.
