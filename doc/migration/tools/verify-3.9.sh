#!/bin/bash
# verify-3.9.sh — item 3.9: the approved Marble pointer appended to zk/CLAUDE.md byte-identically, and the two `npm run lint -- .`
# lines in zk/.github/copilot-instructions.md replaced by what CI runs (P1-gate follow-up, F45 / F47).
#
# Usage:   bash doc/migration/tools/verify-3.9.sh          (no server; ~1 s)
# Dry-run contract (pre-Generator tree): `environment` passes; stops at "3.9 FAIL at: pointer appended".
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
DRAFT=$TPL/doc/migration/drafts/zk-claude-md-pointer.md
CI=.github/copilot-instructions.md
L40='npm run lint -- <module>/src/main/resources/web/js   # ESLint per module (what CI'"'"'s jscheck runs); the repo-wide form cannot pass and rewrites files'
L143='7. Run `npm run lint -- <module>/src/main/resources/web/js && npm run type-check && ./gradlew checkstyleMain` (per module — the repo-wide lint cannot pass on any checkout and rewrites files through zk/preferNativeClass)'
fail() { echo "3.9 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }

stage environment
test -s "$DRAFT" || fail "environment (draft missing)"
test "$(wc -l < "$DRAFT" | tr -d ' ')" = 9 || fail "environment (draft is not 9 lines — re-approval needed, gates/3.3.md)"
test -f "$ZK/CLAUDE.md" && test -f "$ZK/$CI" || fail "environment (zk files)"
test -d "$ZK/.claude/skills/marble-theme" || fail "environment (3.4 not landed — the pointer would point at nothing)"
echo "   draft 9 lines; zk CLAUDE.md $(wc -l < "$ZK/CLAUDE.md" | tr -d ' ') lines; skill present"

stage "pointer appended"
/usr/bin/grep -qF 'marble-theme/SKILL.md' "$ZK/CLAUDE.md" || fail "pointer appended"

stage "appended section byte-identical to the approved draft"
N=$(wc -l < "$DRAFT" | tr -d ' ')
tail -n "$N" "$ZK/CLAUDE.md" | cmp -s - "$DRAFT" || { diff <(tail -n "$N" "$ZK/CLAUDE.md") "$DRAFT" | head -6; fail "appended section byte-identical (the last $N lines of CLAUDE.md ≠ draft)"; }
test "$(tail -n $((N+1)) "$ZK/CLAUDE.md" | head -1)" = "" || fail "appended section byte-identical (no blank line before the section)"
test "$(/usr/bin/grep -c 'marble-theme/SKILL.md' "$ZK/CLAUDE.md")" = 1 || fail "appended section byte-identical (pointer appears more than once)"

stage "the two lint lines replaced"
test "$(/usr/bin/grep -c 'npm run lint -- \.' "$ZK/$CI")" = 0 || fail "lint lines replaced (an 'npm run lint -- .' remains)"
/usr/bin/grep -qF -- "$L40" "$ZK/$CI" || fail "lint lines replaced (build-commands line not as specified)"
/usr/bin/grep -qF -- "$L143" "$ZK/$CI" || fail "lint lines replaced (workflow step 7 not as specified)"

stage "exactly these two files changed, by exactly these amounts"
git -C "$ZK" diff --numstat -- CLAUDE.md "$CI" | tee /dev/stderr | awk -v n="$N" 'BEGIN{ok=1} $3=="CLAUDE.md"{ if ($1!=n+1 || $2!=0) ok=0 } $3==".github/copilot-instructions.md"{ if ($1!=2 || $2!=2) ok=0 } END{ exit ok?0:1 }' || fail "exactly these two files changed (numstat)"
test "$(git -C "$ZK" diff --numstat -- CLAUDE.md "$CI" | wc -l | tr -d ' ')" = 2 || fail "exactly these two files changed"
echo "3.9 ok — pointer appended byte-identically, two lint lines replaced"
