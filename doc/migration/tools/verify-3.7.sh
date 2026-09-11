#!/bin/bash
# verify-3.7.sh — item 3.7+3.8: doc/contracts/ (94 .md + 19 .html + baselines/ 18 = 131 tracked files) copied into
# zk/doc/contracts/ from the template's COMMITTED tree, then the 94 .md rewritten with tools/apply-path-map.js
# (F65: 67 of them cite template paths). The .html mockups and baselines/ stay byte-identical.
#
# Usage:   bash doc/migration/tools/verify-3.7.sh          (no server; ~3 s)
# Dry-run contract (pre-Generator tree): `environment` passes; the run stops at "3.7 FAIL at: zk/doc/contracts present".
# Stages after the copy: counts · html + baselines cmp · no map source string left in any .md (apply-path-map --check)
#   · every .md differs from its original ONLY on lines that held a mapped string · the 9 doc/contracts/… strings the
#   map lists exist in zk · no .DS_Store.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
fail() { echo "3.7 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }

stage environment
test -d "$TPL/.git" && test -d "$ZK/.git" || fail "environment (repos)"
test -f "$MAP" && test -f "$FIX" && test -f "$TOOL" || fail "environment (map / fixes / tool missing)"
MD=$(git -C "$TPL" ls-files 'doc/contracts/*.md' | /usr/bin/grep -c '^doc/contracts/[^/]*\.md$')
HTML=$(git -C "$TPL" ls-files 'doc/contracts/*.html' | /usr/bin/grep -c '^doc/contracts/[^/]*\.html$')
BASE=$(git -C "$TPL" ls-files doc/contracts/baselines | wc -l | tr -d ' ')
ALL=$(git -C "$TPL" ls-files doc/contracts | wc -l | tr -d ' ')
test "$MD" = 94 && test "$HTML" = 19 && test "$BASE" = 18 && test "$ALL" = 131 || fail "environment (template tracks md=$MD html=$HTML baselines=$BASE all=$ALL; expected 94/19/18/131)"
test -z "$(git -C "$TPL" status --porcelain -- doc/contracts)" || fail "environment (template doc/contracts differs from HEAD)"
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD): 94 md + 19 html + 18 baselines"

stage "zk/doc/contracts present"
test -d "$ZK/doc/contracts" || fail "zk/doc/contracts present"

stage "counts in zk"
ZMD=$(find "$ZK/doc/contracts" -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')
ZHTML=$(find "$ZK/doc/contracts" -maxdepth 1 -name '*.html' | wc -l | tr -d ' ')
ZBASE=$(find "$ZK/doc/contracts/baselines" -type f ! -name .DS_Store 2>/dev/null | wc -l | tr -d ' ')
ZALL=$(find "$ZK/doc/contracts" -type f ! -name .DS_Store | wc -l | tr -d ' ')
test "$ZMD" = 94 && test "$ZHTML" = 19 && test "$ZBASE" = 18 && test "$ZALL" = 131 || fail "counts in zk (md=$ZMD html=$ZHTML baselines=$ZBASE all=$ZALL)"
test -z "$(find "$ZK/doc/contracts" -name .DS_Store)" || fail "counts in zk (.DS_Store present)"

stage "html and baselines byte-identical to template HEAD"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git -C "$TPL" archive HEAD doc/contracts | tar -x -C "$T"
for f in $(git -C "$TPL" ls-files 'doc/contracts/*.html' doc/contracts/baselines); do cmp -s "$T/$f" "$ZK/$f" || fail "cmp differs: $f"; done

stage "no map source string left in the 94 md (apply-path-map --check)"
node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- $(git -C "$TPL" ls-files 'doc/contracts/*.md' | /usr/bin/grep '^doc/contracts/[^/]*\.md$' | sed "s#^#$ZK/#") | tail -3 | tee "$T/check.txt"
/usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"

stage "each md differs from its original only on lines that held a mapped string"
/usr/bin/python3 - "$T" "$ZK" "$MAP" "$FIX" <<'PY' || fail "md differs only on mapped lines"
import sys, re, difflib, os, subprocess
T, ZK, MAP, FIX = sys.argv[1:5]
srcs=set()
for line in open(MAP, encoding='utf-8'):
    m=re.match(r'^\|\s*`([^`]+)`\s*\|\s*(MAP|OUTPUT)\s*\|\s*`([^`]+)`', line)
    if m and m.group(1)!=m.group(3): srcs.add(m.group(1))
for line in open(FIX, encoding='utf-8'):
    if line.strip() and not line.startswith('#'):
        s,t=line.rstrip('\n').split('\t'); 
        if s!=t: srcs.add(s)
bad=0
files=[f for f in subprocess.check_output(['git','-C','/Users/hawk/Documents/workspace/zkThemeTemplate','ls-files','doc/contracts/*.md'],text=True).split() if f.count('/')==2]
for f in files:
    a=open(os.path.join(T,f),encoding='utf-8').read().splitlines()
    b=open(os.path.join(ZK,f),encoding='utf-8').read().splitlines()
    for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if tag=='equal': continue
        if tag!='replace' or (i2-i1)!=(j2-j1): bad+=1; print(f'UNEXPECTED {tag} in {f} lines {i1+1}-{i2}'); continue
        for l in a[i1:i2]:
            if not any(s in l for s in srcs): bad+=1; print(f'UNEXPECTED change in {f}: {l[:100]}')
print(f'{len(files)} md audited, {bad} unexpected change(s)')
sys.exit(1 if bad else 0)
PY

stage "the 9 doc/contracts strings the map lists exist in zk"
for p in doc/contracts/ doc/contracts/_template.html doc/contracts/baselines/ doc/contracts/biglistbox.md doc/contracts/confirmpopup.md doc/contracts/daterangebox.md doc/contracts/navbar.md doc/contracts/searchbox.md doc/contracts/stepbar.md; do test -e "$ZK/$p" || fail "map target missing in zk: $p"; done
echo "3.7 ok — 131 files from template HEAD $(git -C "$TPL" rev-parse --short HEAD); 94 md rewritten, html + baselines identical"
