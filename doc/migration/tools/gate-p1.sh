#!/bin/bash
# gate-p1.sh — P1 gate procedure for the Marble → zk migration (execution plan §2, "P1 gate").
#
# Usage:  bash doc/migration/tools/gate-p1.sh <stage>        stages 1 … 6, run in order, one Bash call each
#
# Why a file: Evaluators paraphrase long inline commands (findings F40, F42). A tracked script leaves
# nothing to retype, and every check prints its own marker, so a failing stage names the check that
# failed. The script never deletes anything except through Gradle's own `clean`, never escalates,
# and writes only the build's own outputs.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
ZKCML=/Users/hawk/Documents/workspace/ZK10/zkcml
STAGE=${1:?stage number required}
V=$(sed -n 's/^version=//p' "$ZK/gradle.properties")
fail() { echo "STAGE $STAGE FAIL at: $1"; exit 1; }
count() { unzip -Z1 "$1" | /usr/bin/grep -cE "$2"; }   # entries in jar $1 matching regex $2 (0 when none)

case "$STAGE" in
1) # zk — clean, then assemble zul (pulls zcommon → zel → zweb → zweb-dsp → zk → zul). clean.doFirst deletes codegen/.
   cd "$ZK" || fail cd
   ./gradlew clean --console=plain -q || fail "gradle clean"
   ./gradlew :zul:assemble --console=plain -q || fail ":zul:assemble"
   echo "STAGE 1 OK: zk clean build, zul-$V.jar assembled" ;;
2) # zk — the static checks CI's `gradle clean build` runs: checkstyle, per-module eslint (jscheck), TypeScript type-check (tscheck).
   #      Not `npm run lint -- .`: that also lints IDE bin/ copies, zktest, eslint-plugin-zk and zksandbox, which fail on any checkout (F45).
   cd "$ZK" || fail cd
   ./gradlew buildESLintPlugin checkstyleMain jscheck --console=plain -q || fail "checkstyleMain / jscheck (eslint over every module's web/js; ESLint plugin rebuilt first, F41)"
   npm run type-check || fail "npm run type-check (what the tscheck task runs)"
   echo "STAGE 2 OK: checkstyle, eslint (jscheck) and type-check clean" ;;
3) # zk — what the zul jar carries
   cd "$ZK" || fail cd
   J="zul/build/libs/zul-$V.jar"; test -f "$J" || fail "missing $J"
   n=$(count "$J" '\.css\.dsp$');                         test "$n" = 46 || fail "css.dsp entries $n != 46"
   n=$(count "$J" '^web/zul/css/reset(-embed)?\.css$');   test "$n" = 2  || fail "reset stylesheets $n != 2"
   n=$(count "$J" '^web/zul/font/.*\.woff2$');            test "$n" = 2  || fail "Inter woff2 files $n != 2"
   n=$(count "$J" '\.less$');                             test "$n" = 0  || fail "$n .less entries in the jar"
   n=$(count "$J" '(^|/)marble/');                        test "$n" = 0  || fail "$n entries under a marble/ segment"
   n=$(count "$J" '^web/zul/less/font/');                 echo "note: $n icon-font binaries (Font Awesome / ZK85Icons) ride along under web/zul/less/font/ — F36 decides"
   echo "STAGE 3 OK: zul jar holds 46 css.dsp, both resets, Inter fonts, no LESS, no marble/" ;;
4) # zkcml — clean, then assemble zkex and zkmax
   cd "$ZKCML" || fail cd
   ./gradlew clean --console=plain -q || fail "gradle clean"
   ./gradlew :zkex:assemble :zkmax:assemble --console=plain -q || fail "assemble zkex zkmax"
   echo "STAGE 4 OK: zkcml clean build, zkex-$V.jar and zkmax-$V.jar assembled" ;;
5) # zkcml — checkstyle and jar contents
   cd "$ZKCML" || fail cd
   ./gradlew :zkex:checkstyleMain :zkmax:checkstyleMain --console=plain -q || fail "checkstyleMain"
   for spec in zkex:7 zkmax:33; do
     mod=${spec%%:*}; want=${spec##*:}; J="$mod/build/libs/$mod-$V.jar"; test -f "$J" || fail "missing $J"
     n=$(count "$J" '\.css\.dsp$'); test "$n" = "$want" || fail "$mod css.dsp entries $n != $want"
     n=$(count "$J" '\.less$');     test "$n" = 0       || fail "$mod: $n .less entries in the jar"
   done
   echo "STAGE 5 OK: zkex 7 and zkmax 33 css.dsp, no LESS, checkstyle clean" ;;
6) # both — the 1.8 checker tasks pass on the fresh codegen
   cd "$ZK"    && ./gradlew :zul:checkMarbleCss --console=plain -q                     || fail "zul checkMarbleCss"
   cd "$ZKCML" && ./gradlew :zkex:checkMarbleCss :zkmax:checkMarbleCss --console=plain -q || fail "zkcml checkMarbleCss"
   echo "STAGE 6 OK: check-css-dsp reports MISSING : 0 for zul, zkex, zkmax" ;;
*) echo "unknown stage: $STAGE (use 1-6)"; exit 2 ;;
esac
