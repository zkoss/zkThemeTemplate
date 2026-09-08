#!/usr/bin/env bash
# Compute a contract's `js-source-hash` from the ZK jars ACTUALLY ON THE CLASSPATH.
#
# Why this exists (2026-09-08): gate 0b used to recompute the hash over the ZK source
# checkout at $ZK_SRC. That tree is a live git working copy and routinely runs ahead of
# the release the build pins, so any widget touched upstream after the pinned build
# reported "js-source drift" and the evaluator refused to measure a component that was
# in fact perfectly in sync. It cost a full Gate-1 pass on codeeditor and would have
# misrouted the work to zk-spec-author. The contract is an assertion about the widget
# the theme is styling — that is the jar, not somebody's checkout.
#
# Usage:
#   scripts/js-source-hash.sh zul/code/Codeeditor.ts zul/code/mold/codeeditor.js
#
# Arguments are the contract's `js-source-files:` entries verbatim: paths relative to
# `web/js/` inside the jar. Files are concatenated in the order given (so the contract's
# list order is part of the hash) and sha256'd — the same shape as the old recipe, only
# reading from the resolved artefact.
#
# stdout: the bare hash (safe to capture)
# stderr: provenance — which jar each file came from
#
# Exit codes (mirrors check-css-dsp.js so callers can treat them the same way):
#   0  hash computed
#   2  cannot verify on this machine (no ZK jars for the pinned version) — callers
#      should TOLERATE this, never treat it as drift
#   1  a declared file is in none of the jars — a real contract error

set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <path-under-web/js> [more...]" >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

zk_version="$(/usr/bin/sed -n 's:.*<zk\.version>\(.*\)</zk\.version>.*:\1:p' "$repo_root/pom.xml" | head -1)"
if [ -z "$zk_version" ]; then
  echo "js-source-hash: could not read <zk.version> from pom.xml — cannot verify" >&2
  exit 2
fi

# Every ZK artefact that can ship widget JS under web/js/. A widget lives in exactly one
# of them, so search them all rather than making the caller name the artefact.
jars=()
while IFS= read -r j; do
  [ -n "$j" ] && jars+=("$j")
done < <(find "$HOME/.m2/repository/org/zkoss" -type f -name "*-${zk_version}.jar" 2>/dev/null | sort)

if [ "${#jars[@]}" -eq 0 ]; then
  echo "js-source-hash: no org.zkoss jars for ${zk_version} in ~/.m2 — cannot verify" >&2
  exit 2
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

concat="$work/concat"
: > "$concat"

for rel in "$@"; do
  entry="web/js/${rel}"
  found=""
  for jar in "${jars[@]}"; do
    if unzip -l "$jar" "$entry" >/dev/null 2>&1; then
      # `unzip -l` succeeds with a "caution: filename not matched" note on some builds,
      # so extract and confirm the file really landed before accepting the jar.
      if unzip -o -q -d "$work/x" "$jar" "$entry" 2>/dev/null && [ -f "$work/x/$entry" ]; then
        found="$jar"
        cat "$work/x/$entry" >> "$concat"
        echo "  ${rel}  <-  $(basename "$jar")" >&2
        break
      fi
    fi
  done
  if [ -z "$found" ]; then
    echo "js-source-hash: '${entry}' is in none of the ${#jars[@]} ZK ${zk_version} jars" >&2
    exit 1
  fi
done

shasum -a 256 "$concat" | cut -d' ' -f1
