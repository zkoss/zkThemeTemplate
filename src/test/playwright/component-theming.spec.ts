import { test, expect, type Locator } from '@playwright/test';

// Component Theme Variables — proof for the button pilot (Tier 1 #1, see
// doc/spec/component-theme-variables.md).
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
const pseudoBgOf = (loc: Locator, pseudo: string) =>
  loc.evaluate((el, p) => getComputedStyle(el, p).backgroundColor, pseudo);

test.describe('Component Theme Variables', () => {
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

  // ── rating: star glyph fill only (no bg/border/radius). Resting stars read
  // --zk-rating-fg; selected/hover swap to --zk-rating-accent (the defining state).
  test('rating — regional accent override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-rating').first();
    const scoped = page.locator('div[style*="--zk-rating-accent"] .z-rating').first();

    // Scoped rating's selected stars pick up the accent override.
    expect(await colorOf(scoped.locator('.z-rating-selected').first())).toBe(SCOPED_PURPLE);

    // Sibling default rating's selected stars are untouched.
    expect(await colorOf(def.locator('.z-rating-selected').first())).not.toBe(SCOPED_PURPLE);
  });

  test('rating — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defSelected = page.locator('.z-rating').first().locator('.z-rating-selected').first();
    expect(await colorOf(defSelected)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every rating instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-rating-accent:#6750a4}' });
    expect(await colorOf(defSelected)).toBe(SCOPED_PURPLE);
  });

  // ── progressmeter: MD3 linear progress (track + fill). Color variants
  // (secondary/success/warning/error) keep their own semantic colors, same
  // treatment as button's color variants — not knob-driven. ─────────────────
  test('progressmeter — regional track/fill override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-progressmeter').first();
    const scoped = page.locator('div[style*="--zk-progressmeter-bg"] .z-progressmeter').first();

    expect(await bgOf(scoped)).toBe('rgb(239, 230, 255)'); // #efe6ff track override
    expect(await bgOf(scoped.locator('.z-progressmeter-image').first())).toBe(SCOPED_PURPLE);

    expect(await bgOf(def)).not.toBe('rgb(239, 230, 255)');
    expect(await bgOf(def.locator('.z-progressmeter-image').first())).not.toBe(SCOPED_PURPLE);
  });

  test('progressmeter — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defFill = page.locator('.z-progressmeter').first().locator('.z-progressmeter-image').first();
    expect(await bgOf(defFill)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every progressmeter instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-progressmeter-fill:#6750a4}' });
    expect(await bgOf(defFill)).toBe(SCOPED_PURPLE);
  });

  // ── paging: pager button shape/fg + selected (current-page) fill/text.
  // Demo uses mold="os" so numbered page buttons (and .z-paging-selected)
  // render — the default mold only shows prev/next + a jump-to-page input,
  // with no page numbers. Disabled buttons are intentionally not knob-driven
  // (same convention as button/input). ──────────────────────────────────────
  test('paging — regional radius/selected override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-paging').first();
    const scoped = page.locator('div[style*="--zk-paging-radius"] .z-paging').first();

    const defSelected = def.locator('.z-paging-selected').first();
    const scopedSelected = scoped.locator('.z-paging-selected').first();

    expect(await radiusOf(scopedSelected)).toBe('4px');
    expect(await bgOf(scopedSelected)).toBe(SCOPED_PURPLE);
    expect(await colorOf(scopedSelected)).toBe('rgb(255, 255, 255)');

    expect(await radiusOf(defSelected)).toBe('9999px'); // stock --zk-shape-corner-full
    expect(await bgOf(defSelected)).not.toBe(SCOPED_PURPLE);
    expect(await colorOf(defSelected)).not.toBe('rgb(255, 255, 255)');
  });

  test('paging — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defSelected = page.locator('.z-paging').first().locator('.z-paging-selected').first();
    expect(await bgOf(defSelected)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every paging instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-paging-selected-bg:#6750a4}' });
    expect(await bgOf(defSelected)).toBe(SCOPED_PURPLE);
  });

  // ── combobutton: split button (filled base) — shares the button family's
  // overlay state model. Toolbar mold is a color variant (like button's
  // outlined/text variants) and disabled stays on base tokens — both
  // intentionally not knob-driven, same convention as button. ─────────────
  test('combobutton — regional bg/fg/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-combobutton-content').first();
    const scoped = page.locator('div[style*="--zk-combobutton-radius"] .z-combobutton-content').first();
    const scopedRoot = page.locator('div[style*="--zk-combobutton-radius"] .z-combobutton').first();

    expect(await radiusOf(scopedRoot)).toBe('9999px');
    expect(await bgOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(page.locator('.z-combobutton').first())).toBe(STOCK_RADIUS);
    expect(await bgOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('combobutton — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defContent = page.locator('.z-combobutton-content').first();
    expect(await bgOf(defContent)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every combobutton instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-combobutton-bg:#6750a4}' });
    expect(await bgOf(defContent)).toBe(SCOPED_PURPLE);
  });

  // ── selectbox: native <select> element (Listbox "select" mold, .z-select).
  // Renders as a single native select (no wrapper); state is a per-state
  // border-color change (no overlay), same model as Input. ──────────────────
  test('selectbox — regional border/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-select').first();
    const scoped = page.locator('div[style*="--zk-selectbox-radius"] .z-select').first();

    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('selectbox — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const def = page.locator('.z-select').first();
    expect(await radiusOf(def)).toBe('4px'); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every selectbox instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-selectbox-radius:0px}' });
    expect(await radiusOf(def)).toBe('0px');
  });

  // ── inputgroup: input + addon(s) combined into a single field. Border color
  // and radius are shared by the addon and the grouped input (one continuous
  // outline); the addon also carries its own fill/text pair. Focus stays on
  // the global focus-ring token (same as button/window/grid), not a knob. ──
  test('inputgroup — regional border/radius/addon override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-inputgroup').first();
    const scoped = page.locator('div[style*="--zk-inputgroup-radius"] .z-inputgroup').first();

    const defAddon = def.locator('.z-inputgroup-text').first();
    const scopedAddon = scoped.locator('.z-inputgroup-text').first();

    expect(await radiusOf(scopedAddon)).toBe('0px');
    expect(await borderColorOf(scopedAddon)).toBe(SCOPED_PURPLE);
    expect(await bgOf(scopedAddon)).toBe('rgb(239, 230, 255)'); // #efe6ff
    expect(await colorOf(scopedAddon)).toBe(SCOPED_PURPLE);

    expect(await radiusOf(defAddon)).toBe('4px'); // stock --zk-shape-input
    expect(await borderColorOf(defAddon)).not.toBe(SCOPED_PURPLE);
    expect(await bgOf(defAddon)).not.toBe('rgb(239, 230, 255)');
    expect(await colorOf(defAddon)).not.toBe(SCOPED_PURPLE);
  });

  test('inputgroup — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defAddon = page.locator('.z-inputgroup').first().locator('.z-inputgroup-text').first();
    expect(await radiusOf(defAddon)).toBe('4px'); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every inputgroup instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-inputgroup-radius:0px}' });
    expect(await radiusOf(defAddon)).toBe('0px');
  });

  // ── calendar: self-contained month grid + nav header. zk-calendar-accent /
  // zk-calendar-accent-fg is a single defining-state pair — it colors the
  // selected day's disc fill (::before) + text, the today ring, and the
  // Today-link label together (same "one knob, several roles" pattern as
  // tab's accent). ──────────────────────────────────────────────────────────
  test('calendar — regional border/radius/accent override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-calendar').first();
    const scoped = page.locator('div[style*="--zk-calendar-radius"] .z-calendar').first();

    const defSelected = def.locator('.z-calendar-selected').first();
    const scopedSelected = scoped.locator('.z-calendar-selected').first();

    // --zk-calendar-accent-fg (on-primary) is #ffffff stock, same as the demo's
    // override value, so it can't distinguish scoped from default here — the
    // disc fill (accent) + shell border/radius already prove region scoping.
    expect(await radiusOf(scoped)).toBe('0px');
    expect(await borderColorOf(scoped)).toBe(SCOPED_PURPLE);
    expect(await pseudoBgOf(scopedSelected, '::before')).toBe(SCOPED_PURPLE);

    expect(await radiusOf(def)).toBe('6px'); // stock --zk-shape-card
    expect(await borderColorOf(def)).not.toBe(SCOPED_PURPLE);
    expect(await pseudoBgOf(defSelected, '::before')).not.toBe(SCOPED_PURPLE);
  });

  test('calendar — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defSelected = page.locator('.z-calendar').first().locator('.z-calendar-selected').first();
    expect(await pseudoBgOf(defSelected, '::before')).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every calendar instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-calendar-accent:#6750a4}' });
    expect(await pseudoBgOf(defSelected, '::before')).toBe(SCOPED_PURPLE);
  });

  // ── toolbar: chrome bar — fill + shared divider-line knob (border-color drives
  // the bar's own edge; the app-bar context variant keeps its own colors, not
  // knob-driven — same convention as combobutton's toolbar mold). ─────────────
  test('toolbar — regional bg/border override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-toolbar').first();
    const scoped = page.locator('div[style*="--zk-toolbar-bg"] .z-toolbar').first();

    expect(await bgOf(scoped)).toBe('rgb(238, 242, 255)'); // #eef2ff
    expect(await borderBottomColorOf(scoped)).toBe(SCOPED_PURPLE);

    expect(await bgOf(def)).not.toBe('rgb(238, 242, 255)');
    expect(await borderBottomColorOf(def)).not.toBe(SCOPED_PURPLE);
  });

  test('toolbar — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const def = page.locator('.z-toolbar').first();
    expect(await borderBottomColorOf(def)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every toolbar instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-toolbar-border-color:#6750a4}' });
    expect(await borderBottomColorOf(def)).toBe(SCOPED_PURPLE);
  });

  // ── slider: MD3 range input (track + fill + thumb). zk-slider-accent covers
  // BOTH the active fill and the thumb (same "one knob, several roles" pattern
  // as tab/calendar's accent); disabled stays on opacity only, not knob-driven
  // (same convention as button/input/rating). ──────────────────────────────
  test('slider — regional track/accent/radius override, sibling untouched', async ({ page }) => {
    const def = page.locator('.z-slider').first();
    const scoped = page.locator('div[style*="--zk-slider-radius"] .z-slider').first();

    const defTrack = def.locator('.z-slider-center').first();
    const scopedTrack = scoped.locator('.z-slider-center').first();
    const defThumb = def.locator('.z-slider-button').first();
    const scopedThumb = scoped.locator('.z-slider-button').first();

    expect(await radiusOf(scopedTrack)).toBe('0px');
    expect(await bgOf(scopedTrack)).toBe('rgb(239, 230, 255)'); // #efe6ff track override
    expect(await bgOf(scopedThumb)).toBe(SCOPED_PURPLE); // accent override (fill + thumb)

    expect(await radiusOf(defTrack)).toBe('9999px'); // stock --zk-shape-corner-full
    expect(await bgOf(defTrack)).not.toBe('rgb(239, 230, 255)');
    expect(await bgOf(defThumb)).not.toBe(SCOPED_PURPLE);
  });

  test('slider — whole-app :root override wins (loaded after norm.css.dsp)', async ({ page }) => {
    const defThumb = page.locator('.z-slider').first().locator('.z-slider-button').first();
    expect(await bgOf(defThumb)).not.toBe(SCOPED_PURPLE); // baseline before override

    // An adopter's :root override, injected after the theme bundle, must win the
    // cascade and reach every slider instance, including the default one.
    await page.addStyleTag({ content: ':root{--zk-slider-accent:#6750a4}' });
    expect(await bgOf(defThumb)).toBe(SCOPED_PURPLE);
  });
});
