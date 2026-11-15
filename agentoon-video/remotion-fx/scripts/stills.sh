#!/usr/bin/env bash
# Quick stills for scene compositions: bash scripts/stills.sh S01:60 S04:70 ...
cd "$(dirname "$0")/.."; mkdir -p out/stills; export REMOTION_LOG=error
for a in "$@"; do id=${a%%:*}; f=${a##*:}; npx remotion still $id out/stills/$id-f$f.png --frame=$f 2>&1 | tail -1; done
