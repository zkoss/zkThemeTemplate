import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  snapshotDir: '../../../doc/screenshots',
  snapshotPathTemplate: '{snapshotDir}/{testName}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:8080',
    ...devices['Desktop Chrome'],
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
