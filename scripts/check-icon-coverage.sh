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
# Excluded files (icon catalogs — every name is valid by construction, so
# scanning them is pointless and was the dominant performance cost):
#   - usecase2/icons-lucide.zul: auto-generated from lucide-static.
#   - utility/icons.zul: the "All Lucide Icons" catalog page. It also hosts the
#     FA-compat alias demo, which intentionally renders FA-style names; excluding
#     the whole file makes the former `icon-lint:disable/enable` region opt-out
#     unnecessary (those markers were only ever used here).
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

# Scan every preview ZUL except the icon catalogs. Stream the list NUL-delimited
# into a SINGLE awk process (first arg = valid-names file, rest = ZULs): a
# per-line shell loop spawning grep/sed was ~30k subprocess spawns (~2 min);
# one awk pass is sub-second. xargs -0 keeps this portable to bash 3.2 (no
# mapfile) and safe for paths with spaces. We accept z-icon-<name> tokens
# wherever they appear (iconSclass, sclass, class, plain text); FILENAME/FNR
# give the location with no path parsing.
find "$ZUL_DIR" -name '*.zul' ! -name 'icons-lucide.zul' ! -name 'icons.zul' -print0 \
    | sort -z \
    | xargs -0 awk -v root="$PROJECT_ROOT/" '
        NR == FNR { valid[$0] = 1; next }
        {
            line = $0
            while (match(line, /z-icon-[a-z0-9-]+/)) {
                name = substr(line, RSTART + 7, RLENGTH - 7)   # strip "z-icon-"
                line = substr(line, RSTART + RLENGTH)
                total++
                if (!(name in valid)) {
                    bad++
                    rel = FILENAME; sub(root, "", rel)
                    printf "FAIL: %s:%d — z-icon-%s is not a Lucide name\n", rel, FNR, name > "/dev/stderr"
                }
            }
        }
        END {
            if (bad) {
                print "" > "/dev/stderr"
                printf "FAILED — %d of %d icon references use non-Lucide names.\n", bad, total > "/dev/stderr"
                print "Fix by renaming to the Lucide equivalent (see doc/icon-index.md FA-alias table)." > "/dev/stderr"
                exit 1
            }
            printf "OK — %d icon references checked, all resolve to Lucide names.\n", total
        }
    ' "$VALID_FILE"
