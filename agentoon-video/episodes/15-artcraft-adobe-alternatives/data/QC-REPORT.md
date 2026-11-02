# QC REPORT — Ep 15 "7 Free Adobe Alternatives" — STATUS: PREVIEW (not FINAL)

Engine: HyperFrames (render), Kokoro local TTS (voice am_michael), local ffmpeg loudnorm. Not used: Remotion, Blender, Pexels, any paid service/MCP.
Slash skills used (as guidance, plus kit APIs): agentoon-director, -video-producer, -robot, -ui, -motion, -camera, -typography, -audio, -transitions, -qc. Not used: -3d, -morph, -diagrams.

## Automated results (final/artcraft-adobe-alternatives-PREVIEW.mp4)
- 1080x1920, h264, 30 fps, 84.8 s (target ≤110). Loudness -15.0 LUFS, true peak -1.3 dBTP, no silence gap ≥1 s.
- Narration ≈152 wpm (validator's 108 wpm warning uses whole-video length). `hyperframes check`: 0 layout errors; only the caption-fade contrast sampling note and nested-section lint warnings remain.
- Motion: 11 bursts (≈7.8/min); one static stretch 36.5–39 s and a 9 s gap between big bursts (FilmCraft scene) — smaller punches added but not a major burst; flagged for polish.

## Content honesty
- Every screenshot, icon and status is from the apps' own repos/READMEs (see data/OFFICIAL-SOURCES.md). No invented features, stats or parity claims. "EARLY DEVELOPMENT" scene and README quote included. ArtCraft/Adobe marks not used; "not affiliated" label on the end card.
- Screenshots are labelled "REAL SCREENSHOT · PROJECT DOCS"; getartcraft.com labelled "NOT CAPTURED".

## Blockers for FINAL — MUST RECORD
1. getartcraft.com and /apps live capture (site unreachable from this sandbox).
2. Launcher downloaded and running on a real machine.
3. Each app running on a real file (at least PhotoCraft opening a PSD, VectorCraft Pathfinder, FilmCraft timeline).
4. One verified PdfCraft operation (e.g. split a real PDF) shown live.
Until these are recorded, the file stays `*-PREVIEW.mp4`. Not published.
