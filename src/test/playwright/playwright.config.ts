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
  // One folder per preview PAGE. Each spec passes its snapshot name as an ARRAY
  // — e.g. toHaveScreenshot([DIR, 'gallery.png']) — which Playwright path.join()s
  // into a real subdirectory for `{arg}` (a string name with a '/' is sanitised
  // to '-' instead). So baselines group by page, not by test name:
  // doc/screenshots/button/gallery.png, .../button/default-hover.png,
  // .../button/tablet.png. Desktop vs tablet no longer needs a `{projectName}`
  // segment or a `tablet-` folder prefix — they are disambiguated by the
  // filename (`gallery.png` vs `tablet.png`).
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
      name: 'reset',
      testMatch: /reset-scoping\.spec\.ts/,
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
