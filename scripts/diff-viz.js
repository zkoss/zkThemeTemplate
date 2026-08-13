#!/usr/bin/env node
/**
 * diff-viz — turn png-compare's NUMBERS into PICTURES.
 *
 * `png-compare.js` answers "how much do these differ" (pixel count, max channel delta,
 * bounding box). That is the right output for a gate, and the wrong output for a human
 * asking "I looked at both screenshots and I cannot see any difference — where is it?".
 * A sub-perceptual delta is, by definition, one you cannot review by looking at the two
 * shots side by side. This renders it at a scale where you can.
 *
 * Three artefacts per pair:
 *   1. <tag>-locator.png   the A shot, full size, with the diff bbox ringed in magenta.
 *                          Answers WHERE on the page.
 *   2. <tag>-zoom.png      A | B | amplified-diff, cropped to the bbox and magnified with
 *                          nearest-neighbour so one source pixel is one visible block.
 *                          Answers WHAT changed.
 *   3. stdout              per-pixel A→B channel values inside the bbox.
 *                          Answers EXACTLY WHAT, in the same units as the noise floor.
 *
 * The amplification is declared, never hidden: the third panel maps each pixel's delta
 * through a fixed gain, so a Δ13 that is invisible on screen becomes saturated red ink.
 * That panel is a MEASUREMENT DISPLAY, not a screenshot — do not read colour from it.
 * Panels 1 and 2 are untouched source pixels.
 *
 * Why an encoder lives here: png-compare.js only decodes, and the harness is deliberately
 * free of a PNG dependency. Playwright emits 8-bit non-interlaced PNG, and writing one back
 * out needs only zlib plus filter-0 rows, so the whole encoder is ~30 lines and keeps the
 * "no new dependency" property that made the decoder worth hand-writing in the first place.
 *
 * Usage:
 *   node scripts/diff-viz.js <a.png> <b.png> <outDir> <tag>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { decode, compare, describe } = require('./png-compare.js');

/** Diff panel gain. 16 makes the smallest interesting delta (Δ1) faintly visible and
 *  anything at or above the noise floor (Δ8) unmistakable. */
const GAIN = 16;
/** Nearest-neighbour magnification. One source pixel becomes a ZOOM×ZOOM block. */
const ZOOM = 28;
/** Source pixels of surrounding context kept around the bbox, so the changed pixels can be
 *  read against the glyph or border they belong to rather than floating in isolation. */
const PAD = 9;

// ── minimal PNG encoder: 8-bit RGB, filter 0 ─────────────────────────────────
let CRC_TABLE = null;
function crc32(buf) {
	if (!CRC_TABLE) {
		CRC_TABLE = new Int32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			CRC_TABLE[n] = c;
		}
	}
	let c = -1;
	for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
	return c ^ -1;
}

function encode(width, height, rgb) {
	const stride = width * 3;
	const raw = Buffer.allocUnsafe((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0; // filter: none
		rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	}
	const chunk = (type, data) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(body) >>> 0);
		return Buffer.concat([len, body, crc]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;  // bit depth
	ihdr[9] = 2;  // colour type: truecolour
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

// ── helpers ──────────────────────────────────────────────────────────────────
const px = (img, x, y) => {
	const i = (y * img.width + x) * img.channels;
	return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

function paint(dst, dstWidth, dx, dy, w, h, get) {
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const [r, g, b] = get(x, y);
			const o = ((dy + y) * dstWidth + (dx + x)) * 3;
			dst[o] = r; dst[o + 1] = g; dst[o + 2] = b;
		}
	}
}

// ── main ─────────────────────────────────────────────────────────────────────
const [, , fileA, fileB, outDir, tag] = process.argv;
if (!fileA || !fileB || !outDir || !tag) {
	console.error('usage: node scripts/diff-viz.js <a.png> <b.png> <outDir> <tag>');
	process.exit(2);
}

const bufA = fs.readFileSync(fileA);
const bufB = fs.readFileSync(fileB);
const a = decode(bufA);
const b = decode(bufB);
const m = compare(bufA, bufB);

console.log(`${tag}: ${describe(m)}`);
if (m.sizeChanged) {
	console.log('  size differs — nothing to overlay, compare the two shots directly');
	process.exit(0);
}
if (!m.diffPixels) process.exit(0);

fs.mkdirSync(outDir, { recursive: true });
const [bx0, by0, bx1, by1] = m.box;

// 1 ── locator
{
	const { width, height } = a;
	const out = Buffer.allocUnsafe(width * height * 3);
	paint(out, width, 0, 0, width, height, (x, y) => px(a, x, y));
	const rx0 = Math.max(0, bx0 - 4), ry0 = Math.max(0, by0 - 4);
	const rx1 = Math.min(width - 1, bx1 + 4), ry1 = Math.min(height - 1, by1 + 4);
	const mark = (x, y) => {
		const o = (y * width + x) * 3;
		out[o] = 255; out[o + 1] = 0; out[o + 2] = 255;
	};
	for (let t = 0; t < 2; t++) {
		for (let x = rx0; x <= rx1; x++) {
			mark(x, Math.max(0, ry0 - t));
			mark(x, Math.min(height - 1, ry1 + t));
		}
		for (let y = ry0; y <= ry1; y++) {
			mark(Math.max(0, rx0 - t), y);
			mark(Math.min(width - 1, rx1 + t), y);
		}
	}
	fs.writeFileSync(path.join(outDir, `${tag}-locator.png`), encode(width, height, out));
}

// 2 ── zoom card: A | B | amplified diff
{
	const cx0 = Math.max(0, bx0 - PAD), cy0 = Math.max(0, by0 - PAD);
	const cx1 = Math.min(a.width - 1, bx1 + PAD), cy1 = Math.min(a.height - 1, by1 + PAD);
	const cw = cx1 - cx0 + 1, ch = cy1 - cy0 + 1;
	const panelW = cw * ZOOM, panelH = ch * ZOOM;
	const GAP = 12;
	const W = panelW * 3 + GAP * 4;
	const H = panelH + GAP * 2;
	const out = Buffer.alloc(W * H * 3, 0x20);

	const panel = (idx, get) => paint(out, W, GAP + idx * (panelW + GAP), GAP, panelW, panelH,
		(x, y) => get(cx0 + Math.floor(x / ZOOM), cy0 + Math.floor(y / ZOOM)));

	panel(0, (x, y) => px(a, x, y));
	panel(1, (x, y) => px(b, x, y));
	panel(2, (x, y) => {
		const [ar, ag, ab] = px(a, x, y);
		const [br, bg, bb] = px(b, x, y);
		const d = Math.max(Math.abs(ar - br), Math.abs(ag - bg), Math.abs(ab - bb));
		if (!d) return [16, 16, 16];
		const v = Math.min(255, d * GAIN);
		return [255, 255 - v, 255 - v]; // white → saturated red as the delta grows
	});
	fs.writeFileSync(path.join(outDir, `${tag}-zoom.png`), encode(W, H, out));
	console.log(`  crop ${cx0},${cy0} ${cw}x${ch}  zoom ${ZOOM}x  diff-panel gain ${GAIN}x`);
}

// 3 ── per-pixel dump, capped so a large diff does not flood the terminal
const LIMIT = 40;
console.log('  x     y     A(r,g,b)        B(r,g,b)        Δmax');
let shown = 0;
for (let y = by0; y <= by1 && shown < LIMIT; y++) {
	for (let x = bx0; x <= bx1 && shown < LIMIT; x++) {
		const [ar, ag, ab] = px(a, x, y);
		const [br, bg, bb] = px(b, x, y);
		const d = Math.max(Math.abs(ar - br), Math.abs(ag - bg), Math.abs(ab - bb));
		if (!d) continue;
		shown++;
		console.log(`  ${String(x).padEnd(6)}${String(y).padEnd(6)}` +
			`${`${ar},${ag},${ab}`.padEnd(16)}${`${br},${bg},${bb}`.padEnd(16)}${d}`);
	}
}
if (m.diffPixels > shown) console.log(`  … ${m.diffPixels - shown} more`);
