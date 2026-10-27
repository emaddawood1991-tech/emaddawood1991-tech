# Ep 10 · AI Property Design: deliverables and status

**Status: PREVIEW (not FINAL).** The video contains no placeholder labels and every 3D shot and terminal line is real, but two required real-software recordings could not be made in the cloud sandbox (see "MUST RECORD"). `scripts/final-gate.sh` fails on purpose until they exist.

## Files
| Deliverable | Path |
|---|---|
| Video (1080x1920) | `out/ai-property-design-PREVIEW.mp4` |
| Narration (Kokoro, local) | `audio/narration.wav`, full mix `audio/mix.wav` |
| Subtitles | `subtitles.srt` (+ burned-in kinetic pill captions) |
| Transcript | `narration-transcript.txt` |
| Editable composition | `src/index.template.html` + `build.py` (HyperFrames, GSAP) |
| Editable Blender project | `blender/property.blend`, `blender/build_property.py`, `blender/render_stage.py`, `blender/README.md` |
| Real transcript data | `data/transcript.json` (lines from this session + `blender/render.log`) |
| Official sources | `data/OFFICIAL-SOURCES.md` |
| QC report | `data/QC-REPORT.md` |

## MUST RECORD (needed before this can be FINAL)
- Scene 3 · claude.ai (or the Claude app) · upload the land photo, location screenshot and plan, type the brief, let Claude answer · show the real reply on screen · 10-12 s · save as `footage/claude-brief.mp4`.
- Scene 4 · Blender desktop app (4.5+/5.x) · open `blender/property.blend`, orbit the viewport from empty land to blockout to final, then press F12 · 10 s · save as `footage/blender-viewport.mp4`. The headless build used here has no interface.
- Official logos for Claude and Blender from their press/brand pages (sites unreachable from the sandbox).
- Your own land photo and a real location screenshot, if you want the inputs to be yours rather than the labelled samples.

## What is real in this cut
- All 3D is real Blender 5.2.3 (Cycles) renders, made by Claude Code with the `bpy` module; the `.blend` is editable.
- Terminal text is verbatim output (`5.2.3 LTS`, `saved 223 objects`, render log lines).
- Not used (sandbox/policy): Remotion, Gemini/Flow/Veo (no credits, no approval), Pexels, Vercel, Shotcut.
