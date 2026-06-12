import { test, expect, Page } from '@playwright/test';

// Runs under the `tablet` Playwright project (iPad viewport + mobile UA). ZK
// delivers zkmax/css/tablet.css.dsp as a DISABLED <link> and sets zk.mobile
// from the UA; its client runtime enables the link on DOMContentLoaded when
// zk.mobile is true. So on a mobile UA the tablet stylesheet applies; on a
// desktop UA it stays disabled (see the tablet-isolation guard in
// screenshot.spec.ts). Three assertion kinds:
//   1. the tablet stylesheet is actually enabled/loaded,
//   2. key controls meet the MD3 touch target (>= 44px),
//   3. visual baselines at tablet size.
// Describe names are `tablet-…` so screenshot baselines land at distinct paths
// (doc/screenshots/tablet-<comp>/…) and never collide with the desktop suite —
// the snapshot path template has no {projectName} segment.

const MD3_MIN_TOUCH = 44;

async function tabletCssLoaded(page: Page): Promise<boolean> {
  // ZK enables the disabled <link> on DOMContentLoaded; once enabled the sheet
  // is fetched and appears in document.styleSheets.
  return page.evaluate(() =>
    [...document.styleSheets]
      .map(s => s.href || '')
      .some(h => h.includes('zkmax/css/tablet.css')));
}

async function heightOf(page: Page, selector: string): Promise<number> {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible' });
  return el.evaluate(n => parseFloat(getComputedStyle(n).height));
}

// -------------------------------------------------------
// Stylesheet enabling — the foundation of every other assertion
// -------------------------------------------------------
test.describe('tablet-stylesheet', () => {
  test('tablet.css is enabled on a mobile UA', async ({ page }) => {
    await page.goto('/button.zul');
    await page.waitForLoadState('networkidle');
    expect(await tabletCssLoaded(page)).toBe(true);
  });
});

// -------------------------------------------------------
// Touch sizing — computed heights meet the MD3 minimum
// -------------------------------------------------------
type SizeCase = { name: string; url: string; selector: string };

const sizeCases: SizeCase[] = [
  { name: 'button',   url: '/button.zul',   selector: '.z-button' },
  { name: 'textbox',  url: '/textbox.zul',  selector: '.z-textbox' },
  { name: 'combobox', url: '/combobox.zul', selector: '.z-combobox-input' },
  { name: 'datebox',  url: '/datebox.zul',  selector: '.z-datebox-input' },
];

test.describe('tablet-touch-size', () => {
  for (const { name, url, selector } of sizeCases) {
    test(`${name} meets MD3 minimum touch target`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      expect(await tabletCssLoaded(page)).toBe(true);
      expect(await heightOf(page, selector)).toBeGreaterThanOrEqual(MD3_MIN_TOUCH);
    });
  }
});

// -------------------------------------------------------
// Visual baselines at tablet size — capture the page wrapper (.z-p-8)
// -------------------------------------------------------
type VisualCase = { name: string; url: string };

const visualCases: VisualCase[] = [
  { name: 'tablet-button',   url: '/button.zul' },
  { name: 'tablet-combobox', url: '/combobox.zul' },
  { name: 'tablet-listbox',  url: '/listbox.zul' },
  { name: 'tablet-checkbox', url: '/checkbox.zul' },
];

for (const { name, url } of visualCases) {
  test.describe(name, () => {
    test('gallery', async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
    });
  });
}
