import { test, expect } from '@playwright/test';

// Regression guard for the forced-colors / Windows High-Contrast a11y layer
// (GAP 5 — see doc/spec/forced-colors.md). Runs under the `forced-colors`
// project, whose `use.forcedColors: 'active'` makes Chromium emulate WHCM:
// the OS palette collapses to system colors and every box-shadow is stripped.
//
// Under emulation the system colors resolve to a fixed palette, e.g.
//   Highlight ≈ rgba(5, 0, 73, 0.8)   HighlightText = rgb(255,255,255)
//   Canvas    = rgb(255,255,255)       CanvasText    = rgb(0,0,0)
// so the assertions below check the *effect* of each guard (an outline appears,
// a selected row's fill changes, forced-color-adjust opts out) rather than
// pinning exact colors — that keeps the test robust if the emulated palette
// shifts between Chromium versions.
//
// If any of these fail after a change, the central guard in
// tokens/_forced-colors.css (bundled into norm.css.dsp) has regressed — rebuild
// with `npm run build:css` and re-check that file.
//
// Requires the preview app on http://localhost:8080
//   withjdk.sh 17 mvn test exec:java@preview-app
// Run: npm run test:forced-colors   (or: playwright test --project=forced-colors)

test.describe('forced-colors (Windows High-Contrast) a11y guards', () => {
  // Emulate WHCM at runtime. This CDP-backed call (Emulation.setEmulatedMedia)
  // is the reliable path — the context-option form (use.forcedColors) does not
  // take effect for the page fixture in this runner setup.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
  });

  test('forced-colors is actually emulated', async ({ page }) => {
    await page.goto('/button.zul', { waitUntil: 'domcontentloaded' });
    const matches = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
    expect(matches, 'forced-colors must be active').toBe(true);
  });

  test('checkbox checked/indeterminate opt out of the OS palette (glyph stays legible)', async ({ page }) => {
    await page.goto('/checkbox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-checkbox-mold', { timeout: 10000 });
    if (await page.locator('.z-checkbox-on > .z-checkbox-mold').count() === 0) {
      await page.locator('.z-checkbox').first().click();
    }
    const fca = await page.locator('.z-checkbox-on > .z-checkbox-mold').first()
      .evaluate(el => getComputedStyle(el).forcedColorAdjust);
    // Without the guard this reverts to the default 'auto' (box → Canvas, white check invisible).
    expect(fca).toBe('none');
  });

  test('text-input focus draws a real outline (box-shadow focus ring is stripped)', async ({ page }) => {
    await page.goto('/datebox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-datebox', { timeout: 10000 });
    await page.locator('.z-datebox-input').first().focus();
    const { style, width } = await page.locator('.z-datebox').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, width: cs.outlineWidth };
    });
    expect(style).toBe('solid');
    expect(width).toBe('2px');
  });

  test('selected list row uses the system selection colors (tint would otherwise vanish)', async ({ page }) => {
    await page.goto('/listbox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-listitem', { timeout: 10000 });
    await page.locator('.z-listitem').first().click();
    await page.waitForTimeout(200);
    const sel = await page.locator('.z-listitem.z-selected, .z-listitem.z-listitem-selected').first()
      .evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
    const unsel = await page.locator('.z-listitem:not(.z-selected):not(.z-listitem-selected)').first()
      .evaluate(el => getComputedStyle(el).backgroundColor).catch(() => null);
    // Selected fill must be a real (opaque-ish) color and must differ from an unselected row.
    expect(sel.bg).not.toBe('rgba(0, 0, 0, 0)');
    if (unsel) expect(sel.bg, 'selected row fill must differ from unselected').not.toBe(unsel);
    // Text must not collapse to the same value as the fill.
    expect(sel.color).not.toBe(sel.bg);
  });

  test('elevation-only surfaces gain a border (box-shadow is stripped)', async ({ page }) => {
    await page.goto('/window.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-window', { timeout: 10000 });
    const { style, width } = await page.locator('.z-window').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { style: cs.borderTopStyle, width: cs.borderTopWidth };
    });
    expect(style).toBe('solid');
    expect(width).toBe('1px');
  });

  test('buttons are delineated by a border', async ({ page }) => {
    await page.goto('/button.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-button', { timeout: 10000 });
    const style = await page.locator('.z-button').first().evaluate(el => getComputedStyle(el).borderTopStyle);
    expect(style).toBe('solid');
  });

  // --- tail coverage (the 27 audited components); a representative case per bucket ---

  test('elevation surface (groupbox) gains a border', async ({ page }) => {
    await page.goto('/groupbox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-groupbox', { timeout: 10000 });
    const { style, width } = await page.locator('.z-groupbox').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { style: cs.borderTopStyle, width: cs.borderTopWidth };
    });
    expect(style).toBe('solid');
    expect(width).toBe('1px');
  });

  test('paging current page uses the system selection color', async ({ page }) => {
    await page.goto('/paging.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-paging-selected', { timeout: 10000 });
    const { bg, color } = await page.locator('.z-paging-selected').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe(bg);
  });

  test('calendar selected day keeps a visible filled disc (fill on ::before)', async ({ page }) => {
    await page.goto('/calendar.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-calendar-cell.z-calendar-selected', { timeout: 10000 });
    const discBg = await page.locator('.z-calendar-cell.z-calendar-selected').first()
      .evaluate(el => getComputedStyle(el, '::before').backgroundColor);
    // The disc must be a real fill (Highlight), not the stripped-transparent default.
    expect(discBg).not.toBe('rgba(0, 0, 0, 0)');
  });

  // --- masked-icon fill (reported: spinner arrows vanish under WHCM) ---
  // Lucide/SVG glyphs are drawn as `background-color: currentColor` clipped by a
  // mask. forced-colors force-maps background-color to Canvas (the page bg), not
  // the foreground, so the icon becomes an invisible same-as-background shape.
  // The guard re-points the fill at CanvasText. Assert the fill matches the
  // foreground (CanvasText, read off body text) rather than the Canvas bg.

  test('spinner up/down arrow icons stay visible (fill is foreground, not page bg)', async ({ page }) => {
    await page.goto('/spinner.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-spinner-icon', { timeout: 10000 });
    const { iconFill, canvasText, canvas } = await page.evaluate(() => {
      const icon = getComputedStyle(document.querySelector('.z-icon-angle-up')!, '::before').backgroundColor;
      const canvasText = getComputedStyle(document.body).color;       // CanvasText
      const canvas = getComputedStyle(document.body).backgroundColor; // Canvas
      return { iconFill: icon, canvasText, canvas };
    });
    // The arrow must be painted with the foreground system color, not the bg.
    expect(iconFill).toBe(canvasText);
    expect(iconFill).not.toBe(canvas);
  });

  test('combobox caret icon stays visible (unlayered fill beats the component rule)', async ({ page }) => {
    // combobox re-declares its caret fill at higher specificity in
    // @layer zk-components; the unlayered guard must still win.
    await page.goto('/combobox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-combobox', { timeout: 10000 });
    const { iconFill, canvasText } = await page.evaluate(() => ({
      iconFill: getComputedStyle(document.querySelector('.z-combobox-button .z-icon-caret-down')!, '::before').backgroundColor,
      canvasText: getComputedStyle(document.body).color,
    }));
    expect(iconFill).toBe(canvasText);
  });

  test('selected list check keeps its baked box (icon-fill guard must not clobber it)', async ({ page }) => {
    // The selected-row check is a baked-SVG box (opted out via forced-color-adjust),
    // NOT a mask-currentColor glyph — the icon-fill guard excludes check/radio so it
    // stays a filled box, not a flat CanvasText square.
    await page.goto('/listbox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-listitem', { timeout: 10000 });
    await page.locator('.z-listitem').first().click();
    await page.waitForTimeout(200);
    const check = await page.locator('.z-listitem.z-selected .z-icon-check, .z-listitem.z-listitem-selected .z-icon-check')
      .first().evaluate(el => {
        const cs = getComputedStyle(el, '::before');
        return { fca: cs.forcedColorAdjust, bgImg: cs.backgroundImage };
      }).catch(() => null);
    // If the checkmark column is present, it must remain a baked box (has a bg image
    // and is opted out of the OS palette), not a flat filled square.
    if (check) {
      expect(check.fca).toBe('none');
      expect(check.bgImg).not.toBe('none');
    }
  });

  test('accordion selected tab uses the system selection color', async ({ page }) => {
    await page.goto('/tabbox.zul', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.z-tabbox-accordion .z-tab.z-tab-selected', { timeout: 10000 });
    const { bg, color } = await page.locator('.z-tabbox-accordion .z-tab.z-tab-selected').first().evaluate(el => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe(bg);
  });
});
