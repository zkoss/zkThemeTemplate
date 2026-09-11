#!/bin/bash
# verify-2.11.sh — verification for item 2.11 of the Marble → zk migration: the skeleton stylesheet is restored as a
# Marble CSS source in zkcml (F62: P1 deleted skeleton.less and left zkex's global <stylesheet> dangling; chat D70 A),
# build-css.js's orphan guard knows the file, and check-css-dsp.js verifies global <stylesheet href="…css.dsp"> too.
#
# Usage:  bash doc/migration/tools/verify-2.11.sh static      file-level checks, no build (seconds)
#         bash doc/migration/tools/verify-2.11.sh live        node builds + checks, then three zktest classes (minutes)
#
# Under test: zkcml/zkex/src/main/resources/web/js/zkex/wgt/css/skeleton.css (new, 1:1 port of the retired LESS, in
# @layer zk-components, Marble tokens, the five --zk-skeleton-* overrides kept); zk/scripts/build-css.js (+3 lines in
# CSS_URI_BACKED); zk/scripts/check-css-dsp.js (+8 lines in extractRequired). Live: build-css.js emits
# js/zkex/wgt/css/skeleton.css.dsp; check-css-dsp.js passes for zkex AND fails, naming that file, against a copy of the
# build output without it (the guard now sees global stylesheets); Gradle runs F110_ZK_6099Test (skeleton masking),
# F110_ZK_6099ReducedMotionTest (animation off) and B103_ZK_5818Test (the control that failed with the 404 in F62).
#
# Dry-run contract (rule 2): before the Generator, `static` fails at "skeleton.css exists"; `live` fails at
# "build-css.js … skeleton.css.dsp emitted". The script writes only what node/Gradle write (codegen, build) plus a
# mktemp copy of the zkex build output; it never deletes a tracked file and starts no server of its own.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
CSSF="$ZKCML/zkex/src/main/resources/web/js/zkex/wgt/css/skeleton.css"
BUILD="$ZK/scripts/build-css.js"
CHECK="$ZK/scripts/check-css-dsp.js"
OUT="$ZKCML/zkex/codegen/resources/web"
DSP="$OUT/js/zkex/wgt/css/skeleton.css.dsp"
T="$ZK/zktest"
TESTS="org.zkoss.zktest.zats.test2.F110_ZK_6099Test org.zkoss.zktest.zats.test2.F110_ZK_6099ReducedMotionTest org.zkoss.zktest.zats.test2.B103_ZK_5818Test"
# other people's working-tree files, present since before P2 — never touched
ZK_OTHERS='^ M \.gitignore$|^\?\? lang-addon\.xsd$|^\?\? logs/$|^\?\? tasks/$'
ZKCML_OTHERS='^ M \.gitignore$|^ M lib/spel2js/package-lock\.json$|^\?\? zk85themebuilder/$'
MODE=${1:?mode required: static | live}
fail() { echo "2.11 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }
c() { /usr/bin/grep -c -- "$1" "$2" 2>/dev/null || true; }

case "$MODE" in
static)
  test -f "$CSSF" || fail "skeleton.css exists at $CSSF"
  test "$(c '@layer zk-components {' "$CSSF")" = 1 || fail "skeleton.css wraps its rules in one @layer zk-components block"
  for s in '.z-skeleton-active,' '.z-skeleton-overlay {' '.z-skeleton-active \* {' '.z-skeleton-active::after {' '.z-skeleton-active::before {' '.z-skeleton-masked {' '@keyframes z-skeleton-pulse {' '@media (prefers-reduced-motion: reduce) {' '.z-skeleton-circle {' '.z-skeleton-text {' '.z-skeleton-rect {'; do
    test "$(c "$s" "$CSSF")" -ge 1 || fail "skeleton.css carries the rule '$s'"
  done
  for v in --zk-skeleton-background --zk-skeleton-duration --zk-skeleton-radius --zk-skeleton-text-radius --zk-skeleton-min-opacity; do
    test "$(c "var($v," "$CSSF")" -ge 1 || fail "skeleton.css keeps the override property $v"
  done
  test "$(c 'var(--zk-color-surface-variant)' "$CSSF")" -ge 2 && test "$(c 'var(--zk-shape-corner-extra-small)' "$CSSF")" -ge 1 || fail "skeleton.css uses the Marble tokens --zk-color-surface-variant (fill) and --zk-shape-corner-extra-small (radius)"
  test "$(c '@import' "$CSSF")" = 0 && test "$(c '.z-skeleton-fill()' "$CSSF")" = 0 && test "$(c '@color' "$CSSF")" = 0 || fail "skeleton.css is plain CSS (no @import, no LESS mixin or variable)"
  ok "skeleton.css: layered Marble port with every rule and override of the retired LESS"

  test "$(c "'skeleton.css.dsp'," "$BUILD")" = 1 || fail "build-css.js lists 'skeleton.css.dsp' once in CSS_URI_BACKED"
  n=$(git -C "$ZK" diff --numstat -- scripts/build-css.js | awk '{print $1"/"$2}'); test "$n" = "3/0" || fail "git diff --numstat on build-css.js is '$n', expected 3/0"
  test "$(c "comp: '(global <stylesheet>)'" "$CHECK")" = 1 && test "$(c 'const sheetRe = ' "$CHECK")" = 1 || fail "check-css-dsp.js collects global <stylesheet href=…css.dsp> entries in extractRequired"
  n=$(git -C "$ZK" diff --numstat -- scripts/check-css-dsp.js | awk '{print $1"/"$2}'); test "$n" = "8/0" || fail "git diff --numstat on check-css-dsp.js is '$n', expected 8/0"
  node --check "$BUILD" && node --check "$CHECK" || fail "both scripts parse (node --check)"
  ok "scripts: build-css.js +3 (orphan guard knows the file), check-css-dsp.js +8 (global stylesheets verified)"

  extra=$(git -C "$ZK" status --short | /usr/bin/grep -vE "$ZK_OTHERS" | /usr/bin/grep -vE '^ M scripts/(build-css|check-css-dsp)\.js$' || true)
  test -z "$extra" || { echo "$extra"; fail "footprint in zk: only the two scripts change (other sessions' files excepted)"; }
  extra=$(git -C "$ZKCML" status --short | /usr/bin/grep -vE "$ZKCML_OTHERS" | /usr/bin/grep -vE '^\?\? zkex/src/main/resources/web/js/zkex/wgt/css/$|^\?\? zkex/src/main/resources/web/js/zkex/wgt/css/skeleton\.css$' || true)
  test -z "$extra" || { echo "$extra"; fail "footprint in zkcml: only the new skeleton.css (other sessions' files excepted)"; }
  test "$(c 'skeleton.css.dsp' "$ZKCML/zkex/src/main/resources/metainfo/zk/lang-addon.xml")" = 1 || fail "lang-addon.xml still declares the global skeleton.css.dsp stylesheet (unchanged)"
  ok "footprint: exactly the three files; lang-addon.xml untouched"
  echo "2.11 static ok" ;;

live)
  command -v node >/dev/null && command -v xmllint >/dev/null && test -x "$T/gradlew" || fail "environment: node / xmllint / zktest/gradlew"
  ok "environment: node, xmllint, gradlew"
  L=$(mktemp)
  (cd "$ZK" && node scripts/build-css.js --module zkex > "$L" 2>&1); rc=$?
  test "$rc" = 0 || { tail -n 20 "$L"; fail "build-css.js --module zkex exit $rc (orphan guard or layer guard?)"; }
  /usr/bin/grep -q 'js/zkex/wgt/css/skeleton.css.dsp' "$L" && test -s "$DSP" && /usr/bin/grep -q '\.z-skeleton-active' "$DSP" || fail "build-css.js … skeleton.css.dsp emitted at $DSP with the skeleton rules"
  ok "build-css.js --module zkex: skeleton.css.dsp emitted, orphan guard silent"

  (cd "$ZK" && node scripts/check-css-dsp.js --module zkex > "$L" 2>&1); rc=$?
  test "$rc" = 0 || { tail -n 20 "$L"; fail "check-css-dsp.js --module zkex exit $rc (expected 0)"; }
  /usr/bin/grep -E 'required by ZK : [0-9]+' "$L" | sed 's/^/   /'
  ok "check-css-dsp.js --module zkex: every requested file present"

  CP=$(mktemp -d); cp -R "$OUT/." "$CP/" && rm "$CP/js/zkex/wgt/css/skeleton.css.dsp" || fail "copy of the zkex build output without skeleton.css.dsp"
  (cd "$ZK" && node scripts/check-css-dsp.js --module zkex --theme-dir "$CP" > "$L" 2>&1); rc=$?
  test "$rc" = 1 && /usr/bin/grep -q 'js/zkex/wgt/css/skeleton.css.dsp' "$L" && /usr/bin/grep -q 'global <stylesheet>' "$L" || { tail -n 12 "$L"; fail "the guard: check-css-dsp.js exits 1 and names js/zkex/wgt/css/skeleton.css.dsp ← (global <stylesheet>) when the file is absent (got exit $rc)"; }
  ok "the guard now catches a dangling global <stylesheet> (negative check exit 1, file named)"

  args=""; for t in $TESTS; do args="$args --tests $t"; done
  (cd "$T" && ./gradlew test $args -PmaxParallelForks=1 --console=plain --no-daemon > "$L" 2>&1); rc=$?
  /usr/bin/grep -E "BUILD |tests completed|FAILED|No tests found" "$L" | head -n 8 | sed 's/^/   /'
  test "$rc" = 0 || { tail -n 30 "$L"; fail "gradle exit $rc for $TESTS (expected 0)"; }
  for t in $TESTS; do
    R="$T/build/test-results/test/TEST-$t.xml"; test -f "$R" || fail "JUnit report for $t written"
    n=$(xmllint --xpath 'string(/testsuite/@tests)' "$R"); f=$(xmllint --xpath 'string(/testsuite/@failures)' "$R"); e=$(xmllint --xpath 'string(/testsuite/@errors)' "$R"); s=$(xmllint --xpath 'string(/testsuite/@skipped)' "$R")
    echo "   $t: tests=$n failures=$f errors=$e skipped=$s"
    test "$n" -ge 1 && test "$f" = 0 && test "$e" = 0 && test "$s" = 0 || fail "$t: every test passed (tests≥1, failures=0, errors=0, skipped=0)"
  done
  ok "zktest: skeleton masking, reduced motion and the F62 control class all green (no 404 in the console)"
  echo "2.11 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
