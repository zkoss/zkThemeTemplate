#!/bin/bash
# verify-3.4.sh — item 3.4: `marble-theme` copied into zk/.claude/skills/ from the template's COMMITTED tree.
#
# Usage:   bash doc/migration/tools/verify-3.4.sh          (no server; ~1 s)
# Dry-run contract (pre-Generator tree): stages `environment` pass; the run stops at
#   "3.4 FAIL at: skill copy present" — that marker, and only that one, is the expected pre-work failure.
# Rule (plan §2 P3 copy rule): the reference is `git archive HEAD .claude/skills/marble-theme` of the template, never
# its working tree; counts come from `git ls-files`; .DS_Store can therefore never count or match.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
SK=.claude/skills/marble-theme
fail() { echo "3.4 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }

stage environment
test -d "$TPL/.git" && test -d "$ZK/.git" || fail "environment (repos)"
N=$(git -C "$TPL" ls-files "$SK" | wc -l | tr -d ' ')
test "$N" = 17 || fail "environment (template skill tracks $N files, expected 17)"
test -z "$(git -C "$TPL" status --porcelain -- "$SK")" || fail "environment (template skill has uncommitted changes — the oracle is HEAD)"
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD), 17 tracked skill files"

stage "skill copy present"
test -d "$ZK/$SK" || fail "skill copy present"

stage "byte-identical to the template's committed tree"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git -C "$TPL" archive HEAD "$SK" | tar -x -C "$T"
diff -r "$T/$SK" "$ZK/$SK" > "$T/diff.txt" 2>&1 || { head -20 "$T/diff.txt"; fail "byte-identical (diff -r not empty)"; }

stage "17 files, nothing extra"
C=$(cd "$ZK" && find "$SK" -type f ! -name .DS_Store | wc -l | tr -d ' ')
test "$C" = 17 || fail "17 files (found $C)"
test -z "$(cd "$ZK" && find "$SK" -name .DS_Store)" || fail "17 files (.DS_Store present in the copy)"

stage "the ignore negation works (D25): git sees all 17"
G=$(git -C "$ZK" status --porcelain --untracked-files=all -- "$SK" | wc -l | tr -d ' ')
TR=$(git -C "$ZK" ls-files "$SK" | wc -l | tr -d ' ')
test $((G + TR)) = 17 || fail "git sees $G untracked + $TR tracked, expected 17 (is .claude/skills/ still ignored?)"
echo "3.4 ok — 17 files, byte-identical to template HEAD $(git -C "$TPL" rev-parse --short HEAD)"
