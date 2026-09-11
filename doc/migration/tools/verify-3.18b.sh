#!/bin/bash
# verify-3.18b.sh — item 3.18b: the template's tracked doc/screenshots/ (the Playwright oracle) copied into
# zk/zkpreview/doc/screenshots/, where zkpreview's playwright.config.ts (`snapshotDir: '../../../doc/screenshots'`, resolved from
# zkpreview/src/test/playwright/) actually looks (D200-B; corrected target, see plan row 3.18b).
#
# Usage:   bash doc/migration/tools/verify-3.18b.sh static      (~10 s; git archive of template HEAD vs the copy, counts, no server)
#          bash doc/migration/tools/verify-3.18b.sh live        (~1–2 min; starts zkpreview, runs the gallery project for ONE component
#                                                                against the copied baseline — the first comparison ever possible in zk — stops)
# Stage 0 gates on the P2 verdict (D200-B: after the P2 gate, when the oracle is final).
# Dry-run contract (pre-Generator tree): static stops at "3.18b static FAIL at: copy present (zk/zkpreview/doc/screenshots)".
# The comparison is against the template's COMMITTED tree, never its working tree (the forced-colors specs write straight into
# doc/screenshots, so a live checkout can hold a half-written PNG); the count comes from `git ls-files`, never `ls | wc -l`.
set -u
MODE=${1:-static}
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=${ZK:-/Users/hawk/Documents/workspace/ZK10/zk}   # override with a scratch tree for Planner dry-runs of the late stages
DST=zkpreview/doc/screenshots
fail() { echo "3.18b $MODE FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT

stage "0: the P2 gate has passed"
test -f "$TPL/doc/migration/gates/P2.md" || fail "0: gates/P2.md missing — 3.18b runs after the P2 gate (D200-B)"
/usr/bin/grep -qi 'PASS' "$TPL/doc/migration/gates/P2.md" || fail "0: gates/P2.md carries no PASS"

stage environment
N=$(git -C "$TPL" ls-files doc/screenshots | wc -l | tr -d ' ')
test "$N" -gt 250 || fail "environment (template tracks only $N files under doc/screenshots)"
test -f "$ZK/zkpreview/src/test/playwright/playwright.config.ts" || fail "environment (zkpreview harness missing — 2.3)"
/usr/bin/grep -q "snapshotDir: '../../../doc/screenshots'" "$ZK/zkpreview/src/test/playwright/playwright.config.ts" || fail "environment (playwright.config.ts snapshotDir is not ../../../doc/screenshots — the target moved)"
test -f "$ZK/zkpreview/doc/focus-ring-known-clips.json" || fail "environment (zkpreview/doc/ is not the module's doc dir)"
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD) tracks $N files under doc/screenshots"

if [ "$MODE" = static ]; then
  stage "copy present (zk/zkpreview/doc/screenshots)"
  test -d "$ZK/$DST" || fail "copy present (zk/zkpreview/doc/screenshots)"

  stage "byte-identical to template HEAD (git archive → diff -r), same file count, no junk"
  git -C "$TPL" archive HEAD doc/screenshots | tar -x -C "$T"
  diff -rq "$T/doc/screenshots" "$ZK/$DST" > "$T/diff.txt" 2>&1; test -s "$T/diff.txt" && { head -5 "$T/diff.txt"; fail "byte-identical (diff -r not empty: $(wc -l < "$T/diff.txt" | tr -d ' ') line(s))"; }
  C=$(find "$ZK/$DST" -type f | wc -l | tr -d ' ')
  test "$C" = "$N" || fail "file count ($C in the copy, $N tracked in the template)"
  test -z "$(find "$ZK/$DST" -name .DS_Store)" || fail ".DS_Store in the copy"
  echo "   $C files identical to template HEAD"

  stage "git sees the copy as new files under zkpreview/doc/screenshots only (or already committed)"
  (cd "$ZK" && git status --porcelain zkpreview/doc) > "$T/st.txt"
  bad=$(/usr/bin/grep -v "^?? $DST/" "$T/st.txt" | /usr/bin/grep -v "^?? $DST\$" | wc -l | tr -d ' ')
  test "$bad" = 0 || { /usr/bin/grep -v "^?? $DST/" "$T/st.txt" | head -3; fail "git status under zkpreview/doc shows changes outside the new copy"; }
  echo "3.18b static ok — $C screenshot files (= template HEAD's tracked set) under zk/zkpreview/doc/screenshots"
  exit 0
fi

if [ "$MODE" = live ]; then
  stage "copy present"
  test -d "$ZK/$DST" || fail "copy present"
  stage "start zkpreview, compare ONE gallery shot against the copied baseline (toHaveScreenshot can compare for the first time in zk), stop"
  MOD=$ZK/zkpreview; PORT=8085
  . "$TPL/doc/migration/tools/preview-server.sh"
  preview_port_free
  PREVIEW_LOG=$(mktemp); F=$(mktemp -u); mkfifo "$F"; exec 3<>"$F"
  ( cd "$MOD" && ./gradlew appRun -PhttpPort=8085 --console=plain -q < "$F" > "$PREVIEW_LOG" 2>&1 ) & RUNPID=$!
  url="http://127.0.0.1:$PORT/button.zul"; code=000
  for _ in $(seq 1 "${START_TIMEOUT:-300}"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000); [ "$code" = 200 ] && break
    kill -0 "$RUNPID" 2>/dev/null || { tail -n 40 "$PREVIEW_LOG"; fail "appRun exited before serving"; }; sleep 1
  done
  [ "$code" = 200 ] || { tail -n 40 "$PREVIEW_LOG"; preview_stop; fail "GET $url → HTTP $code"; }
  # the first gallery test (from --list) whose baseline is in the copy — the spec's component list, not a guessed name
  COMP=$(cd "$MOD" && npx playwright test --config src/test/playwright/playwright.config.ts --project=gallery --list 2>/dev/null | sed -n 's/.*› gallery › //p' | while read -r c; do test -f "$ZK/$DST/$c-gallery.png" && { echo "$c"; break; }; done)
  test -n "$COMP" || { preview_stop; fail "no gallery test has a baseline in the copy"; }
  echo "   comparing gallery › $COMP against $DST/$COMP-gallery.png"
  before=$(find "$ZK/$DST" -type f | wc -l | tr -d ' ')
  (cd "$MOD" && PREVIEW_URL=http://127.0.0.1:8085 npx playwright test --config src/test/playwright/playwright.config.ts --project=gallery -g "gallery $COMP\$" --reporter=line > "$T/gal.txt" 2>&1); rc=$?
  after=$(find "$ZK/$DST" -type f | wc -l | tr -d ' ')
  preview_stop; preview_assert_free
  /usr/bin/grep -E '[0-9]+ (passed|failed|skipped)|snapshot' "$T/gal.txt" | head -4
  test "$rc" = 0 || { tail -15 "$T/gal.txt"; fail "gallery $COMP against the copied baseline (exit $rc)"; }
  /usr/bin/grep -q '1 passed' "$T/gal.txt" || { tail -10 "$T/gal.txt"; fail "gallery $COMP (expected exactly 1 passed)"; }
  /usr/bin/grep -qi "doesn't exist\|writing actual" "$T/gal.txt" && fail "gallery $COMP created a baseline instead of comparing"
  test "$before" = "$after" || fail "the run wrote $((after-before)) new file(s) into the baselines directory"
  echo "3.18b live ok — gallery › $COMP compared against the copied baseline and passed; nothing written"
  exit 0
fi
fail "unknown mode $MODE"
