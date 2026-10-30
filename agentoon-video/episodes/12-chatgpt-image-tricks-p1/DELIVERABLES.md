# Ep 12 · 15 ChatGPT Image Tricks, Part 1 of 3

**Status: WORK-IN-PROGRESS PREVIEW. NOT FINAL.** The timeline, narration, speaking robot, comparison animations, prompt cards, montage, CTA and sound are built and rendered. The 15 real photos and 15 real ChatGPT results do not exist yet, so every BEFORE/AFTER slot is a hatched, labelled PENDING panel. No image, result or ChatGPT screen is invented.

| Item | Path |
|---|---|
| Preview MP4 (1080x1920, 30 fps, 105 s) | `final/chatgpt-image-tricks-p1-WIP-PREVIEW.mp4` |
| Brief + 15 exact prompts | `brief/BRIEF.md`, `data/effects.json` |
| Audience prompt pack | `data/PROMPT-PACK.txt` |
| Tracking sheet / blockers | `data/TRACKING-SHEET.md` |
| Run sheet for the real edits | `data/RUN-SHEET.md` |
| Narration schedule + subtitles | `script.py`, `data/transcript.txt`, `data/subtitles.srt` |
| Editable composition | `src/index.template.html`, `build.py`, `tts_slots.py` (HyperFrames + GSAP) |
| QC report | `data/QC-REPORT.md` |

## Tools actually used
HyperFrames + GSAP (timeline, comparisons, captions, transitions), Kokoro (local narration), the original Agentoon robot with loudness-driven lip-sync (`kit/robot.js` `B.speak`), FFmpeg, Playwright Chromium (render).
**Not used:** Remotion (not installed here; the brief asks for it, a port is possible), Blender (no 3D needed for the 2D robot), Pexels and ChatGPT (unreachable from this session), Shotcut (not installed), Gemini/Flow, Vercel, any paid service.
