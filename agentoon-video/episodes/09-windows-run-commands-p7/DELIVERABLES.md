# Ep 09 — 5 hidden Windows tools, Part 7 (commands 31–35) — PREVIEW

Video: `out/agentoon-ep09-windows-run-commands-p7-PREVIEW.mp4` — 1080x1920, 30 fps, H.264+AAC, **31.6 s** (limit 35), -15.7 LUFS, TP -1.4 dBTP, voice 161 wpm, no silence >= 1 s, no moving light sweeps (0 sampled frames with a sweeping band), no persistent dots.
Subtitles: `subtitles.srt`. Transcript: `narration-transcript.txt`. Source: `src/index.template.html`, `build.py`, `episode.json`, `cues.json`, `data/slots.json`.

## IMPORTANT: this is a preview. The real Windows clips are not in it.
This session runs on Linux with no Windows machine, so I cannot press Win+R or open Certificate Manager, Steps Recorder, File Explorer Options, iSCSI Initiator or ODBC. Microsoft Learn / Support were also not reachable from the sandbox (HTTP blocked), so the docs could not be visited. I did NOT draw fake Windows dialogs: every Windows window is a clearly labelled "RECORDING SLOT · REAL CLIP PENDING" frame inside the laptop, and a "PREVIEW · REAL WINDOWS CLIPS PENDING" chip is on screen.
To finish: record the 6 clips with `deliverables/RECORDING-RUNBOOK.md` (safe: no changes made in any tool), put them in `assets/`, set `data/slots.json` to verified (optionally a highlight box per clip), run `python3 build.py`, mix, render under a new name. The real-clip path (video inside the laptop, ring + camera zoom on the highlight) was tested with a synthetic clip.

## Storyboard as built (narration unchanged from your script)
0:00 hook: robot presses WIN+R, title "5 HIDDEN WINDOWS TOOLS · PART 7"; 31 certmgr.msc; 32 psr (with the honest "deprecated / may not open on newer Windows" note); 33 control folders; 34 iscsicpl ("view only, nothing is connected or changed"); 35 odbcad32; five command cards; Agentoon.ai ending ("Follow @agentoon.ai", "Real AI Tools • Skills • Automation").

## Command facts (from my knowledge; NOT checked against the docs this session because they were unreachable)
- `certmgr.msc` = Certificate Manager, "Certificates – Current User" (folders such as Personal, Trusted Root Certification Authorities, Intermediate Certification Authorities, Trusted Publishers).
- `psr` = Steps Recorder (Problem Steps Recorder); Microsoft lists it as deprecated; whether it opens depends on the Windows build. Narration says "On older Windows versions", which holds either way.
- `control folders` = File Explorer Options (General / View / Search tabs; View has hidden files and "Hide extensions for known file types").
- `iscsicpl` = iSCSI Initiator Properties; the first run can prompt to start the Microsoft iSCSI service (see the runbook warning).
- `odbcad32` = ODBC Data Source Administrator (User DSN, System DSN, File DSN, Drivers, Tracing, Connection Pooling, About).
Please check these against the Microsoft pages when you record.

## Tools actually used
HyperFrames + the Agentoon kit (robot, laptop frame, camera, transitions, captions, Outro), Kokoro TTS + synth music/SFX mix (existing workflow), NO.ribbon slot ribbons (Night Ops kit). NOT used: Remotion (no timeline graphic needed in this episode), Blender / Pexels / Shotcut (unavailable here; nothing in this episode needs them).

## QC
PASS: 1080x1920, 31.6 s, loudness/true peak, silence, command order 31→35, captions clear of the command bars, robot in every scene, single Follow CTA, no light sweeps, lint 0 errors.
OPEN: the 6 real clips; fact check against Microsoft docs; validator's "122 wpm" is whole-video length (voice-only 161 wpm).
