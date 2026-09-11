// Row 3.20 probe config — run from zk/zkpreview so `@playwright/test` (1.59.1) resolves:
//   cd zk/zkpreview && npx playwright test --config <this file> --reporter=list
// Deliberately separate from zkpreview's own harness: the harness is a byte-for-byte copy of the template's (verify-2.3.sh),
// so no probe may be added to it. No snapshots, no retries — the probe reads computed styles, which are deterministic.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PREVIEW_URL ?? 'http://127.0.0.1:8085',
  },
});
