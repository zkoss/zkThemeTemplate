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
const borderBottomColorOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).borderBottomColor);
const colorOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).color);

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

  // ── panel + groupbox: surface containers ─────────────────────────────────
  // Panel renders border-less by default (.z-panel-noborder), so assert the fill
  // + radius knobs (border-color has no border to paint on the stock panel).
  test('panel — regional surface/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-panel').first();
    const scoped = page.locator('div[style*="--zk-panel-radius"] .z-panel').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await bgOf(scoped)).toBe('rgb(238, 242, 255)'); // #eef2ff

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await bgOf(def)).not.toBe('rgb(238, 242, 255)');
  });

  test('groupbox — regional frame override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-groupbox').first();
    const scoped = page.locator('div[style*="--zk-groupbox-radius"] .z-groupbox').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── combobox: outlined field (dropdown popup/selection also knob-driven) ──
  test('combobox — regional field override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-combobox-input').first();
    const scoped = page.locator('div[style*="--zk-combobox-radius"] .z-combobox-input').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── dropdown-input family (datebox/timebox/spinner/bandbox): wrapper-border
  // model — border on the root wrapper, focus = inset ring. Same field knobs as
  // combobox; radius + resting border-color are the observable A/B here. ────────
  test('datebox — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-datebox').first();
    const scoped = page.locator('div[style*="--zk-datebox-radius"] .z-datebox').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('timebox — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-timebox').first();
    const scoped = page.locator('div[style*="--zk-timebox-radius"] .z-timebox').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('spinner — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-spinner').first();
    const scoped = page.locator('div[style*="--zk-spinner-radius"] .z-spinner').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('bandbox — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-bandbox').first();
    const scoped = page.locator('div[style*="--zk-bandbox-radius"] .z-bandbox').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── tab: nav chrome + active accent (indicator + selected label) ──────────
  test('tabbox — regional accent/border override, sibling untouched', async ({ page }) => {
    const defBar = page.locator('.z-tabs').first();
    const defSel = page.locator('.z-tab-selected').first();
    const scopedBox = page.locator('div[style*="--zk-tab-accent"]');
    const scopedBar = scopedBox.locator('.z-tabs').first();
    const scopedSel = scopedBox.locator('.z-tab-selected').first();

    expect(await borderBottomColorOf(scopedBar)).toBe(SCOPED_PURPLE);
    expect(await colorOf(scopedSel)).toBe(SCOPED_PURPLE); // selected label = accent

    expect(await borderBottomColorOf(defBar)).not.toBe(SCOPED_PURPLE);
    expect(await colorOf(defSel)).not.toBe(SCOPED_PURPLE);
  });

  // ── menu: menubar surface (popup/selected-item also knob-driven) ──────────
  test('menubar — regional surface override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-menubar').first();
    const scoped = page.locator('div[style*="--zk-menubar-bg"] .z-menubar').first();

    expect(await bgOf(scoped)).toBe(SCOPED_PURPLE);
    expect(await bgOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── avatar: base defaults hoisted from the .z-avatar element to :root, so a
  // region override now reaches it (chip base is hoisted too, but ZK stamps a
  // default severity class that element-shadows it — not regionally demonstrable).
  test('avatar — regional fill override (hoisted base knob), sibling untouched', async ({ page }) => {
    const def = page.locator('.z-avatar').first();
    const scoped = page.locator('div[style*="--zk-avatar-bg"] .z-avatar').first();
    expect(await bgOf(scoped)).toBe(SCOPED_PURPLE);
    expect(await bgOf(def)).not.toBe(SCOPED_PURPLE);
  });

  // ── badge: default (info) fill is routed through the base --zk-badge-bg (no
  // .z-badge-info rule), so a region override reaches a default badge; explicit
  // non-default severities pin --zk-badge-bg on the indicator and stay semantic.
  test('badge — default fill region-overridable, non-default severity pinned', async ({ page }) => {
    const scopedBox = page.locator('div[style*="--zk-badge-bg"]');
    const scopedDefault = scopedBox.locator('.z-badge-info > .z-badge-indicator').first();
    const scopedSuccess = scopedBox.locator('.z-badge-success > .z-badge-indicator').first();
    const outsideDefault = page.locator('.z-badge-info > .z-badge-indicator').first();

    // Default (info) badge inside the region takes the override.
    expect(await bgOf(scopedDefault)).toBe(SCOPED_PURPLE);
    // A non-default severity keeps its semantic color despite the region override.
    expect(await bgOf(scopedSuccess)).not.toBe(SCOPED_PURPLE);
    // A default badge outside the region is untouched.
    expect(await bgOf(outsideDefault)).not.toBe(SCOPED_PURPLE);
  });
});
