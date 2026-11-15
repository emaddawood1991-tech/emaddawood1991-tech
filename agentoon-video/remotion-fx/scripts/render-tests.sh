#!/usr/bin/env bash
# Renders the three 5-second proof clips + representative frames. Usage: bash scripts/render-tests.sh
set -euo pipefail; cd "$(dirname "$0")/.."; mkdir -p out/frames
export REMOTION_LOG=error
for t in A:scrapbook B:explainer C:neon; do id=${t%%:*}; n=${t##*:}; npx remotion render Test$id out/test-${id,,}-$n.mp4 --codec=h264 --crf=18 2>&1 | tail -1; done
for t in a-scrapbook b-explainer c-neon; do for f in 10 45 75 110 140; do ffmpeg -y -loglevel error -i out/test-$t.mp4 -vf "select=eq(n\,$f)" -vframes 1 out/frames/${t}_f$f.png; done; done
ls -la out/*.mp4
