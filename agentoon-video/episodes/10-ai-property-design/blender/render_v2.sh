#!/usr/bin/env bash
# Ep 10 v2 animated shots (24 fps PNG frames, 540x960, resumable: existing frames are skipped).
# Order = priority for the cut: car + gate (hook, car), interior, garden + people, build-up.
# Run from this folder: bash render_v2.sh   (logs: render_v2.log)
set -e; PY=${PY:-/tmp/bpyenv/bin/python}; R=renders/v2; mkdir -p $R
for shot in hook car interior garden build; do
  $PY render_shot.py $shot $R/$shot 540 960 8
done
echo V2 DONE
