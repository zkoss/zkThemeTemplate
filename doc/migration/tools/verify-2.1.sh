#!/bin/bash
# verify-2.1.sh — verification for item 2.1 of the Marble → zk migration: the `zkpreview` module
# (execution plan §2 P2, row 2.1; harness rules 1–3).
#
# Usage:  bash doc/migration/tools/verify-2.1.sh static      file-level checks, no server (~1 min: one Gradle configure)
#         bash doc/migration/tools/verify-2.1.sh live        starts the module's gretty server, probes one page, stops it
#
# Each check prints its own "stage:" marker; the first failing check names itself and exits 1.
# Dry-run contract (rule 2): on a tree without zkpreview/, `static` fails at the first marker
# ("zkpreview layout") and `live` fails at "zkpreview wrapper present"; every environment check passes.
# The script never deletes anything, never escalates, and writes only Gradle's own outputs plus temp
# files from mktemp. The server it starts is stopped on every exit path (trap).
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
MOD="$ZK/zkpreview"
PORT=${PREVIEW_PORT:-8085}
URL="http://127.0.0.1:$PORT/zkpreview/smoke.zul"
MODE=${1:?mode required: static | live}
fail() { echo "2.1 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }

case "$MODE" in
static)
  cd "$ZK" || fail "cd $ZK"
  V=$(sed -n 's/^version=//p' gradle.properties); test -n "$V" || fail "zk version unreadable"
  ok "environment: zk $V"

  for f in settings.gradle build.gradle gradle.properties gradlew gradle/wrapper/gradle-wrapper.jar gradle/wrapper/gradle-wrapper.properties \
           src/main/java/org/zkoss/zkpreview/http/ZKPreviewServlet.java src/main/webapp/WEB-INF/web.xml src/main/webapp/smoke.zul; do
    test -f "$MOD/$f" || fail "zkpreview layout — missing zkpreview/$f"
  done
  test -x "$MOD/gradlew" || fail "zkpreview layout — gradlew not executable"
  ok "zkpreview layout (9 files present, gradlew executable)"

  test "$(sed -n 's/^version=//p' "$MOD/gradle.properties")" = "$V" || fail "gradle.properties version != zk's $V"
  cmp -s "$MOD/gradle/wrapper/gradle-wrapper.properties" zktest/gradle/wrapper/gradle-wrapper.properties || fail "wrapper properties differ from zktest's"
  ok "version $V and zktest's Gradle wrapper"

  /usr/bin/grep -q "^rootProject.name = 'zkpreview'" "$MOD/settings.gradle" || fail "settings.gradle rootProject.name"
  diff <(/usr/bin/grep 'substitute module' zktest/settings.gradle | sort) <(/usr/bin/grep 'substitute module' "$MOD/settings.gradle" | sort) \
    || fail "dependencySubstitution lines are not zktest's (diff above)"
  test "$(/usr/bin/grep -c 'includeBuild(' "$MOD/settings.gradle")" = 2 || fail "settings.gradle must includeBuild zk and zkcml"
  ok "settings.gradle: zktest-style includeBuild + 14 identical substitute lines"

  B="$MOD/build.gradle"
  /usr/bin/grep -q "id 'war'" "$B"                                  || fail "build.gradle lacks the war plugin"
  /usr/bin/grep -q 'id "org.gretty" version "3.1.1"' "$B"           || fail "build.gradle lacks gretty 3.1.1"
  /usr/bin/grep -q "providedCompile 'javax.servlet:servlet-api" "$B" || fail "build.gradle lacks the javax servlet-api providedCompile"
  for m in zweb zweb-dsp zk zul zkex zkmax; do /usr/bin/grep -q ":$m:\${version}\"" "$B" || fail "build.gradle lacks org.zkoss …:$m:\${version}"; done
  bad=$(/usr/bin/grep -nE 'iceblue_c|jasperreports|ckez|timelinez|timeplotz|gmapsz|zuljsp|zcommons-el' "$B" || true)
  test -z "$bad" || { echo "$bad"; fail "build.gradle still carries zksandbox-only dependencies"; }
  /usr/bin/grep -q "$PORT" "$B" || fail "build.gradle does not default httpPort to $PORT"
  ok "build.gradle: war + gretty 3.1.1, ZK modules by \${version}, zksandbox extras stripped, port $PORT"

  S="$MOD/src/main/java/org/zkoss/zkpreview/http/ZKPreviewServlet.java"
  T=zktest/src/main/java/org/zkoss/zktest/http/ZKTestServlet.java
  test "$(wc -l < "$S" | tr -d ' ')" = "$(wc -l < "$T" | tr -d ' ')" || fail "servlet line count differs from ZKTestServlet"
  /usr/bin/grep -q '^package org.zkoss.zkpreview.http;' "$S" || fail "servlet package line"
  diff <(sed -n '/^import /,$p' "$S" | sed 's/ZKPreviewServlet/ZKTestServlet/g') <(sed -n '/^import /,$p' "$T") \
    || fail "servlet body is not ZKTestServlet verbatim (diff above)"
  ok "ZKPreviewServlet is ZKTestServlet verbatim apart from package and class name"

  W="$MOD/src/main/webapp/WEB-INF/web.xml"
  xmllint --noout "$W" || fail "web.xml not well-formed"
  /usr/bin/grep -q 'org.zkoss.zkpreview.http.ZKPreviewServlet' "$W" || fail "web.xml: zkLoader is not ZKPreviewServlet"
  /usr/bin/grep -q 'org.zkoss.zk.au.http.DHtmlUpdateServlet' "$W"   || fail "web.xml: no DHtmlUpdateServlet"
  /usr/bin/grep -q 'org.zkoss.zk.au.http.DHtmlResourceServlet' "$W" || fail "web.xml: no DHtmlResourceServlet"
  /usr/bin/grep -q 'org.zkoss.zk.ui.http.HttpSessionListener' "$W"  || fail "web.xml: no HttpSessionListener"
  /usr/bin/grep -q '<url-pattern>\*\.zul</url-pattern>' "$W"        || fail "web.xml: *.zul not mapped"
  bad=$(/usr/bin/grep -nE 'FacesServlet|weld|EmbeddedServlet|BookSuggest|zktest' "$W" || true)
  test -z "$bad" || { echo "$bad"; fail "web.xml carries zktest-only wiring"; }
  ok "web.xml: loader/update/resource servlets, listener, *.zul; nothing from zktest"

  test "$(/usr/bin/grep -c 'includeBuild new File(rootDir, "zkpreview")' settings.gradle)" = 1 || fail "root settings.gradle does not includeBuild zkpreview"
  ok "root settings.gradle includes zkpreview"

  mods=$(git diff --name-only -- . ':!.gitignore')
  test "$mods" = "settings.gradle" || { echo "modified tracked files:"; echo "$mods"; fail "tracked modifications other than settings.gradle"; }
  ok "footprint: settings.gradle is the only modified tracked file; zkpreview/ is new"

  ./gradlew help --console=plain -q >/dev/null || fail "root ./gradlew help with zkpreview included (mutual includeBuild)"
  cd "$MOD" && ./gradlew help --console=plain -q >/dev/null || fail "zkpreview ./gradlew help (its own composite: includeBuild zk + zkcml)"
  ok "both composites configure: root → zkpreview and zkpreview → zk/zkcml"
  echo "2.1 static ok" ;;

live)
  command -v curl >/dev/null && test -x /usr/sbin/lsof || fail "environment: curl / lsof"
  test -x "$TOOLS/page-probe.js" -o -f "$TOOLS/page-probe.js" || fail "environment: page-probe.js missing"
  ok "environment: curl, lsof, page-probe.js"
  test -x "$MOD/gradlew" || fail "zkpreview wrapper present"
  busy=$(/usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)
  test -z "$busy" || { echo "$busy"; fail "port $PORT already listening before start (run ./gradlew appStop in zkpreview)"; }
  ok "port $PORT free before start"

  cd "$MOD" || fail "cd $MOD"
  stop() { ./gradlew appStop --console=plain -q >/dev/null 2>&1; }
  trap stop EXIT
  L=$(mktemp)
  ./gradlew appStart -PhttpPort="$PORT" --console=plain -q > "$L" 2>&1 || { tail -n 40 "$L"; fail "gretty appStart"; }
  ok "gretty appStart returned"

  code=000
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)
    test "$code" = 200 && break
    sleep 1
  done
  test "$code" = 200 || fail "GET $URL → HTTP $code after 60 s"
  ok "GET smoke.zul → HTTP 200"

  H=$(mktemp); curl -s "$URL" > "$H"
  hrefs=$(/usr/bin/grep -oE '<link[^>]*rel="stylesheet"[^>]*>' "$H" | /usr/bin/grep -oE 'href="[^"]+"' | sed 's/href="//;s/"$//')
  echo "$hrefs" | sed 's/^/   stylesheet: /'
  r=$(echo "$hrefs" | /usr/bin/grep -nE '/reset(-embed)?\.css' | head -n 1 | cut -d: -f1)
  w=$(echo "$hrefs" | /usr/bin/grep -nE '/zk\.wcs' | head -n 1 | cut -d: -f1)
  test -n "$r" || fail "no reset stylesheet <link> in the page (StandardThemeProvider.insertResetURI)"
  test -n "$w" || fail "no zk.wcs <link> in the page"
  test "$r" -lt "$w" || fail "reset link (#$r) does not precede zk.wcs (#$w)"
  ok "HTML: reset stylesheet link #$r precedes zk.wcs link #$w"

  P=$(mktemp)
  node "$TOOLS/page-probe.js" "$URL" > "$P" || { cat "$P"; fail "page-probe (Playwright) run"; }
  cat "$P"
  get() { /usr/bin/python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$P" "$1"; }
  test "$(get status)" = 200 || fail "in-page status $(get status)"
  test "$(get zkVarDecls)" -gt 0 || fail "no --zk-* declarations in document.styleSheets — the theme was not served"
  ri=$(get resetIndex); wi=$(get wcsIndex)
  test "$ri" -ge 0 && test "$wi" -ge 0 && test "$ri" -lt "$wi" || fail "document.styleSheets order: reset $ri, zk.wcs $wi"
  ok "in-page: $(get zkVarDecls) --zk-* declarations; reset sheet #$ri precedes zk.wcs #$wi"

  stop; trap - EXIT
  for _ in $(seq 1 30); do
    test -z "$(/usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)" && break
    sleep 1
  done
  test -z "$(/usr/sbin/lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)" || fail "port $PORT still listening after appStop"
  ok "gretty appStop; port $PORT free again"
  echo "2.1 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
