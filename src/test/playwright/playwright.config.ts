import { defineConfig, devices } from '@playwright/test';

// Visual A/B harness — see doc/visual-ab-harness.md.
//
// This config exists ONLY to drive scripts/ab-visual.js's capture pass. It is not a
// regression suite: there are no committed baselines, because both A/B sides are two
// builds of THIS branch. The comparison happens in ab-visual.js, not here.
//
// Do not run this config directly — `node scripts/ab-visual.js capture <label>` sets the
// AB_* env vars it needs and starts/stops the preview app around it.
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  workers: 4,
  // retries would MASK flakiness, and flakiness is exactly the signal the selftest looks
  // for. A page that fails simply produces no PNG, which `diff` then reports as `missing`.
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    // 127.0.0.1, not localhost: Chrome resolves localhost to IPv6 while the app binds IPv4.
    baseURL: process.env.AB_BASE_URL ?? 'http://127.0.0.1:8081',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 900 },
    launchOptions: {
      // Rasterisation determinism ACROSS browser processes. Without these, two captures of
      // byte-identical theme output differed by 2–28 isolated pixels on 5 of 108 pages —
      // subpixel text AA and font hinting varying per process, not content.
      //
      // The alternative was a diff tolerance, which was rejected: a 1px border change on a
      // 200px-wide widget is ~200px ≈ 0.017% of a 1280x900 shot, so any ratio threshold
      // loose enough to absorb AA noise is also loose enough to swallow a real small change.
      // Removing the nondeterminism keeps the comparison EXACT (sha256 per page).
      // Font rasterisation only. `--deterministic-mode` was tried and REMOVED: it forces
      // single-threaded compositing, which made page loads erratic — a random 4 pages per
      // run stopped reaching a stable frame at all, and the run took 4x as long.
      args: [
        '--disable-lcd-text', // no subpixel AA — the main per-process variable
        '--disable-font-subpixel-positioning',
        '--font-render-hinting=none',
        '--force-color-profile=srgb',
      ],
    },
  },
  projects: [
    {
      name: 'ab-capture',
      testMatch: /ab-(capture|popup)\.spec\.ts/,
    },
    {
      // The desktop project can never see zkmax/css/tablet.css.dsp: ZK links it but leaves it
      // `disabled`, and only flips it on when `zk.mobile` is true (zk/index.ts — the server
      // sets zk.mobile from the request UA; TabletThemeURIHandler injects the link at all).
      // visual-ab-harness.md §6.1 measured exactly that: HTTP 200, 26145 B, never painted.
      // So a desktop-only A/B reports a GUARANTEED zero for that file, which is not evidence.
      //
      // Geometry and UA are Marble's tablet project verbatim (zkThemeTemplate's
      // playwright.config.ts) rather than a fresh guess, so shots taken here are comparable
      // with the ones Marble already reviews. hasTouch/isMobile make the emulation faithful
      // enough that ZK's touch code paths run too, which is what the tablet layer compensates.
      name: 'ab-capture-mobile',
      testMatch: /ab-(capture|popup)\.spec\.ts/,
      use: {
        viewport: { width: 834, height: 1112 },
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
          'Version/16.0 Mobile/15E148 Safari/604.1',
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
});
