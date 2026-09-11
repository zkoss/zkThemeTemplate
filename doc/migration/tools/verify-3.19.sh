#!/bin/bash
# verify-3.19.sh — item 3.19: the path rewrite inside zk's copy of `zk-component-rules` (D202-A, F20), done with the 3.2 map +
# stale-fixes.tsv (measured 2026-09-11 on a scratch copy: the map already covers the skill — no second map file).
#
# Usage:   bash doc/migration/tools/verify-3.19.sh        (~15 s; no server)
# Dry-run contract (pre-Generator tree = the byte-identical 3.15 copy): `environment` passes; stops at
#   "3.19 FAIL at: copy rewritten (differs from template HEAD)" — the designed pre-work marker.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=${ZK:-/Users/hawk/Documents/workspace/ZK10/zk}          # the tree holding the copy under test (a scratch tree for Planner dry-runs)
ZKROOT=${ZKROOT:-$ZK}                                    # the real zk checkout for path-existence checks
SK=.claude/skills/zk-component-rules
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
fail() { echo "3.19 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
FILES=$(git -C "$TPL" ls-files "$SK")
N=$(echo "$FILES" | wc -l | tr -d ' ')

stage environment
test "$N" = 97 || fail "environment (template skill not 97 files: $N)"
test -d "$ZK/$SK" || fail "environment (zk copy missing — 3.15 first)"
for f in $FILES; do test -f "$ZK/$f" || fail "environment (copy lacks $f)"; done
test "$(cd "$ZK" && git ls-files "$SK" | wc -l | tr -d ' ')" = 97 || fail "environment (zk tracks $(cd "$ZK" && git ls-files "$SK" | wc -l | tr -d ' ') files, not 97)"
test -z "$(find "$ZK/$SK" -type f -name .DS_Store)" || fail "environment (.DS_Store in the copy)"
echo "   97 files in both trees; template HEAD $(git -C "$TPL" rev-parse --short HEAD)"

stage "copy rewritten (differs from template HEAD)"
git -C "$TPL" archive HEAD "$SK" | tar -x -C "$T"
diff -rq "$T/$SK" "$ZK/$SK" > "$T/diff.txt" 2>&1; test -s "$T/diff.txt" || fail "copy rewritten (differs from template HEAD)"
/usr/bin/grep -q '^Only in' "$T/diff.txt" && { /usr/bin/grep '^Only in' "$T/diff.txt" | head -3; fail "copy rewritten (files added or removed)"; }
echo "   $(wc -l < "$T/diff.txt" | tr -d ' ') file(s) differ"

stage "no map source string left (apply-path-map --check over all 97)"
node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- $(echo "$FILES" | sed "s#^#$ZK/#") | tail -8 | tee "$T/check.txt"
/usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"

stage "template-only tokens gone"
for tok in 'src/test/resources/web' 'src/main/resources/web/js/' 'src/main/resources/web/zul/' 'target/classes' 'target/.../' 'src/test/playwright/screenshot.spec.ts'; do
  re="(^|[^A-Za-z0-9_./-])$(printf '%s' "$tok" | sed 's/[.]/\\./g')"   # the token at a path start only — `zk/src/main/…`, `../zkcml/zkmax/src/main/…` are zk-side
  n=$(cd "$ZK" && /usr/bin/grep -rE -- "$re" $SK | wc -l | tr -d ' ')
  test "$n" = 0 || { cd "$ZK" && /usr/bin/grep -rnE -- "$re" $SK | head -3 | cut -c1-160; fail "template-only tokens gone ('$tok' ×$n)"; }
done

stage "every MAP / fixes target the rewrite produced exists in zk (or is a retired-note / build output)"
/usr/bin/python3 - "$ZKROOT" "$MAP" "$FIX" $(echo "$FILES" | sed "s#^#$ZK/#") <<'PY' || fail "every produced target exists"
import re, os, sys
zk, MAP, FIX = sys.argv[1:4]; files = sys.argv[4:]
targets = set()
for line in open(MAP, encoding='utf-8'):
    m = re.match(r'^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT|STALE)\s*\|\s*`([^`]+)`', line)
    if m and m.group(1) != m.group(3): targets.add(m.group(3))
for line in open(FIX, encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        s, t = line.rstrip('\n').split('\t')
        if s != t: targets.add(t)
roots = [zk, os.path.dirname(zk)]
missing = checked = 0
for t in sorted(targets):
    if '(retired' in t or '$' in t or '<' in t or t.startswith('`'): continue
    p = t.split(' (')[0].rstrip('/')
    if p.startswith('../'): p = os.path.normpath(os.path.join(zk, p))
    hit = any(os.path.exists(os.path.join(r, p)) for r in roots) or os.path.exists(p)
    if not hit and '/codegen/' in p: continue
    if hit: checked += 1
    else:
        # only fail when this target actually appears in the copy
        if any(t in open(f, encoding='utf-8', errors='ignore').read() for f in files): missing += 1; print(f'MISSING target used in the copy: {t}')
print(f'{checked} target(s) exist, {missing} missing-and-used')
sys.exit(1 if missing else 0)
PY

stage "each file differs from template HEAD only on lines that held a mapped string"
/usr/bin/python3 - "$T" "$ZK" "$MAP" "$FIX" "$SK" <<'PY' || fail "files differ only on mapped lines"
import sys, re, difflib, os, subprocess
T, ZK, MAP, FIX, SK = sys.argv[1:6]
srcs = set()
for line in open(MAP, encoding='utf-8'):
    m = re.match(r'^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT|STALE)\s*\|\s*`([^`]+)`', line)
    if m and m.group(1) != m.group(3): srcs.add(m.group(1))
for line in open(FIX, encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        s, t = line.rstrip('\n').split('\t')
        if s != t: srcs.add(s)
files = subprocess.run(['git', '-C', T if False else '/Users/hawk/Documents/workspace/zkThemeTemplate', 'ls-files', SK], capture_output=True, text=True).stdout.split()
bad = n = changed = 0
for rel in files:
    a = open(os.path.join(T, rel), encoding='utf-8', errors='ignore').read().splitlines()
    b = open(os.path.join(ZK, rel), encoding='utf-8', errors='ignore').read().splitlines()
    n += 1
    if a == b: continue
    changed += 1
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == 'equal': continue
        if tag != 'replace' or (i2-i1) != (j2-j1): bad += 1; print(f'UNEXPECTED {tag} in {rel} lines {i1+1}-{i2}'); continue
        for l in a[i1:i2]:
            if not any(s in l for s in srcs): bad += 1; print(f'UNEXPECTED change in {rel}: {l[:100]}')
print(f'{n} files audited, {changed} changed, {bad} unexpected change(s)')
sys.exit(1 if bad else 0)
PY

echo "3.19 ok — zk-component-rules rewritten with the 3.2 map + fixes: 97 files, 0 source strings left, only mapped lines changed"
exit 0
