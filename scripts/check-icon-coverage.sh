#!/usr/bin/env bash
# check-icon-coverage.sh — enforces the icon-naming policy in `doc/icon-policy.md`.
#
# Rule 2 (preview/example content): every `z-icon-{name}` referenced in
#   src/test/resources/web/**/*.zul MUST be a real Lucide icon name, i.e.
#   `node_modules/lucide-static/icons/{name}.svg` must exist. FA-style names
#   (e.g. `cogs`, `caret-down`, `angle-up`, `times`) are FORBIDDEN in preview
#   content even though `FA_TO_LUCIDE` makes them work at runtime — preview
#   files must be self-documenting.
#
# Rule 1 (ZK widget-emitted names) is NOT enforced here — it lives in the
# zk-theme-evaluator agent prompt and is checked manually when bumping ZK.
#
# Excluded files:
#   - icons-lucide.zul: the catalog page is auto-generated from lucide-static,
#     so by construction every name is valid.
#
# Exit codes:
#   0 — clean (all preview icons resolve to a real Lucide name)
#   1 — at least one preview ZUL uses a non-Lucide name; details on stderr
#
# Usage:
#   ./scripts/check-icon-coverage.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LUCIDE_DIR="$PROJECT_ROOT/node_modules/lucide-static/icons"
ZUL_DIR="$PROJECT_ROOT/src/test/resources/web"

if [ ! -d "$LUCIDE_DIR" ]; then
    echo "ERROR: $LUCIDE_DIR not found. Run 'npm install' first." >&2
    exit 2
fi

# Build the set of valid Lucide names (basename without .svg).
VALID_FILE=$(mktemp)
trap 'rm -f "$VALID_FILE"' EXIT
ls -1 "$LUCIDE_DIR" | sed 's/\.svg$//' | sort -u > "$VALID_FILE"

# z-icon-fw is a width modifier (no glyph) — explicitly allowed.
echo "fw" >> "$VALID_FILE"
sort -u -o "$VALID_FILE" "$VALID_FILE"

FAIL=0
total_refs=0
bad_refs=0

# Iterate every preview ZUL except the auto-generated lucide catalog.
while IFS= read -r zul; do
    # Extract every z-icon-<name> token. We accept the token wherever it appears
    # (iconSclass, sclass, class, plain text), then dedupe per file.
    while IFS=: read -r linenum name; do
        total_refs=$((total_refs + 1))
        if ! grep -qx "$name" "$VALID_FILE"; then
            bad_refs=$((bad_refs + 1))
            FAIL=1
            rel="${zul#$PROJECT_ROOT/}"
            echo "FAIL: $rel:$linenum — z-icon-$name is not a Lucide name" >&2
        fi
    done < <(grep -nEo 'z-icon-[a-z0-9-]+' "$zul" | sed -E 's/:z-icon-/:/')
done < <(find "$ZUL_DIR" -name '*.zul' ! -name 'icons-lucide.zul' | sort)

if [ "$FAIL" -eq 0 ]; then
    echo "OK — $total_refs icon references checked, all resolve to Lucide names."
    exit 0
else
    echo "" >&2
    echo "FAILED — $bad_refs of $total_refs icon references use non-Lucide names." >&2
    echo "Fix by renaming to the Lucide equivalent (see doc/icon-index.md FA-alias table)." >&2
    exit 1
fi
