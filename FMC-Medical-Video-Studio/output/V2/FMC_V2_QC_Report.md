# FMC_Lower_Back_Pain_V2 — Quality-control report (internal)

**Review status: NOT APPROVED FOR PUBLICATION.** Human sign-offs still missing: native Arabic reader review, medical review, pronunciation approval after listening.
(The voice provider and script lock were recorded "by instruction" in chat; no one has certified the Arabic yet.) No status text is burned into the picture, by request.

## Output
- `FMC_Lower_Back_Pain_V2.mp4` — 1080×1920, H.264 + AAC 48 kHz, 30 fps, 80.55 s (tag: review pending).
- The script is unchanged: script hash `e3578fed0067…` (same as the approved/locked text). Narration = Google Gemini TTS (`gemini-3.8-flash-tts`, voice Charon).
- Duration is 80 s, longer than the 60 s template: the narration drives timing and was not edited.

## Checks performed
| Check | Result |
|---|---|
| Arabic automated QC (spelling patterns, clinic name, services, punctuation, claims, TTS = narration + diacritics only) | 0 errors, 0 warnings |
| Clinic name `مركز الفيصل الطبي` in narration/on screen/closing | exact |
| Services promoted | العلاج الطبيعي، طب العظام only |
| On-screen Arabic: real text layers, RTL shaping, no clipping | inspected one frame per scene (`qc-contact-sheet.png`): correct shaping, no clipped text |
| On-screen text equals approved script | text is rendered from the same JSON; no Arabic is generated inside images |
| Narration intelligibility (Gemini transcription of the TTS audio, per scene and on the final mix) | 0 character differences from the approved text (machine check, not a listening review) |
| Pronunciation / diacritics / accent | **NOT verified by a human** — must listen |
| Red banner / draft labels in picture | none |
| Official logo | top-right on every scene except closing; large in closing; on the character's coat (from the supplied art). File used unmodified on a white plate |
| Video technical | 1080×1920, h264, 30 fps, AAC; no black segments |
| Audio | -16.1 LUFS, true peak -1.0 dBFS, no clipping, no SFX, music -37.5 LUFS under speech (see audio-comparison) |
| Picture unchanged by the audio stage | video stream byte-identical to the render (md5 match) |

## Presenter animation — what is real
- Real, rendered, audio-driven: mouth movement (redrawn each frame from the narration), blinking, head sway/nod, breathing. In the rendered video the visible mouth-opening follows the viseme curve (r = 0.78 in the opening scene); the curve follows the speech loudness (r ≈ 0.7 on the long scenes, ≈ 0.5 on the two 4-second scenes).
- It is **amplitude/spectrum lip sync, not phoneme-accurate**, and a 2D puppet on a low-resolution source image: it will look soft at full-screen size and the mouth range is limited.
- **No gesture animation.** "Pain location" is the pose from the reference sheet (hands on lower back, pain glow) with idle sway and a pulsing ring. The character does not point, walk or move his arms.
- Character identity is the supplied art; nothing was regenerated. He is a fictional presenter, not a licensed doctor.
- Needed for real body animation + higher resolution: an audio-driven avatar/video service or GPU model (e.g. Kling / OmniHuman / Hedra class, Wan-S2V), or a rigged 3D/Live2D character. Not available in this environment (Higgsfield 0 credits; Gemini image/Veo quota-blocked on the free key; no GPU).

## Other known limitations
- Treatment scene uses the 3D rehabilitation animation: Pexels is unreachable from this environment, so no stock footage was used.
- 3D spine is a simplified educational model (labelled on screen), not a verified anatomical dataset.
- FMC scene leaves empty space in the lower part of the frame; TV (16:9) layout was not re-rendered for V2.
- Music is synthesised (original) rather than a licensed recording.
