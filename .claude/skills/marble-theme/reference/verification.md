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
