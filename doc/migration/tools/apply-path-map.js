#!/usr/bin/env node
//
// apply-path-map.js — apply the path-rewrite map (item 3.2) to files copied into `zk` (P3 items 3.5, 3.6,
// 3.7+3.8, 3.10–3.14, 3.19).
//
// WHY: the skill, the agents, doc/spec and doc/contracts cite template-relative paths that resolve against the
// wrong repository, silently, once a session is rooted in `zk`. The map says what each string becomes. A
// Generator that applied the map by hand would have to READ every page it rewrites (the working-set budget) and
// could apply a family prefix twice ("zul/zul/src/…"). This tool does one single-pass, longest-match-first
// substitution over an explicit file list and never reads a file into an agent's context.
//
// Authored by the Planner (P3 session), not by a Generator — the Generator runs it, the Evaluator re-checks.
//
// Usage:
//   node apply-path-map.js --map <path-rewrite-map.md> [--map <second-map.md>] [--fixes <stale-fixes.tsv>]
//                          [--dry-run] [--check] -- <file> [<file> …]
//     --map      a map in the 3.2 table format; MAP and OUTPUT rows are applied, others ignored (may repeat)
//     --fixes    TAB-separated `source<TAB>replacement` lines (# comments allowed): the STALE-row fixes ruled by
//                D201-A and the hand-ruled F63 rows; applied in the same single pass
//     --dry-run  print what would change (file, count) and touch nothing
//     --check    exit 1 if any MAP/OUTPUT/fixes SOURCE string is still present in the files (the Evaluator's grep)
//
// Rules:
//   * one pass: every occurrence of any source string is replaced exactly once (a target is never re-scanned);
//   * longest source first, so `src/main/resources/web/js/zul/wgt/css/` wins over `src/main/resources/web/`;
//   * identity rows (target == source) are kept as protective no-op matches so a shorter rule never fires inside them;
//   * a source string is matched literally (no regex), anywhere in the text — the map's row set was built from
//     the same literal tokens (check-path-map.js), so a false hit would have been a row there first;
//   * files are rewritten only when their content changes; encoding is UTF-8; line endings untouched.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const opts = { maps: [], fixes: [], dryRun: false, check: false, files: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--map') opts.maps.push(argv[++i]);
  else if (a === '--fixes') opts.fixes.push(argv[++i]);
  else if (a === '--dry-run') opts.dryRun = true;
  else if (a === '--check') opts.check = true;
  else if (a === '--') { opts.files.push(...argv.slice(i + 1)); break; }
  else opts.files.push(a);
}
if (!opts.maps.length || !opts.files.length) {
  console.error('usage: apply-path-map.js --map <map.md> [--map …] [--fixes <tsv>] [--dry-run|--check] -- <files…>');
  process.exit(2);
}

function parseMap(file) {
  const rows = [];
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    // | `source` | DISPOSITION | `target` or — | notes |
    const m = /^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT|STALE|DROP|DEFER)\s*\|\s*(`([^`]+)`|—)\s*\|/.exec(line);
    if (!m) continue;
    const src = m[1], disp = m[2], tgt = m[4] || null;
    // identity rows (target == source) are kept as protective no-op matches: a longer identity string such as
    // `.claude/skills/marble-theme/scripts/probe.js` must win over the shorter fix rule `scripts/probe.js`
    // that would otherwise match inside it and double the prefix.
    if ((disp === 'MAP' || disp === 'OUTPUT') && tgt) rows.push({ src, tgt, from: path.basename(file) });
  }
  return rows;
}
function parseFixes(file) {
  const rows = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [src, tgt] = line.split('\t');
    if (!src || tgt === undefined) { console.error(`fixes: bad line: ${line}`); process.exit(2); }
    rows.push({ src, tgt, from: path.basename(file) });
  }
  return rows;
}

const rules = [...opts.maps.flatMap(parseMap), ...opts.fixes.flatMap(parseFixes)];
const seen = new Map();
for (const r of rules) {
  if (seen.has(r.src) && seen.get(r.src) !== r.tgt) {
    console.error(`conflict: '${r.src}' → '${seen.get(r.src)}' and '${r.tgt}'`); process.exit(2);
  }
  seen.set(r.src, r.tgt);
}
const sources = [...seen.keys()].sort((a, b) => b.length - a.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A source matches only where a path token can start: not when preceded by a path character. `zk/zul/src/main/…`
// and `ZK10/zkcml/zkmax/src/main/…` in the skill are already zk-side paths and must stay untouched (throw-away run,
// 2026-09-11: without this guard `src/main/resources/` doubled to `zul/zul/src/main/resources/`).
const re = new RegExp('(?<![\\w/.-])(?:' + sources.map(esc).join('|') + ')', 'g');
// --check: a leftover is a source string that is NOT part of an already-written target — remove every target string
// first (longest first), then look for sources raw, so `zul/src/main/resources/web/` never reads as a leftover
// `src/main/resources/web/` while a bare `../src/main/…` that no rule covered still does.
const targets = [...new Set([...seen.values()])].filter((v) => v).sort((a, b) => b.length - a.length);
const reTargets = new RegExp(targets.map(esc).join('|'), 'g');
const reRawSources = new RegExp(sources.map(esc).join('|'), 'g');

let changedFiles = 0, totalHits = 0, leftovers = 0, reviews = 0;
for (const f of opts.files) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { console.error(`missing file: ${f}`); process.exit(2); }
  const before = fs.readFileSync(f, 'utf8');
  if (opts.check) {
    // LEFTOVER = a source at a token start (the same boundary the rewrite uses) → a real miss, fails the check.
    // REVIEW   = a source preceded by a path character and not inside a written target (e.g. `zkcml/zkmax/src/main/…`,
    //            an absolute zk path, or an unmapped `../../src/…` form) → printed for a human, does not fail.
    const stripped = before.replace(reTargets, '\u0000');
    const real = (stripped.match(re) || []).filter((m) => seen.get(m) !== m);
    const raw = (stripped.match(reRawSources) || []).filter((m) => seen.get(m) !== m);
    if (real.length) { leftovers += real.length; console.log(`LEFTOVER ${f}: ${[...new Set(real)].join(', ')}`); }
    const review = raw.length - real.length;
    if (review > 0) { reviews += review; console.log(`REVIEW   ${f}: ${review} source string(s) after a path char — confirm they are already zk-side`); }
    continue;
  }
  let n = 0;
  const after = before.replace(re, (m) => { const r = seen.get(m); if (r !== m) n++; return r; });
  if (n) {
    changedFiles++; totalHits += n;
    console.log(`${opts.dryRun ? 'would rewrite' : 'rewrote'} ${f}: ${n} substitution(s)`);
    if (!opts.dryRun) fs.writeFileSync(f, after, 'utf8');
  }
}
if (opts.check) {
  console.log(leftovers ? `CHECK FAIL: ${leftovers} source string(s) remain` : `CHECK OK: no source string remains in ${opts.files.length} file(s)` + (reviews ? ` (${reviews} REVIEW line(s) above for a human)` : ''));
  process.exit(leftovers ? 1 : 0);
}
console.log(`${opts.dryRun ? 'dry-run' : 'done'}: ${sources.length} rule(s), ${changedFiles} file(s) ${opts.dryRun ? 'would change' : 'changed'}, ${totalHits} substitution(s)`);
