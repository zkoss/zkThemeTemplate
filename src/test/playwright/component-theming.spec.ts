import { test, expect, type Locator } from '@playwright/test';

// Component Theming API — proof for the button pilot (Tier 1 #1, see
// doc/spec/component-theming-api.md).
// Verifies the --zk-button-* knob contract:
//   1. a REGIONAL override (custom props on a container) restyles only that
//      subtree's buttons, leaving sibling defaults untouched;
//   2. a WHOLE-APP override (:root, injected after norm.css.dsp) wins the cascade;
//   3. ZERO REGRESSION — an un-overridden button renders stock Marble values;
//   4. disabled treatment is preserved inside an overridden region.
// Requires the preview app on http://localhost:8080
//   withjdk.sh 17 mvn test exec:java@preview-app

const PAGE = '/component-theming.zul';
const SCOPED_PURPLE = 'rgb(103, 80, 164)'; // #6750a4 set on the scoped container
const STOCK_RADIUS = '4px';                // --zk-shape-button (extra-small corner)

const radiusOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
const bgOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const borderColorOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).borderTopColor);

test.describe('component theming API — button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
    // Kill transitions so getComputedStyle reads settled values, not a start frame.
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  });

  test('regional override restyles scoped buttons only', async ({ page }) => {
    const def = page.getByRole('button', { name: 'Default Primary' });
    const scoped = page.getByRole('button', { name: 'Scoped Primary' });

    // Scoped button picks up BOTH knobs (radius + fill).
    expect(await radiusOf(scoped)).toBe('9999px');
    expect(await bgOf(scoped)).toBe(SCOPED_PURPLE);

    // Sibling default is UNTOUCHED — the override lives on the scoped box and is
    // inherited only by its subtree, never leaking up to the default row.
    expect(await radiusOf(def)).toBe(STOCK_RADIUS);
    expect(await bgOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('disabled button keeps its disabled treatment inside a scoped region', async ({ page }) => {
    const scopedDisabled = page.getByRole('button', { name: 'Scoped Disabled' });
    // The disabled rule doesn't read the bg knob → stays disabled-container, not purple.
    expect(await bgOf(scopedDisabled)).not.toBe(SCOPED_PURPLE);
  });

  test('whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const def = page.getByRole('button', { name: 'Default Primary' });
    expect(await radiusOf(def)).toBe(STOCK_RADIUS); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade (unlayered vs unlayered → source order) and reach the default button.
    await page.addStyleTag({ content: ':root{--zk-button-radius:0px}' });
    expect(await radiusOf(def)).toBe('0px');
  });

  // ── input: per-state border-color model ──────────────────────────────────
  test('input — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-textbox').first();
    const scoped = page.locator('div[style*="--zk-input-radius"] .z-textbox').first();

    expect(await radiusOf(scoped)).toBe('12px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── window: surface + chrome model (elevation stays mode-driven) ──────────
  test('window — regional surface/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-window').first();
    const scoped = page.locator('div[style*="--zk-window-radius"] .z-window').first();

    expect(await radiusOf(scoped)).toBe('16px');
    expect(await bgOf(scoped)).toBe('rgb(238, 242, 255)'); // #eef2ff

    expect(await radiusOf(def)).toBe('4px'); // stock extra-small corner
    expect(await bgOf(def)).not.toBe('rgb(238, 242, 255)');
  });

  // ── grid: outlined-table lines + fills ────────────────────────────────────
  test('grid — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-grid').first();
    const scoped = page.locator('div[style*="--zk-grid-radius"] .z-grid').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── listbox: data table + row selection ──────────────────────────────────
  test('listbox — regional frame + selection override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-listbox').first();
    const scoped = page.locator('div[style*="--zk-listbox-radius"] .z-listbox').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);
    expect(await bgOf(scoped.locator('.z-listitem-selected').first())).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
    expect(await bgOf(def.locator('.z-listitem-selected').first())).not.toBe(SCOPED_PURPLE);
  });

  // ── tree: tree table + row selection ──────────────────────────────────────
  test('tree — regional frame + selection override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-tree').first();
    const scoped = page.locator('div[style*="--zk-tree-radius"] .z-tree').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);
    expect(await bgOf(scoped.locator('.z-treerow-selected').first())).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
    expect(await bgOf(def.locator('.z-treerow-selected').first())).not.toBe(SCOPED_PURPLE);
  });
});
