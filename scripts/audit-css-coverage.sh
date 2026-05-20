#!/usr/bin/env bash
# CSS coverage audit: compare .z-* class names between iceblue reference and marble
# Usage: bash scripts/audit-css-coverage.sh [--gap-only]
#
# Output:
#   /tmp/iceblue-classes.txt  — all .z-* classes in iceblue
#   /tmp/material-classes.txt — all .z-* classes in marble
#   /tmp/gap-raw.txt          — classes in iceblue but NOT in marble (pre-filtered)

set -euo pipefail
cd "$(dirname "$0")/.."

ICEBLUE="temp/iceblue_c-10.3.0.1/web"
MATERIAL="src/main/resources/web/js"

if [[ ! -d "$ICEBLUE" ]]; then
  echo "ERROR: iceblue reference not found at $ICEBLUE" >&2
  exit 1
fi
if [[ ! -d "$MATERIAL" ]]; then
  echo "ERROR: marble CSS not found at $MATERIAL" >&2
  exit 1
fi

# Extract .z-* class tokens (e.g. ".z-button" → ".z-button")
grep -roh '\.[z]-[a-z][a-z0-9-]*' "$ICEBLUE"  | sort -u > /tmp/iceblue-classes.txt
grep -roh '\.[z]-[a-z][a-z0-9-]*' "$MATERIAL" | sort -u > /tmp/material-classes.txt

# Raw gap: in iceblue but not in marble
comm -23 /tmp/iceblue-classes.txt /tmp/material-classes.txt > /tmp/gap-all.txt

# Pre-filter COVERED_DIFFERENTLY: class-based hover/focus handled via CSS pseudo-classes in marble
grep -v '\-hover$' /tmp/gap-all.txt \
  | grep -v '\-focus$' \
  > /tmp/gap-raw.txt

ICEBLUE_COUNT=$(wc -l < /tmp/iceblue-classes.txt | tr -d ' ')
MATERIAL_COUNT=$(wc -l < /tmp/material-classes.txt | tr -d ' ')
GAP_ALL_COUNT=$(wc -l < /tmp/gap-all.txt | tr -d ' ')
GAP_FILTERED_COUNT=$(wc -l < /tmp/gap-raw.txt | tr -d ' ')
CD_COUNT=$((GAP_ALL_COUNT - GAP_FILTERED_COUNT))

echo "=== CSS Coverage Summary ==="
echo "iceblue classes:        $ICEBLUE_COUNT"
echo "marble classes:    $MATERIAL_COUNT"
echo "raw gap:                $GAP_ALL_COUNT"
echo "  auto-filtered (COVERED_DIFFERENTLY, hover/focus): $CD_COUNT"
echo "  remaining for triage: $GAP_FILTERED_COUNT"
echo ""

if [[ "${1:-}" == "--gap-only" ]]; then
  cat /tmp/gap-raw.txt
else
  echo "=== Gap classes (pre-filtered, needs triage) ==="
  cat /tmp/gap-raw.txt
  echo ""
  echo "Full lists saved to:"
  echo "  /tmp/iceblue-classes.txt"
  echo "  /tmp/material-classes.txt"
  echo "  /tmp/gap-raw.txt"
fi
