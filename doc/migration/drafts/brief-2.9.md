# Generator brief — item 2.9, the zktest test for the ZK 11 provider change

Status: written 2026-09-11 (plan D32 ruled 2026-09-10: a `zktest` WebDriver test, in P2). The text below the rule is
embedded verbatim in `marble-p2-verify.js` as the Generator prompt; `{ROW}` is replaced by row 2.9 of the execution
plan and the HARD RULES block is the script's shared `COMMON_RULES`. Absolute paths are deliberate — the Generator's
shell cwd resets between calls. The Planner hand-ran the exact three files below as a throw-away before dispatch
(rule 2; the timing is recorded in the plan row). Precedents read for the shape: `F110_ZK_6086CodeeditorCspTest`
(header, `getEval`, `assertNoAnyError`), `B103_ZK_5870Test` (`Library.setProperty` inside the test JVM — the embedded
Jetty runs in the same JVM, so no `ExternalZkXml` / `@ForkJVMTestOnly` / Docker is needed).

---

You are the GENERATOR for item 2.9 of the Marble → zk migration (P2). ZK 11 makes Marble the default theme, and P1 changed `org.zkoss.zul.theme.StandardThemeProvider` so that it links a reset stylesheet immediately before the `zk.wcs` widget-CSS bundle — `~./zul/css/reset.css` by default, or the host-safe `~./zul/css/reset-embed.css` when the library property `org.zkoss.zul.theme.browserDefault` is `true`. `zk` requires a test case per feature and `zul` has no test tree, so the test is a `zktest` WebDriver test: two methods, one per branch, each reading the `<link rel="stylesheet">` hrefs of the page head and asserting the order. You write three files exactly as given below; a different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.9.sh static` and then `… live`; run both yourself as your self-check.

If the files already exist from an earlier run of this brief, do not recreate them: compare each against this brief and change only what differs.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly three files, all under /Users/hawk/Documents/workspace/ZK10/zk/zktest: the new `src/test/java/org/zkoss/zktest/zats/test2/B110_ZK_6112Test.java`, the new `src/main/webapp/test2/B110-ZK-6112.zul`, and ONE appended line in `src/main/webapp/test2/config.properties`. Nothing else — no `zk.xml`, no `build.gradle`, nothing under `zul/`, `zk/`, `zkbind/` or `zkpreview/`, nothing in the template. `git status` under `zktest` already shows three modified files that belong to other people's sessions (`zktest/build.gradle`, `B86_ZK_4102Test.java`, `F96_ZK_4783Test.java`): do not touch, stage or revert them.
- Do not use `@ForkJVMTestOnly`, `ExternalZkXml` or a custom `zk.xml`: the property is toggled with `Library.setProperty` inside the test, which the embedded server reads on the next request. Do not run the VS Code test runner; only the Gradle command below.

READ (and nothing else): /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/java/org/zkoss/zul/theme/StandardThemeProvider.java lines 40–110 (the `insertResetURI` logic you are testing); /Users/hawk/Documents/workspace/ZK10/zk/zktest/src/test/java/org/zkoss/zktest/zats/test2/F110_ZK_6086CodeeditorCspTest.java (the shape precedent, 55 lines); the last five lines of /Users/hawk/Documents/workspace/ZK10/zk/zktest/src/main/webapp/test2/config.properties.

WRITE, all under /Users/hawk/Documents/workspace/ZK10/zk/zktest:

1. `src/test/java/org/zkoss/zktest/zats/test2/B110_ZK_6112Test.java` — new, tabs, exactly this content:
   ```
   /* B110_ZK_6112Test.java

   	Purpose:
   		
   	Description:
   		
   	History:
   		Fri Sep 11 2026, Created for ZK-6112.

   Copyright (C) 2026 Potix Corporation. All Rights Reserved.
   */
   package org.zkoss.zktest.zats.test2;

   import static org.junit.jupiter.api.Assertions.assertFalse;
   import static org.junit.jupiter.api.Assertions.assertTrue;

   import java.util.Arrays;
   import java.util.List;

   import org.junit.jupiter.api.Test;

   import org.zkoss.lang.Library;
   import org.zkoss.test.webdriver.WebDriverTestCase;

   /**
    * ZK 11 makes Marble the default theme: StandardThemeProvider links the reset stylesheet
    * immediately before the zk.wcs widget-CSS bundle, and the library property
    * org.zkoss.zul.theme.browserDefault selects the host-safe reset-embed.css instead of the
    * global reset.css (ZK-6112).
    */
   public class B110_ZK_6112Test extends WebDriverTestCase {
   	private static final String BROWSER_DEFAULT = "org.zkoss.zul.theme.browserDefault";

   	@Test
   	public void testResetPrecedesWcs() {
   		connect();
   		waitResponse();
   		List<String> hrefs = stylesheetHrefs();
   		int reset = indexOf(hrefs, "/zul/css/reset.css");
   		int wcs = indexOf(hrefs, "/zul/css/zk.wcs");
   		assertTrue(wcs >= 0, "zk.wcs is linked: " + hrefs);
   		assertTrue(reset >= 0, "reset.css is linked: " + hrefs);
   		assertTrue(reset < wcs, "reset.css precedes zk.wcs: " + hrefs);
   		assertFalse(indexOf(hrefs, "/zul/css/reset-embed.css") >= 0, "reset-embed.css is not linked by default: " + hrefs);
   		assertNoAnyError();
   	}

   	@Test
   	public void testBrowserDefaultServesEmbedReset() {
   		Library.setProperty(BROWSER_DEFAULT, "true");
   		try {
   			connect();
   			waitResponse();
   			List<String> hrefs = stylesheetHrefs();
   			int reset = indexOf(hrefs, "/zul/css/reset-embed.css");
   			int wcs = indexOf(hrefs, "/zul/css/zk.wcs");
   			assertTrue(wcs >= 0, "zk.wcs is linked: " + hrefs);
   			assertTrue(reset >= 0, "reset-embed.css is linked when browserDefault=true: " + hrefs);
   			assertTrue(reset < wcs, "reset-embed.css precedes zk.wcs: " + hrefs);
   			assertFalse(indexOf(hrefs, "/zul/css/reset.css") >= 0, "reset.css is not linked when browserDefault=true: " + hrefs);
   			assertNoAnyError();
   		} finally {
   			Library.setProperty(BROWSER_DEFAULT, null);
   		}
   	}

   	private static List<String> stylesheetHrefs() {
   		return Arrays.asList(getEval(
   				"Array.from(document.querySelectorAll('head > link[rel=stylesheet]')).map(function (l) { return l.href; }).join('\\n')")
   				.split("\n"));
   	}

   	private static int indexOf(List<String> hrefs, String part) {
   		for (int i = 0; i < hrefs.size(); i++)
   			if (hrefs.get(i).contains(part))
   				return i;
   		return -1;
   	}
   }
   ```
   (`connect()` with no argument opens `/test2/B110-ZK-6112.zul`, derived from the class name; `getEval` wraps the expression in `return (…)` and returns it as a String; hrefs may carry `;jsessionid=…`, which `contains` ignores.)

2. `src/main/webapp/test2/B110-ZK-6112.zul` — new, tabs, exactly this content:
   ```
   <?xml version="1.0" encoding="UTF-8"?>
   <!--
   B110-ZK-6112.zul

   	Purpose:
   		
   	Description:
   		
   	History:
   		Fri Sep 11 2026, Created for ZK-6112.

   Copyright (C) 2026 Potix Corporation. All Rights Reserved.
   -->
   <zk>
   	<label multiline="true">
   		ZK-6112 Marble is the default theme (ZK 11). Open this page and inspect the stylesheet links in
   		the head: the reset stylesheet (zul/css/reset.css) must be linked immediately before the widget
   		bundle (zul/css/zk.wcs). With the library property org.zkoss.zul.theme.browserDefault=true the
   		link is zul/css/reset-embed.css instead, and reset.css is not linked. The button below must render
   		in the Marble style (rounded corners, Marble palette).
   	</label>
   	<button label="Marble button"/>
   </zk>
   ```

3. `src/main/webapp/test2/config.properties` — the file has **CRLF line terminators** (`file` says so); never open and rewrite it with an editor or a script that normalises newlines (the Planner did, and `git diff --numstat` showed 4561/4560). Append exactly one line with the file's own terminator, in one command:
   ```
   printf '##zats##B110-ZK-6112.zul=A,E,Theme,ThemeProvider,Marble\r\n' >> /Users/hawk/Documents/workspace/ZK10/zk/zktest/src/main/webapp/test2/config.properties
   ```
   Nothing else in the file changes; `git diff --numstat` on it must print `1	0`.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short -- zktest && git diff --numstat -- zktest`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.9.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.9.sh live` (600000 ms timeout; it runs `cd zktest && ./gradlew test --tests "org.zkoss.zktest.zats.test2.B110_ZK_6112Test" -PmaxParallelForks=1 --console=plain --no-daemon` and reads the JUnit XML report — the Planner's warm run took the time recorded in the plan row). If `live` fails, paste the `FAIL at:` line and the last 30 lines of Gradle output into blockers and stop — do not change the assertions, do not add `@ForkJVMTestOnly`, do not edit `build.gradle`, do not retry.
