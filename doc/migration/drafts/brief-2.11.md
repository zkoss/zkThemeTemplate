# Generator brief — item 2.11, the skeleton stylesheet (P1 regression in zkcml, F62 / chat D70 A)

Status: written 2026-09-11. The text below the rule is embedded verbatim in `marble-p2-verify.js` as the Generator
prompt; `{ROW}` is replaced by row 2.11 of the execution plan and the HARD RULES block is the script's shared
`COMMON_RULES`. The Planner hand-ran the exact three changes below as a throw-away before dispatch (rule 2; timings in
the plan row). Background: ZK-6099 (2026-08-26) added the PE skeleton feature with a **global**
`<stylesheet href="~./js/zkex/wgt/css/skeleton.css.dsp"/>` in zkex's `lang-addon.xml` and an 85-line `skeleton.less`;
P1's zkcml commit `eea2b6428` deleted every LESS file, skeleton's included, without a Marble replacement — the template
never styled skeleton — and `check-css-dsp.js` verifies only `<css-uri>` entries (plus zul's global bundles), so the
dangling reference passed the build. Every zktest page has logged a 404 for it since, and every `assertNoAnyError()`
test is red. Token mapping is the Planner's judgement: `@colorGreyLighter` → `--zk-color-surface-variant` (#f0f4fa, the
Marble "variant surface" grey), `@baseBorderRadius` → `--zk-shape-corner-extra-small` (4px, inputs/chips).

---

You are the GENERATOR for item 2.11 of the Marble → zk migration (P2). You restore the stylesheet of ZK's PE skeleton feature (`setSkeleton("rect"|"circle"|"text")` on any component) as a Marble CSS source in `zkcml`, and you close the gap in `zk`'s CSS build scripts that let its reference dangle: `build-css.js` must accept the file (its orphan guard only knows `<css-uri>`-backed names) and `check-css-dsp.js` must from now on verify global `<stylesheet href="…css.dsp">` declarations too. Three changes, given verbatim below. A different agent verifies with `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.11.sh static` and then `… live`; run both yourself as your self-check.

If the changes already exist from an earlier run of this brief, do not redo them: compare each against this brief and change only what differs.

ITEM ROW (verbatim from /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/marble-to-zk-execution-plan.md):
{ROW}

{COMMON_RULES}
- This item owns exactly three files: the NEW /Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web/js/zkex/wgt/css/skeleton.css; THREE added lines in /Users/hawk/Documents/workspace/ZK10/zk/scripts/build-css.js; EIGHT added lines in /Users/hawk/Documents/workspace/ZK10/zk/scripts/check-css-dsp.js. Nothing else — not `lang-addon.xml` (its `<stylesheet>` line is correct and stays), no `.ts`, no test, nothing under `zul/`, `zktest/` or `zkpreview/`, nothing in the template. Both repositories carry other people's uncommitted files (`zk`: `.gitignore`, `lang-addon.xsd`, `logs/`, `tasks/`; `zkcml`: `.gitignore`, `lib/spel2js/package-lock.json`, `zk85themebuilder/`): do not touch, stage or revert them.
- Do not "improve" the CSS: it is a port of the retired LESS, rule for rule, with the five `--zk-skeleton-*` override properties app authors were given. Do not run Gradle by hand; the verify script runs the three zktest classes itself.

READ (and nothing else): /Users/hawk/Documents/workspace/ZK10/zk/scripts/build-css.js lines 296–333 (the `CSS_URI_BACKED` set) and 618–650 (`assertNoOrphanComponentCss`); /Users/hawk/Documents/workspace/ZK10/zk/scripts/check-css-dsp.js lines 118–152 (`extractRequired`); /Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/metainfo/zk/lang-addon.xml line 31; /Users/hawk/Documents/workspace/ZK10/zk/zul/src/main/resources/web/js/zul/wgt/css/progressmeter.css (a Marble component file with `@keyframes` inside its `@layer` block — the shape to follow).

WRITE:

1. `/Users/hawk/Documents/workspace/ZK10/zkcml/zkex/src/main/resources/web/js/zkex/wgt/css/skeleton.css` — new (`mkdir -p` the `css` directory), four-space indentation like the other Marble files, exactly this content:
   ```
   /* Skeleton — the loading placeholder any component can show through setSkeleton("rect" | "circle" | "text")
      (ZK-6099, PE). DOM (from wgt/skeleton.ts):
        <div class="z-… z-skeleton-active z-skeleton-rect" aria-busy="true">…</div>        ← ordinary element:
             descendants hidden, the element's own text node masked by the grey ::after overlay
        <img class="z-image z-skeleton-masked"> + <div class="z-skeleton-overlay z-skeleton-circle">  ← replaced/void
             root: the skeleton module lays a real overlay element over it and sizes it from JS
      Ported from the retired wgt/less/skeleton.less (ZK-6112, item 2.11): the two theme values became Marble
      tokens; duration, text radius and minimum opacity stay literal. App authors can still override every value
      through the --zk-skeleton-* custom properties, as before. */

   @layer zk-components {
   /* ─── Placeholder fill (shared by the in-place ::after overlay and the JS-laid overlay div) ── */
   .z-skeleton-active,
   .z-skeleton-overlay {
       background: var(--zk-skeleton-background, var(--zk-color-surface-variant));
       animation: z-skeleton-pulse var(--zk-skeleton-duration, 1.5s) ease-in-out infinite;
   }

   /* ─── Shapes ───────────────────────────────────────────────────────────── */
   .z-skeleton-active.z-skeleton-rect,
   .z-skeleton-overlay.z-skeleton-rect {
       border-radius: var(--zk-skeleton-radius, var(--zk-shape-corner-extra-small));
   }
   .z-skeleton-active.z-skeleton-circle,
   .z-skeleton-overlay.z-skeleton-circle {
       border-radius: 50%;
   }
   .z-skeleton-active.z-skeleton-text,
   .z-skeleton-overlay.z-skeleton-text {
       border-radius: var(--zk-skeleton-text-radius, 2px);
   }

   /* ─── Ordinary element ─────────────────────────────────────────────────── */
   .z-skeleton-active {
       position: relative;
       overflow: hidden;
   }
   /* Hide descendant elements (grid cells, a button's icon, …). `*` matches elements only, so on its
      own it cannot reach the element's OWN direct text node (Label renders <span>text</span>, Button
      <button>label</button>) — the ::after overlay below masks those. */
   .z-skeleton-active * {
       visibility: hidden !important;
   }
   /* Opaque overlay painted by the element itself: the pseudo element renders above the element's
      text node and children, so the grey block fully masks them. content must be '' (an empty box
      that paints), not none. */
   .z-skeleton-active::after {
       content: '' !important;
       position: absolute;
       inset: 0;
       background: var(--zk-skeleton-background, var(--zk-color-surface-variant));
   }
   .z-skeleton-active::before {
       content: none !important;
   }

   /* ─── Replaced / void root ─────────────────────────────────────────────── */
   /* The overlay sits ABOVE the replaced root as a separate element, so when the pulse lowers its
      opacity the root's own painted content (bitmap, sub-document, input value) would bleed through.
      The skeleton module adds this class to every root it overlays; visibility:hidden keeps the box
      in layout (the overlay stays aligned) and is honoured in every browser. */
   .z-skeleton-masked {
       visibility: hidden !important;
   }

   @keyframes z-skeleton-pulse {
       0%, 100% { opacity: 1; }
       50%      { opacity: var(--zk-skeleton-min-opacity, 0.4); }
   }

   /* WCAG 2.3.3 / SC 2.2.2: respect users who request reduced motion. */
   @media (prefers-reduced-motion: reduce) {
       .z-skeleton-active,
       .z-skeleton-overlay { animation: none; }
   }
   }
   ```

2. `/Users/hawk/Documents/workspace/ZK10/zk/scripts/build-css.js` — inside the `CSS_URI_BACKED` set, directly after the line `    'rangeslider.css.dsp', 'sliderbuttons.css.dsp',` (the last zkex entry), insert exactly these three lines (four-space indentation):
   ```
       // skeleton.css.dsp is requested by a GLOBAL <stylesheet href> in zkex's lang-addon.xml (ZK-6099), not
       // by a css-uri; the LESS retirement dropped its source unnoticed (ZK-6112, F62) — hence this entry.
       'skeleton.css.dsp',
   ```
   Nothing else in the file; `git diff --numstat` on it must print `3	0`.

3. `/Users/hawk/Documents/workspace/ZK10/zk/scripts/check-css-dsp.js` — inside `extractRequired`, directly after the closing `}` of the `while ((lu = langUriRe.exec(remainder)))` loop and before `    return out;`, insert exactly these eight lines (four-space indentation):
   ```
       // Global <stylesheet href="~./…css.dsp"> declared at language level (outside any component):
       // ZK links it on every page, so it must exist too — zkex's skeleton.css.dsp dangled this way
       // after the LESS retirement (ZK-6112, F62).
       const sheetRe = /<stylesheet\b[^>]*\bhref="([^"]+\.css\.dsp)"[^>]*\/?>/g;
       let sh;
       while ((sh = sheetRe.exec(remainder))) {
           out.push({ cssuri: sh[1].trim(), pkg: undefined, comp: '(global <stylesheet>)', langFile, resolved: resolveCssUri(sh[1], undefined) });
       }
   ```
   Nothing else in the file; `git diff --numstat` on it must print `8	0`. (`zk.wcs` in zul's lang.xml is not a `.css.dsp`, so the regex leaves zul's report unchanged.)

SELF-CHECK (report raw output): `cd /Users/hawk/Documents/workspace/ZK10/zk && git status --short && git diff --numstat -- scripts`; `cd /Users/hawk/Documents/workspace/ZK10/zkcml && git status --short`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.11.sh static`; then `bash /Users/hawk/Documents/workspace/zkThemeTemplate/doc/migration/tools/verify-2.11.sh live` (600000 ms timeout: it runs `build-css.js --module zkex`, `check-css-dsp.js --module zkex` twice — once for real, once against a copy of the build output with the skeleton file removed, which must now FAIL with that name — and then three zktest classes through Gradle; the Planner's warm run took the time recorded in the plan row). If `live` fails, paste the `FAIL at:` line and the last 30 lines of its output into blockers and stop — do not edit `lang-addon.xml`, do not add a stub, do not change any test, do not retry.
