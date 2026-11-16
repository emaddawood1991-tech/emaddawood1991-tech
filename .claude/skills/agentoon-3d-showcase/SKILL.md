---
name: agentoon-3d-showcase
description: >-
  Agentoon.ai real 3D showcase (three.js + react-three-fiber via @remotion/three, optional Blender): turns a static software logo (SVG) into a rotating extruded 3D object with a
  cinematic camera ORBIT, floating interface panels (real screenshots) circling at different depths, fog depth and dynamic coloured lights. Type /agentoon-3d-showcase <logo.svg>.
argument-hint: <logo.svg> [screenshots...]
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *) Bash(python3 *)
---

# /agentoon-3d-showcase

Code: `remotion-fx/src/fx/three.tsx` (`Showcase3D`, `Logo3D`, `FlyThrough`) + `blender/render_logo_turntable.py` (Blender/bpy turntable for filled-shape SVGs). Demo `D06`.

## Do this when invoked
1. Use the project's own logo SVG (public/logos/) and real screenshots (public/shots/). Stroke-only parts become flat stacked decals; check the result from several angles.
2. `<Showcase3D svg="logos/x.svg" panels={["shots/a.jpg", ...]} />` in a 1080x1920 composition. Load assets in the component body, not inside the canvas (see `useAsync`); software GL is configured in `remotion.config.ts` (about 3 s per frame).
3. Render and verify rotation + camera orbit by comparing frames 20 / 60 / 100 (they must differ in angle, panel positions and lighting).
Blender alternative: `python3 remotion-fx/blender/render_logo_turntable.py logo.svg public/blender/x 36 480` then `<BlenderSequence dir="blender/x" frames={36} />`.
