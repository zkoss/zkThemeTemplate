import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
const { compare, classify, describe } = require('../../../scripts/png-compare.js');

// Capture pass of the visual A/B harness — see doc/visual-ab-harness.md.
//
// The page corpus is Marble's, discovered by SCANNING its compiled test resources at
// collection time. Nothing is copied into this branch: L2.4 says reuse Marble's preview
// pages and Playwright, do not move the corpus in. A page Marble adds is covered on the
// next run with no edit here.

const MARBLE_WEB = requireEnv('AB_MARBLE_WEB'); // <marble>/target/test-classes/web
const OUT = requireEnv('AB_OUT');               // target/ab-visual/shots/<label>

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — run via scripts/ab-visual.js, not playwright directly`);
  return v;
}

// Pages a screenshot cannot capture deterministically. EVERY entry carries its reason:
// an unexplained skip is indistinguishable from a page we forgot about.
//
// Seeded from the non-deterministic classes only (hardware, media, network, animation).
// Layout/size-based skips are deliberately NOT pre-guessed — `ab-visual.js selftest`
// is what proves a page unstable, and anything it catches gets added here WITH the
// measured reason. See doc/visual-ab-harness.md §4.
const SKIP = new Map<string, string>([
  ['camera', 'requests a webcam — permission prompt / live video frames'],
  ['barcodescanner', 'requests a webcam — same as camera'],
  ['captcha', 'renders a fresh random image on every request'],
  ['video', 'media element — frame shown depends on decode timing'],
  ['audio', 'media element — transport UI depends on decode timing'],
  ['fileupload', 'opens the OS file dialog on interaction; upload widget shows transient state'],
  // Measured, not guessed — see doc/visual-ab-harness.md §5.
  ['preview', 'aggregate overview page: 174404px tall, 11MB per shot, ~20s to load. Every component it shows also has its own page, so it adds cost without coverage — and a diff inside it cannot be localised'],
]);

// The theme ships FIVE animated GIFs, all under zul/img/misc/: prgmeter-anim.gif (the
// .z-progressmeter background) and progress{,-dark}-{32,72}.gif (busy indicators). A GIF is
// not a CSS animation, so neither `animation: none` nor Playwright's
// `animations: 'disabled'` freezes it — six pages (progressmeter, component-theming and
// four usecase pages) never reached a stable frame, changing by up to 2.7% of the viewport
// with full-range channel deltas between consecutive frames.
//
// Aborting the request leaves the element's box and background-COLOUR intact — only the
// moving texture is gone. The blind spot is therefore one binary asset that this branch's
// LESS→CSS conversion never touches, while everything CSS controls about the widget
// (size, border, radius, colour) stays visible.
const ANIMATED_ASSETS = /\/zul\/img\/misc\/(prgmeter-anim|progress(-dark)?-(32|72))\.gif/;

function discover(): string[] {
  const zuls = (dir: string, prefix = '') =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter(f => f.endsWith('.zul'))
          .map(f => prefix + f.slice(0, -'.zul'.length))
      : [];
  return [...zuls(MARBLE_WEB), ...zuls(path.join(MARBLE_WEB, 'usecase'), 'usecase/')]
    .filter(name => !SKIP.has(name))
    .sort();
}

const pages = discover();

const SHOT = { fullPage: true, animations: 'disabled', caret: 'hide' } as const;

/**
 * Screenshot only once the page has STOPPED CHANGING: keep shooting until two consecutive
 * frames agree to within the rasterisation noise floor.
 *
 * A fixed settle delay is not enough. The first selftest run had 14/115 pages differing
 * between two captures of the SAME theme bytes — async ZK sizing, late layout, one page 3px
 * shorter, one iframe that had loaded in one run and not the other.
 *
 * The comparison is `png-compare`'s, not `Buffer.equals`: requiring byte equality between
 * consecutive frames left 6 pages never converging at all, because Skia's ±1 quantisation of
 * antialiased edges also varies frame to frame. See scripts/png-compare.js for why the noise
 * floor is a per-channel delta and not a pixel-count tolerance.
 *
 * If it never stabilises, NO png is written and the test fails. That is deliberate: a shot
 * we cannot trust must show up in `diff` as `missing`, not as an unexplained difference. The
 * fix is then an explicit SKIP entry with a reason, or a better wait — never a
 * silently-accepted unstable frame.
 */
async function shootStable(page: import('@playwright/test').Page, file: string) {
  let prev = await page.screenshot(SHOT);
  let last = '';
  for (let round = 0; round < 8; round++) {
    await page.waitForTimeout(250);
    const next = await page.screenshot(SHOT);
    const m = compare(prev, next);
    if (classify(m) !== 'differs') {
      fs.writeFileSync(file, next);
      return;
    }
    last = describe(m);
    prev = next;
  }
  throw new Error(
    `page never reached two stable consecutive frames (last delta: ${last}) — either widen ` +
    `the wait or add it to SKIP in ab-capture.spec.ts with the measured reason`
  );
}

test.beforeAll(() => {
  // A corpus that silently shrank to nothing would otherwise pass as "0 pages differing".
  expect(pages.length, `no .zul pages found under ${MARBLE_WEB}`).toBeGreaterThan(50);
  fs.mkdirSync(OUT, { recursive: true });
});

test.describe('ab-capture', () => {
  for (const name of pages) {
    test(name, async ({ page }) => {
      await page.route(ANIMATED_ASSETS, route => route.abort());

      // networkidle HANGS here: ZK keeps an AU channel open on the usecase SPA host.
      await page.goto(`/${name}.zul`, { waitUntil: 'domcontentloaded' });

      // ZK builds the widget tree client-side; zk.loading reaching 0 is the generic
      // "the page finished rendering itself" signal, independent of page content.
      await page.waitForFunction(() => {
        const zk = (window as any).zk;
        return !!zk && !zk.loading;
      });

      // Images settled — `complete` goes true on error too, which is the point: avatar.zul
      // deliberately points one avatar at a missing file to show the label fallback, and
      // whether that fallback had painted yet was the difference between two runs.
      // Best-effort: a page holding a never-resolving image must not hang the whole run,
      // and the shoot-until-stable loop below is the backstop either way.
      await page
        .waitForFunction(() => Array.from(document.images).every(i => i.complete), null, { timeout: 5_000 })
        .catch(() => {});

      // Kill transitions and animations before measuring anything. This trades away
      // visibility of transition/animation changes (declaration-level — covered by
      // check:cssdiff) for a deterministic frame.
      await page.addStyleTag({
        content: `*, *::before, *::after {
          transition: none !important;
          animation: none !important;
          scroll-behavior: auto !important;
        }`,
      });

      // The Inter web font loading late shifts the whole page vertically ~7px. Without
      // this wait the same build screenshotted twice does not match itself.
      await page.evaluate(() => document.fonts.ready.then(() => true));

      // usecase/x → usecase__x, so every shot is one flat file per page.
      await shootStable(page, path.join(OUT, `${name.replace(/\//g, '__')}.png`));
    });
  }
});
