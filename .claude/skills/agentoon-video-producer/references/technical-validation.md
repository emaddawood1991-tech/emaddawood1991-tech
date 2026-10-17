# Technical validation (run on the rendered MP4)

Never claim success without checking the actual file. Quick path:

```bash
bash ${CLAUDE_SKILL_DIR}/scripts/validate-render.sh path/to/video.mp4 [word_count]
```

It prints PASS/WARN/FAIL and writes a phone-size contact sheet to `<video>-review/`. Then look at the images (Read them) and finish the manual checks below. The commands underneath are what the script runs, for reference or manual use.

## Container and streams
```bash
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,r_frame_rate,pix_fmt,sample_rate,channels \
  -show_entries format=duration,size,bit_rate -of default=nw=1 video.mp4
```
Targets: **1080×1920**, H.264 (`h264`), `yuv420p`, constant 24 or 30 fps, AAC audio (44.1/48 kHz), duration 60–90 s (max 110 s; short tests 10–15 s), file present and non-empty.

## Loudness and clipping
```bash
ffmpeg -nostats -i video.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -n 15
```
Targets: integrated about **−15 LUFS** (acceptable −17 to −13), true peak **≤ −1 dBTP**, no clipping. Voice must sit clearly above music (music 18–24 dB under the voice, ducked). If the mix fails, fix levels and re-render; do not just normalise the final file blindly.

## Silence and narration speed
```bash
ffmpeg -nostats -i video.mp4 -af silencedetect=noise=-35dB:d=1.0 -f null - 2>&1 | grep silence_
```
No silent gap longer than about **1 s** (a deliberate beat before the ending is the only exception). Narration speed: `words ÷ (speaking_seconds ÷ 60)` must be about **155–170 wpm**. Count words from the script, and use the voice duration (audio length minus leading/trailing silence).

## Motion profile (liveliness gate)
```bash
bash ${CLAUDE_SKILL_DIR}/scripts/motion-profile.sh video.mp4
```
Read-only. Prints hard cuts, motion energy per 0.5 s, mean energy, alive-time share, bursts per minute, static stretches and the longest gap between bursts. Bar from the approved references: mean energy 4.4–6.3, alive time 57–83 %, 20–36 bursts per minute, longest gap 2.5–4 s. Targets for new episodes: mean ≥ 4, alive ≥ 55 %, no static stretch ≥ 2.5 s before the last 3 s, gap ≤ ~3 s. Long episodes may sit slightly below the per-minute burst rate, but never above a ~4 s gap. Fix a failure by adding a camera move, parallax drift, a hero-type or transition beat, or an interface interaction; never by adding meaningless motion.

## Phone-size review
```bash
mkdir -p video-review
ffmpeg -i video.mp4 -vf "fps=1/2,scale=390:-1,tile=6x2" -frames:v 1 video-review/phone-sheet.png
ffmpeg -i video.mp4 -vf "fps=1,scale=390:-1" video-review/f%03d.png    # single frames at actual phone width
```
Look at frames at about 390 px wide. Check:
- Commands, URLs and GitHub text are readable at that size (if not, zoom into the detail).
- Subtitles do not cover code, buttons or results.
- Contrast holds on both bright and dark backgrounds.
- No overcrowded scenes; one focal point per beat, and no large empty zone beside small content (layer environment, UI card, robot, chips, hero type).
- Real UI crops are zoomed until their text is readable at this width; hold each at least 1 s.

## Safe areas (1080×1920)
Keep important text and UI inside:
- top: avoid the first ~180 px (status bar / search / account UI)
- bottom: avoid the last ~320 px, except the subtitle band, which must itself stay clear of code
- right: avoid ~120 px (like/share/comment rail)
- sides: at least ~48 px margin
Verify by overlaying the guides on a few frames, or by viewing the phone sheet.

## Scene and seam review
Extract a frame at the middle of every scene and on both sides of every transition. Check spelling, branding, robot acting, animation quality and that nothing pops or jumps unintentionally.
```bash
ffmpeg -ss 7.5 -i video.mp4 -frames:v 1 seam-07.5.png
```

## HyperFrames project gate
```bash
npx hyperframes doctor
npx hyperframes check          # includes lint, layout, contrast
npx hyperframes snapshot --at <midpoints>
npx hyperframes render --quality delivery --output <new-name>.mp4
```
After render read the summary line (GPU/software mode, stage timings) and confirm the output file exists and is non-empty. Do not use cloud render.

## Fail → fix → re-check
Fix the root cause, re-render to a **new filename**, rerun the script. Record remaining caveats in the delivery note.
