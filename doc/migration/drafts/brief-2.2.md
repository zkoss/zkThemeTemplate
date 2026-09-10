# Generator brief — item 2.2, the preview pages move into `zkpreview`

Status: approved 2026-09-10 (chat D50-A / plan D44 — layout A, the webapp `/web` directory served as class web
resources; chat D52-A fixed `codeeditor.zul` in the template first, so the copy stays byte-identical). The text below the rule is embedded verbatim in
`marble-p2-verify.js` as the Generator prompt; `{ROW}` is replaced by row 2.2 of the execution plan and the
HARD RULES block is the script's shared `COMMON_RULES`. Absolute paths are deliberate — the Generator's shell
cwd resets between calls. The Planner ran this exact layout as a throw-away on 2026-09-10 (rule 2, upgraded):
158 of 159 pages answer 200, the one 500 (`pv/cascader-content.zul` loaded directly) is a fragment the
template also answers 500 for, and `preview.zul` lists the same 114 pages as the template's.

---

You are the GENERATOR for item 2.2 of the Marble → zk migration (P2). You copy the template's 159 preview and use-case pages, their images, media and CSS, and the small `zk.example` Java helper classes they name, into `zkpreview/`, the module item 2.1 stood up inside the zk checkout. It is a copy, never a move: the template repository stays the source of truth until P4, and nothing in it changes. Every page is copied byte-for-byte — the pages refer to each other and to their assets as class web resources (`~./button.zul`, `~./pv/matrix.zul`, `~./img/…`), and instead of rewriting those references the module tells ZK, through one library property, to look for class web resources in the webapp's `/web` directory as well as on the class path. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.2.sh static` and then `… live`; run both yourself as your self-check.

If the files below already exist from an earlier run of this brief, do not recreate them: compare each against this brief and change only what differs.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly: the new directory `zkpreview/src/main/webapp/web/` (the copied tree), the new file `zkpreview/src/main/webapp/WEB-INF/zk.xml`, the new directory `zkpreview/src/main/java/zk/example/` (14 files) and TWO added lines in `zkpreview/build.gradle`. Nothing else — `web.xml`, `smoke.zul`, `settings.gradle`, the servlet and the root `settings.gradle` stay as item 2.1 left them; nothing under /Users/hawk/Documents/workspace/zkThemeTemplate is modified, moved or deleted.
- Never edit a `.zul`, `.css`, `.js`, image, video or PDF you copy, and never "fix" a page: the verifier compares every copied byte against the template. Never use `mv` or `git mv`.
- Pages are addressed as `http://127.0.0.1:8085/zkpreview/web/<page>.zul`; the verify script starts and stops the server itself.

READ (and nothing else): the listing of /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/resources/web (`find … -type f | wc -l` and the top-level names — do not open the pages); /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/java/zk/example/ZulListVM.java (46 lines); the `import` blocks of `BrandSwitcherVM.java` and `UseCaseVM.java` in the same directory; /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/resources/metainfo/zk/zk.xml (6 lines); /Users/hawk/Documents/workspace/ZK10/zk/zkpreview/build.gradle (57 lines).

WRITE, all under /Users/hawk/Documents/workspace/ZK10/zk/zkpreview:

1. The page tree — `mkdir -p src/main/webapp/web && cp -R /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/resources/web/. src/main/webapp/web/`, then remove every `.DS_Store` from the COPY only (`find src/main/webapp/web -name .DS_Store -delete`; they are macOS Finder files, not part of the tree). Expect 159 `.zul` files and 379 files in total under `src/main/webapp/web` (the top-level pages, `pv/`, `usecase/`, `utility/`, `img/`, `media/`, `link-annotation.pdf`).

2. The helper classes — copy every `*.java` directly in /Users/hawk/Documents/workspace/zkThemeTemplate/src/test/java/zk/example/ EXCEPT `ThemePreviewApp.java` into `src/main/java/zk/example/` (14 files, same file names, package `zk.example` unchanged — the pages name these classes). Do not copy the `iceblue/` subdirectory (a second Spring Boot launcher). Then make exactly these three edits and no other:
   a. `BrandSwitcherVM.java`: the line `import org.zkoss.theme.marble.MarbleBrand;` becomes `import org.zkoss.zul.theme.MarbleBrand;`
   b. `UseCaseVM.java`: the line `import org.zkoss.theme.marble.MarbleDensity;` becomes `import org.zkoss.zul.theme.MarbleDensity;` (P1 moved both classes into `zul`, package `org.zkoss.zul.theme`).
   c. `ZulListVM.java`: it lists the pages for `preview.zul` by scanning a directory named `web` on the class path, which in the module is a ZK jar's directory, not the pages. Replace these three lines inside `findZulFiles()`:
      ```
              // Use getResource() to ensure correct path resolution in different environments (e.g., JAR, Java EE)
              java.net.URL resource = getClass().getClassLoader().getResource("web");
              File dir = new File(resource.getFile());
      ```
      with
      ```
              // The pages live in the webapp's /web directory (served as class web resources through
              // org.zkoss.web.util.resource.dir); list that directory rather than the class path.
              File dir = new File(WebApps.getCurrent().getRealPath("/web"));
      ```
      and add `import org.zkoss.zk.ui.WebApps;` after the existing `import java.util.*;` line, separated from it by one blank line. Nothing else in the file changes (same indentation — four spaces, as the file uses).

3. `src/main/webapp/WEB-INF/zk.xml` — new file, tabs, exactly this content (the first two settings are the template's own test `zk.xml`; the property is what makes the `~./` references resolve):
   ```
   <zk>
   	<config-name>marble-preview</config-name>
   	<client-config>
   		<debug-js>true</debug-js>
   	</client-config>
   	<!-- The preview pages refer to each other and to their assets as class web resources (~./...);
   	     this lets ZK find them in the webapp's /web directory as well as on the class path. -->
   	<library-property>
   		<name>org.zkoss.web.util.resource.dir</name>
   		<value>/web</value>
   	</library-property>
   </zk>
   ```
   No preferred-theme property (Marble is the default), no cache settings, nothing else.

4. `build.gradle` — directly after the line `implementation "org.zkoss.zk:zkmax:${version}"` add two lines with the same tab indentation:
   ```
   	implementation "org.zkoss.zk:zuti:${version}"
   	implementation "org.zkoss.zk:za11y:${version}"
   ```
   `<apply>`, `<forEach>` and `<choose>` in the pages are zuti shadow elements (without zuti Jetty answers 500: "Component definition not found: apply"); both jars are on the template preview app's classpath and both are already substituted by the module's `settings.gradle`. Nothing else in the file changes.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short -- zkpreview && git diff --stat -- zkpreview`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.2.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.2.sh live` (600000 ms timeout; it starts the server, opens every page in headless Chromium and stops the server itself — about three minutes warm). If `live` lists failing pages, paste the list into blockers and stop — do not edit any copied page, do not add dependencies beyond the two above, do not change `web.xml`, do not retry the server by hand.
