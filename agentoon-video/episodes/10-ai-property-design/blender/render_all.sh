#!/usr/bin/env bash
# Renders every Blender shot used in Ep 10 (CPU Cycles, bpy 5.2.3). Run from this folder: bash render_all.sh
set -e; PY=${PY:-/tmp/bpyenv/bin/python}; R=renders; mkdir -p $R
for s in empty blockout partial iterA iterB final; do $PY render_stage.py $s Cam_Hero $R/hero_$s.png 1080 1920 48; done
$PY render_stage.py empty Cam_Top $R/top_empty.png 1080 1920 40
$PY render_stage.py final Cam_Top $R/top_final.png 1080 1920 40
$PY render_stage.py final Cam_Front $R/front_final.png 1080 1920 48
$PY render_stage.py final Cam_Hero $R/orbit 720 1280 12 --frames 1 144 orbit
$PY render_stage.py final Cam_Hero $R/walk 720 1280 12 --frames 1 108 walk
echo ALL DONE
