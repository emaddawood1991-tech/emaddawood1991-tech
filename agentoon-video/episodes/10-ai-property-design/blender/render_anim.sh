#!/usr/bin/env bash
# Renders only the animated shots (24 fps in the video): 120-frame aerial orbit (5.0 s) + 96-frame walkthrough (4.0 s).
# Stills come from render_all.sh. Run from this folder: bash render_anim.sh
set -e; PY=${PY:-/tmp/bpyenv/bin/python}; R=renders; mkdir -p $R   # resumable: existing orbit_/walk_ frames are kept and skipped (delete them by hand to re-render)
$PY render_stage.py final Cam_Hero $R/orbit 720 1280 12 --frames 1 120 orbit
$PY render_stage.py final Cam_Hero $R/walk 720 1280 12 --frames 1 96 walk
echo ANIM DONE
