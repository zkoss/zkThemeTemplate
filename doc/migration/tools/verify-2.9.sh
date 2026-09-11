#!/bin/bash
# verify-2.9.sh — verification for item 2.9 of the Marble → zk migration: the zktest WebDriver test for the ZK 11
# provider change (plan D32, F35) — StandardThemeProvider links the reset stylesheet immediately before zk.wcs, and
# the library property org.zkoss.zul.theme.browserDefault=true serves reset-embed.css instead of reset.css.
#
# Usage:  bash doc/migration/tools/verify-2.9.sh static      file-level checks, no build (seconds)
#         bash doc/migration/tools/verify-2.9.sh live        runs the one test class through Gradle (minutes; see below)
#
# Under test, all under zk/zktest: src/test/java/org/zkoss/zktest/zats/test2/B110_ZK_6112Test.java (two @Test methods,
# no @ForkJVMTestOnly, no ExternalZkXml — the property is toggled with Library.setProperty inside the test JVM, which
# also hosts the embedded Jetty), src/main/webapp/test2/B110-ZK-6112.zul, and one added line in
# src/main/webapp/test2/config.properties. Live runs exactly the command row 2.9 gives and reads the JUnit XML report.
#
# Dry-run contract (rule 2): on the tree before the Generator, `static` fails at "test class"; `live` fails at
# "gradle exit" (Gradle: No tests found for given includes). The script never deletes anything and writes only what
# Gradle writes under zktest/build plus mktemp files; it starts no server of its own (the test does, in-JVM).
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
T="$ZK/zktest"
TEST="$T/src/test/java/org/zkoss/zktest/zats/test2/B110_ZK_6112Test.java"
PAGE="$T/src/main/webapp/test2/B110-ZK-6112.zul"
CONF="$T/src/main/webapp/test2/config.properties"
REPORT="$T/build/test-results/test/TEST-org.zkoss.zktest.zats.test2.B110_ZK_6112Test.xml"
# working-tree changes under zktest that belong to other people's sessions (present since before P2 — never touched)
OTHERS='^ M zktest/build.gradle$|^ M zktest/src/test/java/org/zkoss/zktest/zats/test2/B86_ZK_4102Test.java$|^ M zktest/src/test/java/org/zkoss/zktest/zats/test2/F96_ZK_4783Test.java$'
MODE=${1:?mode required: static | live}
fail() { echo "2.9 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }
c() { /usr/bin/grep -c -- "$1" "$2" 2>/dev/null || true; }

case "$MODE" in
static)
  cd "$ZK" || fail "cd $ZK"
  test -f "$TEST" || fail "test class $TEST exists"
  test -f "$PAGE" || fail "page $PAGE exists"
  ok "environment: test class and page present"

  test "$(c '@Test' "$TEST")" = 2 || fail "exactly two @Test methods in the class (found $(c '@Test' "$TEST"))"
  test "$(c 'ForkJVMTestOnly' "$TEST")" = 0 && test "$(c 'ExternalZkXml' "$TEST")" = 0 || fail "no @ForkJVMTestOnly / ExternalZkXml (the property is toggled in-JVM, no Docker fork)"
  test "$(c 'extends WebDriverTestCase' "$TEST")" = 1 || fail "extends WebDriverTestCase"
  test "$(c 'org.zkoss.zul.theme.browserDefault' "$TEST")" -ge 1 || fail "the test names the library property org.zkoss.zul.theme.browserDefault"
  test "$(c 'Library.setProperty' "$TEST")" -ge 2 || fail "Library.setProperty is used to set AND to clear the property (≥ 2 occurrences)"
  for s in '/zul/css/reset.css' '/zul/css/reset-embed.css' '/zul/css/zk.wcs'; do
    test "$(c "$s" "$TEST")" -ge 1 || fail "the test refers to $s"
  done
  test "$(c 'assertNoAnyError' "$TEST")" -ge 2 || fail "both tests end with assertNoAnyError()"
  ok "test class: two in-JVM tests asserting reset.css / reset-embed.css before zk.wcs"

  test "$(c 'reset-embed.css' "$PAGE")" -ge 1 && test "$(c 'zk.wcs' "$PAGE")" -ge 1 || fail "the page's label explains what to look at (reset-embed.css, zk.wcs)"
  xmllint --noout "$PAGE" 2>/dev/null || fail "page is well-formed XML"
  test "$(c '##zats##B110-ZK-6112.zul=' "$CONF")" = 1 || fail "config.properties registers ##zats##B110-ZK-6112.zul= exactly once"
  n=$(git diff --numstat -- zktest/src/main/webapp/test2/config.properties | awk '{print $1"/"$2}')
  test "$n" = "1/0" || fail "git diff --numstat on config.properties is '$n', expected 1/0 (one added line)"
  ok "page well-formed; config.properties gains exactly one registration line"

  extra=$(git status --short -- zktest | /usr/bin/grep -vE "$OTHERS" | /usr/bin/grep -vE '^\?\? zktest/src/test/java/org/zkoss/zktest/zats/test2/B110_ZK_6112Test.java$|^\?\? zktest/src/main/webapp/test2/B110-ZK-6112.zul$|^ M zktest/src/main/webapp/test2/config.properties$' || true)
  test -z "$extra" || { echo "$extra"; fail "footprint: only the test, the page and config.properties change under zktest (other sessions' three files excepted)"; }
  test -z "$(git status --short | /usr/bin/grep -E '^.. (zul|zk|zkbind|zkpreview)/' || true)" || fail "footprint: nothing changes under zul/, zk/, zkbind/ or zkpreview/"
  ok "footprint: exactly the three zktest files"
  echo "2.9 static ok" ;;

live)
  command -v xmllint >/dev/null || fail "environment: xmllint"
  test -x "$T/gradlew" || fail "environment: zktest/gradlew"
  ok "environment: gradlew, xmllint"
  L=$(mktemp)
  rm -f "$REPORT"
  (cd "$T" && ./gradlew test --tests "org.zkoss.zktest.zats.test2.B110_ZK_6112Test" -PmaxParallelForks=1 --console=plain --no-daemon > "$L" 2>&1); rc=$?
  /usr/bin/grep -E "BUILD |tests completed|FAILED|No tests found" "$L" | head -n 8 | sed 's/^/   /'
  test "$rc" = 0 || { tail -n 30 "$L"; fail "gradle exit $rc (expected 0)"; }
  test -f "$REPORT" || fail "JUnit report $REPORT written"
  tests=$(xmllint --xpath 'string(/testsuite/@tests)' "$REPORT"); f=$(xmllint --xpath 'string(/testsuite/@failures)' "$REPORT")
  e=$(xmllint --xpath 'string(/testsuite/@errors)' "$REPORT"); sk=$(xmllint --xpath 'string(/testsuite/@skipped)' "$REPORT")
  echo "   report: tests=$tests failures=$f errors=$e skipped=$sk"
  test "$tests" = 2 && test "$f" = 0 && test "$e" = 0 && test "$sk" = 0 || fail "report shows tests=2 failures=0 errors=0 skipped=0"
  /usr/bin/grep -q 'testResetPrecedesWcs' "$REPORT" && /usr/bin/grep -q 'testBrowserDefaultServesEmbedReset' "$REPORT" || fail "both test methods ran (testResetPrecedesWcs, testBrowserDefaultServesEmbedReset)"
  ok "B110_ZK_6112Test: 2 tests, 0 failures (Gradle exit 0)"
  echo "2.9 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
