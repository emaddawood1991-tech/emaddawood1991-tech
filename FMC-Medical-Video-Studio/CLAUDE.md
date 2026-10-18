# FMC Medical Video Studio — standing instructions (apply to every new video)

Read `docs/FMC_PRODUCTION_STANDARDS.md` first. Non-negotiables:
1. Audio = Arabic narration + one extremely soft ambient bed. NO sound effects of any kind unless the user explicitly approves a specific effect for a specific video. Never edit `FMC_AUDIO_POLICY` to enable effects on your own; never reintroduce raw `<Audio>`, whoosh/swoosh assets, or default seam effects. Use `<NarrationAudio>` only.
2. Before delivering: `npm run qc:all` (and `audio:qc --video`, `standards:qc --video` on the final file). Report results honestly; software cannot verify Arabic pronunciation, medical accuracy or listening comfort.
3. Presenter: clean-shaven 30–35 male, white coat/navy scrubs, official logo (`assets/logo/fmc-original-logo.png`, never recreated). Use `cameraPresets.ts`; do not let him dominate scenes.
4. No on-screen production banners/progress bars. Review status lives in reports.
5. Arabic: real text layers, MSA, no silent narration edits (script hash lock). Cards ≤3, ≤6 words, ≥40 px; keep essential text out of the Instagram safe-zone margins.
6. Secrets only in `.env` (gitignored). Never print keys. No PRs unless asked.
7. Don't claim a check was done unless it was run.
