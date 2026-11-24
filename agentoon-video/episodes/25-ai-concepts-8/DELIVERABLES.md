# Episode 25: 8 AI Concepts in 90 Seconds (PREVIEW, not final, not published)
File: `remotion-fx/out/AI-CONCEPTS-8-PREVIEW.mp4` (1080x1920, 30 fps, 93.0 s, H.264/AAC). Engine: Remotion. Nothing published; awaiting approval.

## Checks
- Audio: -15.1 LUFS, peak -3.6 dBFS, narration 166 wpm (Kokoro am_adam, PROVISIONAL until the 10 s sample is approved), subtle SFX only.
- No black frames (blackdetect 0). Frame sheets viewed for all 10 scenes: text readable, robot full body every scene.
- Real data: token splits from the real o200k_base tokenizer (gpt-tokenizer, local). Everything else labelled ILLUSTRATIVE/SIMPLIFIED. See data/FACT-CHECK.md.

## Skills actually used (as code)
agentoon-director (plan), agentoon-diagrams/infographics (flow lines, packets, architecture), agentoon-kinetic-type (word-timed captions, title), agentoon-camera (push-ins), agentoon-transitions (blur-slide stage swap), agentoon-data-motion (counters/meters), agentoon-robot (RobotRig2 walk/gestures/lip-sync), agentoon-audio, agentoon-qc (checks above).
Not used: ui-depth-reel, explainer-panel-reel, neon-outline, three.js (3D = own perspective projection in SVG), Blender (no robot rig exists).

## Honest weak spots
- The attached 66 s reference video never reached this session; built from the written brief only. Re-send it to match structure.
- Motion profile is weak: mean energy 1.1, 8% alive, longest static stretches (e.g. 66-74 s, 76-87 s) where only the robot/captions move. Needs more mid-scene motion bursts in a v2.
- Several panel texts are small for phones; RAG scene leaves empty space in the lower stage.
- Robot is the 2D rig (walks/gestures/lip-sync), not a true 3D/Blender character.
- Voice not heard by me (measured only).
