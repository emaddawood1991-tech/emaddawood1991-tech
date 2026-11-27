# Episode 28 (Office series 02): Claude prepared 50 Instagram Reels, PREVIEW (not final, not published)
`remotion-fx/out/CLAUDE-50-REELS-EP02-PREVIEW.mp4` (1080x1920, 30 fps, 85.1 s, -15.2 LUFS, peak -1.5 dBFS, 0 black frames). Composition `Ep28` (`remotion-fx/src/ep28/Ep28.tsx`), template `ReelTemplate.tsx`.
Reference analysis `data/REFERENCE-ANALYSIS.md`; sources `data/OFFICIAL-SOURCES.md`; office/character/voice continuity `data/CONTINUITY.md`.

## Real vs demo
- REAL: batch run of the reusable ReelTemplate over `data/reels.json` (3 videos rendered, terminal capture replayed x5); one real Claude Code CLI run (`claude -p`, Haiku 5.5, about $0.035) that rendered reel-01; verbatim source of ReelTemplate.tsx; the 3 rendered thumbnails/videos; draft text from reels.json.
- DEMO/PLANNED (labelled on screen): the 50-reel counter and dashboard (planned batch), 47 placeholder cards, audience-research cards (illustrative), approval dashboard. No real audience data, Instagram analytics, connector, auto-posting or publishing. Only 3 of 50 reels exist.
- The reference's "Ootto" service could not be verified, so no external service is named.

## Skills actually used (code)
director (plan), diagrams/infographics (pipelines, nodes, arrows), kinetic-type (word captions, slam text), data-motion/number-motion (counter 01→50), ui (panels, phones, terminal/code panels), camera (per-scene push-ins), robot (RobotRig2 walk/gestures, full-body entrance), audio (two-voice dialogue, ducked mix, SFX), cinematic-fx (vignette), motion (staggered springs). Not used: 3d-motion three.js, ui-depth-reel, scrapbook-collage, explainer-panel-reel, neon-outline, news-broadcast, HyperFrames, OneTake, Lemo Opuscar.

## Honest weak spots
- Robot is the 2D rig over Blender plates (full-body walk in plate C; seated in A/B), not a 3D robot; "sit down" is a cut, not an animated sit. Door opens by crossfade of two renders.
- Claude lip movement is a TALK loop gated by voice level, not phoneme-accurate; laptop accessory not rendered; no over-the-shoulder laptop shot (screens are overlays).
- Real terminal replay shows environment warnings (real output) and is cropped; labelled sped up.
- No motion-profile/mobile-check scripts run; frames reviewed by contact sheet. FINAL needs a real Instagram-side workflow if you want one shown.
