#!/bin/bash
# verify-3.18.sh — item 3.18: twelve `doc/` paths (the 7th root doc, harness-followups.md, added by F68) copied verbatim into zk/doc/ (F17, chat D12-B; D200-B keeps the
# screenshot baselines for 3.18b) plus the agents' report directory doc/harness/gen-reports/README.md (D201-A).
#
# Usage:   bash doc/migration/tools/verify-3.18.sh         (no server; ~1 s)
# Dry-run contract (pre-Generator tree): `environment` passes; the run stops at "3.18 FAIL at: zk/doc present".
# Rule: every reference is the template's COMMITTED content (`git archive HEAD`); directories are enumerated with
# `git ls-files`, never from disk; the F61 caveat (doc/skill-gaps.md:308 is known wrong) changes nothing here — the
# file is copied verbatim and re-synced later if the template's D69 ever edits it.
set -u
TPL=/Users/hawk/Documents/workspace/zkThemeTemplate
ZK=/Users/hawk/Documents/workspace/ZK10/zk
FILES="doc/component-theme-variables-progress.md doc/gap-5-tail-pge.md doc/important-decisions.md doc/orchestrator-playbook.md doc/skill-gaps.md doc/verification-harness-decisions.md doc/harness-followups.md doc/harness/outcome-migration-status.md doc/harness/work-status.md doc/screenshots/goldenlayout-page.gif"
DIRS="doc/harness/design-reviews doc/harness/eval-reports"
fail() { echo "3.18 FAIL at: $1"; exit 1; }
stage() { echo "stage: $1"; }

stage environment
test -d "$TPL/.git" && test -d "$ZK/.git" || fail "environment (repos)"
for p in $FILES; do git -C "$TPL" ls-files --error-unmatch "$p" >/dev/null 2>&1 || fail "environment ($p not tracked in the template)"; done
for d in $DIRS; do test "$(git -C "$TPL" ls-files "$d" | wc -l | tr -d ' ')" -gt 0 || fail "environment ($d has no tracked files)"; done
test -z "$(git -C "$TPL" status --porcelain -- $FILES $DIRS)" || fail "environment (template working tree differs from HEAD on a 3.18 path — the oracle is HEAD)"
EXPECTED=$(( $(echo $FILES | wc -w) + $(git -C "$TPL" ls-files $DIRS | wc -l) ))
echo "   template HEAD $(git -C "$TPL" rev-parse --short HEAD); $EXPECTED tracked files across the 12 paths"

stage "zk/doc present"
test -d "$ZK/doc" || fail "zk/doc present"

stage "each of the 12 paths exists in zk/doc and is byte-identical to template HEAD"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
git -C "$TPL" archive HEAD $FILES $DIRS | tar -x -C "$T"
for p in $FILES; do test -f "$ZK/$p" || fail "path missing: $p"; cmp -s "$T/$p" "$ZK/$p" || fail "cmp differs: $p"; done
for d in $DIRS; do
  test -d "$ZK/$d" || fail "path missing: $d"
  diff -r "$T/$d" "$ZK/$d" >/dev/null 2>&1 || fail "diff -r not empty: $d"
done

stage "gen-reports README present (D201-A)"
test -s "$ZK/doc/harness/gen-reports/README.md" || fail "gen-reports README present"

stage "no junk: .DS_Store absent, git sees exactly the expected files under the 12 paths"
test -z "$(find "$ZK/doc" -name .DS_Store)" || fail "no junk (.DS_Store under zk/doc)"
G=$(git -C "$ZK" status --porcelain --untracked-files=all -- $FILES $DIRS | wc -l | tr -d ' ')
TR=$(git -C "$ZK" ls-files $FILES $DIRS | wc -l | tr -d ' ')
test $((G + TR)) = "$EXPECTED" || fail "git sees $G untracked + $TR tracked under the 12 paths, expected $EXPECTED"
echo "3.18 ok — 12 paths ($EXPECTED files) verbatim from template HEAD $(git -C "$TPL" rev-parse --short HEAD), README present"
