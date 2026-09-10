#!/bin/bash
# preflight-p2.sh — P2 environment pre-flight for the Marble → zk migration (execution plan §4, harness rule 7).
#
# Usage:  bash doc/migration/tools/preflight-p2.sh            run every stage; stops at the first failure
#
# Why: all six first-run FAILs in P1 were environment or verification-command defects, not Generator
# defects (p1-retrospective.md). This script proves, before the first P2 item is dispatched, that every
# tool a P2 verify script depends on is present and warm: repos on the right branches, Java 11, Chrome,
# the template's Playwright runtime, the preview port free, the zk composite build assembled, and the
# P2 tool scripts syntactically valid. It writes nothing except Gradle's own build outputs and one
# temp dir it removes itself; it never escalates and never deletes anything of the tree.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
PREVIEW_PORT=${PREVIEW_PORT:-8085}   # the zkpreview module's gretty httpPort (item 2.1)
fail() { echo "PREFLIGHT FAIL at: $1"; exit 1; }

echo "== 1 repos and branches"
for spec in "$ZK:marble" "$ZKCML:marble" "$TPL:new_theme"; do
  repo=${spec%%:*}; want=${spec##*:}
  b=$(git -C "$repo" branch --show-current) || fail "git in $repo"
  test "$b" = "$want" || fail "$repo is on branch '$b', expected '$want'"
  echo "   $repo on $b; uncommitted (other people's files are expected here):"
  git -C "$repo" status --short | sed 's/^/     /'
done
echo "STAGE 1 OK: zk and zkcml on marble, template on new_theme"

echo "== 2 toolchain"
jv=$(java -version 2>&1 | head -n 1); echo "   $jv"
echo "$jv" | /usr/bin/grep -q '"11\.' || fail "default java is not 11 ($jv)"
for t in node curl unzip xmllint; do command -v "$t" >/dev/null || fail "$t not on PATH"; done
test -x /usr/sbin/lsof || fail "/usr/sbin/lsof missing"
test -x /usr/bin/python3 || fail "/usr/bin/python3 missing (the pyenv shim is cwd-dependent; scripts use the system one)"
echo "STAGE 2 OK: java 11, node $(node --version), curl, unzip, xmllint, lsof, /usr/bin/python3"

echo "== 3 browsers"
test -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" || fail "Google Chrome not installed (zktest WebDriver tests need it)"
cd "$TPL" || fail "cd $TPL"
pw=$(node -e "process.stdout.write(require('playwright').chromium.executablePath())" 2>/dev/null) || fail "require('playwright') failed in $TPL — run npm ci there"
test -x "$pw" || fail "Playwright's Chromium is not installed at $pw — run: npx playwright install chromium"
echo "   playwright $(npx playwright --version 2>/dev/null | tail -n 1) → $pw"
echo "STAGE 3 OK: Chrome and Playwright Chromium present"

echo "== 4 ports"
busy=$(/usr/sbin/lsof -nP -iTCP:"$PREVIEW_PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2)
test -z "$busy" || { echo "$busy"; fail "port $PREVIEW_PORT (zkpreview) is already listening — stop that server or export PREVIEW_PORT=<free port> for the P2 scripts"; }
for p in 8080 8081; do
  o=$(/usr/sbin/lsof -nP -iTCP:"$p" -sTCP:LISTEN 2>/dev/null | tail -n +2 | awk '{print $1" pid "$2}' | head -n 1)
  echo "   port $p: ${o:-free} (informational; zktest's gretty default is 8080, the template's Spring Boot preview is 8081)"
done
echo "STAGE 4 OK: port $PREVIEW_PORT free for zkpreview"

echo "== 5 zk composite build warm"
V=$(sed -n 's/^version=//p' "$ZK/gradle.properties"); test -n "$V" || fail "no version= in $ZK/gradle.properties"
cd "$ZK" || fail "cd $ZK"
./gradlew :zul:assemble --console=plain -q || fail ":zul:assemble"
test -f "zul/build/libs/zul-$V.jar" || fail "zul-$V.jar missing after assemble"
cd "$ZK/zktest" || fail "cd zktest"
./gradlew help --console=plain -q >/dev/null || fail "zktest composite build (includeBuild zk + zkcml with dependencySubstitution) does not configure"
echo "STAGE 5 OK: zul-$V.jar assembled; zktest composite configures"

echo "== 6 permission-neutral scratch"
d=$(mktemp -d) || fail "mktemp -d"
echo probe > "$d/probe" && test -s "$d/probe" || fail "cannot write in $d"
rm -r "$d" 2>/dev/null || echo "   note: could not remove $d (harmless; the sandbox denies rm on some temp dirs)"
echo "STAGE 6 OK: temp dir usable"

echo "== 7 P2 tool scripts"
for f in verify-2.1.sh; do test -f "$TOOLS/$f" || fail "$TOOLS/$f missing"; bash -n "$TOOLS/$f" || fail "bash -n $f"; done
node --check "$TOOLS/page-probe.js" || fail "node --check page-probe.js"
/usr/bin/python3 -m py_compile "$TOOLS/gate-from-journal.py" || fail "py_compile gate-from-journal.py"
echo "STAGE 7 OK: verify-2.1.sh, page-probe.js, gate-from-journal.py parse"

echo "PREFLIGHT OK: P2 environment ready (preview port $PREVIEW_PORT, zk $V)"
