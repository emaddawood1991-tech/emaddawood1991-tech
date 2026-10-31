---
name: agentoon-robot
description: >-
  The original Agentoon.ai presenter robot. Reuse the approved character with narration-synced lip movement, blinking, head and gesture acting, pointing at software or connector controls, reactions to results, camera-facing delivery and the signature ending. Never redesigns the robot.
argument-hint: <scene list or acting notes>
allowed-tools: Read Edit Write Grep Glob Bash
---

# /agentoon-robot

**Same character in every video.** Teal body, light-grey head, red antenna bulb, navy eyes, chest light, black outlines; never Clawd, never a new mascot. Source of truth: `agentoon-video/kit/robot.js` (2D SVG + GSAP) and `.claude/skills/agentoon-video-producer/references/{brand-guide,robot-acting}.md`. **Blender rig status:** none exists in the repo; the approved robot is the 2D kit. A Blender robot is created only if the owner supplies or approves a design; say so in the plan.

## API (`window.Robot`, absolute times, returns end time)
`Robot.create(host,{id,w,x,y})` then:
`face(tl,at,dir,dur)` · `rise(tl,at,dy,dur)` (peek up from below) · `blinks(tl,from,to,period)` · `look(tl,at,dx,dy)` · `speak(tl,LIP,t0,t1)` (mouth from the loudness envelope; smile when quiet, open on stress, head bob) · `react(tl,at,'wow'|'think'|'worried'|'celebrate')` · `nod` · `shake` · `hop` · `wave` · `aimPoint(tl,at,{x,y,target:[px,py],hold,hand})` (head turns, arm points; pass the robot's own position `x,y`, no scale argument) · `press(tl,at,{...})` · `walk` · `introduce` · `outro` (used by `Outro.build`).

## Lip-sync (required and verifiable)
1. Narration from `kit/py/build_audio.py tts` or the episode's `tts_seq.py` (loudness-aware).
2. Envelope: the episode script writes `data/lipsync.json` `{fps:24,a:[0..1,...]}` (RMS per 1/24 s, 98th-percentile normalised, 3-tap smoothed) and `data/lipsync.js` (`window.LIPSYNC`).
3. Call `bot.speak(tl, LIPSYNC, phrase.start, phrase.end)` for **every phrase** the robot presents, and for the separate outro robot too.
4. **Verify:** render, then crop the robot at one silent frame and two speaking frames (`ffmpeg -ss T -vf crop=...`) and confirm closed mouth vs open shapes. Report it in the QC report.

## Acting
Write the acting plan first (feeling / looking at / doing / reaction / stays clear of) per `robot-acting.md`. Rules from episodes 10-14:
- The robot is a **presenter that works on the interface**: points at the URL, repo name or comparison when the word is spoken (`aimPoint` at the word time, hold 1.0-1.6 s), reacts when a result appears, nods on safety statements.
- Placement: beside content, never over the main transformation, code or caption band (right edge x about 860-880, y 1130-1250 above captions; hero scenes may centre it at w 280-300 above a desk or card).
- One robot visible at a time; the outro robot (`Outro.build`) replaces the scene robot at the CTA (set the scene robot's wrapper opacity to 0 at that time).
- Z-order: `presenter()` sets `wrap.style.zIndex = 12`, above cards, below transitions (50+).
- Face the content: `face(tl,0,-1)` looks left; flip for right-hand content.
- Do not cover chips labelled VERBATIM / NOT RUN; do not animate every scene with the same gesture.

## Remotion / Blender
Remotion: render the kit robot as an HTML overlay clip (HyperFrames render of a robot-only composition to a transparent/muted MP4 or PNG sequence) and place it with `<OffthreadVideo>`; do not rebuild the SVG in React unless the owner asks. Blender robot animation only when an approved rig exists (see `/agentoon-3d`).
