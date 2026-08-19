import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
const { compare, classify, describe } = require('../../../scripts/png-compare.js');

// Pop-up pass of the visual A/B harness — see doc/visual-ab-harness.md §7.
//
// WHY THIS FILE EXISTS
// --------------------
// ab-capture.spec.ts does `goto` then screenshot, and NOTHING else: no click, no hover, no
// widget API call. So every rule that only ever matches an element the user has to OPEN was
// structurally invisible to the A/B — not merely under-sensitive, absent. Measured against
// `baseline/`, that is ~180 selector occurrences: .z-nav-popup (28), .z-menupopup (25),
// .z-tbeditor-dropdown (26), .z-daterangebox-popup* (~25), plus the combobox / bandbox /
// datebox / timepicker / chosenbox / cascader / searchbox / colorbox / popup / toolbar /
// slider / drawer panels.
//
// This is a different question from §6's coverage count. §6 asks "is the .css.dsp SERVED?"
// (80/85). This asks "does anything on the page ever MATCH the rules inside it?" A file can
// be served in full and still have a third of its selectors never touch an element.
//
// HOW IT DIFFERS FROM ab-capture, AND WHY EACH DIFFERENCE IS FORCED
// ----------------------------------------------------------------
// 1. NO_MOTION is injected BEFORE the pop-up is opened, not after the page has settled. A
//    pop-up opens with a transition, so this is the ordering that keeps the opening itself out
//    of the captured frames rather than relying on shoot-until-stable to outlast it. It was
//    checked that this does NOT stop any pop-up from opening: the four zkmax panels that look
//    transition-driven (timepicker, cascader, searchbox, colorbox) open identically with and
//    without it, so the ordering costs nothing.
// 2. Opening is done through the widget's own JS API wherever one exists, NOT by clicking.
//    A click leaves the cursor parked on the trigger, and ZK adds -hover/-seld to whatever
//    the cursor covers. If a theme change nudges the pop-up by a few pixels a DIFFERENT item
//    becomes hovered, which would report as a large difference having nothing to do with the
//    rule that changed. Where no API exists the trigger is a click, and the cursor is parked at
//    0,0 immediately AFTER it: "the trigger is outside the panel" does not hold at every
//    geometry — on the mobile project the toolbar overflow panel opens ON TOP of the ellipsis
//    button, and one button inside came out highlighted in one capture and not the next
//    (4406px, maxΔ 145 — pure harness noise, caught by the mobile selftest). `holdCursor` is the
//    documented exception for a panel that closes once the cursor leaves.
// 3. The shot is CLIPPED to the pop-up's own box plus padding, not fullPage. Two reasons, both
//    measured elsewhere in this harness: a pop-up is detached to <body> and absolutely
//    positioned, so one opening below the fold extends the document and shifts the whole page
//    (§4's "fullPage over-sensitivity", but guaranteed rather than occasional); and §5.1 showed
//    a real change to a rare, small element gets swallowed by the noise floor when it is
//    diluted across a full page. A 200x300 panel in its own PNG is at the sensitive end.
//    The blind spot this accepts: the clip FOLLOWS the pop-up, so a change that only MOVES it
//    is invisible here. Anchor geometry is what positions it, and that is in the at-rest shots.
// 4. Every scenario names the selector it must make visible, and exactly ONE element must
//    match it visibly. A scenario whose trigger silently stopped working would otherwise
//    capture a plausible-looking shot of the page behind it — the §2.2 failure mode, where a
//    harness that measured nothing reports agreement.

const MARBLE_WEB = requireEnv('AB_MARBLE_WEB');
const EXTRA_WEB = requireEnv('AB_EXTRA_WEB');
const OUT = requireEnv('AB_OUT');

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — run via scripts/ab-visual.js, not playwright directly`);
  return v;
}

/** How the pop-up is brought on screen. */
type Trigger =
  /**
   * Call a method on the ZK widget. `where` is a JS expression over the widget `w`, used to
   * pick an instance by what it IS rather than by where it sits: `w._numberOfMonths === 3`
   * survives a corpus edit that reorders the page, `index: 11` does not — and it silently
   * picked the wrong widget the first time this file was run, because the disabled instances
   * are filtered out first and every later index shifted.
   */
  | { via: 'widget'; sel: string; method: string; args?: unknown[]; where?: string; index?: number }
  /** Real click. Only where the widget exposes no usable open API. */
  | { via: 'click'; sel: string; index?: number }
  /**
   * Hover to reveal a control, then click it. The mesh column-menu caret is `display:none`
   * until its header is hovered (measured: 0x0 at rest, 34x48 on hover), so a plain click
   * waits out its timeout on a hidden element.
   */
  | { via: 'reveal'; hover: string; click: string; index?: number }
  /** Press and hold: the Slider value bubble only exists while the knob is being dragged. */
  | { via: 'drag'; sel: string; dx: number };

type Scenario = {
  /** Output file is popup__<id>.png. */
  id: string;
  /** Corpus page, without .zul. */
  page: string;
  /** The selector this scenario exists to render. Exactly one element must match it visibly. */
  expect: string;
  trigger: Trigger;
  /** Extra room around the pop-up box, for box-shadow. */
  pad?: number;
  /**
   * Keep the cursor on the trigger instead of parking it at 0,0. Only for pop-ups that CLOSE
   * when it leaves; the value is the measurement that proves this one does. Safe only because
   * the trigger sits outside the panel, so holding the cursor still hovers nothing inside it.
   */
  holdCursor?: string;
  /**
   * Projects where this pop-up cannot be produced, keyed by project name, value = the measured
   * reason. Same contract as ab-capture's SKIP: a skip without a reason is indistinguishable
   * from a scenario nobody noticed was broken. Skipping writes no PNG, and `diff` compares
   * per project, so the other project's coverage is unaffected.
   */
  skip?: Record<string, string>;
};

// Every entry was verified against the running app before being written here — the trigger,
// the selector, and that exactly one element becomes visible. Notes record what was measured
// when the obvious approach did not work.
const SCENARIOS: Scenario[] = [
  // ---- zul.inp / zul.db text-input drop-downs -------------------------------------------
  { id: 'combobox-default', page: 'combobox', expect: '.z-combobox-popup',
    trigger: { via: 'widget', sel: '.z-combobox', method: 'open' } },
  // The Comboitem variants are the only place .z-comboitem-text / description / icon are all
  // reachable. Picked by what the first item HAS, not by position: `index: 11` looked right
  // from reading the page and was wrong, because the two disabled comboboxes are filtered out
  // before indexing.
  { id: 'combobox-description', page: 'combobox', expect: '.z-combobox-popup',
    trigger: { via: 'widget', sel: '.z-combobox', where: '!!(w.firstChild && w.firstChild._description)', method: 'open' } },
  { id: 'combobox-icon', page: 'combobox', expect: '.z-combobox-popup',
    trigger: { via: 'widget', sel: '.z-combobox', where: '!!(w.firstChild && w.firstChild._iconSclass)', method: 'open' } },
  { id: 'bandbox-default', page: 'bandbox', expect: '.z-bandbox-popup',
    trigger: { via: 'widget', sel: '.z-bandbox', method: 'open' } },
  // Datebox has setOpen but no open(): zul.db.Datebox does not inherit ComboWidget's alias.
  { id: 'datebox-calendar', page: 'datebox', expect: '.z-datebox-popup',
    trigger: { via: 'widget', sel: '.z-datebox', method: 'setOpen', args: [true] } },
  { id: 'datebox-today-link', page: 'datebox', expect: '.z-datebox-popup',
    trigger: { via: 'widget', sel: '.z-datebox', where: 'w._showTodayLink', method: 'setOpen', args: [true] } },
  { id: 'datebox-week-of-year', page: 'datebox', expect: '.z-datebox-popup',
    trigger: { via: 'widget', sel: '.z-datebox', where: 'w._weekOfYear', method: 'setOpen', args: [true] } },
  { id: 'timepicker-default', page: 'timepicker', expect: '.z-timepicker-popup',
    trigger: { via: 'widget', sel: '.z-timepicker', method: 'open' } },
  { id: 'daterangebox-default', page: 'daterangebox', expect: '.z-daterangebox-popup',
    trigger: { via: 'widget', sel: '.z-daterangebox', method: 'setOpen', args: [true] } },
  { id: 'daterangebox-three-months', page: 'daterangebox', expect: '.z-daterangebox-popup',
    trigger: { via: 'widget', sel: '.z-daterangebox', where: 'w._numberOfMonths === 3', method: 'setOpen', args: [true] } },
  // .z-daterangebox-popup-times only exists with showTime.
  { id: 'daterangebox-show-time', page: 'daterangebox', expect: '.z-daterangebox-popup',
    trigger: { via: 'widget', sel: '.z-daterangebox', where: 'w._showTime', method: 'setOpen', args: [true] } },
  // Chosenbox.open() throws "Cannot read properties of undefined (reading 'style')" when the
  // input has never been focused — measured. Clicking the input is the working path.
  { id: 'chosenbox-default', page: 'chosenbox', expect: '.z-chosenbox-popup',
    trigger: { via: 'click', sel: '.z-chosenbox-input' } },
  { id: 'cascader-default', page: 'cascader', expect: '.z-cascader-popup',
    trigger: { via: 'widget', sel: '.z-cascader', method: 'open' } },
  { id: 'searchbox-default', page: 'searchbox', expect: '.z-searchbox-popup',
    trigger: { via: 'widget', sel: '.z-searchbox', method: 'open' } },
  { id: 'searchbox-multiple', page: 'searchbox', expect: '.z-searchbox-popup',
    trigger: { via: 'widget', sel: '.z-searchbox', where: 'w._multiple', method: 'open' } },
  // zkex.inp.Colorbox names it openPopup, not open. It also carries .z-colorpalette-popup.
  { id: 'colorbox-palette', page: 'colorbox', expect: '.z-colorbox-popup',
    trigger: { via: 'widget', sel: '.z-colorbox', method: 'openPopup' } },

  // ---- menus ---------------------------------------------------------------------------
  { id: 'menubar-menupopup', page: 'menubar', expect: '.z-menupopup',
    trigger: { via: 'widget', sel: '.z-menu', method: 'open' } },
  { id: 'combobutton-menupopup', page: 'combobutton', expect: '.z-menupopup',
    trigger: { via: 'widget', sel: '.z-combobutton', method: 'open' } },

  // ---- floating panels -----------------------------------------------------------------
  // <popup> renders no DOM at all until opened, so .z-popup / .z-popup-content were never in
  // any at-rest shot. The trigger buttons carry popup="p1"; a click is the only public path.
  { id: 'popup-basic', page: 'popup', expect: '.z-popup',
    trigger: { via: 'click', sel: '.z-button' },
    holdCursor:
      'ZK opens a plain <popup> AT THE POINTER, and it reads the pointer late — so parking the ' +
      'cursor races the positioning: the panel landed at 0,0 in most runs and at the button in ' +
      'others, which the mobile selftest caught as 13230px / 71.5% of the shot between two ' +
      'captures of identical theme bytes. With the cursor held the origin is stable 5/5 on both ' +
      'projects (69,57 desktop / 66,54 mobile). Confirmpopup does NOT need this: it places ' +
      'itself against its target rather than the pointer, and is 0-differing with the park' },
  // confirmpopup.zul ALSO renders static .z-confirmpopup mock-ups that the at-rest shots
  // already cover; `body > .z-confirmpopup` isolates the real widget, which is the only one
  // whose arrow and placement are computed rather than hard-coded in the page.
  { id: 'confirmpopup-real', page: 'confirmpopup', expect: 'body > .z-confirmpopup',
    trigger: { via: 'click', sel: '.z-button' } },

  // ---- overlays with a mask ------------------------------------------------------------
  // Clip is the whole viewport here by construction: .z-drawer-open contains the mask.
  { id: 'drawer-right', page: 'drawer', expect: '.z-drawer-open',
    trigger: { via: 'widget', sel: '.z-drawer', where: "w._position === 'right'", method: 'open' } },
  { id: 'drawer-left', page: 'drawer', expect: '.z-drawer-open',
    trigger: { via: 'widget', sel: '.z-drawer', where: "w._position === 'left'", method: 'open' } },
  { id: 'drawer-top', page: 'drawer', expect: '.z-drawer-open',
    trigger: { via: 'widget', sel: '.z-drawer', where: "w._position === 'top'", method: 'open' } },
  { id: 'drawer-bottom', page: 'drawer', expect: '.z-drawer-open',
    trigger: { via: 'widget', sel: '.z-drawer', where: "w._position === 'bottom'", method: 'open' } },

  // ---- navigation / toolbars -----------------------------------------------------------
  // The biggest single surface (.z-nav-popup, 28 occurrences). Three triggers were measured:
  // setOpen(true) expands the collapsed Nav INLINE and produces no pop-up at all; hover
  // produces it on desktop but nothing under touch emulation (ZK sets zk.mobile=1 from the UA
  // and the hover affordance is suppressed); a CLICK produces it on both. So click it is —
  // one trigger, both projects, and the cursor ends up on the rail item, which is outside the
  // panel, so nothing inside the panel is hovered.
  { id: 'nav-collapsed-popup', page: 'navbar', expect: '.z-nav-popup',
    trigger: { via: 'click', sel: '.z-navbar-collapsed .z-nav .z-nav-content' },
    holdCursor:
      'even click-opened, the panel is cursor-maintained on the desktop project: parking the ' +
      'cursor let it survive waitForPopup and then close during the shot ("pop-up went away ' +
      'mid-capture", both capture passes). The cursor stays on the rail item at x~40 while the ' +
      'panel starts at x=78, so nothing inside the panel is hovered — and the desktop selftest ' +
      'is 0-differing with it held. Under touch emulation it stays open either way' },
  // The toolbar itself already carries .z-toolbar-overflowpopup at rest; the PANEL
  // (.z-toolbar-popup) needs the ellipsis button clicked.
  { id: 'toolbar-overflow-popup', page: 'toolbar', expect: '.z-toolbar-popup',
    trigger: { via: 'click', sel: '.z-toolbar-overflowpopup-button' } },
  // Both .z-tbeditor-dropdown panels exist at rest but display:none, so they contributed
  // nothing to any at-rest shot.
  { id: 'tbeditor-formatting-dropdown', page: 'tbeditor', expect: '.z-tbeditor-dropdown',
    trigger: { via: 'click', sel: '.z-tbeditor-formatting-button' },
    skip: {
      'ab-capture-mobile':
        'the dropdown cannot be opened under touch emulation: the button is present and hittable ' +
        '(35x35 at 138,37) but click, tap, dblclick and raw mouse down/up all leave both panels ' +
        'display:none. Trumbowyg drives this menu itself, so it is the editor library that ' +
        'suppresses it, not the theme — and .z-tbeditor-* is fully covered by the desktop project',
    } },

  // ---- mesh column menus ---------------------------------------------------------------
  // These need a corpus page of their own (abpopup/column-menu.zul, staged from this branch by
  // ab-visual.js) because NOTHING in Marble's corpus sets `menupopup`, which left the whole
  // surface with no element to match. The page pays off twice: the at-rest pass now covers the
  // head modifier and the caret (.z-columns-menupopup, .z-listhead-menupopup, .z-column-button,
  // .z-listheader-button — 5 CSS occurrences each), and these two scenarios cover the panel.
  //
  // The panel is a zul.mesh.ColumnMenupopup, a Menupopup subclass, so it lands on .z-menupopup —
  // the same selector menubar uses, but with different content (sort / group / column-visibility
  // items). Its labels render as "Unknown message code: 271125xx": `msgzul` resolves no message
  // in this app, which is PRE-EXISTING and not caused by this page — `msgzul.GRID_ASC` reads the
  // same on stock grid-header.zul and menubar.zul. It is identical on both A/B sides, so it costs
  // nothing here; it is only worth knowing before someone reports the page as broken.
  { id: 'grid-column-menu', page: 'abpopup/column-menu', expect: '.z-menupopup',
    trigger: { via: 'reveal', hover: '.z-column', click: '.z-column-button' } },
  { id: 'listbox-column-menu', page: 'abpopup/column-menu', expect: '.z-menupopup',
    trigger: { via: 'reveal', hover: '.z-listheader', click: '.z-listheader-button' } },

  // ---- transient-while-interacting -----------------------------------------------------
  // .z-slider-popup is the value bubble; it exists only between mousedown and mouseup, so the
  // shot is taken with the button still held.
  { id: 'slider-drag-popup', page: 'slider', expect: '.z-slider-popup',
    trigger: { via: 'drag', sel: '.z-slider-button', dx: 40 } },
];

// Pop-up surfaces that exist in the theme CSS but CANNOT be reached from this corpus. Kept in
// code rather than only in prose so that the list is next to the scenarios it qualifies, and
// every entry states what was measured. None of these is a scenario we forgot.
const UNREACHABLE = new Map<string, string>([
  ['.z-selectbox (open list)', 'zul.wgt.Selectbox renders a native <select>; the expanded list is drawn by the OS, is not in the DOM, and no theme rule can reach it. Not a gap — not a surface'],
  ['.z-timebox-popup .z-timebox-wheel-body', 'zul.db.Timebox exposes no open/setOpen on the desktop client and its button is an up/down spinner. The wheel body belongs to the tablet mold; the shared .z-{combobox,bandbox,datebox,timebox}-popup rule is already covered by the three siblings above'],
  ['.z-goldenlayout-dropdown', 'all 7 .lm_tabdropdown are display:none — GoldenLayout only shows the tab dropdown when a stack header overflows, which does not happen at 1280x900 with the corpus layout'],
  ['.z-treecols-menupopup', 'does not exist: org.zkoss.zul.Treecols has no setMenupopup (the page 500s if you set it), and the theme CSS has no treecols equivalent either — only columns and listhead. Not a gap'],
  ['.z-portallayout-popup*', 'the portal nav pop-up is a small-screen affordance; not produced by portallayout.zul at either project geometry'],
  ['.z-confirmpopup-* (static classes)', 'ALREADY COVERED at rest: confirmpopup.zul renders 19 static mock-ups, 9 of them visible, so these selectors were never part of the gap. Only the real widget is captured above'],
  ['.z-coachmark-open / -mask', 'ALREADY COVERED at rest: coachmark.zul leaves one coachmark open on load'],
  ['.z-toolbar-overflowpopup / -on', 'ALREADY COVERED at rest: the class sits on the toolbar element itself, not on the panel'],
]);

const NO_MOTION = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  scroll-behavior: auto !important;
}`;

const zkIdle = (p: Page | import('@playwright/test').Frame) =>
  p.waitForFunction(() => {
    const zk = (window as any).zk;
    return !!zk && !zk.loading;
  });

async function trigger(page: Page, s: Scenario) {
  const t = s.trigger;
  if (t.via === 'widget') {
    const err = await page.evaluate(o => {
      const zk = (window as any).zk;
      const els = Array.from(document.querySelectorAll(o.sel)).filter(e => !/-disabled\b/.test((e as HTMLElement).className));
      let ws = els.map(e => zk.Widget.$(e)).filter(Boolean) as any[];
      if (o.where) {
        const pred = new Function('w', `return (${o.where})`) as (w: unknown) => boolean;
        ws = ws.filter(w => { try { return !!pred(w); } catch { return false; } });
      }
      const w = ws[o.index ?? 0];
      const which = `${o.sel}${o.where ? ` where ${o.where}` : ''} #${o.index ?? 0}`;
      if (!w) return `no widget for ${which} — ${ws.length} candidate(s) after filtering`;
      if (typeof w[o.method] !== 'function') return `widget ${w.className} has no ${o.method}()`;
      w[o.method](...(o.args ?? []));
      return null;
    }, t);
    if (err) throw new Error(`trigger failed: ${err}`);
    return;
  }
  if (t.via === 'reveal') {
    const i = t.index ?? 0;
    await page.locator(t.hover).nth(i).hover();
    return page.locator(t.click).nth(i).click();
  }
  const loc = page.locator(t.sel).nth((t as { index?: number }).index ?? 0);
  if (t.via === 'click') return loc.click();
  // drag: hold the knob down so the value bubble stays up while the shot is taken
  const box = await loc.boundingBox();
  if (!box) throw new Error(`trigger failed: ${t.sel} has no box`);
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + t.dx, cy, { steps: 4 });
}

/**
 * The pop-up's box in PAGE coordinates, inflated by `pad` for the box-shadow and clamped to
 * the document — or the reason it is not computable yet.
 *
 * Requiring EXACTLY ONE visible match is the scenario's own guard, and it is not theoretical:
 * several pages pre-render one hidden pop-up per widget (timepicker.zul has 15, colorbox 5),
 * so Playwright's `locator(sel).first()` resolves to a HIDDEN one and waits out its timeout
 * while the pop-up that was actually opened sits right there. Eight scenarios failed that way
 * on the first run. Counting instead of taking the first also makes a corpus change that leaves
 * two pop-ups open a failure rather than a coin flip over which one gets captured.
 *
 * This one function is BOTH the wait condition and the clip, so the frame that gets captured is
 * provably the frame that satisfied the wait.
 */
async function popupClip(page: Page, s: Scenario) {
  const pad = s.pad ?? 24;
  const r = await page.evaluate(([sel, pad]) => {
    const els = Array.from(document.querySelectorAll(sel as string)) as HTMLElement[];
    const shown = els.filter(e => {
      const b = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return b.width > 1 && b.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    if (shown.length !== 1) return { err: `${shown.length} visible element(s) match "${sel}" (${els.length} in DOM) — exactly 1 expected` };
    const b = shown[0].getBoundingClientRect();
    const p = pad as number;
    const doc = document.documentElement;
    const x = Math.max(0, Math.floor(b.left + window.scrollX - p));
    const y = Math.max(0, Math.floor(b.top + window.scrollY - p));
    return {
      x, y,
      width: Math.min(Math.ceil(b.width + p * 2), Math.max(doc.scrollWidth, window.innerWidth) - x),
      height: Math.min(Math.ceil(b.height + p * 2), Math.max(doc.scrollHeight, window.innerHeight) - y),
    };
  }, [s.expect, pad] as const);
  return r;
}

/** Poll `popupClip` until the pop-up is there, reporting the last obstacle if it never is. */
async function waitForPopup(page: Page, s: Scenario, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const r = await popupClip(page, s);
    if (!('err' in r)) return r;
    if (Date.now() >= deadline) throw new Error(`pop-up never appeared — ${r.err}`);
    await page.waitForTimeout(100);
  }
}

/**
 * Same contract as ab-capture's shootStable — keep shooting until two consecutive frames agree
 * to within the rasterisation noise floor, and write NOTHING if they never do, so `diff`
 * reports the scenario as `missing` instead of it passing on an untrustworthy frame.
 */
async function shootStable(page: Page, file: string, s: Scenario) {
  const shot = async () => {
    const clip = await popupClip(page, s);
    if ('err' in clip) throw new Error(`pop-up went away mid-capture — ${clip.err}`);
    return page.screenshot({ fullPage: true, clip, animations: 'disabled', caret: 'hide' });
  };
  let prev = await shot();
  let last = '';
  for (let round = 0; round < 8; round++) {
    await page.waitForTimeout(250);
    const next = await shot();
    const m = compare(prev, next);
    if (classify(m) !== 'differs') {
      fs.writeFileSync(file, next);
      return;
    }
    last = describe(m);
    prev = next;
  }
  throw new Error(
    `pop-up never reached two stable consecutive frames (last delta: ${last}) — widen the wait ` +
    `or move the scenario to UNREACHABLE in ab-popup.spec.ts with the measured reason`
  );
}

test.beforeAll(() => {
  // The corpus lives in the Marble worktree; a scenario naming a page that is no longer there
  // must fail loudly rather than be skipped.
  const roots = [MARBLE_WEB, EXTRA_WEB];
  const missing = [...new Set(SCENARIOS.map(s => s.page))]
    .filter(p => !roots.some(r => fs.existsSync(path.join(r, `${p}.zul`))));
  expect(missing, `corpus pages named by SCENARIOS but absent from ${roots.join(' and ')}`).toEqual([]);
  const dupes = SCENARIOS.map(s => s.id).filter((id, i, a) => a.indexOf(id) !== i);
  expect(dupes, 'duplicate scenario ids would overwrite each other').toEqual([]);
  expect(UNREACHABLE.size, 'the unreachable list must stay documented').toBeGreaterThan(0);
  fs.mkdirSync(OUT, { recursive: true });
});

test.describe('ab-popup', () => {
  for (const s of SCENARIOS) {
    test(`popup:${s.id}`, async ({ page }) => {
      const cannot = s.skip?.[test.info().project.name];
      test.skip(!!cannot, cannot);

      await page.goto(`/${s.page}.zul`, { waitUntil: 'domcontentloaded' });
      await zkIdle(page);
      await page
        .waitForFunction(() => Array.from(document.images).every(i => i.complete), null, { timeout: 5_000 })
        .catch(() => {});
      // BEFORE the trigger — see note 1 at the top of this file.
      await page.addStyleTag({ content: NO_MOTION });
      await page.evaluate(() => document.fonts.ready.then(() => true));

      await trigger(page, s);

      // Note 2: get the cursor off the pop-up before anything is measured. `drag` is exempt —
      // its knob is still held down and moving would drag it. Parking BEFORE waitForPopup is
      // deliberate: if a pop-up cannot survive the cursor leaving, that must fail loudly here
      // rather than be captured in whichever state the race happened to leave it.
      if (s.trigger.via !== 'drag' && !s.holdCursor) await page.mouse.move(0, 0);

      // Opening can round-trip to the server (onOpen), which is also what fills some panels.
      await waitForPopup(page, s);
      await zkIdle(page);
      await page.evaluate(() => document.fonts.ready.then(() => true));

      await shootStable(page, path.join(OUT, `popup__${s.id}.png`), s);
    });
  }
});
