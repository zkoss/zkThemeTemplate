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
  // No {projectName} segment — tablet specs use `tablet-` prefixed describe
  // names so their baselines never collide with the desktop baselines.
  snapshotPathTemplate: '{snapshotDir}/{testName}/{arg}{ext}',
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
