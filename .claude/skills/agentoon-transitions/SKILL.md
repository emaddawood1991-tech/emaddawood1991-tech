---
name: agentoon-transitions
description: >-
  Professional scene transitions for Agentoon.ai: match cut, mask wipe, whip pan, zoom-through, depth transition, motion-matched cut, seamless object transition, camera-driven and exposure-based transitions, chosen by narrative purpose and never overused. Use when planning or building the cuts between scenes.
argument-hint: <scene sequence or narrative beats>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-transitions

A transition is a sentence in the story ("next step", "zoom into the detail", "time passes"). Pick it for what the cut says, then carry it with something on screen.

## Choose by narrative function
| Narrative function | Transition | Implementation |
|---|---|---|
| Next step, same flow | whip pan (alternate direction) | `Cam.whip(tl,at,0.5,{out,inn,dir,blur:24})` |
| Dive into detail / device / screen | zoom-through (push) | `Cam.push(tl,at,0.5,{out,inn,ox,oy,scale:3.2})` |
| Reveal a place or result | iris from a point | `Cam.iris(tl,at,0.6,{inn,cx,cy,ring,host,id})` |
| Hand-off between tools | object carries the cut | a cable/ring/card grows into the next scene (`Cam.cardGrow`), or a shared object stays in place while the world changes (match cut) |
| Chapter / floor / level change | **carrier** transition: elevator doors closing/opening with a level label (episode 11) | two door panels `x: -541 -> 0 -> -541`, cut hidden behind them |
| Same subject, new angle | motion-matched cut | end scene A moving left-to-right, start B moving the same way and speed |
| Before -> after | mask wipe / slider | `/agentoon-morph` |
| Time passes / mood shift | exposure dip | opacity dip to black or a **static** exposure bloom for 6-8 frames |
| Layers of a system | depth transition | outgoing scene scales 1 -> 0.9 and blurs while the next slides in from behind (`Cam.sheetDrop`) |

## Rules
1. **Max two transition families per video** (e.g. whip + push) plus at most one signature carrier. No single type more than three times; alternate whip direction.
2. Transitions run 0.4-0.7 s; the incoming scene's headline starts as it settles; narration flows through the cut (cut on silence gaps: scene `b` = first phrase start minus 0.1 s).
3. Overlap scenes by 0.45-0.6 s in the timeline (`end = next.b + 0.6`) so the outgoing scene exists while it leaves.
4. Match the emotion: gentle zoom for calm explanation, whip for step energy, iris for a reveal; never a whip into a safety/limits scene.
5. **Light-based** transitions are exposure dips or one-shot blooms; the repo bans moving light sweeps and persistent glowing dots.
6. Hide cuts behind fast motion/blur; never show a frame where two scenes' text overlap legibly (HyperFrames `content_overlap` info at transition frames is expected; fix it if it appears outside them).

## Implementation notes
HyperFrames: scenes are `<section class="clip scene" data-start data-duration>` with an inner `div`; transitions tween the inner divs. Door/ring/cable carriers live in `#fx` (z-index 50) and use `data-layout-ignore` on decorative labels. Remotion: `@remotion/transitions` (`TransitionSeries`, `slide`, `wipe`, `fade`, custom presentations).

## Do not
Use a wipe because it is available; repeat the same transition for every cut; put a transition over the narrated key word.
