# FMC Medical Video Studio — standing instructions (apply to every new video)

Status: V7 infrastructure phase complete. **Do not render any video until the user authorises production** (see FMC_STUDIO_V7_UPGRADE_REPORT.md).

Read `docs/FMC_PRODUCTION_STANDARDS.md` first. Non-negotiables:
1. Audio = Arabic narration + one extremely soft ambient bed. NO sound effects of any kind unless the user explicitly approves a specific effect for a specific video. Never edit `FMC_AUDIO_POLICY` to enable effects on your own; never reintroduce raw `<Audio>`, whoosh/swoosh assets, or default seam effects. Use `<NarrationAudio>` only.
2. Before delivering: `npm run qc:all` (and `audio:qc --video`, `standards:qc --video` on the final file). Report results honestly; software cannot verify Arabic pronunciation, medical accuracy or listening comfort.
3. Presenter: clean-shaven 30–35 male, white coat/navy scrubs, official logo (`assets/logo/fmc-original-logo.png`, never recreated). Use `cameraPresets.ts`; do not let him dominate scenes.
4. No on-screen production banners/progress bars. Review status lives in reports.
5. Arabic: real text layers, MSA, no silent narration edits (script hash lock). Cards ≤3, ≤6 words, ≥40 px; keep essential text out of the Instagram safe-zone margins.
6. Secrets only in `.env` (gitignored). Never print keys. No PRs unless asked.
7. Don't claim a check was done unless it was run.
8. Audio config lives in `src/lib/audioPolicy.tsx` (`FMC_AUDIO`). Scenes may not declare `sfx` (schema rejects it). Never invoke HyperFrames `/media-use`, `hyperframes tts|auth|cloud|cloudrun|lambda|publish|add|transcribe`, or any catalog music/SFX — use `npm run hf -- <lint|check|keyframes|timeline|…>` (guarded wrapper, pinned 0.8.171, telemetry off). Registry blocks may ship SFX audio.
9. Licences: do NOT use OneTake (PolyForm Noncommercial) code/assets; do NOT enable gbro-collage-broll's Gemini video generation (paid). Opuscar, ClaudeAnimationBase, HyperFrames are used for guidance/tooling only (MIT/MIT/Apache-2.0). Opuscar's "foley/SFX on every action" advice does NOT apply to FMC.
10. Directing: pick a style with `selectDirectorStyle()` (documentary | commercial | explainer3d); transitions are continuous-camera presets (`src/lib/continuousTransitions.ts`) with no sound; camera uses the C1 sampler (`src/lib/cameraFlow.ts`).
11. Before any production: `npm test`, `npx tsc --noEmit`, `npm run qc:all`; after render: `audio:qc --video` and `standards:qc --video`, then human listening/reading review. Services: العلاج الطبيعي، طب العظام، الطب العام، التأهيل العصبي، علاج الإصابات الرياضية، إعادة التأهيل بعد العمليات الجراحية only — never occupational or speech therapy. No phone numbers, QR codes or websites unless explicitly requested.
