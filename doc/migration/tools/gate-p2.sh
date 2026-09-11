#!/bin/bash
# gate-p2.sh — P2 gate procedure for the Marble → zk migration (execution plan §2, "P2 gate").
#
# Usage:  bash doc/migration/tools/gate-p2.sh <stage>        stages 1 … 6, run in order, one Bash call each
#
# What the gate asserts (plan row "P2 gate"): every P2 item has a PASS verdict file; the three zero-tolerance
# ledgers (gallery 98, state 55, tablet 30) exist, are consistent with the re-cut oracle, cover 183 rows, hold no
# OPEN row and no NOISY row outside the exception list; every ledger was measured against the same oracle commit,
# still current; every landed P2 commit is on the branches; and the machinery still runs end to end on the final
# tree (stage 6 re-runs the fastest family's live check, ledger cross-check included). Nothing about the
# template's own harness tolerances was changed by P2, so there is nothing to restore (the comparison tools are
# separate files under tools/zero-tolerance/).
#
# Why a file: Evaluators paraphrase long inline commands (F40, F42). Each check prints its own marker. The script
# writes nothing tracked; stage 6 starts and stops zkpreview through preview-server.sh like every verify script.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
M="$TPL/doc/migration"
STAGE=${1:?stage number required}
fail() { echo "STAGE $STAGE FAIL at: $1"; exit 1; }
ITEMS="2.0 2.1 2.2 2.3 2.6 2.7 2.8 2.9 2.10 2.11"          # 2.4 dropped (D45 closed), 2.5 dropped (D48 A)
ZK_COMMITS="5cfc315c9d abd78dd210 2e85f09947 60f4895c4f 9236dbe514 79ce20577a 0e29a12db6 0889b51540"
ZKCML_COMMITS="aabceeff2"

case "$STAGE" in
1) # every P2 item has a PASS verdict file; the two dropped rows are struck in the plan
   for i in $ITEMS; do
     f="$M/gates/$i.md"; test -f "$f" || fail "gate file gates/$i.md exists"
     /usr/bin/grep -q '^\*\*Verdict: PASS\*\*' "$f" || fail "gates/$i.md carries **Verdict: PASS**"
   done
   /usr/bin/grep -q '^| ~~2\.4~~ ' "$M/marble-to-zk-execution-plan.md" || fail "row 2.4 struck as dropped in the plan"
   /usr/bin/grep -E '^\| 2\.5 ' "$M/marble-to-zk-execution-plan.md" | /usr/bin/grep -q 'DECIDED' || fail "row 2.5 marked DECIDED (live-reload dropped, D48 A) in the plan"
   echo "STAGE 1 OK: 10 P2 items PASSED ($ITEMS); 2.4 and 2.5 dropped" ;;
2) # the three ledgers pass their own static checks against the current oracle
   for i in 2.6 2.7 2.8; do
     out=$(cd "$TPL" && bash doc/migration/tools/verify-$i.sh static 2>&1) || { echo "$out" | tail -n 3; fail "verify-$i.sh static"; }
     echo "$out" | /usr/bin/grep -q "^$i static ok$" || fail "verify-$i.sh static ends with '$i static ok'"
   done
   echo "STAGE 2 OK: ledgers 2.6 / 2.7 / 2.8 consistent with the oracle (statuses valid, FIXED commits exist, NOISY = exception list, OPEN rows paired)" ;;
3) # arithmetic: 98 + 55 + 30 = 183 rows, OPEN = 0, NOISY = 0 while the exception list has no active row
   total=0
   for i in 2.6:gallery:98 2.7:state:55 2.8:tablet:30; do
     it=${i%%:*}; rest=${i#*:}; fam=${rest%%:*}; n=${rest##*:}
     L="$M/ledgers/$it-$fam.tsv"; rows=$(/usr/bin/grep -v '^#' "$L" | /usr/bin/grep -c . || true)
     test "$rows" = "$n" || fail "ledger $it-$fam.tsv has $rows rows, expected $n"
     total=$((total + rows))
     echo "   $it-$fam.tsv: $rows rows — $(/usr/bin/grep -v '^#' "$L" | cut -f2 | awk '{print $1}' | sort | uniq -c | awk '{printf "%s %s; ", $2, $1}')"
   done
   test "$total" = 183 || fail "183 rows in total (got $total)"
   open=$(cat "$M"/ledgers/2.6-gallery.tsv "$M"/ledgers/2.7-state.tsv "$M"/ledgers/2.8-tablet.tsv | /usr/bin/grep -c $'\tOPEN$' || true)
   test "$open" = 0 || fail "OPEN rows = 0 (got $open)"
   noisy=$(cat "$M"/ledgers/2.6-gallery.tsv "$M"/ledgers/2.7-state.tsv "$M"/ledgers/2.8-tablet.tsv | /usr/bin/grep -c $'\tNOISY ' || true)
   exc=$(/usr/bin/grep -v '^#' "$M/ledgers/noisy-exceptions.tsv" | /usr/bin/grep -c . || true)
   test "$noisy" = "$exc" || fail "NOISY rows ($noisy) equal the active exception-list entries ($exc)"
   echo "STAGE 3 OK: 183 rows (98 + 55 + 30), OPEN = 0, NOISY = $noisy with $exc active exception(s)" ;;
4) # provenance: one oracle commit for all three ledgers, still the last commit that touched doc/screenshots; zkpreview commits exist
   o=""
   for L in "$M"/ledgers/2.6-gallery.tsv "$M"/ledgers/2.7-state.tsv "$M"/ledgers/2.8-tablet.tsv; do
     c=$(sed -n 's/^# oracle zkThemeTemplate \([0-9a-f]*\)$/\1/p' "$L"); test -n "$c" || fail "oracle header in $(basename "$L")"
     test -z "$o" || test "$o" = "$c" || fail "all three ledgers name the same oracle commit ($o vs $c)"
     o=$c
     z=$(sed -n 's/^# zkpreview zk \([0-9a-f]*\)$/\1/p' "$L"); git -C "$ZK" cat-file -e "$z^{commit}" || fail "zkpreview commit $z of $(basename "$L") exists in zk"
   done
   last=$(git -C "$TPL" log -1 --format=%h -- doc/screenshots)
   test "$(git -C "$TPL" rev-parse --short "$o")" = "$(git -C "$TPL" rev-parse --short "$last")" || fail "the ledgers' oracle $o is the last commit that touched doc/screenshots ($last)"
   n=$(git -C "$TPL" ls-files doc/screenshots | /usr/bin/grep -cE '\.png$'); test "$n" = 282 || fail "doc/screenshots holds 282 tracked PNGs (183 baselines + 99 forced-colors); got $n"
   echo "STAGE 4 OK: oracle $o for all three ledgers = last doc/screenshots commit; 282 tracked PNGs; zkpreview commits present" ;;
5) # every landed P2 commit is on its branch
   for c in $ZK_COMMITS; do git -C "$ZK" merge-base --is-ancestor "$c" HEAD || fail "zk commit $c is an ancestor of HEAD"; done
   for c in $ZKCML_COMMITS; do git -C "$ZKCML" merge-base --is-ancestor "$c" HEAD || fail "zkcml commit $c is an ancestor of HEAD"; done
   echo "STAGE 5 OK: zk $ZK_COMMITS and zkcml $ZKCML_COMMITS on the branches" ;;
6) # the machinery end to end on the final tree: the fastest family, live, ledger cross-check included
   out=$(cd "$TPL" && bash doc/migration/tools/verify-2.8.sh live 2>&1); rc=$?
   echo "$out" | /usr/bin/grep -E '^stage|^   ---|^   [a-z0-9-]+\.png|^   flaky|FAIL' | sed 's/^/   /'
   test "$rc" = 0 && echo "$out" | /usr/bin/grep -q '^2.8 live ok$' || fail "verify-2.8.sh live ends with '2.8 live ok' (exit $rc)"
   echo "STAGE 6 OK: tablet family re-measured live against the final tree, ledger cross-check green" ;;
*) echo "unknown stage $STAGE (1 … 6)"; exit 2 ;;
esac
