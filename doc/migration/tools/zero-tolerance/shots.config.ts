// shots.config.ts — run the template's UNCHANGED spec files against any preview server and write the
// screenshots they take into $ZERO_SNAP (never into doc/screenshots); test output goes to $ZERO_OUT.
// This is how P2 items 2.6–2.8 obtain "the screenshots zkpreview produces" (execution plan D49):
//   cd <template> && ZERO_SNAP=<dir> ZERO_OUT=<dir> PREVIEW_URL=http://127.0.0.1:8085 \
//     npx playwright test --config doc/migration/tools/zero-tolerance/shots.config.ts \
//     --project=chromium --project=gallery --project=tablet
// Run from the template checkout so @playwright/test resolves from its node_modules.
import * as path from 'path';
import { defineConfig } from '@playwright/test';
import base from '../../../../src/test/playwright/playwright.config';

if (!process.env.ZERO_SNAP || !process.env.ZERO_OUT) throw new Error('ZERO_SNAP and ZERO_OUT are required');

export default defineConfig({
  ...base,
  testDir: path.resolve(__dirname, '../../../../src/test/playwright'),
  snapshotDir: process.env.ZERO_SNAP,
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  outputDir: process.env.ZERO_OUT,
  updateSnapshots: 'all',
  reporter: [['line'], ['json', { outputFile: path.join(process.env.ZERO_OUT, 'shots.json') }]],
});
