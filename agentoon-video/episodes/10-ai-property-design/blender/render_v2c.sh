#!/usr/bin/env bash
# Resume of render_v2b.sh WITHOUT deleting frames: finishes interior (1135-1375), location stills, build-up shot. All steps skip existing outputs.
cd "$(dirname "$0")"; PY=${PY:-/tmp/bpyenv/bin/python}; R=renders/v2
$PY render_shot.py interior $R/interior 540 960 8 --range 1135 1375
[ -f renders/loc_empty.png ] || $PY render_loc.py 1 renders/loc_empty.png
[ -f renders/loc_final.png ] || $PY render_loc.py 1000 renders/loc_final.png
$PY render_shot.py build $R/build 540 960 8
echo V2C DONE
