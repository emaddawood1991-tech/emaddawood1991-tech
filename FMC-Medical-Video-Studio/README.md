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
