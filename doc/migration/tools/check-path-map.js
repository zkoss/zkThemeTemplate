#!/usr/bin/env node
//
// check-path-map.js — verifier for migration item 3.2 (the path-rewrite map).
//
// WHY: the marble-theme skill, the five subagents and doc/spec cite repository-relative paths
// that resolve against the WRONG repository, without erroring, once the session is rooted in
// `zk`. Item 3.2 produces doc/migration/path-rewrite-map.md: one row per distinct path string,
// with a disposition and — for MAP rows — the `zk` equivalent. Items 3.5, 3.6 and 3.10–3.14 apply
// the map; this script only proves the map is complete and mechanical.
//
// Authored by the Planner (not the Generator) so the Generator cannot grade its own work.
// Destination families follow the user's ruling D8 (chat) = planner-cold-start-findings.md F12.
//
// Usage:
//   node doc/migration/tools/check-path-map.js --list   # print every path string found (the map's row set)
//   node doc/migration/tools/check-path-map.js          # verify the map; exit 0 = PASS, 1 = FAIL
//
// Checks (all must hold):
//   1. Coverage: every path string found in the three roots is a row; no row is not found (no extras).
//   2. Disposition ∈ {MAP, OUTPUT, STALE, DROP, DEFER}.
//   3. MAP:    source exists here; target == source with its family prefix replaced per RULES.
//      OUTPUT: source is a build-output path; target is the ruled generated-tree equivalent.
//      STALE:  source does NOT exist here; notes non-empty (the referencing file is the fix).
//      DROP:   target is "—"; source starts with a DROP family prefix.
//      DEFER:  source exists here; notes name the deciding item (e.g. "1.5").

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const MAP_FILE = path.join(ROOT, 'doc/migration/path-rewrite-map.md');
const ROOTS = ['.claude/skills/marble-theme', '.claude/agents', 'doc/spec'];
const REPO_DIRS = ['tasks', 'doc', 'src', 'scripts', 'target', '.claude'];
const SCANNABLE = /\.(md|js|sh)$/;

// Same file-path token rule as scripts/check-doc-links.js …
const FILE_CAND = /(?:\.\.\/|\.\/)?[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._~-]+)+\.[A-Za-z0-9]{1,6}/g;
// … plus literal directory references ("doc/spec/", "tasks/gen-reports/") that end at the slash.
const DIR_CAND = /(?:^|[\s`'"(])((?:tasks|doc|src|scripts|target|\.claude)\/[A-Za-z0-9._~/-]*\/)(?![A-Za-z0-9._~-])/g;

// Ruled destination families (D8 / F12). Order matters: first match wins.
const RULES = [
  // --- MAP: mechanical prefix substitution, target relative to the zk root ---
  { kind: 'MAP', from: 'src/main/resources/web/js/zkmax/', to: '../zkcml/zkmax/src/main/resources/web/js/zkmax/' },
  { kind: 'MAP', from: 'src/main/resources/web/zkmax/', to: '../zkcml/zkmax/src/main/resources/web/zkmax/' },
  { kind: 'MAP', from: 'src/main/resources/web/js/zkex/', to: '../zkcml/zkex/src/main/resources/web/js/zkex/' },
  { kind: 'DEFER', from: 'src/main/resources/metainfo/zk/' },                 // theme-jar registration → item 1.5
  { kind: 'MAP', from: 'src/main/resources/', to: 'zul/src/main/resources/' },   // covers web/zul/**, web/js/zul/**, bare dirs
  { kind: 'MAP', from: 'src/test/resources/web/', to: 'zkpreview/src/main/webapp/' },
  { kind: 'MAP', from: 'src/test/playwright/', to: 'zkpreview/src/test/playwright/' },
  { kind: 'DROP', from: 'src/test/java/zk/example/' },                           // Spring Boot host, replaced by the servlet
  { kind: 'MAP', from: 'scripts/', to: 'scripts/' },
  { kind: 'MAP', from: 'doc/', to: 'doc/' },
  { kind: 'MAP', from: '.claude/', to: '.claude/' },
  { kind: 'OUTPUT', from: 'target/classes/web/marble/', to: ['zul/codegen/web/', '../zkcml/zkmax/codegen/web/', '../zkcml/zkex/codegen/web/'] },
  { kind: 'OUTPUT', from: 'target/test-classes/web/', to: ['zkpreview/'] },
  { kind: 'STALE', from: 'tasks/' },                                             // nothing under tasks/ is tracked
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else if (SCANNABLE.test(e.name)) acc.push(p);
  }
  return acc;
}

function scan() {
  const found = new Map(); // path string -> Set(referencing files)
  const add = (raw, f) => { if (!found.has(raw)) found.set(raw, new Set()); found.get(raw).add(path.relative(ROOT, f)); };
  for (const r of ROOTS) {
    for (const f of walk(path.join(ROOT, r))) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(FILE_CAND)) {
        const s = m[0].replace(/^\.\//, '');
        if (/^[a-z][a-z0-9+.-]*:/i.test(s)) continue;
        if (!REPO_DIRS.includes(s.split('/')[0])) continue;
        add(s, f);
      }
      for (const m of text.matchAll(DIR_CAND)) add(m[1], f);
    }
  }
  return found;
}

function parseMap() {
  if (!fs.existsSync(MAP_FILE)) return null;
  const rows = [];
  for (const line of fs.readFileSync(MAP_FILE, 'utf8').split('\n')) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.trim().slice(1, -1).split('|').map(c => c.trim().replace(/^`|`$/g, ''));
    if (cells.length < 4) continue;
    if (/^-+$/.test(cells[0].replace(/[:\s]/g, '')) ) continue;      // separator
    if (/^source/i.test(cells[0])) continue;                          // header
    rows.push({ source: cells[0], disposition: cells[1].toUpperCase(), target: cells[2], notes: cells.slice(3).join(' | ') });
  }
  return rows;
}

function ruleFor(source) { return RULES.find(r => source.startsWith(r.from)) || null; }

const found = scan();
if (process.argv.includes('--list')) {
  for (const k of [...found.keys()].sort()) console.log(`${k}\t${[...found.get(k)].join(',')}`);
  console.error(`# ${found.size} distinct path strings`);
  process.exit(0);
}

const rows = parseMap();
if (!rows) { console.error(`FAIL: ${path.relative(ROOT, MAP_FILE)} does not exist`); process.exit(1); }

const errors = [];
const seen = new Set();
for (const r of rows) {
  if (seen.has(r.source)) errors.push(`DUPLICATE ROW: ${r.source}`);
  seen.add(r.source);
  if (!found.has(r.source)) { errors.push(`EXTRA ROW (not found in any scanned file): ${r.source}`); continue; }
  const exists = fs.existsSync(path.join(ROOT, r.source));
  const rule = ruleFor(r.source);
  switch (r.disposition) {
    case 'MAP': {
      if (!exists) errors.push(`MAP but source missing here: ${r.source}`);
      if (!rule || rule.kind !== 'MAP') errors.push(`MAP not allowed for family of: ${r.source} (rule: ${rule ? rule.kind : 'none'})`);
      else if (r.target !== rule.to + r.source.slice(rule.from.length)) errors.push(`MAP target not mechanical: ${r.source} -> ${r.target} (expected ${rule.to + r.source.slice(rule.from.length)})`);
      break;
    }
    case 'OUTPUT': {
      if (!rule || rule.kind !== 'OUTPUT') { errors.push(`OUTPUT not allowed for: ${r.source}`); break; }
      const tail = r.source.slice(rule.from.length);
      if (!rule.to.some(t => r.target === t + tail || (rule.to.length === 1 && r.target.startsWith(t)))) errors.push(`OUTPUT target not ruled: ${r.source} -> ${r.target}`);
      break;
    }
    case 'STALE': {
      if (exists) errors.push(`STALE but source exists here: ${r.source}`);
      if (!r.notes.trim()) errors.push(`STALE without notes: ${r.source}`);
      break;
    }
    case 'DROP': {
      if (!rule || rule.kind !== 'DROP') errors.push(`DROP not allowed for: ${r.source}`);
      if (r.target !== '—' && r.target !== '-') errors.push(`DROP must have target "—": ${r.source}`);
      break;
    }
    case 'DEFER': {
      if (!exists) errors.push(`DEFER but source missing here: ${r.source}`);
      if (!rule || rule.kind !== 'DEFER') errors.push(`DEFER not allowed for: ${r.source}`);
      if (!/\b[1-4]\.\d{1,2}\b/.test(r.notes)) errors.push(`DEFER notes must name the deciding item: ${r.source}`);
      break;
    }
    default: errors.push(`UNKNOWN DISPOSITION "${r.disposition}": ${r.source}`);
  }
}
for (const k of found.keys()) if (!seen.has(k)) errors.push(`UNMAPPED (found in ${[...found.get(k)].join(',')}): ${k}`);

const counts = {};
for (const r of rows) counts[r.disposition] = (counts[r.disposition] || 0) + 1;
console.log(`rows=${rows.length} found=${found.size} ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')}`);
if (errors.length) { for (const e of errors) console.log(e); console.log(`FAIL: ${errors.length} problem(s)`); process.exit(1); }
console.log('PASS: every path string is mapped, every MAP row is mechanical per the ruled families');
