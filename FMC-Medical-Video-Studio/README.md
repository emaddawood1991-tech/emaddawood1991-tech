# FMC Medical Video Studio — مركز الفيصل الطبي

Reusable Arabic medical-video system: Remotion + Three.js (3D anatomy), Gemini (script drafting), Pexels (footage),
MiniMax + Google (Arabic voice), FFmpeg (audio/QC). Brand: **مركز الفيصل الطبي** · Ideal Care – الرعاية المثالية.

## Status (honest)
| Piece | State |
|---|---|
| Project, design system, Arabic typography (real RTL text, IBM Plex Sans Arabic / Cairo), HUD, transitions, logo reveal | Built, rendered |
| 3D lumbar spine (procedural, **simplified educational model**, labelled on screen) | Built, rendered |
| Reel 9:16 + TV 16:9 compositions | Built (Reel fully rendered; TV stills checked) |
| Arabic QC (automated) + approval hash-lock + final-export gate | Built, negative-tested |
| MiniMax TTS, Google (Gemini) TTS, comparison + ASR round-trip | Built — **not run: no API keys in this environment** |
| Pexels footage fetch, Gemini script drafting | Built — **not run: no keys / Pexels host unreachable here** |
| Final MP4 with narration | **Not produced** (needs your keys, voice approval, human script + pronunciation sign-off) |
| `preview/lower-back-pain-reel-PREVIEW-silent.mp4` | Visual draft: watermarked, **no voiceover**, music bed only. Not publishable. |

Not built: Blender pipeline, models for wrist/knee/shoulder (only lumbar exists; add verified `.glb` in `assets/anatomy/` via `<GLBModel/>`).
Music/SFX are originals synthesised by `npm run audio:bed` (licence-free); swap in licensed tracks if wanted.
Footage fallback: with no Pexels clips the treatment scene shows a 3D rehabilitation-concept animation.

## Setup
```
npm install
cp .env.example .env     # fill GEMINI_API_KEY, PEXELS_API_KEY, MINIMAX_API_KEY (never commit .env)
```
Chromium: scripts use `FMC_BROWSER` (default: Playwright headless shell path).

## Workflow (gates are enforced by code)
1. `npm run arabic:check -- lower-back-pain` — mechanical Arabic/brand/service/claim checks.
2. Human review of the Arabic + medical content, then record it:
   `npm run approve -- review lower-back-pain --kind grammar|terminology|medical --by "Name"`
3. `npm run voice:compare -- --terms` → listen to `output/voice-samples/` (+ `comparison.md` scorecard) →
   `npm run voice:approve -- --provider minimax|google --by "Name"`
4. `npm run approve -- script lower-back-pain --by "Name"` (locks the script hash; any later edit blocks export)
5. `npm run voice:generate -- --slug lower-back-pain` → listen → `npm run approve -- pronunciation lower-back-pain --by "Name"`
6. `npm run produce -- --slug lower-back-pain --format reel --final` (also `--format tv`)

Without `--final` you get a silent watermarked preview. The narration drives scene timing; `ttsText` may only add diacritics
to `narration` (QC enforces equality), so approved text is never silently rewritten.

## New video
`npm run script:generate -- --topic "carpal tunnel syndrome" --slug carpal-tunnel` drafts `content/<slug>.json` (unapproved),
then follow the workflow above. A new anatomy topic needs its own model component (see `src/components/Medical3D`).

## Review sources (verify before sign-off)
See `sources` in `content/lower-back-pain.json`. Automated checks and the model's own read are not a substitute for a clinician and a native Arabic reader.


## V2 — FMC presenter, new audio (what is real and what is not)
Presenter rig (`src/components/Presenter`, assets from `assets/character/fmc-presenter-reference.png`):
- **Real, audio-driven animation:** the mouth is redrawn every frame from the narration (`scripts/char/visemes.py`: loudness drives jaw opening,
  spectrum modulates width, fricatives show teeth, pauses close), plus blinking, head sway/nod and breathing. The original mouth is inpainted
  away (`npm run char:prep`) and replaced by the live mouth.
- **Not generative video:** no body gestures are synthesised. "Pain location" uses the matted pose from the reference sheet (hands on lower back,
  pain glow) with idle sway and a pulsing ring — a pose, not an animated gesture. Pointing to shoulder/knee/wrist, walking, or arm movement
  is **not available** with this rig. The reference sheet is low-resolution (face ≈ 180 px), so the presenter is soft at full-screen size.
- **Technology needed for full-body, photoreal-quality talking + gesturing:** an audio-driven avatar/video model fed with our approved Arabic audio
  (e.g. Kling/OmniHuman/Hedra-class services or Wan-S2V on a GPU), or a rigged 3D/Live2D version of the character. In this environment Higgsfield had
  0 credits, Gemini image/Veo were quota-blocked on the free key, and there is no GPU. Veo cannot take our narration audio as input.
Audio V2: `npm run audio:pads` (original sustained pads, no piano/rhythm) → `tsx scripts/mix-audio.ts --music assets/audio/music/fmc-ambient-pads.wav --music-lufs -34 --no-sfx`.
The picture render never carries status text; review status lives in `output/V2/FMC_V2_QC_Report.md`.


## V5 — original 3D human doctor (procedural rig) — `src/components/Doctor`
- `skeleton.ts` — dimensions, two-bone IK (arms in torso space, legs in hip space), hand shapes, face parameters.
- `Doctor.tsx` — the character: stylised 3D human built from primitives/shells (head with masked hair + beard, eyes with eyelids, brows, lip-synced mouth with jaw,
  coat with the official logo plane, scrubs, stethoscope, 5-finger hands with curl/spread). No external model, no Agentoon asset or code.
- `engine.ts` — acting engine: clips with blend in/out; walking with world-planted feet (+ two-step settle), IK pointing, look-at (head leads, eyes follow),
  blinking, breathing, speech nod; action library `A.idle/walk/wave/jump/pointToLowerBack/pointToShoulder/pointToKnee/pointToWrist/pointAtAnatomy/explain/
  presentMedicalModel/think/react/lookAtCamera/lookAtAnatomy/celebrate/exitScene/attention/progressSteps`.
- `lowerBackScript.ts` — the lower-back performance: gestures are timed from the narration (phrases split by punctuation, proportional to character count).
- `src/templates/DoctorExplainer.tsx` — one continuous 3D stage (doctor + hologram spine + camera path) with real Arabic text layers on top.
- Commands: `npm run render:v5` (picture), `npm run audio:mix:v5` (music/stems/final), `npm run anim:qc` (foot sliding / joint-snap check).
Limits: stylised procedural character (not a sculpted film asset); lip sync is amplitude/spectrum driven; gesture timing is proportional, not word-aligned.
The Agentoon.ai kit (robot.js etc.) was not available in this environment, so none of its code or architecture was used or studied.


## Permanent quality rules (read first)
See `docs/FMC_PRODUCTION_STANDARDS.md`, `CLAUDE.md` and `FMC_FUTURE_VIDEO_IMPROVEMENTS.md`. Audio is narration + one soft music bed only (policy enforced in `src/lib/audioPolicy.tsx`);
run `npm run qc:all` (plus `audio:qc` / `standards:qc` with `--video`) before any export.
