#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Clean dist"
rm -rf dist
mkdir -p dist

build_dir() {
  local dir="$1"
  echo "\n📦 Building $dir ..."
  npm --prefix "$dir" ci --no-audit --no-fund
  npm --prefix "$dir" run build
  echo "🚚 Copy $dir/dist -> dist/$dir"
  mkdir -p "dist/$dir"
  rsync -a "$dir/dist/" "dist/$dir/"
}

for n in 001 002 003 004 005 006 007; do
  build_dir "mouthpiece${n}"
done

echo "\n✅ All builds completed. Output: $ROOT_DIR/dist"


