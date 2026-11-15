---
name: neon-outline
description: >-
  Agentoon.ai Remotion effect: glowing neon outline that follows the real alpha silhouette of the presenter (the Agentoon robot render layer or any RGBA cutout),
  with a travelling highlight along the contour, beat-synced pulse rings, tinted halo and vignette for background separation. Type /neon-outline.
  Use for presenter/robot hero moments, intros and emphasis beats. Not for UI or text-heavy scenes.
---

# /neon-outline

Real, working Remotion component: `agentoon-video/remotion-fx/src/fx/NeonOutline.tsx` (proof clip: `agentoon-video/remotion-fx/proof/test-c-neon.mp4`).

## Robot adaptation (no new character)
The approved robot is the 2D SVG rig `agentoon-video/kit/robot.js`. `node scripts/render-robot-layers.cjs` renders it to a transparent RGBA PNG (`public/robot/robot-neutral.png`); the component builds the outline from THAT alpha channel, so it fits the robot's exact silhouette. There is no 3D/Blender robot asset in the repo; if one is added, export the beauty pass with alpha (or a matte) as a PNG sequence and point `src` at it, the effect is unchanged.

## How it works (all SVG filters on the subject's own alpha)
contour = dilate(alpha) − alpha → flood neon → blur for glow; a rotating gradient band masks a bright second-tone highlight travelling around the contour; a pulse ring expands off the silhouette every `pulseEvery` frames; breathing glow; tinted halo + dark vignette + faint grid separate the subject from the background; the subject is drawn on top.

## Steps
1. Make/refresh the RGBA layer (see above) or supply your cutout (white-on-alpha mattes work).
2. `<NeonOutline src imgW imgH x y width color color2 pulseEvery ring title />` (see `src/tests/TestC.tsx`); register in `src/Root.tsx`.
3. Preview with `npx remotion still`, render, composite over the scene or use as a hero shot (≤ 3 s per use).
4. Neon is a strong look: use it on at most one or two beats per video; Liam's skills `cinematic-camera`, `terminal-inserts`, `article-highlights` explicitly forbid neon: do not combine them with this effect in the same scene.
