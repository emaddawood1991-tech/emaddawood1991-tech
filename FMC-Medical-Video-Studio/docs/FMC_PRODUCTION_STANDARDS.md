# FMC Production Standards (permanent)

Applies to every FMC video. Machine-enforced parts are marked **[auto]**; the rest need a person.

## 1. Audio — narration + one soft music bed. Nothing else.
- Policy: `src/lib/audioPolicy.tsx` (`FMC_AUDIO_POLICY`). All transition / character / interface / camera / anatomy / automatic-whoosh effects are **off**. **[auto]**
- Compositions may emit audio only through `<NarrationAudio>`. Raw `<Audio>`, un-muted video and direct audio `staticFile()` are build errors in `npm run audio:qc`. **[auto]**
- Music is mixed in post (`scripts/mix-audio.ts`), never inside the Remotion render; `enforceRenderProps()` nulls `music`/`sfx` before every render. **[auto]**
- Effects need BOTH the policy flag turned on AND `--sfx-approval <id>` from the user. Default `mix-audio` refuses. **[auto]**
- Stock footage is muted (`footageMuted()`); embedded audio streams are reported by `audio:qc`. **[auto]**
- Music: warm ambient pads, sustained, no piano/percussion/bass/melody/vocals, one continuous bed, −34 LUFS before ducking, sidechain ducking, 2 s fade-in / 3 s fade-out. Voice, music, effects are separate stems (`--stems`). Generator: `npm run audio:pads`.
- Final: −16 LUFS ±1.5, true peak ≤ −1.5 dBTP, no clipping. `mix-audio` runs `audio:qc` automatically and writes `<out>.audio-qc.md`. **[auto]**
- Retired assets live in `assets/audio/_retired/` (whoosh, piano). `assets/audio/sfx/` must not exist. **[auto]**
- Software cannot judge listening comfort. A human listens to the whole video, with attention at every scene seam.

## 2. Character — one presenter
Spec in `src/lib/fmcStandards.ts → CHARACTER_SPEC`: male, ~30–35, clean-shaven, short neat hair, friendly eyes, white coat, navy scrubs, official logo on coat, not a robot.
- Static check: no facial-hair identifiers in `Doctor.tsx`; coat logo is the official file. **[auto]**
- Animation QC: `npm run anim:qc` (foot sliding, joint snaps). **[auto]**
- Gestures must carry meaning (pain = turn + hand on lumbar region). Never repeat one gesture back-to-back. **[manual review]**

## 3. Framing
Presets in `src/components/Doctor/cameraPresets.ts` with standards (`SHOT_STANDARDS`): full body 40–55 % of frame height, beside-anatomy 35–45 %, waist-up shots ≤ 2.4 m visible, anatomy focus ≤ 2.0 m. `npm run standards:qc` computes the real numbers from camera geometry and fails drift. **[auto]**
Hands/limbs leaving frame and cards covering the torso need frame review (heuristics in `standards:qc --video`).

## 4. Scene types (pick what the narration needs; do not force all)
A Human introduction · B Pain demonstration · C Anatomical explanation (full-screen 3D) · D Interactive explanation · E Real-world treatment (licensed footage or demonstrated exercise) · F Professional closing.
Declare `sceneType` on each scene in `content/<slug>.json`; `standards:qc` flags >2 consecutive same type, <3 distinct types, any scene >22 s. **[auto once declared]**

## 5. 3D anatomy
Anatomy is the main subject in anatomical scenes (use ANAT / L45 presets). Only verified models; the procedural lumbar spine is a simplified educational model and says so on screen. Highlight only the structure being discussed; no distortion/glow. **[manual: clinician review]**

## 6. Arabic typography
- MSA, fully real text layers (never AI-generated images of text), RTL, one font family (`FMC Arabic` / IBM Plex Sans Arabic).
- Minimum sizes: title 64 px, card 40 px, callout 38 px. ≤ 3 cards, ≤ 6 words per card (hard max 9), titles ≤ 6 words. **[auto]**
- Safe zone (1080×1920): top 270, bottom 420, sides 72/120 — Instagram UI covers top ≈14 %, bottom ≈22 %, right rail. Keep essential text out of it; `standards:qc --video` flags bright content in the bottom zone. **[heuristic]**
- Existing `arabic:check` (grammar patterns, brand spelling, services, claims) + human Arabic review + clinician review are still mandatory.

## 7. Branding
- Official logo only: `assets/logo/fmc-original-logo.png` (sha256 pinned in `fmcStandards.ts`; any other logo asset or edit = error). **[auto]**
- Corner: `LogoBug` → `LogoMark variant="seal"` (soft glass seal) on dark scenes, `variant="bare"` on light scenes. Never the square white sticker. Closing: logo prominent, uncluttered.
- No production-status banner, progress bar or "preview/draft" text on screen — status goes to the QC report. **[auto for MedicalExplainer banner]**

## 8. Pacing
Problem within 3 s; affected region early; anatomy visual; short Arabic lines; clinical care; concise FMC close. Narration length drives scene timing. A scene change is not a reason for a sound.

## 9. Technical file
1080×1920, 30 fps, h264 **yuv420p**, AAC. `remotion.config.ts` sets `yuv420p` (previous renders were `yuvj420p`). **[auto]**

## Pre-export checklist
`npm run qc:all` → fix ERRORs → human: watch full video, listen full audio, native-Arabic review, clinician review → `npm run approve …`.
