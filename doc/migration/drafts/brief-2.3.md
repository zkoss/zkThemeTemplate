# Generator brief — item 2.3, the Playwright harness moves into `zkpreview`

Status: draft 2026-09-10 for chat D55 (plan D47 ruled A the same day: context root + forwarding filter). The text
below the rule is embedded verbatim in `marble-p2-verify.js` as the Generator prompt; `{ROW}` is replaced by row 2.3
of the execution plan and the HARD RULES block is the script's shared `COMMON_RULES`. Absolute paths are deliberate —
the Generator's shell cwd resets between calls. The Planner ran this exact change as a throw-away on 2026-09-10 (rule
2, upgraded): the real harness's `--project=smoke` reported 115 passed in 100 s against the context-root server, also
with the config's default `baseURL`. The screenshot baselines (`doc/screenshots`, 308 files) do NOT move in this item —
the comparison items 2.6–2.8 decide where the oracle lives.

---

You are the GENERATOR for item 2.3 of the Marble → zk migration (P2). You copy the theme template's Playwright harness — 14 spec files and their config, 323 KB you must not read — into `zkpreview/`, the preview module that already serves the 159 pages (items 2.1, 2.2), and you make the module answer where the template's preview app answered: the specs navigate with a leading slash (`page.goto('/button.zul')`), which Playwright resolves against the origin, so the pages must be reachable at the context root even though they live under `/web`. Two small server-side changes do that; the harness itself changes in exactly five lines. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.3.sh static` and then `… live`; run both yourself as your self-check.

If the files below already exist from an earlier run of this brief, do not recreate them: compare each against this brief and change only what differs.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly, all under /Users/hawk/Documents/workspace/ZK10/zk/zkpreview: ONE changed line in `build.gradle`; the new class `src/main/java/org/zkoss/zkpreview/http/PreviewPathFilter.java`; one added block in `src/main/webapp/WEB-INF/web.xml`; the new directory `src/test/playwright/` (15 files); the new file `doc/focus-ring-known-clips.json`; the new files `package.json`, `package-lock.json` (written by `npm install`) and `.gitignore`. Nothing else — no page under `src/main/webapp/web/`, no `zk.xml`, no `smoke.zul`, no `settings.gradle`, no root file, nothing under /Users/hawk/Documents/workspace/zkThemeTemplate, and not `doc/screenshots`.
- Do not read the spec files. Copy them with `cp`, then make the five line edits below with `sed`; the verifier diffs every file against the template and allows exactly those lines.
- Do not run `npx playwright install` — Playwright 1.59.1's Chromium is already installed on this machine, and that is why the version is pinned exactly.

READ (and nothing else): /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/build.gradle lines 52–56 (the gretty block); /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/src/main/webapp/WEB-INF/web.xml lines 14–22; the listing of /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/playwright (`ls`); /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/playwright/playwright.config.ts lines 24–31 only; the `scripts` block of /Users/hawk/Documents/workspace/zkThemeTemplate/package.json.

WRITE, all under /Users/hawk/Documents/workspace/ZK10/zk/zkpreview:

1. `build.gradle` — in the gretty block, the line `	contextPath = '/zkpreview'` becomes `	contextPath = '/'`. Nothing else in the file.

2. `src/main/java/org/zkoss/zkpreview/http/PreviewPathFilter.java` — new, tabs, exactly this content (Servlet 2.4 API: the context comes from `FilterConfig`, never from `ServletRequest.getServletContext()`):
   ```
   /* PreviewPathFilter.java

   	Purpose:
   		Serve the Marble preview pages at the context root.
   	Description:
   		The pages live under /web (execution plan D44) so that their class-web-resource references
   		(~./...) resolve. The Playwright harness copied from the theme template navigates with a leading
   		slash (/button.zul), so this filter forwards /<page>.zul to /web/<page>.zul whenever that page
   		exists, and the module answers exactly where the template's preview app answered (D47).
   	History:
   		Thu Sep 10 2026, Created for ZK-6112.

   Copyright (C) 2026 Potix Corporation. All Rights Reserved.
   */
   package org.zkoss.zkpreview.http;

   import java.io.IOException;

   import javax.servlet.Filter;
   import javax.servlet.FilterChain;
   import javax.servlet.FilterConfig;
   import javax.servlet.ServletContext;
   import javax.servlet.ServletException;
   import javax.servlet.ServletRequest;
   import javax.servlet.ServletResponse;
   import javax.servlet.http.HttpServletRequest;

   public class PreviewPathFilter implements Filter {
   	private ServletContext _ctx;

   	public void init(FilterConfig config) {
   		_ctx = config.getServletContext();
   	}

   	public void destroy() {
   	}

   	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
   			throws IOException, ServletException {
   		final String path = ((HttpServletRequest) request).getServletPath();
   		if (path != null && !path.startsWith("/web/") && _ctx.getResource("/web" + path) != null) {
   			request.getRequestDispatcher("/web" + path).forward(request, response);
   			return;
   		}
   		chain.doFilter(request, response);
   	}
   }
   ```

3. `src/main/webapp/WEB-INF/web.xml` — directly after the line `	<display-name>zkpreview</display-name>` insert one blank line and then, tabs:
   ```
   	<!-- The preview pages live under /web; answer /<page>.zul at the context root too (D47) -->
   	<filter>
   		<filter-name>previewPath</filter-name>
   		<filter-class>org.zkoss.zkpreview.http.PreviewPathFilter</filter-class>
   	</filter>
   	<filter-mapping>
   		<filter-name>previewPath</filter-name>
   		<url-pattern>*.zul</url-pattern>
   	</filter-mapping>
   ```
   Remove nothing. It must still pass `xmllint --noout`. (The mapping applies to REQUEST dispatches only, the default, so the forwarded request is not filtered again.)

4. The harness — `mkdir -p src/test/playwright && cp /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/playwright/*.ts src/test/playwright/` (15 files: 14 `*.spec.ts` + `playwright.config.ts`). Then exactly these edits, with `sed -i ''`:
   a. In `focus-ring-scan.spec.ts`, `forced-colors-gallery.spec.ts` and `gallery-scan.spec.ts`: the line `const WEB_DIR = path.resolve(__dirname, '../resources/web');` becomes `const WEB_DIR = path.resolve(__dirname, '../../main/webapp/web');` (the pages live in the webapp, not under src/test/resources). One line per file.
   b. In `playwright.config.ts`: the line `    baseURL: process.env.PREVIEW_URL ?? 'http://localhost:8081',` becomes `    baseURL: process.env.PREVIEW_URL ?? 'http://localhost:8085',` and the comment line `    // The port itself is bound in src/test/java/zk/example/ThemePreviewApp.java.` becomes `    // The port itself is bound in build.gradle (gretty httpPort).`
   Nothing else in any of the 15 files. `snapshotDir` and the `BASELINE_FILE` / `SNAP_DIR` paths stay: from `zkpreview/src/test/playwright` they resolve to `zkpreview/doc/…`.

5. `doc/focus-ring-known-clips.json` — `mkdir -p doc && cp /Users/hawk/Documents/workspace/zkThemeTemplate/doc/focus-ring-known-clips.json doc/` (the focus-ring scan's known-clips baseline; byte-identical).

6. `package.json` — new, two-space indentation, exactly:
   ```
   {
     "name": "zkpreview",
     "version": "0.0.0",
     "private": true,
     "description": "Playwright harness for the Marble preview host (zkpreview)",
     "scripts": {
       "test:focus-scan": "playwright test --config src/test/playwright/playwright.config.ts --project=focus-scan",
       "test:hit-target": "playwright test --config src/test/playwright/playwright.config.ts --project=hit-target",
       "test:forced-colors": "playwright test --config src/test/playwright/playwright.config.ts --project=forced-colors",
       "capture:forced-colors": "playwright test --config src/test/playwright/playwright.config.ts --project=forced-colors-gallery",
       "screenshot:test": "playwright test --config src/test/playwright/playwright.config.ts",
       "screenshot:update": "playwright test --config src/test/playwright/playwright.config.ts --update-snapshots"
     },
     "devDependencies": {
       "@playwright/test": "1.59.1"
     }
   }
   ```
   The version is exact on purpose: `^1.59.1` resolves to 1.63.0, whose Chromium build is not installed here and every test would fail with "Executable doesn't exist".

7. `.gitignore` — new, two lines: `test-results/` and `playwright-report/` (Playwright's own output directories; `node_modules/` is already ignored by the root).

8. `cd /Users/hawk/Documents/workspace/ZK10/zk/zkpreview && npm install --no-audit --no-fund` — writes `package-lock.json` and `node_modules/` (ignored). Do not run any `playwright install`.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short -- zkpreview && git diff --stat -- zkpreview`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.3.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.3.sh live` (600000 ms timeout; it starts the server, runs the harness's `smoke` project — about two and a half minutes warm — and stops the server itself). If `live` fails, paste its last 30 lines into blockers and stop — do not edit any spec, do not change the Playwright version, do not run `playwright install`, do not retry the server by hand.
