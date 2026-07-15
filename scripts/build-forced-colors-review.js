#!/usr/bin/env node
'use strict';

/*
 * Build doc/forced-colors-review.html — a single side-by-side contact sheet
 * (normal | forced-colors) of every preview page, so the whole theme's
 * Windows High-Contrast rendering can be reviewed in one scroll.
 *
 * Inputs (produced by `npm run capture:forced-colors`), flat layout:
 *   doc/screenshots/<page>-forced-colors.png   (required per row)
 *   doc/screenshots/<page>-gallery.png         (normal mode; optional)
 *
 * Pure Node, no dependencies. Run: npm run review:forced-colors
 */

const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.resolve(__dirname, '../doc/screenshots');
const OUT_FILE = path.resolve(__dirname, '../doc/forced-colors-review.html');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  console.error(`No screenshots directory at ${SCREENSHOTS_DIR}. Run "npm run capture:forced-colors" first.`);
  process.exit(1);
}

// Flat layout: pages are derived from <page>-forced-colors.png filenames.
const pages = fs.readdirSync(SCREENSHOTS_DIR)
  .filter(f => f.endsWith('-forced-colors.png'))
  .map(f => f.slice(0, -'-forced-colors.png'.length))
  .sort();

if (pages.length === 0) {
  console.error('No <page>-forced-colors.png files found. Run "npm run capture:forced-colors" first.');
  process.exit(1);
}

// Paths in the HTML are relative to doc/ (where the output file lives).
const rel = (file) => `screenshots/${file}`;

let withNormal = 0;
const rows = pages.map(page => {
  const forced = rel(`${page}-forced-colors.png`);
  const normal = `${page}-gallery.png`;
  const hasNormal = fs.existsSync(path.join(SCREENSHOTS_DIR, normal));
  if (hasNormal) withNormal++;
  const normalCell = hasNormal
    ? `<a href="${rel(normal)}" target="_blank"><img loading="lazy" src="${rel(normal)}" alt="${page} normal"></a>`
    : `<div class="missing">no normal baseline (${normal})</div>`;
  return `      <section class="row" id="${page}">
        <h2>${page}</h2>
        <div class="pair">
          <figure><figcaption>normal</figcaption>${normalCell}</figure>
          <figure><figcaption>forced-colors</figcaption><a href="${forced}" target="_blank"><img loading="lazy" src="${forced}" alt="${page} forced-colors"></a></figure>
        </div>
      </section>`;
}).join('\n');

const toc = pages.map(p => `<a href="#${p}">${p}</a>`).join('\n        ');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forced-Colors Review — Marble theme</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 system-ui, sans-serif; }
  header { position: sticky; top: 0; background: Canvas; border-bottom: 1px solid #8884; padding: 16px 24px; z-index: 1; }
  header h1 { margin: 0 0 4px; font-size: 18px; }
  header p { margin: 0; opacity: .75; }
  nav { padding: 12px 24px; border-bottom: 1px solid #8884; display: flex; flex-wrap: wrap; gap: 6px 12px; }
  nav a { text-decoration: none; opacity: .8; font-size: 12px; }
  nav a:hover { text-decoration: underline; opacity: 1; }
  main { padding: 8px 24px 64px; }
  .row { padding: 24px 0; border-bottom: 1px solid #8884; }
  .row h2 { margin: 0 0 12px; font-size: 16px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
  figure { margin: 0; }
  figcaption { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; opacity: .6; margin-bottom: 6px; }
  img { max-width: 100%; height: auto; display: block; border: 1px solid #8884; background: #fff; }
  .missing { padding: 40px; text-align: center; opacity: .5; border: 1px dashed #8886; }
  @media (max-width: 900px) { .pair { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <header>
    <h1>Forced-Colors Review — Marble theme</h1>
    <p>${pages.length} pages · ${withNormal} with a normal baseline · normal (left) vs Windows High-Contrast emulation (right). Click any image to open full size.</p>
  </header>
  <nav>
        ${toc}
  </nav>
  <main>
${rows}
  </main>
</body>
</html>
`;

fs.writeFileSync(OUT_FILE, html);
console.log(`Wrote ${OUT_FILE}`);
console.log(`  ${pages.length} pages (${withNormal} paired with a normal gallery.png).`);
