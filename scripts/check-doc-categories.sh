#!/usr/bin/env bash
# check-doc-categories.sh — enforces the two-category documentation split from
# .claude/skills/zk-component-rules/SKILL.md (two-category doc rule).
#
# Three boundary invariants:
#   1. No theme values (hex / rgba / --zk-* / --md-* / theme refs) in
#      .claude/skills/zk-component-rules/components/*.md
#   2. No DOM trees / state-class enumerations in doc/contracts/*.md
#   3. Every doc/contracts/*.md has a `rules:` cross-reference to a real skill file
#
# Exit codes:
#   0 — clean
#   1 — at least one invariant violated (per-violation detail printed to stderr)
#
# Usage:
#   ./scripts/check-doc-categories.sh                  # full sweep
#   ./scripts/check-doc-categories.sh button stepbar   # specific components

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SKILL_DIR="$PROJECT_ROOT/.claude/skills/zk-component-rules/components"
CONTRACT_DIR="$PROJECT_ROOT/doc/contracts"

FAIL=0
fail() { echo "FAIL: $*" >&2; FAIL=1; }

# Build target list.
SKILLS=()
CONTRACTS=()
if [ $# -gt 0 ]; then
    for comp in "$@"; do
        [ -f "$SKILL_DIR/$comp.md" ]   && SKILLS+=("$SKILL_DIR/$comp.md")
        [ -f "$CONTRACT_DIR/$comp.md" ]  && CONTRACTS+=("$CONTRACT_DIR/$comp.md")
    done
else
    while IFS= read -r f; do SKILLS+=("$f");  done < <(find "$SKILL_DIR"  -maxdepth 1 -name '*.md' ! -name 'SKILL.md' ! -name '_*.md' | sort)
    while IFS= read -r f; do CONTRACTS+=("$f"); done < <(find "$CONTRACT_DIR" -maxdepth 1 -name '*.md' ! -name '_*.md' | sort)
fi

echo "Scanning ${#SKILLS[@]} skill entries and ${#CONTRACTS[@]} contracts..."

# ── Invariant 1: skill files contain no theme values ────────────────────────
# Forbidden in components/*.md:
#   - hex colors        (#abc, #aabbcc)
#   - rgba(/rgb(        explicit color functions
#   - var(--zk-*)       project tokens
#   - var(--md-*)       MD3 tokens
#   - Theme name refs   MUI / Mira / MD3 / iceblue / Sapphire / DESIGN.md
FORBIDDEN_IN_SKILL='#[0-9a-fA-F]{3,6}\b|rgba?\(|var\(--zk-|var\(--md-|\bMUI\b|\bMira\b|\bMD3\b|\biceblue\b|\bSapphire\b|DESIGN\.md'
for f in "${SKILLS[@]}"; do
    hits=$(grep -nE "$FORBIDDEN_IN_SKILL" "$f" || true)
    if [ -n "$hits" ]; then
        fail "[skill] $f contains forbidden theme content:"
        echo "$hits" | sed 's/^/    /' >&2
    fi
done

# ── Invariant 2: contract files contain no DOM trees / state-class lists ──────
# Forbidden in doc/contracts/*.md:
#   - DOM tree drawing chars (├─, └─, │) outside fenced code blocks
#   - "## DOM key selectors" or "## DOM structure" headings
#   - "## State classes" heading
for f in "${CONTRACTS[@]}"; do
    structural_headings=$(grep -nE '^#+\s+(DOM (key selectors|structure|tree)|State classes|Shared-selector warning)\b' "$f" || true)
    if [ -n "$structural_headings" ]; then
        fail "[contract] $f contains structural headings (move to skill entry):"
        echo "$structural_headings" | sed 's/^/    /' >&2
    fi
done

# ── Invariant 3: every contract has a rules: cross-ref to a real skill ────────
for f in "${CONTRACTS[@]}"; do
    name=$(basename "$f" .md)
    # Skip non-component contracts (auxiliary files, README, etc).
    case "$name" in
        README|TODO|INDEX) continue ;;
    esac
    if ! grep -qE '^rules:\s+' "$f"; then
        fail "[contract] $f missing 'rules:' frontmatter cross-reference"
        continue
    fi
    target=$(grep -E '^rules:\s+' "$f" | head -1 | sed -E 's/^rules:[[:space:]]+see[[:space:]]+//; s/^rules:[[:space:]]+//')
    target_path="$PROJECT_ROOT/$target"
    if [ ! -f "$target_path" ]; then
        fail "[contract] $f has 'rules:' pointing at $target — file not found"
    fi
done

if [ $FAIL -eq 0 ]; then
    echo "OK — all category boundaries clean."
    exit 0
else
    echo "FAILED — see violations above." >&2
    exit 1
fi
