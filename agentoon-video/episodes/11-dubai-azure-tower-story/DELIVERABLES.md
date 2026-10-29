# Ep 11 · "I built a 50-floor Dubai skyscraper concept with AI" (story Reel)

**Status: see `data/QC-REPORT.md`.** The Reel tells the *verified* workflow from the repo (Claude Code + Blender `bpy`), not the Vercel/Google Maps workflow in the original brief (the project report says neither was used).

| Deliverable | Path |
|---|---|
| Final 9:16 MP4 (1080x1920, 30 fps) | `final/dubai-azure-tower-story-PREVIEW.mp4` |
| Editable composition (HyperFrames + GSAP; Remotion was not installed here) | `src/index.template.html`, `build.py`, `mkclips.py`, `prep_assets.py`, `make_lipsync.py` |
| Narration transcript | `data/transcript.txt` |
| Subtitles | `data/subtitles.srt` (also burned in as kinetic captions) |
| Real footage and sources | `data/OFFICIAL-SOURCES.md` |
| Real build output used on screen | `data/real-build-output.txt`, `data/tower_params-excerpt.txt` |
| QC report | `data/QC-REPORT.md` |

## Real material in the video
- Hero footage: the owner's 120 s animatic (720p), reframed per shot (blurred extension + sharp real frame; nothing generated).
- 4K poster and 1080p interior still from the same project.
- `tower_params.json` lines (verbatim excerpt) and the real `build_all.py` run (`built in 0.9s, objects=1843`, bpy 5.2.3 LTS).

## Tools actually used
Blender 5.2.3 via `bpy` (the real build run on screen), FFmpeg (reframing, mux, QC), HyperFrames + GSAP (edit, captions, transitions), Kokoro (local narration), original Agentoon robot and outro kit, Playwright Chromium (render).
**Not used:** Remotion, Vercel, Three.js/R3F, Google Maps, Pexels, Gemini/Flow, any AI video model, any paid service.

## MUST RECORD to make it FINAL
See `data/OFFICIAL-SOURCES.md` (official logos/interfaces, original Claude Code conversation if it exists, Blender viewport, native 4K render).
