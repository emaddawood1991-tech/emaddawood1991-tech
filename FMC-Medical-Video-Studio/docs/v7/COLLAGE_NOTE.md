# Optional: local paper-collage visuals (not implemented — design note)

**Decision:** not built in V7. It is optional and lower priority than the audio, character and QC work, and nothing in the current FMC topics needs it.

**Why `pyang5166/gbro-collage-broll` is not used:** MIT code, but its pipeline is Gemini Omni Flash first/last-frame *video generation* (billed per use, needs `GEMINI_API_KEY`, and Codex's built-in `image_gen` for stills). That is exactly the paid video generation FMC must not enable. Nothing from it was installed or run.

**If a future health-awareness / prevention video wants it** (never for anatomy — realistic 3D stays the medical visual):
- Build it locally in Remotion from SVG/CSS: flat colour-field background, 2-colour halftone fills (SVG `<pattern>`/CSS radial-gradient dots), cut-paper shapes with a 2–3 px offset shadow, deterministic "stop-motion" slide-in on a 12 fps step with a seeded jitter (`remotion` `random(seed)`), pieces assembling from an empty field.
- Use only original shapes drawn for FMC or licensed/own photography; Arabic as real text layers; no sound.
- Gate: add it as a `sceneType` variant only after a still-frame style test and approval.
