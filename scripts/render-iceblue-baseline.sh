#!/usr/bin/env bash
# Captures iceblue (default ZK theme) baseline screenshots for seed components.
#
# Prerequisites: iceblue preview server must be running on port 8081:
#   withjdk.sh 17 mvn test exec:java@preview-app-iceblue
#
# Usage:
#   ./scripts/render-iceblue-baseline.sh                        # all 5 seed components
#   ./scripts/render-iceblue-baseline.sh stepbar signature      # specific components
#
# Output: doc/contracts/baselines/<comp>-iceblue.png

set -euo pipefail

SEED=(stepbar signature tbeditor organigram pdfviewer)
COMPONENTS=("${@:-${SEED[@]}}")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BASE_URL="${ICEBLUE_URL:-http://localhost:8081}"
OUTPUT_DIR="$PROJECT_ROOT/doc/contracts/baselines"

echo "Base URL: $BASE_URL"
echo "Output:   $OUTPUT_DIR"
echo "Components: ${COMPONENTS[*]}"

node "$SCRIPT_DIR/capture-iceblue.js" "$BASE_URL" "$OUTPUT_DIR" "${COMPONENTS[@]}"
