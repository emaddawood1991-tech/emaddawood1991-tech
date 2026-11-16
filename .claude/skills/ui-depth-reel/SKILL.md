---
name: ui-depth-reel
description: >-
  Agentoon.ai Remotion effect: lifts an ordinary software screen recording into a real CSS-3D scene (perspective tilt, stacked card layers, floating UI panels cropped
  from the same interface, camera moving through depth with parallax). Use for software tutorials where a flat browser recording needs depth. Type /ui-depth-reel <recording.mp4>.
argument-hint: <screen-recording.mp4> [panel crops]
allowed-tools: Read Write Edit Bash(npx remotion *) Bash(bash *) Bash(ffmpeg *)
---

# /ui-depth-reel

Not an official Claude Code command: it is an Agentoon.ai custom skill. Code: `agentoon-video/remotion-fx/src/fx/UiDepthReel.tsx` (demo composition `D01` in `src/nine/demos.tsx`).

## Do this when invoked
1. Put the recording at `agentoon-video/remotion-fx/public/footage/<name>.mp4` (1280x800, 30 fps; record real sites with `node scripts/record_footage.cjs`). Never use a mock-up.
2. Add 2-4 `panels` = crops of the SAME interface (`crop [x,y,w,h]` in screenshot px, `z` depth, `at` entrance frame). Capture screenshots with Playwright; view them to choose crops.
3. Compose `<UiDepthReel video="footage/<name>.mp4" lift={34} liftDur={36} panels={[...]} />` in a 1080x1920 Composition (180 frames) and register it in `src/Root.tsx`.
4. Render: `bash .claude/skills/agentoon-director/scripts/render-fx.sh <CompId> out/<name>.mp4`; extract frames and confirm: flat original first, then perspective + layered cards + floating panels + camera movement.
Parameters: `lift` (frame the flat screen starts lifting), `liftDur`, `panels[]`. Camera path is in the component (orbit + dolly through the panels).
Verified invocation example: `/ui-depth-reel public/footage/screen-cap.mp4` (see agentoon-video/docs/SKILL-REGISTRY.md for the recorded test).
