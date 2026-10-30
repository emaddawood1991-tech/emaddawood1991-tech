# QC report · Ep 12 · 15 ChatGPT Image Tricks Part 1 · status: WORK-IN-PROGRESS PREVIEW (NOT FINAL)

File: `final/chatgpt-image-tricks-p1-WIP-PREVIEW.mp4` (105.0 s, 1080x1920, 30 fps, H.264 + AAC, 3,150 frames).

## Technical (validate-render.sh)
- PASS 1080x1920, h264, yuv420p, 30 fps, 105.0 s (limit 110 s)
- PASS -15.3 LUFS, true peak -1.2 dBTP, no silence gap >= 1 s
- INFO narration 153 wpm while speaking (the 114 wpm over the full length is expected: every line sits inside a fixed 5 s slot; no line was sped up, one was shortened)
- HyperFrames check: 0 errors

## Structure vs the 105 s spec
- PASS 0:00-0:05 three before/after reveals (goldenhour, proshot, objectremove slots)
- PASS 0:05-0:10 shorthand explanation: "These aren't built-in commands. They're 15 powerful prompts you can copy and try."; /nightfix struck through, 3-step diagram labelled "DIAGRAM · NOT A CHATGPT SCREENSHOT"
- PASS 0:10-1:25 fifteen 5 s scenes, same structure (number + label, stage, readable prompt excerpt typed in, wipe reveal, hold, one voiceover line); three groups with different tint and transition (whip / push / iris)
- PASS 1:25-1:37 montage of all 15 tiles
- PASS 1:37-1:45 closing: "Part 1 done / Part 2 next", signature ending ("Follow @agentoon.ai", "Real AI Tools • Skills • Automation")
- PASS prompt excerpts are the first sentence of each exact prompt (full prompts in `data/effects.json`)

## Robot
- PASS original robot (kit/robot.js); lip-sync from the real narration loudness envelope (`B.speak`): checked frames at 4.6 s (silent: closed smile) and 11.35 s / 12.4 s (speaking: open mouth shapes); blinking, head and gesture reactions per scene; sits beside the image, never over it

## FAIL (why this is not FINAL)
- FAIL 15 original photographs: none (Pexels unreachable from the session; `data/TRACKING-SHEET.md`)
- FAIL 15 genuine ChatGPT results: none (chatgpt.com unreachable and needs the owner's signed-in account; `data/RUN-SHEET.md`)
- FAIL authentic ChatGPT software footage: none (not fabricated; the explainer scene is a diagram and says so)
- All BEFORE/AFTER slots are hatched PENDING panels; the comparison wipes are real animations that will reveal real images once `sources/NN.*` and `results/NN.*` exist (`build.py` picks them up)
- Remotion was not used (not installed here); Blender not used (2D robot kept); Shotcut not installed; no paid or AI generator used

## Known cosmetic points
- Word timings for captions are estimated from phrase durations (Kokoro gives no alignment).
- Light motion in holds (slow 3.5% zoom); the preview has not been checked against real photographs, so contrast, crop and "before/after obvious on a phone" are untested until real images arrive.
