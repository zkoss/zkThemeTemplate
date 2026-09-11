// compare.spec.ts — one test per PNG in $ZERO_SNAP; see compare.config.ts. A baseline that does not
// exist fails with NO-BASELINE before toMatchSnapshot could ever be asked to create it.
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SNAP = process.env.ZERO_SNAP!;
const BASE = path.resolve(process.env.ZERO_BASE!);
const files = fs.readdirSync(SNAP).filter(f => f.endsWith('.png')).sort();

test.describe('zero-tolerance', () => {
  for (const f of files) {
    test(f, async () => {
      if (!fs.existsSync(path.join(BASE, f))) throw new Error(`NO-BASELINE ${f}`);
      expect(fs.readFileSync(path.join(SNAP, f))).toMatchSnapshot(f, { threshold: 0, maxDiffPixels: 0 });
    });
  }
});
