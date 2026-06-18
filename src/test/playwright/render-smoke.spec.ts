import { test, expect } from '@playwright/test';

// Render smoke test for the preview pages touched by the state-coverage gap-fill
// work (see doc/state-coverage-audit.md). xmllint only proves a .zul is
// well-formed XML — it does NOT catch ZK semantic errors such as an unsupported
// mold or an attribute with no setter, which surface only at compose time as an
// HTTP 500. This suite loads every changed page and asserts it actually compiles
// and renders.
//
// Requires the preview app running on http://localhost:8080
//   withjdk.sh 17 mvn test exec:java@preview-app

const PAGES = [
  '/notification.zul',
  '/caption.zul',
  '/goldenlayout.zul',
  '/hlayout.zul',
  '/organigram.zul',
  '/paging.zul',
  '/panel.zul',
  '/portallayout.zul',
  '/signature.zul',
  '/stepbar.zul',
  '/tbeditor.zul',
  '/tree.zul',
  '/vlayout.zul',
  '/inputgroup.zul',
];

test.describe('state-coverage render smoke', () => {
  for (const path of PAGES) {
    test(`renders ${path}`, async ({ page }) => {
      const resp = await page.goto(path, { waitUntil: 'networkidle' });

      // 1. The initial GET must not be a server error (an unsupported
      //    attribute/mold makes ZK return HTTP 500 here).
      expect(resp, `no response for ${path}`).toBeTruthy();
      expect(
        resp!.status(),
        `${path} returned HTTP ${resp!.status()} — page failed to compile`
      ).toBe(200);

      // 2. ZK must have actually composed the page (the .z-p-8 wrapper is the
      //    common root of every changed preview page). A blank/error body fails.
      await expect(
        page.locator('.z-p-8').first(),
        `${path} did not render the .z-p-8 page wrapper`
      ).toBeVisible();
    });
  }
});
