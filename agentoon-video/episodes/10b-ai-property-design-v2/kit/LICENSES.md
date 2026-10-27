# Licences and costs of everything the Agentoon video kit uses (checked 2026-10-17)

| Component | Role | Licence | Cost | Notes |
|---|---|---|---|---|
| HyperFrames 0.8.169 (heygen-com/hyperframes) | render engine, Claude Code plugin/skills | Apache-2.0 | free, local render | Never use `cloud render` or `heygen` sign-in. Needs Node 22+, FFmpeg, Chrome. |
| GSAP 3.15.0 (`kit/vendor/gsap.min.js`) | motion | GSAP "Standard 'no charge'" licence (gsap.com/standard-license) | free incl. commercial | Free while end users are not charged to use the product; no competing no-code animation builders. Vendored so renders never hit a CDN. Licence text could not be fetched from gsap.com in this environment; confirmed via npm metadata, file header and Webflow's announcement. |
| Lemo-Opuscar (lemomo-ai/lemo-opuscar) | creative-direction style guides (Claude Code plugin) | MIT | free | Styles tuned for Opus 5.5. We take grammar, never copy films. Some styles feature Clawd: never used here. |
| ClaudeAnimationBase (JohnHeibel) | character-animation principles | MIT | free | Principles only (p5.js engine and Clawd character are not used). Credit: John Heibel. |
| Kokoro TTS (kokoro-onnx 0.6.1 + Kokoro model) | narration | code MIT, model Apache-2.0 | free, on-device | Model files (~350 MB) are downloaded once from the kokoro-onnx GitHub release; not committed. |
| Fraunces, Inter, JetBrains Mono | type | SIL OFL | free | Copied from the carousel skill's bundled fonts. |
| OneTake (feitangyuan/onetake) | transition inspiration | PolyForm Noncommercial 1.0.0 | n/a | **Not installed, not copied.** Ideas only; `Cam.*` transitions are original GSAP code. |
| gbro-collage-broll (pyang5166) | collage B-roll idea | MIT | needs paid Gemini API | **Not installed, workflow not run, no key requested.** `Collage.*` is an original local HTML/CSS/SVG/GSAP implementation. |

Music and SFX are synthesized by `kit/py/build_audio.py` (original, no samples, no network).
