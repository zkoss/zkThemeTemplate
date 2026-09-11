// compare.config.ts — zero-tolerance comparison of every PNG in $ZERO_SNAP against the same-named
// baseline in $ZERO_BASE, through Playwright's own comparator (threshold 0, maxDiffPixels 0).
// updateSnapshots is 'none' so a missing baseline is reported, never written. Output → $ZERO_OUT
// (compare.json plus <name>-actual/-expected/-diff.png for every difference).
//   cd <template> && ZERO_SNAP=<dir> ZERO_BASE=doc/screenshots ZERO_OUT=<dir> \
//     npx playwright test --config doc/migration/tools/zero-tolerance/compare.config.ts
import * as path from 'path';
import { defineConfig } from '@playwright/test';
if (!process.env.ZERO_SNAP || !process.env.ZERO_BASE || !process.env.ZERO_OUT) throw new Error('ZERO_SNAP, ZERO_BASE, ZERO_OUT are required');
export default defineConfig({
  testDir: __dirname,
  testMatch: /compare\.spec\.ts/,
  snapshotDir: path.resolve(process.env.ZERO_BASE),
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  outputDir: process.env.ZERO_OUT,
  updateSnapshots: 'none',
  workers: 4,
  reporter: [['line'], ['json', { outputFile: path.join(process.env.ZERO_OUT, 'compare.json') }]],
});
