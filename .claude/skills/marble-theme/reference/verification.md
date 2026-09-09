# Verification: preview app, ports, screenshots

## Ports

| App | Port | Entry point |
|---|---|---|
| **Marble preview** | **8081** | `src/test/java/zk/example/ThemePreviewApp.java` |
| **IceBlue baseline** | **8082** | `src/test/java/zk/example/iceblue/ThemePreviewIceblueApp.java` |
| Live-reload client | 50000 | started by `npm run watch` |

Both run simultaneously, which is what makes the cross-theme side-by-side comparison work.
`playwright.config.ts` uses `baseURL: process.env.PREVIEW_URL ?? 'http://localhost:8081'`.

**Use `127.0.0.1`, not `localhost`.** Chrome resolves `localhost` to IPv6 `::1` while the preview
app binds IPv4. CLAUDE.md documents the base as `${PREVIEW_URL}` = `http://127.0.0.1:8081` rather
than hardcoding a port, so set `export PREVIEW_URL=http://127.0.0.1:8081` or paste the address.

**The port lives in each `main()`, deliberately — do not move it to
`application.properties`.** That file is on the *shared* test classpath, so a `server.port` there
would also be inherited by the IceBlue app, and because `application.properties` out-ranks
`setDefaultProperties` it would silently override that app's own declaration. `setDefaultProperties`
is Spring Boot's lowest-precedence source, so `-Dserver.port=…` still overrides it either way.

## Launching

```bash
withjdk.sh 17 mvn test exec:java@preview-app
```

**Chain `withjdk.sh 17` on one line.** The preview app is Spring Boot 3.2.6 and needs JDK 17; this
machine defaults to 11, and a bare `setjdk` does not outlive the call. Expect
`Tomcat started on port 8081 (http)`.

The IceBlue baseline needs **both** flags or `:8082` silently serves Marble:

```bash
withjdk.sh 17 mvn exec:java@preview-app-iceblue \
  -Dspring.profiles.active=iceblue -Dorg.zkoss.theme.preferred=iceblue
```

**How to tell which theme is actually being served:** read the theme stylesheet href in the served
HTML. Marble → `/zkau/web/<v>/marble/zul/css/reset.css` (note the `marble` segment); stock IceBlue
→ `/zkau/web/<v>/zul/css/reset.css`, with no theme segment.

`npm run watch` starts automatically via Maven's `process-resources` phase. It rebuilds theme CSS
and hot-swaps without a reload; ZUL/JS/image changes reload the page.

## Preview pages

`http://127.0.0.1:8081/{component}.zul` — the `.zul` extension is required, since the catch-all is
restricted to `*.zul` so it does not intercept static resources. Sources live in
`src/test/resources/web/*.zul`.

The **UseCase SPA** supports hash deep-links: `usecase/index.zul#<bookmark>`, where the bookmark is
the target ZUL's path relative to the web root minus `.zul` (`usecase/ops-dashboard`, or just
`button` for a root-level preview page). The `<navitem>` entries in `usecase/index.zul` are the
source of truth for what exists — consult them rather than any hardcoded list. `UseCaseVM.java`
handles `@Init` restore, the `navigate` command and `handleBookmarkChange` for back/forward.

Because deep-linking is **hash**-based, it survives a server-side redirect — a fragment never
reaches the server. Nothing in the harness uses a query string.

## Playwright projects

Config: `src/test/playwright/playwright.config.ts`.

| Project | Covers |
|---|---|
| `chromium` | general specs |
| `gallery` | full-page component galleries — the bulk of the baselines |
| `smoke` | every preview ZUL renders (xmllint passing is **not** proof it renders) |
| `framework` | framework-class compliance |
| `component-theming` | the 19 per-component knob tests |
| `reset` | reset scoping |
| `hit-target` | minimum touch-target sizes |
| `responsive` | breakpoint behaviour |
| `print` | print stylesheet |
| `zindex` | the three z-index constraints |
| `focus-scan` | focus-ring visibility and clipping |
| `forced-colors`, `forced-colors-gallery` | Windows High-Contrast guards |
| `tablet` | needs a mobile UA to trigger `tablet.css.dsp` injection |

```bash
npm run screenshot:test              # whole suite
npm run screenshot:update            # re-cut baselines
npx playwright test --config src/test/playwright/playwright.config.ts --project=gallery
```

## Screenshot baselines — the parts that bite

- **`doc/screenshots/` holds 199 compared baselines plus 100 `*-forced-colors.png`.** The
  forced-colors images are **human-review artifacts that are always dirty** and never compared.
  Never quote "299 baselines" as a cost.
- **Always `await document.fonts.ready`.** A uniform vertical drift across every page is the Inter
  font-load race, not a CSS change. Baselines are flat files in one directory, not nested.
- **Tolerance is not one number.** `gallery-scan.spec.ts` allows `maxDiffPixelRatio: 0.01` —
  thousands of pixels on a full page — and `tablet.spec.ts` opts into 2%. That is a *regression*
  gate. An equivalence check (did a refactor or a move change anything?) needs a one-off
  **zero-tolerance** run with every diff explained.
- **`git log -1 -- <png>` lies when a commit only renamed the file.** Do not date a baseline that
  way.
- **The UseCase SPA hangs on `networkidle`.** Use `domcontentloaded`, then wait on a text marker,
  then `fonts.ready`, with a tall viewport.
- **The pop-up layer needs interaction** or roughly 180 selectors are never painted. Cursor
  position is the dominant noise source in pop-up A/B captures.
- **A placeholder PNG means the browser session desynced** — reset it rather than re-running.

## Empiricism, not inference

Before writing a width or layout claim into a contract, or designing a RED→GREEN geometry test,
**measure the live rendered value** with a 10-line `page.evaluate` over `getBoundingClientRect` /
`scrollWidth` / `clientWidth` / `getComputedStyle`. Reasoning from the CSS cascade plus widget
source predicts the wrong number: flex intrinsic sizing (`flex:1 1 0%` in a shrink-wrapped
container) does **not** fall back to the UA `size=20`.

**A test that goes green on the unfixed build proves the premise was wrong, not that the code is
fine.** And prefer a *behavioural* assertion (a longer value renders wider; `scrollWidth <=
clientWidth`) over an arbitrary px threshold — the threshold can be satisfied by the very bug you
are trying to catch.

Also: disable transitions before measuring focus rings, and never open `/preview` in the
Chrome automation session.

## The tablet stylesheet is gated client-side, not by server UA

Traced empirically (an earlier note wrongly said the server checks the UA):

1. `org.zkoss.zkmax.theme.TabletThemeURIHandler` inserts `~./zkmax/css/tablet.css.dsp` at cascade
   position 1 (right after `zk.wcs`) on **every** request, shipped as a **`disabled`** `<link>`.
   Gated only by the library property `org.zkoss.zkmax.tablet.ui.disabled` (default enabled).
2. The ZK client runtime sets `zk.tabletUIEnabled = … && !!zk.mobile` and, on `DOMContentLoaded`,
   **enables** that link only when `zk.mobile` is truthy. `zk.mobile` comes from the request UA
   (iPad / iPhone / Android).

Consequences: a desktop UA leaves the link disabled — it is not even in `document.styleSheets`,
so **tablet CSS can never leak to desktop by construction**. `zk.wcs` (~1.6 MB, the whole theme)
sits at position 0 and `tablet.css.dsp` at position 1, so tablet rules win by source order with
no `!important`; size variants such as `.z-button-sm.z-button` keep their size by specificity.
Marble is already wired: `MarbleThemeWebAppInit` registers `tablet:marble` (EE only) and the build
emits the file. Detect in-page with
`[...document.styleSheets].some(s => s.href?.includes('zkmax/css/tablet.css'))`.

## Playwright, not Selenium or ZK WebDriver

For CSS/theme design regression the project uses Playwright and nothing else. ZK WebDriver is a
ZK-aware wrapper around Selenium built for **functional** widget / AU testing; for static CSS it
adds nothing (you assert on stable `.z-*` selectors with no server round-trip) and would bolt a
Gradle/JUnit stack onto a Maven project. Playwright wins on built-in screenshot diffing, auto-wait,
and one-line device emulation — the last is essential because the tablet stylesheet only loads
under a mobile UA. Reach for ZK WebDriver only for a genuinely functional end-to-end need.

The Playwright suite is the regression guard; the agent harness (evaluator computed-style checks
plus visual review, dual-gate VERIFIED per `doc/verification-harness-decisions.md`) is the
authoring-time deep verification. They are complements.

## Flaky galleries, and how to prove neutrality without them

The `listbox`, `tree`, `window`, `panel`, `tabbox` and `toast` galleries hit `toHaveScreenshot`'s
5-second stabilisation timeout on those heavy pages even when run alone. **Do not read their
failures as regressions.** Confirm rendering-neutrality with a HEAD-versus-change A/B plus
deterministic computed-style probes instead. A stale-baseline failure looks identical at HEAD with
no change applied — check that before trusting the gate. Run ad-hoc probes with
`NODE_PATH="$(pwd)/node_modules" node script.cjs` using `require('playwright')`.

## Cross-theme A/B: the determinism floor

Serving Marble's preview corpus under a different theme jar needs no edit here: ZK's
`Library.getProperty` falls back to `System.getProperty`, and the IceBlue baseline app leaves the
preferred theme unset, so `-Dorg.zkoss.theme.preferred=<theme>` on the command line selects it.
**Exclude `MARBLE/target/classes` from that classpath** — `MarbleThemeWebAppInit` locks its own
provider with `setCustomThemeProvider(true)`, and that provider returns null for
`font-awesome.css.dsp`, so the other theme's icons silently never load.

**Always guard-probe before trusting a run:** assert the theme segment is in the CSS URL, the
*other* theme's name appears zero times, **and the page parsed >0 CSS rules and >0 `--zk-*`
declarations**. Name checks alone pass on a page with no styles at all, because the theme name
comes from the registered Java class, not from any CSS existing. A harness whose theme never
loaded reports a perfect zero diff. `zk.wcs` is **empty on a second request**, and `body`'s font
is `Times` even on a healthy page — neither is a usable signal; read `document.styleSheets` in-page.

Measured over 116 pages, repeatedly: **byte-identical PNGs across browser processes are not
achievable.** A few pages differ by 2–42 px on border-radius arcs, by up to ±7 per channel, scaling
with the contrast of the blended colours. No Chromium flag removes it, and `--deterministic-mode`
is actively harmful. Within one process it is stable, so shoot-until-two-stable-frames converges.
The comparator's floor is therefore **`maxDelta ≤ 8` and `diffPixels ≤ 64`, not a ratio** — a 1px
border on a 200px widget is ~0.017% of a 1280×900 shot, so any ratio loose enough to absorb the
noise also absorbs a real border change. IceBlue ships 5 animated GIFs that no
`animations: 'disabled'` freezes; `page.route(...).abort()` them.

## Pop-up layer captures — the lessons that generalise

A goto-and-shoot capture never paints anything that only exists when a panel is *open* — roughly
180 selectors in the theme. Opening them by widget API taught these:

- **The cursor is the dominant noise source, and there is no general rule.** Three failures were
  all cursor position, in opposite directions: an overflow panel opening *under* the parked
  cursor (a button inside came out hovered), and a plain `<popup>` that is pointer-positioned and
  reads the pointer late, so parking raced its positioning. Default: park after the trigger;
  `holdCursor` per measured exception.
- **`locator(sel).first()` resolves to a hidden pre-rendered panel** — pages render one per widget
  (timepicker has 15). Require **exactly one visible match**, and make that function both the
  wait condition and the clip.
- **Picking a widget by DOM index is wrong** once disabled instances are filtered out; pick by a
  predicate over the widget.
- Per-widget open APIs differ and are measured, not documented: Combobox / Bandbox `open()`;
  Datebox `setOpen(true)`; Colorbox `openPopup()`; Chosenbox `open()` throws unless focused;
  Nav `setOpen(true)` expands *inline*; **Timebox has no desktop open API at all**.
- Some "pop-up" classes are modifiers on the **head** element and render at rest —
  `.z-columns-menupopup` pads the header for the caret. Check where the class actually lands
  before filing a gap as a pop-up gap.
- **Searching the wrong jar exhaustively still returns zero.** `.z-portallayout-popup*` is drawn
  by the optional `za11y` language addon, not by `zkmax`; every "no code creates this" measurement
  was correct and searched the wrong bundle. Before calling CSS dead, ask which classpath the
  claim was made on.
- A per-process constant cannot be waited out. When a shot is bistable *across* browser processes
  but stable within one, launch 8–10 independent processes and count distinct PNGs; a single run
  is a coin toss. **Keep the differing artefact on the first failure** — the next run destroys it.

## Cleaning up a probe

Never `git checkout` a spec file to remove a probe you appended. The spec usually already holds
new, uncommitted real tests, and `checkout` reverts the whole file. Remove only the probe block,
or put probes in a throwaway file from the start.

## Theme-done criterion

The theme is complete only when **every preview page** under `src/test/resources/web/*.zul` is
verified. The page set, not the component list, is the checklist — see
`reference/zul-authoring.md` for why.
