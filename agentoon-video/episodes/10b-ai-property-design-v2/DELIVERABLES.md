# Ep 10b · AI Property Design, 85 s version: deliverables

**Status: PREVIEW.** Everything on screen is real (Blender 5.2.3 renders, verbatim prompt text), but four real-software recordings could not be captured in the cloud sandbox.

| Deliverable | Path |
|---|---|
| Video 1080x1920, 24 fps, 85.2 s | `final/ai-property-design-v2-PREVIEW.mp4` |
| Narration (Kokoro) + mix | `audio/narration.wav`, `audio/mix.wav` |
| Subtitles | burned-in kinetic captions; word timings in `audio/timing.json` |
| Editable composition | `src/index.template.html`, `build.py`, `mkclips.py` (HyperFrames + GSAP) |
| Editable Blender project | `../10-ai-property-design/blender/property_anim.blend` + `build_property.py`, `build_anim.py`, `render_shot.py` |
| Lip-sync data | `data/lipsync.json` (robot action `B.speak` in `kit/robot.js`) |
| QC report | `data/QC-REPORT.md` |

## MUST RECORD (to make it FINAL)
1. Google Maps (real site): find the sample plot, switch to satellite view, copy the location link. 10 s -> `footage/google-maps.mp4`.
2. Claude Code (real terminal) with that link pasted and the brief, showing the genuine response. 12 s -> `footage/claude-code.mp4`.
3. Blender desktop app (viewport) opening `property_anim.blend`, scrubbing the timeline. 10 s -> `footage/blender-viewport.mp4`.
4. Official Claude and Blender logos from their brand pages.

## Tools actually used
Claude Code (wrote and ran the scripts), Blender 5.2.3 via the `bpy` module (Cycles), HyperFrames + GSAP (edit), Kokoro (local TTS), ffmpeg. Not used: Remotion, Gemini/Flow, Pexels, Vercel.
