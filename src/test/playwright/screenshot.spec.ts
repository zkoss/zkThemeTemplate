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

// -------------------------------------------------------
// Button
// -------------------------------------------------------
test.describe('button', () => {
  const variants = ['default', 'outlined'];

  for (const variant of variants) {
    test.describe(variant, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/button.zul');
        await page.waitForLoadState('networkidle');
      });

      test('gallery', async ({ page }) => {
        await expect(page.locator(`.pv-variant-${variant}`).first()).toHaveScreenshot('gallery.png');
      });

      for (const { name, action } of buttonDynamicStates) {
        test(name, async ({ page }) => {
          const el = page.locator(`.pv-variant-${variant} .z-button`).first();
          await action(el);
          await expect(el).toHaveScreenshot(`${name}.png`);
          if (name === 'active') await page.mouse.up();
        });
      }
    });
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-textbox').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-checkbox').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-combobox-input').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-datebox-input').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-timebox-input').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-spinner-input').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  for (const { name, action } of hoverFocusStates) {
    test(name, async ({ page }) => {
      const el = page.locator('.pv-variant-default .z-bandbox-input').first();
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
    await expect(page.locator('.pv-variant-default').first()).toHaveScreenshot('gallery.png');
  });

  test('hover', async ({ page }) => {
    const el = page.locator('.pv-variant-default .z-selectbox').first();
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
