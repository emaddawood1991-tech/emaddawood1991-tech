# Episode 23 — GTA 6: Parents need to know — PREVIEW package (not published)

Output: `agentoon-video/remotion-fx/out/GTA6-PARENTS-PREVIEW-v4.mp4` (1080x1920, 30 fps, 82.2 s). Composition `Gta6Parents` (`src/nine/Gta6Parents.tsx`). Engines that actually ran: **Remotion** (composition, robot, motion graphics) and **Blender 5.3 (bpy, Cycles CPU)** for the 3D end title (`blender/title3d.py`, 75 frames).

1. **Sources and footage inventory** → `data/OFFICIAL-SOURCES.md` (facts verified live on 2026-11-20; footage windows reviewed frame by frame; reuse status and MUST RECORD list).
2. **Voice sample** → `audio/voice-sample-10s.mp3` (Kokoro `am_adam`, American male, 162 wpm, high-pass 95 Hz, +2.5 dB presence, mild compression; mix −15.0 LUFS, peak −3.9 dBFS). I cannot hear audio, only measure it.
3. **Robot full-body test** → `out/GTA6-ROBOT-FULLBODY-TEST-v2.mp4` (studio walk-in, point at controller, explain, present rating panel; lip-sync from the narration envelope). There is **no Blender robot rig** in the repo; legs/arms are driven by the approved 2D rig control layer (`RobotRig2`, foot contact checked), not Blender.
4. **Narration** → `data/NARRATION-SCRIPT.txt` (the supplied lines plus verified additions: PS5 Pro ray-traced shadows, ESRB/PEGI ratings, in-game purchases, PlayStation Family App).
5. **Preview** → see output above.
6. **Skills actually used (with code):** `/agentoon-director` (selection + plan), `/agentoon-motion` (staggered spring slabs, depth/parallax), `/agentoon-camera` (push-ins, parallax, scene push), `/agentoon-kinetic-type` (word-timed captions, slam headline), `/agentoon-3d-motion` → Blender 3D title (not three.js), `/agentoon-robot` + RobotRig2, `/agentoon-audio` (TTS, ducked music bed, loudness), `/agentoon-qc` checks. Subtle neon outlines are CSS glows on cards (not the `/neon-outline` Remotion component). **Not used:** `/agentoon-data-motion`, `/agentoon-cinematic-fx`, `/ui-depth-reel`, `/news-broadcast` (no scene needed them).
7. **Captions** → `data/CAPTIONS.md` (Instagram + TikTok).

## QC log (honest)
* Facts: release date Nov 19, 2026; PS5 and Xbox Series X|S; ESRB M 17+ descriptors verbatim; PEGI 18 (Europe) — all from Rockstar/PlayStation/ESRB pages read on 2026-11-20. **UAE rating not shown** (only unverified social posts claim 21+).
* No explicit imagery: shots chosen from frame-by-frame contact sheets (no weapons, kissing, nudity, explosions, suggestive dancing); windows re-checked after render. No claim that games cause behaviour.
* Render: 82.2 s, 2466 frames; blackdetect clean on the earlier version; motion profile mean energy 3.3, alive 52%. **Weak spots:** long calm stretches in the studio and steps scenes (small robot/card motion only); footage reuse licence for a brand account is unconfirmed (see sources); real PlayStation/Xbox parental-control screens and real store-page screenshots were not accessible, so those panels are rebuilt from verbatim text and the real ESRB badge and labelled as such; voice not auditioned by me.
* Not published. Waiting for your approval.
