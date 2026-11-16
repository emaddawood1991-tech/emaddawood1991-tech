---
name: agentoon-cinematic-cuts
description: >-
  Agentoon.ai Remotion cut between two ordinary video scenes: camera-driven push toward a target point in scene A, a motion-matched cut where scene B starts at the same zoom with its target
  on the same screen point, circular mask transition and real sub-frame motion blur, then a matched zoom-out. Replaces a hard cut with a meaningful transition. Type /agentoon-cinematic-cuts <a.mp4> <b.mp4>.
argument-hint: <sceneA.mp4> <sceneB.mp4> <targetA x,y> <targetB x,y>
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *)
---

# /agentoon-cinematic-cuts

Code: `remotion-fx/src/fx/CinematicCuts.tsx` (`CinematicCuts`, `HardCut`) + `cinematic.tsx` transitions. Demo `D09` (hard cut first, then the matched cut).

## Do this when invoked
1. Use two real recordings with a STATIC target (button, logo, shape) in each; measure the target's pixel position in each video frame (view a frame).
2. `<CinematicCuts a b pa pb start cut end />`: A accelerates toward `pa` (start to cut), B decelerates from the same zoom around `pb` (cut to end); mask circle + ring open at the cut; `blurSamples` controls motion blur.
3. Render; compare frames before/after the cut: the target must sit at screen centre at the same scale on both sides, and the blur must peak at the cut.
Use one cut family per video; not a montage.
