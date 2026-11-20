# Episode 24 — My Robot Meets Claude Code — PREVIEW package (not published)

Output: `agentoon-video/remotion-fx/out/ROBOT-MEETS-CLAUDE-PREVIEW-v3.mp4` (1080x1920, 30 fps, 90.9 s), composition `RobotMeetsClaude`.
1. Source verification: `data/OFFICIAL-SOURCES.md`.
2. Voice samples: `audio/voice-sample-agentoon-10s.mp3` (Kokoro `am_michael`), `audio/voice-sample-claude-10s.mp3` (Kokoro `am_adam`). Free local voices; measured, not heard by me.
3. Characters walk/gesture test: `out/RMC-CHARACTERS-WALK-GESTURE-TEST.mp4` (first 14 s: robot walks in, Claude walks in and points/presents).
4. Dialogue: `data/DIALOGUE-SCRIPT.txt`.
5. Preview: above.
6. Skills actually used (with code): `/agentoon-director` (plan), `/agentoon-robot` + RobotRig2, `/agentoon-motion` (3D card entrances, parallax drift), `/agentoon-camera` (per-scene push-ins), `/agentoon-kinetic-type` (speaker-tagged word captions + slam titles), `/agentoon-ui` (monitor stage, terminals, before/after slider, cursor ripple), `/agentoon-diagrams` (skill→task connection lines), `/agentoon-transitions` (coral wipes, pop-in), `/agentoon-audio` (two-voice timeline, ducked music), `/agentoon-qc`. Blender 5.3 (Cycles) rendered the Claude character; Remotion composed everything. **Not used:** `/agentoon-3d-motion` (three.js), `/agentoon-cinematic-fx`, `/ui-depth-reel`, `/scrapbook-collage`, `/neon-outline`, `/explainer-panel-reel`.

## Honest notes
* Robot is the approved 2D rig (no Blender robot rig exists); it **stands** at the desk (the rig has no sitting pose), it does walk in at the start.
* Claude is a Blender render (legs, feet, arms, white gloves with fingers, sneakers); the cartoon face is drawn in Remotion so the mouth can follow Claude's own voice. Each character's mouth moves only during their own lines.
* Voices are free local TTS; a cloud voice would sound more natural but spends credits.
