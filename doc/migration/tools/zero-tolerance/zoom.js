// zoom.js <png> <x> <y> <w> <h> <out.png> [scale=4] — render a clip of a PNG magnified (nearest-neighbour)
// through Playwright's Chromium, so a few-pixel difference can be inspected without an image library.
// Run from the template checkout (needs its node_modules).
const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const [png, x, y, w, h, out, scale = '4'] = process.argv.slice(2);
  const s = Number(scale), W = Number(w) * s, H = Number(h) * s;
  const data = fs.readFileSync(png).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(`<html><body style="margin:0;overflow:hidden;background:#fff">
    <img src="data:image/png;base64,${data}" style="position:absolute;left:${-Number(x) * s}px;top:${-Number(y) * s}px;
      image-rendering:pixelated;transform-origin:0 0;transform:scale(${s})"></body></html>`);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
  await browser.close();
  console.log('wrote', out);
})();
