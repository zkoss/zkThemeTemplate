import { defineConfig, devices } from '@playwright/test';

// iPad Air portrait + a mobile (iPad) User-Agent. The mobile UA is essential:
// ZK's TabletThemeURIHandler only injects zkmax/css/tablet.css.dsp when the
// request UA is mobile, so the desktop `chromium` project never loads tablet CSS.
const IPAD_USER_AGENT =
  'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
  'Version/16.0 Mobile/15E148 Safari/604.1';

export default defineConfig({
  testDir: '.',
  snapshotDir: '../../../doc/screenshots',
  // FLAT layout: one file per (page, scenario) directly under doc/screenshots,
  // named `<page>-<scenario>.png` — no per-page subfolders. Each spec passes its
  // snapshot name as a single hyphenated STRING, e.g.
  // toHaveScreenshot(`${DIR}-gallery.png`), so `{arg}` resolves to a flat
  // filename: doc/screenshots/button-gallery.png, button-default-hover.png,
  // button-tablet.png. Desktop vs tablet are disambiguated by the filename
  // suffix (`-gallery.png` vs `-tablet.png`). The flat layout lets every shot be
  // browsed in one directory listing (see doc/forced-colors-review.html and
  // scripts/build-forced-colors-review.js).
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:8080',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'chromium',
      testMatch: /screenshot\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Scan-driven breadth layer: one gallery screenshot per visual preview page,
      // auto-discovered from src/test/resources/web/*.zul. See gallery-scan.spec.ts.
      name: 'gallery',
      testMatch: /gallery-scan\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'smoke',
      testMatch: /render-smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'framework',
      testMatch: /framework-classes\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Component Theme Variables knob-contract regression (--zk-<comp>-* overrides).
      name: 'component-theming',
      testMatch: /component-theming\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reset',
      testMatch: /reset-scoping\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Responsive display utilities: viewport @media (.z-d-*-{bp}) + container
      // queries (.z-container / .z-cq-*). See responsive-utilities.spec.ts.
      name: 'responsive',
      testMatch: /responsive-utilities\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Print stylesheet: opt-in .z-d-print-* visibility + standard reset
      // (elevation→border). page.emulateMedia({ media:'print' }) is applied in
      // the spec. See print-utilities.spec.ts and doc/spec/print-styles.md.
      name: 'print',
      testMatch: /print-utilities\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Stacking scale: --zk-index-* tokens + .z-index-* utilities resolve to
      // their values, and the token ladder's three hard constraints hold. See
      // zindex-scale.spec.ts and doc/spec/zindex-scale.md.
      name: 'zindex',
      testMatch: /zindex-scale\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Windows High-Contrast a11y regression for tokens/_forced-colors.css.
      // NOTE: the emulation is applied IN the spec via page.emulateMedia(
      // { forcedColors:'active' }) — the context-option form below does not take
      // effect for the page fixture in this runner, so the spec's beforeEach is
      // the source of truth. See forced-colors.spec.ts and doc/spec/forced-colors.md.
      name: 'forced-colors',
      testMatch: /forced-colors\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        forcedColors: 'active',
      },
    },
    {
      // Forced-colors VISUAL review pass — one screenshot per page under WHCM
      // emulation, written directly (not toHaveScreenshot baselines). Feeds
      // doc/forced-colors-review.html. Like the `forced-colors` project, the
      // emulation is really applied in the spec's beforeEach via
      // page.emulateMedia() — the use option below does not take effect for the
      // page fixture in this runner. See forced-colors-gallery.spec.ts.
      name: 'forced-colors-gallery',
      testMatch: /forced-colors-gallery\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        forcedColors: 'active',
      },
    },
    {
      name: 'tablet',
      testMatch: /tablet\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 834, height: 1112 },
        userAgent: IPAD_USER_AGENT,
        // ZK sets zk.mobile from the UA server-side and enables the (otherwise
        // disabled) tablet stylesheet client-side on DOMContentLoaded. hasTouch
        // makes the emulation a faithful tablet so touch code paths run too.
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
