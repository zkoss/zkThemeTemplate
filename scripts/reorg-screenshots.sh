#!/usr/bin/env bash
#
# One-shot migration: collapse Playwright's per-test screenshot baseline folders
# into one-folder-per-preview-page. Pairs with the spec/config refactor that
# makes Playwright WRITE to these new paths (see tasks/reorg-screenshots.md).
#
# Rules (checked in order) — each source folder holds exactly one image:
#   1. gallery-<comp>/<comp>.png        -> <comp>/gallery.png   (auto-scan galleries)
#   2. tablet-<comp>-gallery/gallery.png-> <comp>/tablet.png    (tablet-UA galleries)
#   3. <page>-<state>/<state>.png       -> <page>/<state>.png   (desktop depth shots)
#   4. anything else (multi-file or bare page-name dirs, e.g. the hand-captured
#      evaluator dirs slider/ cascader/ linelayout/ …) -> LEFT IN PLACE.
#
# Uses `git mv` to preserve history and asserts the target does not already
# exist before every move. Safe to re-run: already-migrated (bare) folders fall
# through to rule 4 and are skipped. Run from anywhere.
set -euo pipefail

cd "$(dirname "$0")/.."
SS="doc/screenshots"
moved=0 ; left=0

for dir in "$SS"/*/ ; do
  dir="${dir%/}"
  base="$(basename "$dir")"

  page="" ; srcfile="" ; dstfile=""

  case "$base" in
    gallery-*)
      comp="${base#gallery-}"
      page="$comp" ; srcfile="$comp.png" ; dstfile="gallery.png"
      ;;
    tablet-*-gallery)
      comp="${base#tablet-}" ; comp="${comp%-gallery}"
      page="$comp" ; srcfile="gallery.png" ; dstfile="tablet.png"
      ;;
    *)
      # Desktop <page>-<state>: a single .png whose stem is the folder's suffix.
      n=$(ls -1 "$dir" | wc -l | tr -d ' ')
      only=$(ls -1 "$dir")
      if [ "$n" -eq 1 ] && [ "${only##*.}" = "png" ]; then
        stem="${only%.png}"
        if [ "${base%-"$stem"}" != "$base" ]; then   # base ends with -<stem>
          page="${base%-"$stem"}" ; srcfile="$only" ; dstfile="$only"
        fi
      fi
      ;;
  esac

  if [ -z "$page" ]; then
    left=$((left + 1))
    continue
  fi

  src="$dir/$srcfile"
  dst="$SS/$page/$dstfile"

  if [ ! -f "$src" ]; then
    echo "SKIP (no source file): $src" >&2
    continue
  fi
  if [ -e "$dst" ]; then
    echo "ABORT: target already exists: $dst (from $src)" >&2
    exit 1
  fi

  mkdir -p "$SS/$page"
  git mv "$src" "$dst"
  echo "moved  $src  ->  $dst"
  moved=$((moved + 1))

  # Drop the now-empty source folder (only if it is empty).
  rmdir "$dir" 2>/dev/null || true
done

echo "----"
echo "migrated: $moved   left-in-place: $left"
