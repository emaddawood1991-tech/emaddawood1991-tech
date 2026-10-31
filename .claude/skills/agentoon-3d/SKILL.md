---
name: agentoon-3d
description: >-
  Blender and 3D production for Agentoon.ai: object animation, cinematic lighting, camera paths, depth of field, material animation, environment effects, product visualisation and architectural walkthroughs rendered headless with bpy. Use only when form, space or depth is the subject; not for screen tutorials.
argument-hint: <subject, camera path and duration>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-3d

**Decision test:** would a flat image or a UI card tell this story as well? If yes, do not use 3D. Use it for places, products, hardware, buildings and spatial explanations. Label concept renders as concept; never present a render as a tool's real output or the Blender interface.

## Environment (verify, do not assume)
Run `bash .claude/skills/agentoon-director/scripts/check-env.sh`. Real Blender 5.x is available **headless through `bpy`** (`python3 -m venv /tmp/bpyenv && /tmp/bpyenv/bin/pip install bpy`, ~400 MB). The Blender app, GUI recordings and Blender MCP are not available in the cloud sandbox: say "Claude Code + Blender (bpy)", not "Blender MCP". Notes and gotchas: `.claude/skills/agentoon-video-producer/references/remotion-blender.md`. Worked examples: `agentoon-video/episodes/10-ai-property-design/blender/` and, on branch `claude/ecstatic-goldberg-ovm1a3`, `agentoon-projects/dubai-azure-tower/` (procedural tower, 9-camera timeline, resumable renderer).

## Workflow
1. **Spec JSON/params** (dimensions, floors, palette, camera markers). Build the scene in a script (`build_*.py`) so the `.blend` is rebuildable; collections per stage; no external textures.
2. **Lighting:** Sky texture + one sun (strength about 3.0), world about 0.12; Standard view transform (AgX washes out warm palettes); interior area lights low (-0.9 EV) and graded in the edit.
3. **Camera paths:** keyframed cameras with eased interpolation (`bpy.context.preferences.edit.keyframe_new_interpolation_type='BEZIER'` before inserting keys in Blender 5), markers bound to scenes, lens 24-40 mm; avoid cutting through geometry (check frames).
4. **Depth of field:** `cam.data.dof.use_dof=True`, focus object or distance; f-stop 2.8-5.6; keep subject sharp.
5. **Material animation:** keyframe emission/colour (windows lighting at dusk), `Mix` factors for reveals.
6. **Render:** Cycles CPU + OpenImageDenoise, 8-64 samples depending on time; **PNG sequence first (resumable: skip existing frames)**, then FFmpeg. In the cloud a 4K Cycles frame costs minutes: render low-res animatics here and provide a PC render guide (`renders/RENDER_ON_PC.md`).
7. **Composite:** encode 1080x1920 (or reframe 16:9 with a blurred extension; never crop the subject out), place as a muted `<video>` in the composition (`data-media-start`), match fps (30).
8. **Robot in 3D:** none exists; the approved robot is the 2D kit. Only build a Blender robot with owner approval and a reference sheet; keep colours and proportions identical.

## Quality checks
Same object looks identical across shots; no black frames, coplanar flicker, camera inside meshes; contact sheet at every scene boundary; concept disclaimer on screen for fictional designs.

## Do not
Use stock footage as the subject, fabricate dimensions or real-world claims, or render straight to MP4 (PNG frames first).

## Snippets
Resumable frame renderer (never render straight to MP4):
```python
# render_frames.py <blend> <outdir> <f0> <f1> [w h samples]
import bpy, os, sys
blend, out, f0, f1 = sys.argv[-4], sys.argv[-3], int(sys.argv[-2]), int(sys.argv[-1])
bpy.ops.wm.open_mainfile(filepath=blend); s = bpy.context.scene
s.render.engine = "CYCLES"; s.cycles.samples = 16; s.cycles.use_denoising = True
s.render.resolution_x, s.render.resolution_y = 1080, 1920; s.view_settings.view_transform = "Standard"
for f in range(f0, f1 + 1):
    p = os.path.join(out, f"f_{f:05d}.png")
    if os.path.exists(p): continue          # resumable
    s.frame_set(f); s.render.filepath = p; bpy.ops.render.render(write_still=True)
```
Encode: `ffmpeg -framerate 30 -i out/f_%05d.png -c:v libx264 -crf 16 -pix_fmt yuv420p shot.mp4`.
Camera with depth of field and eased keys:
```python
cam = bpy.data.objects["CAM"]; cam.data.dof.use_dof = True; cam.data.dof.focus_object = bpy.data.objects["Subject"]; cam.data.dof.aperture_fstop = 3.5
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
cam.location = (0, -40, 6); cam.keyframe_insert("location", frame=1); cam.location = (0, -18, 4); cam.keyframe_insert("location", frame=120)
```
Run with the venv python: `/tmp/bpyenv/bin/python render_frames.py scene.blend out/ 1 120`. Run long renders as background jobs in chunks and report progress; a kill leaves finished frames in place.

## When 3D earns its place (examples)
Architecture/tower walkthrough, product turntable, a TV or phone shown as an object, an environment the robot stands in. Not for: tutorials about websites, terminals, settings or APIs (use `/agentoon-ui` + `/agentoon-diagrams`).
