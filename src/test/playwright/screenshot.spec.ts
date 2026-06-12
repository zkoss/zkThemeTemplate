import { test, expect, Locator } from '@playwright/test';

type DynamicState = { name: string; action: (loc: Locator) => Promise<void> };

const hoverFocusStates: DynamicState[] = [
  { name: 'hover',  action: loc => loc.hover() },
  { name: 'focus',  action: loc => loc.focus() },
];

const buttonDynamicStates: DynamicState[] = [
  ...hoverFocusStates,
  { name: 'active', action: async loc => {
      await loc.hover();
      await loc.page().mouse.down();
    }
  },
];

// Preview pages fall into two structural families:
//  - "gallery" pages (button, textbox, checkbox, the input controls): a single
//    `.z-p-8` page wrapper holding `pv-cols-N` / `pv-row` demo rows. No per-variant
//    wrapper — capture the whole `.z-p-8` for the gallery and target bare `.z-*`
//    elements for dynamic states.
//  - "variant" pages (listbox, grid, tabbox, tree, window, panel): wrap each demo
//    in a `.pv-variant-<name>` block — capture/scope by that wrapper.

// -------------------------------------------------------
// Button
// -------------------------------------------------------
test.describe('button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/button.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  const variants = [
    { label: 'default',  selector: '.z-button' },
    { label: 'outlined', selector: '.z-button-outlined' },
  ];

  for (const { label, selector } of variants) {
    for (const { name, action } of buttonDynamicStates) {
      test(`${label}-${name}`, async ({ page }) => {
        const el = page.locator(selector).first();
        await action(el);
        await expect(el).toHaveScreenshot(`${label}-${name}.png`);
        if (name === 'active') await page.mouse.up();
      });
    }
  }
});

// -------------------------------------------------------
// Textbox
// -------------------------------------------------------
test.describe('textbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/textbox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-textbox').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Checkbox
// -------------------------------------------------------
test.describe('checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkbox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-checkbox').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Combobox
// -------------------------------------------------------
test.describe('combobox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/combobox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-combobox-input').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Listbox
// -------------------------------------------------------
test.describe('listbox', () => {
  const variants = ['default', 'checkmark'];

  for (const variant of variants) {
    test.describe(variant, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/listbox.zul');
        await page.waitForLoadState('networkidle');
      });

      test('gallery', async ({ page }) => {
        await expect(page.locator(`.pv-variant-${variant}`).first()).toHaveScreenshot('gallery.png');
      });

      test('hover', async ({ page }) => {
        const el = page.locator(`.pv-variant-${variant} .z-listitem`).first();
        await el.hover();
        await expect(el).toHaveScreenshot('hover.png');
      });
    });
  }
});

// -------------------------------------------------------
// Grid
// -------------------------------------------------------
test.describe('grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/grid.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  test('hover', async ({ page }) => {
    const el = page.locator('.pv-variant-default .z-row').first();
    await el.hover();
    await expect(el).toHaveScreenshot('hover.png');
  });
});

// -------------------------------------------------------
// Datebox
// -------------------------------------------------------
test.describe('datebox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/datebox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-datebox-input').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Timebox
// -------------------------------------------------------
test.describe('timebox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timebox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-timebox-input').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Spinner
// -------------------------------------------------------
test.describe('spinner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/spinner.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-spinner-input').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Bandbox
// -------------------------------------------------------
test.describe('bandbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bandbox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.z-bandbox-input').first();
      await action(el);
      await expect(el).toHaveScreenshot(`${name}.png`);
    });
  }
});

// -------------------------------------------------------
// Selectbox
// -------------------------------------------------------
test.describe('selectbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selectbox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.z-p-8').first()).toHaveScreenshot('gallery.png');
  });

  test('hover', async ({ page }) => {
    const el = page.locator('.z-selectbox').first();
    await el.hover();
    await expect(el).toHaveScreenshot('hover.png');
  });
});

// -------------------------------------------------------
// Tabbox
// -------------------------------------------------------
test.describe('tabbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabbox.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  test('hover', async ({ page }) => {
    const el = page.locator('.pv-variant-default .z-tab').first();
    await el.hover();
    await expect(el).toHaveScreenshot('hover.png');
  });
});

// -------------------------------------------------------
// Tree
// -------------------------------------------------------
test.describe('tree', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tree.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  test('hover', async ({ page }) => {
    const el = page.locator('.pv-variant-default .z-treerow').first();
    await el.hover();
    await expect(el).toHaveScreenshot('hover.png');
  });
});

// -------------------------------------------------------
// Window
// -------------------------------------------------------
test.describe('window', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/window.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });
});

// -------------------------------------------------------
// Panel
// -------------------------------------------------------
test.describe('panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/panel.zul');
    await page.waitForLoadState('networkidle');
  });

  test('gallery', async ({ page }) => {
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });
});

// -------------------------------------------------------
// Tablet-isolation guard
// The tablet bundle must stay tablet-only: on a desktop UA, ZK must NOT inject
// zkmax/css/tablet.css, so touch overrides can never leak into desktop.
// -------------------------------------------------------
test.describe('tablet-isolation', () => {
  test('tablet.css is absent on a desktop UA', async ({ page }) => {
    await page.goto('/button.zul');
    await page.waitForLoadState('networkidle');
    const hrefs = await page.evaluate(() =>
      [...document.styleSheets].map(s => s.href).filter(Boolean) as string[]);
    expect(hrefs.some(h => h.includes('zkmax/css/tablet.css'))).toBe(false);
  });
});
