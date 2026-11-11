# Audio plan (enforced by project code)
Arabic narration (approved provider: Google Gemini TTS) + ONE extremely soft pad bed `assets/audio/music/fmc-ambient-pads-v6.wav` (−34 LUFS bed, ducking, 2 s in/3 s out), mixed with `scripts/mix-audio.ts --no-sfx`; no whooshes/impacts/UI/camera sounds; verify with `npm run audio:qc -- --video … --stems …`. Not generated yet (no picture to mix).
# Skills actually used in this session
`fmc-video-producer` rules (CLAUDE.md, FMC_SKILLS_REGISTRY.md read), the Pexels integration (key from `.env`; host access added to the Default environment with your approval) for the footage audit. HyperFrames, Lemo Opuscar, FMC audio and Arabic QC were NOT run yet — they apply at the edit stage, after footage is decided.
