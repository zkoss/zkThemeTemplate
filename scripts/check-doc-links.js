#!/usr/bin/env node
//
// check-doc-links.js — a file that is in git must not depend on a file that is not.
//
// WHY: `tasks/` is gitignored on the theory that everything in it is scratch — written for one
// session, deleted or promoted to doc/ when the work lands. In practice a second kind of document
// grew there: plans, triage boards, escalation logs and handoffs that OTHER sessions and tracked
// documents point at. Those are project state, not tasks, and storing state outside version
// control means "delete when done" is unrecoverable rather than merely tidy.
//
// The failure is silent in both directions. Deleting an untracked file leaves no diff and no
// history, and the tracked document still confidently links to it — on 2026-09-09 twelve such
// references were already dangling, including doc/orchestrator-playbook.md instructing an agent to
// append escalations to a tasks/ file that no longer exists (it would be recreated empty, losing
// every prior row) and a zk-component-rules skill citing a procedure it says it supersedes.
//
// The rule this enforces needs no per-file judgement: IF A TRACKED FILE REFERENCES A PATH, THAT
// PATH MUST BE TRACKED. Everything nothing points at stays in tasks/, stays ignored, and stays
// deletable.
//
// Two failure classes, reported separately because the fix differs:
//   UNTRACKED — the target exists but is not in git. Fix by moving it somewhere tracked
//               (doc/tasks/) and updating the references. This is the promote-to-git list.
//   MISSING   — the target does not exist at all. Fix the referencing document: the claim it
//               makes is already false.
//
// Usage:
//   node scripts/check-doc-links.js            # report + exit 1 if anything is broken
//   node scripts/check-doc-links.js --list     # print just the promote-to-git paths, one per line
// Exit: 0 = clean · 1 = violations found · 2 = cannot run (not a git repo)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LIST_ONLY = process.argv.includes('--list');

// Only these top-level dirs are treated as repo-relative references. Without this, prose is full
// of path-shaped strings that are not repo paths at all (URLs, java packages, CSS class notes).
const REPO_DIRS = ['tasks', 'doc', 'src', 'scripts', 'target', '.claude'];

// Text we can meaningfully scan. Binary and generated output are skipped.
const SCANNABLE = /\.(md|ts|js|mjs|cjs|java|xml|json|zul|css|sh|ya?ml)$/i;

function git(args) {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

let tracked;
try {
    tracked = new Set(git(['ls-files']).split('\n').filter(Boolean));
} catch {
    console.error('check-doc-links: not a git repository (or git unavailable)');
    process.exit(2);
}

// A path-shaped token: at least one slash, a file extension, no whitespace or quotes.
// Captures markdown links, inline code and bare prose mentions in one pass.
const CANDIDATE = /(?:\.\.\/|\.\/)?[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._~-]+)+\.[A-Za-z0-9]{1,6}/g;

/** Resolve a reference found in `fromFile` to a repo-relative path, or null if it is not one. */
function resolveRef(raw, fromFile) {
    const ref = raw.split('#')[0].split('?')[0];
    if (!ref || /^[a-z][a-z0-9+.-]*:/i.test(ref)) return null;   // URL / mailto / data:

    // Relative to the referencing file first (how markdown links actually resolve), then to root.
    const candidates = [
        path.normalize(path.join(path.dirname(fromFile), ref)),
        path.normalize(ref),
    ];
    for (const c of candidates) {
        if (c.startsWith('..')) continue;                        // escapes the repo
        if (!REPO_DIRS.includes(c.split('/')[0])) continue;
        if (fs.existsSync(path.join(ROOT, c)) || c.split('/')[0] === 'tasks') return c;
    }
    return null;
}

const untracked = new Map();   // target -> Set of referencing files
const missing = new Map();

for (const file of tracked) {
    if (!SCANNABLE.test(file)) continue;
    let text;
    try {
        text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    } catch {
        continue;                                                 // unreadable / binary
    }
    for (const raw of text.match(CANDIDATE) || []) {
        const target = resolveRef(raw, file);
        if (!target || tracked.has(target) || target === file) continue;
        // target/ is build output — never tracked, never a violation.
        if (target.split('/')[0] === 'target') continue;
        const bucket = fs.existsSync(path.join(ROOT, target)) ? untracked : missing;
        if (!bucket.has(target)) bucket.set(target, new Set());
        bucket.get(target).add(file);
    }
}

if (LIST_ONLY) {
    [...untracked.keys()].sort().forEach(t => console.log(t));
    process.exit(untracked.size ? 1 : 0);
}

function report(title, map, hint) {
    if (!map.size) return;
    console.log(`\n${title} (${map.size})`);
    console.log(`  ${hint}\n`);
    for (const target of [...map.keys()].sort()) {
        console.log(`  ${target}`);
        for (const from of [...map.get(target)].sort()) console.log(`      referenced by  ${from}`);
    }
}

report('UNTRACKED — exists on disk, not in git', untracked,
    'Promote these: move somewhere tracked (doc/tasks/) and update the references.');
report('MISSING — referenced but does not exist', missing,
    'The referencing document makes a claim that is already false. Fix or remove the reference.');

const total = untracked.size + missing.size;
if (total === 0) {
    console.log('check-doc-links: clean — every path a tracked file references is tracked.');
    process.exit(0);
}
console.log(`\ncheck-doc-links: ${untracked.size} to promote, ${missing.size} dangling.`);
process.exit(1);
