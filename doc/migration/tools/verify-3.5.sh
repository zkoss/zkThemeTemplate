#!/bin/bash
# verify-3.5.sh — item 3.5: the zk copy of `marble-theme` rewritten for zk (paths by the map + fixes; verification.md /
# SKILL.md host sections rewritten for zkpreview; the four scripts run from zk).
#
# Usage:   bash doc/migration/tools/verify-3.5.sh static      (~10 s; no server)
#          bash doc/migration/tools/verify-3.5.sh live        (~1–3 min; starts zkpreview on 8085 with the EXACT command the copy states, stops it)
# Dry-run contract (pre-Generator tree = the un-rewritten 3.4 copy): `environment` passes; static stops at
#   "3.5 static FAIL at: copy rewritten (differs from template HEAD)" — the designed pre-work marker.
#   `live` on that tree stops at "copy states the zkpreview command" (nothing is started).
# Server lifecycle: tools/preview-server.sh (item 2.1's proven functions); the only process it may kill is zkpreview's own
# gretty runner (cwd = zkpreview). Never run `live` while another session is shooting on 8085 (preview_port_free fails on a foreign listener).
set -u
MODE=${1:-static}
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
SK=.claude/skills/marble-theme
MAP=$TPL/doc/migration/path-rewrite-map.md
FIX=$TPL/doc/migration/stale-fixes.tsv
TOOL=$TPL/doc/migration/tools/apply-path-map.js
fail() { echo "3.5 $MODE FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }
FILES=$(git -C "$TPL" ls-files "$SK")

stage environment
test -d "$ZK/$SK" || fail "environment (zk copy missing — 3.4 first)"
test -f "$MAP" && test -f "$FIX" && test -f "$TOOL" || fail "environment (map / fixes / tool)"
test "$(echo "$FILES" | wc -l | tr -d ' ')" = 17 || fail "environment (template skill not 17 files)"
for f in $FILES; do test -f "$ZK/$f" || fail "environment (copy lacks $f)"; done
test -z "$(find "$ZK/$SK" -name .DS_Store)" || fail "environment (.DS_Store in the copy)"
echo "   zk copy present (17 files); template HEAD $(git -C "$TPL" rev-parse --short HEAD)"

if [ "$MODE" = static ]; then
  stage "copy rewritten (differs from template HEAD)"
  T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
  git -C "$TPL" archive HEAD "$SK" | tar -x -C "$T"
  diff -rq "$T/$SK" "$ZK/$SK" >/dev/null 2>&1 && fail "copy rewritten (differs from template HEAD)"
  test "$(cd "$ZK" && find "$SK" -type f | wc -l | tr -d ' ')" = 17 || fail "copy rewritten (file count changed)"

  stage "no map source string left (apply-path-map --check)"
  node "$TOOL" --map "$MAP" --fixes "$FIX" --check -- $(echo "$FILES" | sed "s#^#$ZK/#") | tail -6 | tee "$T/check.txt"
  /usr/bin/grep -q '^CHECK OK' "$T/check.txt" || fail "no map source string left"

  stage "template-host tokens gone from the copy"
  for tok in '8081' '8082' 'withjdk.sh 17 mvn' 'exec:java@preview-app' 'npm run watch' 'ThemePreviewApp' 'target/classes/web/marble' 'src/test/resources/web'; do
    n=$(cd "$ZK" && /usr/bin/grep -rF -- "$tok" $SK | wc -l | tr -d ' ')
    test "$n" = 0 || { cd "$ZK" && /usr/bin/grep -rnF -- "$tok" $SK | head -3; fail "template-host tokens gone ('$tok' ×$n)"; }
  done

  stage "the copy states the zkpreview facts (D48 / D47 / D51 / F57)"
  V=$ZK/$SK/reference/verification.md
  for tok in 'zkpreview' './gradlew appRun' '8085' 'PREVIEW_URL=http://127.0.0.1:8085' 'live-reload' 'getBoundingClientRect' 'zero-tolerance' 'reset.css'; do
    /usr/bin/grep -qF -- "$tok" "$V" || fail "copy states the zkpreview facts ('$tok' missing from verification.md)"
  done
  /usr/bin/grep -qF -- '8085' "$ZK/$SK/SKILL.md" || fail "copy states the zkpreview facts (SKILL.md names no 8085 command)"

  stage "every zk-side path the copy cites exists"
  /usr/bin/python3 - "$ZK" $(echo "$FILES" | sed "s#^#$ZK/#") <<'PY' || fail "every zk-side path the copy cites exists"
import re, os, sys
zk = sys.argv[1]; files = sys.argv[2:]
pat = re.compile(r'(?<![\w/.-])((?:\.\./zkcml/|zul/|zk/|zkpreview/|scripts/|doc/|\.claude/)[A-Za-z0-9_./-]*[A-Za-z0-9_-])')
skip = ('<', '*', '{', '…')
missing = 0; checked = 0
for f in files:
    for i, line in enumerate(open(f, encoding='utf-8'), 1):
        for m in pat.findall(line):
            if any(s in m for s in skip) or m.endswith('.'): continue
            p = m.rstrip('/')
            if not os.path.exists(os.path.join(zk, p)):
                missing += 1; print(f'MISSING {os.path.relpath(f, zk)}:{i}: {m}')
            else: checked += 1
print(f'{checked} path(s) exist, {missing} missing')
sys.exit(1 if missing else 0)
PY

  stage "the four scripts run from the zk copy (F64)"
  S=$ZK/$SK/scripts
  ( cd "$ZK" && bash "$S/audit-css.sh" --out "$T/audit.md" >/dev/null 2>"$T/audit.err" && test -s "$T/audit.md" ) || { tail -5 "$T/audit.err"; fail "the four scripts run (audit-css.sh)"; }
  ( cd "$ZK" && node "$S/check-default-display.js" --out "$T/dd.md" >/dev/null 2>"$T/dd.err" && test -s "$T/dd.md" ) || { tail -5 "$T/dd.err"; fail "the four scripts run (check-default-display.js)"; }
  ( cd "$ZK" && node "$S/count-important.js" 2>"$T/ci.err" | tail -1 ) || { tail -5 "$T/ci.err"; fail "the four scripts run (count-important.js)"; }
  ( cd "$ZK" && node "$S/probe.js" >/dev/null 2>&1; test $? -eq 2 ) || fail "the four scripts run (probe.js usage exit 2)"
  echo "3.5 static ok — copy rewritten, 0 leftovers, zkpreview facts stated, cited paths exist, four scripts run from zk"
  exit 0
fi

if [ "$MODE" = live ]; then
  stage "copy states the zkpreview command"
  V=$ZK/$SK/reference/verification.md
  CMD=$(/usr/bin/grep -oE '\./gradlew appRun[^`]*' "$V" | head -1)
  test -n "$CMD" || fail "copy states the zkpreview command"
  echo "$CMD" | /usr/bin/grep -q -- '-PhttpPort=8085' || fail "copy states the zkpreview command (no -PhttpPort=8085 in: $CMD)"
  echo "   stated: $CMD"

  stage "port 8085 free, start zkpreview with the stated command, GET /button.zul = 200, stop"
  MOD=$ZK/zkpreview; PORT=8085
  . "$TPL/doc/migration/tools/preview-server.sh"
  preview_port_free
  PREVIEW_LOG=$(mktemp); F=$(mktemp -u); mkfifo "$F"; exec 3<>"$F"
  ( cd "$MOD" && eval "$CMD --console=plain -q" < "$F" > "$PREVIEW_LOG" 2>&1 ) & RUNPID=$!
  url="http://127.0.0.1:$PORT/button.zul"; code=000
  for _ in $(seq 1 "${START_TIMEOUT:-300}"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000); [ "$code" = 200 ] && break
    kill -0 "$RUNPID" 2>/dev/null || { tail -n 40 "$PREVIEW_LOG"; fail "appRun exited before serving"; }; sleep 1
  done
  [ "$code" = 200 ] || { tail -n 40 "$PREVIEW_LOG"; preview_stop; fail "GET $url → HTTP $code"; }
  echo "   GET $url → 200"
  preview_stop
  preview_assert_free
  echo "3.5 live ok — the stated command served /button.zul on 8085 and stopped cleanly"
  exit 0
fi
fail "unknown mode $MODE"
