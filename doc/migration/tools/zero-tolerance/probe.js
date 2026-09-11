// probe.js <url> <selector>... — print the page's stylesheet hrefs and the computed box of each selector's
// first match (size, position, border, margin, padding, background). Run from the template checkout.
const { chromium } = require('@playwright/test');
(async () => {
  const [url, ...sels] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const sheets = await page.evaluate(() => [...document.styleSheets].map(s => s.href || '(inline)'));
  console.log('stylesheets:'); sheets.forEach(s => console.log('  ' + s));
  for (const sel of sels) {
    const r = await page.evaluate((sel) => {
      const el = document.querySelector(sel); if (!el) return null;
      const cs = getComputedStyle(el), b = el.getBoundingClientRect();
      return { w: b.width, h: b.height, x: b.x, y: b.y, border: cs.border, margin: cs.margin, padding: cs.padding, bg: cs.backgroundColor, cls: el.className };
    }, sel);
    console.log(sel, JSON.stringify(r));
  }
  await browser.close();
})();
