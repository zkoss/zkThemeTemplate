#!/bin/bash
# verify-family.sh — verification for P2 items 2.6 / 2.7 / 2.8 of the Marble → zk migration: zero-tolerance
# comparison of one screenshot family (execution plan D49 C, D50 A, chat D57/D58) between the template's committed
# baselines (the oracle, doc/screenshots, re-cut on ZK 11) and the shots the template's UNCHANGED harness takes
# against zkpreview. Called through the per-item wrappers verify-2.6.sh (gallery), verify-2.7.sh (state),
# verify-2.8.sh (tablet).
#
# Usage:  bash doc/migration/tools/zero-tolerance/verify-family.sh <gallery|state|tablet> static
#         bash doc/migration/tools/zero-tolerance/verify-family.sh <gallery|state|tablet> live
#
# Families are file-name classes of doc/screenshots, not Playwright projects — two specs write *-gallery.png:
#   gallery  *-gallery.png                 98   projects gallery + chromium
#   state    *-hover|-focus|-active.png    55   project chromium
#   tablet   *-tablet.png                  30   project tablet
# The 100 *-forced-colors.png are written directly by forced-colors-gallery.spec.ts and are outside 2.6–2.8.
#
# The ledger (doc/migration/ledgers/<item>-<family>.tsv, written by the Generator) has two header lines and one
# row per baseline of the family:
#   # oracle zkThemeTemplate <commit>        the template commit whose doc/screenshots the rows were measured against
#   # zkpreview zk <commit>                  the zk commit that served the pages
#   <baseline-name>\t<STATUS>               STATUS = IDENTICAL | IDENTICAL-ON-RESHOOT <1..3> | FIXED <zk-commit|WORKTREE> | OPEN
# OPEN is allowed only with the image pair in front of the user under zk's tasks/marble-screenshot-diffs/ (chat D58),
# and `live` exits 3 while any row is OPEN: the item does not pass until the user has ruled on every pair.
#
# `static` (seconds): the oracle is the re-cut one (family count exact, no orphan PNG left), the ledger exists and is
# consistent with the oracle (same name set, valid statuses, FIXED commits exist in zk, OPEN rows have their pair).
# `live` (about 2 m + 20 s per re-shoot round): starts zkpreview, runs the family's projects of the template's own
# harness with the tracked shots.config.ts, compares every family PNG with the oracle at zero tolerance
# (compare.config.ts), re-shoots the differing pages up to three times (F55: two of six were flaky), writes an image
# pair for every remaining difference under the run's output directory, then cross-checks the ledger: a remaining
# difference must be OPEN, an OPEN row must still differ, a FIXED row must be identical now.
#
# Dry-run contract (rule 2): before the D50-A re-cut lands, `static` fails at "oracle: re-cut landed"; after it and
# before the Generator, at "ledger file". `live` runs to the end on any tree and fails at "ledger file" when there is
# none — that run's output is what the Generator starts from. The script never deletes anything and writes only
# under $ZERO_ROOT (default: mktemp -d) plus Playwright's own outputs; the server is stopped on every exit path.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
TOOLS="$TPL/doc/migration/tools"
ZT="$TOOLS/zero-tolerance"
MOD="$ZK/zkpreview"
ORACLE="$TPL/doc/screenshots"
PAIRS_HOME="$ZK/tasks/marble-screenshot-diffs"
PORT=${PREVIEW_PORT:-8085}
BASE="http://127.0.0.1:$PORT"
FAMILY=${1:?family required: gallery | state | tablet}
MODE=${2:?mode required: static | live}
case "$FAMILY" in
  gallery) ITEM=2.6; PAT='-gallery\.png$';                 EXPECT=98; PROJECTS="--project=gallery --project=chromium" ;;
  state)   ITEM=2.7; PAT='-(hover|focus|active)\.png$';    EXPECT=55; PROJECTS="--project=chromium" ;;
  tablet)  ITEM=2.8; PAT='-tablet\.png$';                  EXPECT=30; PROJECTS="--project=tablet" ;;
  *) echo "unknown family: $FAMILY (gallery | state | tablet)"; exit 2 ;;
esac
LEDGER="$TPL/doc/migration/ledgers/$ITEM-$FAMILY.tsv"
fail() { echo "$ITEM $MODE FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }
family_of() { ls "$1" | /usr/bin/grep -E -- "$PAT" | sort; }          # family PNG names in a directory

ledger_static() {                                                    # shared by static and the end of live
  test -f "$LEDGER" || fail "ledger file $LEDGER (written by the Generator)"
  o=$(sed -n 's/^# oracle zkThemeTemplate \([0-9a-f]\{7,40\}\)$/\1/p' "$LEDGER"); test -n "$o" || fail "ledger header '# oracle zkThemeTemplate <commit>'"
  git -C "$TPL" cat-file -e "$o^{commit}" 2>/dev/null || fail "ledger oracle commit $o exists in the template"
  git -C "$TPL" merge-base --is-ancestor "$o" HEAD || fail "ledger oracle commit $o is an ancestor of the template HEAD"
  test -z "$(git -C "$TPL" diff --name-only "$o" HEAD -- doc/screenshots)" || fail "doc/screenshots unchanged since the ledger's oracle commit $o (re-measure)"
  z=$(sed -n 's/^# zkpreview zk \([0-9a-f]\{7,40\}\)$/\1/p' "$LEDGER"); test -n "$z" || fail "ledger header '# zkpreview zk <commit>'"
  git -C "$ZK" cat-file -e "$z^{commit}" 2>/dev/null || fail "ledger zkpreview commit $z exists in zk"
  rows=$(/usr/bin/grep -v '^#' "$LEDGER" | /usr/bin/grep -v '^$' || true)
  bad=$(echo "$rows" | /usr/bin/grep -vE $'^[a-z0-9-]+\.png\t(IDENTICAL|IDENTICAL-ON-RESHOOT [123]|FIXED ([0-9a-f]{7,40}|WORKTREE)|OPEN)$' || true)
  test -z "$bad" || { echo "$bad"; fail "every ledger row is '<name>.png<TAB><STATUS>' with a valid STATUS"; }
  d=$(diff <(echo "$rows" | cut -f1 | sort) <(family_of "$ORACLE") || true)
  test -z "$d" || { echo "$d"; fail "ledger rows name exactly the $EXPECT $FAMILY baselines (< ledger only, > oracle only)"; }
  test "$(echo "$rows" | cut -f1 | sort | uniq -d | wc -l | tr -d ' ')" = 0 || fail "no baseline listed twice"
  for c in $(echo "$rows" | sed -n $'s/^.*\tFIXED \\([0-9a-f]*\\)$/\\1/p'); do
    git -C "$ZK" cat-file -e "$c^{commit}" 2>/dev/null || fail "FIXED commit $c exists in zk"
  done
  if echo "$rows" | /usr/bin/grep -q $'\tFIXED WORKTREE$'; then
    test -n "$(git -C "$ZK" status --short -- zul zkpreview)" || fail "FIXED WORKTREE rows need an uncommitted change under zk's zul/ or zkpreview/"
  fi
  OPEN_ROWS=$(echo "$rows" | /usr/bin/grep $'\tOPEN$' | cut -f1 || true)
  for n in $OPEN_ROWS; do b=${n%.png}
    dir=$(ls -d "$PAIRS_HOME"/*"$b" "$PAIRS_HOME/$b" 2>/dev/null | head -n 1)
    test -n "$dir" && test -f "$dir/template-baseline.png" && test -f "$dir/zkpreview.png" && test -f "$dir/diff.png" \
      || fail "OPEN row $n has its image pair (template-baseline.png, zkpreview.png, diff.png) under $PAIRS_HOME/"
  done
  ok "ledger: $(echo "$rows" | wc -l | tr -d ' ') rows = the $FAMILY oracle; statuses valid; FIXED commits exist; $(echo "$OPEN_ROWS" | /usr/bin/grep -c . || true) OPEN row(s) with pairs"
}

oracle_static() {
  test -d "$ORACLE" || fail "environment: $ORACLE"
  n=$(family_of "$ORACLE" | wc -l | tr -d ' ')
  test "$n" = "$EXPECT" || fail "oracle: re-cut landed ($FAMILY baselines $n, expected $EXPECT after the D50-A orphan deletion)"
  stray=$(ls "$ORACLE" | /usr/bin/grep -E -- '\.png$' | /usr/bin/grep -vE -- '-(gallery|hover|focus|active|tablet|forced-colors)\.png$' || true)
  test -z "$stray" || { echo "$stray"; fail "oracle: re-cut landed (orphan PNGs outside every family still present)"; }
  /usr/bin/grep -q '<zk.version>11\.0\.0-jakarta\.FL\.20260909</zk.version>' "$TPL/pom.xml" || fail "oracle: the template's ZK pin is 11.0.0-jakarta.FL.20260909"
  ok "oracle: $n $FAMILY baselines, no orphan left, template pinned to ZK 11 FL.20260909"
}

case "$MODE" in
static)
  oracle_static
  ledger_static
  echo "$ITEM static ok" ;;

live)
  command -v curl >/dev/null && test -x /usr/sbin/lsof && command -v npx >/dev/null || fail "environment: curl / lsof / npx"
  test -f "$TOOLS/preview-server.sh" || fail "environment: preview-server.sh missing"
  test -d "$TPL/node_modules/@playwright/test" || fail "environment: the template's node_modules (the harness runs from the template checkout)"
  test "$(ls "$TPL"/src/test/playwright/*.ts | wc -l | tr -d ' ')" = 15 || fail "environment: template harness (14 specs + config)"
  test -f "$ZT/shots.config.ts" && test -f "$ZT/compare.config.ts" && test -f "$ZT/compare.spec.ts" && test -x "$ZT/summarize-cmp.py" || fail "environment: zero-tolerance tools"
  ROOT=${ZERO_ROOT:-$(mktemp -d)}; mkdir -p "$ROOT"
  ok "environment: curl, lsof, npx, preview-server.sh, template node_modules and harness; output under $ROOT"
  . "$TOOLS/preview-server.sh"

  shoot() {   # shoot <n> [-g regex] — the family's projects of the template's unchanged specs into $ROOT/snap<n>
    local n=$1; shift
    mkdir -p "$ROOT/snap$n" "$ROOT/out$n"
    (cd "$TPL" && ZERO_SNAP="$ROOT/snap$n" ZERO_OUT="$ROOT/out$n" PREVIEW_URL="$BASE" \
      npx playwright test --config doc/migration/tools/zero-tolerance/shots.config.ts $PROJECTS "$@" > "$ROOT/shots$n.log" 2>&1) || true
    tail -n 4 "$ROOT/shots$n.log" | tr -d '\033' | sed 's/\[[0-9;]*[A-Za-z]//g' | /usr/bin/grep -E 'passed|failed|skipped' | sed 's/^/   /'
  }
  compare() {  # compare <n> <name>... — copy the named PNGs from snap<n> and compare them with the oracle; prints summarize-cmp lines
    local n=$1; shift
    mkdir -p "$ROOT/fam$n" "$ROOT/cmp$n"
    for f in "$@"; do test -f "$ROOT/snap$n/$f" && cp "$ROOT/snap$n/$f" "$ROOT/fam$n/"; done
    (cd "$TPL" && ZERO_SNAP="$ROOT/fam$n" ZERO_BASE="$ORACLE" ZERO_OUT="$ROOT/cmp$n" \
      npx playwright test --config doc/migration/tools/zero-tolerance/compare.config.ts > "$ROOT/compare$n.log" 2>&1) || true
    test -f "$ROOT/cmp$n/compare.json" || { tail -n 20 "$ROOT/compare$n.log"; fail "compare.config.ts produced compare.json (round $n)"; }
    /usr/bin/python3 "$ZT/summarize-cmp.py" "$ROOT/cmp$n/compare.json" > "$ROOT/summary$n.txt" || true
  }

  preview_port_free
  ok "port $PORT free before start"
  preview_start "$BASE/button.zul"
  ok "gretty appRun serving zkpreview; GET /button.zul → HTTP 200"

  shoot 1
  extra=$(comm -23 <(family_of "$ROOT/snap1") <(family_of "$ORACLE"))
  test -z "$extra" || { echo "$extra"; fail "every $FAMILY PNG the harness produced has a baseline in the oracle (listed: produced, no baseline)"; }
  orphans=$(comm -13 <(family_of "$ROOT/snap1") <(family_of "$ORACLE"))
  test -z "$orphans" || echo "   oracle-only $FAMILY baselines no spec produces (orphans — \`static\` fails on them): $(echo $orphans | tr '\n' ' ')"
  produced=$(family_of "$ROOT/snap1")
  ok "shots round 1: $PROJECTS produced $(echo "$produced" | wc -l | tr -d ' ') $FAMILY PNGs, every one with a baseline (oracle has $EXPECT after the re-cut)"

  compare 1 $produced
  tail -n 1 "$ROOT/summary1.txt" | sed 's/^/   /'
  diffs=$(/usr/bin/grep -v '^---' "$ROOT/summary1.txt" | awk '$2 != "IDENTICAL" {print $1}')
  : > "$ROOT/result.tsv"                                               # <name>\t<IDENTICAL|IDENTICAL-ON-RESHOOT n|DIFF ...>
  /usr/bin/grep -v '^---' "$ROOT/summary1.txt" | awk '$2 == "IDENTICAL" {printf "%s\tIDENTICAL\n", $1}' >> "$ROOT/result.tsv"
  ok "compare round 1 at zero tolerance: $(echo "$diffs" | /usr/bin/grep -c . || true) of $(echo "$produced" | wc -l | tr -d ' ') differ"

  round=0
  while [ -n "$diffs" ] && [ "$round" -lt 3 ]; do
    round=$((round + 1)); n=$((round + 1))
    comps=$(for f in $diffs; do echo "${f%.png}" | sed -E 's/-(gallery|hover|focus|active|tablet)$//'; done | sort -u | paste -sd '|' -)
    shoot "$n" -g "$comps"
    missing=$(for f in $diffs; do test -f "$ROOT/snap$n/$f" || echo "$f"; done)
    if [ -n "$missing" ]; then echo "   re-shoot $round: -g \"$comps\" did not produce $(echo $missing | tr '\n' ' '); re-running the full projects"; shoot "$n"; fi
    compare "$n" $diffs
    now_ok=$(/usr/bin/grep -v '^---' "$ROOT/summary$n.txt" | awk '$2 == "IDENTICAL" {print $1}')
    for f in $now_ok; do printf '%s\tIDENTICAL-ON-RESHOOT %s\n' "$f" "$round" >> "$ROOT/result.tsv"; done
    diffs=$(/usr/bin/grep -v '^---' "$ROOT/summary$n.txt" | awk '$2 != "IDENTICAL" {print $1}')
    ok "re-shoot $round: $(echo "$now_ok" | /usr/bin/grep -c . || true) now identical, $(echo "$diffs" | /usr/bin/grep -c . || true) still differ"
  done

  last=$((round + 1))
  for f in $diffs; do b=${f%.png}
    why=$(/usr/bin/grep -E "^$f " "$ROOT/summary$last.txt" | awk '{$1=""; print substr($0,2)}')
    printf '%s\t%s\n' "$f" "$why" >> "$ROOT/result.tsv"
    p="$ROOT/pairs/$b"; mkdir -p "$p"
    cp "$ORACLE/$f" "$p/template-baseline.png"; cp "$ROOT/snap$last/$f" "$p/zkpreview.png"
    dp=$(find "$ROOT/cmp$last" -name "$b-diff.png" | head -n 1); test -n "$dp" && cp "$dp" "$p/diff.png"
  done
  sort -o "$ROOT/result.tsv" "$ROOT/result.tsv"
  cat "$ROOT/result.tsv" | /usr/bin/grep -v $'\tIDENTICAL$' | sed 's/^/   /'
  ok "result: $ROOT/result.tsv ($(/usr/bin/grep -c $'\tIDENTICAL' "$ROOT/result.tsv") identical within 3 re-shoots, $(echo "$diffs" | /usr/bin/grep -c . || true) difference(s); pairs under $ROOT/pairs/)"

  preview_stop; trap - EXIT
  preview_assert_free
  ok "server stopped; port $PORT free again"

  ledger_static
  for f in $diffs; do
    /usr/bin/grep -qE "^$f"$'\t'"OPEN$" "$LEDGER" || fail "remaining difference $f is OPEN in the ledger (it is not identical within 3 re-shoots)"
  done
  for f in $OPEN_ROWS; do
    echo "$diffs" | /usr/bin/grep -qx "$f" || fail "OPEN row $f still differs (it is identical now — the ledger is stale)"
  done
  for f in $(sed -n $'s/^\\(.*\\)\tFIXED .*$/\\1/p' "$LEDGER"); do
    /usr/bin/grep -qE "^$f"$'\t'"IDENTICAL" "$ROOT/result.tsv" || fail "FIXED row $f is identical now"
  done
  dis=$(join -t $'\t' <(sort "$LEDGER" | /usr/bin/grep -v '^#') "$ROOT/result.tsv" | awk -F'\t' '$2 != $3 && $2 !~ /^FIXED/ && $2 != "OPEN"' || true)
  test -z "$dis" || { echo "   flaky rows whose re-shoot count differs from the ledger's (informational):"; echo "$dis" | sed 's/^/   /'; }
  ok "ledger cross-check: every remaining difference is OPEN, every OPEN row still differs, every FIXED row is identical"
  nopen=$(echo "$OPEN_ROWS" | /usr/bin/grep -c . || true)
  test "$nopen" = 0 || { echo "$ITEM live: $nopen OPEN row(s) await the user's ruling (pairs under $PAIRS_HOME/)"; exit 3; }
  echo "$ITEM live ok" ;;

*) echo "unknown mode: $MODE (static | live)"; exit 2 ;;
esac
