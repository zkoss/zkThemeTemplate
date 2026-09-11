// Row 3.20 probe (D205-A, F61): under forced colors a SELECTED tree row / organigram node is filled with `Highlight`
// (tokens/_forced-colors.css, (2a)) and its keyboard focus ring is `--zk-focus-ring` = `Highlight` too, so the ring
// vanishes. What makes this deterministic (diagnosed 2026-09-11, see gates/3.20.md):
//   - computed styles cannot show it — Chromium reports the row's forced background as Canvas while painting Highlight;
//   - the `<tr>` fill itself paints Highlight only intermittently under the emulation — F61's flake — so the fill is NOT
//     the reference. The reference is the emulated `Highlight` colour read off a throw-away div, blended over Canvas
//     (what a Highlight ring looks like on the page), and the measurement is the ring's own pixels: the mode of dozens of
//     samples along the ring band on three edges (band centre = |outline-offset| − width/2 inside the border edge for an
//     inset ring; the harness's 3 px formula samples the fill instead).
// Pre-fix: ring ≈ Highlight (distance to the reference well under 150) → both tests fail with "Highlight on Highlight" (RED).
// After the (2a focus) rule covers the two families: ring = HighlightText (white), distance > 300 (GREEN).
// The selection class is added by hand and `:focus-visible` is forced through CDP, exactly as the harness does.
import { test, expect } from '@playwright/test';

const FAMILIES = [
  { name: 'tree row',        page: 'tree',       focus: '.z-treerow', on: 'self',   cls: 'z-treerow-selected' },
  { name: 'organigram node', page: 'organigram', focus: '.z-orgnode', on: 'parent', cls: 'z-orgitem-selected' },
] as const;

type RGB = [number, number, number];
const dist = (a: RGB, b: RGB) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

for (const fam of FAMILIES) {
  test(`${fam.page}: ${fam.name} — focus ring colour differs from Highlight`, async ({ page, context }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(`/${fam.page}.zul`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(fam.focus, { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready.then(() => true));

    // Reference colours under the emulation: Highlight (possibly translucent) blended over Canvas, and HighlightText.
    const ref = await page.evaluate(() => {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:-100px;top:-100px;width:10px;height:10px;background-color:Highlight;color:HighlightText';
      document.body.appendChild(d);
      const parse = (s: string) => { const p = (s.match(/[\d.]+/g) ?? []).map(Number); return { rgb: [p[0], p[1], p[2]] as [number, number, number], a: p.length === 4 ? p[3] : 1 }; };
      const hl = parse(getComputedStyle(d).backgroundColor);
      const ht = parse(getComputedStyle(d).color);
      const canvasEl = document.createElement('div'); canvasEl.style.cssText = 'position:fixed;left:-100px;top:-100px;width:10px;height:10px;background-color:Canvas';
      document.body.appendChild(canvasEl);
      const cv = parse(getComputedStyle(canvasEl).backgroundColor);
      d.remove(); canvasEl.remove();
      const blend = hl.rgb.map((c, i) => Math.round(c * hl.a + cv.rgb[i] * (1 - hl.a))) as [number, number, number];
      return { highlight: getComputedStyle(document.body).color && hl, highlightOnCanvas: blend, highlightText: ht.rgb, canvas: cv.rgb, matches: matchMedia('(forced-colors: active)').matches };
    });
    expect(ref.matches, 'forced-colors emulation is not active').toBe(true);
    expect(dist(ref.highlightOnCanvas, ref.highlightText), 'Highlight and HighlightText are not distinguishable in this emulation').toBeGreaterThan(300);

    const tagged = await page.evaluate((f) => {
      const el = document.querySelector(f.focus);
      if (!el) return false;
      const target = f.on === 'parent' ? el.parentElement : el;
      if (!target) return false;
      target.classList.add(f.cls);
      el.setAttribute('data-probe', '1');
      (el as HTMLElement).scrollIntoView({ block: 'center' });
      return true;
    }, fam);
    expect(tagged, `no ${fam.focus} on ${fam.page}.zul`).toBe(true);

    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-probe="1"]' });
    expect(nodeId, 'CDP could not find the tagged element').toBeTruthy();
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus-visible'] });
    await page.waitForTimeout(200);

    const geo = await page.evaluate(() => {
      const el = document.querySelector('[data-probe="1"]')!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, scrollX: window.scrollX, scrollY: window.scrollY,
               width: parseFloat(cs.outlineWidth) || 0, offset: parseFloat(cs.outlineOffset) || 0, style: cs.outlineStyle };
    });
    expect(geo.style, 'no focus outline at all — a different defect').not.toBe('none');
    expect(geo.width, 'zero-width focus outline').toBeGreaterThan(0);

    // Screenshot the element's box plus a margin (page coordinates = viewport + scroll), keep it as the gate's evidence,
    // then sample it in-page through a canvas.
    const m = 4;
    const clip = { x: Math.max(0, geo.x + geo.scrollX - m), y: Math.max(0, geo.y + geo.scrollY - m), width: geo.w + 2 * m, height: geo.h + 2 * m };
    const png = (await page.screenshot({ clip, scale: 'css', path: `${__dirname}/${fam.page}-clip.png` })).toString('base64');
    const sampled = await page.evaluate(async ({ png, clip, geo, m }) => {
      const img = new Image();
      await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('png decode')); img.src = 'data:image/png;base64,' + png; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const sx = img.width / clip.width, sy = img.height / clip.height;
      const px = (x: number, y: number) => { const d = ctx.getImageData(Math.min(img.width - 1, Math.round(x * sx)), Math.min(img.height - 1, Math.round(y * sy)), 1, 1).data; return [d[0], d[1], d[2]] as [number, number, number]; };
      // Ring band centre, in clip coordinates (the element box starts at m,m). Inset ring (offset + width <= 0): the band
      // lies between |offset| inside the border edge and |offset| − width inside it, so its centre is |offset| − width/2 inside.
      const inward = geo.offset + geo.width <= 0;
      const d = inward ? Math.abs(geo.offset) - geo.width / 2 : geo.offset + geo.width / 2;
      const L = m, T = m, R = m + geo.w, B = m + geo.h;
      const ring: [number, number, number][] = [], fill: [number, number, number][] = [];
      const N = 24;
      for (let i = 2; i < N - 1; i++) {
        const y = T + (geo.h * i) / N, x = L + (geo.w * i) / N;
        ring.push(px(inward ? L + d : L - d, y));           // left edge
        ring.push(px(inward ? R - d : R + d, y));           // right edge
        ring.push(px(x, inward ? T + d : T - d));           // top edge
      }
      for (let i = 1; i < 12; i++) for (let j = 1; j < 4; j++) fill.push(px(L + 6 + ((geo.w - 12) * i) / 12, T + 6 + ((geo.h - 12) * j) / 4));
      const mode = (arr: [number, number, number][]) => {
        const cnt = new Map<string, number>(); let best = '', n = 0;
        for (const p of arr) { const k = p.join(','); const v = (cnt.get(k) ?? 0) + 1; cnt.set(k, v); if (v > n) { n = v; best = k; } }
        return { rgb: best.split(',').map(Number) as [number, number, number], share: n / arr.length };
      };
      return { ring: mode(ring), fill: mode(fill), ringN: ring.length, d, inward, B };
    }, { png, clip, geo, m });

    const toHighlight = dist(sampled.ring.rgb, ref.highlightOnCanvas);
    const toText = dist(sampled.ring.rgb, ref.highlightText);
    console.log(`${fam.page}: ring mode ${sampled.ring.rgb.join(',')} (${Math.round(sampled.ring.share * 100)}% of ${sampled.ringN}, band ${sampled.d}px ${sampled.inward ? 'inside' : 'outside'}); ` +
                `Highlight-on-Canvas ${ref.highlightOnCanvas.join(',')}, HighlightText ${ref.highlightText.join(',')}; ` +
                `ring→Highlight ${toHighlight}, ring→HighlightText ${toText}; interior mode ${sampled.fill.rgb.join(',')} (informational)`);
    expect(sampled.ring.share, 'no dominant ring colour — the ring band was not where the geometry says').toBeGreaterThan(0.4);
    expect(toHighlight, 'Highlight on Highlight: the focus ring paints the selection colour, not HighlightText').toBeGreaterThan(300);
  });
}
