// compare.spec.ts — one test per PNG in $ZERO_SNAP; see compare.config.ts. A baseline that does not
// exist fails with NO-BASELINE before toMatchSnapshot could ever be asked to create it.
// $ZERO_TOLERATED (optional, comma-separated PNG names) lists the evidenced exceptions of the D66 hybrid
// (chat D66, 2026-09-11): those are compared at the template's OWN per-shot tolerance instead of zero —
// gallery-scan.spec.ts's maxDiffPixelRatio 0.01 for *-gallery.png, Playwright's default elsewhere — and
// their test title carries " @tolerated" so summarize-cmp.py reports WITHIN-TOLERANCE, never IDENTICAL.
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SNAP = process.env.ZERO_SNAP!;
const BASE = path.resolve(process.env.ZERO_BASE!);
const files = fs.readdirSync(SNAP).filter(f => f.endsWith('.png')).sort();
const TOLERATED = new Set((process.env.ZERO_TOLERATED || '').split(',').filter(Boolean));

test.describe('zero-tolerance', () => {
  for (const f of files) {
    const tolerated = TOLERATED.has(f);
    const opts = tolerated ? (f.endsWith('-gallery.png') ? { maxDiffPixelRatio: 0.01 } : {}) : { threshold: 0, maxDiffPixels: 0 };
    test(tolerated ? `${f} @tolerated` : f, async () => {
      if (!fs.existsSync(path.join(BASE, f))) throw new Error(`NO-BASELINE ${f}`);
      expect(fs.readFileSync(path.join(SNAP, f))).toMatchSnapshot(f, opts);
    });
  }
});
