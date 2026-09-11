#!/bin/bash
# verify-2.10.sh — verification for item 2.10 of the Marble → zk migration: the two theme-prefix lookups in
# zkpreview's copy of screenshot.spec.ts derive the prefix from the reset.css stylesheet link (plan D51, A).
#
# Usage:  bash doc/migration/tools/verify-2.10.sh static      file-level checks, no server (seconds)
#         bash doc/migration/tools/verify-2.10.sh live        starts the module's gretty server, runs the two tests
#
# Under test: in the template Marble is a theme jar and the reset link is /zkau/web/<v>/marble/zul/css/reset.css; in
# zk Marble is the core theme and the link is /zkres/web/<v>/zul/css/reset.css — no `marble` segment, so the two tests
# ("datebox timezone <select>" and "datebox & bandbox open-state") that fetched combo.css.dsp under the first href containing
# `/marble/` failed on every zkpreview run (F55). The copy now finds the reset.css link and slices the href before
# `/zul/css/reset.css`, which yields the same prefix as before in the template and the right one in zk. Exactly four
# lines change (two per test). verify-2.3.sh's git-diff checks assume the pre-commit 2.3 tree, so its harness
# diff (15 files against the template, allowlist = the 2.3 lines + these four) is repeated here instead.
#
# Dry-run contract (rule 2): on the tree as item 2.3 left it, `static` fails at "the four theme-prefix lines" and
# `live` at "2 passed" (both tests fail with "combo.css.dsp fetched"); the Planner ran the adapted spec from a
# throw-away copy on 2026-09-11: 2 passed. The script never deletes anything and writes only Playwright's
# own outputs plus mktemp files; the server it starts is stopped on every exit path (preview-server.sh).
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
MOD="$ZK/zkpreview"
HSRC="$TPL/src/test/playwright"
HDST="$MOD/src/test/playwright"
SPEC="$HDST/screenshot.spec.ts"
PORT=${PREVIEW_PORT:-8085}
BASE="http://127.0.0.1:$PORT"
MODE=${1:?mode required: static | live}
fail() { echo "2.10 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }

case "$MODE" in
static)
  cd "$ZK" || fail "cd $ZK"
  test -f "$SPEC" || fail "environment: zkpreview's screenshot.spec.ts missing (item 2.3)"
  test -d "$HSRC" && test "$(ls "$HSRC"/*.ts | wc -l | tr -d ' ')" = 15 || fail "environment: template harness (14 specs + config) missing"
  ok "environment: spec copy and the template harness present"

  test "$(/usr/bin/grep -c "\.find(h => h\.includes('/zul/css/reset\.css'));" "$SPEC")" = 2 \
    && test "$(/usr/bin/grep -c "const prefix = link\.slice(0, link\.indexOf('/zul/css/reset\.css'));" "$SPEC")" = 2 \
    || fail "the four theme-prefix lines (two .find on /zul/css/reset.css, two prefix slices) in the copy"
  test "$(/usr/bin/grep -c "/marble/" "$SPEC")" = 0 || fail "no /marble/ lookup left in the copy"
  /usr/bin/grep -q "fetch(prefix + '/js/zul/inp/css/combo.css.dsp')" "$SPEC" || fail "the combo.css.dsp fetch itself is unchanged"
  ok "spec copy: prefix derived from the reset.css link in both tests; nothing else about the fetch changed"

  n=$(git diff --numstat -- zkpreview/src/test/playwright/screenshot.spec.ts | awk '{print $1"/"$2}')
  test "$n" = "4/4" || fail "git diff --numstat on the spec copy is '$n', expected 4/4 (four lines replaced)"
  changed=$(git status --short -- zkpreview | /usr/bin/grep -v '^ M zkpreview/src/test/playwright/screenshot.spec.ts$' || true)
  test -z "$changed" || { echo "$changed"; fail "footprint: only screenshot.spec.ts may change under zkpreview"; }
  ok "footprint: exactly the four replaced lines in screenshot.spec.ts, nothing else under zkpreview"

  for f in "$HSRC"/*.ts; do b=$(basename "$f")
    case "$b" in
      focus-ring-scan.spec.ts|forced-colors-gallery.spec.ts|gallery-scan.spec.ts)
        extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE "^< const WEB_DIR = path\.resolve\(__dirname, '\.\./resources/web'\);$|^> const WEB_DIR = path\.resolve\(__dirname, '\.\./\.\./main/webapp/web'\);$" || true) ;;
      playwright.config.ts)
        extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE "^[<>] *// The port itself is bound in |^< *baseURL: process\.env\.PREVIEW_URL \?\? 'http://localhost:8081',$|^> *baseURL: process\.env\.PREVIEW_URL \?\? 'http://localhost:8085',$" || true) ;;
      screenshot.spec.ts)
        extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE "^< .*\.find\(h => h\.includes\('/marble/'\)\);$|^> .*\.find\(h => h\.includes\('/zul/css/reset\.css'\)\);$|^< *const prefix = link\.slice\(0, link\.indexOf\('/marble/'\) \+ '/marble'\.length\);$|^> *const prefix = link\.slice\(0, link\.indexOf\('/zul/css/reset\.css'\)\);$" || true) ;;
      *) extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' || true) ;;
    esac
    test -z "$extra" || { echo "$b:"; echo "$extra"; fail "$b differs from the template beyond the allowed lines (2.3's three WEB_DIR lines, the config's baseURL default, 2.10's four)"; }
  done
  ok "harness: 15 files diffed against the template; only the 2.3 lines and the four 2.10 lines differ"
  echo "2.10 static ok" ;;

live)
  command -v curl >/dev/null && test -x /usr/sbin/lsof && command -v npx >/dev/null || fail "environment: curl / lsof / npx"
  test -f "$TOOLS/preview-server.sh" || fail "environment: preview-server.sh missing"
  test -d "$MOD/node_modules/@playwright/test" || fail "harness node_modules present"
  ok "environment: curl, lsof, npx, preview-server.sh, node_modules"
  . "$TOOLS/preview-server.sh"

  preview_port_free
  ok "port $PORT free before start"
  preview_start "$BASE/datebox.zul"
  ok "gretty appRun serving; GET /datebox.zul → HTTP 200"

  link=$(curl -s -m 60 "$BASE/datebox.zul" | /usr/bin/grep -o 'href="[^"]*/zul/css/reset\.css[^"]*"' | head -n 1 | sed -e 's/^href="//' -e 's/"$//')
  test -n "$link" || fail "datebox.zul links a /zul/css/reset.css stylesheet"
  prefix=${link%%/zul/css/reset.css*}
  c=$(curl -s -o /dev/null -m 60 -w '%{http_code}' "$BASE$prefix/js/zul/inp/css/combo.css.dsp")
  test "$c" = 200 || fail "GET $prefix/js/zul/inp/css/combo.css.dsp → HTTP $c (expected 200)"
  ok "reset link $link; combo.css.dsp under its prefix → 200"

  L=$(mktemp)
  (cd "$MOD" && PREVIEW_URL="$BASE" npx playwright test --config src/test/playwright/playwright.config.ts --project=chromium -g "timezone <select>|open-state" --reporter=line > "$L" 2>&1); rc=$?
  tail -n 3 "$L" | tr -d '\033' | sed 's/\[[0-9;]*[A-Za-z]//g'
  test "$rc" = 0 || { /usr/bin/grep -E "✘|Error|failed" "$L" | head -n 12; fail "2 passed (the two theme-prefix tests against $BASE; exit $rc)"; }
  /usr/bin/grep -q "  2 passed" "$L" || fail "2 passed (expected exactly '2 passed' in the output)"
  ok "copied harness, --project=chromium -g \"timezone <select>|open-state\" against $BASE: 2 passed"

  preview_stop; trap - EXIT
  preview_assert_free
  ok "server stopped; port $PORT free again"
  echo "2.10 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
