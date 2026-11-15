---
name: agentoon-cinematic-fx
description: >-
  Agentoon.ai cinematic Remotion tools: scene transitions (circle reveal / match cut, diagonal mask wipe, depth push, whip with motion blur),
  camera motion blur, tracking camera rig with lag, depth-of-field parallax layers, one-shot light sweep, and controlled speed ramps. Use to connect scenes
  and direct attention. Type /agentoon-cinematic-fx.
---

# /agentoon-cinematic-fx

Code: `agentoon-video/remotion-fx/src/fx/cinematic.tsx` (math in `math.ts`: `speedRamp`). Demo: showcase transitions between ALL 13 scenes (circle, diagonal, depth, whip) + scene S13 (tracking, speed ramp, motion blur, light sweep).

| Tool | Use |
|---|---|
| `circleReveal({cx,cy})`, `diagonalWipe(angle)`, `depthPush()`, `whip(dir)` | `@remotion/transitions` presentations: `<TransitionSeries.Transition presentation={...} timing={linearTiming({durationInFrames:14})}/>` |
| `MotionBlur` | wraps fast-moving content (sub-frame sampling, `samples`, `shutterAngle`) |
| `CameraRig` | follows `target(frame)` with lag and zoom around any 2D scene |
| `DepthLayers` | layered parallax with depth-of-field blur |
| `LightSweep` | one subtle sweep per reveal (never a looping scan beam) |
| `useSpeedRamp` / `speedRamp` | ease between speeds: keyframes `{f: output frame, t: source frame}` |

Rules: pick ≤ 2 transition families per video; match-cut = start the circle on a shape that exists in both scenes; speed ramps only on motion that is meant to feel fast; video speed ramps: `ffmpeg setpts` pre-pass or `speedRamp` driving a frame index.
