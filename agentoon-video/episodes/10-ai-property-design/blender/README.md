# Editable Blender project (Ep 10 · AI Property Design)

Original **conceptual** desert property (plot 40 x 30 m). Not an engineering design; no real dimensions are claimed.

| File | What it is |
|---|---|
| `build_property.py` | Builds `property.blend` from code (terrain, boundary fence, gate, L-shaped single-storey house, pool in 3 positions, palms, shrubs, paths, pergola, loungers, survey stakes, sky + sun, cameras). |
| `property.blend` | The generated, editable Blender 5.2 scene. Collections: Land, Fence, House, Pool, Paths, Gate, Trees, Rig, `S_Iter1` (clay blockout), `S_Partial`, `S_Final`, `S_Garden`, `Stakes`. |
| `render_stage.py` | Renders a design stage: `empty`, `blockout`, `partial`, `iterA`, `iterB`, `final` from a camera (`Cam_Hero`, `Cam_Top`, `Cam_Front`), or a frame sequence with `--frames f0 f1 orbit|walk`. |
| `render_all.sh` | Batch used for the video. |

## Run it
```
python3 -m venv /tmp/bpyenv && /tmp/bpyenv/bin/pip install bpy     # Blender as a Python module (GPL-3.0), Python 3.13
/tmp/bpyenv/bin/python build_property.py                           # -> property.blend
/tmp/bpyenv/bin/python render_stage.py final Cam_Hero renders/hero_final.png 1080 1920 48
```
Open `property.blend` in Blender 4.5+/5.x to edit by hand (move the pool: objects `PoolDeck_V1..V3`, `PoolRim_*`, `PoolWater_*`).

## What the four iterations are
1. **Version 1** `partial`: pool west of the porch, two palms.
2. **Version 2** `iterA`: pool moved east beside the porch, more palms.
3. **Version 3** `iterB`: palms all round, shrubs.
4. **Version 4** `final`: lawn, stepping path, pergola, loungers, planters.

Rendering is Cycles on CPU with denoising (the sandbox has no GPU). Camera paths for the aerial orbit and the gate-to-pool walkthrough are in `render_stage.py`.
