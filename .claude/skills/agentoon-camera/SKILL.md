---
name: agentoon-camera
description: >-
  Cinematic camera choreography for Agentoon.ai videos: dolly in/out, tracking, whip pan, orbit, parallax, push-in, rack-focus simulation, tilt, dynamic framing and controlled speed ramps. Use for hero reveals, 3D or footage shots, UI zooms and scene-to-scene camera moves.
argument-hint: <shot or scene to move the camera on>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-camera

In 2D compositions the "camera" is a wrapper element you scale and translate; in 3D it is a Blender camera. Move the camera only to (a) direct attention to the narrated detail, (b) reveal scale or space, or (c) carry the viewer to the next scene.

## Kit API (`agentoon-video/kit/camera.js`, `window.Cam`, all times absolute seconds)
| Call | Use |
|---|---|
| `Cam.frame(world, cx, cy, s)` | set the opening framing of a camera wrapper (origin 0,0) |
| `Cam.fly(tl, world, at, dur, {cx, cy, s, ease, blur})` | travel/zoom the wrapper to a point; `blur` adds a mid-move blur (speed feel) |
| `Cam.push(tl, at, dur, {out, inn, ox, oy, scale})` | zoom through the outgoing scene into the incoming one |
| `Cam.whip(tl, at, dur, {out, inn, dir, blur})` | horizontal whip pan between scenes |
| `Cam.sheetDrop(tl, at, dur, {out, inn})` | the next scene drops in like a sheet |
| `Cam.iris(tl, at, dur, {inn, cx, cy, ring, host, id})` | circular reveal from a point |
| `Cam.cardGrow(tl, host, at, dur, o)` | a card grows into the next full-screen scene |
| `Cam.drift(tl, el, at, dur, {ax, ay, rot})` | slow drift so holds never freeze |

Wrapper pattern (used in episodes 10-14): `wrapScene(k)` moves the scene's children into a `div` and `zoomTo(cam, cx, cy, s, at, dur)` animates `scale/x/y`. **Anchor the zoom at a point that must stay on screen** (e.g. `cy` = the card's top) so headers and chips are never pushed off the edge.

## Shot recipes
- **Smart zoom on the narrated line:** scale 1.15-1.3, 0.6-0.8 s `power2.inOut`, hold, release. Never above 1.35 on text; check `/agentoon-qc` mobile readability.
- **Dolly in/out:** slow scale 1.0 -> 1.08 over the scene (`ease:'none'`), reverse for dolly out.
- **Tracking / pan:** translate a wide image by `x` while scaling 1.05; use a cover-fit image 1.3x wider than the frame.
- **Parallax:** 3 layers, translate ratios 1 : 1.6 : 2.4 on the same eased progress.
- **Orbit:** real 3D (Blender camera on a circle, `/agentoon-3d`). A 2D orbit is faked only for icons/objects: `rotateY` + perspective on a card.
- **Tilt / reveal:** animate `y` with `power2.out` and scale 1.14 -> 1.0 ("pull-back reveal", episode 11 hook).
- **Rack-focus simulation:** two layers; blur the one that leaves focus (`filter:blur(14px)`), sharpen the other over 0.4 s.
- **Speed ramp:** eased tween with `power4.inOut` (fast middle, slow ends) or in FFmpeg `setpts` segments for footage; keep the ramp under 0.6 s.
- **Framing:** keep the narrated subject in the central 70 % of 1080x1920; captions occupy y 1450-1620; top 180 px and right 120 px are unsafe.

## Remotion / Blender mapping
Remotion: wrap content in a `<div style={{transform:`translate(${x}px,${y}px) scale(${s})`, transformOrigin:'0 0'}}>` driven by `interpolate`. Blender: keyframe a camera (`cam.keyframe_insert("location", frame=f)`), `ease` via `bpy.context.preferences.edit.keyframe_new_interpolation_type`; depth of field via `cam.data.dof` (`episodes/10-ai-property-design/blender/`).

## Do not
Move the camera on every scene, shake without cause, or zoom so far that real UI becomes soft. One signature camera move per video plus quiet drifts is enough.
