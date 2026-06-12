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

// -------------------------------------------------------
// Viewport-fill guard — the `100vh` footgun
// The base reset must use `body { min-height: 100% }`, NOT `100vh`. `100vh` is
// blind to scrollbars: when any wide content triggers a horizontal scrollbar,
// a `100vh` body exceeds the now-shorter visible area and spawns a SPURIOUS
// vertical scrollbar on a page whose content fits. The colorbox preview matrix
// is fixed-width (~504px min), so a narrow viewport is a reliable trigger.
// See `.claude/skills/zk-component-rules/reference/viewport-height-fill.md`.
// -------------------------------------------------------
test.describe('viewport-fill', () => {
  test('horizontal overflow must not spawn a spurious vertical scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 835 });
    await page.goto('/colorbox.zul');
    await page.waitForLoadState('networkidle');
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const pageEl = document.querySelector('.z-page') as HTMLElement;
      return {
        contentBottom: Math.round(pageEl.getBoundingClientRect().bottom),
        innerH: window.innerHeight,
        hScroll: d.scrollWidth > d.clientWidth,
        vScroll: d.scrollHeight > d.clientHeight,
      };
    });
    // Precondition: the page content genuinely fits within the viewport...
    expect(m.contentBottom).toBeLessThan(m.innerH);
    // ...and the fixed-width preview matrix does overflow horizontally — the trigger.
    expect(m.hScroll).toBe(true);
    // The guard: despite the horizontal scrollbar, no vertical scrollbar appears.
    expect(m.vScroll).toBe(false);
  });

  // A floating popup must dismiss on an outside click ANYWHERE in the viewport,
  // including the empty area below the page content. ZK core only fires the
  // float-up / auto-close when the click's clientY <= document.body.clientHeight
  // (mount.ts `_docMouseDown`, a "not a scrollbar click" guard). So `body` MUST
  // fill the viewport height; if it collapses to content height, clicks below
  // the content are silently swallowed and open popups never close. This guards
  // the regression where `body { min-height: 100% }` failed to resolve (its
  // containing block <html> had no definite height) and body shrank to content.
  test('colorbox popup dismisses on a click in the empty area below content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/colorbox.zul');
    await page.waitForLoadState('networkidle');

    const geo = await page.evaluate(() => {
      const cb = document.querySelector('.z-colorbox') as HTMLElement;
      const w = (window as any).zk.Widget.$(cb);
      w.openPopup();
      const pp = w.$n('pp') as HTMLElement;
      const r = pp.getBoundingClientRect();
      return {
        open: getComputedStyle(pp).display !== 'none',
        popupBottom: Math.round(r.bottom),
        bodyClientHeight: document.body.clientHeight,
        innerH: window.innerHeight,
      };
    });
    // Precondition: the popup is open, and there is empty viewport below it.
    expect(geo.open).toBe(true);
    const clickY = geo.popupBottom + 120;
    expect(clickY).toBeLessThan(geo.innerH);

    // Click in the empty area below the content, well clear of the popup (x=1100).
    await page.mouse.click(1100, clickY);
    await page.waitForTimeout(300); // ZK's float-up filter is ~120ms

    const closed = await page.evaluate(() => {
      const cb = document.querySelector('.z-colorbox') as HTMLElement;
      const w = (window as any).zk.Widget.$(cb);
      return getComputedStyle(w.$n('pp') as HTMLElement).display === 'none';
    });
    expect(closed).toBe(true);
  });
});
