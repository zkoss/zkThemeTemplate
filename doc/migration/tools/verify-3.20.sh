#!/bin/bash
# verify-3.20.sh — item 3.20: the D69-B forced-colors fix in zk (chat D205-A, F61) — the (2a focus) rule of
# zul/src/main/resources/web/zul/css/tokens/_forced-colors.css covers the selected tree row and organigram node.
#
# Usage:   bash doc/migration/tools/verify-3.20.sh static              (~20 s; diff shape, one @media, the built norm.css.dsp carries the rule)
#          bash doc/migration/tools/verify-3.20.sh probe [green|red]   (~1–2 min; rebuilds zul's CSS, starts zkpreview on 8085, runs the
#                                                                        computed-style probe under tools/forced-colors-focus-probe/, stops)
#          bash doc/migration/tools/verify-3.20.sh scan                (~5–10 min; starts zkpreview, runs the harness's focus-scan project
#                                                                        three times in a row while eight screenshot-free projects run alongside)
# RED → GREEN contract: `probe red` on the PRE-fix tree must pass (both probe tests fail with "Highlight on Highlight") — the Planner
#   hand-runs it and records the output in the gate; `probe green` and `scan` are the Evaluator's on the fixed tree.
# Dry-run contract (pre-Generator tree): `static` stops at "3.20 static FAIL at: the tokens file changed, and only it".
# Server lifecycle: tools/preview-server.sh; never run probe/scan while another session holds 8085.
set -u
MODE=${1:-static}; EXPECT=${2:-green}
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
CSS=zul/src/main/resources/web/zul/css/tokens/_forced-colors.css
DSP=zul/codegen/resources/web/zul/css/norm.css.dsp
PROBE=$TPL/doc/migration/tools/forced-colors-focus-probe/playwright.config.ts
SEL1='.z-treerow.z-treerow-selected:focus-visible'; SEL2='.z-treerow.z-selected:focus-visible'; SEL3='.z-orgitem-selected > .z-orgnode:focus-visible'
fail() { echo "3.20 $MODE FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

stage environment
test -f "$ZK/$CSS" || fail "environment (tokens file missing)"
test -f "$PROBE" && test -f "$(dirname "$PROBE")/probe.spec.ts" || fail "environment (probe files missing)"
test -d "$ZK/zkpreview/node_modules/@playwright/test" || fail "environment (zkpreview Playwright missing — 2.3)"
test -f "$ZK/zkpreview/src/main/webapp/web/tree.zul" && test -f "$ZK/zkpreview/src/main/webapp/web/organigram.zul" || fail "environment (tree.zul / organigram.zul missing — 2.2)"
echo "   tokens file $(wc -l < "$ZK/$CSS" | tr -d ' ') lines; zk HEAD $(git -C "$ZK" rev-parse --short HEAD)"

if [ "$MODE" = static ]; then
  stage "the tokens file changed, and only it"
  # two repositories, two status calls — a pathspec into ../zkcml from inside zk is "outside repository" (fatal, exit 128)
  (cd "$ZK" && git status --porcelain zul | /usr/bin/grep -v '^??') > "$T/st.txt"
  (cd "$ZK/../zkcml" && git status --porcelain zkmax/src zkex/src | /usr/bin/grep -v '^??') > "$T/st-cml.txt"
  test "$(wc -l < "$T/st.txt" | tr -d ' ')" = 1 && /usr/bin/grep -q "^ M $CSS\$" "$T/st.txt" || { cat "$T/st.txt"; fail "the tokens file changed, and only it (zk: $(wc -l < "$T/st.txt" | tr -d ' ') changed path(s) under zul)"; }
  test ! -s "$T/st-cml.txt" || { cat "$T/st-cml.txt"; fail "the tokens file changed, and only it (zkcml carries changes)"; }
  read -r add del _ <<< "$(cd "$ZK" && git diff --numstat -- "$CSS")"
  test "${add:-0}" -le 8 && test "${del:-0}" -le 3 || fail "diff shape (+$add/-$del; expected ≤ 8 added, ≤ 3 removed)"
  echo "   +$add/-$del on $CSS"

  stage "the three selectors sit in the (2a focus) rule with outline-color: HighlightText"
  awk '/\(2a focus\)/{f=1} f{print} f&&/^    }/{exit}' "$ZK/$CSS" > "$T/block.txt"
  test -s "$T/block.txt" || fail "(2a focus) block not found"
  for sel in "$SEL1" "$SEL2" "$SEL3" '.z-navitem-selected > .z-navitem-content:focus-visible' 'outline-color: HighlightText'; do
    /usr/bin/grep -qF -- "$sel" "$T/block.txt" || { cat "$T/block.txt"; fail "(2a focus) block lacks '$sel'"; }
  done
  /usr/bin/grep -q 'Only navbar is covered here' "$T/block.txt" && fail "(2a focus) comment still says only navbar is covered"
  test "$(/usr/bin/grep -cF -- ':focus-visible' "$T/block.txt")" = 5 || fail "(2a focus) block should hold exactly five :focus-visible selectors (has $(/usr/bin/grep -cF -- ':focus-visible' "$T/block.txt"))"

  stage "still exactly one @media and no top-level rule (F61: gallery / state / tablet cannot move)"
  test "$(/usr/bin/grep -c '@media' "$ZK/$CSS")" = 1 || fail "@media count changed"
  /usr/bin/python3 - "$ZK/$CSS" <<'PY' || fail "a rule outside the @media block"
import re, sys
s = open(sys.argv[1], encoding='utf-8').read()
s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
head = s[:s.index('@media')].strip()
sys.exit(1 if head else 0)
PY

  stage "the built norm.css.dsp carries the rule"
  (cd "$ZK" && node scripts/build-css.js --module zul > "$T/build.txt" 2>&1) || { tail -5 "$T/build.txt"; fail "build-css.js --module zul"; }
  tr -d '\n' < "$ZK/$DSP" | sed 's/ *> */>/g' > "$T/dsp.min"          # the minifier drops the spaces around `>`
  for sel in "$SEL1" "$SEL2" "$SEL3"; do
    /usr/bin/grep -qF -- "$(printf '%s' "$sel" | sed 's/ *> */>/g')" "$T/dsp.min" || fail "norm.css.dsp lacks '$sel' after the build"
  done
  echo "3.20 static ok — one file, +$add/-$del, three selectors in the (2a focus) rule, one @media, norm.css.dsp carries them"
  exit 0
fi

start_preview() {
  MOD=$ZK/zkpreview; PORT=8085
  . "$TPL/doc/migration/tools/preview-server.sh"
  preview_port_free
  PREVIEW_LOG=$(mktemp); F=$(mktemp -u); mkfifo "$F"; exec 3<>"$F"
  ( cd "$MOD" && ./gradlew appRun -PhttpPort=8085 --console=plain -q < "$F" > "$PREVIEW_LOG" 2>&1 ) & RUNPID=$!
  url="http://127.0.0.1:$PORT/tree.zul"; code=000
  for _ in $(seq 1 "${START_TIMEOUT:-300}"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000); [ "$code" = 200 ] && break
    kill -0 "$RUNPID" 2>/dev/null || { tail -n 40 "$PREVIEW_LOG"; fail "appRun exited before serving"; }; sleep 1
  done
  [ "$code" = 200 ] || { tail -n 40 "$PREVIEW_LOG"; preview_stop; fail "GET $url → HTTP $code"; }
  echo "   zkpreview up ($url → 200)"
}

if [ "$MODE" = probe ]; then
  stage "rebuild zul's CSS (the served norm.css.dsp must reflect the tree), start zkpreview"
  (cd "$ZK" && node scripts/build-css.js --module zul > "$T/build.txt" 2>&1) || { tail -5 "$T/build.txt"; fail "build-css.js --module zul"; }
  start_preview

  stage "computed-style probe: expecting $EXPECT"
  # The spec must resolve @playwright/test from zkpreview's install (a spec left under the template tree would bind to the template's
  # own Playwright and register no tests: "No tests found"), so the two probe files are copied into zkpreview's gitignored build/ first.
  PDIR=$ZK/zkpreview/build/probe-3.20; mkdir -p "$PDIR" && cp "$(dirname "$PROBE")/probe.spec.ts" "$(dirname "$PROBE")/playwright.config.ts" "$PDIR/"
  (cd "$ZK/zkpreview" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config build/probe-3.20/playwright.config.ts --reporter=list > "$T/probe.txt" 2>&1); rc=$?
  /usr/bin/grep -E 'ring |passed|failed|Highlight on Highlight' "$T/probe.txt" | head -12
  preview_stop; preview_assert_free
  if [ "$EXPECT" = green ]; then
    test "$rc" = 0 && /usr/bin/grep -qE '2 passed' "$T/probe.txt" || { tail -20 "$T/probe.txt"; fail "probe green (exit $rc)"; }
    echo "3.20 probe ok — GREEN: both families' focus ring differs from the selected fill"
  else
    test "$rc" != 0 && test "$(/usr/bin/grep -c 'Highlight on Highlight' "$T/probe.txt")" -ge 2 && /usr/bin/grep -qE '2 failed' "$T/probe.txt" || { tail -20 "$T/probe.txt"; fail "probe red (exit $rc; the pre-fix tree should fail both families with 'Highlight on Highlight')"; }
    echo "3.20 probe ok — RED confirmed on this tree: both families fail with Highlight on Highlight"
  fi
  exit 0
fi

if [ "$MODE" = scan ]; then
  stage "start zkpreview; run focus-scan three times while eight screenshot-free projects load the server"
  start_preview
  LOAD="--project=smoke --project=framework --project=component-theming --project=reset --project=hit-target --project=responsive --project=print --project=zindex"
  ( cd "$ZK/zkpreview" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config src/test/playwright/playwright.config.ts $LOAD --reporter=line > "$T/load.txt" 2>&1 ) & LOADPID=$!
  ok=0
  for i in 1 2 3; do
    (cd "$ZK/zkpreview" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config src/test/playwright/playwright.config.ts --project=focus-scan --reporter=line > "$T/scan$i.txt" 2>&1); rc=$?
    line=$(/usr/bin/grep -E '[0-9]+ (passed|failed)' "$T/scan$i.txt" | tail -2 | tr '\n' ' ')
    echo "   focus-scan run $i: exit $rc — $line"
    [ "$rc" = 0 ] || /usr/bin/grep -E '✘|✗|›.*\bfailed\b' "$T/scan$i.txt" | head -3 | sed 's/^/      /' | cut -c1-160
    [ "$rc" = 0 ] && ok=$((ok+1))
  done
  kill "$LOADPID" 2>/dev/null; wait "$LOADPID" 2>/dev/null
  echo "   load run: $(/usr/bin/grep -E '[0-9]+ (passed|failed)' "$T/load.txt" | tail -2 | tr '\n' ' ') (informational; killed after run 3 if still going)"
  preview_stop; preview_assert_free
  test "$ok" = 3 || { for i in 1 2 3; do /usr/bin/grep -E '✘|failed|Error' "$T/scan$i.txt" | head -5; done; fail "focus-scan green three times ($ok of 3)"; }
  echo "3.20 scan ok — focus-scan green on three consecutive runs under load"
  exit 0
fi
fail "unknown mode $MODE"
