# FMC audio QC

- Policy: {"transitionSfxEnabled":false,"characterSfxEnabled":false,"interfaceSfxEnabled":false,"cameraMovementSfxEnabled":false,"anatomyAnimationSfxEnabled":false,"automaticWhooshesEnabled":false,"backgroundMusicEnabled":true,"narrationEnabled":true,"backgroundMusicStyle":"ultra-soft-medical-ambient","footageAudioEnabled":false}
- Result: **PASS (automated checks only)** — 0 error(s), 0 warning(s)

## Audio sources found in code
- src/components/FMCCinematicTransition.tsx:27 video element (muted via policy)
- src/compositions/CharacterPreview.tsx: 1 <NarrationAudio> (narration)
- src/compositions/KneeAlignmentEpisode.tsx: 1 <NarrationAudio> (narration)
- src/compositions/SciaticaEpisode.tsx: 2 <NarrationAudio> (narration)
- src/compositions/SciaticaOverlayStudy.tsx:9 video element (muted via policy)
- src/compositions/SpineEarlyDetection.tsx: 1 <NarrationAudio> (narration)
- src/lib/audioPolicy.tsx: 1 <NarrationAudio> (narration)
- src/scenes/TreatmentScene/index.tsx:40 video element (muted via policy)
- src/templates/CarpalTunnelEpisode.tsx: 1 <NarrationAudio> (narration)
- src/templates/DoctorExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/MedicalExplainer.tsx: 1 <NarrationAudio> (narration)
- src/templates/SpineRealisticEpisode.tsx:38 video element (muted via policy)
- src/templates/SpineRealisticEpisode.tsx: 1 <NarrationAudio> (narration)

## Findings
- **INFO** [source] registered compositions: Reel → MedicalExplainer; TV → MedicalExplainer; DoctorReel → DoctorExplainer; CharacterPreview → CharacterPreview; CollageStudy → CollageStudy; WristStudy → WristStudy; CarpalReel → CarpalTunnelEpisode; SpineStudy → SpineStudy; SpineReel → SpineRealisticEpisode; SpineV2 → SpineEarlyDetection; LimbStudy → LimbStudy; KneeReel → KneeAlignmentEpisode; SciaticaOverlayStudy → SciaticaOverlayStudy; SciaticaPart1 → SciaticaPart1; SciaticaRelief → SciaticaRelief; PoseLab → PoseLab; LogoStudy → LogoStudy; DoctorPreview → DoctorPreview; AnatomyPreview → AnatomyPreview
- **INFO** [assets] audio assets: narration/other=73, music=4, sfx-optional=2, retired=2
- **INFO** [stems] sound_effects stem is digital silence
- **INFO** [file] -16 LUFS, -2.9 dBTP, 0 clipped samples, 98 bright onsets of which 98 are inside narration (normal speech consonants, ignored) and 0 outside
- **INFO** [music] assets/audio/music/fmc-ambient-pads-v6.wav: -14.3 LUFS, crest 13.1 dB, 2.1 sudden onsets/min

## Rendered file
- output/SciaticaRelief/mixed.mp4
- Seams (s): 12.17, 28.83, 37.50, 65.93, 75.00, 93.33
- Non-speech transient candidates: none
- 12.2 s: peak -27.7 dBFS (10 ms RMS) in the ±1 s around the seam
- 28.8 s: peak -27.6 dBFS (10 ms RMS) in the ±1 s around the seam
- 37.5 s: peak -26.5 dBFS (10 ms RMS) in the ±1 s around the seam
- 65.9 s: peak -14.0 dBFS (10 ms RMS) in the ±1 s around the seam
- 75.0 s: peak -15.0 dBFS (10 ms RMS) in the ±1 s around the seam
- 93.3 s: peak -17.2 dBFS (10 ms RMS) in the ±1 s around the seam

_Limits: automated analysis flags suspicious sounds; it does not identify their source and cannot judge listening comfort, pronunciation or taste._

---
## Notes (author)
- Only narration (Gemini TTS, Charon) + the FMC pad bed; the stock clip is muted at source; the graphics contain no audio. Final −16.0 LUFS, true peak −2.9 dBTP, 0 clipped samples; narration −16.0, music −35.5 LUFS, effects stem silent. 101.9 s, 1080×1920, 30 fps.
- A later `audio:qc --video` run flagged 22 "non-speech transients" (4.7 s … 101 s). That mode does not know this episode's narration timeline. I checked the stems at the flagged instants: the narration track peaks at −2…−5 dBFS (speech consonants) while the music stem is −20…−33 dBFS, so they are voice, not effects (the mix-time check, which uses the real timeline, reports 98 onsets all inside narration and none outside). Listening confirmation still needed.
- Not verified: listening comfort, pronunciation (ASR skipped).
