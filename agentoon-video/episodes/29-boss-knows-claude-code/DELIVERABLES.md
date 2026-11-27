# Episode 29 (Office series 03): My boss knows I used Claude Code, PREVIEW (not final, not published)
`remotion-fx/out/BOSS-KNOWS-CLAUDE-CODE-EP03-PREVIEW.mp4` (1080x1920, 30 fps, 71.1 s, -15.5 LUFS, peak -1.5 dBFS, 0 black frames). Composition `Ep29` (`remotion-fx/src/ep29/Ep29.tsx`).

## Reuse / continuity
Same Blender office (`assets/office/blender/build_office.py`, new `--evening` flag: darker dusk, warm desk lamp, same geometry/cameras; plates E_A_wide, E_B_medium, E_C_door), same Claude mascot rig (new actions LAUGH, CONFUSED, CODE added + clips THINK, CODE/TALK/IDLE with headphones+laptop), same 2D Agentoon robot rig, same voices (am_adam robot, am_michael Claude), same Remotion helpers. No office/character redesign.

## Real coding demo (isolated, `demo/`)
React + TypeScript teaching project: `src/login.tsx` has `LoginButtonBuggy` (INTENTIONALLY two-click, labelled, isolated) and `LoginButton` (one click); simulated login only, no credentials/services; nothing touched in any other project. Real: `npm test` (vitest, 3 of 3 pass), real Playwright/Chromium browser recording with real mouse clicks (DOM status read: fixed 1 click -> success; buggy click 1 -> waiting, click 2 -> success; log in `demo/rec/clicklog.json`), real `claude -p` Claude Code run (Haiku 5.5, about $0.02) that ran the tests and explained the bug (`data/cc/run.jsonl`), real file diff (difflib) shown on screen.

## Fictional / illustrative (labelled on screen)
Manager, team chat and messages; the "usual code" joke snippet; code-quality indicators. No real person or event.

## Skills actually used (code)
director (plan), kinetic-type (slam headline, word captions), ui (chat cards, code/diff panels, terminal transcript), diagrams (USER CLICK -> VALIDATION -> LOGIN RESULT flow), data/number-motion (click counters in the demo), camera (extreme close-up, push-ins), robot (RobotRig2 acting + full-body finale), audio (two-voice dialogue, pauses, SFX). Not used: three.js 3d-motion, ui-depth-reel, explainer-panel-reel, neon-outline, HyperFrames, OneTake, Lemo Opuscar.

## Honest weak spots
- Robot is the 2D rig; face expressions are limited to mouth shapes and eye blink (worry/shock via mouth and arms, no eyebrows); sitting poses only (legs visible only in the standing finale in plate C).
- Claude lip movement is a TALK loop gated by voice level, not phoneme-accurate; no magnifying glass in this episode; LAUGH clip uses squinted eyes (not the ">  <" shape of the reference).
- Speech rate ~189 wpm in spoken sections (pauses added for jokes); first-two-seconds hook is the fictional message + headline.
- No motion-profile/mobile-check scripts run; frames reviewed by contact sheet only.
