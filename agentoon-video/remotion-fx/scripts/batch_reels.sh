#!/usr/bin/env bash
# Batch workflow (Episode 28): one template + a structured content list -> one MP4 per entry. Real renders, no mock output.
set -e
mkdir -p out/reels; n=$(python3 -c "import json;print(len(json.load(open('data/reels.json'))))")
for i in $(seq 0 $((n-1))); do
  props=$(python3 -c "import json,sys;print(json.dumps(json.load(open('data/reels.json'))[$i]))")
  f=out/reels/reel-0$((i+1)).mp4
  echo "[$((i+1))/$n] $(python3 -c "import json;print(json.load(open('data/reels.json'))[$i]['topic'])")"
  npx remotion render ReelTemplate "$f" --props="$props" --concurrency=2
  echo "  rendered $f"
done
ls -la out/reels
