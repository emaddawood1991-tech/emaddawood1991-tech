---
name: agentoon-motion
description: >-
  Professional motion graphics for Agentoon.ai videos: kinetic animation, easing, spring motion, staggered reveals, layered depth, motion blur, animated cards and floating UI. Use when scenes need cards, lists, steps or UI chrome to feel alive; not for camera moves (/agentoon-camera) or text (/agentoon-typography).
argument-hint: <scene or element to animate>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-motion

Motion exists to explain. Each move must be tied to a narrated word or an on-screen change. If you cannot name the beat, delete the move.

## Rules that hold in both engines
1. Animate **transforms and opacity** (x, y, scale, rotation, opacity, clip-path). Never tween `left/top/width/height` (HyperFrames flags `gsap_non_transform_motion`; frames stutter). For moving rectangles and rings use an **SVG element and tween its attributes**: `tl.to(rect, { attr: { x, y, width, height } })`.
2. Everything is a pure function of time: no `Math.random()`, no `Date.now()`, no `onUpdate` callbacks (the paused-timeline seek suppresses them). Drive numbers with transforms (see `/agentoon-typography`).
3. Rhythm: a motion burst about every 3 s; **every hold keeps moving** (slow 3-4 % push, 8 px drift via `Cam.drift`, typing, ring hop). Gaps longer than ~3 s fail `/agentoon-qc`.
4. Build diagrams, lists and steps **progressively on their words**. Time them from `audio/timing.json` words (see the `PW(phrase, word)` helper in the episode template), never from guesswork.
5. Layer for depth: background (slow), card (medium), robot/chips (fast). Parallax ratio about 1 : 1.6 : 2.4.

## Easing and timing table
| Intent | Ease / spring | Duration |
|---|---|---|
| Card enters | `power3.out` (HyperFrames) / `spring({damping:200})` (Remotion) | 0.35-0.5 s |
| Overshoot pop (badge, chip) | `back.out(1.6-1.8)` / `spring({damping:12})` | 0.3-0.45 s |
| Stagger rows | offset 0.10-0.14 s each, `x: 90 -> 0` + opacity | 0.35 s each |
| Travelling pulse / cable | linear dashoffset or `power1.in` | 0.35-0.7 s |
| Camera-like push | `power2.inOut` | 0.7-0.9 s |
| Settle after impact | `elastic.out(1,.35)` (use once per scene) | 0.5 s |

## Techniques (copy the pattern, change the content)
- **Staggered card build:** rows as absolutely positioned cards; `tl.from(card, {opacity:0, x:90, duration:.35, ease:'power3.out'}, t0 + i*.12)`. Example: S4/S5 of `episodes/14-bland-claude-mcp/src/index.template.html` (`rowsCard`).
- **Focus ring hopping across real UI** (D-pad / cursor): one SVG rect, `ringTo(r,x,y,w,h,at)` per narrated word. `episodes/13-cleanyourtv-smart-tv`.
- **Draw-on line / cable:** `transform-origin:0 50%; scaleX:0 -> 1`, or SVG `stroke-dasharray` + tween `attr:{"stroke-dashoffset":...}` for flowing dashes.
- **Odometer / ruler / counters without callbacks:** a tall text strip moved with `y`, clipped by `overflow:hidden` (`episodes/11-dubai-azure-tower-story`).
- **Motion blur on fast moves:** `filter: blur(Npx)` on the mover during the middle 40 % of the tween (`Cam.whip` does this); keep N 18-28.
- **Depth float:** `Cam.drift(tl, el, at, dur, {ax,ay,rot})` on cards at different amplitudes.
- **Paper collage / blueprint / night-ops** primitives for whole looks: `kit/collage.js`, `kit/blueprint.js`, `kit/nightops.js` (note: `nightops` placeholder ribbons mark non-real data).

## Remotion mapping (when Remotion is the verified compositor)
`useCurrentFrame()` + `interpolate(frame,[a,b],[x,y],{easing:Easing.out(Easing.cubic),extrapolateRight:'clamp'})`; `spring({frame:frame-t0,fps,config:{damping:12}})`; stagger = `frame - i*stagger`; wrap blocks in `<Sequence from={..} durationInFrames={..}>`. Reuse `remotion-studio/src/components/{AnimatedClip,AnimatedText}.tsx` and `lib/effects.ts` before writing new components. Never use CSS transitions/animations in Remotion (not frame-deterministic).

## Do not
Add glow/sweep loops (repo rule: no moving light sweeps, no persistent glowing dots), repeat one entrance for every element, animate text that is being read, or let motion cover code/UI the narration is about.
