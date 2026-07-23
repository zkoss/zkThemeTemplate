import { test, expect, Page } from '@playwright/test';

// Regression for the responsive display utilities added to
// src/main/resources/web/zul/css/utility/_layout.css and demoed on
// src/test/resources/web/utility/responsive.zul:
//   (a) viewport visibility  .z-d-{value}-{bp}   (mobile-first / min-width @media)
//   (b) container queries     .z-container + .z-cq-{value}-{bp}   (@container)
// MUI breakpoints: sm 600, md 900, lg 1200, xl 1536.
//
// Elements are located by their exact utility-class combination (unique on the
// page) rather than by text, so the assertions pin the CSS behaviour directly.

const URL = '/utility/responsive.zul';

async function open(page: Page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // ZK renders the div tree into the initial response; wait for the query
  // containers to exist before measuring.
  await page.locator('.z-container').first().waitFor({ state: 'attached' });
}

async function display(page: Page, selector: string, nth = 0): Promise<string> {
  return page.locator(selector).nth(nth)
    .evaluate(n => getComputedStyle(n).display);
}

// -------------------------------------------------------
// (a) Viewport visibility — display flips as the window crosses each breakpoint
// -------------------------------------------------------
test.describe('viewport-visibility', () => {
  test('chips appear/disappear at their breakpoint', async ({ page }) => {
    await open(page);

    // Below sm (< 600): only the "< sm" chip shows; every min-width chip is hidden.
    await page.setViewportSize({ width: 500, height: 900 });
    await expect(page.locator('.z-d-block.z-d-none-sm')).toBeVisible();
    await expect(page.locator('.z-d-none.z-d-block-sm')).toBeHidden();
    await expect(page.locator('.z-d-none.z-d-block-md')).toBeHidden();
    await expect(page.locator('.z-d-none.z-d-block-lg')).toBeHidden();
    await expect(page.locator('.z-d-none.z-d-block-xl')).toBeHidden();

    // md range (>= 900, < 1200): sm + md show; < sm hides; lg/xl still hidden.
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect(page.locator('.z-d-block.z-d-none-sm')).toBeHidden();
    await expect(page.locator('.z-d-none.z-d-block-sm')).toBeVisible();
    await expect(page.locator('.z-d-none.z-d-block-md')).toBeVisible();
    await expect(page.locator('.z-d-none.z-d-block-lg')).toBeHidden();
    await expect(page.locator('.z-d-none.z-d-block-xl')).toBeHidden();

    // >= lg (1200): lg shows too; xl (1536) still hidden.
    await page.setViewportSize({ width: 1300, height: 900 });
    await expect(page.locator('.z-d-none.z-d-block-lg')).toBeVisible();
    await expect(page.locator('.z-d-none.z-d-block-xl')).toBeHidden();

    // >= xl (1536): xl shows.
    await page.setViewportSize({ width: 1600, height: 900 });
    await expect(page.locator('.z-d-none.z-d-block-xl')).toBeVisible();
  });

  test('layout switch: block below md, flex from md up', async ({ page }) => {
    await open(page);
    const sel = '.z-d-block.z-d-flex-md';

    await page.setViewportSize({ width: 700, height: 900 });   // < md
    expect(await display(page, sel)).toBe('block');

    await page.setViewportSize({ width: 1000, height: 900 });  // >= md
    expect(await display(page, sel)).toBe('flex');
  });
});

// -------------------------------------------------------
// (b) Container queries — each card reacts to ITS container width, not the viewport
// -------------------------------------------------------
test.describe('container-queries', () => {
  test('identical markup adapts per container width', async ({ page }) => {
    await open(page);
    // Wide viewport so no container is size-constrained; container queries
    // read each .z-container's own fixed inline width (300 / 700 / 950px).
    await page.setViewportSize({ width: 1400, height: 1000 });

    const body = '.z-cq-flex-md';                 // body: z-d-block z-cq-flex-md
    const details = '.z-cq-none.z-cq-block-sm';   // details chip

    // 300px container (< sm, < md): stacked (block), details hidden.
    expect(await display(page, body, 0)).toBe('block');
    await expect(page.locator(details).nth(0)).toBeHidden();

    // 700px container (>= sm, < md): stacked (block), details visible.
    expect(await display(page, body, 1)).toBe('block');
    await expect(page.locator(details).nth(1)).toBeVisible();

    // 950px container (>= md): row (flex), details visible.
    expect(await display(page, body, 2)).toBe('flex');
    await expect(page.locator(details).nth(2)).toBeVisible();
  });

  test('.z-container establishes an inline-size query container', async ({ page }) => {
    await open(page);
    expect(await display(page, '.z-container')).not.toBe('');
    const ct = await page.locator('.z-container').first()
      .evaluate(n => getComputedStyle(n).containerType);
    expect(ct).toBe('inline-size');
  });
});
