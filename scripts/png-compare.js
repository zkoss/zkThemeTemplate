#!/usr/bin/env node
/**
 * png-compare — pixel comparison for the visual A/B harness, with a noise floor that
 * cannot swallow a real change.
 *
 * WHY A NOISE FLOOR IS NEEDED AT ALL
 * ----------------------------------
 * Two captures of BYTE-IDENTICAL theme output are not byte-identical PNGs. Measured on this
 * corpus, repeatedly: a handful of pages differ by 2–42 pixels, always on border-radius arcs
 * and widget edges — Skia quantising antialiased coverage differently between browser
 * PROCESSES (within one process it is stable, which is why the capture spec's
 * shoot-until-stable loop converges). No chromium flag removes it: `--disable-lcd-text`,
 * `--disable-font-subpixel-positioning`, `--font-render-hinting=none`,
 * `--force-color-profile=srgb` and `--deterministic-mode` were all tried; the last one only
 * made page loads erratic.
 *
 * WHY THE FLOOR IS TWO CAPS, BOTH MEASURED
 * ----------------------------------------
 * A plain "N% of pixels may differ" tolerance was rejected: a 1px border on a 200px-wide
 * widget is ~200px ≈ 0.017% of a 1280x900 shot, so any ratio loose enough to absorb the
 * noise also absorbs a real border change. (Marble's own screenshot suite uses
 * maxDiffPixelRatio: 0.01 — 1%, ~11500px — which is far too loose for this job.)
 *
 * So both caps must hold, and both come from measurement rather than taste:
 *   - `maxDelta` 8  — the worst per-channel delta observed was 7, on the corner arc of a
 *     saturated red error border blended against grey. Coverage quantisation scales with
 *     the CONTRAST of the two colours being blended, which is why ±1 was not enough.
 *   - `maxPixels` 64 — the worst count observed was 42, and it does not grow with page
 *     height in practice (the tall pages in this corpus come out identical).
 *
 * Two things keep this honest:
 *   1. Pages classified as `noise` are still PRINTED, with their pixel count, max delta and
 *      bounding box. The floor decides the verdict, never what the reviewer gets to see.
 *   2. `check:cssdiff` remains the main gate. Anything below this floor is, by construction,
 *      a change of at most 64 pixels by at most 8 levels — while every declaration change,
 *      however small, is already caught exactly one layer down.
 *
 * The decoder is deliberately minimal: Playwright emits 8-bit non-interlaced PNG (colour
 * type 2 or 6), which needs only zlib + the five standard row filters. That keeps the
 * harness free of a PNG dependency and lets both the capture spec and the diff step share
 * one comparison.
 */
'use strict';

const zlib = require('zlib');

/** Rasterisation noise floor — see the header. BOTH caps must hold to call it noise. */
const NOISE = { maxDelta: 8, maxPixels: 64 };

function decode(buf) {
	if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
	const width = buf.readUInt32BE(16);
	const height = buf.readUInt32BE(20);
	const bitDepth = buf[24];
	const colorType = buf[25];
	const interlace = buf[28];
	if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
		throw new Error(`unsupported PNG (bitDepth ${bitDepth}, colorType ${colorType}, interlace ${interlace})`);
	}
	const channels = colorType === 2 ? 3 : 4;

	const idat = [];
	for (let o = 8; o + 8 <= buf.length; ) {
		const len = buf.readUInt32BE(o);
		const type = buf.toString('ascii', o + 4, o + 8);
		if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len));
		o += 12 + len;
		if (type === 'IEND') break;
	}
	const raw = zlib.inflateSync(Buffer.concat(idat));

	// Undo the per-row filters. Output is tightly packed `channels` bytes per pixel.
	const stride = width * channels;
	const out = Buffer.allocUnsafe(stride * height);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		const src = (y * (stride + 1)) + 1;
		const dst = y * stride;
		const up = dst - stride;
		for (let i = 0; i < stride; i++) {
			const x = raw[src + i];
			const a = i >= channels ? out[dst + i - channels] : 0;
			const b = y > 0 ? out[up + i] : 0;
			const c = i >= channels && y > 0 ? out[up + i - channels] : 0;
			let v;
			switch (filter) {
				case 0: v = x; break;
				case 1: v = x + a; break;
				case 2: v = x + b; break;
				case 3: v = x + ((a + b) >> 1); break;
				case 4: {
					const p = a + b - c;
					const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
					v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
					break;
				}
				default: throw new Error(`unknown PNG row filter ${filter} on row ${y}`);
			}
			out[dst + i] = v & 0xff;
		}
	}
	return { width, height, channels, data: out };
}

/**
 * @returns {{sizeChanged:boolean, width:number, height:number, pixels:number,
 *            diffPixels:number, maxDelta:number, box:?number[]}}
 */
function compare(bufA, bufB) {
	const a = decode(bufA);
	const b = decode(bufB);
	if (a.width !== b.width || a.height !== b.height) {
		return {
			sizeChanged: true,
			width: a.width, height: a.height,
			otherWidth: b.width, otherHeight: b.height,
			pixels: a.width * a.height, diffPixels: NaN, maxDelta: NaN, box: null,
		};
	}
	const { width, height } = a;
	let diffPixels = 0, maxDelta = 0;
	let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const ia = (y * width + x) * a.channels;
			const ib = (y * width + x) * b.channels;
			let d = 0;
			for (let c = 0; c < 3; c++) {
				const delta = Math.abs(a.data[ia + c] - b.data[ib + c]);
				if (delta > d) d = delta;
			}
			if (d === 0) continue;
			diffPixels++;
			if (d > maxDelta) maxDelta = d;
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	return {
		sizeChanged: false,
		width, height,
		pixels: width * height,
		diffPixels, maxDelta,
		box: diffPixels ? [x0, y0, x1, y1] : null,
	};
}

/** 'identical' | 'noise' | 'differs' */
function classify(m, noise = NOISE) {
	if (m.sizeChanged) return 'differs';
	if (m.diffPixels === 0) return 'identical';
	if (m.maxDelta <= noise.maxDelta && m.diffPixels <= noise.maxPixels) return 'noise';
	return 'differs';
}

function describe(m) {
	if (m.sizeChanged) return `size ${m.width}x${m.height} → ${m.otherWidth}x${m.otherHeight}`;
	if (!m.diffPixels) return 'identical';
	const pct = ((m.diffPixels / m.pixels) * 100).toFixed(3);
	return `${m.diffPixels}px (${pct}%) maxΔ ${m.maxDelta} box ${m.box.join(',')}`;
}

module.exports = { decode, compare, classify, describe, NOISE };
