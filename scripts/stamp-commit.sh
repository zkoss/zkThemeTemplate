#!/bin/bash
# Stamps the HEAD commit date + short hash onto the preview app's classpath, so the
# use-case sidebar can say which build a design reviewer is looking at. Read back by
# UseCaseVM.getCommitStamp(). Lives in target/ because it is build output, never source.
#
# Bound to process-test-resources in pom.xml for the local preview app, and called
# explicitly from build-preview-war.sh, which runs Maven with -Dexec.skip=true.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/target/test-classes/zk/example/commit-stamp.txt"

# No .git (exported tree / source tarball) -> no stamp, and the sidebar shows no date.
# Must not fail the build.
git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1 || { echo "[stamp] no git repo - skipping"; exit 0; }

mkdir -p "$(dirname "$OUT")"   # process-test-resources runs before test-compile creates it
git -C "$ROOT" log -1 --format='%cs · %h' > "$OUT"
printf '[stamp] %s\n' "$(cat "$OUT")"
