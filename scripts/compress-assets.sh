#!/bin/bash
# Compress all PNG assets for a festival for smaller offline downloads
# Usage: ./scripts/compress-assets.sh <festival-slug>
# Example: ./scripts/compress-assets.sh appletree-2026

set -e

FESTIVAL="${1:?Usage: $0 <festival-slug>}"
ASSETS_DIR="$FESTIVAL/assets"

if [ ! -d "$ASSETS_DIR" ]; then
  echo "No assets directory at $ASSETS_DIR"
  exit 1
fi

for f in "$ASSETS_DIR"/*.png; do
  [ -f "$f" ] || continue
  before=$(wc -c < "$f")
  # resize to max 2000px wide, reduce colors, strip metadata
  magick "$f" -resize '2000x>' -colors 128 -strip "$f" 2>/dev/null || convert "$f" -resize '2000x>' -colors 128 -strip "$f" 2>/dev/null
  after=$(wc -c < "$f")
  printf "  %-40s %8d → %8d bytes\n" "$(basename "$f")" "$before" "$after"
done

echo "Done."
