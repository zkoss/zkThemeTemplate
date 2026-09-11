#!/bin/bash
# verify-3.21.sh — item 3.21: the three template scripts the agents and doc/spec cite, plus capture-iceblue.js
# (render-iceblue-baseline.sh's dependency), ported into zk/scripts/ (chat D204-A).
#
# Usage:   bash doc/migration/tools/verify-3.21.sh            (~30 s; runs check-icon-coverage twice, js-source-hash three times,
#                                                              one render-iceblue attempt against a closed port; no server)
# Dry-run contract (pre-Generator tree): `environment` passes; stops at "3.21 FAIL at: four files present in zk/scripts" —
#   the designed pre-work marker.
# References are computed at run time, never hard-coded: the icon count comes from the template's own script, the hash from
# `shasum` over the checkout files the contract lists.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
FILES="scripts/check-icon-coverage.sh scripts/js-source-hash.sh scripts/render-iceblue-baseline.sh scripts/capture-iceblue.js"
fail() { echo "3.21 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

stage environment
for f in $FILES; do git -C "$TPL" ls-files --error-unmatch "$f" >/dev/null 2>&1 || fail "environment (template lacks $f)"; done
test -f "$ZK/scripts/build-css.js" || fail "environment (zk/scripts/build-css.js missing — P1)"
test -d "$ZK/node_modules/lucide-static/icons" || fail "environment (zk node_modules/lucide-static missing — npm install)"
test -d "$ZK/zkpreview/node_modules/@playwright/test" || fail "environment (zkpreview/node_modules/@playwright/test missing — 2.3)"
test -f "$ZK/doc/contracts/codeeditor.md" || fail "environment (zk/doc/contracts missing — 3.7)"
test -d "$ZKCML/zkmax/src/main/resources/web/js" || fail "environment (../zkcml missing)"
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD); zk deps present"

stage "four files present in zk/scripts"
for f in $FILES; do test -f "$ZK/$f" || fail "four files present in zk/scripts ($f missing)"; done

stage "syntax"
for f in scripts/check-icon-coverage.sh scripts/js-source-hash.sh scripts/render-iceblue-baseline.sh; do bash -n "$ZK/$f" || fail "syntax ($f)"; done
node --check "$ZK/scripts/capture-iceblue.js" || fail "syntax (capture-iceblue.js)"

stage "no map source string left; template-only tokens gone"
node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- $(echo $FILES | tr ' ' '\n' | sed "s#^#$ZK/#") | tail -4 | tee "$T/check.txt"
/usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"
for tok in 'pom.xml' '.m2/' 'zk.version' 'src/test/resources/web' 'unzip ' 'target/'; do
  n=$(cd "$ZK" && cat $FILES | /usr/bin/grep -cF -- "$tok")
  test "$n" = 0 || { cd "$ZK" && /usr/bin/grep -nF -- "$tok" $FILES | head -3; fail "template-only tokens gone ('$tok' ×$n)"; }
done

stage "check-icon-coverage.sh exits 0 from zk and counts what the template's own run counts"
(cd "$ZK" && bash scripts/check-icon-coverage.sh > "$T/zk-icons.txt" 2>&1) || { tail -5 "$T/zk-icons.txt"; fail "check-icon-coverage.sh (zk run exit $?)"; }
(cd "$TPL" && bash scripts/check-icon-coverage.sh > "$T/tpl-icons.txt" 2>&1) || fail "check-icon-coverage.sh (template control run failed)"
zn=$(/usr/bin/grep -oE '[0-9]+ icon references' "$T/zk-icons.txt" | /usr/bin/grep -oE '^[0-9]+'); tn=$(/usr/bin/grep -oE '[0-9]+ icon references' "$T/tpl-icons.txt" | /usr/bin/grep -oE '^[0-9]+')
test -n "$zn" && test "$zn" = "$tn" || fail "check-icon-coverage.sh (zk counts '$zn', template counts '$tn')"
echo "   $zn icon references in zk == $tn in the template"

stage "js-source-hash.sh: exit 1 with no args, exit 1 for a missing file, the checkout hash for a contract's list (zul and zkmax)"
(cd "$ZK" && bash scripts/js-source-hash.sh >/dev/null 2>&1); test $? = 1 || fail "js-source-hash.sh (no args should exit 1)"
(cd "$ZK" && bash scripts/js-source-hash.sh zul/nope/Missing.ts >/dev/null 2>&1); test $? = 1 || fail "js-source-hash.sh (missing file should exit 1)"
resolve() { # <rel under web/js> → checkout path, first root that has it
  for r in zul/src/main/resources/web/js zk/src/main/resources/web/js "$ZKCML/zkmax/src/main/resources/web/js" "$ZKCML/zkex/src/main/resources/web/js"; do
    case "$r" in /*) p="$r/$1";; *) p="$ZK/$r/$1";; esac; test -f "$p" && { echo "$p"; return 0; }; done; return 1; }
list_of() { awk '/^js-source-files:/{f=1;next} f&&/^  - /{gsub(/^  - /,"");print;next} f{exit}' "$1"; }
hash_check() { # <contract.md>
  local list; list=$(list_of "$1"); test -n "$list" || fail "js-source-hash.sh (no js-source-files in $1)"
  local paths=""; for rel in $list; do p=$(resolve "$rel") || fail "js-source-hash.sh (reference: $rel not in the checkout)"; paths="$paths $p"; done
  local ref got; ref=$(cat $paths | shasum -a 256 | cut -d' ' -f1)
  got=$(cd "$ZK" && bash scripts/js-source-hash.sh $list 2>"$T/prov.txt") || { cat "$T/prov.txt"; fail "js-source-hash.sh ($(basename "$1") run failed)"; }
  test "$got" = "$ref" || fail "js-source-hash.sh ($(basename "$1"): got $got, checkout says $ref)"
  test "$(/usr/bin/grep -c '<-' "$T/prov.txt")" = "$(echo "$list" | wc -l | tr -d ' ')" || { cat "$T/prov.txt"; fail "js-source-hash.sh (one provenance line per file expected on stderr)"; }
  echo "   $(basename "$1" .md): $got == checkout ($(echo "$list" | wc -l | tr -d ' ') files)"
}
hash_check "$ZK/doc/contracts/codeeditor.md"
# a zkmax contract whose entries use the short form (`zkmax/<pkg>/<Comp>.ts`, a path under web/js/) — coachmark.md writes the long
# `zkmax/src/main/resources/web/js/…` form, which no resolver (jar or checkout) can read: a contract defect, recorded as F72, not 3.21's
EE=$(/usr/bin/grep -lE '^  - zkmax/[a-z]+/[A-Za-z]+\.(ts|js)$' "$ZK"/doc/contracts/*.md | head -1); test -n "$EE" || fail "js-source-hash.sh (no contract lists a short-form zkmax/ source — cannot test the zkcml root)"
hash_check "$EE"

stage "render-iceblue-baseline.sh: Playwright loads from zkpreview/node_modules; a closed port fails in the navigation, nothing is written"
before=$(cd "$ZK" && git status --porcelain doc/contracts/baselines | wc -l | tr -d ' ')
(cd "$ZK" && ICEBLUE_URL=http://127.0.0.1:1 bash scripts/render-iceblue-baseline.sh stepbar > "$T/rib.txt" 2>&1); rc=$?
test "$rc" = 1 || { tail -5 "$T/rib.txt"; fail "render-iceblue-baseline.sh (closed port: exit $rc, template gives 1)"; }
/usr/bin/grep -q 'Cannot find module' "$T/rib.txt" && { /usr/bin/grep 'Cannot find module' "$T/rib.txt" | head -2; fail "render-iceblue-baseline.sh (capture-iceblue.js cannot load @playwright/test)"; }
/usr/bin/grep -q 'navigating to "http://127.0.0.1:1/' "$T/rib.txt" || { tail -5 "$T/rib.txt"; fail "render-iceblue-baseline.sh (did not reach the navigation step)"; }
after=$(cd "$ZK" && git status --porcelain doc/contracts/baselines | wc -l | tr -d ' ')
test "$before" = "$after" || fail "render-iceblue-baseline.sh (wrote into doc/contracts/baselines on failure)"

stage "git sees exactly the four new files under scripts/"
(cd "$ZK" && git status --porcelain scripts) > "$T/st.txt"
test "$(wc -l < "$T/st.txt" | tr -d ' ')" = 4 || { cat "$T/st.txt"; fail "git sees exactly the four new files (status lists $(wc -l < "$T/st.txt" | tr -d ' ') lines)"; }
for f in $FILES; do /usr/bin/grep -q "^?? $f\$" "$T/st.txt" || { cat "$T/st.txt"; fail "git sees exactly the four new files ($f not untracked-new)"; }; done

echo "3.21 ok — four scripts ported: $zn icon references (== template), js-source-hash matches the checkout for zul and zkmax, iceblue capture reaches the network step"
exit 0
