---
name: agentoon-3d-motion
description: >-
  Agentoon.ai real 3D motion (three.js + react-three-fiber via @remotion/three, optional Blender): extruded 3D logos built from the real SVG, 3D extruded text,
  cinematic camera fly-through along a spline past floating interface panels (real screenshots), fog depth, key/rim/fill lighting, speed ramp, and a
  Blender turntable pipeline. Use for product/logo hero moments and camera moves through UI. Type /agentoon-3d-motion.
---

# /agentoon-3d-motion

Code: `agentoon-video/remotion-fx/src/fx/three.tsx` (+ `blender.tsx`, `blender/render_logo_turntable.py`). Demo: showcase S04 (3D logo) and S05 (fly-through).

| Component | Props | Notes |
|---|---|---|
| `Logo3D` | `svg` (path under public/), `depth, spin, bg` | ExtrudeGeometry per filled path, flat stroked decals stacked for strokes; keeps the logo's colours; lights + float/spin |
| `Title3DMesh` | `text,color,side,size` | three.js `TextGeometry` with bundled `public/fonts/helvetiker_bold.typeface.json` (three.js, MIT) |
| `FlyThrough` | `panels[{src,pos,rot,w}], path[x,y,z][], ramp?, start,dur` | CatmullRom camera path, lookAt ahead, fog, stars, eased progress or `ramp` speed keyframes |
| `BlenderSequence` | `dir,frames,loop` | plays a transparent PNG sequence rendered by `blender/render_logo_turntable.py` (needs `pip install bpy`, CPU Cycles) |

## Hard-won rules (verified)
- Load textures/SVG/fonts OUTSIDE the canvas (in the component body with `delayRender`, see `useAsync`). `delayRender` inside the R3F tree does not block frame capture, panels render blank.
- No HDR/environment maps or network at render time; software GL (`Config.setChromiumOpenGlRenderer("swangle")`) is configured in `remotion.config.ts`.
- Deterministic only (`rng(seed)`), no `Math.random`, no real-time `useFrame` animation: derive everything from `useCurrentFrame()`.
- Check frames from several angles (a rotating logo shows its plain back at some frames).
