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
// No horizontal overflow — the fixed-width `pv-cols-*` state-gallery grids
// (matrix.zul) were ~1072px wide, exceeding a phone/tablet viewport. When
// document content is wider than the viewport the mobile engine widens the
// layout viewport and scales the whole page down; that same scale makes the
// layout viewport TALLER than the visible area, producing a phantom *vertical*
// scrollbar even though no element sticks out. Asserting no horizontal overflow
// guards the responsive `pv.css` fix (fluid minmax() columns) that keeps the
// galleries within the viewport width.
// -------------------------------------------------------
const overflowPages = [
  '/combobox.zul',
  '/datebox.zul',
  '/timebox.zul',
  '/spinner.zul',
  '/textbox.zul',
];

test.describe('tablet-no-horizontal-overflow', () => {
  for (const url of overflowPages) {
    test(`${url} content fits the viewport width`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const { scrollW, clientW } = await page.evaluate(() => {
        const de = document.scrollingElement || document.documentElement;
        return { scrollW: de.scrollWidth, clientW: de.clientWidth };
      });
      // 1px tolerance for sub-pixel rounding.
      expect(scrollW, `${url}: document is ${scrollW - clientW}px wider than the viewport`)
        .toBeLessThanOrEqual(clientW + 1);
    });
  }
});

// -------------------------------------------------------
// On a phone the State Matrix must SCROLL horizontally, not squeeze its cells.
// The matrix is a single `z-grid-cols-auto` grid with a `--zk-col-min` floor
// (140px) inside an `overflow-x:auto` container: on a narrow viewport the columns
// hold their min width so the grid overflows its OWN box and scrolls, keeping
// each input usable — while the document never overflows (the scroll is
// contained), so no phantom vertical scrollbar. Guards that the matrix container
// is internally scrollable and the inputs stay usable.
// -------------------------------------------------------
test.describe('tablet-matrix-scroll-usable', () => {
  test('matrix scrolls horizontally and inputs stay usable on a phone', async ({ page }) => {
    await page.goto('/combobox.zul');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const grid = document.querySelector('.pv-cols') as HTMLElement;
      const combos = [...grid.querySelectorAll('.z-combobox')] as HTMLElement[];
      return {
        overflow: grid.scrollWidth - grid.clientWidth,
        minComboW: Math.min(...combos.map(c => Math.round(c.getBoundingClientRect().width))),
      };
    });
    // The matrix overflows its own box (so it scrolls) instead of squeezing.
    expect(r.overflow, `matrix should overflow→scroll (got ${r.overflow}px)`).toBeGreaterThan(50);
    // Each combobox keeps a usable width (holds the --zk-col-min floor).
    expect(r.minComboW, `narrowest combobox is ${r.minComboW}px`).toBeGreaterThanOrEqual(130);
  });
});

// -------------------------------------------------------
// Mobile WHEEL picker — datebox/timebox swap the desktop grid calendar / stepper
// for an iOS-style scroll wheel (.z-calendar-wheel-* / .z-timebox-wheel-*,
// rendered by zkmax/touch/{datebox,timebox}-touch.ts) and make the input
// readonly. The wheel mold had no theme CSS: .z-*-wheel-list had no bounded
// height, so its <ul> (200+ <li>×40px) collapsed to ~5079px; ZK's bottom-sheet
// popup (top=innerHeight; height=cave.offsetHeight; translateY(-height)) then
// slid that 5079px off-screen (y≈-3949) → "no usable display". These guard the
// _wheel.css fix: the list stays bounded (3 visible rows) and the sheet lands on
// screen. Also guards that the mobile-readonly trigger stays interactive (the
// desktop readonly rule had pointer-events:none, making every mobile datebox
// look disabled). See doc/skill-gaps.md 2026-06-15.
// -------------------------------------------------------
// A REAL tap on the trigger (the reported interaction) — also exercises the
// pointer-events fix end-to-end. setOpen() via the widget API is avoided here: it
// skips the touch event flow that captures the current viewport height, so the
// bottom-sheet anchor can go stale on a programmatic open.
async function tapFirstTrigger(page: Page, btnSel: string): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
  const btn = page.locator(btnSel).first();
  await btn.waitFor({ state: 'visible' });
  const box = await btn.boundingBox();
  await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.waitForTimeout(1000); // bottom-sheet slide is delayed + animated
}

type WheelCase = { name: string; url: string; listSel: string; btnSel: string; inputSel: string };
const wheelCases: WheelCase[] = [
  { name: 'datebox', url: '/datebox.zul',
    listSel: '.z-calendar-wheel-list', btnSel: '.z-datebox .z-datebox-button',
    inputSel: '.z-datebox .z-datebox-input' },
  { name: 'timebox', url: '/timebox.zul',
    listSel: '.z-timebox-wheel-list', btnSel: '.z-timebox .z-timebox-button',
    inputSel: '.z-timebox .z-timebox-input' },
];

// Geometry of the OPEN bottom-sheet popup (the one ZK detached to <body> and
// rendered with content — found by a non-zero rect).
async function openSheetGeometry(page: Page) {
  return page.evaluate(() => {
    const pps = [...document.querySelectorAll('[id$="-pp"]')] as HTMLElement[];
    const pp = pps.find(p => p.getBoundingClientRect().height > 0) || pps[0];
    const r = pp?.getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      vh,
      top: r ? Math.round(r.top) : null,
      bottom: r ? Math.round(r.bottom) : null,
      height: r ? Math.round(r.height) : null,
      // positive = sheet bottom is BELOW the viewport (clipped OK/Cancel row)
      overshoot: r ? Math.round(r.bottom - vh) : null,
    };
  });
}

for (const { name, url, listSel, btnSel, inputSel } of wheelCases) {
  test.describe(`tablet-${name}-wheel`, () => {
    test('picker opens on-screen with a bounded scroll wheel', async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await tapFirstTrigger(page, btnSel);

      const r = await page.evaluate((ls) => {
        const lists = [...document.querySelectorAll(ls)] as HTMLElement[];
        const pp = lists[0]?.closest('[id$="-pp"]') as HTMLElement
          || document.querySelector('.z-datebox-popup, .z-timebox-popup') as HTMLElement;
        const rect = pp?.getBoundingClientRect();
        const vh = window.innerHeight;
        return {
          listCount: lists.length,
          maxListH: lists.length ? Math.max(...lists.map(l => Math.round(l.getBoundingClientRect().height))) : -1,
          vh,
          popTop: rect ? Math.round(rect.top) : null,
          popH: rect ? Math.round(rect.height) : null,
          // how much of the sheet actually overlaps the viewport
          visibleH: rect ? Math.round(Math.min(rect.bottom, vh) - Math.max(rect.top, 0)) : null,
        };
      }, listSel);

      // the wheel actually rendered
      expect(r.listCount, 'wheel-list columns rendered').toBeGreaterThan(0);
      // each scroll column shows ~3 rows (40px li) — never the full unbounded list
      expect(r.maxListH, `tallest wheel-list is ${r.maxListH}px (should be ~120, not the full ~5000px list)`)
        .toBeLessThanOrEqual(240);
      // bounded sheet (the bug rendered a ~5000px popup), top edge on-screen (the
      // bug put it at y≈-3949), and substantially visible. ZK anchors the sheet
      // to its own jq.innerHeight(), which the emulated viewport reports ~18px
      // shorter — so assert overlap, not an exact bottom edge.
      expect(r.popH!, `popup is ${r.popH}px tall (must fit the viewport)`).toBeLessThan(r.vh);
      expect(r.popTop!, `popup top is ${r.popTop}px (off-screen above)`).toBeGreaterThanOrEqual(0);
      expect(r.popTop!, `popup top is ${r.popTop}px (below the viewport)`).toBeLessThan(r.vh);
      expect(r.visibleH!, `only ${r.visibleH}px of the ${r.popH}px sheet is on-screen`)
        .toBeGreaterThanOrEqual(Math.round(r.popH! * 0.8));
    });

    test('mobile-readonly trigger stays interactive', async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const pe = await page.evaluate((sel) => {
        const btn = document.querySelector(sel) as HTMLElement;
        return btn ? getComputedStyle(btn).pointerEvents : 'no-button';
      }, btnSel);
      // on mobile ZK makes every input readonly; the trigger must NOT be disabled
      expect(pe, 'trigger button pointer-events').not.toBe('none');
    });

    // Tapping the INPUT must land the sheet flush to the viewport bottom, exactly
    // like tapping the ICON. ZK's CalendarPop._syncPosition anchors the sheet with
    // top = innerHeight + scrollY then re-parents via makeVParent, which inflates
    // the inline top by ~18px; the icon tap self-corrects via a second onSize sync
    // but the input tap (focus suppresses the resize) stayed at top+18 → the sheet
    // overshot below the fold, clipping the OK/Cancel row. The _wheel.css fix pins
    // the sheet to bottom:0 so BOTH tap targets land identically. See
    // doc/skill-gaps.md 2026-06-15 (follow-up).
    test('tapping the input lands the sheet flush (not below the fold)', async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await tapFirstTrigger(page, inputSel);
      const r = await openSheetGeometry(page);

      expect(r.height!, 'sheet rendered').toBeGreaterThan(0);
      // the bug parked the bottom ~18px below the viewport; allow 2px sub-pixel slack
      expect(r.overshoot!, `input-tap sheet overshoots ${r.overshoot}px below the viewport`)
        .toBeLessThanOrEqual(2);
      // and it must not be pushed up off the top either
      expect(r.top!, `sheet top is ${r.top}px`).toBeGreaterThanOrEqual(0);
      expect(r.bottom!, `sheet bottom is ${r.bottom}px (viewport ${r.vh})`)
        .toBeGreaterThanOrEqual(r.vh - 2);
    });
  });
}

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

// -------------------------------------------------------
// Colorbox popup dismiss on touch — ZK 10.2.1-jakarta's Colorbox.closePopup /
// onHide only call undoVParent(); they do NOT reset the inline display/position
// that openPopup set. On desktop undoVParent's style restore hides the reattached
// popup, but on the mobile (iPad/Safari) UA it does not, so the popup stays
// display:block (looks un-closed) and leaves a small `.z-palette-button` artifact.
// Theme workaround (floating-popup-in-body pattern): the OPEN popup is detached to
// <body>, so force-hiding the popup while it is RE-ATTACHED inside .z-colorbox
// only ever hides the closed popup. These guard that workaround on a touch UA.
// -------------------------------------------------------
test.describe('tablet-colorbox-dismiss', () => {
  test('outside tap closes the popup (no display:block left on the reattached popup)', async ({ page }) => {
    await page.goto('/colorbox.zul');
    await page.waitForLoadState('networkidle');

    // open must still show (the open popup is detached to <body>)
    const opened = await page.evaluate(() => {
      const w = (window as any).zk.Widget.$(document.querySelector('.z-colorbox'));
      w.openPopup();
      const pp = w.$n('pp') as HTMLElement;
      return getComputedStyle(pp).display !== 'none' && (pp.parentElement as HTMLElement).tagName === 'BODY';
    });
    expect(opened).toBe(true);

    // tap an empty/content area away from the colorbox
    await page.touchscreen.tap(500, 300);
    await page.waitForTimeout(350);

    const dismissed = await page.evaluate(() => {
      const w = (window as any).zk.Widget.$(document.querySelector('.z-colorbox'));
      return { hidden: getComputedStyle(w.$n('pp') as HTMLElement).display === 'none', open: w._open };
    });
    expect(dismissed.open).toBe(false);
    expect(dismissed.hidden).toBe(true);
  });

  test('selecting a color leaves no visible popup/palette-button artifact', async ({ page }) => {
    await page.goto('/colorbox.zul');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const w = (window as any).zk.Widget.$(document.querySelector('.z-colorbox'));
      w.openPopup();
      const pp = w.$n('pp') as HTMLElement;
      const sw = pp.querySelector('.z-colorpalette-color, [data-color]') as HTMLElement;
      if (sw) ['mousedown', 'mouseup', 'click'].forEach(t => sw.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true })));
    });
    await page.waitForTimeout(400);

    const visibleArtifacts = await page.evaluate(() =>
      [...document.querySelectorAll('[class*="palette-button"], .z-colorbox-popup')]
        .filter(e => {
          const r = (e as HTMLElement).getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(e as HTMLElement).display !== 'none';
        })
        .map(e => e.className.toString()));
    expect(visibleArtifacts).toEqual([]);
  });
});
