#!/bin/bash
# verify-agent.sh — shared body of verify-3.10.sh … verify-3.14.sh (P3 rows 3.10–3.14: one subagent each, copied into
# zk/.claude/agents/ and re-pointed with apply-path-map.js; three of them carry brief-named hand edits for template-only
# build / hash instructions).
#
# Usage:   bash doc/migration/tools/verify-agent.sh <item> <agent> [anchor|anchor|…]
#          (the wrappers pass these; run a wrapper, e.g. `bash doc/migration/tools/verify-3.13.sh`, ~5 s, no server)
# <anchor>s: substrings that mark the ORIGINAL lines the brief tells the Generator to rewrite by hand; a changed line must
#   hold either a map / fixes source string or one of these anchors, otherwise the change is unexpected.
# Dry-run contract (pre-Generator tree): `environment` passes; stops at "<item> FAIL at: agent copy present in zk" —
#   the designed pre-work marker.
set -u
ITEM=${1:?item}; AGENT=${2:?agent}; ANCHORS=${3:-}
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=${ZK:-/Users/hawk/Documents/workspace/ZK10/zk}          # the tree holding the copy under test (a scratch tree for Planner dry-runs)
ZKROOT=${ZKROOT:-$ZK}                                    # the real zk checkout for path-existence checks
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
REL=.claude/agents/$AGENT.md
fail() { echo "$ITEM FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

stage environment
git -C "$TPL" ls-files --error-unmatch "$REL" >/dev/null 2>&1 || fail "environment (template lacks $REL)"
for p in .claude/skills/marble-theme/SKILL.md doc/spec/index.md doc/contracts/button.md doc/harness/gen-reports/README.md scripts/js-source-hash.sh scripts/check-icon-coverage.sh; do
  test -f "$ZKROOT/$p" || fail "environment (zk lacks $p — 3.4 / 3.6 / 3.7 / 3.18 / 3.21 first)"
done
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD); $AGENT $(wc -c < "$TPL/$REL" | tr -d ' ') bytes in the template"

stage "agent copy present in zk"
test -f "$ZK/$REL" || fail "agent copy present in zk"

stage "copy rewritten (differs from template HEAD)"
git -C "$TPL" archive HEAD "$REL" | tar -x -C "$T"
cmp -s "$T/$REL" "$ZK/$REL" && fail "copy rewritten (differs from template HEAD)"

stage "no map source string left (apply-path-map --check)"
node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- "$ZK/$REL" | tail -3 | tee "$T/check.txt"
/usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"

stage "tasks/ gone; template-host tokens gone"
n=$(/usr/bin/grep -c 'tasks/' "$ZK/$REL"); test "$n" = 0 || { /usr/bin/grep -n 'tasks/' "$ZK/$REL" | head -3; fail "tasks/ gone (×$n)"; }
for tok in 'src/test/resources/web' 'target/' 'pom.xml' 'mvn ' 'npm run watch' 'npm run build:css' 'setjdk' 'exec:java' 'ZK10/zkex/' 'ZK10/zkmax/' 'Hash the jars'; do
  n=$(/usr/bin/grep -cF -- "$tok" "$ZK/$REL"); test "$n" = 0 || { /usr/bin/grep -nF -- "$tok" "$ZK/$REL" | head -3 | cut -c1-160; fail "template-host tokens gone ('$tok' ×$n)"; }
done

stage "frontmatter intact"
test "$(sed -n '1p' "$ZK/$REL")" = '---' || fail "frontmatter (line 1 is not ---)"
close=$(awk 'NR>1 && /^---$/{print NR; exit}' "$ZK/$REL"); test -n "$close" || fail "frontmatter (no closing ---)"
sed -n "2,$((close-1))p" "$ZK/$REL" | /usr/bin/grep -q "^name: *$AGENT\$" || fail "frontmatter (name: $AGENT missing)"
echo "   frontmatter lines 1–$close"

stage "every zk-side path the agent cites exists"
/usr/bin/python3 - "$ZKROOT" "$ZK/$REL" <<'PY' || fail "every zk-side path the agent cites exists"
import re, os, sys
zk, f = sys.argv[1], sys.argv[2]
roots = [zk, os.path.dirname(zk), os.path.join(zk, 'zul/src/main/resources/web'), os.path.join(zk, 'zk/src/main/resources/web/js'),
         os.path.join(zk, 'zul/src/main/resources/web/js'), os.path.join(zk, '../zkcml/zkmax/src/main/resources/web'),
         os.path.join(zk, '../zkcml/zkmax/src/main/resources/web/js'), os.path.join(zk, '../zkcml/zkex/src/main/resources/web/js')]
pat = re.compile(r'(?<![\w/.-])((?:\.\./zkcml/|zul/|zk/|zkpreview/|scripts/|doc/|\.claude/)[A-Za-z0-9_./-]*[A-Za-z0-9_-])')
missing = checked = 0
for i, line in enumerate(open(f, encoding='utf-8'), 1):
    for m in pat.finditer(line):
        p = m.group(1); nxt = line[m.end():m.end()+1]
        if any(c in p for c in '<*{…$') or '...' in p or p.endswith('.') or nxt in ('<', '{'): continue
        if line[m.end():].startswith(' (retired'): continue
        if '/build/' in p + '/' or '/codegen/' in p: continue          # build outputs
        if any(os.path.exists(os.path.join(r, p.rstrip('/'))) for r in roots): checked += 1
        else: missing += 1; print(f'MISSING {os.path.basename(f)}:{i}: {p}')
print(f'{checked} path(s) exist, {missing} missing')
sys.exit(1 if missing else 0)
PY

stage "differs from template HEAD only on lines that held a mapped string or a brief-named hand-edit anchor"
/usr/bin/python3 - "$T/$REL" "$ZK/$REL" "$MAP" "$FIX" "$ANCHORS" <<'PY' || fail "differs only on mapped / hand-edit lines"
import sys, re, difflib
A, B, MAP, FIX, ANCH = sys.argv[1:6]
srcs = set()
for line in open(MAP, encoding='utf-8'):
    m = re.match(r'^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT|STALE)\s*\|\s*`([^`]+)`', line)
    if m and m.group(1) != m.group(3): srcs.add(m.group(1))
for line in open(FIX, encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        s, t = line.rstrip('\n').split('\t')
        if s != t: srcs.add(s)
anchors = [a for a in ANCH.split('|') if a]
a = open(A, encoding='utf-8').read().splitlines(); b = open(B, encoding='utf-8').read().splitlines()
bad = 0; hand = 0; mapped = 0
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if tag == 'equal': continue
    block = a[i1:i2]; ctx = a[max(0, i1-3):i2+3]                                  # an inserted sentence beside an anchored line is part of that hand edit
    if any(any(k in l for k in anchors) for l in ctx): hand += 1; continue         # a brief-named hand edit may re-flow lines
    if tag != 'replace' or (i2-i1) != (j2-j1): bad += 1; print(f'UNEXPECTED {tag} lines {i1+1}-{i2} → {j1+1}-{j2}'); continue
    for l in block:
        if any(s in l for s in srcs): mapped += 1
        else: bad += 1; print(f'UNEXPECTED change: {l[:110]}')
print(f'{mapped} mapped line(s), {hand} hand-edit block(s), {bad} unexpected')
sys.exit(1 if bad else 0)
PY

echo "$ITEM ok — $AGENT copied and re-pointed; no template path, no tasks/, no template-host command; frontmatter intact; cited paths exist"
exit 0
