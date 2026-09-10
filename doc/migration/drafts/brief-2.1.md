# Generator brief — item 2.1, the `zkpreview` module

Status: approved 2026-09-10 (chat D48-a, plan D42); revised the same day after run 1 (`wf_14ee2332-eed`) failed at `appStart` — the brief had omitted zktest's `zkwebfragment` exclusion (F50). The text below the rule is
embedded verbatim in `marble-p2-verify.js` as the Generator prompt; `{ROW}` is replaced by row 2.1
of the execution plan and the HARD RULES block is the script's shared `COMMON_RULES`. Absolute
paths are deliberate — the Generator's shell cwd resets between calls.

---

You are the GENERATOR for item 2.1 of the Marble → zk migration (P2). You stand up `zkpreview/`, a new module inside the zk checkout that will host the 159 Marble preview pages (moved in item 2.2) and the Playwright harness (item 2.3). Nothing is designed from scratch: the module is assembled from three precedents already in the tree — zktest's composite `settings.gradle` (so it builds against the live zk and zkcml source without `publishToMavenLocal`), zksandbox's `war` + gretty container skeleton (gretty 3.1.1 + jetty 9.4 + javax is the only servlet-container combination that still works in this repo), and zktest's theme-switching servlet copied verbatim. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.1.sh static` and then `… live`; run both yourself as your self-check.

If `zkpreview/` already exists from an earlier run of this brief, do not recreate it: compare each file below against this brief and change only what differs (run 1 left every file correct except `build.gradle`, which lacks the `configurations.all` exclusion in point 3).

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly: the new directory `zkpreview/` (everything under it) and ONE added line in the root `settings.gradle`. Nothing else — no `zk.xml`, no README, no `.gitignore` change (the root rule `build` already ignores `zkpreview/build`), no change under `zktest/` or `zksandbox/`.
- The preview port is 8085 and the context path `/zkpreview`; the verify script probes `http://127.0.0.1:8085/zkpreview/smoke.zul`.

READ (and nothing else), all under /Users/hawk/Documents/workspace/ZK10/zk: `zktest/settings.gradle` (full, 72 lines); `zksandbox/build.gradle` (full, 64 lines); `zktest/src/main/java/org/zkoss/zktest/http/ZKTestServlet.java` (full, 31 lines); `zktest/src/main/webapp/WEB-INF/web.xml` lines 1–131 only; `zktest/gradle.properties`; the root `settings.gradle` (20 lines); `zktest/build.gradle` lines 56–59 (the `configurations.all` exclusion) and 315–321 (the gretty block) only.

WRITE, all under /Users/hawk/Documents/workspace/ZK10/zk:

1. `zkpreview/gradle.properties` — two lines: `group=org.zkoss.zk` and the `version=` line copied from the root `gradle.properties` (the root `upVer` task rewrites every `**/gradle.properties`, which keeps it in sync).

2. `zkpreview/settings.gradle` — `zktest/settings.gradle` copied, then: `rootProject.name = 'zkpreview'`; every `[zktest]` log prefix → `[zkpreview]`; the system-property name `zktest.composite.debug` → `zkpreview.composite.debug` in both the code and the comment. The two `includeBuild` blocks and all 14 `substitute module(...)` lines stay byte-identical — the verifier diffs them against zktest's.

3. `zkpreview/build.gradle` (tabs, modelled on `zksandbox/build.gradle`):
   - a three-line header comment: what the module is (the Marble preview host, ZK-6112), that its composite build mirrors zktest and its container mirrors zksandbox;
   - plugins: `id 'war'` and `id "org.gretty" version "3.1.1"` only;
   - `java.sourceCompatibility = JavaVersion.VERSION_11` and the UTF-8 `JavaCompile` block as zksandbox;
   - directly after the repositories block, zktest's exclusion verbatim (lines 56–59), including its comment — `zk` depends on `zkwebfragment`, whose `META-INF/web-fragment.xml` auto-registers `DHtmlUpdateServlet` on `/zkau/*` and `DHtmlLayoutServlet` on `*.zul`; without the exclusion Jetty refuses to start with "Multiple servlets map to path /zkau/*":
     ```
     // work for Servlet 3.0
     configurations.all {
     	exclude group: 'org.zkoss.zk', module: 'zkwebfragment'
     }
     ```
   - repositories: `mavenLocal()`, `https://mavensync.zkoss.org/maven2`, `https://repo.maven.apache.org/maven2/` — drop zksandbox's eval, ee and jaspersoft repositories;
   - dependencies, each `implementation "<group>:<module>:${version}"`: `org.zkoss.common:zweb`, `org.zkoss.common:zweb-dsp`, `org.zkoss.zk:zk`, `org.zkoss.zk:zul`, `org.zkoss.zk:zhtml`, `org.zkoss.zk:zkplus`, `org.zkoss.zk:zkbind`, `org.zkoss.zk:zkex`, `org.zkoss.zk:zkmax`; plus `runtimeOnly 'org.apache-extras.beanshell:bsh:2.0b6'` and `providedCompile 'javax.servlet:servlet-api:2.4'` exactly as zksandbox. Nothing else from zksandbox: no `iceblue_c` theme jar (Marble now lives in zul), no jasperreports, ckez, timelinez, timeplotz, gmapsz, zuljsp, zcommons-el, commons-*;
   - `war { archiveFileName = 'zkpreview.war' }` and `description = 'ZK Marble preview host'`;
   - the gretty block:
     ```
     gretty {
     	httpPort = project.hasProperty('httpPort') ? Integer.parseInt(project.httpPort) : 8085
     	contextPath = '/zkpreview'
     	reloadOnClassChange = false
     }
     ```

4. The Gradle wrapper: copy `zktest/gradlew`, `zktest/gradlew.bat`, `zktest/gradle/wrapper/gradle-wrapper.jar` and `zktest/gradle/wrapper/gradle-wrapper.properties` byte-for-byte with `cp` into the same relative places under `zkpreview/`; keep `gradlew` executable.

5. `zkpreview/src/main/java/org/zkoss/zkpreview/http/ZKPreviewServlet.java` — `ZKTestServlet.java` copied; change ONLY the package line to `package org.zkoss.zkpreview.http;` and the class name to `ZKPreviewServlet`. Same 31 lines; every other byte identical (the verifier diffs from the first `import` line onward after mapping the class name back).

6. `zkpreview/src/main/webapp/WEB-INF/web.xml` — the same `<web-app>` header as zktest's, then only: the `org.zkoss.zk.ui.http.HttpSessionListener` listener; the `zkLoader` servlet with class `org.zkoss.zkpreview.http.ZKPreviewServlet`, init-params `update-uri` = `/zkau` and `resource-uri` = `/zkres`, `load-on-startup` 1, mapped to `*.zul` and `/zk/*`; `auEngine` (`org.zkoss.zk.au.http.DHtmlUpdateServlet`) mapped to `/zkau/*`; `resourceEngine` (`org.zkoss.zk.au.http.DHtmlResourceServlet`) mapped to `/zkres/*`; a `<welcome-file-list>` naming `smoke.zul`. No filters, no JSF, no Weld, no zkmax `EmbeddedServlet`, no zktest classes. It must pass `xmllint --noout`.

7. `zkpreview/src/main/webapp/smoke.zul` — hand-written, about 25 lines: a `<window title="Marble preview — smoke" border="normal" width="480px">` holding a `<label>`, a `<textbox>`, a `<checkbox>`, an `<hlayout>` with `<button label="Primary">` and `<button label="Default">`, a `<combobox>` with three `<comboitem>`s and a `<listbox>` with one `<listhead>` of two `<listheader>`s and three `<listitem>`s of two `<listcell>`s (popup and scrollable surfaces carry the most theme signal). No zscript, no EL, no external stylesheet.

8. The root `settings.gradle` — inside the existing `if (System.getProperty("user.name") != "zkoss") {` block, add one line directly after the zktest `includeBuild` line, same indentation: `includeBuild new File(rootDir, "zkpreview")`. Nothing else in that file.

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.1.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.1.sh live` (600000 ms timeout; it starts and stops the server itself). If `appStart` fails, paste the last 40 lines of its output into blockers and stop — do not change the gretty or jetty version, do not switch to `appRun`, do not add repositories, do not edit files outside the eight above.
