#!/bin/bash
# verify-2.4.sh — verification for item 2.4 of the Marble → zk migration: zksandbox no longer pins the
# `iceblue_c` theme jar (execution plan §2 P2, row 2.4; plan D45 — the dead `org.zkoss.theme.preferred`
# entry in zksandbox's zk.xml goes with it).
#
# Usage:  bash doc/migration/tools/verify-2.4.sh          (~30 s warm: one `:zksandbox:war` from the root composite)
#
# Each check prints its own "stage:" marker; the first failing check names itself and exits 1.
# Dry-run contract (rule 2): on the untouched tree it fails at "iceblue_c gone from build.gradle"; the
# environment stage passes. The script never deletes anything and writes only Gradle's own outputs
# (`zksandbox/build/`) plus temp files from mktemp.
set -u
ZK=/Users/hawk/Documents/workspace/ZK10/zk
B=zksandbox/build.gradle
X=zksandbox/src/main/webapp/WEB-INF/zk.xml
fail() { echo "2.4 FAIL at: $1"; exit 1; }
ok()   { echo "stage: $1"; }

cd "$ZK" || fail "cd $ZK"
V=$(sed -n 's/^version=//p' gradle.properties); test -n "$V" || fail "zk version unreadable"
test -f "$B" && test -f "$X" || fail "environment: zksandbox build.gradle / zk.xml missing"
command -v unzip >/dev/null || fail "environment: unzip"
ok "environment: zk $V, zksandbox present, unzip"

test "$(/usr/bin/grep -c iceblue_c "$B")" = 0 || fail "iceblue_c gone from build.gradle"
ok "iceblue_c gone from build.gradle"
test "$(/usr/bin/grep -c iceblue_c "$X")" = 0 || fail "iceblue_c gone from zk.xml (the preferred-theme entry named a jar that is no longer there)"
/usr/bin/grep -q 'org.zkoss.theme.preferred' "$X" && fail "zk.xml still carries an org.zkoss.theme.preferred property"
xmllint --noout "$X" || fail "zk.xml not well-formed"
ok "zk.xml: no preferred-theme entry, well-formed"

mods=$(git diff --name-only -- zksandbox | sort | tr '\n' ' ')
test "$mods" = "$B $X " || { echo "modified under zksandbox: $mods"; fail "footprint: exactly build.gradle and zk.xml change"; }
test "$(git status --porcelain -- zksandbox | /usr/bin/grep -c '^??')" = 0 || fail "footprint: new files under zksandbox"
d=$(git diff -- "$B" | /usr/bin/grep -E '^[-+][^-+]')
test "$(echo "$d" | /usr/bin/grep -c .)" = 1 && echo "$d" | /usr/bin/grep -q "^-.*org.zkoss.theme:iceblue_c" || { echo "$d"; fail "build.gradle diff is not exactly the removed iceblue_c line"; }
d=$(git diff -- "$X" | /usr/bin/grep -E '^[-+][^-+]')
test "$(echo "$d" | /usr/bin/grep -c '^+')" = 0 && test "$(echo "$d" | /usr/bin/grep -c '^-')" = 4 && echo "$d" | /usr/bin/grep -q '^-.*<value>iceblue_c</value>' || { echo "$d"; fail "zk.xml diff is not exactly the removed 4-line library-property block"; }
ok "footprint: one line removed from build.gradle, the 4-line block removed from zk.xml, nothing added"

L=$(mktemp)
./gradlew :zksandbox:war --console=plain -q > "$L" 2>&1 || { tail -n 40 "$L"; fail ":zksandbox:war from the root composite (log above)"; }
W=zksandbox/build/libs/zksandbox.war; test -f "$W" || fail "zksandbox.war not produced"
test "$(unzip -l "$W" | /usr/bin/grep -c 'iceblue_c')" = 0 || { unzip -l "$W" | /usr/bin/grep iceblue_c; fail "the war still bundles an iceblue_c jar"; }
test "$(unzip -l "$W" | /usr/bin/grep -c 'WEB-INF/lib/zul-')" = 1 || fail "the war does not bundle exactly one zul jar"
ok "zksandbox builds; zksandbox.war bundles zul and no iceblue_c jar"
echo "2.4 ok"
