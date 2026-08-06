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

// A GIF is not a CSS animation: neither `animation: none` nor Playwright's
// `animations: 'disabled'` freezes it, so an animated GIF anywhere in the shot keeps the page
// from ever reaching two equal frames. Six pages behaved exactly that way on the first
// selftest (progressmeter, component-theming and four usecase pages), changing by up to 2.7%
// of the viewport between consecutive frames.
//
// This started as a hard-coded list of the theme's five animated GIFs under zul/img/misc/
// (prgmeter-anim.gif and progress{,-dark}-{32,72}.gif). That list was incomplete in the
// direction that matters: the CORPUS has animated GIFs too — toolbar.zul shows ZK's own
// ~./img/network.gif — which made `toolbar` flake roughly one run in three (255px / maxΔ 59,
// and once a page that never stabilised at all). Deciding by CONTENT instead of by path covers
// both trees and cannot go stale when either side adds an asset.
//
// NETSCAPE2.0 is the looping Application Extension block — the same marker used to enumerate
// the theme's five. A multi-frame GIF without it would slip through; neither tree has one.
//
// Aborting leaves the element's box and background-COLOUR intact — only the moving texture is
// gone, and it is gone identically on both sides of the A/B. The blind spot is therefore a
// binary asset that this branch's LESS→CSS conversion never touches, while everything CSS
// controls about the widget (size, border, radius, colour) stays visible.
// `;jsessionid=…` is a PATH parameter, so an asset URL does not necessarily end at `.gif` —
// ZK rewrites it in that way until the session cookie comes back. Anchoring on `$` alone
// silently missed every GIF requested early in a page, network.gif included.
const GIF = /\.gif(?:[;?]|$)/i;

async function abortAnimatedGifs(page: import('@playwright/test').Page) {
  await page.route(GIF, async route => {
    let res;
    try {
      res = await route.fetch();
    } catch {
      return route.continue(); // the request would have failed anyway; let the page see that
    }
    const body = await res.body();
    return body.includes('NETSCAPE2.0') ? route.abort() : route.fulfill({ response: res, body });
  });
}

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

const NO_MOTION = `*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  scroll-behavior: auto !important;
}`;

/**
 * Settle one CHILD frame. Whatever a child frame renders is inside the fullPage shot, but
 * none of the page-level waits reach into it: waitForFunction, addStyleTag and fonts.ready
 * all run in the main frame only. So on iframe.zul — which embeds ~./html.zul in a real
 * <iframe> — whether the inner ZK page had painted was never waited on at all. The L4
 * review measured that as a reproducible 6855px / maxΔ255 false difference between two
 * captures of the SAME theme bytes. See doc/visual-ab-harness.md §5 #7.
 *
 * `zk` is REQUIRED in the main frame but only awaited-if-present here: a child frame is not
 * necessarily a ZK page. A frame that detaches mid-settle throws, failing the page — which
 * `diff` then reports as `missing`. That is the intended loud failure, not a reason to catch.
 */
async function settleFrame(frame: import('@playwright/test').Frame) {
  await frame.waitForFunction(() => {
    const zk = (window as any).zk;
    return document.readyState === 'complete' && (!zk || !zk.loading);
  });
  await frame
    .waitForFunction(() => Array.from(document.images).every(i => i.complete), null, { timeout: 5_000 })
    .catch(() => {});
  await frame.addStyleTag({ content: NO_MOTION });
  await frame.evaluate(() => document.fonts.ready.then(() => true));
}

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
      await abortAnimatedGifs(page);

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
      await page.addStyleTag({ content: NO_MOTION });

      // The Inter web font loading late shifts the whole page vertically ~7px. Without
      // this wait the same build screenshotted twice does not match itself.
      await page.evaluate(() => document.fonts.ready.then(() => true));

      // Every wait above stops at the main frame. Child frames are in the shot too.
      for (const frame of page.frames()) {
        if (frame !== page.mainFrame()) await settleFrame(frame);
      }

      // usecase/x → usecase__x, so every shot is one flat file per page.
      await shootStable(page, path.join(OUT, `${name.replace(/\//g, '__')}.png`));
    });
  }
});
