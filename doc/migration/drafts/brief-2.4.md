# Generator brief — item 2.4, zksandbox drops the `iceblue_c` pin

Status: draft 2026-09-10, **deferred** — chat D51 / plan D45: zksandbox is the released "ZK Sandbox" demo
(`release.gradle` ships `zk-sandbox-<version>.zip`) and someone chose `iceblue_c` for it on purpose in February
2026; whether the ZK 11 sandbox shows Marble or IceBlue is a product question the code cannot answer, so item
2.4 waits for the owners. Written for option A (the dead preferred-theme entry goes with the jar). The text below the rule is embedded verbatim in `marble-p2-verify.js`
as the Generator prompt; `{ROW}` is replaced by row 2.4 of the execution plan and the HARD RULES block is the
script's shared `COMMON_RULES`. Absolute paths are deliberate — the Generator's shell cwd resets between calls.

---

You are the GENERATOR for item 2.4 of the Marble → zk migration (P2). Marble is now ZK's default theme and lives inside `zul`; `zksandbox`, the demo webapp, still pins the IceBlue theme jar `org.zkoss.theme:iceblue_c:10.3.0.1-Eval` in its build and names `iceblue_c` as the preferred theme in its `zk.xml`. Both go. With the jar gone the `zk.xml` entry would name a theme that is not registered, and ZK would silently fall back to the highest-priority registered theme — a dead setting that misleads the next reader, so it is removed rather than left behind. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.4.sh`; run it yourself as your self-check.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly two files, both under /Users/hawk/Documents/workspace/ZK10/zk: `zksandbox/build.gradle` (one line removed) and `zksandbox/src/main/webapp/WEB-INF/zk.xml` (one four-line block removed). Nothing else — no new file, no other dependency, no comment edits, no blank-line changes beyond the removed lines.

READ (and nothing else): /Users/hawk/Documents/workspace/ZK10/zk/zksandbox/build.gradle lines 35–50; /Users/hawk/Documents/workspace/ZK10/zk/zksandbox/src/main/webapp/WEB-INF/zk.xml lines 550–563.

WRITE:

1. `zksandbox/build.gradle` — delete the single line `	implementation 'org.zkoss.theme:iceblue_c:10.3.0.1-Eval'` (line 39). The lines before and after it stay exactly as they are.

2. `zksandbox/src/main/webapp/WEB-INF/zk.xml` — delete the four lines
   ```
   	<library-property>
   		<name>org.zkoss.theme.preferred</name>
   		<value>iceblue_c</value>
   	</library-property>
   ```
   (lines 559–562, directly before the closing `</zk>`). The commented-out `xel-config` block above them and the closing `</zk>` stay exactly as they are.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short -- zksandbox && git diff -- zksandbox`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.4.sh` (it runs `./gradlew :zksandbox:war` from the zk root — about 30 s warm — and inspects the war). If the war build fails, paste the last 40 lines into blockers and stop — do not add repositories or dependencies, do not touch any other file.
