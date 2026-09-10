#!/bin/bash
# verify-2.3.sh — verification for item 2.3 of the Marble → zk migration: the Playwright harness moves into
# `zkpreview` and the module answers at the context root (execution plan §2 P2, row 2.3; plan D47).
#
# Usage:  bash doc/migration/tools/verify-2.3.sh static      file-level checks, no server (seconds)
#         bash doc/migration/tools/verify-2.3.sh live        starts the module's gretty server, probes the context
#                                                          root, runs the copied harness's `smoke` project (~2.5 min warm)
#
# Under test (plan D47, A): gretty `contextPath = '/'`; `PreviewPathFilter` forwards `/<page>.zul` to `/web/<page>.zul`
# when that page exists, so the template's specs — which navigate with a leading slash — reach the module where they
# reached the template's preview app; the 14 specs + config are copied into `zkpreview/src/test/playwright/` with only
# the three `WEB_DIR` lines and the config's default `baseURL` (and its port comment) changed; `@playwright/test` is
# pinned to exactly 1.59.1 (the template's installed version, whose Chromium is already on this machine).
#
# Each check prints its own "stage:" marker; the first failing check names itself and exits 1.
# Dry-run contract (rule 2): on the tree as item 2.2 left it, `static` fails at "context root" and `live` at
# "forwarding filter present"; every environment check passes. The script never deletes anything and writes only
# Gradle's and Playwright's own outputs plus temp files from mktemp. The server it starts is stopped on every exit path
# (preview-server.sh); the only process it ever kills is this module's own gretty runner.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
MOD="$ZK/zkpreview"
HSRC="$TPL/src/test/playwright"
HDST="$MOD/src/test/playwright"
PORT=${PREVIEW_PORT:-8085}
BASE="http://127.0.0.1:$PORT"
MODE=${1:?mode required: static | live}
fail() { echo "2.3 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }

case "$MODE" in
static)
  cd "$ZK" || fail "cd $ZK"
  V=$(sed -n 's/^version=//p' gradle.properties); test -n "$V" || fail "zk version unreadable"
  test -d "$HSRC" && test "$(ls "$HSRC"/*.ts | wc -l | tr -d ' ')" = 15 || fail "environment: template harness (14 specs + config) missing"
  command -v node >/dev/null && command -v npm >/dev/null || fail "environment: node / npm"
  test -d "$MOD/src/main/webapp/web" || fail "environment: item 2.2's page tree missing"
  ok "environment: zk $V; template harness 15 files; node, npm; page tree present"

  B_="$MOD/build.gradle"
  /usr/bin/grep -q "^	contextPath = '/'$" "$B_" || fail "context root (build.gradle contextPath = '/')"
  d=$(git diff -- zkpreview/build.gradle | /usr/bin/grep -E '^[-+][^-+]')
  test "$(echo "$d" | /usr/bin/grep -c .)" = 2 && echo "$d" | /usr/bin/grep -q "^-	contextPath = '/zkpreview'" && echo "$d" | /usr/bin/grep -q "^+	contextPath = '/'" \
    || { echo "$d"; fail "build.gradle diff is not exactly the contextPath change"; }
  ok "context root: contextPath '/' and nothing else changed in build.gradle"

  F="$MOD/src/main/java/org/zkoss/zkpreview/http/PreviewPathFilter.java"
  test -f "$F" || fail "forwarding filter present"
  /usr/bin/grep -q '^package org.zkoss.zkpreview.http;' "$F" && /usr/bin/grep -q 'implements Filter' "$F" || fail "filter package / interface"
  /usr/bin/grep -q 'getServletPath()' "$F" && /usr/bin/grep -q 'startsWith("/web/")' "$F" && /usr/bin/grep -q 'getResource("/web" + path)' "$F" && /usr/bin/grep -q 'getRequestDispatcher("/web" + path).forward' "$F" \
    || fail "filter logic: servlet path, /web/ guard, existence check, forward"
  /usr/bin/grep -q 'javax.servlet' "$F" && ! /usr/bin/grep -q 'jakarta' "$F" || fail "filter must use javax.servlet (Servlet 2.4 API)"
  ! /usr/bin/grep -q 'getServletContext()' "$F" || /usr/bin/grep -q 'config.getServletContext()' "$F" || fail "filter: ServletRequest.getServletContext is Servlet 3.0 — take the context from FilterConfig"
  ok "PreviewPathFilter: javax, forwards /<page>.zul to /web/<page>.zul when it exists"

  W="$MOD/src/main/webapp/WEB-INF/web.xml"
  xmllint --noout "$W" || fail "web.xml not well-formed"
  /usr/bin/grep -q '<filter-class>org.zkoss.zkpreview.http.PreviewPathFilter</filter-class>' "$W" || fail "web.xml: filter not declared"
  /usr/bin/grep -A1 '<filter-name>previewPath</filter-name>' "$W" | /usr/bin/grep -q '<url-pattern>\*\.zul</url-pattern>' || fail "web.xml: filter not mapped to *.zul"
  d=$(git diff -- zkpreview/src/main/webapp/WEB-INF/web.xml | /usr/bin/grep -E '^[-+][^-+]')
  test "$(echo "$d" | /usr/bin/grep -c '^-')" = 0 || { echo "$d"; fail "web.xml: lines were removed"; }
  n=$(echo "$d" | /usr/bin/grep -c '^+'); test "$n" -ge 9 && test "$n" -le 11 || { echo "$d"; fail "web.xml: expected the 9–11 added filter lines, got $n"; }
  ok "web.xml: previewPath filter on *.zul, only lines added"

  test -d "$HDST" || fail "harness present (zkpreview/src/test/playwright/)"
  diff <(cd "$HSRC" && ls *.ts) <(cd "$HDST" && ls) || fail "harness file set differs from the template's src/test/playwright (above)"
  for f in "$HSRC"/*.ts; do b=$(basename "$f")
    case "$b" in
      focus-ring-scan.spec.ts|forced-colors-gallery.spec.ts|gallery-scan.spec.ts)
        extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE "^< const WEB_DIR = path\.resolve\(__dirname, '\.\./resources/web'\);$|^> const WEB_DIR = path\.resolve\(__dirname, '\.\./\.\./main/webapp/web'\);$" || true)
        /usr/bin/grep -q "path.resolve(__dirname, '../../main/webapp/web')" "$HDST/$b" || fail "$b: WEB_DIR not re-pointed at ../../main/webapp/web" ;;
      playwright.config.ts)
        extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE "^[<>] *// The port itself is bound in |^< *baseURL: process\.env\.PREVIEW_URL \?\? 'http://localhost:8081',$|^> *baseURL: process\.env\.PREVIEW_URL \?\? 'http://localhost:8085',$" || true)
        /usr/bin/grep -q "baseURL: process.env.PREVIEW_URL ?? 'http://localhost:8085'," "$HDST/$b" || fail "playwright.config.ts: default baseURL is not http://localhost:8085" ;;
      *) extra=$(diff "$f" "$HDST/$b" | /usr/bin/grep -E '^[<>]' || true) ;;
    esac
    test -z "$extra" || { echo "$b:"; echo "$extra"; fail "$b differs from the template beyond the allowed lines"; }
  done
  ok "harness: 15 files; 11 byte-identical, 3 WEB_DIR lines and the config's baseURL default re-pointed, nothing else"
  cmp -s "$TPL/doc/focus-ring-known-clips.json" "$MOD/doc/focus-ring-known-clips.json" || fail "doc/focus-ring-known-clips.json missing or not byte-identical"
  ok "focus-ring-known-clips.json copied byte-identical (BASELINE_FILE resolves to zkpreview/doc/)"

  P="$MOD/package.json"; test -f "$P" || fail "package.json present"
  /usr/bin/grep -q '"@playwright/test": "1.59.1"' "$P" || fail "package.json must pin @playwright/test to exactly 1.59.1 (a caret pulled 1.63.0, whose Chromium is not installed here)"
  /usr/bin/grep -q '"private": true' "$P" || fail "package.json: private"
  for s in test:focus-scan test:hit-target test:forced-colors capture:forced-colors screenshot:test screenshot:update; do /usr/bin/grep -q "\"$s\":" "$P" || fail "package.json: script $s"; done
  test -f "$MOD/package-lock.json" || fail "package-lock.json present (npm install ran)"
  test "$(cd "$MOD" && node -e "console.log(require('./package-lock.json').packages['node_modules/@playwright/test'].version)")" = "1.59.1" || fail "package-lock does not lock @playwright/test 1.59.1"
  test "$(cd "$MOD" && node -e "console.log(require('@playwright/test/package.json').version)" 2>/dev/null)" = "1.59.1" || fail "node_modules: @playwright/test 1.59.1 not installed in zkpreview"
  /usr/bin/grep -qx 'test-results/' "$MOD/.gitignore" && /usr/bin/grep -qx 'playwright-report/' "$MOD/.gitignore" || fail "zkpreview/.gitignore lacks test-results/ and playwright-report/"
  ok "package.json pins @playwright/test 1.59.1 (locked, installed), six harness scripts, module .gitignore"

  mods=$(git diff --name-only -- zkpreview | sort | tr '\n' ' ')
  test "$mods" = "zkpreview/build.gradle zkpreview/src/main/webapp/WEB-INF/web.xml " || { echo "modified under zkpreview: $mods"; fail "footprint: tracked modifications other than build.gradle and web.xml"; }
  new=$(git status --porcelain -- zkpreview | /usr/bin/grep '^??' | sed 's/^?? //' | sort | tr '\n' ' ')
  test "$new" = "zkpreview/.gitignore zkpreview/doc/ zkpreview/package-lock.json zkpreview/package.json zkpreview/src/main/java/org/zkoss/zkpreview/http/PreviewPathFilter.java zkpreview/src/test/ " \
    || { echo "untracked under zkpreview: $new"; fail "footprint: unexpected new paths under zkpreview"; }
  ok "footprint under zkpreview: build.gradle + web.xml modified; .gitignore, doc/, package files, filter, src/test/ new"
  echo "2.3 static ok" ;;

live)
  command -v curl >/dev/null && test -x /usr/sbin/lsof && command -v node >/dev/null && command -v npx >/dev/null || fail "environment: curl / lsof / node / npx"
  test -f "$TOOLS/preview-server.sh" || fail "environment: preview-server.sh missing"
  ok "environment: curl, lsof, node, npx, preview-server.sh"
  test -f "$MOD/src/main/java/org/zkoss/zkpreview/http/PreviewPathFilter.java" || fail "forwarding filter present"
  test -f "$HDST/playwright.config.ts" && test -d "$MOD/node_modules/@playwright/test" || fail "harness and its node_modules present"
  test -x "$MOD/gradlew" || fail "zkpreview wrapper present"
  . "$TOOLS/preview-server.sh"

  preview_port_free
  ok "port $PORT free before start"
  preview_start "$BASE/button.zul"
  ok "gretty appRun serving at the context root; GET /button.zul → HTTP 200"

  code() { curl -s -o /dev/null -m 60 -w '%{http_code}' "$BASE$1"; }
  test "$(code /web/button.zul)" = 200 || fail "/web/button.zul (the page's real location) → HTTP $(code /web/button.zul)"
  test "$(code /smoke.zul)" = 200 || fail "/smoke.zul (a root page the filter must leave alone) → HTTP $(code /smoke.zul)"
  test "$(code /nonexistent.zul)" = 404 || fail "/nonexistent.zul → HTTP $(code /nonexistent.zul), expected 404 (the filter must not forward what does not exist)"
  test "$(code /zkau/web/img/ZK-Logo.gif)" = 200 || fail "~./img via /zkau/web → HTTP $(code /zkau/web/img/ZK-Logo.gif)"
  ok "root /<page>.zul forwards; /web/ and /smoke.zul untouched; unknown page 404; class web resources served"
  q=$(curl -s -o /dev/null -m 60 -w '%{http_code} [%{redirect_url}]' "$BASE/button.zul?foo=1")
  test "$q" = "200 []" || fail "query string: GET /button.zul?foo=1 → $q (expected 200 and no redirect — the query must survive the forward)"
  ok "negative test: a query string survives (200, no redirect)"

  N=$(/usr/bin/grep -c "^  '/" "$HDST/render-smoke.spec.ts"); test "$N" -gt 100 || fail "smoke spec lists only $N pages"
  L=$(mktemp)
  (cd "$MOD" && PREVIEW_URL="$BASE" npx playwright test --config src/test/playwright/playwright.config.ts --project=smoke --reporter=line > "$L" 2>&1); rc=$?
  tail -n 3 "$L" | tr -d '\033' | sed 's/\[[0-9;]*[A-Za-z]//g'
  test "$rc" = 0 || { /usr/bin/grep -E "✘|Error|failed" "$L" | head -n 20; fail "the copied harness's smoke project failed (exit $rc)"; }
  /usr/bin/grep -q "  $N passed" "$L" || fail "expected '$N passed' in the smoke output"
  ok "copied harness, --project=smoke against $BASE: $N passed"
  L2=$(mktemp)
  (cd "$MOD" && env -u PREVIEW_URL npx playwright test --config src/test/playwright/playwright.config.ts --project=smoke --reporter=line -g "renders /button.zul" > "$L2" 2>&1) || { tail -n 20 "$L2"; fail "default baseURL (no PREVIEW_URL) run"; }
  /usr/bin/grep -q "  1 passed" "$L2" || fail "default baseURL run did not report 1 passed"
  ok "default baseURL (http://localhost:8085, no PREVIEW_URL): 1 passed"

  preview_stop; trap - EXIT
  preview_assert_free
  ok "server stopped; port $PORT free again"
  echo "2.3 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
