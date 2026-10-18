# FMC_Lower_Back_Pain_V5 — Quality-control report (internal)

**Review status: NOT APPROVED FOR PUBLICATION.** Still missing: native Arabic reader review, medical review, and human pronunciation approval after listening.
No status text is burned into the picture (red banner removed, nothing replaced it).

## What was built (and what was not)
- **Reference project:** the Agentoon.ai kit (`robot.js`, camera/audio kit, HyperFrames engine) was **not accessible** in this environment (searched the container and the four GitHub repos).
  Nothing from it was inspected, copied or reused. The rig below is **original code** that implements the requested action list; it is not Agentoon's architecture.
- **Character:** original procedural 3D human doctor (`src/components/Doctor`): skeleton hierarchy, two-bone IK arms/legs, 5-finger hands with curl/spread, eyes + eyelids, brows,
  lip-synced mouth with jaw, masked hair/beard, coat with the **unmodified official logo** on the left chest, scrubs, stethoscope. No previous doctor images and no robot.
- **Animation (real, rendered):** world-planted foot walk-in + two-step settle, turn, wave, hand-on-lower-back with red pain highlight on the coat, IK pointing at vertebrae / discs / nerves / L4–L5,
  point-to-knee, explain, present-model (palm toward the spine, which flexes), posture correction, progress "steps", attention gesture, small hop, closing wave, blinking, breathing, head+eye look-at, speech nod.
  Action library: idle, walk, wave, jump, pointLeft/pointRight (pointAtAnatomy), pointToLowerBack, pointToShoulder, pointToKnee, pointToWrist, explain, think, react, lookAtCamera, lookAtAnatomy,
  presentMedicalModel, celebrate, exitScene — all implemented in `engine.ts`; not every one is used in this video (think, pointToShoulder, pointToWrist, celebrate, exitScene are implemented but unused).
- **Not film quality:** stylised primitives, no cloth simulation, no facial wrinkles/soft-body, simple hands. Soft/flat lighting. It reads as a stylised 3D character, not a Pixar-grade asset.

## Objective checks
| Check | Result |
|---|---|
| Resolution / codec | 1080×1920, H.264, 30 fps, AAC 48 kHz stereo, 80.5 s |
| Black frames / silence >1 s | none / none |
| Red banner / draft text in picture | none (contact sheet inspected) |
| Foot sliding while walking (grounded ankle speed) | mean 0.086 cm/frame, 5 touch-down frames >1 cm/frame (root moves ≈1.5 cm/frame) |
| Foot sliding after the walk | max 0 cm/frame, 0 frames over 1 cm |
| Joint snaps (>0.45 rad/frame) | 0 |
| Lip sync | mouth driven per frame from the narration (amplitude/spectrum), not phoneme-accurate |
| Gesture timing | gestures are timed to narration phrases split at punctuation and proportioned by character count; not word-aligned |

## Audio (no transition sound effects)
- Stems exported: `stems/narration.wav`, `stems/music.wav`, `stems/sound_effects.wav` (digital silence), `stems/final_mix.wav` (+ `.mp3`).
- SFX triggers audit: the only SFX path in the project was the optional air-swell layer in `scripts/mix-audio.ts` (enabled by default in V1/V2 builds); it is disabled here with `--no-sfx`. The Remotion render carries narration only (`music`/`sfx` props are null). No whoosh, beep, jump or movement sounds exist anywhere in V5.
- Music: original soft pads (no piano, no percussion, no melody), one continuous track, 2 s fade-in / 3 s fade-out, sidechain-ducked under narration.
- Levels: final -16.1 LUFS, true peak -0.9 dBFS; narration stem -16.0 LUFS (peak -1.0 dBFS); music stem -37.1 LUFS (peak -21.5 dBFS). Music is ≈ 21 LU below narration.
- Pronunciation: automatic transcription of the TTS audio matched the approved text, but **no human has listened**; pronunciation is NOT verified.

## Arabic
- Script unchanged from the locked text (hash `e3578fed0067…`); automated Arabic QC: 0 errors.
- All Arabic on screen is real RTL text layers (no Arabic inside images). Official name and slogan unchanged.

## Known visual limitations
- During close-ups on the spine the presenter's head is cropped on purpose; in a few frames the Arabic cards overlap his lower body/hands.
- The 15-second test is the first 15 s of V5: walk-in 0–2.8 s, wave ≈3–4.5 s, hand on lower back ≈5–10 s (the brief asked 4–8 s), spine appears ≈8 s, pointing + camera approach from ≈10 s.
- The spine is a simplified educational 3D model (labelled on screen), not a patient-specific/CT anatomy dataset.
- TV (16:9) layout was not built for the V5 template.
- Pexels is unreachable here, so no stock rehabilitation footage was used; the treatment scene uses the spine flexion demonstration with the presenter.
