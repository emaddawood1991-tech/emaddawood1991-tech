---
name: agentoon-qc
description: >-
  Final production review for Agentoon.ai videos. Audits software authenticity, logos, readability, narration accuracy, robot lip-sync, animation smoothness, placeholders, fake results, aspect ratio, audio and mobile-safe captions; writes QC-REPORT.md and blocks FINAL status when major errors remain. Use before delivering any preview or final MP4.
argument-hint: <path to the episode folder or MP4>
allowed-tools: Read Grep Glob Bash(bash .claude/skills/agentoon-video-producer/scripts/*) Bash(bash ${CLAUDE_SKILL_DIR}/scripts/*) Bash(ffmpeg *) Bash(ffprobe *) Bash(npx hyperframes *)
---

# /agentoon-qc

Review the **actual MP4**, not the plan. Blockers keep the file named `*-PREVIEW.mp4` and out of "FINAL".

## 1. Automated
```bash
S=.claude/skills/agentoon-video-producer/scripts
bash $S/validate-render.sh <mp4> <spoken_word_count>   # 1080x1920, h264/yuv420p, 30 fps, -15 LUFS +/-2, TP <= -1, no silence >= 1 s, pace
bash $S/motion-profile.sh <mp4>                         # bursts, static stretches, longest gap (target about 3 s)
bash $S/mobile-check.sh <episode>                       # large commands, safe areas, captions off code
bash $S/no-placeholders.sh <episode>                    # no placeholder strings/ribbons in a deliverable
bash $S/final-gate.sh <episode>                         # needs data/OFFICIAL-SOURCES.md + data/QC-REPORT.md complete
npx hyperframes check                                   # lint, layout, contrast, text floor (HyperFrames episodes)
bash ${CLAUDE_SKILL_DIR}/scripts/sample-frames.sh <mp4> # contact sheets + robot crops for lip-sync
python3 .claude/skills/agentoon-director/scripts/validate-skills.py   # if the skill set itself changed
```

## 2. Manual checklist (look at the contact sheets and at 360 px width)
- **Authenticity:** every screen is real or labelled (`VERBATIM`, `NOT RUN`, `CONCEPT`, `DIAGRAM`, `PROJECT PHOTOS`, `NOT RECORDED YET`); no invented output, stats, compatibility, connection states or call evidence; each number traces to `data/`.
- **Logos and names:** correct product names/spelling; logos only if obtained from an official site; no wrong brand colours.
- **Readability:** text >= 28 px, commands >= 32 px, nothing cropped, captions in the caption band and clear of code/transformations, contrast OK on light and dark scenes.
- **Narration:** matches visuals and sources; pace 155-170 wpm while speaking; no unexplained jump.
- **Robot lip-sync:** crop the robot at one silent frame and two speaking frames: mouth closed vs open; blinking and gestures present; robot never covers the main content; outro robot and CTA correct.
- **Motion:** no broken scenes or flashes of unstyled content; no overlapping text outside transitions; no dead hold over 3 s; no moving light sweeps or persistent glowing dots; effect variety (not one transition repeated).
- **Format/audio:** 1080x1920, 30 fps, within the duration brief (60-90 s, max 110 s); voice above music, no clipping, SFX subtle.
- **Honesty of tools:** report exactly which engines ran (Remotion / HyperFrames / bpy / TTS), which did not, and why.

## 3. Verdict (write `data/QC-REPORT.md`)
`FINAL` only when every required real demonstration exists and all automated checks pass. Otherwise `PREVIEW` with: PASS list, FAIL list (exact blockers), MUST RECORD list, and what to fix next. **Block FINAL** for: any fabricated or unlabelled placeholder, missing required real recording, broken lip-sync, unreadable commands, wrong brand/name, loudness or true-peak failure, aspect/duration breach, claims not traceable to sources.

## Do not
Pass a video because the plan was good, hide a failing check, or edit the video during QC (report, then fix upstream and re-render under a new filename).
