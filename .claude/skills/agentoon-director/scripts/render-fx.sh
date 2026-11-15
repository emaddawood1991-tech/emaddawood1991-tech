#!/usr/bin/env bash
# Render a Remotion FX composition from agentoon-video/remotion-fx to MP4 and print 5 inspection frames.
# Usage: bash render-fx.sh <CompositionId> <out.mp4>   (installs deps on first use; never inside an episode folder)
set -euo pipefail
ROOT="$(cd "${CLAUDE_SKILL_DIR:-$(dirname "$0")/..}/../../.." && pwd)"; FX="$ROOT/agentoon-video/remotion-fx"
[ -d "$FX/node_modules" ] || (cd "$FX" && npm install --no-audit --no-fund)
OUT="$(realpath -m "$2")"; mkdir -p "$(dirname "$OUT")"
(cd "$FX" && REMOTION_LOG=error npx remotion render "$1" "$OUT" --codec=h264 --crf=18)
D="${OUT%.mp4}-frames"; mkdir -p "$D"; N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$OUT")
for p in 8 30 50 70 92; do ffmpeg -y -loglevel error -i "$OUT" -vf "select=eq(n\,$((N*p/100)))" -vframes 1 "$D/f$p.png"; done; echo "rendered $OUT; frames in $D (VIEW THEM before reporting success)"
