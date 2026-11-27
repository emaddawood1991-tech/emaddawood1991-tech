# Episode 30 — PREVIEW (not final; not published)
- Video: remotion-fx/out/FOUR-SKILLS-EP04-PREVIEW.mp4 (gitignored render; 1080x1920, 30 fps, 92.27 s, −15.2 LUFS, peak −1.6 dBFS, no black frames). Cover: remotion-fx/out/ep30-cover.png (comp `Ep30Cover`).
- Editable project: remotion-fx/src/ep30/Ep30.tsx (+ Root.tsx), data in remotion-fx/public/data/ep30-*.json, Blender mascot/office scripts under assets/.
- Viewer sheet: data/VERIFIED-LINKS-AND-INSTALL.md. Sources/transcripts: data/src, data/cc. Reference: data/REFERENCE-ANALYSIS.md.
## Measured results shown (all from data/cc, isolated demo-base project, small Haiku `claude -p` runs)
Karpathy A/B: 2 files +14/−4, 4 tests pass vs 1 file +10/−4, 3 tests pass (effect modest, one run each). Superpowers: skill call, plan, failing test (unresolved import) → 5 of 5 pass, 21 turns. ADHD: 668 words/114 lines vs 621/105 (≈7%), skill text loaded as system prompt.
## Engines / skills genuinely used
Blender 5.3 (Cycles) office plates + mascot sprites incl. new cape/headphones+documents/clipboard; Remotion (all graphics, camera, captions); Kokoro-ONNX local TTS; custom components built on the project's Remotion FX approach. Not used for this render: separate slash skills (`/neon-outline`, `/scrapbook-collage`, etc.) — their names were not applied, only the shared look-and-feel decisions.
## Limitations / blockers for FINAL
- Octopus network is a labelled illustration (no multi-model accounts); no real github.com screenshots (blocked) and no logos; no Windows/real-desktop footage.
- Duration 92.3 s vs 85–90 s target. Robot is a 2D rig; Claude's mouth is a voice-gated TALK loop; Claude is not centered inside the Octopus network.
- Claude-run costs: five small Haiku runs, roughly $0.02–0.07 each (disclosed; not pre-approved).
- QC: ffprobe/ebur128/blackdetect done; full `final-gate.sh` and phone-size review not run, so the file stays *PREVIEW*.
