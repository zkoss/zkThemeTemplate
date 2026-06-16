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

  // Comboitem with iconSclass: the leading icon must be separated from the
  // label, not glued to it. ZK renders `.z-comboitem-icon` + `.z-comboitem-text`
  // as adjacent flex children with no built-in gap. See doc/skill-gaps.md 2026-06-15.
  test('comboitem icon is separated from its label', async ({ page }) => {
    const gap = await page.evaluate(() => {
      const cbs = [...document.querySelectorAll('.z-combobox')];
      let item = null;
      for (const el of cbs) {
        const w = (window as any).zk.Widget.$(el);
        for (let c = w.firstChild; c; c = c.nextSibling) {
          if (c._iconSclass) { item = c; break; }
        }
        if (item) { w.open(); break; }
      }
      if (!item) return -1;
      const li = item.$n();
      const iconGlyph = li.querySelector('.z-comboitem-icon > *') || li.querySelector('.z-comboitem-icon');
      const text = li.querySelector('.z-comboitem-text');
      return text.getBoundingClientRect().left - iconGlyph.getBoundingClientRect().right;
    });
    // 0px = glyph touching the label (the bug); expect a real MD-scale gap.
    expect(gap).toBeGreaterThanOrEqual(8);
  });
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
// vertical scrollbar on a page whose content fits. We force the horizontal
// scrollbar with an injected off-document-flow wide spacer (the preview pages
// are now responsive and no longer overflow), so this guards the reset rule
// itself rather than any page's layout.
// See `.claude/skills/zk-component-rules/reference/viewport-height-fill.md`.
// -------------------------------------------------------
test.describe('viewport-fill', () => {
  test('horizontal overflow must not spawn a spurious vertical scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 835 });
    await page.goto('/colorbox.zul');
    await page.waitForLoadState('networkidle');
    const m = await page.evaluate(() => {
      // Force a horizontal scrollbar without adding vertical content height:
      // an absolutely-positioned 1px-tall spacer wider than the viewport.
      const spacer = document.createElement('div');
      spacer.style.cssText = 'position:absolute;top:0;left:0;width:2000px;height:1px;pointer-events:none;';
      document.body.appendChild(spacer);

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

// -------------------------------------------------------
// State-gallery columns must FILL their container, not cap at a fixed px.
// The `pv-cols` grid was 8 hardcoded variants (label + N fixed-width tracks),
// so on a wide desktop the data columns capped at ~160px and left a large empty
// gutter on the right. The unified layout uses `auto repeat(var(--zk-cols),
// minmax(0,1fr))` — one variable-driven utility shared with the framework's
// `.z-grid-cols-auto`. This asserts the rightmost data cell now reaches the
// row's right edge (i.e. the columns fill). Fails under the old capped layout.
// -------------------------------------------------------
test.describe('pv-cols-fill', () => {
  test('state matrix columns fill the container width on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/button.zul');
    await page.waitForLoadState('networkidle');

    const gap = await page.evaluate(() => {
      const row = document.querySelector('[class*="pv-cols"] .pv-row') as HTMLElement;
      const cells = [...row.children] as HTMLElement[];
      const last = cells[cells.length - 1];
      const rowRight = row.getBoundingClientRect().right;
      const lastRight = last.getBoundingClientRect().right;
      return Math.round(rowRight - lastRight);
    });
    // With fill, the last cell ends at the row's right edge (only sub-pixel slack).
    // With the old capped 160px tracks this gutter was several hundred px.
    expect(gap, `right gutter is ${gap}px — columns are not filling`).toBeLessThanOrEqual(8);
  });
});

// -------------------------------------------------------
// Container header height — the box-sizing-reset regression guard.
// The universal reset `*{box-sizing:border-box}` lives in `_reset.css` directly
// after the `@layer …;` order statement. CleanCSS 5.3.3 (build-css.js minify)
// dropped a bare `@layer a,b;` statement TOGETHER with the rule right after it,
// so the packaged build shipped without the reset. Headers then computed as
// content-box, making `min-height` ADD to padding instead of including it:
// window 56+32→88px, panel 48+32→80px, groupbox 48+24→73px. This guards both
// the precise cause (box-sizing must be border-box) and the visible symptom
// (header height must stay within the intended band, not the content-box blow-up).
// See tasks/header-height-boxsizing-fix.md and doc/skill-gaps.md.
// -------------------------------------------------------
test.describe('container-header-height', () => {
  const cases = [
    { name: 'window',   url: '/window.zul',   selector: '.z-window-header',   maxHeight: 72 },
    { name: 'panel',    url: '/panel.zul',     selector: '.z-panel-header',    maxHeight: 68 },
    { name: 'groupbox', url: '/groupbox.zul',  selector: '.z-groupbox-header', maxHeight: 56 },
  ];

  for (const { name, url, selector, maxHeight } of cases) {
    test(`${name} header uses border-box and stays compact`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const m = await page.evaluate((sel) => {
        const headers = [...document.querySelectorAll(sel)] as HTMLElement[];
        return headers.map(h => ({
          boxSizing: getComputedStyle(h).boxSizing,
          height: Math.round(h.getBoundingClientRect().height),
        }));
      }, selector);

      expect(m.length, `no ${selector} found on ${url}`).toBeGreaterThan(0);
      for (const h of m) {
        // Precise cause: the reset must reach the header.
        expect(h.boxSizing, `${name} header box-sizing`).toBe('border-box');
        // Visible symptom: height must stay within the intended band.
        expect(h.height, `${name} header height is ${h.height}px`).toBeLessThanOrEqual(maxHeight);
      }
    });
  }
});
