# Generator brief — item 3.5, rewrite the zk copy of `marble-theme` for zk

Status: written 2026-09-11 (P3 session) after 3.4 landed (`d02d455290`). Embedded verbatim in `marble-p3-verify.js`; `{ROW}` = row 3.5,
`{COMMON_RULES}` shared. Planner dry-runs of `verify-3.5.sh`: `static` stops at "copy rewritten" and `live` at "copy states the zkpreview
command" on the un-rewritten copy, as designed; the exact server command below was hand-started and stopped once by the Planner
(rule 2): served `/button.zul` in 7 s, stopped cleanly, port free. Rulings in force: D47, D48, D51, D201-A; findings F57, F64, F68.
**Second dispatch 2026-09-11:** the first Generator stopped at `static`'s path-existence stage with 10 MISSING — 8 were the checker's
(placeholders, paths relative to the web root / `web/js` / the `ZK10` parent; widened), 2 were real template-only facts the copy still
carried (the `font-awesome.css.dsp` stub and `zk.wcs` pair — gone in zk since D39; the throwaway-page directory, which in gretty is
`zkpreview/build/inplaceWebapp/`, hand-proven live: dropped-in page → 200 with its marker, unknown page → 404). Steps 6–8 added; the
live stage now proves the directory the copy names.
**Third dispatch 2026-09-11:** the second Generator did steps 6–8 and stopped, correctly, at the last static sub-stage: `scripts/probe.js`
requires `@playwright/test` at the top of the file, and from the zk root Node cannot find it (installed under `zkpreview/node_modules`
only), so the usage exit 2 never happens. Step 9 added (two lines, hand-proven on a scratch copy: no-args exit 2 with the usage line).
Planner lesson: the dry-run stopped at the designed marker, so the later static stages were never exercised on a rewritten copy.
**Fourth dispatch 2026-09-11:** the third Generator applied step 9; `static` is green; `live` failed inside the verify script twice
over — it appended a second `--console=plain` to the command it reads from the copy (Gradle refuses duplicates), and its probe marker
carried hyphens, which ZK writes as `\-` in the page script. Both fixed and the whole `live` stage hand-run green (button.zul 200,
dropped-in page 200 with marker, unknown page 404, clean stop). The copy needs no change; this dispatch re-runs the two self-checks.

---

You are the GENERATOR for item 3.5 of the Marble → zk migration (P3). The `marble-theme` skill was copied into
`/Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/marble-theme/` byte-for-byte from the theme template (item 3.4). It still
describes the TEMPLATE: its paths, its Spring Boot preview app on port 8081, its Maven and npm commands. You make the copy true for zk.
Two kinds of change: (1) a mechanical path rewrite done by the Planner's tool — you run it, you do not do it by hand; (2) a content
rewrite of the host-specific sections, with the facts given below and nothing invented. A different agent verifies with
`bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.5.sh static` and then `… live`; run both yourself
as your self-check (the live one starts and stops the preview module; give it a 600000 ms timeout and run nothing else meanwhile).

If the copy is already rewritten from an earlier run of this brief, do not redo step 1 (the tool is one-pass but re-running it after
hand edits is pointless); compare the sections named in steps 2–9 against this brief and change only what differs. On this second dispatch the
sections of steps 2–8 are already in place: run the `static` self-check first, then do whatever step it still names (step 9 on the
third dispatch), then both self-checks.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly the 17 files under /Users/hawk/Documents/workspace/ZK10/zk/.claude/skills/marble-theme/ — nothing else in zk
  and NOTHING in the template's own `.claude/skills/marble-theme/` (the original must keep describing the template until P4).
- Edit only what this brief names. Do not restyle, reorder or "improve" other sections; do not add new sections beyond those named;
  do not delete a section unless told to. Keep the Markdown style of each page. English only.
- Never run `npx playwright`, Gradle or the preview server yourself except through the verify script.

READ (and nothing else): in the zk copy, `SKILL.md` (whole), `reference/verification.md` (whole), `reference/css-dsp.md` lines 108–120
(the "Version drift" section), `reference/css-audit.md` lines 40–50 and 88–95, `reference/important-reduction.md` lines 20–35 (the
script mentions). Total ≈ 50 KB.

FACTS about zk you may state (and only these):
- Marble is zk's core theme from ZK 11.0. Its CSS sources live in `zul/src/main/resources/web/zul/css/` (tokens/base/utility, CE) and
  `zul/src/main/resources/web/js/zul/<pkg>/css/` (per-component, CE); EE/PE component CSS lives in the sibling checkout
  `../zkcml/zkmax/src/main/resources/web/js/zkmax/<pkg>/css/`, `../zkcml/zkex/src/main/resources/web/js/zkex/<pkg>/css/` and the tablet
  partials in `../zkcml/zkmax/src/main/resources/web/zkmax/css/tablet/`. Build output: `zul/codegen/resources/web/` (CE) and
  `../zkcml/zkmax/codegen/resources/web/` / `../zkcml/zkex/codegen/resources/web/` (EE/PE).
- Build commands (from the zk root): `node scripts/build-css.js --module zul|zkmax|zkex` (the builder; `--module` required, exit 2 on a
  usage error), or the Gradle task it is wired into: `./gradlew :zul:compileMarbleCss` (and in `../zkcml`: `./gradlew :zkmax:compileMarbleCss`
  / `:zkex:compileMarbleCss`); it also runs inside every `./gradlew build`. Coverage check: `node scripts/check-css-dsp.js --module zul
  --zk-home /Users/hawk/Documents/workspace/ZK10` (also `zkmax`, `zkex`). There is no `npm run build:css`, `watch`, `lint:css`,
  `audit:css`, `check:forced-colors` or `check:doc-links` script in zk; the audit and `!important` tools are the skill's own four scripts,
  run from the zk root: `bash .claude/skills/marble-theme/scripts/audit-css.sh --out <file>`, `node .claude/skills/marble-theme/scripts/check-default-display.js --out <file>`,
  `node .claude/skills/marble-theme/scripts/count-important.js [<css root>]` (default root `zul/src/main/resources/web`; pass
  `../zkcml/zkmax/src/main/resources/web` for EE), `node .claude/skills/marble-theme/scripts/probe.js …` (needs the preview module up).
- Preview host: the `zkpreview/` module in zk (javax, Jetty via gretty, ZK from the composite build). Port **8085** (`zkpreview/build.gradle`,
  override with `-PhttpPort=<n>`). Start: `cd zkpreview && ./gradlew appRun -PhttpPort=8085 --console=plain` — the first start builds the
  composite (minutes), a warm start serves in about 10 s; `appRun` waits for a key on stdin and treats EOF as that key, so keep stdin open
  (interactive terminal, or a FIFO held open in scripts); **never `appStart`** — with gretty 3.1.1 under Gradle 8.10 its client never returns.
  Stop: press a key, or `./gradlew appStop` from `zkpreview/`. Base URL for the harness: `PREVIEW_URL=http://127.0.0.1:8085` (use
  `127.0.0.1`, not `localhost` — Chrome resolves `localhost` to IPv6 while Jetty binds IPv4). There is **no live-reload and no watcher**:
  after a CSS change, rebuild (`./gradlew :zul:compileMarbleCss`, or the zkcml task for EE) and restart `appRun`; the two live-reload
  `<script>` tags some preview pages still carry are inert.
- Pages: `http://127.0.0.1:8085/<page>.zul` — the module answers at the context root; a filter forwards `/<page>.zul` to `/web/<page>.zul`
  when the page exists, and `~./` class-web resources resolve unchanged. Sources: `zkpreview/src/main/webapp/web/*.zul` (159 pages, the
  UseCase SPA under `web/usecase/`, hash deep-links as before). Smoke page: `/smoke.zul`.
- How to tell the theme is served: Marble is the core theme, so the reset link has **no theme segment** — `/zkres/web/<v>/zul/css/reset.css`
  (or `reset-embed.css` when `org.zkoss.zul.theme.browserDefault=true`) — and it precedes `zk.wcs`. The harness's `screenshot.spec.ts`
  derives the theme prefix from that `reset.css` link. The IceBlue baseline app (template port 8082) has no zk counterpart until P4: in zk
  IceBlue is a separate theme jar and the cross-theme A/B needs it on `zkpreview`'s classpath, which is not configured.
- Playwright harness: `zkpreview/src/test/playwright/` (15 files, the template's specs unchanged apart from `WEB_DIR` and the theme-prefix
  lookup), `@playwright/test` pinned 1.59.1 in `zkpreview/package.json`; run from `zkpreview/`: `npx playwright test --config
  src/test/playwright/playwright.config.ts --project=<project>`. Baselines: `playwright.config.ts:13` says `snapshotDir: '../../../doc/screenshots'`, which from
  `zkpreview/src/test/playwright/` resolves to **`zkpreview/doc/screenshots/`** (the module's own `doc/`, beside `focus-ring-known-clips.json`) — that
  directory arrives with item 3.18b after the P2 gate; until then a run can only CREATE baselines, never compare. The oracle today: 183
  compared baselines + 99 `*-forced-colors.png` review captures (the 2026-09-11 re-cut).
- Zero-tolerance comparison (P2 items 2.6–2.8): the template's unchanged specs run against `zkpreview` and every PNG compared at
  `threshold: 0, maxDiffPixels: 0` with the tracked tools under `zkThemeTemplate/doc/migration/tools/zero-tolerance/`; the gallery (98), state (55)
  and tablet (30) families were byte-identical.
- Measurement rule (F57): geometry claims are read off the captured PNG, never the live DOM — `getBoundingClientRect` at `networkidle`
  runs before the gallery spec's font-settle wait and read 1 px wide on the splitter page while every shot showed the settled width.
- Stylesheet entry point in zk: `zul/css/zk.wcs` hard-wires **one** stylesheet, `norm.css.dsp`. IceBlue's `font-awesome.css.dsp` and the
  empty `zul/font/font-awesome.css.dsp` stub the template ships for it were removed in P1 (plan D39): in zk no icon-font CSS exists that
  Marble would have to suppress; Marble still draws its icons itself (`mask-image`, generated `.z-icon-*` rules from `lucide-static`).
- Throwaway probe pages: drop a `.zul` into `zkpreview/build/inplaceWebapp/` (gretty's in-place overlay, gitignored, served live while
  `appRun` is up) and fetch `http://127.0.0.1:8085/<name>.zul`; an unknown page answers 404.
- Version: zk has no theme-jar version coordination — Marble ships inside `zul` and `zkmax`/`zkex`; the template's four-location
  (`pom.xml` / `config.xml` / `package.json` / `Version.java`) drift check does not apply.

WRITE:
1. Path rewrite, one command (the tool substitutes the template's paths by the migration's map; it prints one line per changed file):
   cd /Users/hawk/Documents/workspace/ZK10/zk && node /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/apply-path-map.js --map /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/path-rewrite-map.md --fixes /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/stale-fixes.tsv -- $(git -C /Users/hawk/Documents/workspace/zkThemeTemplate ls-files .claude/skills/marble-theme | sed 's#^#/Users/hawk/Documents/workspace/ZK10/zk/#')
   Expected: about 10 files changed, about 29 substitutions.
2. `reference/verification.md` — rewrite these sections from the FACTS, keeping every heading name:
   - `## Ports`: one row — Marble preview via `zkpreview`, port 8085, entry `zkpreview/build.gradle` (`httpPort`); state that the IceBlue
     baseline app exists only in the template until P4; keep the `127.0.0.1`-not-`localhost` paragraph; drop the `application.properties`
     paragraph (Spring Boot) and replace it with one sentence on `-PhttpPort=`.
   - `## Launching`: the `appRun` command, the stdin / never-`appStart` rule, stop, warm-start time, the "how to tell the theme is served"
     paragraph rewritten for the no-theme-segment reset link, and a **"No live-reload"** paragraph replacing the `npm run watch` one.
   - `## Preview pages`: the URL shape at the context root, the forwarding filter in one sentence, the sources path, the SPA paragraph kept.
   - `## Playwright projects`: the `npm run screenshot:*` block becomes the `cd zkpreview && npx playwright test --config … --project=…` form.
   - `## Screenshot baselines — the parts that bite`: first bullet → the 183 + 99 figures, where the baselines live in zk and the 3.18b
     note; add one bullet on the zero-tolerance comparison (P2) as the equivalence check that was actually run.
   - `## Empiricism, not inference`: add the F57 measurement rule as its own bullet or paragraph.
   - `## Cross-theme A/B: the determinism floor`: add one opening sentence that the IceBlue app is template-only until P4; leave the
     measurements below it as they are (they are facts about Chromium, not the host).
3. `SKILL.md` — `## Where things live`: rewrite the tree for the zk layout (CE under `zul/src/main/resources/web/…`, EE/PE under
   `../zkcml/…`, output paths as in the FACTS); `## Commands`: replace the whole block with the zk commands from the FACTS (builder, Gradle
   task, coverage check, the four skill scripts, the preview start line with its stdin note). Everywhere else in SKILL.md touch nothing.
4. `reference/css-dsp.md` — replace the section `## Version drift silently un-themes the app` (its heading and the paragraph) with a
   heading `## Version drift (template-only)` and two sentences from the last FACT. Do not touch lines 14–16 (paths relative to `ZK10/`).
5. `reference/css-audit.md` and `reference/important-reduction.md` — where the scripts are introduced, add one sentence each stating the
   zk defaults (run from the zk root; `count-important.js` scans `zul/src/main/resources/web` unless a root is given; EE CSS is in `../zkcml`).
6. `reference/layers.md`, the paragraph "Marble is a *complete* CSS replacement: it ships an **empty** `zul/font/font-awesome.css.dsp` stub
   (`build-css.js` `stubPaths`) so ZK's own icon-font CSS never loads, and draws icons itself …": rewrite that one sentence from the
   zk.wcs FACT — in zk there is no icon-font CSS to suppress (removed in P1, D39); keep the rest of the paragraph (mask-image, lucide, the
   "no coexisting unreachable framework CSS" conclusion) as it is.
7. `reference/css-dsp.md`, the sentence "Plus two hard-wired in `zul/css/zk.wcs` (`font-awesome.css.dsp`, `norm.css.dsp`), and the entry
   point itself is fixed …": make it "Plus one hard-wired in `zul/css/zk.wcs` (`norm.css.dsp`), and the entry point …" — the table above it
   (lines 14–16) stays untouched.
8. `reference/zul-authoring.md`, the sentence "write a throwaway `.zul` into `zkpreview/build/webapp/` (gitignored, served live)": the
   directory is `zkpreview/build/inplaceWebapp/` (FACT above); keep the sentence shape — the verify script reads the directory out of it.
9. `scripts/probe.js` — directly ABOVE the line `const { chromium } = require('@playwright/test');` insert these two lines, verbatim:
   // zk: @playwright/test is installed under zkpreview/ only (P2 item 2.3); let Node resolve it from there.
   module.paths.push(require('path').resolve(__dirname, '../../../../zkpreview/node_modules'));
   Nothing else in the file changes. Check: `cd /Users/hawk/Documents/workspace/ZK10/zk && node .claude/skills/marble-theme/scripts/probe.js`
   prints the usage line and exits 2.

SELF-CHECK (report raw output): `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-3.5.sh static` (must end
`3.5 static ok …`), then `… live` (600000 ms; must end `3.5 live ok …`). `REVIEW` lines are informational; a `FAIL at:` line is not — paste it
into blockers and stop; do not edit the verify script, the tool, the map or the fixes table.
