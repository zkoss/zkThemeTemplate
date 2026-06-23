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

  // c15-c19: contained color-variant disabled buttons must use disabled-container bg
  // --zk-color-disabled-container = rgba(0,0,0,0.12), alpha ≈ 0.12 (variant colors are opaque)
  test('color-variant-disabled-state', async ({ page }) => {
    const containedVariants = ['secondary', 'success', 'warning', 'error', 'info'];
    for (const variant of containedVariants) {
      const alpha = await page.evaluate((cls) => {
        const el = document.querySelector(`.z-button-${cls}[disabled]`);
        if (!el) throw new Error(`No disabled .z-button-${cls} found`);
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
        return m ? parseFloat(m[1]) : 1.0; // no alpha → opaque
      }, variant);
      expect(alpha, `${variant} disabled button bg should be semi-transparent (disabled-container), not opaque`).toBeLessThanOrEqual(0.2);
    }

    // c20-c25: outlined color-variant disabled buttons must use disabled text/border colors
    // --zk-color-disabled = rgba(0,0,0,0.38), alpha ≈ 0.38 (variant colors are opaque)
    const outlinedVariants = ['secondary', 'success', 'warning', 'error', 'info'];
    for (const variant of outlinedVariants) {
      const alpha = await page.evaluate((cls) => {
        const el = document.querySelector(`.z-button-outlined-${cls}[disabled]`);
        if (!el) throw new Error(`No disabled .z-button-outlined-${cls} found`);
        const color = getComputedStyle(el).color;
        const m = color.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
        return m ? parseFloat(m[1]) : 1.0;
      }, variant);
      expect(alpha, `outlined-${variant} disabled button color should be semi-transparent (disabled), not opaque`).toBeLessThanOrEqual(0.5);
    }

    // c26-c28: text color-variant disabled buttons must use disabled text color
    const textVariants = ['secondary', 'error', 'info'];
    for (const variant of textVariants) {
      const alpha = await page.evaluate((cls) => {
        const el = document.querySelector(`.z-button-text-${cls}[disabled]`);
        if (!el) throw new Error(`No disabled .z-button-text-${cls} found`);
        const color = getComputedStyle(el).color;
        const m = color.match(/rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/);
        return m ? parseFloat(m[1]) : 1.0;
      }, variant);
      expect(alpha, `text-${variant} disabled button color should be semi-transparent (disabled), not opaque`).toBeLessThanOrEqual(0.5);
    }
  });
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

// -------------------------------------------------------
// Errorbox — layout must be position-invariant
// -------------------------------------------------------
// Errorbox._fixarrow() (ZK) writes padding to ONLY the beak-facing side of
// .z-errorbox per pointer direction (padding-left when the beak points left,
// padding-top when up, etc.). The content is a table-cell so that one-sided
// padding shifts it, but the icon and close button are absolutely positioned
// against .z-errorbox and stay put. The theme overrides it with SYMMETRIC
// padding (`.z-errorbox { padding: var(--zk-errorbox-beak) !important }`, 8px)
// and adds the same beak back to the icon/close offsets, so:
//   (a) the icon→text and close→edge gaps stay constant in every direction, and
//   (b) the beak (pointer -4px + 12px triangle) lands flush at the content edge
//       — OUTSIDE the content, never intruding into it.
// Two failure modes this guards: the original one-sided drift (8px), and a
// `padding:0` over-correction that pulls the beak INSIDE the content.
test.describe('errorbox-position-invariance', () => {
  test('icon/close gaps are constant and the beak sits flush outside the content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/errorbox.zul');
    await page.waitForLoadState('networkidle');

    const boxes = await page.evaluate(async () => {
      const win = window as any;
      // Drive validation through the widget API — synthetic typing+Tab is
      // unreliable in automation (see skills/.../components/errorbox.md).
      [...document.querySelectorAll('input.z-textbox, input.z-intbox')].forEach(inp => {
        const w = win.zk.Widget.$(inp);
        if (w && w.setErrorMessage) w.setErrorMessage('Value is required');
      });
      await new Promise(r => setTimeout(r, 500)); // Errorbox.show() defers open() by 50ms + reposition

      return [...document.querySelectorAll('.z-errorbox')]
        // real widget boxes carry pointer + icon + close; the static State
        // Gallery examples have only a subset, so require all three.
        .filter(eb => eb.querySelector('.z-errorbox-pointer')
                   && eb.querySelector('.z-errorbox-icon')
                   && eb.querySelector('.z-errorbox-close'))
        .map(eb => {
          const content = eb.querySelector('.z-errorbox-content') as HTMLElement;
          const icon = eb.querySelector('.z-errorbox-icon') as HTMLElement;
          const close = eb.querySelector('.z-errorbox-close') as HTMLElement;
          const pointer = eb.querySelector('.z-errorbox-pointer') as HTMLElement;
          const cr = content.getBoundingClientRect();
          const ir = icon.getBoundingClientRect();
          const clr = close.getBoundingClientRect();
          const pr = pointer.getBoundingClientRect();
          const dir = (pointer.className.match(/z-errorbox-(up|down|left|right)/) || [, 'none'])[1];
          // How far the beak's far edge crosses past the content edge it points
          // at, INTO the content. ~0 = flush outside; >0 = beak sits inside (bug).
          const intrusion =
            dir === 'left'  ? pr.right - cr.left :
            dir === 'right' ? cr.right - pr.left :
            dir === 'up'    ? pr.bottom - cr.top :
            dir === 'down'  ? cr.bottom - pr.top : 0;
          return {
            dir,
            iconLeftFromContent: Math.round(ir.left - cr.left),
            closeRightFromContent: Math.round(cr.right - clr.right),
            beakIntrusion: Math.round(intrusion),
          };
        });
    });

    expect(boxes.length, 'no live errorboxes were triggered').toBeGreaterThanOrEqual(2);

    for (const b of boxes) {
      // Icon sits 12px inside the content text edge, close 4px from the content
      // right edge — in EVERY pointer direction. (Buggy one-sided build: 4px.)
      expect(b.iconLeftFromContent,
        `icon→text gap is ${b.iconLeftFromContent}px for a "${b.dir}" pointer (expected ~12): ${JSON.stringify(boxes)}`)
        .toBeGreaterThanOrEqual(10);
      expect(b.iconLeftFromContent).toBeLessThanOrEqual(14);
      expect(b.closeRightFromContent,
        `close→edge gap is ${b.closeRightFromContent}px for a "${b.dir}" pointer (expected ~4): ${JSON.stringify(boxes)}`)
        .toBeGreaterThanOrEqual(2);
      expect(b.closeRightFromContent).toBeLessThanOrEqual(6);
      // Beak must sit flush OUTSIDE the content, not inside it. (padding:0
      // over-correction build: intrusion = 8px.)
      expect(b.beakIntrusion,
        `beak intrudes ${b.beakIntrusion}px into the content for a "${b.dir}" pointer (must be ≤1): ${JSON.stringify(boxes)}`)
        .toBeLessThanOrEqual(1);
    }

    // Invariance: the gaps must not drift between directions.
    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(spread(boxes.map(b => b.iconLeftFromContent)),
      `icon→text gap drifts across pointer directions: ${JSON.stringify(boxes)}`).toBeLessThanOrEqual(2);
    expect(spread(boxes.map(b => b.closeRightFromContent)),
      `close→edge gap drifts across pointer directions: ${JSON.stringify(boxes)}`).toBeLessThanOrEqual(2);
  });
});

// -------------------------------------------------------
// Notification
// `.z-notification` is a bare layout shell — the visual card (bg, shadow,
// radius, padding) lives only on `.z-notification-content`. A dead duplicate
// rule in misc.css once painted the shell with inverse-surface, producing a
// dark frame around the card and pushing the icon onto the accent stripe.
// See doc/skill-gaps.md 2026-06-18.
// -------------------------------------------------------
test.describe('notification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notification.zul');
    await page.waitForLoadState('networkidle');
  });

  test('shell-is-bare-and-icon-clears-stripe', async ({ page }) => {
    const m = await page.evaluate(() => {
      const shell = document.querySelector('.z-notification-info') as HTMLElement;
      const content = document.querySelector('.z-notification-info .z-notification-content') as HTMLElement;
      const icon = document.querySelector('.z-notification-info .z-notification-icon') as HTMLElement;
      const sc = getComputedStyle(shell);
      const stripe = getComputedStyle(content, '::before');
      const cr = content.getBoundingClientRect(), ir = icon.getBoundingClientRect();
      return {
        shellBg: sc.backgroundColor,
        shellPaddingLeft: sc.paddingLeft,
        stripeWidth: parseFloat(stripe.width) || 0,
        iconLeftFromContent: Math.round(ir.x - cr.x),
      };
    });
    // shell must be transparent — the dark inverse-surface frame is the bug
    expect(m.shellBg, 'shell .z-notification must be transparent (no dark frame)').toBe('rgba(0, 0, 0, 0)');
    // no padding on the shell — padding shifts the absolute icon onto the stripe
    expect(parseFloat(m.shellPaddingLeft), 'shell .z-notification must have no padding-left').toBe(0);
    // icon must sit clear of the 4px accent stripe, not on top of it
    expect(m.iconLeftFromContent, `icon must clear the ${m.stripeWidth}px stripe`).toBeGreaterThanOrEqual(8);
  });

  // A notification floats over arbitrary page content (e.g. top_left lands on the
  // page header). A translucent fill (rgba alpha < 1) lets that content bleed
  // through, making the header look like it sits ON TOP of the notification.
  // Every variant's card background must be fully opaque.
  test('variant-backgrounds-are-opaque', async ({ page }) => {
    const alphas = await page.evaluate(() => {
      const types = ['info', 'warning', 'error'];
      const alphaOf = (s: string) => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        if (!m) return 1;
        const parts = m[1].split(',').map((x) => x.trim());
        return parts.length === 4 ? parseFloat(parts[3]) : 1;
      };
      return types.map((t) => {
        const c = document.querySelector(`.z-notification-${t} .z-notification-content`) as HTMLElement;
        return { type: t, alpha: alphaOf(getComputedStyle(c).backgroundColor) };
      });
    });
    for (const { type, alpha } of alphas) {
      expect(alpha, `.z-notification-${type} content background must be opaque (alpha=1), got ${alpha}`).toBe(1);
    }
  });

  // `.z-notification-content` has min-height:48px — taller than a single 13px/1.5
  // line (~19.5px) plus its 12px top+bottom padding (~43.5px). Block layout flows
  // the text from the top, leaving the ~4.5px slack at the bottom, so a single
  // line reads as top-aligned rather than vertically centred against the icon
  // (which IS centred via top:50%). The text's optical centre must match the
  // card's centre. See doc/skill-gaps.md 2026-06-18.
  test('single-line-content-is-vertically-centered', async ({ page }) => {
    const m = await page.evaluate(() => {
      const content = document.querySelector('.z-notification-info .z-notification-content') as HTMLElement;
      const cr = content.getBoundingClientRect();
      // measure the actual rendered text glyph box, not the padding box
      const range = document.createRange();
      range.selectNodeContents(content);
      const tr = range.getBoundingClientRect();
      return { contentCenter: cr.y + cr.height / 2, textCenter: tr.y + tr.height / 2 };
    });
    const offset = m.textCenter - m.contentCenter;
    expect(Math.abs(offset), `single-line text off-centre by ${offset.toFixed(2)}px (positive = too low, negative = too high)`).toBeLessThanOrEqual(1);
  });
});

// -------------------------------------------------------
// Linelayout
// -------------------------------------------------------
// Each lineitem's content (a button) is moved out of the cave into the
// .z-linelayout-last column at bind_(). For the timeline to read correctly the
// content slots must (a) line up along the timeline axis with their cave points
// and (b) sit adjacent to the connector line. Both depend on the first/last
// CONTENT columns carrying the per-orientation flex-direction (column in vertical)
// and align-items (flex-start on last). The Marble rewrite set flex-direction only
// on the cave, so the content column defaulted to `row` and all buttons collapsed
// to one vertical position. See doc/skill-gaps.md 2026-06-22 and contract M7.
test.describe('linelayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/linelayout.zul');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.z-linelayout-last .z-button, .z-linelayout-last button');
  });

  test('content-aligns-with-points', async ({ page }) => {
    const m = await page.evaluate(() => {
      const cy = (el: Element) => { const r = el.getBoundingClientRect(); return r.y + r.height / 2; };
      // Scope to the first linelayout (the model-driven vertical timeline: 4 items,
      // each a single button in the default last area). The page now hosts several
      // linelayouts demonstrating other attributes; document-wide selectors would
      // mix their points/buttons together.
      const root = document.querySelector('.z-linelayout')!;
      const points = [...root.querySelectorAll('.z-linelayout-cave .z-lineitem-point')].map(cy);
      const lastRight = root.querySelector('.z-linelayout-last')!.getBoundingClientRect().right;
      const btns = [...root.querySelectorAll('.z-linelayout-last .z-button, .z-linelayout-last button')]
        .map((el) => { const r = el.getBoundingClientRect(); return { cy: r.y + r.height / 2, left: r.x, right: r.right }; });
      const cave = root.querySelector('.z-linelayout-cave')!.getBoundingClientRect();
      return { points, btns, caveRight: cave.x + cave.width, lastRight };
    });

    expect(m.btns.length, 'expected 4 timeline buttons').toBe(4);
    expect(m.points.length, 'expected 4 cave points').toBe(4);

    // (a) buttons must occupy distinct vertical positions — not all collapsed to one
    const distinctY = new Set(m.btns.map((b) => Math.round(b.cy))).size;
    expect(distinctY, 'buttons must spread vertically along the timeline, not collapse to one row').toBeGreaterThanOrEqual(m.btns.length);

    // (b) each button's vertical centre must match its corresponding point's (±4px)
    m.btns.forEach((b, i) => {
      const d = b.cy - m.points[i];
      expect(Math.abs(d), `button[${i}] cy=${b.cy.toFixed(0)} vs point cy=${m.points[i].toFixed(0)} (off ${d.toFixed(1)}px)`).toBeLessThanOrEqual(4);
    });

    // (c) each button must hug the cave (adjacent to the connector line), not float mid-column
    m.btns.forEach((b, i) => {
      const gap = b.left - m.caveRight;
      expect(gap, `button[${i}] must sit adjacent to the cave (left edge ${gap.toFixed(0)}px from cave, expected ≤16)`).toBeLessThanOrEqual(16);
    });

    // (d) no button may be clipped by the column's overflow:hidden — the timeline
    // must be wide enough that each button renders in full (see skill-gaps 2026-06-22).
    m.btns.forEach((b, i) => {
      const overflow = b.right - m.lastRight;
      expect(overflow, `button[${i}] is clipped: right edge overflows the last column by ${overflow.toFixed(0)}px`).toBeLessThanOrEqual(1);
    });
  });

  // Icon (pointIconSclass) and image (pointImageSrc) content must be both
  // vertically and horizontally centred in the point circle. The Marble rewrite
  // gave .z-lineitem-point-inner `width/height:inherit` (→ a 24px box overflowing
  // the 20px bordered interior, offsetting content +2/+2px from the point centre)
  // and left `background-position` at the default `0% 0%` (image anchored
  // top-left). See doc/skill-gaps.md 2026-06-22 and contract M8/pt10-pt13c.
  test('point-content-centered', async ({ page }) => {
    const m = await page.evaluate(() => {
      const box = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
      };
      const measure = (el: Element) => {
        const point = el.closest('.z-lineitem-point')!;
        const ic = box(el), pc = box(point);
        const cs = getComputedStyle(el);
        return {
          dx: ic.cx - pc.cx, dy: ic.cy - pc.cy,
          display: cs.display, alignItems: cs.alignItems, justifyContent: cs.justifyContent,
          bgPos: cs.backgroundPosition,
        };
      };
      const inners = [...document.querySelectorAll('.z-lineitem-point-inner')];
      const iconInner = inners.find((el) => /\bz-icon-/.test(el.className));
      const imageInner = inners.find((el) => /url\(.*(earth|\.png|\.jpg|\.gif|\.svg)/i.test(getComputedStyle(el).backgroundImage)
        && !el.className.includes('z-icon-')
        && !/data:image\/gif/.test(getComputedStyle(el).backgroundImage));
      return {
        icon: iconInner ? measure(iconInner) : null,
        image: imageInner ? measure(imageInner) : null,
      };
    });

    // ── Icon point ──────────────────────────────────────────────────────
    expect(m.icon, 'expected an icon point (pointIconSclass) on the page').not.toBeNull();
    // inner holder centred within the circle (no inherit-overflow offset)
    expect(Math.abs(m.icon!.dx), `icon inner off-centre horizontally by ${m.icon!.dx.toFixed(2)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(m.icon!.dy), `icon inner off-centre vertically by ${m.icon!.dy.toFixed(2)}px`).toBeLessThanOrEqual(1);
    // flex centring guarantees the 12×12 ::before glyph sits at the circle centre
    expect(m.icon!.display, 'icon inner must flex-centre its glyph').toBe('flex');
    expect(m.icon!.alignItems).toBe('center');
    expect(m.icon!.justifyContent).toBe('center');

    // ── Image point ─────────────────────────────────────────────────────
    expect(m.image, 'expected an image point (pointImageSrc) on the page').not.toBeNull();
    expect(Math.abs(m.image!.dx), `image inner off-centre horizontally by ${m.image!.dx.toFixed(2)}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(m.image!.dy), `image inner off-centre vertically by ${m.image!.dy.toFixed(2)}px`).toBeLessThanOrEqual(1);
    // image must be centred in the circle, not anchored top-left (0% 0%)
    expect(m.image!.bgPos, `image must be centred in the circle (background-position=${m.image!.bgPos})`).toMatch(/^(center|50%)/);
  });
});

// The splitter family (DESIGN.md §14) presents ONE resize affordance: an 8px
// surface-container tonal bar + actuator pill. The bar's tonal fill IS the
// divider — no member draws a border on the bar. splitlayout used to be the
// lone outlier with a 1px outline-variant bar border (contract c2), which
// stacked into a double-line between its already-bordered panes. This test
// pins every family bar to border-width 0. See doc/skill-gaps.md 2026-06-23.
test.describe('splitter-family', () => {
  test('bars-are-borderless-across-the-family', async ({ page }) => {
    const maxBorder = async (url: string, selector: string) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForSelector(selector);
      return page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)];
        const widths = els.map((el) => {
          const cs = getComputedStyle(el);
          return Math.max(
            parseFloat(cs.borderTopWidth) || 0,
            parseFloat(cs.borderRightWidth) || 0,
            parseFloat(cs.borderBottomWidth) || 0,
            parseFloat(cs.borderLeftWidth) || 0,
          );
        });
        return { count: els.length, max: widths.length ? Math.max(...widths) : -1 };
      }, selector);
    };

    const splitlayout = await maxBorder('/splitlayout.zul', '.z-splitlayout-splitter');
    expect(splitlayout.count, 'expected splitlayout splitter bars on the page').toBeGreaterThan(0);
    expect(splitlayout.max, `splitlayout splitter bar must be borderless, max border-width=${splitlayout.max}px`).toBe(0);

    const splitter = await maxBorder('/splitter.zul', '.z-splitter');
    expect(splitter.count, 'expected splitter bars on the page').toBeGreaterThan(0);
    expect(splitter.max, `splitter bar must be borderless, max border-width=${splitter.max}px`).toBe(0);
  });

  // MD3 communicates hover via the state layer (colour), not geometry — no family
  // member resizes its pill on hover. borderlayout used to grow its pill 28px→44px
  // (the lone outlier; the caret already has its space at idle via opacity:0, so
  // the growth was decorative). The pill long-axis must stay 28px on hover, like
  // splitter/splitlayout. See doc/skill-gaps.md 2026-06-23.
  test('pill-does-not-resize-on-hover', async ({ page }) => {
    await page.goto('/borderlayout.zul');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.z-west-splitter-button');
    const longAxis = (sel: string) =>
      page.evaluate((s) => {
        const el = document.querySelector(s) as HTMLElement;
        return el ? el.getBoundingClientRect().height : -1;
      }, sel);

    const idle = await longAxis('.z-west-splitter-button');
    expect(idle, 'west pill idle long-axis should be the family 28px').toBeCloseTo(28, 0);

    await page.hover('.z-west-splitter');
    await page.waitForTimeout(400); // allow the (former) growth transition to settle
    const hovered = await longAxis('.z-west-splitter-button');
    expect(hovered, `west pill must not grow on hover (idle=${idle}px, hover=${hovered}px)`).toBeCloseTo(28, 0);
  });
});
