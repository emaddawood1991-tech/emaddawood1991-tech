#!/usr/bin/env bash
# Second half of the Ep 10b Blender queue (waits for the garden shot): interior (hollow-room fix), build-up, location stills.
cd "$(dirname "$0")"; PY=${PY:-/tmp/bpyenv/bin/python}; R=renders/v2
until [ "$(ls $R | grep -c '^garden_')" -ge 313 ]; do sleep 10; done
sleep 5
for f in $(seq 1135 1375); do rm -f $R/interior_$(printf %05d $f).png; done      # re-render with the hollow room + real doorway
$PY render_shot.py interior $R/interior 540 960 8 --range 1135 1375
$PY render_loc.py 1 renders/loc_empty.png
$PY render_loc.py 1000 renders/loc_final.png
$PY render_shot.py build $R/build 540 960 8
echo V2B DONE
