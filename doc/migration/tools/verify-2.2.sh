#!/bin/bash
# verify-2.2.sh — verification for item 2.2 of the Marble → zk migration: the 159 preview / use-case pages, their
# assets and their Java helpers copied into the `zkpreview` module (execution plan §2 P2, row 2.2; plan D44).
#
# Usage:  bash doc/migration/tools/verify-2.2.sh static      file-level checks, no server, no Gradle (seconds)
#         bash doc/migration/tools/verify-2.2.sh live        starts the module's gretty server (appRun, background),
#                                                          opens every page in headless Chromium, stops it (~3 min warm)
#
# Layout under test (plan D44, layout A): the template's `src/test/resources/web/**` is copied byte-for-byte to
# `zkpreview/src/main/webapp/web/**`; `WEB-INF/zk.xml` sets `org.zkoss.web.util.resource.dir` = `/web` so the
# pages' `~./` references (sidebar links, `<apply templateURI>`, images, CSS) resolve into that directory; the
# template's `zk.example` helper classes are copied with the two Marble imports re-pointed and `ZulListVM`
# listing the webapp directory; `zuti` and `za11y` join the classpath (the template's preview app has both —
# `<apply>` and `<forEach>` are zuti shadow elements). Pages are addressed as
# http://127.0.0.1:8085<context path>/web/<page>.zul.
#
# Each check prints its own "stage:" marker; the first failing check names itself and exits 1.
# Dry-run contract (rule 2): on the tree as item 2.1 left it, `static` fails at "page tree present" and `live`
# at "zk.xml present"; every environment check passes. The script never deletes anything, never escalates, and
# writes only Gradle's own outputs plus temp files from mktemp. The server it starts is stopped on every exit
# path; the only process it ever kills is this module's own gretty runner (preview-server.sh).
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
MOD="$ZK/zkpreview"
SRC="$TPL/src/test/resources/web"
DST="$MOD/src/main/webapp/web"
JSRC="$TPL/src/test/java/zk/example"
JDST="$MOD/src/main/java/zk/example"
PORT=${PREVIEW_PORT:-8085}
# context path from build.gradle: '/zkpreview' until item 2.3, '/' afterwards (plan D47) — the script follows it
CTX=$(sed -n "s/^\tcontextPath = '\([^']*\)'.*/\1/p" "$MOD/build.gradle"); CTX=${CTX%/}
BASE="http://127.0.0.1:$PORT$CTX/web/"
MODE=${1:?mode required: static | live}
fail() { echo "2.2 $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }

case "$MODE" in
static)
  cd "$ZK" || fail "cd $ZK"
  V=$(sed -n 's/^version=//p' gradle.properties); test -n "$V" || fail "zk version unreadable"
  test -d "$SRC" && test -d "$JSRC" || fail "environment: template page tree / helper sources missing"
  n=$(find "$SRC" -name '*.zul' | wc -l | tr -d ' ')
  ok "environment: zk $V; template tree has $n .zul files"
  for f in build.gradle settings.gradle src/main/webapp/WEB-INF/web.xml src/main/webapp/smoke.zul src/main/java/org/zkoss/zkpreview/http/ZKPreviewServlet.java; do
    test -f "$MOD/$f" || fail "environment: item 2.1 layout — missing zkpreview/$f"
  done
  ok "environment: item 2.1's module layout intact"

  test -d "$DST" || fail "page tree present (zkpreview/src/main/webapp/web/)"
  ok "page tree present"

  # Byte-for-byte copy: same set of files (minus .DS_Store) and every file identical. Sorted relative paths on both sides.
  A=$(mktemp); B=$(mktemp)
  (cd "$SRC" && find . -type f ! -name .DS_Store | sed 's|^\./||' | sort) > "$A"
  (cd "$DST" && find . -type f | sed 's|^\./||' | sort) > "$B"
  if ! cmp -s "$A" "$B"; then echo "only in template:"; comm -23 "$A" "$B" | head -n 20; echo "only in zkpreview:"; comm -13 "$A" "$B" | head -n 20; fail "page tree file set differs from the template's (above; .DS_Store must not be copied)"; fi
  ok "page tree: same $(wc -l < "$A" | tr -d ' ') files as the template (no extra, no missing, no .DS_Store)"
  bad=0; while IFS= read -r f; do cmp -s "$SRC/$f" "$DST/$f" || { echo "   differs: $f"; bad=$((bad+1)); }; done < "$A"
  test "$bad" = 0 || fail "$bad copied files differ from the template originals"
  ok "page tree: every file byte-identical to the template ($(/usr/bin/grep -c '\.zul$' "$A") .zul)"

  # Java helpers: every zk.example class except the two Spring Boot launchers, byte-identical apart from the
  # two Marble import lines (the classes moved to org.zkoss.zul.theme in P1) and ZulListVM's directory lookup.
  test -d "$JDST" || fail "helper classes present (zkpreview/src/main/java/zk/example/)"
  for f in "$JSRC"/*.java; do b=$(basename "$f"); [ "$b" = ThemePreviewApp.java ] && continue
    test -f "$JDST/$b" || fail "helper classes — missing $b"; done
  test ! -e "$JDST/ThemePreviewApp.java" && test ! -d "$JDST/iceblue" || fail "helper classes — the Spring Boot launchers must not be copied"
  test "$(ls "$JDST"/*.java | wc -l | tr -d ' ')" = "$(ls "$JSRC"/*.java | /usr/bin/grep -vc ThemePreviewApp.java)" || fail "helper classes — extra files in zk/example"
  ok "helper classes: $(ls "$JDST"/*.java | wc -l | tr -d ' ') present, launchers excluded"
  for b in BrandSwitcherVM.java UseCaseVM.java; do
    extra=$(diff "$JSRC/$b" "$JDST/$b" | /usr/bin/grep -E '^[<>]' | /usr/bin/grep -vE '^< import org\.zkoss\.theme\.marble\.Marble(Brand|Density);$|^> import org\.zkoss\.zul\.theme\.Marble(Brand|Density);$' || true)
    test -z "$extra" || { echo "$extra"; fail "$b differs beyond the Marble import re-point"; }
    /usr/bin/grep -q 'import org.zkoss.zul.theme.Marble' "$JDST/$b" || fail "$b does not import org.zkoss.zul.theme.Marble*"
  done
  ok "BrandSwitcherVM / UseCaseVM: only the Marble import lines changed"
  /usr/bin/grep -q 'WebApps.getCurrent().getRealPath("/web")' "$JDST/ZulListVM.java" || fail "ZulListVM does not list the webapp's /web directory"
  extra=$(diff "$JSRC/ZulListVM.java" "$JDST/ZulListVM.java" | /usr/bin/grep -E '^[<>]' \
          | /usr/bin/grep -vE '^[<>] *//|^< *java\.net\.URL resource = |^[<>] *File dir = new File\(|^> import org\.zkoss\.zk\.ui\.WebApps;$|^> *$' || true)
  test -z "$extra" || { echo "$extra"; fail "ZulListVM differs beyond the directory lookup and its import"; }
  ok "ZulListVM: only the directory lookup (and its import) changed"
  for f in "$JSRC"/*.java; do b=$(basename "$f"); case "$b" in ThemePreviewApp.java|BrandSwitcherVM.java|UseCaseVM.java|ZulListVM.java) continue;; esac
    cmp -s "$f" "$JDST/$b" || fail "helper $b is not byte-identical to the template's"; done
  ok "the other helper classes are byte-identical"

  X="$MOD/src/main/webapp/WEB-INF/zk.xml"
  test -f "$X" || fail "zk.xml present"
  xmllint --noout "$X" || fail "zk.xml not well-formed"
  /usr/bin/grep -q '<config-name>marble-preview</config-name>' "$X" || fail "zk.xml: config-name marble-preview (as the template's test zk.xml)"
  /usr/bin/grep -q '<debug-js>true</debug-js>' "$X" || fail "zk.xml: debug-js true (as the template's test zk.xml)"
  /usr/bin/grep -A1 '<name>org.zkoss.web.util.resource.dir</name>' "$X" | /usr/bin/grep -q '<value>/web</value>' || fail "zk.xml: library-property org.zkoss.web.util.resource.dir must be /web"
  bad=$(/usr/bin/grep -nE 'theme.preferred|iceblue|cache' "$X" || true); test -z "$bad" || { echo "$bad"; fail "zk.xml carries settings this item does not own"; }
  ok "zk.xml: marble-preview, debug-js, resource.dir=/web, nothing else"

  B_="$MOD/build.gradle"
  /usr/bin/grep -q ':zuti:\${version}"' "$B_"  || fail "build.gradle lacks org.zkoss.zk:zuti (shadow elements <apply>/<forEach>)"
  /usr/bin/grep -q ':za11y:\${version}"' "$B_" || fail "build.gradle lacks org.zkoss.zk:za11y (on the template preview app's classpath)"
  /usr/bin/grep -q "exclude group: 'org.zkoss.zk', module: 'zkwebfragment'" "$B_" || fail "build.gradle lost the zkwebfragment exclusion"
  added=$(git diff -- zkpreview/build.gradle | /usr/bin/grep -E '^[-+][^-+]' || true)
  test "$(echo "$added" | /usr/bin/grep -c .)" = 2 && test -z "$(echo "$added" | /usr/bin/grep -vE '^\+[[:space:]]*implementation "org\.zkoss\.zk:(zuti|za11y):\$\{version\}"$')" \
    || { echo "$added"; fail "build.gradle diff is not exactly the two added dependency lines"; }
  ok "build.gradle: +zuti +za11y and nothing else"

  # Footprint is scoped to this item's own paths (rule 4: another item may be editing elsewhere in the checkout at the same time).
  mods=$(git diff --name-only -- zkpreview)
  test "$mods" = "zkpreview/build.gradle" || { echo "modified tracked files under zkpreview:"; echo "$mods"; fail "tracked modifications under zkpreview other than build.gradle"; }
  new=$(git status --porcelain -- zkpreview | /usr/bin/grep '^??' | sed 's/^?? //' | sort | tr '\n' ' ')
  test "$new" = "zkpreview/src/main/java/zk/ zkpreview/src/main/webapp/WEB-INF/zk.xml zkpreview/src/main/webapp/web/ " || { echo "untracked under zkpreview: $new"; fail "footprint: unexpected new paths under zkpreview"; }
  ok "footprint under zkpreview: build.gradle modified; zk/example, zk.xml and web/ new; nothing else"
  echo "2.2 static ok" ;;

live)
  command -v curl >/dev/null && test -x /usr/sbin/lsof && command -v node >/dev/null || fail "environment: curl / lsof / node"
  test -f "$TOOLS/page-smoke.js" && test -f "$TOOLS/preview-server.sh" || fail "environment: page-smoke.js / preview-server.sh missing"
  (cd "$TPL" && node -e "require('playwright')" 2>/dev/null) || fail "environment: the template's playwright dependency (npm ci in the template)"
  SPEC="$TPL/src/test/playwright/render-smoke.spec.ts"; test -f "$SPEC" || fail "environment: render-smoke.spec.ts (the strict page list)"
  ok "environment: curl, lsof, node + playwright, page-smoke.js, render-smoke.spec.ts"
  test -f "$MOD/src/main/webapp/WEB-INF/zk.xml" || fail "zk.xml present"
  test -d "$DST" || fail "page tree present"
  test -x "$MOD/gradlew" || fail "zkpreview wrapper present"
  . "$TOOLS/preview-server.sh"

  # Page list: the template's own smoke list (render-smoke.spec.ts) is the strict set — 200 and the .z-p-8 wrapper
  # visible, exactly what the template asserts; every other .zul in the tree outside pv/ is a page too and must
  # return 200 with a composed body. pv/*.zul are fragments pulled in by <apply templateURI="~./pv/…"> (the
  # template itself answers 500 for pv/cascader-content.zul when it is loaded directly), so they are exercised
  # through the 20 pages that include them, not navigated to.
  LIST=$(mktemp)
  /usr/bin/grep -oE "^  '/[^']+'" "$SPEC" | sed "s/^  '\///; s/'$/ strict/" > "$LIST"
  strict=$(wc -l < "$LIST" | tr -d ' '); test "$strict" -gt 100 || fail "strict list parsed from render-smoke.spec.ts has only $strict entries"
  (cd "$DST" && find . -name '*.zul' ! -path './pv/*' | sed 's|^\./||' | sort) | while IFS= read -r p; do
    /usr/bin/grep -qx "$p strict" "$LIST" || echo "$p"; done >> "$LIST"
  total=$(wc -l < "$LIST" | tr -d ' ')
  for p in preview.zul usecase/index.zul component-theming.zul; do /usr/bin/grep -qE "^$p( strict)?$" "$LIST" || fail "page list lacks $p"; done
  ok "page list: $total pages ($strict strict from the template's smoke spec, $((total-strict)) others incl. the SPA hosts); pv/ fragments excluded"

  preview_port_free
  ok "port $PORT free before start"
  preview_start "${BASE}button.zul"
  ok "gretty appRun serving; GET web/button.zul → HTTP 200"

  # The SPA host: preview.zul lists every top-level page (ZulListVM) and inlines each with <apply templateURI="~./…">.
  h1=$(curl -s -m 180 "${BASE}preview.zul" | /usr/bin/grep -o '<h1' | wc -l | tr -d ' ')
  test "$h1" -ge 100 || fail "preview.zul lists only $h1 pages (ZulListVM must see the webapp's /web directory)"
  ok "SPA host preview.zul lists $h1 pages"
  # A ~./ include and a class-web-resource asset resolve into the webapp directory (resource.dir=/web).
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$CTX/zkau/web/img/ZK-Logo.gif"); test "$code" = 200 || fail "~./img/ZK-Logo.gif via /zkau/web → HTTP $code"
  code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}intbox.zul"); test "$code" = 200 || fail "intbox.zul (applies ~./pv/matrix.zul) → HTTP $code"
  ok "~./ resolution: /zkau/web/img/ZK-Logo.gif 200, intbox.zul with its pv/matrix.zul template 200"

  R=$(mktemp)
  (cd "$TPL" && node "$TOOLS/page-smoke.js" "$BASE" "$LIST" 4) > "$R"; rc=$?
  /usr/bin/python3 - "$R" <<'PY'
import json,sys; d=json.load(open(sys.argv[1]))
print(f"   total {d['total']}  passed {d['passed']}  failed {d['failed']}  in {d['seconds']} s")
for f in d['failures'][:40]: print(f"   FAIL {f['path']}: {f['reason']}")
PY
  test "$rc" = 0 || fail "page smoke: $(/usr/bin/python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['failed'])" "$R") of $total pages failed (list above)"
  test "$(/usr/bin/python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['passed'])" "$R")" = "$total" || fail "page smoke passed count != $total"
  ok "page smoke: all $total pages HTTP 200 with a composed body; the $strict strict pages show the .z-p-8 wrapper"

  preview_stop; trap - EXIT
  preview_assert_free
  ok "server stopped; port $PORT free again"
  echo "2.2 live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
