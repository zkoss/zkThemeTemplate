#!/bin/bash
# verify-3.6.sh — item 3.6: doc/spec/ (26 pages) copied into zk/doc/spec/ from the template's COMMITTED tree and rewritten
# with tools/apply-path-map.js (map + stale-fixes.tsv, incl. the three F63 Java links).
#
# Usage:   bash doc/migration/tools/verify-3.6.sh          (no server; ~3 s)
# Dry-run contract (pre-Generator tree): `environment` passes; stops at "3.6 FAIL at: zk/doc/spec present".
# Stages: 26 files · --check 0 LEFTOVER · the two root docs the spec links to (component-theme-typography-scope.md, zindex-audit.md) present verbatim · every relative link in the 26 pages resolves from zk/doc/spec (fragment stripped;
#   http(s)/mailto skipped) · the three Java targets exist · each page differs from HEAD only on lines that held a mapped string.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
fail() { echo "3.6 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }

stage environment
test -d "$TPL/.git" && test -d "$ZK/.git" || fail "environment (repos)"
test -f "$MAP" && test -f "$FIX" && test -f "$TOOL" || fail "environment (map / fixes / tool)"
N=$(git -C "$TPL" ls-files doc/spec | wc -l | tr -d ' '); test "$N" = 26 || fail "environment (template tracks $N spec files, expected 26)"
test -z "$(git -C "$TPL" status --porcelain -- doc/spec)" || fail "environment (template doc/spec differs from HEAD)"
test -d "$ZK/doc/contracts" && test -f "$ZK/doc/component-theme-variables-progress.md" || fail "environment (3.7 / 3.18 not landed — spec links need them)"
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD): 26 spec pages; 3.7 and 3.18 present in zk"

stage "zk/doc/spec present"
test -d "$ZK/doc/spec" || fail "zk/doc/spec present"

stage "26 files, no junk"
test "$(find "$ZK/doc/spec" -type f ! -name .DS_Store | wc -l | tr -d ' ')" = 26 || fail "26 files"
test -z "$(find "$ZK/doc/spec" -name .DS_Store)" || fail "26 files (.DS_Store)"

stage "no map source string left (apply-path-map --check)"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- $(git -C "$TPL" ls-files doc/spec | sed "s#^#$ZK/#") | tail -4 | tee "$T/check.txt"
/usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"

stage "every relative link in the 26 pages resolves in zk"
/usr/bin/python3 - "$ZK/doc/spec" <<'PY' || fail "every relative link resolves"
import re, os, sys, glob
root = sys.argv[1]; bad = 0; ok = 0
link = re.compile(r'\]\(([^)\s]+)\)')
for f in sorted(glob.glob(os.path.join(root, '*.md'))):
    for i, line in enumerate(open(f, encoding='utf-8'), 1):
        for tgt in link.findall(line):
            if tgt.startswith(('http://', 'https://', 'mailto:', '#', '<')): continue
            p = tgt.split('#', 1)[0]
            if not p: continue
            if not os.path.exists(os.path.normpath(os.path.join(root, p))):
                bad += 1; print(f'DEAD {os.path.basename(f)}:{i}: {tgt}')
            else: ok += 1
print(f'{ok} link(s) resolve, {bad} dead')
sys.exit(1 if bad else 0)
PY

stage "the two root docs doc/spec links to are present verbatim (3.18 missed them: ../ links)"
for p in doc/component-theme-typography-scope.md doc/zindex-audit.md; do
  test -f "$ZK/$p" || fail "root doc missing: $p"
  git -C "$TPL" show "HEAD:$p" | cmp -s - "$ZK/$p" || fail "root doc differs from template HEAD: $p"
done

stage "the three F63 Java targets exist"
for p in zul/src/main/java/org/zkoss/zul/theme/MarbleBrand.java zul/src/main/java/org/zkoss/zul/theme/MarbleDensity.java zul/src/main/java/org/zkoss/zul/theme/StandardThemeProvider.java; do test -f "$ZK/$p" || fail "Java target missing: $p"; done

stage "each page differs from template HEAD only on lines that held a mapped string"
git -C "$TPL" archive HEAD doc/spec | tar -x -C "$T"
/usr/bin/python3 - "$T" "$ZK" "$MAP" "$FIX" <<'PY' || fail "pages differ only on mapped lines"
import sys, re, difflib, os, glob
T, ZK, MAP, FIX = sys.argv[1:5]
srcs=set()
for line in open(MAP, encoding='utf-8'):
    m=re.match(r'^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT)\s*\|\s*`([^`]+)`', line)
    if m and m.group(1)!=m.group(3): srcs.add(m.group(1))
for line in open(FIX, encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        s,t=line.rstrip('\n').split('\t')
        if s!=t: srcs.add(s)
bad=0; n=0
for f in sorted(glob.glob(os.path.join(T,'doc/spec/*.md'))):
    rel=os.path.relpath(f,T); n+=1
    a=open(f,encoding='utf-8').read().splitlines(); b=open(os.path.join(ZK,rel),encoding='utf-8').read().splitlines()
    for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if tag=='equal': continue
        if tag!='replace' or (i2-i1)!=(j2-j1): bad+=1; print(f'UNEXPECTED {tag} in {rel} lines {i1+1}-{i2}'); continue
        for l in a[i1:i2]:
            if not any(s in l for s in srcs): bad+=1; print(f'UNEXPECTED change in {rel}: {l[:100]}')
print(f'{n} pages audited, {bad} unexpected change(s)')
sys.exit(1 if bad else 0)
PY
echo "3.6 ok — 26 pages from template HEAD $(git -C "$TPL" rev-parse --short HEAD), rewritten, every link resolves in zk"
