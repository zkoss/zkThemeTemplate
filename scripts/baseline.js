#!/usr/bin/env node
/**
 * baseline — build the immutable reference output for the drop-LESS conversion.
 *
 * The whole verification strategy rests on `baseline/` being the CSS that master's toolchain
 * produced from UNCONVERTED source. The dangerous failure mode is regenerating it later from a
 * partly-converted tree: `cssdiff` would then compare the conversion against itself, report
 * `files differing: 0`, and prove nothing. So this refuses to overwrite an existing baseline,
 * and records the commit it was built from.
 *
 *   node scripts/baseline.js           build (fails if baseline/ already exists)
 *   node scripts/baseline.js --force   rebuild anyway (only valid on an unconverted tree)
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');

const OUT = 'baseline';
const force = process.argv.includes('--force');

if (fs.existsSync(OUT) && !force) {
	const stamp = fs.existsSync(`${OUT}/.built-from`) ? fs.readFileSync(`${OUT}/.built-from`, 'utf8').trim() : '(no stamp)';
	console.error(`refusing to overwrite the existing baseline.\n\n${stamp}\n`);
	console.error('The baseline must stay the output of UNCONVERTED source; rebuilding it from a');
	console.error('converted tree would make every later cssdiff gate vacuous.');
	console.error(`\nTo rebuild deliberately: rm -rf ${OUT} && node scripts/baseline.js`);
	process.exit(2);
}

const lessFiles = execFileSync('bash', ['-c', 'find src/main/resources/web -name "*.less" | wc -l']).toString().trim();
if (lessFiles === '0') {
	console.error('no .less files found — this tree is already converted; baseline would be empty.');
	process.exit(2);
}

fs.rmSync(OUT, { recursive: true, force: true });
execFileSync('npx', ['zklessc', '-s', 'src/main/resources/web', '-o', `${OUT}/`, '--compress'], { stdio: 'inherit' });

const commit = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim();
const dirty = execFileSync('git', ['status', '--porcelain', 'src/main/resources/web']).toString().trim();
const less = execFileSync('node', ['-e', "process.stdout.write(require('less/package.json').version)"]).toString().trim();
const engine = execFileSync('node', ['-e', "process.stdout.write(require('zkless-engine/package.json').version)"]).toString().trim();

const stamp = [
	`commit:        ${commit}`,
	`src dirty:     ${dirty ? 'YES — baseline may not match any commit' : 'no'}`,
	`zkless-engine: ${engine}`,
	`less:          ${less}`,
	`.less sources: ${lessFiles}`,
].join('\n');

fs.writeFileSync(`${OUT}/.built-from`, `${stamp}\n`);
console.log(`\n${stamp}`);
