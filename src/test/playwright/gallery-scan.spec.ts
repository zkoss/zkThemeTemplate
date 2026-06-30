import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Scan-driven gallery coverage (test-architecture.md §6, roadmap step 2).
//
// This spec discovers preview pages by SCANNING src/test/resources/web/*.zul at
// collection time, so a NEW component page is covered by a baseline screenshot the
// moment it is added — no edit to this file required. That closes the silent-gap
// problem of the hand-maintained screenshot.spec.ts.
//
// Each covered page gets ONE gallery screenshot of its `.z-p-8` wrapper. Richer
// state matrices (hover/focus/active) and computed-style guards stay in
// screenshot.spec.ts; this spec is the breadth layer, that one is the depth layer.
//
// Requires the preview app on http://localhost:8080
//   withjdk.sh 17 mvn test exec:java@preview-app

const WEB_DIR = path.resolve(__dirname, '../resources/web');

// Pages with a bespoke gallery block already in screenshot.spec.ts — skip here to
// avoid duplicate baselines. Their depth coverage (states) lives there.
const COVERED_ELSEWHERE = new Set([
  'button', 'textbox', 'checkbox', 'combobox', 'listbox', 'grid', 'datebox',
  'timebox', 'spinner', 'bandbox', 'selectbox', 'tabbox', 'tree', 'window', 'panel', 'toast',
]);

// Pages a static gallery screenshot can't meaningfully or stably capture.
const SKIP = new Set([
  // Non-visual primitives / structural / meta pages
   'area', 'html', 'iframe', 'imagemap', 
  'scrollbar',  'overview', 'preview', 'inputs',
  // Non-deterministic / hardware / external-resource / animated → flaky baselines
  'camera', 'barcodescanner', 'captcha', 'video', 'audio', 'fileupload', 'loading', 'loadingbar'
]);

const pages = fs.readdirSync(WEB_DIR)
  .filter(f => f.endsWith('.zul'))
  .map(f => f.replace(/\.zul$/, ''))
  .filter(name => !COVERED_ELSEWHERE.has(name) && !SKIP.has(name))
  .sort();

test.describe('gallery', () => {
  for (const comp of pages) {
    test(comp, async ({ page }) => {
      await page.goto(`/${comp}.zul`, { waitUntil: 'networkidle' });
      const wrapper = page.locator('.z-p-8').first();
      // Every standard preview page renders the .z-p-8 wrapper; fail loudly if a
      // newly-added page uses a different shell so it gets an explicit decision
      // (add a wrapper, or add it to SKIP) rather than a silent body-sized shot.
      await expect(
        wrapper,
        `${comp}.zul has no .z-p-8 wrapper — give it one or add "${comp}" to SKIP in gallery-scan.spec.ts`
      ).toBeVisible();
      await expect(wrapper).toHaveScreenshot(`${comp}.png`, {
        animations: 'disabled',
        // small tolerance for sub-pixel AA differences across runs
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});
